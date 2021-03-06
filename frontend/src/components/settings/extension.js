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

class ExtensionSettings extends Component {
	static contextTypes = {
		settings: PropTypes.object,
	}

	constructor(props, context) {
		super(props, context)
		if (!this.context.settings.extension) {
			this.context.settings.extension = {}
		}
	}

	get settings() {
		return this.context.settings.extension
	}

	updateSettings() {
		this.context.settings.set("extension", this.settings)
	}

	set(key, value) {
		this.settings[key] = value
		this.updateSettings()
		this.forceUpdate()
	}

	getClass(key, value, isDefault) {
		if (isDefault && this.settings[key] === undefined) {
			return "active"
		}
		return this.settings[key] === value ? "active" : ""
	}

	render() {
		return (
			<div className="extension section">
				<h1>Extension</h1>
				<div className="setting">
					<div className="name">Button action</div>
					<div className="control activatable button-group">
						<button onClick={() => this.set("buttonAction", "save")}
								className={this.getClass("buttonAction", "save")}
								title="Send link save request immediately when clicking toolbar button">
							Save immediately
						</button>
						<button onClick={() => this.set("buttonAction", "popup")}
								className={this.getClass("buttonAction", "popup", true)}
								title="Open popup that allows you to edit values before saving link">
							Open popup
						</button>
					</div>
				</div>
				<div className="setting">
					<div className="name">Autofill title</div>
					<div className="control activatable button-group">
						<button onClick={() => this.set("autofillTitle", false)}
								className={this.getClass("autofillTitle", false)}
								title="Input title manually or let server crawl it">
							Off
						</button>
						<button onClick={() => this.set("autofillTitle", true)}
								className={this.getClass("autofillTitle", true, true)}
								title="Automatically set title to tab title">
							On
						</button>
					</div>
				</div>
			</div>
		)
	}
}

export default ExtensionSettings
