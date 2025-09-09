import { supabase, Database } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

type CoupleSession = Database['public']['Tables']['couples_sessions']['Row'];
type CoupleSessionInsert = Database['public']['Tables']['couples_sessions']['Insert'];
type CoupleSessionUpdate = Database['public']['Tables']['couples_sessions']['Update'];

export class SupabaseRealtimeService {
  private subscription: RealtimeChannel | null = null;
  private currentCoupleName: string | null = null;
  private currentUserName: string | null = null;
  private onPartnerUpdate: ((session: any) => void) | null = null;

  setOnPartnerUpdate(callback: (session: any) => void) {
    this.onPartnerUpdate = callback;
  }

  async connectCouple(coupleName: string, userName: string): Promise<boolean> {
    try {
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
        } else {
          console.log('✅ Reconnected to existing session:', userName);
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

      // Configurar suscripción en tiempo real
      this.setupRealtimeSubscription();

      return true;
    } catch (error) {
      console.error('❌ Connection error:', error);
      return false;
    }
  }

  private setupRealtimeSubscription() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }

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
          if (this.onPartnerUpdate) {
            this.onPartnerUpdate(payload.new);
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Realtime subscription status:', status);
      });
  }

  async startSynchronizedSpin(wheelType: string, options: string[]): Promise<boolean> {
    if (!this.currentCoupleName) {
      console.error('❌ No couple session active');
      return false;
    }

    try {
      const updateData: CoupleSessionUpdate = {
        is_spinning: true,
        current_wheel_type: wheelType,
        current_options: options,
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

      console.log('✅ Synchronized spin started');
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
        wheel_rotation: Math.random() * 360,
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
    this.onPartnerUpdate = null;
    console.log('✅ Disconnected from Supabase realtime');
  }
}

export const realtimeService = new SupabaseRealtimeService();