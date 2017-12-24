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
	"fmt"
	"strings"
)

type Tag struct {
	DB    *DB   `json:"-"`
	Owner *User `json:"-"`

	ID          int    `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
}

// BlankTag creates a blank tag.
func (user *User) BlankTag() *Tag {
	return &Tag{
		DB:    user.DB,
		Owner: user,
	}
}

// scanTag scans a database row into a Tag object.
func (user *User) scanTag(row Scannable) (*Tag, error) {
	var id, ownerID int
	var name, description string
	err := row.Scan(&id, &name, &description, &ownerID)
	if err != nil {
		return nil, err
	}
	return &Tag{
		DB:    user.DB,
		Owner: user,

		ID:          id,
		Name:        name,
		Description: description,
	}, nil
}

// scanTags scans multiple database rows into an array of Tags.
func (user *User) scanTags(rows *sql.Rows) ([]*Tag, error) {
	var tags []*Tag
	for rows.Next() {
		tag, err := user.scanTag(rows)
		if err != nil {
			return tags, err
		}
		tags = append(tags, tag)
	}
	return tags, nil
}

// GetTag tries to find a tag from the database, and returns nil if something goes wrong.
func (user *User) GetTag(id int) (tag *Tag) {
	tagRow := user.DB.QueryRow("SELECT * FROM Tag WHERE id=? AND owner=?", id, user.ID)
	if tagRow != nil {
		tag, _ = user.scanTag(tagRow)
	}
	return
}

// GetTagByName tries to find a tag from the database by its name, and returns nil if something goes wrong.
func (user *User) GetTagByName(name string) (tag *Tag) {
	tagRow := user.DB.QueryRow("SELECT * FROM Tag WHERE name=? AND owner=?", name, user.ID)
	if tagRow != nil {
		tag, _ = user.scanTag(tagRow)
	}
	return
}

func (user *User) GetTagsByName(names []string) ([]*Tag, error) {
	if len(names) == 0 {
		return nil, nil
	}
	args := []interface{}{user.ID}
	for _, name := range names {
		args = append(args, name)
	}

	results, err := user.DB.Query(
		fmt.Sprintf("SELECT * FROM Tag WHERE owner=? AND name IN (? %s)",
			strings.Repeat(",?", len(names)-1)),
		args...)
	if err != nil {
		return nil, err
	}
	return user.scanTags(results)
}

// GetTags gets all the links owned by this user.
func (user *User) GetTags() ([]*Tag, error) {
	results, err := user.DB.Query("SELECT * FROM Tag WHERE owner=?", user.ID)
	if err != nil {
		return nil, err
	}
	return user.scanTags(results)
}

// Update updates the data of this tag in the database.
func (tag *Tag) Update() (err error) {
	_, err = tag.DB.Exec(
		"UPDATE Tag SET name=?,description=? WHERE id=? AND owner=?",
		tag.Name, tag.Description, tag.ID, tag.Owner.ID)
	return
}

// Insert stores the data of this tag into the database and fills in the ID field of the struct with the ID of the
// inserted row.
func (tag *Tag) Insert() error {
	result, err := tag.DB.Exec(
		"INSERT INTO Tag (name, description, owner) VALUES (?, ?, ?)",
		tag.Name, tag.Description, tag.Owner.ID)
	if err != nil {
		return err
	}
	id, err := result.LastInsertId()
	if err != nil {
		return err
	}
	tag.ID = int(id)
	return nil
}

func (tag *Tag) GetTaggedLinks() ([]*Link, error) {
	results, err := tag.DB.Query(`SELECT Link.*, IFNULL(GROUP_CONCAT(AllTags.name), "") AS tags FROM Tag
		LEFT JOIN LinkTag ON LinkTag.tag = Tag.id
		LEFT JOIN Link ON LinkTag.link = Link.id
		LEFT JOIN LinkTag AllLinkTags ON AllLinkTags.link = Link.id
		LEFT JOIN Tag AllTags ON AllLinkTags.tag = AllTags.id
		WHERE Tag.owner=? AND Tag.id=?
		GROUP BY Link.id`, tag.Owner.ID, tag.ID)
	if err != nil {
		return nil, err
	}
	return tag.Owner.scanLinks(results)
}

// Delete deletes this Tag from the database.
func (tag *Tag) Delete() (err error) {
	_, err = tag.DB.Exec("DELETE FROM Tag WHERE Tag.owner=? AND Tag.id=?", tag.Owner.ID, tag.ID)
	return
}
