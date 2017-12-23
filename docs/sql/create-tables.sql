-- N.B. This file is useless and only exists, because the course requires it.
--      In reality, you should simply run the server and let it create the tables.
CREATE TABLE IF NOT EXISTS User (
  id       INTEGER      PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(127) NOT NULL UNIQUE,
  password VARCHAR(60)  NOT NULL
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS AuthToken (
  user  INTEGER,
  token VARCHAR(64),
  PRIMARY KEY (user, token),
  FOREIGN KEY (user) REFERENCES User(id)
  ON DELETE CASCADE ON UPDATE RESTRICT
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Link (
  id          INTEGER       PRIMARY KEY AUTO_INCREMENT,
  url         VARCHAR(2047) NOT NULL,
  domain      VARCHAR(255)  NOT NULL,
  title       VARCHAR(255)  NOT NULL,
  description TEXT          NOT NULL,
  timestamp   BIGINT        NOT NULL,
  owner       INTEGER       NOT NULL,

  FOREIGN KEY (owner) REFERENCES User(id)
    ON DELETE CASCADE ON UPDATE RESTRICT
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Tag (
  id          INTEGER      PRIMARY KEY AUTO_INCREMENT,
  name        VARCHAR(255) NOT NULL,
  description TEXT         NOT NULL,
  owner       INTEGER      NOT NULL,

  FOREIGN KEY (owner) REFERENCES User(id)
    ON DELETE CASCADE ON UPDATE RESTRICT
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS LinkTag (
  link INTEGER NOT NULL,
  tag  INTEGER NOT NULL,

  FOREIGN KEY (link) REFERENCES Link(id)
    ON DELETE CASCADE ON UPDATE RESTRICT,
  FOREIGN KEY (tag)  REFERENCES Tag(id)
    ON DELETE CASCADE ON UPDATE RESTRICT,
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;