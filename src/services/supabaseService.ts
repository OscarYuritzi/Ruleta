import { supabase } from '../config/supabase';

export interface CoupleSession {
  id: string;
  couple_name: string;
  user1_name: string;
  user2_name?: string;
  current_wheel_type: string;
  current_options: string[];
  is_spinning: boolean;
  wheel_rotation: number;
  spin_start_time?: Date;
  last_result?: string;
  result_for_user?: string;
  created_at: Date;
  updated_at: Date;
}

class SupabaseService {
  // Crear o unirse a una sesión de pareja
  async createOrJoinSession(userName: string, coupleName: string): Promise<CoupleSession> {
    try {
      console.log(`🔥 Supabase: Creando/uniendo sesión para ${userName} en ${coupleName}`);
      
      // Buscar sesión existente
      const { data: existingSession, error: fetchError } = await supabase
        .from('couples_sessions')
        .select('*')
        .eq('couple_name', coupleName)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (existingSession) {
        console.log('📖 Sesión existente encontrada:', existingSession);
        
        // Si no hay segundo usuario y el usuario actual no es el primero
        if (!existingSession.user2_name && existingSession.user1_name !== userName) {
          console.log(`👥 Agregando ${userName} como segundo usuario`);
          
          const { data: updatedSession, error: updateError } = await supabase
            .from('couples_sessions')
            .update({
              user2_name: userName,
              updated_at: new Date().toISOString()
            })
            .eq('couple_name', coupleName)
            .select()
            .single();

          if (updateError) throw updateError;
          
          return this.formatSession(updatedSession);
        }
        
        console.log('✅ Usuario ya existe en la sesión');
        return this.formatSession(existingSession);
      } else {
        // Crear nueva sesión
        console.log('🆕 Creando nueva sesión');
        
        const newSession = {
          couple_name: coupleName,
          user1_name: userName,
          current_wheel_type: 'normal',
          current_options: ['Opción 1', 'Opción 2', 'Opción 3', 'Opción 4'],
          is_spinning: false,
          wheel_rotation: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { data: createdSession, error: createError } = await supabase
          .from('couples_sessions')
          .insert(newSession)
          .select()
          .single();

        if (createError) throw createError;

        console.log('✅ Nueva sesión creada exitosamente');
        return this.formatSession(createdSession);
      }
    } catch (error) {
      console.error('❌ Error creating/joining session:', error);
      throw error;
    }
  }

  // Suscribirse a actualizaciones de sesión
  subscribeToSession(
    coupleName: string, 
    callback: (session: CoupleSession | null) => void
  ): () => void {
    console.log(`🔔 Suscribiéndose a actualizaciones de ${coupleName}`);
    
    const subscription = supabase
      .channel(`couples_sessions:couple_name=eq.${coupleName}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'couples_sessions',
          filter: `couple_name=eq.${coupleName}`
        },
        (payload) => {
          console.log('🔄 Actualización de sesión recibida:', payload);
          
          if (payload.new) {
            callback(this.formatSession(payload.new));
          } else if (payload.eventType === 'DELETE') {
            callback(null);
          }
        }
      )
      .subscribe();

    // También obtener el estado actual
    this.getSession(coupleName).then(callback);

    return () => {
      console.log('🧹 Limpiando suscripción');
      subscription.unsubscribe();
    };
  }

  // Obtener sesión actual
  async getSession(coupleName: string): Promise<CoupleSession | null> {
    try {
      const { data, error } = await supabase
        .from('couples_sessions')
        .select('*')
        .eq('couple_name', coupleName)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No encontrado
        }
        throw error;
      }

      return this.formatSession(data);
    } catch (error) {
      console.error('❌ Error getting session:', error);
      return null;
    }
  }

  // Actualizar configuración de ruleta
  async updateWheel(coupleName: string, wheelType: string, options: string[]): Promise<void> {
    try {
      console.log(`🎯 Actualizando ruleta: ${wheelType} con opciones:`, options);
      
      const { error } = await supabase
        .from('couples_sessions')
        .update({
          current_wheel_type: wheelType,
          current_options: options,
          updated_at: new Date().toISOString()
        })
        .eq('couple_name', coupleName);

      if (error) throw error;
      
      console.log('✅ Ruleta actualizada exitosamente');
    } catch (error) {
      console.error('❌ Error updating wheel:', error);
      throw error;
    }
  }

  // Iniciar giro
  async startSpin(coupleName: string, rotation: number, spinnerName: string): Promise<void> {
    try {
      console.log(`🎯 Iniciando giro: ${rotation} radianes por ${spinnerName}`);
      
      const { error } = await supabase
        .from('couples_sessions')
        .update({
          is_spinning: true,
          wheel_rotation: rotation,
          spin_start_time: new Date().toISOString(),
          last_result: null,
          result_for_user: null,
          updated_at: new Date().toISOString()
        })
        .eq('couple_name', coupleName);

      if (error) throw error;
      
      console.log('✅ Giro iniciado exitosamente');
    } catch (error) {
      console.error('❌ Error starting spin:', error);
      throw error;
    }
  }

  // Finalizar giro con resultado
  async endSpin(coupleName: string, result: string, resultForUser: string): Promise<void> {
    try {
      console.log(`🎯 Finalizando giro con resultado: ${result} para ${resultForUser}`);
      
      const { error } = await supabase
        .from('couples_sessions')
        .update({
          is_spinning: false,
          last_result: result,
          result_for_user: resultForUser,
          spin_start_time: null,
          updated_at: new Date().toISOString()
        })
        .eq('couple_name', coupleName);

      if (error) throw error;
      
      console.log('✅ Giro finalizado exitosamente');
    } catch (error) {
      console.error('❌ Error ending spin:', error);
      throw error;
    }
  }

  // Formatear sesión para el frontend
  private formatSession(data: any): CoupleSession {
    return {
      id: data.id,
      couple_name: data.couple_name,
      user1_name: data.user1_name,
      user2_name: data.user2_name,
      current_wheel_type: data.current_wheel_type,
      current_options: data.current_options || [],
      is_spinning: data.is_spinning || false,
      wheel_rotation: data.wheel_rotation || 0,
      spin_start_time: data.spin_start_time ? new Date(data.spin_start_time) : undefined,
      last_result: data.last_result,
      result_for_user: data.result_for_user,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at)
    };
  }

  // Limpiar suscripciones
  cleanup(): void {
    console.log('🧹 Limpiando suscripciones de Supabase');
    // Las suscripciones se limpian automáticamente cuando se desmontan los componentes
  }
}

export const supabaseService = new SupabaseService();