-- Paper Overlap Finder: tables in xy223_myapp
-- A paper is published at one venue, has many authors and many keywords.

CREATE TABLE venues (
    venue_id    INT IDENTITY(1,1) PRIMARY KEY,
    venue_name  NVARCHAR(100) NOT NULL UNIQUE,
    venue_type  NVARCHAR(20)  NOT NULL   -- 'Conference' or 'Journal'
);

CREATE TABLE authors (
    author_id    INT IDENTITY(1,1) PRIMARY KEY,
    full_name    NVARCHAR(100) NOT NULL,
    affiliation  NVARCHAR(100) NULL
);

CREATE TABLE keywords (
    keyword_id  INT IDENTITY(1,1) PRIMARY KEY,
    keyword     NVARCHAR(60) NOT NULL UNIQUE
);

CREATE TABLE papers (
    paper_id   INT IDENTITY(1,1) PRIMARY KEY,
    title      NVARCHAR(300) NOT NULL,
    abstract   NVARCHAR(2000) NULL,
    pub_year   INT NOT NULL,
    venue_id   INT NOT NULL REFERENCES venues(venue_id)
);

CREATE TABLE paper_authors (
    paper_id      INT NOT NULL REFERENCES papers(paper_id),
    author_id     INT NOT NULL REFERENCES authors(author_id),
    author_order  INT NOT NULL,
    PRIMARY KEY (paper_id, author_id)
);

CREATE TABLE paper_keywords (
    paper_id    INT NOT NULL REFERENCES papers(paper_id),
    keyword_id  INT NOT NULL REFERENCES keywords(keyword_id),
    PRIMARY KEY (paper_id, keyword_id)
);
