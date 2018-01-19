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

class WebsiteSettings extends Component {
	static contextTypes = {
		settings: PropTypes.object,
	}

	getScrollbarClass(type) {
		if (type === "default" && !this.context.settings.scrollbar) {
			return "active"
		}
		return this.context.settings.scrollbar === type ? "active" : ""
	}

	setScrollbar(type) {
		this.context.settings.scrollbar = type
		this.forceUpdate()
	}

	render() {
		return (
			<div className="website section">
				<h1>Website</h1>
				<div className="setting">
					<div className="name">Scrollbar</div>
					<div className="control activatable button-group">
						<button onClick={() => this.setScrollbar("custom")}
								className={this.getScrollbarClass("custom")}
								title="Force custom scrollbar">
							Force custom
						</button>
						<button onClick={() => this.setScrollbar("default")}
								className={this.getScrollbarClass("default")}
								title="Use custom scrollbar if the native one isn't nice">
							Automatic
						</button>
						<button onClick={() => this.setScrollbar("native")}
								className={this.getScrollbarClass("native")}
								title="Force native scrollbar">
							Force native
						</button>
					</div>
				</div>
			</div>
		)
	}
}

export default WebsiteSettings
