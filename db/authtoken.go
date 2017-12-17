package db

import (
	"crypto/rand"
	"time"
)

// AuthToken
type AuthToken struct {
	DB    *DB
	User  *User
	Token string
}

// GenerateAuthToken generates an auth token, but does not insert it into the database.
func (user *User) GenerateAuthToken() *AuthToken {
	return &AuthToken{
		DB:    user.DB,
		User:  user,
		Token: RandomString(64),
	}
}

// DeleteAllTokens deletes all auth tokens associated with this user.
func (user *User) DeleteAllTokens() (err error) {
	_, err = user.DB.Exec("DELETE FROM AuthToken WHERE user=?", user.ID)
	return
}

// CheckToken checks if the given token is valid for this user.
func (user *User) CheckToken(token string) *AuthToken {
	row := user.DB.QueryRow("SELECT token FROM AuthToken WHERE token=SHA2(?, 256) AND user=?", token, user.ID)
	if row == nil {
		return nil
	}

	row.Scan(&token)
	if len(token) == 0 {
		return nil
	}

	return &AuthToken{
		DB:    user.DB,
		User:  user,
		Token: token,
	}
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

// Random string generator from https://stackoverflow.com/a/31832326/2120293
const letterBytes = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
const (
	letterIdxBits = 6                    // 6 bits to represent a letter index
	letterIdxMask = 1<<letterIdxBits - 1 // All 1-bits, as many as letterIdxBits
	letterIdxMax  = 63 / letterIdxBits   // # of letter indices fitting in 63 bits
)

var src = rand.NewSource(time.Now().UnixNano())

func RandomString(n int) string {
	b := make([]byte, n)
	for i, cache, remain := n-1, src.Int63(), letterIdxMax; i >= 0; {
		if remain == 0 {
			cache, remain = src.Int63(), letterIdxMax
		}
		if idx := int(cache & letterIdxMask); idx < len(letterBytes) {
			b[i] = letterBytes[idx]
			i--
		}
		cache >>= letterIdxBits
		remain--
	}

	return string(b)
}
