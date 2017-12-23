-- N.B. This file does not add data to Elasticsearch.
--      Use test-data-api.sh instead if you want the data to be added to Elasticsearch as well.
INSERT INTO User (id, username, password) VALUES (1, 'root', '');

INSERT INTO Link(id, url, title, description, timestamp, owner) VALUES
  (1, 'https://lindeb.mau.lu/apidocs/#/', 'lindeb API', '', 1513973821, 1),
  (2, 'https://gist.github.com/SchumacherFM/69a167bec7dea644a20e', 'GoLang Database SQL: Selecting an unknown amount of columns from a query. Benchmark results in db_test.go', 'GoLang Database SQL: Selecting an unknown amount of columns from a query. Benchmark results in db_test.go', 1513973835, 1),
  (3, 'https://stackoverflow.com/questions/3132324/mysql-join-wrapping-into-an-array', 'MySQL JOIN wrapping into an array - Stack Overflow', 'I have some minor problem with an SQL query. I have to select data from multiple tables like', 1513974451, 1),
  (4, 'https://twitter.com/Keyp_io/status/944210392892375040', 'Keyp on Twitter: ...', 'We\'re officially switching to @RiotChat on @matrixdotorg for our (team) communication 🤓 Merry Christmas @martinkrafft 🎅', 1513974600, 1),
  (5, 'https://twitter.com/ryaneshea/status/943928115897741312', 'Ryan Shea on Twitter: ...', 'Yes Matrix is very cool! It’s one of the three systems that teams are allowed to fork for the Slack alternative bounty :)', 1513974622, 1),
  (6, 'https://stackoverflow.com/questions/47946631/what-is-a-simple-way-to-duplicate-and-transform-an-extracted-css-file-in-webpack', 'What is a simple way to duplicate and transform an extracted CSS file in Webpack? - Stack Overflow', 'Using the css loader to create a .css file in a dist folder, how would you then copy this file to a new file name and apply a transform?', 1513975032, 1),
  (7, 'https://mau.lu/', 'mau.lu', '', 1513975655, 1),
  (8, 'https://matrix.org/', 'Home | Matrix.org', '', 1513976126, 1),
  (9, 'https://matrix.org/docs/spec/', 'Matrix Specification', '', 1513976130, 1);

INSERT INTO Tag(id, name, description, owner) VALUES
  (1, 'stackoverflow', 'Possibly relevant Stack Overflow questions/answers', 1),
  (2, 'github', 'Everything GitHub', 1),
  (3, 'website', 'Generic websites (rather than a specific page)', 1),
  (4, 'tweet', 'Tweets.', 1),
  (5, 'apidoc', 'OpenAPI documents', 1),
  (6, 'programming', 'Programming-related links', 1),
  (7, 'matrix.org', 'Matrix.org-related links', 1);

INSERT INTO LinkTag(link, tag) VALUES
  (1, 5), (1, 6),
  (2, 2), (2, 6),
  (3, 1), (3, 6),
  (4, 4), (4, 7),
  (5, 4), (5, 7),
  (6, 1), (6, 6),
  (7, 3),
  (8, 3), (8, 7),
  (9, 5), (9, 7);