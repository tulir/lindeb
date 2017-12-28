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

class LinkAddView extends Component {
	static contextTypes = {
		addLink: PropTypes.func,
	}

	get bookmarklet() {
		return `javascript:void(open("${window.location.protocol}//${window.location.host}/#/save?url=" + encodeURIComponent(location.href) + "&title=" + encodeURIComponent(document.title || "")))`
	}

	constructor(props) {
		super(props)
		this.state = Object.assign({}, props)
		this.handleInputChange = this.handleInputChange.bind(this)
		this.save = this.save.bind(this)
		this.exit = this.exit.bind(this)
	}

	handleInputChange(event) {
		this.setState({[event.target.name]: event.target.value})
	}

	exit() {
		window.location.hash = "#/"
	}

	save() {
		const link = Object.assign({}, this.state)
		link.tags = link.tags.split(",").map(tag => tag.trim()).filter(tag => !!tag)
		this.context.addLink(link)
	}

	render() {
		return (
			<div className="add-link">
				<input name="title" placeholder="Title" type="text" className="title" value={this.state.title} onChange={this.handleInputChange}/>
				<input name="tags" placeholder="Comma-separated tags" type="text" className="tags-editor" value={this.state.tags} onChange={this.handleInputChange}/>
				<input name="url" placeholder="URL" type="text" className="url" value={this.state.url} onChange={this.handleInputChange}/>
				<textarea rows="4" name="description" placeholder="Description" className="description" value={this.state.description} onChange={this.handleInputChange}/>

				<div className="buttons">
					<button className="main-color cancel" type="button" onClick={this.exit}>
						Cancel
					</button>
					<button className="main-color save" type="button" onClick={this.save}>
						Save
					</button>
				</div>

				<p className="bookmarklet">
					P.S. You can quickly open this link adder by dragging this link to your bookmark toolbar: <a href={this.bookmarklet}>Save to lindeb</a>.
				</p>
			</div>
		)
	}
}

export default LinkAddView
