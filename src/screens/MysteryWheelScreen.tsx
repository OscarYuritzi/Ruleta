import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
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
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [currentResult, setCurrentResult] = useState('');

  // Mystery wheel options
  const mysteryOptions = ['🎁', '💎', '🌟', '✨', '🎉', '💫', '🎊', '🎈'];

  useEffect(() => {
    // Handle back button
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    
    return () => {
      backHandler.remove();
    };
  }, []);

  const handleSpin = async () => {
    if (isSpinning) return;
    
    setIsSpinning(true);
    
    // Simulate spinning
    const spins = 5 + Math.random() * 5;
    const targetRotation = spins * 2 * Math.PI + Math.random() * 2 * Math.PI;
    
    setWheelRotation(targetRotation);
    
    // Wait for spin animation to complete
    setTimeout(() => {
      setIsSpinning(false);
      
      // Calculate result
      const segmentAngle = (2 * Math.PI) / mysteryOptions.length;
      const normalizedAngle = (2 * Math.PI - (targetRotation % (2 * Math.PI))) % (2 * Math.PI);
      const segmentIndex = Math.floor(normalizedAngle / segmentAngle) % mysteryOptions.length;
      const result = mysteryOptions[segmentIndex];
      
      setCurrentResult(result);
      setShowResult(true);
    }, 3000);
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
              {'\n\n'}💕 Para: {coupleName}
            </Text>
          </View>

          {/* Wheel */}
          <SynchronizedWheel
            options={mysteryOptions}
            isSpinning={isSpinning}
            wheelRotation={wheelRotation}
            onSpin={handleSpin}
            canSpin={true}
          />
        </View>

        {/* Result Modal */}
        <ResultModal
          visible={showResult}
          result={currentResult}
          isMyResult={true}
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