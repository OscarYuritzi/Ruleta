import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  BackHandler,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import SynchronizedWheel from '../components/SynchronizedWheel';
import ResultModal from '../components/ResultModal';
import FloatingParticles from '../components/FloatingParticles';
import { firebaseService, CoupleSession } from '../services/firebaseService';
import { supabaseService } from '../services/supabaseService';

const NormalWheelScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { userName, coupleName, useSupabase } = route.params as any;

  // States
  const [session, setSession] = useState<CoupleSession | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [partnerName, setPartnerName] = useState<string | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [currentResult, setCurrentResult] = useState('');
  const [isMyResult, setIsMyResult] = useState(true);
  const [spinnerName, setSpinnerName] = useState<string | undefined>(undefined);
  const [connectionStatus, setConnectionStatus] = useState('Conectando...');
  
  // Custom options
  const [customOptions, setCustomOptions] = useState<string[]>([
    'Opción 1', 'Opción 2', 'Opción 3', 'Opción 4'
  ]);
  const [newOption, setNewOption] = useState('');
  const [showCustomizer, setShowCustomizer] = useState(false);

  useEffect(() => {
    initializeSession();
    
    // Handle back button
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    
    return () => {
      backHandler.remove();
    };
  }, []);

  const initializeSession = async () => {
    try {
      setConnectionStatus(`Connecting with ${useSupabase ? 'Supabase' : 'Firebase'}...`);
      
      const service = useSupabase ? supabaseService : firebaseService;
      
      // Create or join session
      const newSession = await service.createOrJoinSession(userName, coupleName);
      
      // Configure normal wheel with custom options
      await service.updateWheel(coupleName, 'normal', customOptions);
      
      // Subscribe to real-time updates
      const unsubscribe = service.subscribeToSession(coupleName, handleSessionUpdate);
      
      setConnectionStatus('Connected ✅');
      
      // Save cleanup function
      return unsubscribe;
    } catch (error) {
      console.error('Error initializing session:', error);
      setConnectionStatus(`${useSupabase ? 'Supabase' : 'Firebase'} connection error ❌`);
      Alert.alert('Error', `Could not connect with ${useSupabase ? 'Supabase' : 'Firebase'}`);
    }
  };

  const handleSessionUpdate = (updatedSession: CoupleSession | null) => {
    if (!updatedSession) {
      setConnectionStatus('Session not found ❌');
      return;
    }

    console.log('🔄 Session updated:', updatedSession);
    setSession(updatedSession);

    // Determine partner name
    const partner = updatedSession.user1_name === userName 
      ? updatedSession.user2_name 
      : updatedSession.user1_name;
    
    if (partner && partner !== partnerName) {
      setPartnerName(partner);
      setIsConnected(true);
      setConnectionStatus(`💕 Connected with ${partner}`);
      
      // Show connection notification
      if (!isConnected) {
        Alert.alert('💕 Partner Connected!', `${partner} has joined the session`);
      }
    }

    // Sync custom options
    if (updatedSession.current_options && updatedSession.current_options.length > 0) {
      setCustomOptions(updatedSession.current_options);
    }

    // Update wheel state
    setIsSpinning(updatedSession.is_spinning);
    setWheelRotation(updatedSession.wheel_rotation);

    // Determine who is spinning
    if (updatedSession.is_spinning) {
      setSpinnerName(updatedSession.last_spinner || 'someone');
    } else {
      setSpinnerName(undefined);
    }

    // Show result when spin ends
    if (!updatedSession.is_spinning && updatedSession.last_result && !showResult) {
      setCurrentResult(updatedSession.last_result);
      setIsMyResult(updatedSession.result_for_user === userName);
      setShowResult(true);
    }
  };

  const handleSpin = async () => {
    if (isSpinning) {
      Alert.alert('⚠️ Notice', 'The wheel is already spinning');
      return;
    }
    
    try {
      console.log('🎯 Starting synchronized spin...');
      
      const service = useSupabase ? supabaseService : firebaseService;
      const spins = 5 + Math.random() * 5;
      const targetRotation = spins * 2 * Math.PI + Math.random() * 2 * Math.PI;
      
      // Start spin
      await service.startSpin(coupleName, targetRotation, userName);
      
      // Calculate result
      setTimeout(async () => {
        const segmentAngle = (2 * Math.PI) / customOptions.length;
        const normalizedAngle = (2 * Math.PI - (targetRotation % (2 * Math.PI))) % (2 * Math.PI);
        const segmentIndex = Math.floor(normalizedAngle / segmentAngle) % customOptions.length;
        const result = customOptions[segmentIndex];
        
        // End spin with result
        await service.endSpin(coupleName, result, userName);
      }, 3000);
      
    } catch (error) {
      console.error('Error in spin:', error);
      Alert.alert('Error', 'Could not spin the wheel.');
    }
  };

  const handleBackPress = () => {
    navigation.goBack();
    return true;
  };

  const handleCloseResult = () => {
    setShowResult(false);
  };

  const handleSpinAgain = () => {
    setShowResult(false);
  };

  const addCustomOption = async () => {
    if (!newOption.trim()) {
      Alert.alert('⚠️ Notice', 'Write a valid option');
      return;
    }

    if (customOptions.length >= 8) {
      Alert.alert('⚠️ Limit', 'Maximum 8 options allowed');
      return;
    }

    const updatedOptions = [...customOptions, newOption.trim()];
    setCustomOptions(updatedOptions);
    setNewOption('');

    // Sync with database
    try {
      const service = useSupabase ? supabaseService : firebaseService;
      await service.updateWheel(coupleName, 'normal', updatedOptions);
    } catch (error) {
      console.error('Error updating options:', error);
    }
  };

  const removeOption = async (index: number) => {
    if (customOptions.length <= 2) {
      Alert.alert('⚠️ Notice', 'Minimum 2 options required');
      return;
    }

    const updatedOptions = customOptions.filter((_, i) => i !== index);
    setCustomOptions(updatedOptions);

    // Sync with database
    try {
      const service = useSupabase ? supabaseService : firebaseService;
      await service.updateWheel(coupleName, 'normal', updatedOptions);
    } catch (error) {
      console.error('Error updating options:', error);
    }
  };

  const getSpinButtonText = () => {
    if (isSpinning) {
      if (spinnerName === userName) {
        return '🎯 Girando...';
      } else if (partnerName && spinnerName) {
        return `🎯 ${partnerName} está girando...`;
      }
      return '🎯 Girando...';
    }
    return '🎯 Girar Ruleta Normal';
  };

  return (
    <LinearGradient colors={['#ff9a9e', '#fecfef', '#fecfef']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <FloatingParticles />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
            <Text style={styles.backButtonText}>← Volver</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Ruleta Normal 🎯</Text>
          <TouchableOpacity 
            style={styles.customizeButton} 
            onPress={() => setShowCustomizer(!showCustomizer)}
          >
            <Text style={styles.customizeButtonText}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* Connection Status */}
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>{connectionStatus}</Text>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Customizer */}
          {showCustomizer && (
            <View style={styles.customizerContainer}>
              <Text style={styles.customizerTitle}>🎨 Personalizar Opciones</Text>
              
              {/* Add new option */}
              <View style={styles.addOptionContainer}>
                <TextInput
                  style={styles.optionInput}
                  placeholder="Nueva opción..."
                  placeholderTextColor="#999"
                  value={newOption}
                  onChangeText={setNewOption}
                  maxLength={20}
                />
                <TouchableOpacity style={styles.addButton} onPress={addCustomOption}>
                  <Text style={styles.addButtonText}>➕</Text>
                </TouchableOpacity>
              </View>

              {/* Current options */}
              <View style={styles.optionsList}>
                {customOptions.map((option, index) => (
                  <View key={index} style={styles.optionItem}>
                    <Text style={styles.optionText}>{option}</Text>
                    <TouchableOpacity 
                      style={styles.removeButton} 
                      onPress={() => removeOption(index)}
                    >
                      <Text style={styles.removeButtonText}>❌</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Synchronized Wheel */}
          <View style={styles.wheelContainer}>
            <SynchronizedWheel
              options={customOptions}
              isSpinning={isSpinning}
              wheelRotation={wheelRotation}
              onSpin={handleSpin}
              canSpin={isConnected}
              partnerName={partnerName || undefined}
              spinnerName={spinnerName}
              spinButtonText={getSpinButtonText()}
            />
          </View>
        </ScrollView>

        {/* Result Modal */}
        <ResultModal
          visible={showResult}
          result={currentResult}
          isMyResult={isMyResult}
          onClose={handleCloseResult}
          onSpinAgain={handleSpinAgain}
        />
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    zIndex: 1,
  },
  backButtonText: {
    fontSize: 16,
    color: '#E30070',
    fontWeight: '600',
  },
  title: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E30070',
    textAlign: 'center',
  },
  customizeButton: {
    position: 'absolute',
    right: 20,
    zIndex: 1,
  },
  customizeButtonText: {
    fontSize: 20,
  },
  statusContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E30070',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  scrollView: {
    flex: 1,
  },
  customizerContainer: {
    margin: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 10,
  },
  customizerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 20,
  },
  addOptionContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 10,
  },
  optionInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: '#E30070',
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 10,
    color: '#FFF',
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#E30070',
    borderRadius: 15,
    paddingHorizontal: 15,
    justifyContent: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 18,
  },
  optionsList: {
    gap: 10,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  optionText: {
    flex: 1,
    color: '#FFF',
    fontSize: 16,
  },
  removeButton: {
    padding: 5,
  },
  removeButtonText: {
    fontSize: 16,
  },
  wheelContainer: {
    paddingHorizontal: 20,
  },
});

export default NormalWheelScreen;