import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  updateDoc,
  serverTimestamp,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface CoupleSession {
  id: string;
  coupleName: string;
  user1Name: string;
  user2Name?: string;
  currentWheelType: string;
  currentOptions: string[];
  isSpinning: boolean;
  wheelRotation: number;
  spinStartTime?: Date;
  lastResult?: string;
  resultForUser?: string;
  lastSpinner?: string;
  createdAt: Date;
  updatedAt: Date;
}

class FirebaseService {
  private unsubscribeCallbacks: Map<string, () => void> = new Map();

  // Create or join a couple session
  async createOrJoinSession(userName: string, coupleName: string): Promise<CoupleSession> {
    try {
      console.log(`🔥 Firebase: Creando/uniendo sesión para ${userName} en ${coupleName}`);
      
      const sessionRef = doc(db, 'couples_sessions', coupleName);
      const sessionDoc = await getDoc(sessionRef);

      if (sessionDoc.exists()) {
        // Join existing session
        const sessionData = sessionDoc.data() as CoupleSession;
        console.log('📖 Sesión existente encontrada:', sessionData);
        
        if (!sessionData.user2Name && sessionData.user1Name !== userName) {
          // Add as second user
          console.log(`👥 Agregando ${userName} como segundo usuario`);
          await updateDoc(sessionRef, {
            user2Name: userName,
            updatedAt: serverTimestamp()
          });
          
          return {
            ...sessionData,
            user2Name: userName
          };
        }
        
        console.log('✅ Usuario ya existe en la sesión');
        return sessionData;
      } else {
        // Create new session
        console.log('🆕 Creando nueva sesión');
        const newSession: Partial<CoupleSession> = {
          coupleName,
          user1Name: userName,
          currentWheelType: 'normal',
          currentOptions: [],
          isSpinning: false,
          wheelRotation: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        await setDoc(sessionRef, {
          ...newSession,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        console.log('✅ Nueva sesión creada exitosamente');
        return newSession as CoupleSession;
      }
    } catch (error) {
      console.error('❌ Error creating/joining session:', error);
      throw error;
    }
  }

  // Subscribe to session updates
  subscribeToSession(
    coupleName: string, 
    callback: (session: CoupleSession | null) => void
  ): () => void {
    console.log(`🔔 Suscribiéndose a actualizaciones de ${coupleName}`);
    
    const sessionRef = doc(db, 'couples_sessions', coupleName);
    
    const unsubscribe = onSnapshot(sessionRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const session = {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          spinStartTime: data.spinStartTime?.toDate()
        } as CoupleSession;
        
        console.log('🔄 Actualización de sesión recibida:', session);
        callback(session);
      } else {
        console.log('❌ Sesión no encontrada');
        callback(null);
      }
    }, (error) => {
      console.error('❌ Error listening to session:', error);
      callback(null);
    });

    this.unsubscribeCallbacks.set(coupleName, unsubscribe);
    return unsubscribe;
  }

  // Update wheel configuration
  async updateWheel(coupleName: string, wheelType: string, options: string[]): Promise<void> {
    try {
      console.log(`🎯 Actualizando ruleta: ${wheelType} con opciones:`, options);
      
      const sessionRef = doc(db, 'couples_sessions', coupleName);
      await updateDoc(sessionRef, {
        currentWheelType: wheelType,
        currentOptions: options,
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Ruleta actualizada exitosamente');
    } catch (error) {
      console.error('❌ Error updating wheel:', error);
      throw error;
    }
  }

  // Start spinning
  async startSpin(coupleName: string, rotation: number, spinnerName: string): Promise<void> {
    try {
      console.log(`🎯 Iniciando giro: ${rotation} radianes por ${spinnerName}`);
      
      const sessionRef = doc(db, 'couples_sessions', coupleName);
      await updateDoc(sessionRef, {
        isSpinning: true,
        wheelRotation: rotation,
        spinStartTime: serverTimestamp(),
        lastSpinner: spinnerName,
        lastResult: null,
        resultForUser: null,
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Giro iniciado exitosamente');
    } catch (error) {
      console.error('❌ Error starting spin:', error);
      throw error;
    }
  }

  // End spinning with result
  async endSpin(coupleName: string, result: string, resultForUser: string): Promise<void> {
    try {
      console.log(`🎯 Finalizando giro con resultado: ${result} para ${resultForUser}`);
      
      const sessionRef = doc(db, 'couples_sessions', coupleName);
      await updateDoc(sessionRef, {
        isSpinning: false,
        lastResult: result,
        resultForUser: resultForUser,
        spinStartTime: null,
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Giro finalizado exitosamente');
    } catch (error) {
      console.error('❌ Error ending spin:', error);
      throw error;
    }
  }

  // Update last activity (for connection tracking)
  async updateActivity(coupleName: string, userName: string): Promise<void> {
    try {
      const sessionRef = doc(db, 'couples_sessions', coupleName);
      await updateDoc(sessionRef, {
        [`${userName}_lastActivity`]: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('❌ Error updating activity:', error);
      // No throw - this is not critical
    }
  }

  // Check if partner is active (within last 30 seconds)
  isPartnerActive(session: CoupleSession, userName: string): boolean {
    const partnerName = session.user1Name === userName ? session.user2Name : session.user1Name;
    if (!partnerName) return false;

    const lastActivity = (session as any)[`${partnerName}_lastActivity`];
    if (!lastActivity) return false;

    const now = new Date();
    const activityTime = lastActivity.toDate();
    const diffInSeconds = (now.getTime() - activityTime.getTime()) / 1000;

    return diffInSeconds < 30; // Active if last activity was within 30 seconds
  }

  // Cleanup subscriptions
  cleanup(): void {
    console.log('🧹 Limpiando suscripciones de Firebase');
    this.unsubscribeCallbacks.forEach(unsubscribe => unsubscribe());
    this.unsubscribeCallbacks.clear();
  }
}

export const firebaseService = new FirebaseService();