/*
  # Crear sistema de parejas en tiempo real

  1. Nueva tabla: couples_sessions
    - `id` (uuid, primary key)  
    - `couple_name` (text, unique) - Nombre único de la pareja
    - `user1_name` (text) - Nombre del primer usuario
    - `user2_name` (text, nullable) - Nombre del segundo usuario
    - `current_wheel_type` (text) - Tipo de ruleta actual
    - `current_options` (jsonb) - Opciones de la ruleta
    - `is_spinning` (boolean) - Si está girando actualmente
    - `wheel_rotation` (float) - Rotación actual de la ruleta
    - `spin_start_time` (timestamp) - Cuando comenzó el giro
    - `last_result` (text) - Último resultado
    - `result_for_user` (text) - Para qué usuario es el resultado
    - `created_at` (timestamp)
    - `updated_at` (timestamp)

  2. Security
    - Enable RLS
    - Add policies for couples to manage their own sessions
*/

CREATE TABLE IF NOT EXISTS couples_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_name text UNIQUE NOT NULL,
  user1_name text NOT NULL,
  user2_name text,
  current_wheel_type text DEFAULT 'normal',
  current_options jsonb DEFAULT '[]'::jsonb,
  is_spinning boolean DEFAULT false,
  wheel_rotation float DEFAULT 0,
  spin_start_time timestamptz,
  last_result text,
  result_for_user text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE couples_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Couples can manage their own session
CREATE POLICY "Couples can manage their own session"
  ON couples_sessions
  FOR ALL
  TO public
  USING (couple_name IS NOT NULL)
  WITH CHECK (couple_name IS NOT NULL);

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_couples_sessions_updated_at
  BEFORE UPDATE ON couples_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();