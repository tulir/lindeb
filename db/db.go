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

package db

import (
	"database/sql"
	"fmt"

	"github.com/go-sql-driver/mysql"
)

// Config is a wrapper for a DSN string.
type Config string

// Connect connects to the MySQL database determined by the DSN in this config string.
func (dbConf Config) Connect() (*DB, error) {
	conf, err := mysql.ParseDSN(string(dbConf))
	if err != nil {
		return nil, err
	}

	if conf.Params == nil {
		conf.Params = make(map[string]string)
	}
	// Force utf8mb4 in the MySQL client as we use it when creating tables as well.
	conf.Params["charset"] = "utf8mb4"

	sqlDB, err := sql.Open("mysql", conf.FormatDSN())
	if err != nil {
		return nil, err
	}
	return &DB{sqlDB}, nil
}

// Scannable is something that can be scanned, which in this context means either *sql.Row or *sql.Rows.
type Scannable interface {
	Scan(dest ...interface{}) error
}

// DB is a wrapper struct for sql.DB.
type DB struct {
	*sql.DB
}

// CreateTables creates all the necessary tables.
func (db *DB) CreateTables() {
	_, err := db.Exec(`CREATE TABLE IF NOT EXISTS User (
		id       INTEGER     PRIMARY KEY AUTO_INCREMENT,
		username VARCHAR(32) NOT NULL UNIQUE,
		password VARCHAR(60) NOT NULL
	) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`)
	if err != nil {
		fmt.Println("Failed to create table User:", err)
	}
	_, err = db.Exec(`CREATE TABLE IF NOT EXISTS AuthToken (
		user  INTEGER,
		token VARCHAR(64),
		PRIMARY KEY (user, token),
		FOREIGN KEY (user) REFERENCES User(id)
			ON DELETE CASCADE ON UPDATE RESTRICT
	) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`)
	if err != nil {
		fmt.Println("Failed to create table AuthToken:", err)
	}
	_, err = db.Exec(`CREATE TABLE IF NOT EXISTS Setting (
		user  INTEGER,
		vkey  VARCHAR(32),
		value TEXT,

		PRIMARY KEY (user, vkey),
		FOREIGN KEY (user) REFERENCES User(id)
			ON DELETE CASCADE ON UPDATE RESTRICT
	) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`)
	if err != nil {
		fmt.Println("Failed to create table Setting:", err)
	}
	_, err = db.Exec(`CREATE TABLE IF NOT EXISTS Link (
		id          INTEGER       PRIMARY KEY AUTO_INCREMENT,
		url         VARCHAR(2047) NOT NULL,
		domain      VARCHAR(255)  NOT NULL,
		title       VARCHAR(255)  NOT NULL,
		description TEXT          NOT NULL,
		timestamp   BIGINT        NOT NULL,
		owner       INTEGER       NOT NULL,

		FOREIGN KEY (owner) REFERENCES User(id)
			ON DELETE CASCADE ON UPDATE RESTRICT
	) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`)
	if err != nil {
		fmt.Println("Failed to create table Link:", err)
	}
	_, err = db.Exec(`CREATE TABLE IF NOT EXISTS Tag (
		id          INTEGER     PRIMARY KEY AUTO_INCREMENT,
		name        VARCHAR(32) NOT NULL,
		description TEXT        NOT NULL,
		owner       INTEGER     NOT NULL,

		UNIQUE KEY name (name, owner),
		FOREIGN KEY (owner) REFERENCES User(id)
			ON DELETE CASCADE ON UPDATE RESTRICT
	) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`)
	if err != nil {
		fmt.Println("Failed to create table Tag:", err)
	}
	_, err = db.Exec(`CREATE TABLE IF NOT EXISTS LinkTag (
		link INTEGER NOT NULL,
		tag  INTEGER NOT NULL,

		FOREIGN KEY (link) REFERENCES Link(id)
			ON DELETE CASCADE ON UPDATE RESTRICT,
		FOREIGN KEY (tag)  REFERENCES Tag(id)
			ON DELETE CASCADE ON UPDATE RESTRICT
	) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`)
	if err != nil {
		fmt.Println("Failed to create table LinkTag:", err)
	}
}
