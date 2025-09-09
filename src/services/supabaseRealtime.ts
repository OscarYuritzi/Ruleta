import { supabase, Database } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

// Interfaces para la sincronización
export interface SpinSyncData {
  isSpinning: boolean;
  wheelRotation: number;
  result?: string;
  resultForUser?: string;
  wheelType: string;
  options: any[];
}

export interface PartnerConnectionData {
  partnerName: string;
  isConnected: boolean;
}

type CoupleSession = Database['public']['Tables']['couples_sessions']['Row'];
type CoupleSessionInsert = Database['public']['Tables']['couples_sessions']['Insert'];
type CoupleSessionUpdate = Database['public']['Tables']['couples_sessions']['Update'];

export class SupabaseRealtimeService {
  private subscription: RealtimeChannel | null = null;
  private currentCoupleName: string | null = null;
  private currentUserName: string | null = null;
  
  // Callbacks para eventos
  private onSpinUpdate: ((data: SpinSyncData) => void) | null = null;
  private onPartnerConnect: ((partnerName: string) => void) | null = null;
  private onPartnerDisconnect: (() => void) | null = null;
  private onWheelUpdate: ((wheelType: string, options: any[]) => void) | null = null;

  // Configurar callbacks para eventos
  setupRealtimeSubscription(
    coupleName: string,
    userName: string,
    onSpinUpdate: (data: SpinSyncData) => void,
    onPartnerConnect: (partnerName: string) => void,
    onPartnerDisconnect: () => void,
    onWheelUpdate: (wheelType: string, options: any[]) => void
  ) {
    this.onSpinUpdate = onSpinUpdate;
    this.onPartnerConnect = onPartnerConnect;
    this.onPartnerDisconnect = onPartnerDisconnect;
    this.onWheelUpdate = onWheelUpdate;
    
    this.setupRealtimeSubscription();
  }

  async connectCouple(userName: string, coupleName: string): Promise<boolean> {
    try {
      console.log(`🔗 Conectando ${userName} a pareja: ${coupleName}`);
      
      this.currentCoupleName = coupleName;
      this.currentUserName = userName;

      // Verificar si ya existe una sesión
      const { data: existingSession, error: fetchError } = await supabase
        .from('couples_sessions')
        .select('*')
        .eq('couple_name', coupleName)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('❌ Error fetching session:', fetchError);
        return false;
      }

      if (existingSession) {
        // Actualizar sesión existente
        if (!existingSession.user2_name && existingSession.user1_name !== userName) {
          // Segundo usuario se une
          const updateData: CoupleSessionUpdate = {
            user2_name: userName,
            updated_at: new Date().toISOString(),
          };

          const { error: updateError } = await supabase
            .from('couples_sessions')
            .update(updateData)
            .eq('couple_name', coupleName);

          if (updateError) {
            console.error('❌ Error updating session:', updateError);
            return false;
          }
          console.log('✅ Connected as second user:', userName);
          
          // Notificar al primer usuario
          if (this.onPartnerConnect) {
            this.onPartnerConnect(existingSession.user1_name);
          }
        } else {
          console.log('✅ Reconnected to existing session:', userName);
          
          // Verificar si hay pareja conectada
          const partnerName = existingSession.user1_name === userName 
            ? existingSession.user2_name 
            : existingSession.user1_name;
            
          if (partnerName && this.onPartnerConnect) {
            this.onPartnerConnect(partnerName);
          }
        }
      } else {
        // Crear nueva sesión
        const insertData: CoupleSessionInsert = {
          couple_name: coupleName,
          user1_name: userName,
          current_wheel_type: 'mystery',
          current_options: [],
          is_spinning: false,
          wheel_rotation: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { error: insertError } = await supabase
          .from('couples_sessions')
          .insert(insertData);

        if (insertError) {
          console.error('❌ Error creating session:', insertError);
          return false;
        }
        console.log('✅ Created new session for:', userName);
      }

      return true;
    } catch (error) {
      console.error('❌ Connection error:', error);
      return false;
    }
  }

