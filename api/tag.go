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
	user := api.GetUserFromContext(r)

	inputTag := &db.Tag{}
	if !readJSON(w, r, &inputTag) {
		return
	}
	inputTag.DB = user.DB
	inputTag.Owner = user
	inputTag.ID = 0

	duplicateTag := user.GetTagByName(inputTag.Name)
	if duplicateTag != nil {
		http.Error(w, fmt.Sprintf("New name conflicts with tag %d", duplicateTag.ID), http.StatusConflict)
		return
	}

	err := inputTag.Insert()
	if err != nil {
		internalError(w, "Failed to insert tag by %d into database: %v", user.ID, err)
		return
	}

	writeJSON(w, http.StatusCreated, inputTag)
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

type tagWithLinks struct {
	*db.Tag
	Links []apiLink `json:"links"`
}

// GetTag is the handler for GET /api/tag/<id>
func (api *API) GetTag(w http.ResponseWriter, r *http.Request) {
	tag := api.GetTagFromContext(r)

	includeLinks := len(r.URL.Query().Get("include-links")) > 0
	if !includeLinks {
		writeJSON(w, http.StatusOK, tag)
		return
	}

	links, err := tag.GetTaggedLinks()
	if err != nil {
		internalError(w, "Failed to fetch links with tag %d: %v", tag.ID, err)
	}
	var apiLinks []apiLink
	for _, link := range links {
		apiLinks = append(apiLinks, dbToAPILink(link))
	}

	writeJSON(w, http.StatusOK, tagWithLinks{
		tag,
		apiLinks,
	})
}

// EditTag is the handler for PUT /api/link/<id>
func (api *API) EditTag(w http.ResponseWriter, r *http.Request) {
	user := api.GetUserFromContext(r)
	tag := api.GetTagFromContext(r)

	inputTag := &db.Tag{}
	if !readJSON(w, r, &inputTag) {
		return
	}

	if len(inputTag.Name) > 0 {
		duplicateTag := user.GetTagByName(inputTag.Name)
		if duplicateTag != nil {
			http.Error(w, fmt.Sprintf("New name conflicts with tag %d", duplicateTag.ID), http.StatusConflict)
			return
		}
		tag.Name = inputTag.Name
	}
	if len(inputTag.Description) > 0 {
		tag.Description = inputTag.Description
	}

	err := tag.Update()
	if err != nil {
		internalError(w, "Failed to update tag %d in database: %v", tag.ID, err)
		return
	}

	writeJSON(w, http.StatusOK, tag)
}

func (api *API) DeleteTag(w http.ResponseWriter, r *http.Request) {
	user := api.GetUserFromContext(r)
	tag := api.GetTagFromContext(r)

	deleteLinks := len(r.URL.Query().Get("delete-links")) > 0
	if deleteLinks {
		// I'd use a simpler DELETE query with some JOINs, but we also need to delete the links from Elasticsearch,
		// so looping over the links is necessary.
		links, err := tag.GetTaggedLinks()
		if err != nil {
			internalError(w, "Failed to fetch links tagged with tag %d from database: %v", tag.ID, err)
			return
		}

		var errors []error
		for _, link := range links {
			err = link.Delete()
			if err != nil {
				errors = append(errors, err)
			}
			_, err = api.Elastic.Delete().
				Index(ElasticIndex).
				Type(ElasticType).
				Routing(user.IDString()).
				Id(link.IDString()).
				Do(context.Background())
			if err != nil {
				errors = append(errors, err)
			}
		}
		if len(errors) > 0 {
			internalError(w, "Errors occurred while deleting links tagged with %d", tag.ID)
			for index, err := range errors {
				fmt.Printf("Error %d: %v\n", index, err)
			}
			return
		}
	}

	err := tag.Delete()
	if err != nil {
		internalError(w, "Failed to delete tag %d from database: %v", tag.ID, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (api *API) ListTags(w http.ResponseWriter, r *http.Request) {
	user := api.GetUserFromContext(r)
	tagList := r.URL.Query()["tag"]

	var tags []*db.Tag
	var err error
	if len(tagList) > 0 {
		tags, err = user.GetTagsByName(tagList)
	} else {
		tags, err = user.GetTags()
	}
	if err != nil {
		internalError(w, "Failed to fetch tags of %d: %v", user.ID, err)
		return
	}

	writeJSON(w, http.StatusOK, tags)
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
