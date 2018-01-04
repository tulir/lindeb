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
	"encoding/json"
	"fmt"
	"net/http"

	"strconv"

	"github.com/gorilla/mux"
	"github.com/olivere/elastic"
	"maunium.net/go/lindeb/db"
)

// API contains objects needed by the API handlers to function.
type API struct {
	DB      *db.DB
	Elastic *elastic.Client
}

// AddHandler registers all the API paths.
func (api *API) AddHandler(router *mux.Router) {
	auth := router.PathPrefix("/auth").Methods(http.MethodPost).Subrouter()
	auth.HandleFunc("/login", api.Login)
	auth.Handle("/logout", api.AuthMiddleware(http.HandlerFunc(api.Logout)))
	auth.HandleFunc("/register", api.Register)
	auth.HandleFunc("/update", api.AuthMiddleware(http.HandlerFunc(api.UpdateAuth)))

	router.Handle("/link/save", api.AuthMiddleware(http.HandlerFunc(api.SaveLink))).Methods(http.MethodPost, http.MethodGet)
	router.Handle("/link/{id:[0-9]+}", api.AuthMiddleware(api.LinkMiddleware(http.HandlerFunc(api.AccessLink)))).
		Methods(http.MethodGet, http.MethodPut, http.MethodDelete)
	router.Handle("/links", api.AuthMiddleware(http.HandlerFunc(api.BrowseLinks))).Methods(http.MethodGet)

	router.Handle("/tag/add", api.AuthMiddleware(http.HandlerFunc(api.AddTag))).Methods(http.MethodPost)
	router.Handle("/tag/{id:[0-9]+}", api.AuthMiddleware(api.TagMiddleware(http.HandlerFunc(api.AccessTag)))).
		Methods(http.MethodGet, http.MethodPut, http.MethodDelete)
	router.Handle("/tags", api.AuthMiddleware(http.HandlerFunc(api.ListTags))).Methods(http.MethodGet)
}

func internalError(w http.ResponseWriter, message string, args ...interface{}) {
	http.Error(w, "Internal server error: Check console for more details.", http.StatusInternalServerError)
	fmt.Printf(message+"\n", args...)
}

func readJSON(w http.ResponseWriter, r *http.Request, into interface{}) bool {
	defer r.Body.Close()

	err := json.NewDecoder(r.Body).Decode(into)
	if err != nil {
		http.Error(w, "Malformed JSON.", http.StatusBadRequest)
		return false
	}

	return true
}

func writeJSON(w http.ResponseWriter, status int, data interface{}) bool {
	payload, err := json.Marshal(&data)
	if err != nil {
		internalError(w, fmt.Sprintf("Failed to marshal JSON: %v", err))
		return false
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	w.Write(payload)
	return true
}

func getMuxIntVar(w http.ResponseWriter, r *http.Request, field, name string) (val int, ok bool) {
	ok = false

	vars := mux.Vars(r)
	str, found := vars[field]
	if !found {
		http.Error(w, fmt.Sprintf("%s not given.", name), http.StatusBadRequest)
		return
	}

	var err error
	val, err = strconv.Atoi(str)
	if err != nil {
		http.Error(w, fmt.Sprintf(`%s "%s" is not a number.`, name, str), http.StatusBadRequest)
		return
	}

	ok = true
	return
}