  private setupRealtimeSubscription() {
    if (this.subscription) {
      console.log('🔄 Removiendo suscripción anterior');
      this.subscription.unsubscribe();
    }

    console.log(`📡 Configurando suscripción para: ${this.currentCoupleName}`);
    
    this.subscription = supabase
      .channel(`couples_sessions:${this.currentCoupleName}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'couples_sessions',
          filter: `couple_name=eq.${this.currentCoupleName}`
        },
        (payload: any) => {
          console.log('📡 Realtime update received:', payload.eventType);
          this.handleRealtimeUpdate(payload);
        }
      )
      .subscribe((status) => {
        console.log('📡 Realtime subscription status:', status);
      });
  }

  private handleRealtimeUpdate(payload: any) {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    if (!newRecord) return;
    
    // Ignorar nuestras propias actualizaciones
    if (newRecord.user1_name === this.currentUserName || newRecord.user2_name === this.currentUserName) {
      // Solo procesar si es una actualización de estado de giro
      if (eventType === 'UPDATE' && oldRecord) {
        // Detectar cambios en el estado de giro
        if (newRecord.is_spinning !== oldRecord.is_spinning || 
            newRecord.last_result !== oldRecord.last_result) {
          
          const spinData: SpinSyncData = {
            isSpinning: newRecord.is_spinning || false,
            wheelRotation: newRecord.wheel_rotation || 0,
            result: newRecord.last_result,
            resultForUser: newRecord.result_for_user,
            wheelType: newRecord.current_wheel_type || 'mystery',
            options: newRecord.current_options || []
          };
          
          if (this.onSpinUpdate) {
            this.onSpinUpdate(spinData);
          }
        }
        
        // Detectar cambios en configuración de ruleta
        if (newRecord.current_wheel_type !== oldRecord.current_wheel_type ||
            JSON.stringify(newRecord.current_options) !== JSON.stringify(oldRecord.current_options)) {
          
          if (this.onWheelUpdate) {
            this.onWheelUpdate(newRecord.current_wheel_type, newRecord.current_options || []);
          }
        }
      }
      return;
    }
    
    // Manejar conexión/desconexión de pareja
    if (eventType === 'UPDATE') {
      const partnerName = newRecord.user1_name === this.currentUserName 
        ? newRecord.user2_name 
        : newRecord.user1_name;
        
      if (partnerName && this.onPartnerConnect) {
        this.onPartnerConnect(partnerName);
      }
    }
  }

  async startSynchronizedSpin(
    coupleName: string,
    wheelType: string, 
    options: any[], 
    targetRotation: number,
    spinnerName: string
  ): Promise<boolean> {
    if (!this.currentCoupleName) {
      console.error('❌ No couple session active');
      return false;
    }

    try {
      const updateData: CoupleSessionUpdate = {
        is_spinning: true,
        current_wheel_type: wheelType,
        current_options: options,
        wheel_rotation: targetRotation,
        spin_start_time: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('couples_sessions')
        .update(updateData)
        .eq('couple_name', this.currentCoupleName);

      if (error) {
        console.error('❌ Error starting synchronized spin:', error);
        return false;
      }

      console.log('✅ Synchronized spin started by:', spinnerName);
      
      // Simular el giro y calcular resultado después de 3 segundos
      setTimeout(async () => {
        const segmentAngle = (2 * Math.PI) / options.length;
        const normalizedAngle = (2 * Math.PI - (targetRotation % (2 * Math.PI))) % (2 * Math.PI);
        const segmentIndex = Math.floor(normalizedAngle / segmentAngle) % options.length;
        const result = options[segmentIndex];
        
        await this.finishSynchronizedSpin(result, spinnerName);
      }, 3000);
      
      return true;
    } catch (error) {
      console.error('❌ Error in startSynchronizedSpin:', error);
      return false;
    }
  }

  async finishSynchronizedSpin(result: string, resultForUser: string): Promise<boolean> {
    if (!this.currentCoupleName) {
      console.error('❌ No couple session active');
      return false;
    }

    try {
      const updateData: CoupleSessionUpdate = {
        is_spinning: false,
        last_result: result,
        result_for_user: resultForUser,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('couples_sessions')
        .update(updateData)
        .eq('couple_name', this.currentCoupleName);

      if (error) {
        console.error('❌ Error finishing synchronized spin:', error);
        return false;
      }

      console.log('✅ Synchronized spin finished');
      return true;
    } catch (error) {
      console.error('❌ Error in finishSynchronizedSpin:', error);
      return false;
    }
  }

  async updateWheelConfig(coupleName: string, wheelType: string, options: any[]): Promise<boolean> {
    try {
      const updateData: CoupleSessionUpdate = {
        current_wheel_type: wheelType,
        current_options: options,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('couples_sessions')
        .update(updateData)
        .eq('couple_name', coupleName);

      if (error) {
        console.error('❌ Error updating wheel config:', error);
        return false;
      }

      console.log('✅ Wheel config updated');
      return true;
    } catch (error) {
      console.error('❌ Error in updateWheelConfig:', error);
      return false;
    }
  }

  async disconnectFromCouple(coupleName: string, userName: string): Promise<void> {
    try {
      // Si es el segundo usuario, solo limpiar user2_name
      const { data: session } = await supabase
        .from('couples_sessions')
        .select('*')
        .eq('couple_name', coupleName)
        .single();

      if (session && session.user2_name === userName) {
        await supabase
          .from('couples_sessions')
          .update({ 
            user2_name: null,
            updated_at: new Date().toISOString()
          })
          .eq('couple_name', coupleName);
      } else if (session && session.user1_name === userName && !session.user2_name) {
        // Si es el único usuario, eliminar la sesión
        await supabase
          .from('couples_sessions')
          .delete()
          .eq('couple_name', coupleName);
      }
      
      console.log('✅ Disconnected from couple:', coupleName);
    } catch (error) {
      console.error('❌ Error disconnecting from couple:', error);
    }
  }

  async getCurrentSession(): Promise<CoupleSession | null> {
    if (!this.currentCoupleName) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('couples_sessions')
        .select('*')
        .eq('couple_name', this.currentCoupleName)
        .single();

      if (error) {
        console.error('❌ Error fetching current session:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('❌ Error in getCurrentSession:', error);
      return null;
    }
  }

  disconnect() {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
    this.currentCoupleName = null;
    this.currentUserName = null;
    this.onSpinUpdate = null;
    this.onPartnerConnect = null;
    this.onPartnerDisconnect = null;
    this.onWheelUpdate = null;
    console.log('✅ Disconnected from Supabase realtime');
  }
}

export const realtimeService = new SupabaseRealtimeService();