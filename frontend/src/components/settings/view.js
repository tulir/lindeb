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

import React, {PureComponent} from "react"
import UserInfo from "./userinfo"
import ExtensionSettings from "./extension"
import WebsiteSettings from "./website"

const TAB_USER_INFO = "user",
	TAB_EXTENSION = "extension",
	TAB_WEBSITE = "website"

class SettingsView extends PureComponent {
	static DEFAULT_TAB = TAB_USER_INFO

	switchTab(tab) {
		window.location.href = `#/settings/${tab}`
	}

	renderTab() {
		switch (this.props.tab) {
			case TAB_USER_INFO:
				return <UserInfo/>
			case TAB_EXTENSION:
				return <ExtensionSettings/>
			case TAB_WEBSITE:
				return <WebsiteSettings/>
			default:
				// Other tabs should be prevented at the router level.
				throw new Error(`Unknown tab: ${this.props.tab}`)
		}
	}

	render() {
		return (
			<div className="settings lindeb-content">
				<div className="tabswitcher">
					<button onClick={() => this.switchTab(TAB_USER_INFO)}>User info</button>
					<button onClick={() => this.switchTab(TAB_WEBSITE)}>Website</button>
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
