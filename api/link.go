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
	"net/http"
	"time"

	"fmt"

	"net/url"

	"maunium.net/go/lindeb/db"
)

type apiLink struct {
	ID          int      `json:"id"`
	Title       string   `json:"title"`
	Description string   `json:"description"`
	Timestamp   int64    `json:"timestamp"`
	URLString   string   `json:"url"`
	Domain      string   `json:"domain"`
	Tags        []string `json:"tags"`

	Owner int    `json:"owner,omitempty"`
	HTML  string `json:"html,omitempty"`
}

func dbToAPILink(dbLink *db.Link) apiLink {
	var urlStr, domain string
	if dbLink.URL != nil {
		urlStr = dbLink.URL.String()
		domain = dbLink.URL.Hostname()
	}
	if dbLink.Tags == nil {
		dbLink.Tags = []string{}
	}
	return apiLink{
		ID:          dbLink.ID,
		Title:       dbLink.Title,
		Description: dbLink.Description,
		Timestamp:   dbLink.Timestamp,
		URLString:   urlStr,
		Domain:      domain,
		Tags:        dbLink.Tags,
	}
}

func apiToDBLink(user *db.User, apiLink apiLink) *db.Link {
	url, _ := url.Parse(apiLink.URLString)
	return &db.Link{
		ID:          apiLink.ID,
		Title:       apiLink.Title,
		Description: apiLink.Description,
		Timestamp:   apiLink.Timestamp,
		URL:         url,
		Tags:        apiLink.Tags,
		Owner:       user,
		DB:          user.DB,
	}
}

func (al apiLink) Copy() apiLink {
	return apiLink{
		ID:          al.ID,
		Title:       al.Title,
		Description: al.Description,
		Timestamp:   al.Timestamp,
		URLString:   al.URLString,
		Domain:      al.Domain,
		Tags:        al.Tags,
	}
}

const ElasticIndex = "lindeb"
const ElasticType = "link"

// SaveLink is a handler for POST /api/link/save
func (api *API) SaveLink(w http.ResponseWriter, r *http.Request) {
	inputLink := apiLink{}
	if r.Method == http.MethodPost {
		if !readJSON(w, r, &inputLink) {
			return
		}
	} else {
		inputLink.URLString = r.URL.Query().Get("url")
		inputLink.Title = r.URL.Query().Get("title")
		inputLink.Description = r.URL.Query().Get("description")
		inputLink.Tags = r.URL.Query()["tag"]
	}

	user := api.GetUserFromContext(r)
	link := user.BlankLink()

	var err error
	link.URL, err = url.Parse(inputLink.URLString)
	if err != nil {
		http.Error(w, fmt.Sprintf("Malformed URL: %v", err), http.StatusBadRequest)
		return
	}

	htmlBody := scrapeLink(link)
	if len(inputLink.Title) > 0 {
		link.Title = inputLink.Title
	}
	if len(inputLink.Description) > 0 {
		link.Description = inputLink.Description
	}
	link.Timestamp = time.Now().Unix()

	err = link.Insert()
	if err != nil {
		internalError(w, "Failed to insert link into database: %v", err)
		return
	}

	err = link.UpdateTags(inputLink.Tags)
	if err != nil {
		internalError(w, "Failed to update tags of link %d in database: %v", link.ID, err)
		return
	}

	apiLink := dbToAPILink(link)
	writeJSON(w, http.StatusCreated, apiLink)

	api.elasticQueue <- func() {
		apiLink.HTML = htmlBody
		apiLink.Owner = user.ID
		_, err = api.Elastic.Index().
			Index(ElasticIndex).
			Type(ElasticType).
			Routing(user.IDString()).
			Id(link.IDString()).
			BodyJson(apiLink).
			Do(context.Background())
		if err != nil {
			fmt.Printf("Elasticsearch error while saving link %d from %d: %v", link.ID, user.ID, err)
		}
	}
}

// AccessLink is a method proxy for the handlers of /api/link/<id>
func (api *API) AccessLink(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		api.GetLink(w, r)
	case http.MethodPut:
		api.EditLink(w, r)
	case http.MethodDelete:
		api.DeleteLink(w, r)
	default:
		// Invalid methods should be prevented at the router level, so just panic if the router is misconfigured.
		panic("Fatal: AccessLink called with invalid method.")
	}
}

