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
import FullTag from "./full"

class TagListView extends Component {
	static childContextTypes = {
		finishEditingTag: PropTypes.func,
	}

	getChildContext() {
		return {
			finishEditingTag: this.finishEditingTag.bind(this),
		}
	}

	constructor(props, context) {
		super(props, context)
		this.state = {
			creating: false
		}
	}

	finishEditingTag(tag) {
		if (!tag.id) {
			this.setState({creating: false})
		}
	}

	newTag() {
		this.setState({creating: true})
	}

	render() {
		return (
			<div className="taglist">
				<button type="button" className="main-color newtag" onClick={() => this.newTag()}>New tag</button>
				<div className="error">{this.props.error}</div>
				{this.state.creating ? <FullTag editing={true}/> : ""}
				{this.props.tags.map(tag => <FullTag key={tag.id} {...tag}/>)}
			</div>
		)
	}
}

export default TagListView
