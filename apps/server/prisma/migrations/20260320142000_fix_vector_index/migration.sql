-- Drop the problematic B-Tree index on embedding
DROP INDEX IF EXISTS "document_chunks_embedding_idx";

-- Convert array to vector type and create proper index
-- This handles the case where pgvector extension is available
DO $$
BEGIN
  -- Check if vector extension is available
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
    -- Convert array column to vector type
    ALTER TABLE "document_chunks" 
    ALTER COLUMN "embedding" TYPE vector(1024) USING 
      CASE 
        WHEN "embedding" IS NULL THEN NULL
        ELSE array_to_vector("embedding"::double precision[], 1024)
      END;
    
    -- Create Ivfflat index for efficient vector similarity search
    CREATE INDEX "document_chunks_embedding_idx" 
    ON "document_chunks" 
    USING ivfflat ("embedding" vector_cosine_ops)
    WITH (lists = 100);
    
    RAISE NOTICE 'Vector index created successfully';
  ELSE
    RAISE NOTICE 'pgvector extension not found, keeping array type without index';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Index operation failed: %, continuing without vector index', SQLERRM;
END $$;
