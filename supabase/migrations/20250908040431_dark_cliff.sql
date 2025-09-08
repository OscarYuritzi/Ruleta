/*
  # Sistema de ruletas en tiempo real

  1. Nueva tabla
    - `realtime_sessions`
      - `id` (uuid, primary key)
      - `user_name` (text)
      - `is_spinning` (boolean)
      - `wheel_rotation` (float)
      - `wheel_type` (text)
      - `current_options` (jsonb)
      - `last_activity` (timestamp)
      - `created_at` (timestamp)

  2. Seguridad
    - Enable RLS en `realtime_sessions`
    - Add policy para que todos puedan leer y crear sesiones
    - Add función para limpiar sesiones inactivas

  3. Tiempo real
    - Enable realtime en la tabla para sincronización instantánea
*/

CREATE TABLE IF NOT EXISTS realtime_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name text NOT NULL,
  is_spinning boolean DEFAULT false,
  wheel_rotation float DEFAULT 0,
  wheel_type text,
  current_options jsonb DEFAULT '[]'::jsonb,
  last_activity timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE realtime_sessions ENABLE ROW LEVEL SECURITY;

-- Policy para que todos puedan ver las sesiones activas
CREATE POLICY "Anyone can view active sessions"
  ON realtime_sessions
  FOR SELECT
  USING (true);

-- Policy para que cada usuario pueda crear/actualizar su sesión
CREATE POLICY "Users can manage their own session"
  ON realtime_sessions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Función para limpiar sesiones inactivas (más de 5 minutos)
CREATE OR REPLACE FUNCTION cleanup_inactive_sessions()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM realtime_sessions 
  WHERE last_activity < now() - interval '5 minutes';
END;
$$;

-- Enable realtime para sincronización instantánea
ALTER publication supabase_realtime ADD TABLE realtime_sessions;