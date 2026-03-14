-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create enum types
CREATE TYPE IF NOT EXISTS workflow_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE IF NOT EXISTS run_status AS ENUM ('pending', 'running', 'success', 'failed', 'cancelled');

-- Log initialization
DO $$
BEGIN
  RAISE NOTICE 'Database initialized successfully!';
END $$;
