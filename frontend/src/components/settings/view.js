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
import LinkDumpManager from "./dumps"

class SettingsView extends PureComponent {
	render() {
		return (
			<div className="settings lindeb-content">
				<UserInfo/>
				{this.props.showExtensionSettings ? <ExtensionSettings/> : ""}
				<WebsiteSettings/>
				<LinkDumpManager/>

				<div className="credits section">
					<h3>Credits</h3>
					<p>
						Favicon and Firefox extension icons from <a href="http://icons8.com/">icons8.com</a>.
					</p>
				</div>
			</div>
		)
	}
}

export default SettingsView
