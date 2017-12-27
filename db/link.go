// lindeb - mau\Lu Link Database
// Copyright (C) 2017 Maunium / Tulir Asokan
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

package db

import (
	"database/sql"
	"net/url"
	"strconv"
	"strings"
	"time"
)

// Link represents a single link saved by a specific user.
type Link struct {
	DB    *DB
	Owner *User

	ID          int
	Title       string
	Description string
	Timestamp   int64
	URL         *url.URL
	Tags        []string
}

// BlankLink creates a blank link.
func (user *User) BlankLink() *Link {
	return &Link{
		DB:    user.DB,
		Owner: user,
	}
}

// scanLink scans a database row into a Link object.
func (user *User) scanLink(row Scannable) (*Link, error) {
	var id, ownerID int
	var timestamp int64
	var urlString, domain, title, description, tagsString string
	err := row.Scan(&id, &urlString, &domain, &title, &description, &timestamp, &ownerID, &tagsString)
	if err != nil {
		return nil, err
	}
	parsedURL, err := url.Parse(urlString)
	if err != nil {
		return nil, err
	}
	var tags []string
	if len(tagsString) > 0 {
		tags = strings.Split(tagsString, ",")
	}
	return &Link{
		DB:    user.DB,
		Owner: user,

		ID:          id,
		Title:       title,
		Description: description,
		Timestamp:   timestamp,
		URL:         parsedURL,
		Tags:        tags,
	}, nil
}

// scanLinks scans multiple database rows into an array of Links.
func (user *User) scanLinks(rows *sql.Rows) ([]*Link, error) {
	var links []*Link
	for rows.Next() {
		link, err := user.scanLink(rows)
		if err != nil {
			return links, err
		}
		links = append(links, link)
	}
	return links, nil
}

// GetLink tries to find a link from the database, and returns nil if something goes wrong.
func (user *User) GetLink(id int) (link *Link) {
	linkRow := user.DB.QueryRow(`SELECT Link.*, IFNULL(GROUP_CONCAT(Tag.name), "") AS tags FROM Link
		LEFT JOIN LinkTag ON LinkTag.link = Link.id
		LEFT JOIN Tag ON LinkTag.tag = Tag.id
		WHERE Link.id=? AND Link.owner=?
		GROUP BY Link.id`, id, user.ID)
	if linkRow != nil {
		link, _ = user.scanLink(linkRow)
	}
	return
}

// GetLinks gets all the links owned by this user.
func (user *User) GetLinks() ([]*Link, error) {
	results, err := user.DB.Query(`SELECT Link.*, IFNULL(GROUP_CONCAT(Tag.name), "") AS tags FROM Link
		LEFT JOIN LinkTag ON LinkTag.link = Link.id
		LEFT JOIN Tag ON LinkTag.tag = Tag.id
		WHERE Link.owner = ?
		GROUP BY Link.id`, user.ID)
	if err != nil {
		return nil, err
	}
	return user.scanLinks(results)
}

// UpdateTags updates the tags of this link both in the database and in memory.
func (link *Link) UpdateTags(tags []string) error {
	tagObjs, err := link.Owner.GetTagsByName(tags)
	if err != nil {
		return err
	}

	// If there are any unknown tags, add them to the database.
	if len(tagObjs) != len(tags) {
	TagNames:
		for _, tag := range tags {
			for _, tagObj := range tagObjs {
				if tagObj.Name == tag {
					continue TagNames
				}
			}

			tagObj := link.Owner.BlankTag()
			tagObj.Name = tag
			tagObj.Insert()
			tagObjs = append(tagObjs, tagObj)
		}
	}

	// To make sure that there are no old tags, we just delete everything and re-add the requested tags.
	_, err = link.DB.Exec("DELETE FROM LinkTag WHERE link=?", link.ID)
	if err != nil {
		return err
	}

	if len(tagObjs) > 0 {
		stmt, _ := link.DB.Prepare("INSERT INTO LinkTag (link, tag) VALUES (?, ?)")
		for _, tag := range tagObjs {
			stmt.Exec(link.ID, tag.ID)
		}

		err = stmt.Close()
		if err != nil {
			return err
		}
	}
	link.Tags = tags
	return nil
}

func (link *Link) IDString() string {
	return strconv.Itoa(link.ID)
}

func (link *Link) Matches(domains []string, tags []string, exclusiveTags bool) bool {
	tagsMatched := len(tags) == 0
	if exclusiveTags {
		if link.HasTags(tags) {
			tagsMatched = true
		}
	} else {
		for _, tag := range tags {
			if link.HasTag(tag) {
				tagsMatched = true
				break
			}
		}
	}

	domainMatched := len(domains) == 0
	domain := link.URL.Hostname()
	for _, domainToMatch := range domains {
		if domain == domainToMatch {
			domainMatched = true
			break
		}
	}

	return tagsMatched && domainMatched
}

func (link *Link) HasTag(tagToCheck string) bool {
	for _, tag := range link.Tags {
		if tagToCheck == tag {
			return true
		}
	}
	return false
}

func (link *Link) HasTags(tagsToCheck []string) bool {
	tagsToCheck = append([]string(nil), tagsToCheck...)
Outer:
	for _, tag := range link.Tags {
		if len(tagsToCheck) == 0 {
			return true
		}
		for index, tagToCheck := range tagsToCheck {
			if tag == tagToCheck {
				tagsToCheck[index] = tagsToCheck[len(tagsToCheck)-1]
				tagsToCheck = tagsToCheck[:len(tagsToCheck)-1]
				continue Outer
			}
		}
	}
	return len(tagsToCheck) == 0
}

// Update touches the timestamp of this link and updates the data of this link in the database.
func (link *Link) Update() (err error) {
	link.Timestamp = time.Now().Unix()
	_, err = link.DB.Exec(
		"UPDATE Link SET url=?,domain=?,title=?,description=?,timestamp=? WHERE id=? AND owner=?",
		link.URL.String(), link.URL.Hostname(), link.Title, link.Description, link.Timestamp, link.ID, link.Owner.ID)
	return
}

// Insert touches the timestamp of this link,
// stores the data of this link into the database
// and fills in the ID field of the struct with the ID of the inserted row.
func (link *Link) Insert() error {
	link.Timestamp = time.Now().Unix()
	result, err := link.DB.Exec(
		"INSERT INTO Link (url, domain, title, description, timestamp, owner) VALUES (?, ?, ?, ?, ?, ?)",
		link.URL.String(), link.URL.Hostname(), link.Title, link.Description, link.Timestamp, link.Owner.ID)
	if err != nil {
		return err
	}
	id, err := result.LastInsertId()
	if err != nil {
		return err
	}
	link.ID = int(id)
	return nil
}

// Delete deletes this Link from the database.
func (link *Link) Delete() (err error) {
	_, err = link.DB.Exec("DELETE FROM Link WHERE owner=? AND id=?", link.Owner.ID, link.ID)
	return
}
