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
import Link from "./full"
import PageSwitcher from "../pageswitcher"

class LinkListView extends PureComponent {
	render() {
		if (!this.props.links || this.props.links.length === 0) {
			return <div className="empty links">
				<h1>It's quite empty here.</h1>
				<h3>Would you like to <a href="#/save">save a link</a>?</h3>
			</div>
		}
		return (
			<div className="links lindeb-content">
				<a href="#/tags">Very temporary button to tag manager</a>
				<PageSwitcher {...this.props}/>
				<div className="error">{this.props.error}</div>
				{this.props.links.map(link => <Link key={link.id} {...link}/>)}
				<PageSwitcher {...this.props}/>
			</div>
		)
	}
}

export default LinkListView
