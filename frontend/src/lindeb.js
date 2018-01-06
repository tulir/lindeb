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

import React, {Component} from "react"
import PropTypes from "prop-types"
import update from "immutability-helper"
import PerfectScrollbar from "perfect-scrollbar"
import {Hashmux, Query} from "hashmux"
import Settings from "./settings"
import Topbar from "./components/topbar"
import LoginView from "./components/login"
import TagView from "./components/tag/list"
import LinkView from "./components/link/list"
import LinkAddView from "./components/link/add"
import LinkImportView from "./components/link/import"
import SettingsView from "./components/settings/view"

const
	VIEW_LINKS = "links",
	VIEW_LINK_ADD = "link-add",
	VIEW_TAGS = "tags",
	VIEW_IMPORT_LINKS = "import-links",
	VIEW_SETTINGS = "settings",
	VIEW_NOT_FOUND = "404"

/**
 * The main component of lindeb. Contains most of API communication and decides what to render.
 */
class Lindeb extends Component {
	static childContextTypes = {
		login: PropTypes.func,
		logout: PropTypes.func,
		deleteLink: PropTypes.func,
		updateLink: PropTypes.func,
		addLink: PropTypes.func,
		saveTag: PropTypes.func,
		deleteTag: PropTypes.func,
		switchPage: PropTypes.func,
		isAuthenticated: PropTypes.func,
		error: PropTypes.func,
		headers: PropTypes.func,

		tagsByID: PropTypes.object,
		tagsByName: PropTypes.object,
		settings: PropTypes.object,
		topbar: PropTypes.object,
		user: PropTypes.object,
		router: PropTypes.object,
	}

	getChildContext() {
		return {
			login: this.login.bind(this),
			logout: this.logout.bind(this),
			deleteLink: this.deleteLink.bind(this),
			updateLink: this.updateLink.bind(this),
			addLink: this.addLink.bind(this),
			saveTag: this.saveTag.bind(this),
			deleteTag: this.deleteTag.bind(this),
			switchPage: this.switchPage.bind(this),
			isAuthenticated: this.isAuthenticated.bind(this),
			error: this.error.bind(this),
			headers: () => this.headers,

			tagsByID: this.state.tagsByID,
			tagsByName: this.state.tagsByName,
			settings: this.settings,
			topbar: this.topbar,
			user: this.state.user,
			router: this.router,
		}
	}

	constructor(props) {
		super(props)
		this.state = {
			user: undefined,
			page: 1,
			pageSize: 10,
			hasExtension: document.body.classList.contains("extension-exists"),
		}
		document.body.addEventListener("lindeb-extension-appeared", () => this.setState({hasExtension: true}))
		this.settings = new Proxy({}, {get: () => undefined})
		window.app = this

		if (!window.location.hash.startsWith("#/")) {
			window.location.hash = "#/"
		}

		if (!this.state.user && localStorage.user) {
			this.login(JSON.parse(localStorage.user))
		}

		this.router = new Hashmux()
		this.router.handle("/", (_, query) => this.openLinkList(query))
		this.router.handle("/save", (_, query) => this.openLinkAdder(query))
		this.router.handle("/tags", () => this.setState({view: VIEW_TAGS}))
		this.router.handle("/import", () => this.setState({view: VIEW_IMPORT_LINKS}))
		this.router.handle("/settings", () => {
			this.router.redirect(`#/settings/${SettingsView.DEFAULT_TAB}`)
			this.router.update()
		})
		this.router.handle("/settings/{tab:(user|extension|website)}", ({tab}) => this.setState({
			view: VIEW_SETTINGS,
			settingsTab: tab,
		}))
		this.router.handleError(404, () => this.setState({view: VIEW_NOT_FOUND}))
	}

	hasNiceNativeScrollbar() {
		if (navigator.userAgent.match(/Android|iPhone|iPad|iPod/i)) {
			// Mobile browsers usually make scrolling very nice.
			return true
		} else if (navigator.userAgent.includes("Safari") && !navigator.userAgent.includes("Chrome")) {
			// Safari is also fine.
			return true
		}
		// Chrome and Firefox on desktop aren't nice :(
		return false
	}

