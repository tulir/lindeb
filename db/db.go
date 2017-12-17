package db

import (
	"database/sql"
	"fmt"

	"github.com/go-sql-driver/mysql"
)

type Config string

func (dbConf Config) Connect() (DB, error) {
	var db DB
	conf, err := mysql.ParseDSN(string(dbConf))
	if err != nil {
		return db, err
	}
	sqlDB, err := sql.Open("mysql", conf.FormatDSN())
	if err != nil {
		return db, err
	}
	db = DB{sqlDB}
	return db, nil
}

type DB struct {
	*sql.DB
}

func (db DB) CreateTables() {
	_, err := db.Exec(`CREATE DATABASE IF NOT EXISTS User (
		id       INTEGER      PRIMARY KEY AUTO_INCREMENT,
		username VARCHAR(255) NOT NULL UNIQUE,
		password VARCHAR(60)  NOT NULL
	) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`)
	if err != nil {
		fmt.Println("Failed to create table User:", err)
	}
	_, err = db.Exec(`CREATE DATABASE IF NOT EXISTS Link (
		id          INTEGER       PRIMARY KEY AUTO_INCREMENT,
		url         VARCHAR(2047) NOT NULL,
		domain      VARCHAR(255)  NOT NULL,
		title       VARCHAR(255)  NOT NULL,
		description TEXT          NOT NULL,
		owner       INTEGER       NOT NULL,

		FOREIGN KEY (owner) REFERENCES User(id)
			ON DELETE CASCADE ON UPDATE RESTRICT
	) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`)
	if err != nil {
		fmt.Println("Failed to create table Link:", err)
	}
	_, err = db.Exec(`CREATE DATABASE IF NOT EXISTS Tag (
		id          INTEGER      PRIMARY KEY AUTO_INCREMENT,
		name        VARCHAR(255) NOT NULL,
		description TEXT         NOT NULL,
		owner       INTEGER      NOT NULL,

		FOREIGN KEY (owner) REFERENCES User(id)
			ON DELETE CASCADE ON UPDATE RESTRICT
	) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`)
	if err != nil {
		fmt.Println("Failed to create table Tag:", err)
	}
	_, err = db.Exec(`CREATE DATABASE IF NOT EXISTS LinkTag (
		link INTEGER NOT NULL,
		tag  INTEGER NOT NULL,

		FOREIGN KEY (link) REFERENCES Link(id)
			ON DELETE CASCADE ON UPDATE RESTRICT,
		FOREIGN KEY (tag)  REFERENCES Tag(id)
			ON DELETE CASCADE ON UPDATE RESTRICT,
	) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`)
	if err != nil {
		fmt.Println("Failed to create table LinkTag:", err)
	}
}
