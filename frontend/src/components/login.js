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
		error: PropTypes.func,
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
			if (!response.ok) {
				await this.context.error("logging in", response)
				return
			}
			const data = await response.json()
			this.context.login(data)
		} catch (err) {
			console.error("Unhandled error while authenticating:", err)
		}
	}

	render() {
		return (
			<form className="login" onSubmit={() => this.auth("login")}>
				<a href="https://github.com/tulir/lindeb">
					<img style={{position: "fixed", top: 0, right: 0, border: 0}}
						 src="https://camo.githubusercontent.com/e7bbb0521b397edbd5fe43e7f760759336b5e05f/68747470733a2f2f73332e616d617a6f6e6177732e636f6d2f6769746875622f726962626f6e732f666f726b6d655f72696768745f677265656e5f3030373230302e706e67"
						 alt="Fork me on GitHub"
						 data-canonical-src="https://s3.amazonaws.com/github/ribbons/forkme_right_green_007200.png"/>
				</a>
				<h1>lindeb</h1>
				<div className="error">{this.props.error}</div>
				<input required type="text" name="username" className="username"
					   placeholder="Username"
					   value={this.state.username}
					   onChange={this.handleInputChange}/>
				<input required type="password" name="password" className="password"
					   placeholder="Password"
					   value={this.state.password}
					   onChange={this.handleInputChange}/>
				<div className="buttons">
					<button type="button" className="main-color register" onClick={() => this.auth("register")}>Register</button>
					<button type="submit" className="main-color login">Login</button>
				</div>
			</form>
		)
	}
}

export default LoginView