	updateScrollbar() {
		if (this.settings.forceNativeScrollbar) {
			if (this.ps) {
				this.ps.destroy(this.main)
				this.main.style["overflow-y"] = "auto"
				this.main.style["-webkit-overflow-scrolling"] = "touch"
			}
			return
		} else if (!this.hasNiceNativeScrollbar()) {
			if (!this.ps) {
				this.ps = new PerfectScrollbar(this.main)
				this.main.style["overflow-y"] = "hidden"
				delete this.main.style["-webkit-overflow-scrolling"]
			} else {
				this.ps.update()
			}
		}
	}

	componentDidMount() {
		this.setState({mounted: true})
		// If we do this in the constructor, it may trigger a setState() call before the component is mounted.
		this.router.listen()

		// If the native scrollbar isn't nice, use a PerfectScrollbar instead.
		if (!this.settings.forceNativeScrollbar && !this.hasNiceNativeScrollbar()) {
			this.ps = new PerfectScrollbar(this.main)
			this.main.style["overflow-y"] = "hidden"
		} else {
			this.main.style["overflow-y"] = "auto"
			this.main.style["-webkit-overflow-scrolling"] = "touch"
		}
	}

	componentDidUpdate() {
		this.updateScrollbar()
	}

	componentWillUnmount() {
		if (this.ps) {
			this.ps.destroy()
		}
	}

	/**
	 * The headers that should be used for all API requests.
	 */
	get headers() {
		if (!this.state.user) {
			return {
				"Content-Type": "application/json",
			}
		}
		return {
			"Authorization": `LINDEB-TOKEN user=${this.state.user.id} token=${this.state.user.authtoken}`,
			"Content-Type": "application/json",
		}
	}

	/**
	 * Locally check if the user is currently logged in.
	 *
	 * This only checks for the existence of auth information, not the validity of it.
	 */
	isAuthenticated() {
		return !!this.state.user
	}

	/**
	 * Log and display an API request error.
	 *
	 * @param {string} action The action that caused this error.
	 * @param {Object} result The response from {@code fetch()}
	 */
	async error(action, result) {
		console.error(`Error while ${action}: ${await result.text()}`)
		console.error(result)
		if (action === "logging in") {
			switch (result.status) {
				case 401:
					this.setState({error: "Invalid username or password"})
					return
				case 409:
					this.setState({error: "Username is already in use"})
					return
				default:
				// continue to next switch
			}
		}
		switch (result.status) {
			case 401:
				// Invalid authentication.
				delete localStorage.user
				return
			case 429:
				this.setState({error: "Rate limit encountered: Please wait before re-sending request"})
				return
			case 500:
				this.setState({error: "Internal server error"})
				return
			case 502:
				this.setState({error: "Could not connect to lindeb backend"})
				return
			default:
				this.setState({error: `Unknown error: ${result.statusText}`})
				return
		}
	}

	clearError() {
		if (!this.state.mounted) {
			return
		}
		this.setState({error: undefined})
	}

	setStateAsync(data) {
		return new Promise(resolve => this.setState(data, resolve))
	}

	async updateTags(headers = this.headers) {
		const tagResponse = await fetch("api/tags", {headers})
		if (!tagResponse.ok) {
			await this.error("fetching tags", tagResponse)
			return
		}
		const rawTags = await tagResponse.json() || []
		const tagsByID = new Map(rawTags.map(tag => [tag.id, tag]))
		const tagsByName = new Map(rawTags.map(tag => [tag.name, tag]))
		await this.setStateAsync({tagsByID, tagsByName})
	}

	/**
	 * Log in and fetch tags with the given user data.
	 *
	 * @param {Object} userData           The user authentication information.
	 * @param {number} userData.id        The ID of the user.
	 * @param {string} userData.authtoken The authentication token to use with the API.
	 * @param {string} [userData.name]    The username of the user.
	 */
	async login(userData) {
		if (!userData.id || !userData.authtoken) {
			throw new Error("Invalid argument: User data does not contain user and auth token.")
		}
		this.clearError()
		localStorage.user = JSON.stringify(userData)

		try {
			const headers = {
				"Authorization": `LINDEB-TOKEN user=${userData.id} token=${userData.authtoken}`,
				"Content-Type": "application/json",
			}
			this.settings = new Settings(this, userData.id, userData.authtoken)
			await Promise.all([this.updateTags(headers), this.settings.update()])
			await this.setStateAsync({user: userData})
			this.router.update()
			document.body.dispatchEvent(new CustomEvent("lindeb-login", {detail: userData}))
		} catch (err) {
			console.error("Fatal error while fetching tags:", err)
		}
	}

