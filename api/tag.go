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
	"context"
	"fmt"
	"net/http"

	"maunium.net/go/lindeb/db"
)

func (api *API) AddTag(w http.ResponseWriter, r *http.Request) {

}

// AccessTag is a method proxy for the handlers of /api/tag/<id>
func (api *API) AccessTag(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		api.GetTag(w, r)
	case http.MethodPut:
		api.EditTag(w, r)
	case http.MethodDelete:
		api.DeleteTag(w, r)
	default:
		// Invalid methods should be prevented at the router level, so just panic if the router is misconfigured.
		panic("Fatal: AccessTag called with invalid method.")
	}
}

func (api *API) GetTag(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusNotImplemented)
}

func (api *API) EditTag(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusNotImplemented)
}

func (api *API) DeleteTag(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusNotImplemented)
}

func (api *API) ListTags(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusNotImplemented)
}

// TagMiddleware provides a HTTP handler middleware that loads the data of the tag with the requested ID to the
// request context.
//
// You must call the authentication middleware BEFORE this function, as this depends on the user being logged in.
//
// If the request path doesn't contain the id field, HTTP Bad Request is returned.
// If the requested tag does not exist or is not owned by the current user, HTTP Not Found is returned.
// In both error cases, the next handler is not called.
func (api *API) TagMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user := api.GetUserFromContext(r)

		id, ok := getMuxIntVar(w, r, "id", "Tag ID")
		if !ok {
			return
		}

		tag := user.GetTag(id)
		if tag == nil {
			http.Error(w, fmt.Sprintf(`Tag #%d not found.`, id), http.StatusNotFound)
			return
		}
		newContext := context.WithValue(r.Context(), "tag", tag)
		next.ServeHTTP(w, r.WithContext(newContext))
	})
}

// GetTagFromContext gets the database tag object from the context of the given request.
//
// Calling this function with a request that did not go through the tag getter middleware is strictly forbidden and
// will cause a panic.
func (api *API) GetTagFromContext(r *http.Request) *db.Tag {
	tagInterface := r.Context().Value("tag")
	if tagInterface == nil {
		panic("Fatal: Called GetTagFromContext from handler without tag getter middleware (tag not in context)")
	}
	tag, ok := tagInterface.(*db.Tag)
	if !ok {
		panic("Fatal: Called GetTagFromContext from handler without tag getter middleware (context tag is wrong type)")
	}
	return tag
}