// GetLink is the handler for GET /api/link/<id>
func (api *API) GetLink(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, dbToAPILink(api.GetLinkFromContext(r)))
}

// EditLink is the handler for PUT /api/link/<id>
func (api *API) EditLink(w http.ResponseWriter, r *http.Request) {
	user := api.GetUserFromContext(r)
	link := api.GetLinkFromContext(r)

	inputLink := apiLink{}
	if !readJSON(w, r, &inputLink) {
		return
	}

	var err error

	if len(inputLink.URLString) > 0 {
		link.URL, err = url.Parse(inputLink.URLString)
		if err != nil {
			http.Error(w, fmt.Sprintf("Malformed URL: %v", err), http.StatusBadRequest)
			return
		}
	}

	htmlBody := scrapeLink(link)
	if len(inputLink.Title) > 0 {
		link.Title = inputLink.Title
	}
	if len(inputLink.Description) > 0 {
		link.Description = inputLink.Description
	}

	err = link.Update()
	if err != nil {
		internalError(w, "Failed to update link %d in database: %v", link.ID, err)
		return
	}

	err = link.UpdateTags(inputLink.Tags)
	if err != nil {
		internalError(w, "Failed to update tags of link %d in database: %v", link.ID, err)
		return
	}

	apiLink := dbToAPILink(link)
	writeJSON(w, http.StatusOK, apiLink)

	api.elasticQueue <- func() {
		apiLink.HTML = htmlBody
		apiLink.Owner = user.ID
		_, err = api.Elastic.Update().
			Index(ElasticIndex).
			Type(ElasticType).
			Routing(user.IDString()).
			Id(link.IDString()).
			Doc(apiLink).
			Do(context.Background())
		if err != nil {
			fmt.Printf("Elasticsearch error while updating link %d from %d: %v", link.ID, user.ID, err)
		}
	}
}

// DeleteLink is the handler for DELETE /api/link/<id>
func (api *API) DeleteLink(w http.ResponseWriter, r *http.Request) {
	user := api.GetUserFromContext(r)
	link := api.GetLinkFromContext(r)

	err := link.Delete()
	if err != nil {
		internalError(w, "Failed to delete link %d from database: %v", link.ID, err)
		return
	}

	_, err = api.Elastic.Delete().
		Index(ElasticIndex).
		Type(ElasticType).
		Routing(user.IDString()).
		Id(link.IDString()).
		Do(context.Background())
	if err != nil {
		fmt.Printf("Elasticsearch error while deleting link %d: %v", link.ID, err)
	}
	w.WriteHeader(http.StatusNoContent)
}

// LinkMiddleware provides a HTTP handler middleware that loads the data of the link with the requested ID to the
// request context.
//
// You must call the authentication middleware BEFORE this function, as this depends on the user being logged in.
//
// If the request path doesn't contain the id field, HTTP Bad Request is returned.
// If the requested link does not exist or is not owned by the current user, HTTP Not Found is returned.
// In both error cases, the next handler is not called.
func (api *API) LinkMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user := api.GetUserFromContext(r)

		id, ok := getMuxIntVar(w, r, "id", "Link ID")
		if !ok {
			return
		}

		link := user.GetLink(id)
		if link == nil {
			http.Error(w, fmt.Sprintf(`Link #%d not found.`, id), http.StatusNotFound)
			return
		}
		newContext := context.WithValue(r.Context(), "link", link)
		next.ServeHTTP(w, r.WithContext(newContext))
	})
}

// GetLinkFromContext gets the database link object from the context of the given request.
//
// Calling this function with a request that did not go through the link getter middleware is strictly forbidden and
// will cause a panic.
func (api *API) GetLinkFromContext(r *http.Request) *db.Link {
	linkInterface := r.Context().Value("link")
	if linkInterface == nil {
		panic("Fatal: Called GetLinkFromContext from handler without link getter middleware (link not in context)")
	}
	link, ok := linkInterface.(*db.Link)
	if !ok {
		panic("Fatal: Called GetLinkFromContext from handler without link getter middleware (context link is wrong type)")
	}
	return link
}
