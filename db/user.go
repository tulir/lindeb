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
	"strconv"

	"golang.org/x/crypto/bcrypt"
)

// User represents a single registered user in the database.
type User struct {
	DB *DB

	ID           int
	Username     string
	TokenUsed    *AuthToken
	PasswordHash []byte
}

func (db *DB) scanUser(row Scannable) (*User, error) {
	var scanID int
	var username, passwordHash string
	err := row.Scan(&scanID, &username, &passwordHash)
	if err != nil {
		return nil, err
	}
	return &User{
		DB:           db,
		ID:           scanID,
		Username:     username,
		PasswordHash: []byte(passwordHash),
	}, nil
}

// GetUserByName gets the user with the given username. If the user is not found, nil is returned.
func (db *DB) GetUserByName(name string) (user *User) {
	userRow := db.QueryRow("SELECT * FROM User WHERE username=?", name)
	if userRow != nil {
		user, _ = db.scanUser(userRow)
	}
	return
}

// GetUser gets the user with the given ID. If the user is not found, nil is returned.
func (db *DB) GetUser(id int) (user *User) {
	userRow := db.QueryRow("SELECT * FROM User WHERE id=?", id)
	if userRow != nil {
		user, _ = db.scanUser(userRow)
	}
	return
}

func (user *User) IDString() string {
	return strconv.Itoa(user.ID)
}

// NewUser creates a new user with the given username and password, then inserts the user into the database.
func (db *DB) NewUser(username string, password string) *User {
	user := &User{DB: db, Username: username}
	user.SetPassword(password)
	user.Insert()
	return user
}

// CheckPassword checks whether or not the given password matches the stored password.
func (user *User) CheckPassword(password string) bool {
	err := bcrypt.CompareHashAndPassword(user.PasswordHash, []byte(password))
	return err == nil
}

// SetPassword changes the password of this user to the given password.
func (user *User) SetPassword(password string) error {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	user.PasswordHash = hash
	return nil
}

// Update updates the username and password of this user in the database.
func (user *User) Update() (err error) {
	_, err = user.DB.Exec(
		"UPDATE User SET username=?,password=? WHERE id=?",
		user.Username, string(user.PasswordHash), user.ID)
	return
}

// Insert stores the username and password of this user into the database and
// fills in the ID field of the struct with the ID of the inserted row.
func (user *User) Insert() error {
	result, err := user.DB.Exec(
		"INSERT INTO User (username, password) VALUES (?, ?)",
		user.Username, string(user.PasswordHash))
	if err != nil {
		return err
	}
	id, err := result.LastInsertId()
	if err != nil {
		return err
	}
	user.ID = int(id)
	return nil
}
