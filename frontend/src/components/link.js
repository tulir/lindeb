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
import Tag from "./tag"
import EditButton from "../res/edit.svg"
import SaveButton from "../res/save.svg"
import CancelButton from "../res/cancel.svg"
import DeleteButton from "../res/delete.svg"

class Link extends Component {
	static contextTypes = {
		topbar: PropTypes.object,
		deleteLink: PropTypes.func,
		updateLink: PropTypes.func,
	}

	constructor(props, context) {
		super(props, context)
		this.state = {
			editing: false,
		}
		this.edit = this.edit.bind(this)
		this.finishEdit = this.finishEdit.bind(this)
		this.saveEdit = this.saveEdit.bind(this)
		this.delete = this.delete.bind(this)
		this.handleInputChange = this.handleInputChange.bind(this)
	}

	handleInputChange(event) {
		this.setState({[event.target.name]: event.target.value})
	}

	edit() {
		const newState = Object.assign({editing: true}, this.props)
		newState.tags = newState.tags.join(", ")
		this.setState(newState)
	}

	finishEdit() {
		this.setState({editing: false})
	}

	saveEdit() {
		this.finishEdit()
		const link = Object.assign({}, this.state)
		link.tags = link.tags.split(",").map(tag => tag.trim()).filter(tag => !!tag)
		delete link.editing
		delete link.html
		this.context.updateLink(link)
	}

	delete() {
		this.finishEdit()
		this.context.deleteLink(this.props.id)
	}

	render() {
		if (this.state.editing) {
			return (
				<article className={`link ${this.state.editing ? "editing" : ""}`}>
					<div className="buttons">
						<button className="delete" type="button" onClick={this.delete}>
							<DeleteButton/>
						</button>
						<button className="save" type="button" onClick={this.saveEdit}>
							<SaveButton/>
						</button>
						<button className="cancel" type="button" onClick={this.finishEdit}>
							<CancelButton/>
						</button>
					</div>
					<input name="title" placeholder="Title" type="text" className="title" value={this.state.title} onChange={this.handleInputChange}/>
					<input name="tags" placeholder="Comma-separated tags" type="text" className="tags-editor" value={this.state.tags} onChange={this.handleInputChange}/>
					<input name="url" placeholder="URL" type="text" className="url" value={this.state.url} onChange={this.handleInputChange}/>
					<textarea rows="4" name="description" placeholder="Description" className="description" value={this.state.description} onChange={this.handleInputChange}/>
				</article>
			)
		}
		return (
			<article className={`link ${this.state.editing ? "editing" : ""}`}>
				<div className="buttons">
					<button className="hover-only edit" type="button" onClick={this.edit}>
						<EditButton/>
					</button>
				</div>
				<header><h1 className="title">
					<a href={this.props.url}>{this.props.title}</a>
				</h1></header>
				<div className="tags">
					{this.props.tags.map(tag => <Tag key={tag} name={tag}/>)}
				</div>
				<address onClick={() => this.context.topbar.toggle("domain", this.props.domain)}>
					{this.props.domain}
				</address>
				<p>{this.props.description}</p>
			</article>
		)
	}
}

export default Link
