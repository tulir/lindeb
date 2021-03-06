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

import update from "immutability-helper"
import React, {Component} from "react"
import PropTypes from "prop-types"
import ReactTags from "react-tag-autocomplete"
import Errorable from "../../util/errorable"
import Spinner from "../../res/spinner.svg"

class LinkAddView extends Errorable(Component) {
	static contextTypes = {
		addLink: PropTypes.func,
		tagsByName: PropTypes.object,
	}

	get bookmarklet() {
		return `javascript:void(open("${window.location.protocol}//${window.location.host}/#/save?url=" + encodeURIComponent(location.href) + "&title=" + encodeURIComponent(document.title || "")))`
	}

	constructor(props, context) {
		super(props, context)
		this.state = Object.assign({}, props, {
			tags: [],
			tagSuggestions: Array.from(this.context.tagsByName.values()),
		})
		this.handleInputChange = this.handleInputChange.bind(this)
		this.save = this.save.bind(this)
		this.exit = this.exit.bind(this)
		this.addTag = this.addTag.bind(this)
		this.deleteTag = this.deleteTag.bind(this)
	}

	handleInputChange(event) {
		this.setState({[event.target.name]: event.target.value})
	}

	exit() {
		window.location.hash = "#/"
	}

	save() {
		this.setState({saving: true})
		const link = Object.assign({}, this.state)
		link.tags = link.tags.map(tag => tag.name)
		this.context.addLink(link, this)
	}

	addTag(tag) {
		// Don't allow duplicate tags
		if (this.state.tags.some(existingTag => existingTag.name === tag.name)) {
			return
		}
		this.setState({
			tags: update(this.state.tags, {$push: [tag]}),
		})
	}

	deleteTag(id) {
		this.setState({
			tags: update(this.state.tags, {$splice: [[id, 1]]}),
		})
	}

	render() {
		return (
			<form className="add-link lindeb-content">
				<div className="error">{this.state.error}</div>
				<input maxLength={255} name="title" placeholder="Title" type="text" className="title"
					   value={this.state.title} onChange={this.handleInputChange}/>
				<ReactTags delimiterChars={[","]} tags={this.state.tags} suggestions={this.state.tagSuggestions}
						   handleAddition={this.addTag} handleDelete={this.deleteTag} allowNew={true}/>
				<input maxLength={2047} name="url" placeholder="URL (required)" required type="text" className="url"
					   value={this.state.url} onChange={this.handleInputChange}/>
				<textarea maxLength={65535} rows="4" name="description" placeholder="Description" className="description"
						  value={this.state.description} onChange={this.handleInputChange}/>

				<div className="buttons">
					<button className="main-color cancel" type="button" onClick={this.exit}>
						Cancel
					</button>
					<button className="main-color save" type="button" disabled={this.state.saving} onClick={this.save}>
						Save
					</button>
				</div>
				{this.state.saving ? <Spinner style={{marginTop: ".5rem"}}/> : ""}

				<p className="bookmarklet">
					You can quickly open this link adder by dragging this link to your bookmark toolbar: <a
					href={this.bookmarklet}>Save to lindeb</a>.
				</p>
			</form>
		)
	}
}

export default LinkAddView
