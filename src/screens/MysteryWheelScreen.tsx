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
import { StackNavigationProp } from '@react-navigation/stack';
import SynchronizedWheel from '../components/SynchronizedWheel';
import ResultModal from '../components/ResultModal';
import FloatingParticles from '../components/FloatingParticles';
import { dualDatabaseService } from '../services/dualDatabaseService';
import { CoupleSession } from '../services/dualDatabaseService';
import { RootStackParamList } from '../../App';

type MysteryWheelScreenNavigationProp = StackNavigationProp<RootStackParamList, 'MysteryWheel'>;

const MysteryWheelScreen = () => {
  const navigation = useNavigation<MysteryWheelScreenNavigationProp>();
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

  // Mystery wheel options
  const mysteryOptions = ['🎁', '💎', '🌟', '✨', '🎉', '💫', '🎊', '🎈'];

  useEffect(() => {
    initializeSession();
    
    // Handle back button
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    
    return () => {
      backHandler.remove();
      dualDatabaseService.cleanup();
    };
  }, []);

  const initializeSession = async () => {
    try {
      setConnectionStatus('Conectando...');
      
      // Crear o unirse a la sesión
      const newSession = await dualDatabaseService.createOrJoinSession(userName, coupleName);
      
      // Configurar la ruleta misteriosa
      await dualDatabaseService.updateWheel(coupleName, 'mystery', mysteryOptions);
      
      // Suscribirse a actualizaciones en tiempo real
      dualDatabaseService.subscribeToSession(coupleName, handleSessionUpdate);
      
      setConnectionStatus('Conectado ✅');
    } catch (error) {
      console.error('Error inicializando sesión:', error);
      setConnectionStatus('Error de conexión ❌');
      Alert.alert('Error', 'No se pudo conectar');
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
    const partner = updatedSession.user1_name === userName 
      ? updatedSession.user2_name 
      : updatedSession.user1_name;
    
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
    setIsSpinning(updatedSession.is_spinning);
    setWheelRotation(updatedSession.wheel_rotation);

    // Determinar quién está girando
    if (updatedSession.is_spinning) {
      // Lógica para determinar quién inició el giro (simplificada)
      setSpinnerName(updatedSession.last_spinner || 'alguien');
    } else {
      setSpinnerName(undefined);
    }

    // Mostrar resultado cuando termine el giro
    if (!updatedSession.is_spinning && updatedSession.last_result && !showResult) {
      setCurrentResult(updatedSession.last_result);
      setIsMyResult(updatedSession.result_for_user === userName);
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
      
      // Iniciar el giro
      await dualDatabaseService.startSpin(coupleName, targetRotation, userName);
      
      // Calcular resultado
      setTimeout(async () => {
        const segmentAngle = (2 * Math.PI) / mysteryOptions.length;
        const normalizedAngle = (2 * Math.PI - (targetRotation % (2 * Math.PI))) % (2 * Math.PI);
        const segmentIndex = Math.floor(normalizedAngle / segmentAngle) % mysteryOptions.length;
        const result = mysteryOptions[segmentIndex];
        
        // Finalizar el giro con resultado
        await dualDatabaseService.endSpin(coupleName, result, userName);
      }, 3000);
      
    } catch (error) {
      console.error('Error en giro:', error);
      Alert.alert('Error', 'No se pudo girar la ruleta.');
    }
  };

  const handleBackPress = () => {
    dualDatabaseService.cleanup();
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
    return isConnected ? '🎯 Girar Ruleta Misteriosa' : '⏳ Esperando pareja...';
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
          <Text style={styles.title}>Ruleta Misteriosa 🎁</Text>
        </View>

        {/* Connection Status */}
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>{connectionStatus}</Text>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Mystery Description */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.mysteryTitle}>🎁 Ruleta Misteriosa 🎁</Text>
            <Text style={styles.description}>
              ¡Las sorpresas se revelan solo al girar!
              {isConnected && partnerName && (
                `\n\n💕 Sincronizada en tiempo real con ${partnerName}`
              )}
            </Text>
          </View>

          {/* Synchronized Wheel */}
          <SynchronizedWheel
            options={mysteryOptions}
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
  mysteryTitle: {
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
  },
});

export default MysteryWheelScreen;