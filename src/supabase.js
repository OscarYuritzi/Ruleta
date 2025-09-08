import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

// Función para obtener o crear sesión de usuario
export async function getUserSession(userName) {
  try {
    // Primero verificar si ya existe una sesión activa para este usuario
    const { data: sessions, error: fetchError } = await supabase
      .from('realtime_sessions')
      .select('*')
      .eq('user_name', userName)
      .limit(1)

    if (sessions && sessions.length > 0 && !fetchError) {
      const existingSession = sessions[0]
      // Actualizar última actividad
      const { data, error } = await supabase
        .from('realtime_sessions')
        .update({ last_activity: new Date().toISOString() })
        .eq('id', existingSession.id)
        .select()
        .single()
      
      return { data, error }
    }

    // Crear nueva sesión
    const { data, error } = await supabase
      .from('realtime_sessions')
      .insert([{ 
        user_name: userName,
        last_activity: new Date().toISOString()
      }])
      .select()
      .single()

    return { data, error }
  } catch (error) {
    console.error('Error managing user session:', error)
    return { data: null, error }
  }
}

// Función para actualizar estado de giro
export async function updateSpinningState(sessionId, isSpinning, wheelRotation = 0, wheelType = null, options = []) {
  try {
    const { data, error } = await supabase
      .from('realtime_sessions')
      .update({
        is_spinning: isSpinning,
        wheel_rotation: wheelRotation,
        wheel_type: wheelType,
        current_options: options,
        last_activity: new Date().toISOString()
      })
      .eq('id', sessionId)
      .select()
      .single()

    return { data, error }
  } catch (error) {
    console.error('Error updating spinning state:', error)
    return { data: null, error }
  }
}

// Función para obtener todas las sesiones activas
export async function getActiveSessions() {
  try {
    const { data, error } = await supabase
      .from('realtime_sessions')
      .select('*')
      .gte('last_activity', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Últimos 5 minutos
      .order('last_activity', { ascending: false })

    return { data, error }
  } catch (error) {
    console.error('Error fetching active sessions:', error)
    return { data: [], error }
  }
}

// Función para eliminar sesión al salir
export async function removeUserSession(sessionId) {
  try {
    const { error } = await supabase
      .from('realtime_sessions')
      .delete()
      .eq('id', sessionId)

    return { error }
  } catch (error) {
    console.error('Error removing user session:', error)
    return { error }
  }
}