import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Types
export interface CoupleSession {
  id: string;
  couple_name: string;
  user1_name: string;
  user2_name: string | null;
  current_wheel_type: string;
  current_options: any[];
  is_spinning: boolean;
  wheel_rotation: number;
  spin_start_time: string | null;
  last_result: string | null;
  result_for_user: string | null;
  created_at: string;
  updated_at: string;
}

export interface SpinSyncData {
  isSpinning: boolean;
  wheelRotation: number;
  spinStartTime: string | null;
  result: string | null;
  resultForUser: string | null;
}

class SupabaseRealtimeService {
  private channel: RealtimeChannel | null = null;
  private currentCoupleName: string | null = null;
  private currentUserName: string | null = null;

  // Connect couple
  async connectCouple(userName: string, coupleName: string): Promise<CoupleSession> {
    console.log(`🔗 Connecting ${userName} to couple: ${coupleName}`);
    
    // Check if couple session exists
    const { data: existingSession } = await supabase
      .from('couples_sessions')
      .select('*')
      .eq('couple_name', coupleName)
      .single();

    if (existingSession) {
      // Join existing session as user2
      if (!existingSession.user2_name && existingSession.user1_name !== userName) {
        const { data, error } = await supabase
          .from('couples_sessions')
          .update({ user2_name: userName })
          .eq('couple_name', coupleName)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
      
      // User is already in session, just return it
      return existingSession;
    } else {
      // Create new session as user1
      const { data, error } = await supabase
        .from('couples_sessions')
        .insert({
          couple_name: coupleName,
          user1_name: userName,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }
  }

  // Setup realtime subscription
  setupRealtimeSubscription(
    coupleName: string,
    userName: string,
    onSpinUpdate: (data: SpinSyncData) => void,
    onPartnerConnect: (partnerName: string) => void,
    onPartnerDisconnect: () => void,
    onWheelUpdate: (wheelType: string, options: any[]) => void
  ) {
    this.currentCoupleName = coupleName;
    this.currentUserName = userName;

    // Remove existing channel
    if (this.channel) {
      supabase.removeChannel(this.channel);
    }

    // Create new channel
    this.channel = supabase
      .channel(`couple-${coupleName}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'couples_sessions',
          filter: `couple_name=eq.${coupleName}`,
        },
        (payload) => {
          console.log('📡 Realtime update:', payload);
          this.handleRealtimeUpdate(payload, userName, {
            onSpinUpdate,
            onPartnerConnect,
            onPartnerDisconnect,
            onWheelUpdate,
          });
        }
      )
      .subscribe((status) => {
        console.log(`📡 Subscription status: ${status}`);
      });
  }

  // Handle realtime updates
  private handleRealtimeUpdate(
    payload: any,
    userName: string,
    callbacks: {
      onSpinUpdate: (data: SpinSyncData) => void;
      onPartnerConnect: (partnerName: string) => void;
      onPartnerDisconnect: () => void;
      onWheelUpdate: (wheelType: string, options: any[]) => void;
    }
  ) {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    if (eventType === 'UPDATE' && newRecord) {
      // Partner connected
      if (oldRecord?.user2_name === null && newRecord.user2_name) {
        const partnerName = newRecord.user1_name === userName 
          ? newRecord.user2_name 
          : newRecord.user1_name;
        callbacks.onPartnerConnect(partnerName);
      }

      // Partner disconnected (user2 set to null)
      if (oldRecord?.user2_name && newRecord.user2_name === null) {
        callbacks.onPartnerDisconnect();
      }

      // Spin state changed
      if (oldRecord?.is_spinning !== newRecord.is_spinning ||
          oldRecord?.wheel_rotation !== newRecord.wheel_rotation ||
          oldRecord?.last_result !== newRecord.last_result) {
        
        callbacks.onSpinUpdate({
          isSpinning: newRecord.is_spinning,
          wheelRotation: newRecord.wheel_rotation,
          spinStartTime: newRecord.spin_start_time,
          result: newRecord.last_result,
          resultForUser: newRecord.result_for_user,
        });
      }

      // Wheel configuration changed
      if (oldRecord?.current_wheel_type !== newRecord.current_wheel_type ||
          JSON.stringify(oldRecord?.current_options) !== JSON.stringify(newRecord.current_options)) {
        
        callbacks.onWheelUpdate(newRecord.current_wheel_type, newRecord.current_options);
      }
    }
  }

  // Start synchronized spin
  async startSynchronizedSpin(
    coupleName: string,
    wheelType: string,
    options: any[],
    targetRotation: number,
    spinnerUserName: string
  ): Promise<string> {
    console.log(`🎯 Starting synchronized spin for couple: ${coupleName}`);
    
    const { error } = await supabase
      .from('couples_sessions')
      .update({
        is_spinning: true,
        wheel_rotation: targetRotation,
        spin_start_time: new Date().toISOString(),
        current_wheel_type: wheelType,
        current_options: options,
        last_result: null,
        result_for_user: null,
      })
      .eq('couple_name', coupleName);

    if (error) throw error;

    // Calculate result after spin animation
    return new Promise((resolve) => {
      setTimeout(() => {
        const result = this.calculateSpinResult(options, targetRotation);
        this.finishSynchronizedSpin(coupleName, result, spinnerUserName);
        resolve(result);
      }, 3000); // 3 second spin duration
    });
  }

  // Finish synchronized spin with result
  async finishSynchronizedSpin(
    coupleName: string,
    result: string,
    resultForUser: string
  ): Promise<void> {
    console.log(`🎉 Finishing spin with result: ${result} for ${resultForUser}`);
    
    const { error } = await supabase
      .from('couples_sessions')
      .update({
        is_spinning: false,
        last_result: result,
        result_for_user: resultForUser,
      })
      .eq('couple_name', coupleName);

    if (error) throw error;
  }

  // Update wheel configuration
  async updateWheelConfig(
    coupleName: string,
    wheelType: string,
    options: any[]
  ): Promise<void> {
    const { error } = await supabase
      .from('couples_sessions')
      .update({
        current_wheel_type: wheelType,
        current_options: options,
      })
      .eq('couple_name', coupleName);

    if (error) throw error;
  }

  // Calculate spin result based on rotation
  private calculateSpinResult(options: any[], rotation: number): string {
    if (options.length === 0) return '';
    
    const segmentAngle = (2 * Math.PI) / options.length;
    const normalizedAngle = (2 * Math.PI - (rotation % (2 * Math.PI))) % (2 * Math.PI);
    const segmentIndex = Math.floor(normalizedAngle / segmentAngle) % options.length;
    
    return options[segmentIndex];
  }

  // Disconnect couple (set user2 to null)
  async disconnectFromCouple(coupleName: string, userName: string): Promise<void> {
    const { data: session } = await supabase
      .from('couples_sessions')
      .select('*')
      .eq('couple_name', coupleName)
      .single();

    if (session) {
      if (session.user1_name === userName) {
        // If user1 disconnects, promote user2 to user1
        await supabase
          .from('couples_sessions')
          .update({
            user1_name: session.user2_name || 'unknown',
            user2_name: null,
          })
          .eq('couple_name', coupleName);
      } else {
        // If user2 disconnects, just set user2 to null
        await supabase
          .from('couples_sessions')
          .update({ user2_name: null })
          .eq('couple_name', coupleName);
      }
    }
  }

  // Cleanup
  disconnect() {
    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
  }
}

export const realtimeService = new SupabaseRealtimeService();