/*
  # Add last_result column to realtime_sessions table

  1. Changes
    - Add `last_result` column to store roulette spin results
    - Column type: text (nullable) to store the result string
  
  2. Purpose
    - Store the final result of each roulette spin
    - Allow other users to see what result someone got
*/

ALTER TABLE realtime_sessions 
ADD COLUMN IF NOT EXISTS last_result text DEFAULT null;