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

class Tag extends Component {
	static contextTypes = {
		tagsByName: PropTypes.object,
	}

	constructor(props, context) {
		super(props, context)
		this.data = this.context.tagsByName.get(this.props.name)
	}

	handleInputChange(event) {
		this.setState({[event.target.name]: event.target.value})
	}

	render() {
		return (
			<div className="tag" title={this.data.description}>
				{this.props.name}
			</div>
		)
	}
}

export default Tag