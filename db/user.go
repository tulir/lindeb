package db

import (
	"errors"

	"golang.org/x/crypto/bcrypt"
)

type User struct {
	DB           *DB     `json:"-"`
	ID           integer `json:"id"`
	Username     string  `json:"username"`
	PasswordHash []byte  `json:"-"`
}

// TryGetUser tries to get the user with the given ID.
// If the user is not found, nil is returned along with an error that may explain the problem.
func (db *DB) TryGetUser(id int) (*User, error) {
	userRow := db.QueryRow("SELECT * FROM User WHERE id=?", id)
	if userRow == nil {
		return nil, errors.New("user not found")
	}
	var scanID int
	var username, passwordHash string
	err := userRow.Scan(&scanID, &username, &passwordHash)
	if err != nil {
		return nil, err
	} else if scanID != id {
		return nil, errors.New("database row scan failed: query ID does not match scanned ID")
	}
	return &User{
		ID:           scanID,
		Username:     username,
		PasswordHash: []byte(passwordHash),
	}, nil
}

// GetUser gets the user with the given ID.
// If the user is not found, this just returns nil.
func (db DB) GetUser(id int) (user *User) {
	user, _ = db.TryGetUser(id)
	return
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
func (user *User) Update() error {
	_, err := user.DB.Exec(
		"UPDATE User SET username=?,password=? WHERE id=?",
		user.Username, string(user.PasswordHash), user.ID)
	return err
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
	user.ID, err = result.LastInsertId()
	return err
}
