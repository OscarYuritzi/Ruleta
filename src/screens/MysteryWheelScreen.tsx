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

const MysteryWheelScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { userName, coupleName } = route.params as any;

  // States
  const [isConnected, setIsConnected] = useState(false);
  const [partnerName, setPartnerName] = useState<string | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [currentResult, setCurrentResult] = useState('');
  const [isMyResult, setIsMyResult] = useState(true);

  // Mystery wheel options
  const mysteryOptions = ['🎁', '💎', '🌟', '✨', '🎉', '💫', '🎊', '🎈'];

  useEffect(() => {
    // Inicializar sin conexión a Supabase
    setIsConnected(true); // Simular conexión
    setPartnerName('Tu pareja'); // Simular pareja conectada
    
    // Handle back button
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    
    return () => {
      backHandler.remove();
    };
  }, []);

  const handleSpinUpdate = (data: any) => {
    console.log('🎯 Spin update:', data);
    
    setIsSpinning(data.isSpinning);
    setWheelRotation(data.wheelRotation);

    // Show result when spin finishes
    if (!data.isSpinning && data.result) {
      setCurrentResult(data.result);
      setIsMyResult(data.resultForUser === userName);
      setShowResult(true);
    }
  };

  const handlePartnerConnect = (partner: string) => {
    console.log('👥 Partner connected:', partner);
    setPartnerName(partner);
    setIsConnected(true);
  };

  const handlePartnerDisconnect = () => {
    console.log('👋 Partner disconnected');
    setPartnerName(null);
    setIsConnected(false);
  };

  const handleWheelUpdate = (wheelType: string, options: any[]) => {
    console.log('🔄 Wheel updated:', wheelType, options);
    // Mystery wheel options are fixed, no need to update
  };

  const handleSpin = async () => {
    if (!isConnected || isSpinning) return;
    
    try {
      setIsSpinning(true);
      
      const spins = 5 + Math.random() * 5;
      const targetRotation = spins * 2 * Math.PI + Math.random() * 2 * Math.PI;
      
      setWheelRotation(targetRotation);
      
      // Simular resultado después de 3 segundos
      setTimeout(() => {
        const segmentAngle = (2 * Math.PI) / mysteryOptions.length;
        const normalizedAngle = (2 * Math.PI - (targetRotation % (2 * Math.PI))) % (2 * Math.PI);
        const segmentIndex = Math.floor(normalizedAngle / segmentAngle) % mysteryOptions.length;
        const result = mysteryOptions[segmentIndex];
        
        setIsSpinning(false);
        setCurrentResult(result);
        setIsMyResult(true);
        setShowResult(true);
      }, 3000);
    } catch (error) {
      console.error('Spin error:', error);
      Alert.alert('Error', 'No se pudo girar la ruleta.');
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
    // Ready for next spin
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

        {/* Content */}
        <View style={styles.content}>
          {/* Mystery Description */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.mysteryTitle}>🎁 Ruleta Misteriosa 🎁</Text>
            <Text style={styles.description}>
              ¡Las sorpresas se revelan solo al girar! 
              {isConnected && partnerName && (
                `\n\n💕 Sincronizada con ${partnerName}`
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
            spinnerName={isSpinning ? 'me' : undefined}
          />
        </View>

        {/* Result Modal */}
        <ResultModal
          visible={showResult}
          result={currentResult}
          isMyResult={isMyResult}
          partnerName={partnerName || undefined}
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