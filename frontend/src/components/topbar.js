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

class Topbar extends Component {
	static contextTypes = {
		logout: PropTypes.func,
		isAuthenticated: PropTypes.func,
	}

	constructor(props, context) {
		super(props, context)
		this.state = Object.assign({search: ""})
		this.searchQueryChanged = this.searchQueryChanged.bind(this)
	}

	searchQueryChanged(event) {
		this.setState({search: event.target.value})
	}

	render() {
		if (!this.context.isAuthenticated()) {
			return <header className="topbar"/>
		}
		return (
			<header className="topbar">
				<div className="brand-wrapper">
					<h1 className="brand">lindeb</h1>
				</div>
				<div className="search-wrapper">
					<div className="centered-search-wrapper">
						<SearchIcon/>
						<input type="text" className="search" placeholder="Search" onChange={this.searchQueryChanged}/>
					</div>
				</div>
				<div className="control-buttons">
					<button type="button" className="logout" onClick={this.context.logout}>Sign out</button>
				</div>
			</header>
		)
	}
}

export default Topbar
