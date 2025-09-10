import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  BackHandler,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import SynchronizedWheel from '../components/SynchronizedWheel';
import ResultModal from '../components/ResultModal';
import FloatingParticles from '../components/FloatingParticles';
import { firebaseService, CoupleSession } from '../services/firebaseService';

const SurpriseWheelScreen = () => {
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

  // Romantic surprise options
  const surpriseOptions = [
    '💕 Abrazo de 30 segundos',
    '💋 Beso apasionado',
    '🌹 Regalar una flor',
    '💌 Escribir una carta de amor',
    '🎵 Cantar una canción romántica',
    '💃 Bailar juntos',
    '🍫 Compartir un dulce',
    '👀 Mirarse a los ojos por 1 minuto'
  ];

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
      
      // Configurar la ruleta sorpresa
      await firebaseService.updateWheel(coupleName, 'surprise', surpriseOptions);
      
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
        const segmentAngle = (2 * Math.PI) / surpriseOptions.length;
        const normalizedAngle = (2 * Math.PI - (targetRotation % (2 * Math.PI))) % (2 * Math.PI);
        const segmentIndex = Math.floor(normalizedAngle / segmentAngle) % surpriseOptions.length;
        const result = surpriseOptions[segmentIndex];
        
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

  const getSpinButtonText = () => {
    if (isSpinning) {
      if (spinnerName === userName) {
        return '🎯 Girando...';
      } else if (partnerName && spinnerName) {
        return `🎯 ${partnerName} está girando...`;
      }
      return '🎯 Girando...';
    }
    return isConnected ? '🎯 Girar Ruleta Sorpresa' : '⏳ Esperando pareja...';
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
          <Text style={styles.title}>Ruleta Sorpresa 💕</Text>
        </View>

        {/* Connection Status */}
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>{connectionStatus}</Text>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Surprise Description */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.surpriseTitle}>💕 Ruleta Sorpresa 💕</Text>
            <Text style={styles.description}>
              ¡Actividades románticas especiales para parejas!
              {isConnected && partnerName && (
                `\n\n💕 Sincronizada en tiempo real con ${partnerName}`
              )}
            </Text>
            
            {/* Preview of some options */}
            <View style={styles.previewContainer}>
              <Text style={styles.previewTitle}>Algunas sorpresas incluyen:</Text>
              <Text style={styles.previewText}>💋 Besos apasionados</Text>
              <Text style={styles.previewText}>💃 Bailes románticos</Text>
              <Text style={styles.previewText}>💌 Cartas de amor</Text>
              <Text style={styles.previewText}>🌹 Gestos tiernos</Text>
            </View>
          </View>

          {/* Synchronized Wheel */}
          <SynchronizedWheel
            options={surpriseOptions}
            isSpinning={isSpinning}
            wheelRotation={wheelRotation}
            onSpin={handleSpin}
            canSpin={isConnected}
            partnerName={partnerName || undefined}
            spinnerName={spinnerName}
            spinButtonText={getSpinButtonText()}
          />
        </View>

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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  descriptionContainer: {
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 20,
    padding: 20,
  },
  surpriseTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 10,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 15,
  },
  previewContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 15,
    width: '100%',
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 10,
  },
  previewText: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 5,
  },
});

export default SurpriseWheelScreen;