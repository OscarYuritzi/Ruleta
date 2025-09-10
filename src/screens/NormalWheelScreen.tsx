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

const NormalWheelScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { userName, coupleName } = route.params as any;

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
      firebaseService.cleanup();
    };
  }, []);

  const initializeSession = async () => {
    try {
      setConnectionStatus('Conectando con Firebase...');
      
      // Crear o unirse a la sesión
      const newSession = await firebaseService.createOrJoinSession(userName, coupleName);
      
      // Configurar la ruleta normal con opciones personalizadas
      await firebaseService.updateWheel(coupleName, 'normal', customOptions);
      
      // Suscribirse a actualizaciones en tiempo real
      firebaseService.subscribeToSession(coupleName, handleSessionUpdate);
      
      setConnectionStatus('Conectado ✅');
    } catch (error) {
      console.error('Error inicializando sesión:', error);
      setConnectionStatus('Error de conexión ❌');
      Alert.alert('Error', 'No se pudo conectar con Firebase');
    }
  };

  const handleSessionUpdate = (updatedSession: CoupleSession | null) => {
    if (!updatedSession) {
      setConnectionStatus('Sesión no encontrada ❌');
      return;
    }

    console.log('🔄 Sesión actualizada:', updatedSession);
    setSession(updatedSession);

    // Determinar el nombre de la pareja
    const partner = updatedSession.user1Name === userName 
      ? updatedSession.user2Name 
      : updatedSession.user1Name;
    
    if (partner && partner !== partnerName) {
      setPartnerName(partner);
      setIsConnected(true);
      setConnectionStatus(`💕 Conectado con ${partner}`);
      
      // Mostrar notificación de conexión
      if (!isConnected) {
        Alert.alert('💕 ¡Pareja Conectada!', `${partner} se ha unido a la sesión`);
      }
    }

    // Sincronizar opciones personalizadas
    if (updatedSession.currentOptions && updatedSession.currentOptions.length > 0) {
      setCustomOptions(updatedSession.currentOptions);
    }

    // Actualizar estado de la ruleta
    setIsSpinning(updatedSession.isSpinning);
    setWheelRotation(updatedSession.wheelRotation);

    // Determinar quién está girando
    if (updatedSession.isSpinning) {
      setSpinnerName(updatedSession.lastSpinner || 'alguien');
    } else {
      setSpinnerName(undefined);
    }

    // Mostrar resultado cuando termine el giro
    if (!updatedSession.isSpinning && updatedSession.lastResult && !showResult) {
      setCurrentResult(updatedSession.lastResult);
      setIsMyResult(updatedSession.resultForUser === userName);
      setShowResult(true);
    }
  };

  const handleSpin = async () => {
    if (!isConnected || isSpinning || !session) {
      Alert.alert('⚠️ Aviso', 'Espera a que tu pareja se conecte para girar juntos');
      return;
    }
    
    try {
      console.log('🎯 Iniciando giro sincronizado...');
      
      const spins = 5 + Math.random() * 5;
      const targetRotation = spins * 2 * Math.PI + Math.random() * 2 * Math.PI;
      
      // Iniciar el giro en Firebase
      await firebaseService.startSpin(coupleName, targetRotation, userName);
      
      // Calcular resultado
      setTimeout(async () => {
        const segmentAngle = (2 * Math.PI) / customOptions.length;
        const normalizedAngle = (2 * Math.PI - (targetRotation % (2 * Math.PI))) % (2 * Math.PI);
        const segmentIndex = Math.floor(normalizedAngle / segmentAngle) % customOptions.length;
        const result = customOptions[segmentIndex];
        
        // Finalizar el giro con resultado
        await firebaseService.endSpin(coupleName, result, userName);
      }, 3000);
      
    } catch (error) {
      console.error('Error en giro:', error);
      Alert.alert('Error', 'No se pudo girar la ruleta.');
    }
  };

  const handleBackPress = () => {
    firebaseService.cleanup();
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
      Alert.alert('⚠️ Aviso', 'Escribe una opción válida');
      return;
    }

    if (customOptions.length >= 8) {
      Alert.alert('⚠️ Límite', 'Máximo 8 opciones permitidas');
      return;
    }

    const updatedOptions = [...customOptions, newOption.trim()];
    setCustomOptions(updatedOptions);
    setNewOption('');

    // Sincronizar con Firebase
    try {
      await firebaseService.updateWheel(coupleName, 'normal', updatedOptions);
    } catch (error) {
      console.error('Error actualizando opciones:', error);
    }
  };

  const removeOption = async (index: number) => {
    if (customOptions.length <= 2) {
      Alert.alert('⚠️ Aviso', 'Mínimo 2 opciones requeridas');
      return;
    }

    const updatedOptions = customOptions.filter((_, i) => i !== index);
    setCustomOptions(updatedOptions);

    // Sincronizar con Firebase
    try {
      await firebaseService.updateWheel(coupleName, 'normal', updatedOptions);
    } catch (error) {
      console.error('Error actualizando opciones:', error);
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
    return isConnected ? '🎯 Girar Ruleta Normal' : '⏳ Esperando pareja...';
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