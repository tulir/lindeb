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
	"errors"
	"net/url"
	"time"

	"maunium.net/go/lindeb/util"
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
}

// BlankLink creates a blank link.
func (user *User) BlankLink() *Link {
	return &Link{
		DB:    user.DB,
		Owner: user,
	}
}

// scanLinks scans a database row into a Link object.
func (user *User) scanLink(row Scannable) (*Link, error) {
	var id int
	var timestamp int64
	var urlString, domain, revDomain, title, description string
	err := row.Scan(&id, &urlString, &domain, &revDomain, &title, &description, &timestamp)
	if err != nil {
		return nil, err
	}
	parsedURL, err := url.Parse(urlString)
	if err != nil {
		return nil, err
	}
	return &Link{
		DB:    user.DB,
		Owner: user,

		ID:          id,
		Title:       title,
		Description: description,
		Timestamp:   timestamp,
		URL:         parsedURL,
	}, nil
}

// scanLinks scans multiple database rows into an array of Links.
func (user *User) scanLinks(rows *sql.Rows, ignoreErrors bool) ([]*Link, error) {
	var links []*Link
	for rows.Next() {
		link, err := user.scanLink(rows)
		if err != nil {
			if ignoreErrors {
				continue
			}
			return links, err
		}
		links = append(links, link)
	}
	return links, nil
}

// TryGetLink tries to find a link from the database, and returns an error if something goes wrong.
func (user *User) TryGetLink(id int) (*Link, error) {
	linkRow := user.DB.QueryRow("SELECT * FROM Link WHERE id=? AND owner=?", id, user.ID)
	if linkRow == nil {
		return nil, errors.New("link not found")
	}
	return user.scanLink(linkRow)
}

// GetLink tries to find a link from the database, and returns nil if something goes wrong.
func (user *User) GetLink(id int) (link *Link) {
	link, _ = user.TryGetLink(id)
	return
}

// GetLinks gets all the links owned by this user.
func (user *User) GetLinks() ([]*Link, error) {
	results, err := user.DB.Query("SELECT * FROM Link WHERE owner=?", user.ID)
	if err != nil {
		return nil, err
	}
	return user.scanLinks(results, false)
}

// Update touches the timestamp of this link and updates the data of this link in the database.
func (link *Link) Update() (err error) {
	link.Timestamp = time.Now().Unix()
	domain := link.URL.Hostname()
	_, err = link.DB.Exec(
		"UPDATE Link SET url=?,domain=?,revDomain=?,title=?,description=?,timestamp=? WHERE id=? AND owner=?",
		link.URL.String(), domain, util.Reverse(domain), link.Title, link.Description, link.Timestamp, link.ID, link.Owner.ID)
	return
}

// Insert touches the timestamp of this link,
// stores the data of this link into the database
// and fills in the ID field of the struct with the ID of the inserted row.
func (link *Link) Insert() error {
	link.Timestamp = time.Now().Unix()
	domain := link.URL.Hostname()
	result, err := link.DB.Exec(
		"INSERT INTO Link (url, domain, revDomain, title, description, timestamp, owner) VALUES (?, ?, ?, ?, ?, ?, ?)",
		link.URL.String(), domain, util.Reverse(domain), link.Title, link.Description, link.Timestamp, link.Owner.ID)
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
