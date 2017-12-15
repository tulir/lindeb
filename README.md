# lindeb - mau\Lu Link Database
A database exercise project with Go and React.

The official deployment will be available at [lindeb.mau.lu](https://lindeb.mau.lu).

## Objective
The goal of this project is to create an easy-to-use system for saving links and searching saved links.

### Scope
* Authentication. Saved links are always private.
* Saving links and deleting saved links
  * Saving a link should only require one click on the page being saved
* Tagging and untagging links, managing tags
* Browsing links
  * Sorting and filtering by different fields (e.g. date added, by-domain, by-tag)
  * Searching for links based on page data (e.g. body content, title)

#### Extended scope
* Adding metadata (e.g. description) for tags
* Sharing links to external platforms
* Shortening links using [mau\Lu](https://github.com/tulir/maulu)

### Out of scope
* All internal social features

## Technologies
### Backend
The backend uses [Go](https://golang.org/) with [gorilla/mux](https://github.com/gorilla/mux) for routing and
[go-sql-driver/mysql](https://github.com/go-sql-driver/mysql) as the database driver. It has a REST-like JSON
API that is documented with an [OpenAPI](https://github.com/OAI/OpenAPI-Specification) document. The specification
file is available [here](https://github.com/tulir/lindeb/blob/master/docs/api.yaml) and a graphical API explorer
is available [here](https://lindeb.mau.lu/apidocs).

[MariaDB](https://mariadb.org) is the recommended database management system, but anything compatible with MySQL
should work. The search system uses [Elasticsearch](https://www.elastic.co/products/elasticsearch) as its backend.
Since the backend is written in Go, the server running the backend does not need any language-specific runtimes.
However, a DBMS instance and an Elasticsearch instance must be available.

### Frontend
The frontend uses [React](https://reactjs.org/) and modern JavaScript syntax.
Support for old browsers is not guaranteed. The latest version of Firefox is recommended, but Chrome will work too.

## Documentation
* [Course documentation](https://docs.google.com/document/d/1LhNw1F7La3O9GysxXFnXPuQvzvQhpxS3Gmd0t6iF50I) in Finnish
  (also as [PDF](https://github.com/tulir/lindeb/blob/master/docs/course.pdf))
* [OpenAPI document](https://github.com/tulir/lindeb/blob/master/docs/api.yaml)
* [API explorer](https://lindeb.mau.lu/apidocs)
* [UI designs](https://github.com/tulir/lindeb/tree/master/docs/ui)
