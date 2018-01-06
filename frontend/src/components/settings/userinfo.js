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
import Spinner from "../../res/spinner.svg"

class UserInfo extends Component {
	constructor(props, context) {
		super(props, context)
		this.state = {
			submitting: false,
		}
		this.handleInputChange = this.handleInputChange.bind(this)
		this.submit = this.submit.bind(this)
	}

	handleInputChange(event) {
		this.setState({[event.target.name]: event.target.value})
	}

	submit(evt) {
		if (this.state.submitting) {
			return
		}
		this.setState({submitting: true})
		if (evt) {
			evt.preventDefault()
		}

		alert("User info changing not yet implemented 3:")
	}

	render() {
		return (
			<form className="userinfo section" onSubmit={this.submit}>
				<h1>User info</h1>
				<input placeholder="New password" required name="password"
					   value={this.state.password} onChange={this.handleInputChange}/>

				<input placeholder="Current password" required name="currentPassword"
					   value={this.state.currentPassword} onChange={this.handleInputChange}/>


				<button className="save" type="submit">
					Save changes
				</button>

				{this.state.submitting ? <Spinner/> : ""}
			</form>
		)
	}
}

export default UserInfo
