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
import Spinner from "../../res/spinner.svg"
import UploadIcon from "../../res/upload.svg"
import Dropzone from "react-dropzone"

class LinkImportView extends Component {
	static contextTypes = {
		headers: PropTypes.func,
	}

	constructor(props, context) {
		super(props, context)
		this.drop = this.drop.bind(this)
		this.state = {
			uploading: false,
		}
	}

	readFile(file) {
		return new Promise((resolve, reject) => {
			const reader = new FileReader()
			reader.onload = () => resolve(reader.result)
			reader.onabort = reject
			reader.onerror = reject
			reader.readAsText(file)
		})
	}

	async uploadDump(dump) {
		this.setState({uploading: true})
		try {
			// TODO ask format from user
			const response = await fetch(`api/links/import?format=pinboard`, {
				headers: this.context.headers(),
				method: "POST",
				body: JSON.stringify(dump),
			})
			if (!response.ok) {
				// TODO display error
				console.error("Unhandled fetch rejection:", response)
				return
			}
			const links = await response.json()
			// TODO display success properly
			console.log("Unhandled fetch success:", response)
			console.log(links)
			this.setState({uploading: false})
		} catch (err) {
			console.error("Fatal error while fetching links:", err)
		}
	}

	async drop(files) {
		for (const file of files) {
			try {
				const rawData = await this.readFile(file)
				const dump = JSON.parse(rawData)
				await this.uploadDump(dump)
			} catch (err) {
				// TODO display error
				console.error("Unhandled error", err)
			}
		}
	}

	render() {
		return (
			<div className="link-importer">
				<div className="error">{this.props.error}</div>
				<Dropzone onDropAccepted={this.drop} accept="application/json" className="dropzone"
						  activeClassName="active" acceptClassName="accept" rejectClassName="reject"
						  disabledClassName="disabled" disabled={this.state.uploading}
						  children={this.state.uploading ? <Spinner/> : <UploadIcon/>}/>
			</div>
		)
	}
}

export default LinkImportView