// Paper Overlap Finder: the middle tier.
// Serves web/ and answers /api/papers?q=... with rows from SQL Server.
// Run with: npm start, then open http://localhost:3000
require('dotenv').config();
const path = require('path');
const express = require('express');
const sql = require('mssql');

const app = express();
app.use(express.static(path.join(__dirname, '..', 'web')));

const poolPromise = sql.connect({
  server: process.env.DB_SERVER,
  port: Number(process.env.DB_PORT || 1433),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  options: { encrypt: true, trustServerCertificate: true }
});
poolPromise.catch(err => console.log('Database connection failed: ' + err.message));

// Same query as db/queries.sql. @q is a parameter, never pasted into the SQL.
const SEARCH_SQL = `
SELECT TOP (50)
    p.paper_id, p.title, p.pub_year, v.venue_name,
    (SELECT STRING_AGG(a.full_name, ', ') WITHIN GROUP (ORDER BY pa.author_order)
       FROM paper_authors pa JOIN authors a ON a.author_id = pa.author_id
      WHERE pa.paper_id = p.paper_id) AS authors,
    (SELECT STRING_AGG(k.keyword, ', ')
       FROM paper_keywords pk JOIN keywords k ON k.keyword_id = pk.keyword_id
      WHERE pk.paper_id = p.paper_id) AS keywords,
    s.score
FROM papers p
JOIN venues v ON v.venue_id = p.venue_id
CROSS APPLY (
    SELECT
        CASE WHEN EXISTS (SELECT 1 FROM paper_keywords pk JOIN keywords k ON k.keyword_id = pk.keyword_id
                          WHERE pk.paper_id = p.paper_id AND k.keyword LIKE '%' + @q + '%') THEN 3 ELSE 0 END
      + CASE WHEN p.title    LIKE '%' + @q + '%' THEN 2 ELSE 0 END
      + CASE WHEN p.abstract LIKE '%' + @q + '%' THEN 1 ELSE 0 END AS score
) s
WHERE s.score > 0
ORDER BY s.score DESC, p.pub_year DESC;`;

app.get('/api/papers', async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) return res.status(400).json({ error: 'Type a topic to search.' });
  if (q.length > 100) return res.status(400).json({ error: 'Topic must be 100 characters or fewer.' });
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('q', sql.NVarChar(100), q)
      .query(SEARCH_SQL);
    res.json(result.recordset);
  } catch (err) {
    console.log('Query failed: ' + err.message);
    res.status(500).json({ error: 'Database error. Check the server terminal.' });
  }
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`Paper Overlap Finder running at http://localhost:${port}`));
