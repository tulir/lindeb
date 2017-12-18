package db

import (
	"maunium.net/go/lindeb/util"
)

// AuthToken represents the authentication token of a specific login.
type AuthToken struct {
	DB *DB

	User  *User
	Token string
}

// GenerateAuthToken generates an auth token and inserts it into the database.
func (user *User) GenerateAuthToken() *AuthToken {
	token := &AuthToken{
		DB:    user.DB,
		User:  user,
		Token: util.RandomString(64),
	}
	token.Insert()
	return token
}

// DeleteAllTokens deletes all auth tokens associated with this user.
func (user *User) DeleteAllTokens() (err error) {
	_, err = user.DB.Exec("DELETE FROM AuthToken WHERE user=?", user.ID)
	return
}

// GetToken gets the metadata associated with the given auth token.
func (user *User) GetToken(token string) *AuthToken {
	row := user.DB.QueryRow("SELECT token FROM AuthToken WHERE token=SHA2(?, 256) AND user=?", token, user.ID)
	if row == nil {
		return nil
	}

	var hashedToken string
	row.Scan(&hashedToken)
	if len(hashedToken) == 0 {
		return nil
	}

	return &AuthToken{
		DB:    user.DB,
		User:  user,
		Token: token,
	}
}

// CheckToken checks if the given token is valid.
func (user *User) CheckToken(token string) bool {
	tokenObj := user.GetToken(token)
	if tokenObj == nil {
		return false
	}
	user.TokenUsed = tokenObj
	return true
}

// Delete invalidates this auth token.
func (at *AuthToken) Delete() (err error) {
	_, err = at.DB.Exec("DELETE FROM AuthToken WHERE token=SHA2(?, 256) AND user=?", at.Token, at.User.ID)
	return
}

// Insert inserts this auth token into the database.
func (at *AuthToken) Insert() (err error) {
	_, err = at.DB.Exec("INSERT INTO AuthToken (user, token) VALUES (?, SHA2(?, 256))", at.User.ID, at.Token)
	return
}
