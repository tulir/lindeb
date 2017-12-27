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

class LoginView extends Component {
	static contextTypes = {
		login: PropTypes.func,
	}

	constructor(props, context) {
		super(props, context)
		this.state = {
			username: "",
			password: "",
		}
		this.handleInputChange = this.handleInputChange.bind(this)
	}

	handleInputChange(event) {
		this.setState({[event.target.name]: event.target.value})
	}

	async auth(action = "login") {
		try {
			const response = await fetch(`api/auth/${action}`, {
				headers: {
					"Content-Type": "application/json",
				},
				method: "POST",
				body: JSON.stringify(this.state),
			})
			const data = await response.json()
			this.context.login(data)
		} catch (err) {
			console.error("Unhandled error while authenticating:", err)
		}
	}

	render() {
		return (
			<div className="login">
				<h1>lindeb</h1>
				<input type="text" name="username" className="username"
					   placeholder="Username"
					   value={this.state.username}
					   onChange={this.handleInputChange}/>
				<input type="password" name="password" className="password"
					   placeholder="Password"
					   value={this.state.password}
					   onChange={this.handleInputChange}/>
				<div className="buttons">
					<button type="button" className="register" onClick={() => this.auth("register")}>Register</button>
					<button type="submit" className="login" onClick={() => this.auth("login")}>Login</button>
				</div>
			</div>
		)
	}
}

export default LoginView
