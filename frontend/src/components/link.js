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
import Tag from "./tag"

class Link extends Component {
	static contextTypes = {}

	constructor(props, context) {
		super(props, context)
		this.state = {}
	}

	handleInputChange(event) {
		this.setState({[event.target.name]: event.target.value})
	}

	render() {
		return (
			<article className="link">
				<header><h1 className="title">
					<a href={this.props.url}>{this.props.title}</a>
				</h1></header>
				<div className="tags">
					{this.props.tags.map(tag => <Tag key={tag} name={tag}/>)}
				</div>
				<address>{this.props.domain}</address>
				<p>{this.props.description}</p>
			</article>
		)
	}
}

export default Link
