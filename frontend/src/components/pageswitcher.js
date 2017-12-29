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
import PropTypes from "prop-types"

const PAGE_BUTTONS_PER_DIRECTION = 3

class PageSwitcher extends PureComponent {
	static contextTypes = {
		switchPage: PropTypes.func,
	}

	get pageButtons() {
		const pageButtons = []
		if (this.props.pageCount < PAGE_BUTTONS_PER_DIRECTION * 2 + 1) {
			for (let i = 1; i <= this.props.pageCount; i++) {
				pageButtons.push(this.getPageButton(i, false))
			}
			return pageButtons
		}
		let fromPage = this.props.page - PAGE_BUTTONS_PER_DIRECTION
		let toPage = this.props.page + PAGE_BUTTONS_PER_DIRECTION
		if (fromPage < 1) {
			toPage += -fromPage + 1
			toPage = Math.min(toPage, this.props.pageCount)
			fromPage = 1
		} else if (toPage > this.props.pageCount) {
			fromPage -= toPage - this.props.pageCount
			fromPage = Math.max(fromPage, 1)
			toPage = this.props.pageCount
		}
		if (fromPage > 1) {
			pageButtons.push(this.getPageButton(1, fromPage > 2))
			if (fromPage > 2) {
				pageButtons.push(<div key={"jump-start"} className="jump start">...</div>)
			}
		}
		for (let i = fromPage; i <= toPage; i++) {
			pageButtons.push(this.getPageButton(i, false))
		}
		if (toPage < this.props.pageCount) {
			if (toPage < this.props.pageCount - 1) {
				pageButtons.push(<div key={"jump-end"} className="jump end">...</div>)
			}
			pageButtons.push(this.getPageButton(this.props.pageCount, toPage < this.props.pageCount - 1))
		}
		return pageButtons
	}

	getPageButton(page/*, isJump = false*/) {
		let classes = "goto"
		if (page === this.props.page) {
			classes += " current"
		}
		/*if (isJump) {
			classes += " jump"
		}*/
		return (
			<button key={page} className={classes} onClick={() => this.context.switchPage(page)}>
				{page}
			</button>
		)
	}

	render() {
		return (
			<div className="pageswitcher">
				{this.pageButtons}
			</div>
		)
	}
}

export default PageSwitcher
