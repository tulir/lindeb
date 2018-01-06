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

class Settings {
	constructor(app, userID, authtoken) {
		this.app = app
		this.headers = {
			"Authorization": `LINDEB-TOKEN user=${userID} token=${authtoken}`,
			"Content-Type": "application/json",
		}
		this.data = JSON.parse(window.localStorage.settings || "{}") || {}
		this.update = this.update.bind(this)
		this.set = this.set.bind(this)
		this.delete = this.delete.bind(this)
		this.toJSON = this.toJSON.bind(this)

		const target = this
		this.proxy = new Proxy(this, {
			set(_, key, value) {
				if (key in target) {
					return false
				}
				target.set(key, value)
				return true
			},
			get(_, key) {
				if (key in target) {
					return target[key]
				} else if (target.data.hasOwnProperty(key)) {
					return target.data[key]
				}
				return undefined
			},
			has(_, key) {
				return key in target.data
			},
			ownKeys() {
				return Object.getOwnPropertyNames(target.data)
			},
			deleteProperty(_, key) {
				if (key in target) {
					return false
				}
				target.delete(key)
				return true
			},
		})
		return this.proxy
	}

	toJSON() {
		return this.data
	}

	async update() {
		const response = await fetch("api/settings", {headers: this.headers})
		if (!response.ok) {
			const err = new Error(`Failed to update settings: ${response.status}`)
			err.response = response
			throw err
		}
		const json = await response.json()
		if (!json) {
			return
		}
		this.data = json
		window.localStorage.settings = JSON.stringify(this.data)
		document.body.dispatchEvent(new CustomEvent("lindeb-setting-change", {
			detail: {
				type: "update",
				data: this.data,
			},
		}))
	}

	set(key, value) {
		this.data[key] = value
		window.localStorage.settings = JSON.stringify(this.data)
		document.body.dispatchEvent(new CustomEvent("lindeb-setting-change", {
			detail: {
				type: "set",
				key,
				value,
			},
		}))
		return fetch(`api/setting/${key}`, {
			headers: this.headers,
			method: "PUT",
			body: JSON.stringify(value),
		})
	}

	delete(key) {
		delete this.data[key]
		window.localStorage.settings = JSON.stringify(this.data)
		document.body.dispatchEvent(new CustomEvent("lindeb-setting-change", {
			detail: {
				type: "delete",
				key,
			},
		}))
		return fetch(`api/setting/${key}`, {
			headers: this.headers,
			method: "DELETE",
		})
	}
}

export default Settings
