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
	"net/http"
)

func (api *API) GetSettings(w http.ResponseWriter, r *http.Request) {
	user := api.GetUserFromContext(r)

	settings, err := user.GetSettings()
	if err != nil {
		internalError(w, "Failed to get settings: %v", err)
		return
	}

	var jsonSettings = make(map[string]json.RawMessage)
	for key, value := range settings {
		jsonSettings[key] = json.RawMessage(value)
	}
	writeJSON(w, http.StatusOK, jsonSettings)
}

func (api *API) AccessSetting(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		api.GetSetting(w, r)
	case http.MethodPut:
		api.UpdateSetting(w, r)
	case http.MethodDelete:
		api.DeleteSetting(w, r)
	default:
		// Invalid methods should be prevented at the router level, so just panic if the router is misconfigured.
		panic("Fatal: AccessSetting called with invalid method.")
	}
}

func (api *API) UpdateSetting(w http.ResponseWriter, r *http.Request) {
	user := api.GetUserFromContext(r)

	key, ok := getMuxVar(w, r, "key", "Setting key")
	if !ok {
		return
	}

	var data interface{}
	if !readJSON(w, r, &data) {
		return
	}

	validData, err := json.Marshal(&data)
	if err != nil {
		internalError(w, "Failed to marshal setting: %v", err)
		return
	}

	if len(key) > 32 {
		http.Error(w, "Setting key too long.", http.StatusRequestEntityTooLarge)
		return
	} else if len(validData) > 65535 {
		http.Error(w, "Setting value too long.", http.StatusRequestEntityTooLarge)
		return
	}

	user.SetSetting(key, string(validData))
}

func (api *API) GetSetting(w http.ResponseWriter, r *http.Request) {
	user := api.GetUserFromContext(r)

	key, ok := getMuxVar(w, r, "key", "Setting key")
	if !ok {
		return
	}

	if len(key) > 32 {
		http.Error(w, "Setting key too long.", http.StatusRequestEntityTooLarge)
		return
	}

	val := user.GetSetting(key)
	if len(val) == 0 {
		w.WriteHeader(http.StatusNotFound)
		return
	}
	writeJSON(w, http.StatusOK, json.RawMessage(val))
}

func (api *API) DeleteSetting(w http.ResponseWriter, r *http.Request) {
	user := api.GetUserFromContext(r)

	key, ok := getMuxVar(w, r, "key", "Setting key")
	if !ok {
		return
	}

	if len(key) > 32 {
		http.Error(w, "Setting key too long.", http.StatusRequestEntityTooLarge)
		return
	}

	user.DeleteSetting(key)
	w.WriteHeader(http.StatusNoContent)
}
