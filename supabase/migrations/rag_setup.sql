-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create knowledge_chunks table
CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id BIGSERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  embedding VECTOR(768) -- Gemini Embedding-004 size
);

-- 3. Create an index for faster similarity search
CREATE INDEX ON knowledge_chunks USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- 4. Create similarity search function
CREATE OR REPLACE FUNCTION match_knowledge_chunks (
  query_embedding VECTOR(768),
  match_threshold FLOAT,
  match_count INT
)
RETURNS TABLE (
  id BIGINT,
  content TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    knowledge_chunks.id,
    knowledge_chunks.content,
    1 - (knowledge_chunks.embedding <=> query_embedding) AS similarity
  FROM knowledge_chunks
  WHERE 1 - (knowledge_chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

-- 5. Create response_cache table
CREATE TABLE IF NOT EXISTS response_cache (
  id BIGSERIAL PRIMARY KEY,
  query_text TEXT UNIQUE NOT NULL,
  response_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
