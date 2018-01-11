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

const ErrorableMixin = {
	showError(message, component) {
		if (component && component.showError && component !== this) {
			component.showError(message)
		} else {
			this.setState({loading: false, saving: false, error: message})
		}
	},

	clearError() {
		if (this.state.mounted !== false) {
			this.setState({error: ""})
		}
	},
}

function applyMixin(to) {
	Object.assign(to.prototype, ErrorableMixin)
	return to
}

export default applyMixin
