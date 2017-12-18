package api

import (
	"net/http"
	"regexp"
	"strconv"
	"strings"

	"maunium.net/go/lindeb/db"
)

type user struct {
	ID        int    `json:"id"`
	Username  string `json:"username"`
	Password  string `json:"password,omitempty"`
	AuthToken string `json:"authtoken,omitempty"`
}

func dbToLocalUser(dbUser *db.User) user {
	return user{
		ID:       dbUser.ID,
		Username: dbUser.Username,
	}
}

// Login checks the provided password and generates a new authentication token that is sent back to the user.
func (api *API) Login(w http.ResponseWriter, r *http.Request) {
	header := r.Header.Get("Authorization")
	if len(header) == 0 && strings.HasPrefix(header, authHeader) {
		error(w, http.StatusForbidden, "Please do not send a lindeb authorization header when logging in.")
	}

	userData := user{}
	if !readJSON(w, r, &userData) {
		return
	}

	user := api.DB.GetUserByName(userData.Username)
	if user == nil || !user.CheckPassword(userData.Password) {
		error(w, http.StatusUnauthorized, "Invalid username or password.")
		return
	}

	userData = dbToLocalUser(user)
	userData.AuthToken = user.GenerateAuthToken().Token
	writeJSON(w, http.StatusOK, userData)
}

// Logout invalidates the authentication token sent with the request.
func (api *API) Logout(w http.ResponseWriter, r *http.Request) {
	user := api.GetUser(r)
	if user == nil {
		error(w, http.StatusUnauthorized, "You are not logged in.")
		return
	}

	if user.TokenUsed == nil {
		internalError(w, "Unexpected state: GetUser() returned an user with no TokenUsed set.")
		return
	}

	user.TokenUsed.Delete()
}

// Register creates a new user and logs in.
func (api *API) Register(w http.ResponseWriter, r *http.Request) {
	header := r.Header.Get("Authorization")
	if len(header) == 0 && strings.HasPrefix(header, authHeader) {
		error(w, http.StatusForbidden, "Please do not send a lindeb authorization header when registering.")
	}

	userData := user{}
	if !readJSON(w, r, &userData) {
		return
	}

	user := api.DB.GetUserByName(userData.Username)
	if user != nil {
		error(w, http.StatusConflict, "Username is taken.")
		return
	}

	user = api.DB.NewUser(userData.Username, userData.Password)
	userData = dbToLocalUser(user)
	userData.AuthToken = user.GenerateAuthToken().Token
	writeJSON(w, http.StatusCreated, userData)
}

var tokenRegex = regexp.MustCompile("LINDEB-TOKEN user=([0-9]+) token=([A-Za-z]+)")

const authHeader = "LINDEB-TOKEN"

// GetUser gets the user who sent the request, or nil if the sender is not logged in.
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
	if user != nil {
		return nil
	}

	if !user.CheckToken(match[2]) {
		return nil
	}
	return user
}
