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

const TAB_USER_INFO = "user",
	TAB_EXTENSION = "extension"

class SettingsView extends Component {
	switchTab(tab) {
		window.location.href = `#/settings/${tab}`
	}

	renderTab() {
		switch (this.props.tab) {
			case TAB_USER_INFO:
				return "Not yet implemented (User info)"
			case TAB_EXTENSION:
				return "Not yet implemented (Extension)"
		}
	}

	render() {
		return (
			<div className="settings">
				<div className="tabswitcher">
					<button onClick={() => this.switchTab(TAB_USER_INFO)}>User info</button>
					{this.props.showExtensionSettings
						? <button onClick={() => this.switchTab(TAB_EXTENSION)}>Extension</button>
						: ""}
				</div>
				{this.renderTab()}
			</div>
		)
	}
}

export default SettingsView
