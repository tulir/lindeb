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
	"reflect"
	"strconv"

	"github.com/olivere/elastic"
	"maunium.net/go/lindeb/db"
)

type listResponse struct {
	Links      []apiLink `json:"links"`
	TotalCount int       `json:"totalCount"`
}

// getQueryInt gets an integer value from the query parameter with the given name.
//
// If the parameter is not present, the given default value is returned.
// If the parameter is not an integer, the second return value (ok) is set to false and a HTTP error is written to the
// given response writer.
func getQueryInt(w http.ResponseWriter, r *http.Request, name string, defVal int) (val int, ok bool) {
	str := r.URL.Query().Get(name)
	if len(str) == 0 {
		return defVal, true
	}

	var err error
	val, err = strconv.Atoi(str)
	if err != nil {
		http.Error(w, fmt.Sprintf("Non-integer value for query parameter %s: %s", name, str), http.StatusBadRequest)
		return defVal, false
	}

	return val, true
}

// filterLinks filters a list of links based on the query parameters in the given request.
//
// If an error occurs, the second return value (totalCount) is set to -1 and a HTTP error is written to the given
// response writer.
func filterLinks(w http.ResponseWriter, r *http.Request, links []*db.Link) (filtered []apiLink, totalCount int) {
	totalCount = -1
	var page, pageSize int
	var ok bool
	if page, ok = getQueryInt(w, r, "page", 0); !ok {
		return
	}
	if pageSize, ok = getQueryInt(w, r, "pagesize", 10); !ok {
		return
	}
	tags := r.URL.Query()["tag"]
	exclusiveTags := len(r.URL.Query().Get("exclusivetags")) > 0
	domains := r.URL.Query()["domain"]

	for _, link := range links {
		if link.Matches(domains, tags, exclusiveTags) {
			filtered = append(filtered, dbToAPILink(link))
		}
	}

	totalCount = len(filtered)

	if page > 0 && pageSize > 0 {
		from := (page - 1) * pageSize
		to := page * pageSize
		if from < len(filtered) {
			if to < len(filtered) {
				// From and to are within link list, get the section ruled out by the two.
				filtered = filtered[from:to]
			} else {
				// To is outside the list, get everything after from.
				filtered = filtered[from:]
			}
		} else {
			// From is outside the list -> no results.
			filtered = nil
		}
	}
	if filtered == nil {
		// Return an empty array instead of null.
		filtered = []apiLink{}
	}
	return
}

// searchLinks searches Elasticsearch with the given query.
//
// If an error occurs, the second return value (ok) is set to false and a HTTP error is written to the given response
// writer.
func (api *API) searchLinks(w http.ResponseWriter, user *db.User, query string, fields ...string) (links []*db.Link, ok bool) {
	ok = false
	if len(fields) == 0 {
		fields = []string{"url", "domain", "title", "description", "html"}
	}
	results, err := api.Elastic.Search().
		Index(ElasticIndex).
		Type(ElasticType).
		Routing(user.IDString()).
		Query(
		elastic.NewBoolQuery().
			Filter(elastic.NewTermQuery("user", user.ID)).
			Must(elastic.NewMultiMatchQuery(query, fields...))).
		Do(context.Background())
	if err != nil {
		internalError(w, "Elasticsearch error while searching for \"%s\" in #%d's links: %v",
			query, user.ID, err)
		return
	}
	var link apiLink
	for _, item := range results.Each(reflect.TypeOf(link)) {
		t := item.(apiLink)
		links = append(links, apiToDBLink(user, t))
	}
	ok = true
	return
}

// BrowseLinks is the handler for GET /api/links
func (api *API) BrowseLinks(w http.ResponseWriter, r *http.Request) {
	user := api.GetUserFromContext(r)

	var links []*db.Link
	var err error
	searchQuery := r.URL.Query().Get("search")
	if len(searchQuery) == 0 {
		links, err = user.GetLinks()
		if err != nil {
			internalError(w, "Failed to list links of %d: %v", user.ID, err)
			return
		}
	} else {
		var ok bool
		links, ok = api.searchLinks(w, user, searchQuery)
		if !ok {
			return
		}
	}

	filtered, totalCount := filterLinks(w, r, links)
	if totalCount < 0 {
		return
	}

	writeJSON(w, http.StatusOK, listResponse{
		filtered,
		totalCount,
	})
}
