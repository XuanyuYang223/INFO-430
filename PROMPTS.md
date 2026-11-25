# What I asked the AI

Keep a short log. One entry per prompt is enough.

| What I asked (paste or summarize) | What happened | What I had to fix or check |
| --- | --- | --- |
| Set up my environment: Node.js, npm install, .env with DB_NAME=xy223_myapp, create-db, check | AI created .env (password left blank for me) and told me how to install Node.js | I installed Node.js myself. `npm run check` first said "Login failed for user 'info430public'": I had an extra space and the wrong password in .env. Fixed it with the password from the Course Schedule page, then it printed "OK: connected ... database xy223_myapp". Checked .env is not in Source Control |
| My user story: as a student, I need to search for papers so that my research doesn't overlap. Design tables, load ~20 made-up rows, write the query and an /api route, and build the page | AI wrote db/schema.sql (venues, authors, keywords, papers + 2 link tables), db/load.js, db/queries.sql, server/server.js, web/index.html | Ran node db/load.js (8 venues, 20 authors, 20 keywords, 20 papers) and npm start. Searched "privacy": 2 papers, the LLM privacy paper ranked High, matching db/queries.sql |
| Is it safe? | Typed `' OR 1=1 --` into the search box | Got "No papers found", not every row: the input is a SQL parameter, not pasted into the query |
