import { firebaseService } from './firebaseService';
import { supabaseService } from './supabaseService';

export interface User {
  id: string;
  email: string;
  username: string;
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
  created_at: Date;
  updated_at: Date;
}

class DualDatabaseService {
  // Autenticación - Se ejecuta en ambas bases de datos
  async registerUser(email: string, password: string, username: string): Promise<User> {
    try {
      // Registrar en Firebase
      const firebaseUser = await firebaseService.registerUser(email, password, username);
      
      // Registrar en Supabase
      const supabaseUser = await supabaseService.registerUser(email, password, username);
      
      console.log('✅ Usuario registrado en Firebase y Supabase');
      
      // Retornar el usuario de Firebase como principal
      return firebaseUser;
    } catch (error) {
      console.error('❌ Error registrando usuario:', error);
      throw error;
    }
  }

  async loginUser(email: string, password: string): Promise<User> {
    try {
      // Login en Firebase
      const firebaseUser = await firebaseService.loginUser(email, password);
      
      // Login en Supabase
      try {
        await supabaseService.loginUser(email, password);
        console.log('✅ Login exitoso en Firebase y Supabase');
      } catch (supabaseError) {
        console.log('⚠️ Login en Supabase falló, pero Firebase exitoso');
      }
      
      return firebaseUser;
    } catch (error) {
      console.error('❌ Error en login:', error);
      throw error;
    }
  }

  // Sesiones de pareja - Se sincronizan en ambas bases de datos
  async createCoupleSession(coupleName: string, userName: string): Promise<CoupleSession> {
    try {
      // Crear en Firebase
      const firebaseSession = await firebaseService.createCoupleSession(coupleName, userName);
      
      // Crear en Supabase
      try {
        await supabaseService.createCoupleSession(coupleName, userName);
        console.log('✅ Sesión creada en Firebase y Supabase');
      } catch (supabaseError) {
        console.log('⚠️ Error creando en Supabase, pero Firebase exitoso');
      }
      
      return firebaseSession;
    } catch (error) {
      console.error('❌ Error creando sesión:', error);
      throw error;
    }
  }

  async joinCoupleSession(coupleName: string, userName: string): Promise<CoupleSession> {
    try {
      // Unirse en Firebase
      const firebaseSession = await firebaseService.joinCoupleSession(coupleName, userName);
      
      // Unirse en Supabase
      try {
        await supabaseService.joinCoupleSession(coupleName, userName);
        console.log('✅ Unido a sesión en Firebase y Supabase');
      } catch (supabaseError) {
        console.log('⚠️ Error uniéndose en Supabase, pero Firebase exitoso');
      }
      
      return firebaseSession;
    } catch (error) {
      console.error('❌ Error uniéndose a sesión:', error);
      throw error;
    }
  }

  async updateWheelState(
    coupleName: string,
    wheelType: string,
    options: string[],
    isSpinning: boolean,
    rotation: number,
    result?: string,
    resultForUser?: string
  ): Promise<void> {
    try {
      // Actualizar en Firebase
      await firebaseService.updateWheelState(
        coupleName, wheelType, options, isSpinning, rotation, result, resultForUser
      );
      
      // Actualizar en Supabase
      try {
        await supabaseService.updateWheelState(
          coupleName, wheelType, options, isSpinning, rotation, result, resultForUser
        );
        console.log('✅ Estado actualizado en Firebase y Supabase');
      } catch (supabaseError) {
        console.log('⚠️ Error actualizando Supabase, pero Firebase exitoso');
      }
    } catch (error) {
      console.error('❌ Error actualizando estado:', error);
      throw error;
    }
  }

  // Listeners - Solo Firebase para tiempo real (más confiable)
  subscribeToSession(coupleName: string, callback: (session: CoupleSession | null) => void): () => void {
    return firebaseService.subscribeToSession(coupleName, callback);
  }

  async getCoupleSession(coupleName: string): Promise<CoupleSession | null> {
    try {
      // Obtener de Firebase como principal
      return await firebaseService.getCoupleSession(coupleName);
    } catch (error) {
      console.error('❌ Error obteniendo sesión:', error);
      return null;
    }
  }
}

export const dualDatabaseService = new DualDatabaseService();