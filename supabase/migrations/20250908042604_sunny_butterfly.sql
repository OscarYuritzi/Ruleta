/*
  # Limpiar sesiones y mejorar sincronización

  1. Limpieza
    - Eliminar todas las sesiones existentes
    - Limpiar datos obsoletos
    
  2. Mejoras
    - Optimizar estructura para mejor sincronización
    - Asegurar que los resultados se compartan correctamente
*/

-- Eliminar todas las sesiones existentes
DELETE FROM realtime_sessions;

-- Asegurar que tenemos todas las columnas necesarias
DO $$
BEGIN
  -- Verificar y agregar columnas si no existen
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'realtime_sessions' AND column_name = 'last_result'
  ) THEN
    ALTER TABLE realtime_sessions ADD COLUMN last_result text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'realtime_sessions' AND column_name = 'spin_start_time'
  ) THEN
    ALTER TABLE realtime_sessions ADD COLUMN spin_start_time timestamptz;
  END IF;
END $$;