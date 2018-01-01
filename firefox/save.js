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

class PopupHandler {
	constructor(authHeader) {
		this.title = document.getElementById("title")
		this.tags = document.getElementById("tags")
		this.url = document.getElementById("url")
		this.description = document.getElementById("description")
		document.getElementById("save").onclick = () => this.save()
		this.authHeader = authHeader
		this.fillFields()
	}

	async getCurrentTab() {
		try {
			const tabs = await browser.tabs.query({currentWindow: true, active: true})
			if (tabs.length > 0) {
				return tabs[0]
			}
		} catch (err) {
			console.error("Error getting current tab:", err)
		}
		return undefined
	}

	async fillFields() {
		const tab = await this.getCurrentTab()
		if (!tab) {
			return
		}

		this.url.value = tab.url
		this.title.value = tab.title
	}

	async save() {
		const title = this.title.value
		const tags = this.tags.value.split(",").map(tag => tag.trim()).filter(tag => !!tag)
		const url = this.url.value
		const description = this.description.value
		try {
			const response = await fetch(`https://lindeb.mau.lu/api/link/save`, {
				headers: {
					"Authorization": this.authHeader,
					"Content-Type": "application/json",
				},
				method: "POST",
				body: JSON.stringify({title, tags, url, description}),
			})
			if (!response.ok) {
				// TODO show error
				console.error(response)
				return
			}
			document.getElementById("link-save").className += " hidden"
			document.getElementById("link-saved").className = ""
			setTimeout(window.close, 1000)
		} catch (err) {
			console.error("Fatal error while saving link:", err)
		}
	}
}

async function init() {
	try {
		const { authHeader } = await browser.storage.local.get()
		if (authHeader) {
			window.popup = new PopupHandler(authHeader)
			return
		}
	} catch (err) {
		console.error("Failed to get auth header:", err)
	}
	document.getElementById("link-save").className += " hidden"
	document.getElementById("not-logged-in").className = ""
}

init()
