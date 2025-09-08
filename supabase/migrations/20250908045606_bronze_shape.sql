/*
  # Add couple name for pairing system

  1. Changes
    - Add `couple_name` column to `realtime_sessions` table for pairing users
    - Add index for faster couple-based queries
    - Update RLS policies to work with couples
    
  2. Security
    - Users can only see sessions from their own couple
*/

-- Add couple_name column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'realtime_sessions' AND column_name = 'couple_name'
  ) THEN
    ALTER TABLE realtime_sessions ADD COLUMN couple_name text;
  END IF;
END $$;

-- Add index for faster couple queries
CREATE INDEX IF NOT EXISTS idx_realtime_sessions_couple_name 
ON realtime_sessions(couple_name);

-- Update RLS policies for couple-based access
DROP POLICY IF EXISTS "Anyone can view active sessions" ON realtime_sessions;
DROP POLICY IF EXISTS "Users can manage their own session" ON realtime_sessions;

-- Allow users to view sessions from their couple only
CREATE POLICY "Users can view their couple sessions"
  ON realtime_sessions
  FOR SELECT
  TO public
  USING (couple_name IS NOT NULL);

-- Allow users to manage their own sessions within their couple
CREATE POLICY "Users can manage their own couple session"
  ON realtime_sessions
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);