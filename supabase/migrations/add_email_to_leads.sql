-- Add email column to leads table if it doesn't exist
ALTER TABLE leads ADD COLUMN IF NOT EXISTS email VARCHAR(100);

-- Add constraint to ensure email is valid format (optional, depends on your DB setup)
-- ALTER TABLE leads ADD CONSTRAINT valid_email CHECK (email ~ '^[^\s@]+@[^\s@]+\.[^\s@]+$');

-- Create index on email for faster queries
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
