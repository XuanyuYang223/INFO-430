-- The query that answers the user story:
-- "Which existing papers overlap with my topic?"
-- Change @q and run this in VS Code (database xy223_myapp) to compare with the page.
-- Score: keyword match = 3, title match = 2, abstract match = 1.

DECLARE @q NVARCHAR(100) = N'privacy';

SELECT TOP (50)
    p.paper_id,
    p.title,
    p.pub_year,
    v.venue_name,
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
ORDER BY s.score DESC, p.pub_year DESC;
