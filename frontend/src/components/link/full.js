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
import ReactTags from "react-tag-autocomplete"
import Errorable from "../../util/errorable"
import Tag from "../tag/partial"
import EditButton from "../../res/edit.svg"
import SaveButton from "../../res/save.svg"
import CancelButton from "../../res/cancel.svg"
import DeleteButton from "../../res/delete.svg"
import Spinner from "../../res/spinner.svg"

class Link extends Errorable(Component) {
	static contextTypes = {
		topbar: PropTypes.object,
		deleteLink: PropTypes.func,
		updateLink: PropTypes.func,
		tagsByName: PropTypes.object,
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
		this.addTag = this.addTag.bind(this)
		this.deleteTag = this.deleteTag.bind(this)
	}

	handleInputChange(event) {
		this.setState({[event.target.name]: event.target.value})
	}

	edit() {
		const newState = Object.assign({editing: true}, this.props)
		newState.tags = newState.tags.map(tag => this.context.tagsByName.get(tag) || {name: tag})
		newState.tagSuggestions = Array.from(this.context.tagsByName.values())
		this.setState(newState)
	}

	finishEdit() {
		this.setState({error: "", editing: false, loading: false})
	}

	saveEdit(evt) {
		if (this.state.loading) {
			return
		}
		this.setState({loading: true})
		if (evt) {
			evt.preventDefault()
		}
		const link = Object.assign({}, this.state)
		link.tags = link.tags.map(tag => tag.name)
		delete link.editing
		delete link.tagSuggestions
		delete link.html
		this.context.updateLink(link, this)
	}

	delete() {
		this.setState({editing: false, loading: false, deleting: true})
		this.context.deleteLink(this.props.id, this)
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

	renderEditor() {
		return (
			<form className="link editing" onSubmit={this.saveEdit}>
				<div className="error">{this.state.error}</div>
				<div className="buttons">
					<button className="delete" type="button" onClick={this.delete}>
						{this.state.deleting ? <Spinner/> : <DeleteButton/>}
					</button>
					<button className="save" type="submit">
						{this.state.loading ? <Spinner/> : <SaveButton/>}
					</button>
					<button className="cancel" type="button" onClick={this.finishEdit}>
						<CancelButton/>
					</button>
				</div>
				<input name="title" placeholder="Title" type="text" className="title"
					   value={this.state.title} onChange={this.handleInputChange}/>
				<ReactTags delimiterChars={[","]} tags={this.state.tags} suggestions={this.state.tagSuggestions}
						   handleAddition={this.addTag} handleDelete={this.deleteTag} allowNew={true}/>
				<input name="url" placeholder="URL" type="text" className="url"
					   value={this.state.url} onChange={this.handleInputChange}/>
				<textarea rows="4" name="description" placeholder="Description" className="description"
						  value={this.state.description} onChange={this.handleInputChange}/>
			</form>
		)
	}

	render() {
		if (this.state.editing) {
			return this.renderEditor()
		}
		return (
			<article className="link">
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
