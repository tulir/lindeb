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

class LinkDumpManager extends Component {
	static contextTypes = {
		headers: PropTypes.func,
	}

	constructor(props, context) {
		super(props, context)
		this.drop = this.drop.bind(this)
		this.export = this.export.bind(this)
		this.state = {
			uploading: false,
			importFormat: "choose",
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
			const response = await fetch(`api/links/import?format=${this.state.importFormat}`, {
				headers: this.context.headers(),
				method: "POST",
				body: JSON.stringify(dump),
			})
			if (!response.ok) {
				this.error.innerText = `Failed to import dump: ${response.statusText}`
				console.error("Import rejected:", response)
				return
			}
			this.setState({uploading: false, uploadSuccess: true}, () => {
				setTimeout(() => this.setState({uploadSuccess: false}), 1000)
			})
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
				this.error.innerText = `Failed to read file: ${err}`
			}
		}
	}

	dropInvalid() {
		this.error.innerText = "Invalid file type"
	}

	async export() {
		const response = await fetch(`api/links`, {
			headers: this.context.headers(),
			method: "GET",
		})
		if (!response.ok) {
			this.error.innerText = `Failed to read links: ${response.statusText}`
			console.error("Export rejected:", response)
			return
		}
		const links = await response.json()
		const text = JSON.stringify(links.links, "", "  ")
		const a = document.createElement("a")
		const file = new Blob([text], {type: "application/json"})
		a.href = URL.createObjectURL(file)
		a.download = "links.json"
		document.body.appendChild(a)
		a.click()
		a.remove()
	}

	dropzoneChildren() {
		if (this.state.uploading) {
			return <Spinner className="spinner"/>
		} else if (this.state.uploadSuccess) {
			return <div className="success">✓</div>
		}
		return <UploadIcon className="icon"/>
	}

	render() {
		return (
			<div className="link-dump-manager section">
				<div ref={ref => this.error = ref} className="error">{this.props.error}</div>
				<div className="wrapper-wrapper">
					<div className="import wrapper">
						<h1>Import</h1>
						<select value={this.state.importFormat}
								onChange={evt => this.setState({importFormat: evt.target.value})}>
							<option value="choose">Choose format...</option>
							<option value="lindeb">lindeb</option>
							<option value="pinboard">Pinboard</option>
						</select>
						<Dropzone onDropAccepted={this.drop} onDropRejected={this.dropInvalid}
								  accept="application/json" className="dropzone" disabledClassName="disabled"
								  activeClassName="active" acceptClassName="accept" rejectClassName="reject"
								  disabled={this.state.uploading || this.state.importFormat === "choose"}
								  children={this.dropzoneChildren()}/>
					</div>
					<div className="export wrapper">
						<h1>Export</h1>
						<button onClick={this.export}>Download as JSON</button>
					</div>
				</div>
			</div>
		)
	}
}

export default LinkDumpManager
