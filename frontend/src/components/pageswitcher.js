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

	/**
	 * Get the page buttons that should be shown.
	 *
	 * @returns {Component[]} The array of page buttons and possibly other things.
	 */
	get pageButtons() {
		const pageButtons = []
		// First, check if the number of pages is very small.
		if (this.props.pageCount < PAGE_BUTTONS_PER_DIRECTION * 2 + 1) {
			// If it is, we can just show all the page buttons.
			for (let i = 1; i <= this.props.pageCount; i++) {
				pageButtons.push(this.getPageButton(i, false))
			}
			return pageButtons
		}
		// If there are more pages, we'll need to limit the number of buttons.
		// By default, we want the current page and X pages in each direction.
		// X is defined by PAGE_BUTTONS_PER_DIRECTION and is currently always 3.
		let fromPage = this.props.page - PAGE_BUTTONS_PER_DIRECTION
		let toPage = this.props.page + PAGE_BUTTONS_PER_DIRECTION

		// However, we have to consider the cases where we can't go X pages in some direction.
		if (fromPage < 1) {
			// We can't go X pages left, so go left [as many pages as possible and add the remaining number of buttons
			// to the other direction.]
			toPage += -fromPage + 1
			toPage = Math.min(toPage, this.props.pageCount)
			fromPage = 1
		} else if (toPage > this.props.pageCount) {
			// We can't go X pages to the right, so go right [...]
			fromPage -= toPage - this.props.pageCount
			fromPage = Math.max(fromPage, 1)
			toPage = this.props.pageCount
		}

		// Now that we've got the range of normal page buttons to show, we should check if we need to show a button to
		// jump to the start.

		if (fromPage > 1) {
			// The button for the first page is not shown in the normal buttons, so add a new button for that.
			pageButtons.push(this.getPageButton(1))
			// If the button for the second page is also not shown, make it a jump button.
			// Jump buttons just have dots between them and the normal buttons.
			if (fromPage > 2) {
				pageButtons.push(<div key={"jump-start"} className="jump start">...</div>)
			}
		}

		// Add normal buttons.
		for (let i = fromPage; i <= toPage; i++) {
			pageButtons.push(this.getPageButton(i, false))
		}

		// Finally, check if we need a button to jump to the end. If we do, do the same as what we did previously for
		// the jump to start button.
		if (toPage < this.props.pageCount) {
			if (toPage < this.props.pageCount - 1) {
				pageButtons.push(<div key={"jump-end"} className="jump end">...</div>)
			}
			pageButtons.push(this.getPageButton(this.props.pageCount))
		}

		// All done, return the awesome collection of page buttons.
		return pageButtons
	}

	getPageButton(page) {
		let classes = "goto"
		if (page === this.props.page) {
			classes += " current"
		}
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
