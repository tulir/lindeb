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

package api

import (
	"net/http"
	"regexp"
	"strconv"
	"strings"

	"context"

	"maunium.net/go/lindeb/db"
)

type apiUser struct {
	ID        int    `json:"id"`
	Username  string `json:"username"`
	Password  string `json:"password,omitempty"`
	AuthToken string `json:"authtoken,omitempty"`
}

func dbToAPIUser(dbUser *db.User) apiUser {
	return apiUser{
		ID:       dbUser.ID,
		Username: dbUser.Username,
	}
}

// Login checks the provided password and generates a new authentication token that is sent back to the apiUser.
func (api *API) Login(w http.ResponseWriter, r *http.Request) {
	header := r.Header.Get("Authorization")
	if len(header) == 0 && strings.HasPrefix(header, authHeader) {
		http.Error(w, "Please do not send a lindeb authorization header when logging in.", http.StatusForbidden)
	}

	userData := apiUser{}
	if !readJSON(w, r, &userData) {
		return
	}

	user := api.DB.GetUserByName(userData.Username)
	if user == nil || !user.CheckPassword(userData.Password) {
		http.Error(w, "Invalid username or password.", http.StatusUnauthorized)
		return
	}

	userData = dbToAPIUser(user)
	userData.AuthToken = user.GenerateAuthToken().Token
	writeJSON(w, http.StatusOK, userData)
}

// Logout invalidates the authentication token sent with the request.
func (api *API) Logout(w http.ResponseWriter, r *http.Request) {
	user := api.GetUserFromContext(r)

	if user.TokenUsed == nil {
		internalError(w, "Unexpected state: GetUser() returned an apiUser with no TokenUsed set.")
		return
	}

	user.TokenUsed.Delete()
}

// Register creates a new apiUser and logs in.
func (api *API) Register(w http.ResponseWriter, r *http.Request) {
	header := r.Header.Get("Authorization")
	if len(header) == 0 && strings.HasPrefix(header, authHeader) {
		http.Error(w, "Please do not send a lindeb authorization header when registering.", http.StatusForbidden)
	}

	userData := apiUser{}
	if !readJSON(w, r, &userData) {
		return
	}

	user := api.DB.GetUserByName(userData.Username)
	if user != nil {
		http.Error(w, "Username is taken.", http.StatusConflict)
		return
	}

	user = api.DB.NewUser(userData.Username, userData.Password)
	userData = dbToAPIUser(user)
	userData.AuthToken = user.GenerateAuthToken().Token
	writeJSON(w, http.StatusCreated, userData)
}

var tokenRegex = regexp.MustCompile("LINDEB-TOKEN user=([0-9]+) token=([A-Za-z]+)")

const authHeader = "LINDEB-TOKEN"

// GetUser gets the apiUser who sent the request, or nil if the sender is not logged in.
func (api *API) GetUser(r *http.Request) *db.User {
	val := r.Header.Get("Authorization")
	if len(val) == 0 {
		return nil
	}

	if !strings.HasPrefix(val, authHeader) {
		return nil
	}

	match := tokenRegex.FindStringSubmatch(val)
	if match == nil || len(match) < 3 {
		return nil
	}

	userID, err := strconv.Atoi(match[1])
	if err != nil {
		return nil
	}

	user := api.DB.GetUser(userID)
	if user == nil {
		return nil
	}

	if !user.CheckToken(match[2]) {
		return nil
	}
	return user
}

// AuthMiddleware provides a HTTP handler middleware that loads the user data of the sender to the request context.
//
// If the user is not logged in, HTTP Unauthorized is returned and the next handler is not called.
func (api *API) AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user := api.GetUser(r)
		if user == nil {
			http.Error(w, "You are not logged in.", http.StatusUnauthorized)
			return
		}
		newContext := context.WithValue(r.Context(), "user", user)
		next.ServeHTTP(w, r.WithContext(newContext))
	})
}

// GetUserFromContext gets the database user object from the context of the given request.
//
// Calling this function with a request that did not go through the auth check middleware is strictly forbidden and
// will cause a panic.
func (api *API) GetUserFromContext(r *http.Request) *db.User {
	userInterface := r.Context().Value("user")
	if userInterface == nil {
		panic("Fatal: Called GetUserFromContext from handler without auth middleware (user not in context)")
	}
	user, ok := userInterface.(*db.User)
	if !ok {
		panic("Fatal: Called GetUserFromContext from handler without auth middleware (context user is wrong type)")
	}
	return user
}
