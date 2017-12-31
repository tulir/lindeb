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
import {Hashmux, Query} from "hashmux"
import Topbar from "./components/topbar"
import LoginView from "./components/login"
import LinkView from "./components/linklist"
import LinkAddView from "./components/addlink"

const
	VIEW_LINKS = "links",
	VIEW_LINK_ADD = "link-add",
	VIEW_TAGS = "tags",
	VIEW_SETTINGS = "settings"

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
		switchPage: PropTypes.func,
		isAuthenticated: PropTypes.func,
		error: PropTypes.func,

		tagsByID: PropTypes.object,
		tagsByName: PropTypes.object,
		topbar: PropTypes.object,
		user: PropTypes.object,
		showSearch: PropTypes.bool,
	}

	getChildContext() {
		return {
			login: this.login.bind(this),
			logout: this.logout.bind(this),
			deleteLink: this.deleteLink.bind(this),
			updateLink: this.updateLink.bind(this),
			addLink: this.addLink.bind(this),
			switchPage: this.switchPage.bind(this),
			isAuthenticated: this.isAuthenticated.bind(this),
			error: this.error.bind(this),

			tagsByID: this.state.tagsByID,
			tagsByName: this.state.tagsByName,
			topbar: this.topbar,
			user: this.state.user,
			showSearch: this.state.view === VIEW_LINKS,
		}
	}

	constructor(props) {
		super(props)
		this.state = {
			user: undefined,
			page: 1,
			pageSize: 10,
		}
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
		this.router.listen()
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
		localStorage.user = JSON.stringify(userData)

		try {
			const tagFetchResult = await fetch("api/tags", {
				headers: {
					"Authorization": `LINDEB-TOKEN user=${userData.id} token=${userData.authtoken}`,
					"Content-Type": "application/json",
				},
			})
			if (!tagFetchResult.ok) {
				await this.error("fetching tags", tagFetchResult)
				return
			}
			const rawTags = await tagFetchResult.json() || []
			const tagsByID = new Map(rawTags.map(tag => [tag.id, tag]))
			const tagsByName = new Map(rawTags.map(tag => [tag.name, tag]))

			this.setState({user: userData, tagsByID, tagsByName}, () => this.router.update())
		} catch (err) {
			console.error("Fatal error while fetching tags:", err)
		}
	}

	/**
	 * Delete stored authentication information.
	 */
	logout() {
		delete localStorage.user
		this.setState({user: undefined})
		window.location.hash = "#/"
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
					const links = this.state.links.slice()
					links.splice(index, 1)
					this.setState({links})
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
	 */
	async updateLink(data) {
		if (!this.isAuthenticated()) {
			return
		}

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
			console.error("Fatal error while editing link:", err)
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
				return undefined // <TagView/>
			case VIEW_SETTINGS:
				return undefined // <SettingsView/>
			case VIEW_LINK_ADD:
				return <LinkAddView error={this.state.error} {...this.state.newLink}/>
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
				<Topbar ref={topbar => this.topbar = topbar}/>

				<main className={this.isAuthenticated() ? "authenticated" : ""}>
					{this.getView()}
				</main>
			</div>
		)
	}
}

export default Lindeb
