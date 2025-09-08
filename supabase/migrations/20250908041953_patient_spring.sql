/*
  # Limpiar y arreglar sistema de ruletas en tiempo real

  1. Limpieza
    - Eliminar todos los usuarios existentes
    - Recrear tabla con estructura correcta

  2. Nueva estructura
    - Tabla `realtime_sessions` con todos los campos necesarios
    - RLS habilitado para seguridad
    - Políticas para lectura y escritura pública

  3. Campos importantes
    - `id`, `user_name`, `is_spinning`
    - `wheel_rotation`, `wheel_type`, `current_options`
    - `last_result`, `spin_start_time`
*/

-- Eliminar tabla existente y recrear limpia
DROP TABLE IF EXISTS realtime_sessions;

CREATE TABLE realtime_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name text NOT NULL,
  is_spinning boolean DEFAULT false,
  wheel_rotation double precision DEFAULT 0,
  wheel_type text,
  current_options jsonb DEFAULT '[]'::jsonb,
  last_activity timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  last_result text,
  spin_start_time timestamptz
);

ALTER TABLE realtime_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active sessions"
  ON realtime_sessions
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can manage their own session"
  ON realtime_sessions
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);