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

// A helper function to use Maps easily within JSX.
// eslint-disable-next-line
Map.prototype.map = function (...args) {
	return [...this.values()].map(...args)
}

// A helper function to find a key from a map based on a given filter.
// eslint-disable-next-line
Map.prototype.find = function(callback) {
	for (const [key, value] of this) {
		if (callback(value)) {
			return key
		}
	}
	return undefined
}
