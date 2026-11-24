# What I asked the AI

Keep a short log. One entry per prompt is enough.

| What I asked (paste or summarize) | What happened | What I had to fix or check |
| --- | --- | --- |
| Set up my environment: Node.js, npm install, .env with DB_NAME=xy223_myapp, create-db, check | AI created .env (password left blank for me) and told me how to install Node.js | I installed Node.js myself and typed the password into .env; checked .env is not in Source Control |
| My user story: as a student, I need to search for papers so that my research doesn't overlap. Design tables, load ~20 made-up rows, write the query and an /api route, and build the page | AI wrote db/schema.sql (venues, authors, keywords, papers + 2 link tables), db/load.js, db/queries.sql, server/server.js, web/index.html | Ran node db/load.js and npm start; compared the page with queries.sql for one topic |
| | | Tested `' OR 1=1 --` in the search box: |
