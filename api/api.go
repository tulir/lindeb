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

	link := router.PathPrefix("/link").Subrouter()
	link.Handle("/save", api.AuthMiddleware(http.HandlerFunc(api.SaveLink))).Methods(http.MethodPost)
	link.Handle("/{id:[0-9]+}", api.AuthMiddleware(api.LinkMiddleware(http.HandlerFunc(api.AccessLink)))).
		Methods(http.MethodGet, http.MethodPut, http.MethodDelete)
}

func internalError(w http.ResponseWriter, message string) {
	http.Error(w, "Internal server error: Check console for more details.", http.StatusInternalServerError)
	fmt.Println(message)
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
	payload, err := json.Marshal(data)
	if err != nil {
		internalError(w, fmt.Sprintf("Failed to marshal JSON: %v", err))
		return false
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	w.Write(payload)
	return true
}
