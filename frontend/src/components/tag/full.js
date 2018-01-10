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
import EditButton from "../../res/edit.svg"
import SaveButton from "../../res/save.svg"
import CancelButton from "../../res/cancel.svg"
import DeleteButton from "../../res/delete.svg"
import Spinner from "../../res/spinner.svg"

class FullTag extends Component {
	static contextTypes = {
		saveTag: PropTypes.func,
		deleteTag: PropTypes.func,
		finishEditingTag: PropTypes.func,
	}

	constructor(props, context) {
		super(props, context)
		this.state = Object.assign({
			editing: false,
			name: "",
			description: "",
		}, props)
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
		this.setState(Object.assign({editing: true, name: "", description: ""}, this.props))
	}

	finishEdit() {
		this.context.finishEditingTag(this)
		this.setState({editing: false, loading: false})
	}

	saveEdit(evt) {
		if (this.state.loading) {
			return
		}
		this.setState({loading: true})
		if (evt) {
			evt.preventDefault()
		}
		const tag = Object.assign({}, this.state)
		delete tag.editing
		this.context.saveTag(tag, this)
	}

	delete() {
		this.setState({editing: false, loading: false, deleting: true})
		this.context.deleteTag(this.props.id)
	}

	renderEditor() {
		return (
			<form className="editing full tag" onSubmit={this.saveEdit}>
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
				<input placeholder="Name" required name="name" className="name"
					   value={this.state.name} onChange={this.handleInputChange}/>
				<textarea placeholder="Description" name="description" rows="3" className="description"
						  value={this.state.description} onChange={this.handleInputChange}/>
			</form>
		)
	}

	render() {
		if (this.state.editing) {
			return this.renderEditor()
		}
		return (
			<div className="full tag">
				<div className="buttons">
					<button className="overflow-padding hover-only edit" type="button" onClick={this.edit}>
						<EditButton/>
					</button>
				</div>
				<div className="name">{this.props.name}</div>
				<p className="description">{this.props.description}</p>
			</div>
		)
	}
}

export default FullTag
