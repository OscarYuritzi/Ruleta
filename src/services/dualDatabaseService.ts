import { firebaseService } from './firebaseService';
import { supabaseService } from './supabaseService';

export interface User {
  id: string;
  email: string;
  displayName?: string;
}

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
  last_spinner?: string;
  created_at: Date;
  updated_at: Date;
}

class DualDatabaseService {
  // Autenticación - Se ejecuta en ambas bases de datos
  async registerUser(email: string, password: string, username: string): Promise<User> {
    try {
      console.log('🔄 Registrando usuario en ambas bases de datos...');
      
      // Registrar en Firebase (principal)
      const firebaseUser = await firebaseService.signUp(email, password, username);
      
      // Registrar en Supabase (backup)
      try {
        await supabaseService.signUp(email, password, username);
        console.log('✅ Usuario registrado en Firebase y Supabase');
      } catch (supabaseError) {
        console.log('⚠️ Error registrando en Supabase, pero Firebase exitoso');
      }
      
      // Retornar el usuario de Firebase como principal
      return {
        id: firebaseUser.uid,
        email: firebaseUser.email || email,
        displayName: firebaseUser.displayName || username,
      };
    } catch (error) {
      console.error('❌ Error registrando usuario:', error);
      throw error;
    }
  }

  async loginUser(email: string, password: string): Promise<User> {
    try {
      console.log('🔄 Iniciando sesión en ambas bases de datos...');
      
      // Login en Firebase (principal)
      const firebaseUser = await firebaseService.signIn(email, password);
      
      // Login en Supabase (backup)
      try {
        await supabaseService.signIn(email, password);
        console.log('✅ Login exitoso en Firebase y Supabase');
      } catch (supabaseError) {
        console.log('⚠️ Login en Supabase falló, pero Firebase exitoso');
      }
      
      return {
        id: firebaseUser.uid,
        email: firebaseUser.email || email,
        displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuario',
      };
    } catch (error) {
      console.error('❌ Error en login:', error);
      throw error;
    }
  }

  // Sesiones de pareja - Se sincronizan en ambas bases de datos
  async createOrJoinSession(userName: string, coupleName: string): Promise<CoupleSession> {
    try {
      console.log('🔄 Creando/uniendo sesión en ambas bases de datos...');
      
      // Crear/unir en Firebase (principal)
      const firebaseSession = await firebaseService.createOrJoinSession(userName, coupleName);
      
      // Crear/unir en Supabase (backup)
      try {
        await supabaseService.createOrJoinSession(userName, coupleName);
        console.log('✅ Sesión sincronizada en Firebase y Supabase');
      } catch (supabaseError) {
        console.log('⚠️ Error sincronizando en Supabase, pero Firebase exitoso');
      }
      
      return firebaseSession;
    } catch (error) {
      console.error('❌ Error creando/uniendo sesión:', error);
      throw error;
    }
  }

  // Actualizar configuración de ruleta
  async updateWheel(coupleName: string, wheelType: string, options: string[]): Promise<void> {
    try {
      console.log('🔄 Actualizando ruleta en ambas bases de datos...');
      
      // Actualizar en Firebase (principal)
      await firebaseService.updateWheel(coupleName, wheelType, options);
      
      // Actualizar en Supabase (backup)
      try {
        await supabaseService.updateWheel(coupleName, wheelType, options);
        console.log('✅ Ruleta actualizada en Firebase y Supabase');
      } catch (supabaseError) {
        console.log('⚠️ Error actualizando en Supabase, pero Firebase exitoso');
      }
    } catch (error) {
      console.error('❌ Error actualizando ruleta:', error);
      throw error;
    }
  }

  // Iniciar giro
  async startSpin(coupleName: string, rotation: number, spinnerName: string): Promise<void> {
    try {
      console.log('🔄 Iniciando giro en ambas bases de datos...');
      
      // Iniciar en Firebase (principal)
      await firebaseService.startSpin(coupleName, rotation, spinnerName);
      
      // Iniciar en Supabase (backup)
      try {
        await supabaseService.startSpin(coupleName, rotation, spinnerName);
        console.log('✅ Giro iniciado en Firebase y Supabase');
      } catch (supabaseError) {
        console.log('⚠️ Error iniciando giro en Supabase, pero Firebase exitoso');
      }
    } catch (error) {
      console.error('❌ Error iniciando giro:', error);
      throw error;
    }
  }

  // Finalizar giro
  async endSpin(coupleName: string, result: string, resultForUser: string): Promise<void> {
    try {
      console.log('🔄 Finalizando giro en ambas bases de datos...');
      
      // Finalizar en Firebase (principal)
      await firebaseService.endSpin(coupleName, result, resultForUser);
      
      // Finalizar en Supabase (backup)
      try {
        await supabaseService.endSpin(coupleName, result, resultForUser);
        console.log('✅ Giro finalizado en Firebase y Supabase');
      } catch (supabaseError) {
        console.log('⚠️ Error finalizando giro en Supabase, pero Firebase exitoso');
      }
    } catch (error) {
      console.error('❌ Error finalizando giro:', error);
      throw error;
    }
  }

  // Listeners - Solo Firebase para tiempo real (más confiable)
  subscribeToSession(coupleName: string, callback: (session: CoupleSession | null) => void): () => void {
    return firebaseService.subscribeToSession(coupleName, callback);
  }

  // Limpiar suscripciones
  cleanup(): void {
    console.log('🧹 Limpiando suscripciones');
    firebaseService.cleanup();
  }
}

export const dualDatabaseService = new DualDatabaseService();