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

package db

func (user *User) GetSetting(key string) (value string) {
	settingRow := user.DB.QueryRow("SELECT value FROM Setting WHERE vkey=? AND user=?", key, user.ID)
	if settingRow != nil {
		settingRow.Scan(&value)
	}
	return
}

func (user *User) GetSettings() (map[string]string, error) {
	results, err := user.DB.Query("SELECT vkey, value FROM Setting WHERE user=?", user.ID)
	if err != nil {
		return nil, err
	}
	values := make(map[string]string)
	for results.Next() {
		var key, value string
		err = results.Scan(&key, &value)
		if err != nil {
			return nil, err
		}
		values[key] = value
	}
	return values, nil
}

func (user *User) SetSetting(key, value string) (err error) {
	_, err = user.DB.Exec(
		"INSERT INTO Setting (user, vkey, value) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE value=?",
		user.ID, key, value, value)
	return
}

func (user *User) DeleteSetting(key string) (err error) {
	_, err = user.DB.Exec("DELETE FROM Setting WHERE user=? AND vkey=?", user.ID, key)
	return
}
