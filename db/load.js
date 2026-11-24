// Creates the tables from db/schema.sql in your own database (DB_NAME in .env)
// and fills them with made-up papers. Safe to run again: it drops and recreates the tables.
// Run with: node db/load.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const sql = require('mssql');

const config = {
  server: process.env.DB_SERVER,
  port: Number(process.env.DB_PORT || 1433),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  options: { encrypt: true, trustServerCertificate: true }
};

// ---- Made-up data (fictional papers and people) ----
const venues = [
  ['VLDB', 'Conference'], ['SIGMOD', 'Conference'], ['CHI', 'Conference'],
  ['NeurIPS', 'Conference'], ['ACL', 'Conference'], ['JASIST', 'Journal'],
  ['IEEE Security & Privacy', 'Conference'], ['ACM Transactions on Database Systems', 'Journal']
];

const authors = [
  ['Maya Chen', 'University of Washington'], ['Daniel Okafor', 'Carnegie Mellon University'],
  ['Priya Raman', 'Stanford University'], ['Lucas Moreau', 'ETH Zurich'],
  ['Hana Sato', 'University of Tokyo'], ['Ethan Brooks', 'MIT'],
  ['Sofia Alvarez', 'UC Berkeley'], ['Jin Park', 'KAIST'],
  ['Amara Nwosu', 'University of Toronto'], ['Oliver Grant', 'University of Oxford'],
  ['Wei Zhang', 'Tsinghua University'], ['Fatima Haddad', 'University of Washington'],
  ['Noah Fischer', 'TU Munich'], ['Isabel Costa', 'University of Lisbon'],
  ['Ravi Kulkarni', 'IIT Bombay'], ['Emily Nguyen', 'University of Michigan'],
  ['Samuel Levi', 'Tel Aviv University'], ['Grace Kim', 'Georgia Tech'],
  ['Mateo Rossi', 'Politecnico di Milano'], ['Leah Johansson', 'KTH Royal Institute of Technology']
];

const keywords = [
  'query optimization', 'indexing', 'cardinality estimation', 'machine learning',
  'large language models', 'differential privacy', 'data cleaning', 'data integration',
  'human-computer interaction', 'visualization', 'information retrieval', 'recommender systems',
  'misinformation', 'graph databases', 'transaction processing', 'cloud databases',
  'fairness', 'accessibility', 'text-to-SQL', 'scientific data management'
];

// [title, abstract, year, venue index, [author indexes], [keyword indexes]]
const papers = [
  ['Learned Cardinality Estimation for Multi-Join Queries',
   'We train a neural model to estimate the size of join results and plug it into a cost-based query optimizer, reducing plan regressions.',
   2023, 0, [0, 5], [0, 2, 3]],
  ['Adaptive Indexing for Cloud Data Warehouses',
   'An indexing strategy that builds partial indexes as queries arrive, tuned for elastic cloud databases.',
   2022, 1, [3, 12], [1, 15]],
  ['Text-to-SQL with Large Language Models: A Benchmark Study',
   'We evaluate large language models on translating natural language questions into SQL across ten database schemas.',
   2024, 4, [10, 2, 17], [18, 4]],
  ['Differentially Private Query Answering over Relational Data',
   'A system that answers aggregate SQL queries with differential privacy guarantees while keeping error low.',
   2021, 6, [6, 16], [5, 0]],
  ['Interactive Data Cleaning with Visual Feedback',
   'A visualization tool that shows users the effect of each cleaning rule, helping them fix dirty data faster.',
   2022, 2, [11, 15], [6, 9, 8]],
  ['Schema Matching for Data Integration Using Embeddings',
   'Column embeddings from language models help match schemas across sources for data integration.',
   2023, 0, [7, 13], [7, 3, 4]],
  ['Detecting Misinformation Spread in Online Communities',
   'We study how misinformation moves through discussion forums and build a classifier to flag it early.',
   2021, 5, [8, 19], [12, 3]],
  ['Fair Ranking in Recommender Systems',
   'A re-ranking method that improves exposure fairness for item providers in recommender systems.',
   2022, 3, [4, 9], [11, 16, 3]],
  ['Graph Databases for Knowledge-Intensive Question Answering',
   'We store knowledge graphs in a graph database and use path queries to answer multi-hop questions.',
   2024, 1, [17, 10], [13, 10]],
  ['Concurrency Control for High-Contention Transaction Processing',
   'A new optimistic concurrency control protocol that keeps throughput high under heavy contention.',
   2020, 7, [5, 3], [14]],
  ['Accessible Data Visualization for Screen Reader Users',
   'Design guidelines and a prototype that make charts navigable with screen readers.',
   2023, 2, [15, 11], [17, 9, 8]],
  ['Privacy Risks of Large Language Models Trained on Public Data',
   'We show that large language models can leak personal information and measure how differential privacy reduces the risk.',
   2024, 6, [16, 6, 2], [4, 5]],
  ['Query Optimization in Serverless Cloud Databases',
   'Cost models for query optimization when compute is billed per second in serverless cloud databases.',
   2023, 7, [12, 0], [0, 15]],
  ['Searching Scientific Datasets with Natural Language',
   'An information retrieval system that lets scientists find datasets using plain-language descriptions.',
   2022, 5, [14, 18], [10, 19, 4]],
  ['Bias Audits of Hiring Recommendation Algorithms',
   'We audit three hiring recommender systems for demographic fairness and report disparities.',
   2021, 5, [9, 8], [16, 11]],
  ['Automatic Error Detection in Spreadsheets',
   'A machine learning approach to data cleaning that finds likely formula and entry errors in spreadsheets.',
   2020, 1, [13, 7], [6, 3]],
  ['Explaining Query Plans to Novice Users',
   'A human-computer interaction study of how students understand query optimization when plans are visualized.',
   2023, 2, [1, 11, 0], [8, 9, 0]],
  ['Vector Indexing for Semantic Search at Scale',
   'Approximate nearest neighbor indexing for semantic information retrieval over billions of embeddings.',
   2024, 3, [18, 10], [1, 10, 3]],
  ['Integrating Sensor Streams for Scientific Data Management',
   'A pipeline for data integration of high-volume sensor streams in environmental science projects.',
   2021, 0, [19, 14], [19, 7]],
  ['Correcting Misinformation with Conversational Agents',
   'We test whether chatbots built on large language models can correct health misinformation in conversation.',
   2024, 4, [8, 1, 15], [12, 4, 8]]
];

