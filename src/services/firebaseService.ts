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
  createdAt: Date;
  updatedAt: Date;
}

class FirebaseService {
  private unsubscribeCallbacks: Map<string, () => void> = new Map();

  // Create or join a couple session
  async createOrJoinSession(userName: string, coupleName: string): Promise<CoupleSession> {
    try {
      const sessionRef = doc(db, 'couples_sessions', coupleName);
      const sessionDoc = await getDoc(sessionRef);

      if (sessionDoc.exists()) {
        // Join existing session
        const sessionData = sessionDoc.data() as CoupleSession;
        
        if (!sessionData.user2Name && sessionData.user1Name !== userName) {
          // Add as second user
          await updateDoc(sessionRef, {
            user2Name: userName,
            updatedAt: serverTimestamp()
          });
          
          return {
            ...sessionData,
            user2Name: userName
          };
        }
        
        return sessionData;
      } else {
        // Create new session
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

        return newSession as CoupleSession;
      }
    } catch (error) {
      console.error('Error creating/joining session:', error);
      throw error;
    }
  }

  // Subscribe to session updates
  subscribeToSession(
    coupleName: string, 
    callback: (session: CoupleSession | null) => void
  ): () => void {
    const sessionRef = doc(db, 'couples_sessions', coupleName);
    
    const unsubscribe = onSnapshot(sessionRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        callback({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          spinStartTime: data.spinStartTime?.toDate()
        } as CoupleSession);
      } else {
        callback(null);
      }
    }, (error) => {
      console.error('Error listening to session:', error);
      callback(null);
    });

    this.unsubscribeCallbacks.set(coupleName, unsubscribe);
    return unsubscribe;
  }

  // Update wheel configuration
  async updateWheel(coupleName: string, wheelType: string, options: string[]): Promise<void> {
    try {
      const sessionRef = doc(db, 'couples_sessions', coupleName);
      await updateDoc(sessionRef, {
        currentWheelType: wheelType,
        currentOptions: options,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating wheel:', error);
      throw error;
    }
  }

  // Start spinning
  async startSpin(coupleName: string, rotation: number): Promise<void> {
    try {
      const sessionRef = doc(db, 'couples_sessions', coupleName);
      await updateDoc(sessionRef, {
        isSpinning: true,
        wheelRotation: rotation,
        spinStartTime: serverTimestamp(),
        lastResult: null,
        resultForUser: null,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error starting spin:', error);
      throw error;
    }
  }

  // End spinning with result
  async endSpin(coupleName: string, result: string, resultForUser: string): Promise<void> {
    try {
      const sessionRef = doc(db, 'couples_sessions', coupleName);
      await updateDoc(sessionRef, {
        isSpinning: false,
        lastResult: result,
        resultForUser: resultForUser,
        spinStartTime: null,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error ending spin:', error);
      throw error;
    }
  }

  // Cleanup subscriptions
  cleanup(): void {
    this.unsubscribeCallbacks.forEach(unsubscribe => unsubscribe());
    this.unsubscribeCallbacks.clear();
  }
}

export const firebaseService = new FirebaseService();