	/**
	 * Delete stored authentication information.
	 */
	async logout() {
		this.clearError()
		try {
			await fetch("api/auth/logout", {
				headers: this.headers,
				method: "POST",
			})
		} catch (err) {
			console.error("Error logging out:", err)
		}
		delete localStorage.user
		this.setState({user: undefined})
		window.location.hash = "#/"

		document.body.dispatchEvent(new Event("lindeb-logout"))
	}

	async saveTag(tag, component) {
		if (!this.isAuthenticated()) {
			return
		}
		this.clearError()

		const action = tag.id ? "updating tag" : "adding tag"

		try {
			const response = await fetch(`api/tag/${tag.id || "add"}`, {
				headers: this.headers,
				method: tag.id ? "PUT" : "POST",
				body: JSON.stringify(tag),
			})
			if (!response.ok) {
				await this.error(action, response)
				return
			}
			const newTag = await response.json()
			const tagsByID = new Map(this.state.tagsByID)
			const tagsByName = new Map(this.state.tagsByName)
			tagsByID.set(newTag.id, newTag)
			if (tag.id) {
				// If tag existed before, delete it from the tags by name map.
				tagsByName.delete(tag.name)
			}
			tagsByName.set(newTag.name, newTag)
			this.setState({tagsByID, tagsByName})
		} catch (err) {
			console.error(`Fatal error while ${action}:`, err)
		} finally {
			if (component) {
				component.finishEdit()
			}
		}
	}

	async deleteTag(id) {
		if (!this.isAuthenticated()) {
			return
		}
		this.clearError()

		try {
			const response = await fetch(`api/tag/${id}`, {
				headers: this.headers,
				method: "DELETE",
			})
			if (!response.ok) {
				await this.error("deleting tag", response)
				return
			}
			const deletedTag = this.state.tagsByID.get(id)
			this.setState({
				tagsByName: update(this.state.tagsByName, {$remove: [deletedTag.name]}),
				tagsByID: update(this.state.tagsByID, {$remove: [id]}),
			})
		} catch (err) {
			console.error("Fatal error while deleting tag:", err)
		}
	}

	/**
	 * Delete a link.
	 *
	 * @param {number} id The ID of the link to delete.
	 */
	async deleteLink(id) {
		if (!this.isAuthenticated()) {
			return
		}
		this.clearError()

		try {
			const response = await fetch(`api/link/${id}`, {
				headers: this.headers,
				method: "DELETE",
			})
			if (!response.ok) {
				await this.error("deleting link", response)
				return
			}
			for (const [index, link] of Object.entries(this.state.links)) {
				if (link.id === id) {
					this.setState({links: update(this.state.links, {$splice: [[index, 1]]})})
					break
				}
			}
		} catch (err) {
			console.error("Fatal error while deleting link:", err)
		}
	}

	/**
	 * Save a link.
	 *
	 * @param {Object} data The data of the link. Passed directly to the lindeb API.
	 * @param {string} data.url           The URL to save.
	 * @param {string} [data.title]       The title to give to the link.
	 * @param {string} [data.description] A brief description of the link.
	 */
	async addLink(data) {
		if (!this.isAuthenticated()) {
			return
		}
		this.clearError()

		try {
			const response = await fetch(`api/link/save`, {
				headers: this.headers,
				method: "POST",
				body: JSON.stringify(data),
			})
			if (!response.ok) {
				await this.error("saving link", response)
				return
			}
			window.location.href = "#/"
		} catch (err) {
			console.error("Fatal error while saving link:", err)
		}
	}