(async () => {
  if (!process.env.DB_NAME) { console.log('Set DB_NAME in .env first.'); process.exit(1); }
  let pool;
  try {
    pool = await sql.connect(config);
    console.log(`Connected to ${process.env.DB_NAME}.`);

    // Drop old tables (children first), then create from schema.sql.
    await pool.request().query(`
      DROP TABLE IF EXISTS paper_keywords;
      DROP TABLE IF EXISTS paper_authors;
      DROP TABLE IF EXISTS papers;
      DROP TABLE IF EXISTS keywords;
      DROP TABLE IF EXISTS authors;
      DROP TABLE IF EXISTS venues;`);
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await pool.request().batch(schema);
    console.log('Tables created.');

    const ids = { venues: [], authors: [], keywords: [], papers: [] };

    for (const [name, type] of venues) {
      const r = await pool.request()
        .input('name', sql.NVarChar(100), name).input('type', sql.NVarChar(20), type)
        .query('INSERT INTO venues (venue_name, venue_type) OUTPUT INSERTED.venue_id VALUES (@name, @type)');
      ids.venues.push(r.recordset[0].venue_id);
    }
    for (const [name, aff] of authors) {
      const r = await pool.request()
        .input('name', sql.NVarChar(100), name).input('aff', sql.NVarChar(100), aff)
        .query('INSERT INTO authors (full_name, affiliation) OUTPUT INSERTED.author_id VALUES (@name, @aff)');
      ids.authors.push(r.recordset[0].author_id);
    }
    for (const kw of keywords) {
      const r = await pool.request()
        .input('kw', sql.NVarChar(60), kw)
        .query('INSERT INTO keywords (keyword) OUTPUT INSERTED.keyword_id VALUES (@kw)');
      ids.keywords.push(r.recordset[0].keyword_id);
    }
    for (const [title, abs, year, v, auths, kws] of papers) {
      const r = await pool.request()
        .input('title', sql.NVarChar(300), title).input('abs', sql.NVarChar(2000), abs)
        .input('year', sql.Int, year).input('venue', sql.Int, ids.venues[v])
        .query('INSERT INTO papers (title, abstract, pub_year, venue_id) OUTPUT INSERTED.paper_id VALUES (@title, @abs, @year, @venue)');
      const pid = r.recordset[0].paper_id;
      for (let i = 0; i < auths.length; i++) {
        await pool.request()
          .input('p', sql.Int, pid).input('a', sql.Int, ids.authors[auths[i]]).input('o', sql.Int, i + 1)
          .query('INSERT INTO paper_authors (paper_id, author_id, author_order) VALUES (@p, @a, @o)');
      }
      for (const k of kws) {
        await pool.request()
          .input('p', sql.Int, pid).input('k', sql.Int, ids.keywords[k])
          .query('INSERT INTO paper_keywords (paper_id, keyword_id) VALUES (@p, @k)');
      }
    }
    console.log(`Loaded ${venues.length} venues, ${authors.length} authors, ${keywords.length} keywords, ${papers.length} papers.`);
  } catch (err) {
    console.log('FAILED: ' + err.message);
    process.exitCode = 1;
  } finally {
    if (pool) await pool.close();
  }
})();
