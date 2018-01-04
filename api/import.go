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
	"net/url"
	"strings"
	"time"

	"maunium.net/go/lindeb/db"
)

func (api *API) ImportLinks(w http.ResponseWriter, r *http.Request) {
	format := r.URL.Query().Get("format")

	var links []*db.Link
	var ok bool
	switch format {
	case "lindeb":
		links, ok = api.readLindebDump(w, r)
	case "pinboard":
		links, ok = api.readPinboardDump(w, r)
	default:
		w.WriteHeader(http.StatusUnsupportedMediaType)
		return
	}
	if !ok {
		return
	}

	user := api.GetUserFromContext(r)

	var apiLinks = make([]apiLink, len(links))
	for index, link := range links {
		err := link.Insert()
		if err != nil {
			internalError(w, "Failed to insert link into database: %v", err)
		}

		err = link.UpdateTags(link.Tags)
		if err != nil {
			internalError(w, "Failed to update tags of link %d in database: %v", link.ID, err)
			return
		}

		apiLink := dbToAPILink(link)
		apiLinks[index] = apiLink.Copy()

		api.elasticQueue <- func() {
			apiLink.HTML = readLink(link.URL.String())
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
	writeJSON(w, http.StatusOK, apiLinks)
}

func (api *API) readLindebDump(w http.ResponseWriter, r *http.Request) ([]*db.Link, bool) {
	user := api.GetUserFromContext(r)

	var links []apiLink
	if !readJSON(w, r, &links) {
		return nil, false
	}

	var dbLinks = make([]*db.Link, len(links))
	for index, link := range links {
		dbLinks[index] = apiToDBLink(user, link)
	}

	return dbLinks, true
}

type pinboardLink struct {
	URL         string `json:"href"`
	Title       string `json:"description"`
	Description string `json:"extended"`
	Time        string `json:"time"`
	Tags        string `json:"tags"`
}

func (api *API) readPinboardDump(w http.ResponseWriter, r *http.Request) ([]*db.Link, bool) {
	user := api.GetUserFromContext(r)

	var links []pinboardLink
	if !readJSON(w, r, &links) {
		return nil, false
	}

	var dbLinks = make([]*db.Link, len(links))
	for index, link := range links {
		ts, err := time.Parse(time.RFC3339, link.Time)
		if err != nil {
			ts = time.Now()
		}
		url, _ := url.Parse(link.URL)
		tags := strings.Split(link.Tags, " ")
		if len(tags) == 1 && len(tags[0]) == 0 {
			tags = []string{}
		}
		dbLinks[index] = &db.Link{
			DB:    api.DB,
			Owner: user,

			Title:       link.Title,
			Description: link.Description,
			Timestamp:   ts.Unix(),
			URL:         url,
			Tags:        tags,
		}
	}

	return dbLinks, true
}
