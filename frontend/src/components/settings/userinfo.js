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

import PropTypes from "prop-types"
import React, {Component} from "react"
import Spinner from "../../res/spinner.svg"

class UserInfo extends Component {
	static contextTypes = {
		headers: PropTypes.func,
	}

	constructor(props, context) {
		super(props, context)
		this.state = {
			submitting: false,
			password: "",
			currentPassword: "",
		}
		this.handleInputChange = this.handleInputChange.bind(this)
		this.submit = this.submit.bind(this)
	}

	handleInputChange(event) {
		this.setState({[event.target.name]: event.target.value})
	}

	async submit(evt) {
		if (this.state.submitting) {
			return
		}
		this.setState({submitting: true})
		if (evt) {
			evt.preventDefault()
		}

		try {
			const payload = Object.assign({}, this.state)
			delete payload.submitting
			const response = await fetch(`api/auth/update`, {
				headers: this.context.headers(),
				method: "POST",
				body: JSON.stringify(payload),
			})
			if (!response.ok) {
				// TODO show error
				console.error("Unhandled auth update fail:", response)
			}
			// TODO show success
			this.setState({password: "", currentPassword: ""})
		} catch (err) {
			console.error(`Fatal error while updating user info:`, err)
		} finally {
			this.setState({submitting: false})
		}
	}

	render() {
		return (
			<form className="userinfo section" onSubmit={this.submit}>
				<h1>User info</h1>
				<input placeholder="New password" name="password" type="password"
					   value={this.state.password} onChange={this.handleInputChange}/>

				<input placeholder="Current password" name="currentPassword" type="password"
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
