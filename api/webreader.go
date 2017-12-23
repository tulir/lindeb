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
	"io/ioutil"
	"net/http"

	"strings"

	"golang.org/x/net/html"
	"maunium.net/go/lindeb/db"
)

func scrapeLink(link *db.Link) (body string) {
	resp, err := http.Get(link.URL.String())
	if err != nil {
		link.Description = "Could not reach website"
		return
	}

	defer resp.Body.Close()

	rawBody, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		link.Description = "Could not read website"
		return
	}

	body = string(rawBody)
	link.Title, link.Description = findMetadata(body)
	return
}

func findMetadata(body string) (title string, description string) {
	t := html.NewTokenizer(strings.NewReader(body))
	for {
		tokenType := t.Next()
		if tokenType == html.ErrorToken {
			return
		}
		if tokenType != html.SelfClosingTagToken && tokenType != html.StartTagToken && tokenType != html.EndTagToken {
			continue
		}
		token := t.Token()

		switch token.Data {
		case "meta":
			if len(token.Attr) != 2 {
				break
			}
			var property string
			var content string
			for _, attr := range token.Attr {
				attr.Key = cleanStr(attr.Key)
				if attr.Key == "property" || attr.Key == "name" {
					property = attr.Val
				}
				if attr.Key == "content" {
					content = attr.Val
				}
			}
			switch cleanStr(property) {
			case "og:title":
				title = content
			case "og:description":
				description = content
			case "description":
				if len(description) == 0 {
					description = content
				}
			}
		case "title":
			if tokenType == html.StartTagToken {
				t.Next()
				token = t.Token()
				if len(title) == 0 {
					title = token.Data
				}
			}
		}
	}
	return
}

func cleanStr(str string) string {
	return strings.ToLower(strings.TrimSpace(str))
}