	/**
	 * Update a link.
	 *
	 * @param {Object} data The updated data of the link. Passed directly to the lindeb API.
	 * @param {number} data.id            The ID of the link to update.
	 * @param {string} [data.url]         The new URL.
	 * @param {string} [data.title]       The new title for the link.
	 * @param {string} [data.description] The new description for the link.
	 * @param {Link}   [component]        The component that triggered this call.
	 */
	async updateLink(data, component) {
		if (!this.isAuthenticated()) {
			return
		}
		this.clearError()

		try {
			const response = await fetch(`api/link/${data.id}`, {
				headers: this.headers,
				method: "PUT",
				body: JSON.stringify(data),
			})
			if (!response.ok) {
				await this.error("updating link", response)
				return
			}
			const body = await response.json()
			for (const [index, link] of Object.entries(this.state.links)) {
				if (link.id === body.id) {
					const links = this.state.links.slice()
					links[index] = body
					this.setState({links})
					break
				}
			}
		} catch (err) {
			console.error("Fatal error while updating link:", err)
		} finally {
			if (component) {
				component.finishEdit()
			}
		}
	}

	/**
	 * Open the link list with a specific query.
	 *
	 * @param {Query} query A Hashmux query object.
	 */
	async openLinkList(query) {
		if (!this.isAuthenticated()) {
			return
		}
		this.clearError()

		if (!query.has("page")) {
			query.set("page", 1)
		}
		if (!query.has("pagesize")) {
			query.set("pagesize", 10)
		}
		try {
			const linkResponse = await fetch(`api/links?${query.toString()}`, {
				headers: this.headers,
			})
			if (!linkResponse.ok) {
				await this.error("fetching links", linkResponse)
				return
			}
			const {links, totalCount} = await linkResponse.json()
			this.setState({
				view: VIEW_LINKS,
				links,
				page: +query.get("page"),
				pages: Math.ceil(totalCount / +query.get("pagesize")),
			})
		} catch (err) {
			console.error("Fatal error while fetching links:", err)
		}
	}

	/**
	 * Switch to a certain page in the current link list.
	 *
	 * @param {number} to The page to switch to.
	 */
	switchPage(to) {
		if (to < 1 || to > this.state.pages) {
			throw new Error("Invalid argument: Page number out of bounds.")
		}
		Query.set("page", to)
	}

	/**
	 * Open the link saving view.
	 *
	 * @param {Query} [query=Query.parse()] The Hashmux query object to get the default data from.
	 */
	openLinkAdder(query) {
		if (!this.isAuthenticated()) {
			return
		}
		this.clearError()
		if (!query) {
			query = Query.parse()
		}

		this.setState({
			view: VIEW_LINK_ADD,
			newLink: {
				url: query.get("url", 0, ""),
				tags: query.getAll("tag").join(", "),
				title: query.get("title", 0, ""),
				description: query.get("description", 0, ""),
			},
		})
	}

	getView() {
		if (!this.state.user) {
			return <LoginView error={this.state.error}/>
		}
		switch (this.state.view) {
			case VIEW_TAGS:
				return <TagView tags={this.state.tagsByID}/>
			case VIEW_SETTINGS:
				return <SettingsView tab={this.state.settingsTab} showExtensionSettings={this.state.hasExtension}
									 settings={this.settings}/>
			case VIEW_LINK_ADD:
				return <LinkAddView error={this.state.error} {...this.state.newLink}/>
			case VIEW_IMPORT_LINKS:
				return <LinkImportView/>
			case VIEW_NOT_FOUND:
				return (
					<div style={{textAlign: "center", marginTop: "2rem"}}>
						<h1>Oh noes!</h1>
						<img src="https://http.cat/404" alt="http.cat/404"/>
					</div>
				)
			default:
			case VIEW_LINKS:
				return <LinkView
					error={this.state.error}
					links={this.state.links}
					page={this.state.page}
					pageCount={this.state.pages}/>
		}
	}

	render() {
		return (
			<div className="lindeb">
				<Topbar ref={topbar => this.topbar = topbar}
						showSearch={this.state.view === VIEW_LINKS}
						showSettings={this.state.view !== VIEW_SETTINGS}/>

				<main ref={ref => this.main = ref} className={this.isAuthenticated() ? "authenticated" : ""}>
					{this.getView()}
				</main>
			</div>
		)
	}
}

export default Lindeb
