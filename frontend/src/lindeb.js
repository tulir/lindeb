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
import Errorable from "./util/errorable"
import Settings from "./settings"
import Topbar from "./components/topbar"
import LoginView from "./components/login"
import TagView from "./components/tag/list"
import LinkView from "./components/link/list"
import LinkAddView from "./components/link/add"
import SettingsView from "./components/settings/view"

const
	VIEW_LINKS = "links",
	VIEW_LINK_ADD = "link-add",
	VIEW_TAGS = "tags",
	VIEW_SETTINGS = "settings",
	VIEW_NOT_FOUND = "404"

/**
 * The main component of lindeb. Contains most of API communication and decides what to render.
 */
class Lindeb extends Errorable(Component) {
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
			error: this.throwError.bind(this),
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
			mounted: false,
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
		this.router.handle("/settings", () => this.setState({view: VIEW_SETTINGS}))
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
		if (this.settings.scrollbar === "native") {
			if (this.ps) {
				this.ps.destroy(this.main)
				this.ps = undefined
				this.main.style["overflow-y"] = "auto"
				this.main.style["-webkit-overflow-scrolling"] = "touch"
			}
			return
		} else if (this.settings.scrollbar === "custom" || !this.hasNiceNativeScrollbar()) {
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
	async throwError(action, result) {
		const text = await result.text()
		console.error(`Error while ${action}: ${text}`)
		console.error(result)
		if (action === "logging in") {
			switch (result.status) {
				case 401:
					throw new Error("Invalid username or password")
				case 409:
					throw new Error("Username is already in use")
				default:
				// continue to next switch
			}
		}
		switch (result.status) {
			case 400:
				throw new Error(`Bad request: ${text}`)
			case 401:
				// Invalid authentication.
				delete localStorage.user
				return
			case 413:
				throw new Error(text)
			case 429:
				throw new Error("Rate limit encountered: Please wait before re-sending request")
			case 500:
				throw new Error("Internal server error")
			case 502:
				throw new Error("Could not connect to lindeb backend")
			default:
				throw new Error(`Unknown error: ${result.statusText}: ${text}`)
		}
	}

	setStateAsync(data) {
		return new Promise(resolve => this.setState(data, resolve))
	}

	async updateTags(headers = this.headers) {
		const tagResponse = await fetch("api/tags", {headers})
		if (!tagResponse.ok) {
			await this.throwError("fetching tags", tagResponse)
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
	async login(userData, component) {
		if (!userData.id || !userData.authtoken) {
			throw new Error("Invalid argument: User data does not contain user and auth token.")
		}
		this.clearError()
		localStorage.user = JSON.stringify(userData)

		const headers = {
			"Authorization": `LINDEB-TOKEN user=${userData.id} token=${userData.authtoken}`,
			"Content-Type": "application/json",
		}
		this.settings = new Settings(this, userData.id, userData.authtoken)
		try {
			await Promise.all([this.updateTags(headers), this.settings.update()])
			await this.setStateAsync({user: userData})
			this.router.update()
			document.body.dispatchEvent(new CustomEvent("lindeb-login", {detail: userData}))
		} catch (err) {
			this.showError(err.message, component)
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
				await this.throwError(action, response)
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
			if (component) {
				component.finishEdit()
			}
		} catch (err) {
			this.showError(err.message, component)
		}
	}

	async deleteTag(id, component) {
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
				await this.throwError("deleting tag", response)
				return
			}
			const deletedTag = this.state.tagsByID.get(id)
			this.setState({
				tagsByName: update(this.state.tagsByName, {$remove: [deletedTag.name]}),
				tagsByID: update(this.state.tagsByID, {$remove: [id]}),
			})
		} catch (err) {
			this.showError(err.message, component)
		}
	}

	/**
	 * Delete a link.
	 *
	 * @param {number} id The ID of the link to delete.
	 */
	async deleteLink(id, component) {
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
				await this.throwError("deleting link", response)
				return
			}
			for (const [index, link] of Object.entries(this.state.links)) {
				if (link.id === id) {
					this.setState({links: update(this.state.links, {$splice: [[index, 1]]})})
					break
				}
			}
		} catch (err) {
			this.showError(err.message, component)
		}
	}

	/**
	 * Check if a new or updated link contains tags that we haven't seen before.
	 *
	 * If such tags are found, {@link #updateTags()} will be called to update all the tags in the cache.
	 *
	 * @param {object}   link      The link data.
	 * @param {string[]} link.tags The tags to check.
	 */
	checkForNewTags(link) {
		if (!link || !link.tags) {
			return
		}

		for (const tag of link.tags) {
			if (!this.state.tagsByName.has(tag)) {
				// New tag found -> update tags.
				this.updateTags().catch(err => console.error("Fatal error while fetching tags:", err))
				// We'll update all the tags, so no need to check if any more of them are new.
				break
			}
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
	async addLink(data, component) {
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
				await this.throwError("saving link", response)
				return
			}
			const link = await response.json()
			this.checkForNewTags(link)
			window.location.href = "#/"
		} catch (err) {
			this.showError(err.message, component)
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
				await this.throwError("updating link", response)
				return
			}
			const body = await response.json()
			this.checkForNewTags(body)
			for (const [index, link] of Object.entries(this.state.links)) {
				if (link.id === body.id) {
					const links = this.state.links.slice()
					links[index] = body
					this.setState({links})
					break
				}
			}
			if (component) {
				component.finishEdit()
			}
		} catch (err) {
			this.showError(err.message, component)
		}
	}

	/**
	 * Open the link list with a specific query.
	 *
	 * @param {Query} query A Hashmux query object.
	 */
	async openLinkList(query, component) {
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
				await this.throwError("fetching links", linkResponse)
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
			this.showError(err.message, component)
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
				return <TagView error={this.state.error} tags={this.state.tagsByID}/>
			case VIEW_SETTINGS:
				return <SettingsView showExtensionSettings={this.state.hasExtension} settings={this.settings}/>
			case VIEW_LINK_ADD:
				return <LinkAddView {...this.state.newLink}/>
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
						mainView={this.state.view === VIEW_LINKS}
						showSettings={this.state.view !== VIEW_SETTINGS}
						showNewLink={this.state.view !== VIEW_LINK_ADD}/>

				<main ref={ref => this.main = ref} className={this.isAuthenticated() ? "authenticated" : ""}>
					{this.getView()}
				</main>
			</div>
		)
	}
}

export default Lindeb
