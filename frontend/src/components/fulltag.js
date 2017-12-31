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
import EditButton from "../res/edit.svg"
import SaveButton from "../res/save.svg"
import CancelButton from "../res/cancel.svg"
import DeleteButton from "../res/delete.svg"

class FullTag extends Component {
	static contextTypes = {
		saveTag: PropTypes.func,
		deleteTag: PropTypes.func,
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
		this.setState(Object.assign({editing: true}, this.props))
	}

	finishEdit() {
		this.setState({editing: false})
	}

	saveEdit() {
		this.finishEdit()
		const tag = Object.assign({}, this.state)
		delete tag.editing
		this.context.saveTag(tag)
	}

	delete() {
		this.finishEdit()
		this.context.deleteTag(this.props.id)
	}

	render() {
		if (this.state.editing) {
			return (
				<div className="editing full tag">
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
					<input placeholder="Name" required name="name" className="name" value={this.state.name} onChange={this.handleInputChange}/>
					<textarea placeholder="Description" name="description" rows="3" className="description" value={this.state.description} onChange={this.handleInputChange}/>
				</div>
			)
		}
		return (
			<div className="full tag">
				<div className="buttons">
					<button className="overflow-padding hover-only edit" type="button" onClick={this.edit}>
						<EditButton/>
					</button>
				</div>
				<div className="name">{this.props.name}</div>
				<div className="description">{this.props.description}</div>
			</div>
		)
	}
}

export default FullTag
