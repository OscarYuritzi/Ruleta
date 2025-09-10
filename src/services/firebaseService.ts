import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  updateDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile,
  User
} from 'firebase/auth';

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
  createdAt: Date;
  updatedAt: Date;
}

class FirebaseService {
  private unsubscribeCallbacks: Map<string, () => void> = new Map();

  // Authentication methods
  async signUp(email: string, password: string, displayName: string): Promise<User> {
    try {
      console.log('🔥 Firebase: Creating user account');
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update user profile with display name
      await updateProfile(userCredential.user, {
        displayName: displayName
      });
      
      console.log('✅ User created successfully:', userCredential.user);
      return userCredential.user;
    } catch (error) {
      console.error('❌ Error creating user:', error);
      throw error;
    }
  }

  async signIn(email: string, password: string): Promise<User> {
    try {
      console.log('🔥 Firebase: Signing in user');
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ User signed in successfully:', userCredential.user);
      return userCredential.user;
    } catch (error) {
      console.error('❌ Error signing in:', error);
      throw error;
    }
  }

  getCurrentUser(): User | null {
    return auth.currentUser;
  }

  async signOut(): Promise<void> {
    try {
      await auth.signOut();
      console.log('✅ User signed out successfully');
    } catch (error) {
      console.error('❌ Error signing out:', error);
      throw error;
    }
  }

  // Create or join a couple session
  async createOrJoinSession(userName: string, coupleName: string): Promise<CoupleSession> {
    try {
      console.log(`🔥 Firebase: Creating/joining session for ${userName} in ${coupleName}`);
      
      const sessionRef = doc(db, 'couples_sessions', coupleName.toLowerCase().replace(/\s+/g, '_'));
      const sessionDoc = await getDoc(sessionRef);

      if (sessionDoc.exists()) {
        // Join existing session
        const sessionData = sessionDoc.data() as CoupleSession;
        console.log('📖 Existing session found:', sessionData);
        
        if (!sessionData.user2_name && sessionData.user1_name !== userName) {
          // Add as second user
          console.log(`👥 Adding ${userName} as second user`);
          await updateDoc(sessionRef, {
            user2_name: userName,
            updatedAt: serverTimestamp()
          });
          
          return {
            ...sessionData,
            user2_name: userName,
            updatedAt: new Date()
          };
        }
        
        console.log('✅ User already exists in session');
        return sessionData;
      } else {
        // Create new session
        console.log('🆕 Creating new session');
        const newSession: Partial<CoupleSession> = {
          couple_name: coupleName,
          user1_name: userName,
          current_wheel_type: 'normal',
          current_options: ['Opción 1', 'Opción 2', 'Opción 3', 'Opción 4'],
          is_spinning: false,
          wheel_rotation: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        await setDoc(sessionRef, {
          ...newSession,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        console.log('✅ New session created successfully');
        return {
          id: sessionRef.id,
          ...newSession,
          createdAt: new Date(),
          updatedAt: new Date()
        } as CoupleSession;
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
    console.log(`🔔 Subscribing to updates for ${coupleName}`);
    
    const sessionRef = doc(db, 'couples_sessions', coupleName.toLowerCase().replace(/\s+/g, '_'));
    
    const unsubscribe = onSnapshot(sessionRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const session = {
          id: doc.id,
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
          spin_start_time: data.spin_start_time instanceof Timestamp ? data.spin_start_time.toDate() : undefined
        } as CoupleSession;
        
        console.log('🔄 Session update received:', session);
        callback(session);
      } else {
        console.log('❌ Session not found');
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
      console.log(`🎯 Updating wheel: ${wheelType} with options:`, options);
      
      const sessionRef = doc(db, 'couples_sessions', coupleName.toLowerCase().replace(/\s+/g, '_'));
      await updateDoc(sessionRef, {
        current_wheel_type: wheelType,
        current_options: options,
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Wheel updated successfully');
    } catch (error) {
      console.error('❌ Error updating wheel:', error);
      throw error;
    }
  }

  // Start spinning
  async startSpin(coupleName: string, rotation: number, spinnerName: string): Promise<void> {
    try {
      console.log(`🎯 Starting spin: ${rotation} radians by ${spinnerName}`);
      
      const sessionRef = doc(db, 'couples_sessions', coupleName.toLowerCase().replace(/\s+/g, '_'));
      await updateDoc(sessionRef, {
        is_spinning: true,
        wheel_rotation: rotation,
        spin_start_time: serverTimestamp(),
        last_spinner: spinnerName,
        last_result: null,
        result_for_user: null,
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Spin started successfully');
    } catch (error) {
      console.error('❌ Error starting spin:', error);
      throw error;
    }
  }

  // End spinning with result
  async endSpin(coupleName: string, result: string, resultForUser: string): Promise<void> {
    try {
      console.log(`🎯 Ending spin with result: ${result} for ${resultForUser}`);
      
      const sessionRef = doc(db, 'couples_sessions', coupleName.toLowerCase().replace(/\s+/g, '_'));
      await updateDoc(sessionRef, {
        is_spinning: false,
        last_result: result,
        result_for_user: resultForUser,
        spin_start_time: null,
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Spin ended successfully');
    } catch (error) {
      console.error('❌ Error ending spin:', error);
      throw error;
    }
  }

  // Update last activity (for connection tracking)
  async updateActivity(coupleName: string, userName: string): Promise<void> {
    try {
      const sessionRef = doc(db, 'couples_sessions', coupleName.toLowerCase().replace(/\s+/g, '_'));
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
    const partnerName = session.user1_name === userName ? session.user2_name : session.user1_name;
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
    console.log('🧹 Cleaning up Firebase subscriptions');
    this.unsubscribeCallbacks.forEach(unsubscribe => unsubscribe());
    this.unsubscribeCallbacks.clear();
  }
}

export const firebaseService = new FirebaseService();