#!/bin/bash
function post {
    curl -XPOST "http://localhost:29315/api$1" -H "$authHeader" -d "$2"
}

register="$(curl -XPOST -d '{"username": "root", "password": "password"}' http://localhost:29315/api/auth/register)"
authtoken="$(echo $register | jq -r '.authtoken')"
userID="$(echo $register | jq -r '.id')"
authHeader="Authorization: LINDEB-TOKEN user=$userID token=$authtoken"

post "/tag/add" '{"name": "stackoverflow", "description": "Possibly relevant Stack Overflow questions/answers"}'
post "/tag/add" '{"name": "github", "description": "Everything GitHub"}'
post "/tag/add" '{"name": "website", "description": "Generic websites (rather than a specific page)"}'
post "/tag/add" '{"name": "tweet", "description": "Tweets."}'
post "/tag/add" '{"name": "apidoc", "description": "OpenAPI documents"}'
post "/tag/add" '{"name": "programming", "description": "Programming-related links"}'
post "/tag/add" '{"name": "matrix.org", "description": "Matrix.org-related links"}'
post "/tag/add" '{"name": "maunium", "description": "Maunium websites"}'

post "/link/save" '{"url": "https://lindeb.mau.lu/apidocs/#/", "tags": ["maunium", "apidoc", "programming"]}'
post "/link/save" '{"url": "https://gist.github.com/SchumacherFM/69a167bec7dea644a20e", "tags": ["github", "programming"]}'
post "/link/save" '{"url": "https://stackoverflow.com/questions/3132324/mysql-join-wrapping-into-an-array", "tags": ["stackoverflow", "programming"]}'
post "/link/save" '{"url": "https://twitter.com/Keyp_io/status/944210392892375040", "tags": ["tweet", "matrix.org"]}'
post "/link/save" '{"url": "https://twitter.com/ryaneshea/status/943928115897741312", "tags": ["tweet", "matrix.org"]}'
post "/link/save" '{"url": "https://stackoverflow.com/questions/47946631/what-is-a-simple-way-to-duplicate-and-transform-an-extracted-css-file-in-webpack", "tags": [""]}'
post "/link/save" '{"url": "https://mau.lu/", "tags": ["maunium", "website"]}'
post "/link/save" '{"url": "https://matrix.org/", "tags": ["website", "matrix.org"]}'
post "/link/save" '{"url": "https://matrix.org/docs/spec/", "tags": ["apidoc", "matrix.org"]}'

register="$(curl -XPOST -d '{"username": "user", "password": "maumau"}' http://localhost:29315/api/auth/register)"
authtoken="$(echo $register | jq -r '.authtoken')"
userID="$(echo $register | jq -r '.id')"
authHeader="Authorization: LINDEB-TOKEN user=$userID token=$authtoken"

post "/link/save" '{"url": "https://github.com/tulir/lindeb"}'
