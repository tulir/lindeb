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
import SearchIcon from "../res/search.svg"
import Back from "../res/back.svg"
import {Query} from "hashmux"

class Topbar extends Component {
	static contextTypes = {
		logout: PropTypes.func,
		isAuthenticated: PropTypes.func,
		search: PropTypes.func,
	}

	static searchFieldRegex = /([A-Za-z]+)=(".+?"|[^\s]+)(?:\s+)?/g

	constructor(props, context) {
		super(props, context)
		this.state = Object.assign({search: this.queryToSearch()})
		this.searchQueryChanged = this.searchQueryChanged.bind(this)
		this.searchEntered = this.searchEntered.bind(this)
		this.searchTimeout = -1
	}

	searchQueryChanged(event) {
		clearTimeout(this.searchTimeout)
		this.searchTimeout = setTimeout(() => this.searchEntered(), 500)
		this.setState({search: event.target.value})
	}

	searchEntered(event) {
		if (event && event.key !== "enter") {
			return
		}

		clearTimeout(this.searchTimeout)
		this.searchToQuery().setCurrentURL(true)
		window.onhashchange()
	}

	toggle(key, value) {
		const str = value.includes(" ") ? `${key}="${value}"` : `${key}=${value}`
		let search = this.state.search
		if (search.includes(str)) {
			search = search.replace(str, "")
		} else {
			search += ` ${str}`
		}
		search = search.trim()
		this.setState({search}, this.searchEntered)
	}

	/**
	 * Convert the search string in the topbar into a Hashmux Query object that can be passed to the lindeb API.
	 *
	 * @returns {Query} The Hashmux Query object.
	 */
	searchToQuery() {
		const query = new Query()
		let search = this.state.search.replace(Topbar.searchFieldRegex, (_, key, value) => {
			if (value.charAt(0) === `"` && value.charAt(value.length - 1) === `"`) {
				value = value.substr(1, value.length - 2)
			}
			query.add(key, value)
			return ""
		})
		if (search.includes("exclusive-tags")) {
			query.set("exclusivetags", "true")
			search = search.replace("exclusive-tags", "")
		}
		search = search.trim()
		if (search.length > 0) {
			query.set("search", search)
		}
		return query
	}

	/**
	 * Collect all values under a given key and return them as a search-compatible string.
	 *
	 * @private
	 * @param   {Query}  query The Hashmux Query object to use.
	 * @param   {string} key   The name of the key to look for.
	 * @returns {string}       The search-compatible string of the query values.
	 */
	getQueryArray(query, key) {
		let result = ""
		for (const value of query.getAll(key)) {
			result += value.includes(" ")
				? `${key}="${value}"`
				: `${key}=${value}`
		}
		return result
	}

	/**
	 * Convert the values in a Hashmux Query object into a search bar query.
	 *
	 * @param   {Query}  [query] The Hashmux Query object to use. If undefined, Query.parse() is used as the value.
	 * @returns {string}         The search string that matches the given Query object.
	 */
	queryToSearch(query) {
		if (!query) {
			query = Query.parse()
		}
		let search = ""
		search += this.getQueryArray(query, "domain")
		if (query.get("exclusivetags")) {
			search += "exclusive-tags "
		}
		search += this.getQueryArray(query, "tag")
		search += query.get("search") || ""
		search = search.trim()
		return search
	}

	hideUnless(prop) {
		if (!this.props[prop]) {
			return "hidden"
		}
		return ""
	}

	render() {
		if (!this.context.isAuthenticated()) {
			return <header className="topbar"/>
		}
		return (
			<header className="topbar">
				<div className="left buttons">
					<button className="logo"
							onClick={() => {
								window.location.href = "#/"
								this.setState({search: ""})
							}}>
						{this.props.mainView ? <img src="favicon-white.png" alt="lindeb"/> : <Back/>}
					</button>
					<button type="button"
							className={`main-color new-link ${this.hideUnless("showNewLink")}`}
							onClick={() => window.location.href = "#/save"}>
						New Link
					</button>
					<button type="button"
							className={`main-color tags ${this.hideUnless("showTags")}`}
							onClick={() => window.location.href = "#/tags"}>
						Tags
					</button>
				</div>
				<div className={`search-wrapper ${this.hideUnless("mainView")}`}>
					<SearchIcon/>
					<input type="text" className="search" placeholder="Search" value={this.state.search}
						   onKeyPress={this.searchEntered} onChange={this.searchQueryChanged}/>
				</div>
				<div className="right buttons">
					<button type="button"
							className={`main-color settings ${this.hideUnless("showSettings")}`}
							onClick={() => window.location.href = "#/settings"}>
						Settings
					</button>
					<button type="button"
							className="main-color logout"
							onClick={this.context.logout}>
						Sign out
					</button>
				</div>
			</header>
		)
	}
}

export default Topbar
