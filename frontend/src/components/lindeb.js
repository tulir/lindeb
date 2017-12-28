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
import {Hashmux} from "hashmux"
import Topbar from "./topbar"
import LoginView from "./login"
import LinkView from "./linklist"

const
	VIEW_LINKS = "links",
	VIEW_TAGS = "tags",
	VIEW_SETTINGS = "settings"

class Lindeb extends Component {
	static childContextTypes = {
		login: PropTypes.func,
		logout: PropTypes.func,
		deleteLink: PropTypes.func,
		updateLink: PropTypes.func,
		tagsByID: PropTypes.object,
		tagsByName: PropTypes.object,
		isAuthenticated: PropTypes.func,
		topbar: PropTypes.object,
	}

	getChildContext() {
		return {
			login: this.login.bind(this),
			logout: this.logout.bind(this),
			deleteLink: this.deleteLink.bind(this),
			updateLink: this.updateLink.bind(this),
			tagsByID: this.state.tagsByID,
			tagsByName: this.state.tagsByName,
			isAuthenticated: this.isAuthenticated.bind(this),
			topbar: this.topbar,
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

		this.router = new Hashmux()
		this.router.handle("/", (_, query) => this.openLinkList(query))
		this.router.handle("/tags", () => this.setState({view: VIEW_TAGS}))
		this.router.handle("/settings", () => this.setState({view: VIEW_SETTINGS}))
	}

	async componentDidMount() {
		if (!this.state.user && localStorage.user) {
			await this.login(JSON.parse(localStorage.user))
		}
		this.router.listen()
	}

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

	isAuthenticated() {
		return !!this.state.user
	}

	async login(userData) {
		localStorage.user = JSON.stringify(userData)

		const tagFetchResult = await fetch("api/tags", {
			headers: {
				"Authorization": `LINDEB-TOKEN user=${userData.id} token=${userData.authtoken}`,
				"Content-Type": "application/json",
			},
		})
		if (!tagFetchResult.ok) {
			console.log("Unhandled error fetching tags:", await tagFetchResult.text())
			return
		}
		const rawTags = await tagFetchResult.json()
		const tagsByID = new Map(rawTags.map(tag => [tag.id, tag]))
		const tagsByName = new Map(rawTags.map(tag => [tag.name, tag]))

		this.setState({user: userData, tagsByID, tagsByName}, () => this.router.update())
	}

	logout() {
		delete localStorage.user
		this.setState({user: undefined})
		window.location.hash = "#/"
	}

	async deleteLink(id) {
		if (!this.isAuthenticated()) {
			return
		}

		await fetch(`api/link/${id}`, {
			headers: this.headers,
			method: "DELETE"
		})

		for (const [index, link] of Object.entries(this.state.links)) {
			if (link.id === id) {
				const links = this.state.links.slice()
				links.splice(index, 1)
				this.setState({links})
				break
			}
		}
	}

	async updateLink(data) {
		if (!this.isAuthenticated()) {
			return
		}

		const response = await fetch(`api/link/${data.id}`, {
			headers: this.headers,
			method: "PUT",
			body: JSON.stringify(data),
		})
		const body = await response.json()
		for (const [index, link] of Object.entries(this.state.links)) {
			if (link.id === body.id) {
				const links = this.state.links.slice()
				links[index] = body
				this.setState({links})
				break
			}
		}
		// TODO handle errors
//		setTimeout(() => this.router.update(), 200)
	}

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
		const linkResponse = await fetch(`api/links?${query.toString()}`, {
			headers: this.headers,
		})
		const {links, totalCount} = await linkResponse.json()
		this.setState({
			view: VIEW_LINKS,
			links,
			pages: Math.ceil(totalCount / +query.get("pagesize")),
		})
	}

	getView() {
		if (!this.state.user) {
			return <LoginView/>
		}
		switch (this.state.view) {
		case VIEW_TAGS:
			return undefined // <TagView/>
		case VIEW_SETTINGS:
			return undefined // <SettingsView/>
		default:
		case VIEW_LINKS:
			return <LinkView links={this.state.links}/>
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
