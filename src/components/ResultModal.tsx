import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth } = Dimensions.get('window');

interface ResultModalProps {
  visible: boolean;
  result: string;
  isMyResult: boolean;
  partnerName?: string;
  onClose: () => void;
  onSpinAgain: () => void;
}

const ResultModal: React.FC<ResultModalProps> = ({
  visible,
  result,
  isMyResult,
  partnerName,
  onClose,
  onSpinAgain,
}) => {
  const scaleAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [visible]);

  const getResultTitle = () => {
    if (isMyResult) {
      return '🎯 ¡Tu Resultado!';
    } else {
      return `🎁 Resultado de ${partnerName}`;
    }
  };

  const getResultEmoji = () => {
    return isMyResult ? '🎉' : '💝';
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View 
          style={[
            styles.modalContainer,
            {
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          <LinearGradient
            colors={isMyResult ? ['#E30070', '#A0025C'] : ['#00D2D3', '#0984E3']}
            style={styles.modalContent}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>{getResultTitle()}</Text>
            </View>

            {/* Result Icon */}
            <Text style={styles.resultEmoji}>{getResultEmoji()}</Text>

            {/* Result Text */}
            <View style={styles.resultContainer}>
              <Text style={styles.resultText}>{result}</Text>
            </View>

            {/* Decorative Emojis */}
            <Text style={styles.decorativeEmojis}>
              {isMyResult ? '💕✨🌟💗' : '👀💖🎁✨'}
            </Text>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.spinAgainButton]}
                onPress={onSpinAgain}
              >
                <Text style={styles.buttonText}>💫 Girar de Nuevo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.closeButton]}
                onPress={onClose}
              >
                <Text style={styles.buttonText}>❤️ Cerrar</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    width: Math.min(screenWidth * 0.9, 400),
    borderRadius: 30,
    overflow: 'hidden',
  },
  modalContent: {
    padding: 40,
    alignItems: 'center',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    fontFamily: 'System',
  },
  resultEmoji: {
    fontSize: 60,
    marginBottom: 20,
  },
  resultContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    minHeight: 80,
    justifyContent: 'center',
  },
  resultText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    lineHeight: 28,
  },
  decorativeEmojis: {
    fontSize: 24,
    marginBottom: 30,
    letterSpacing: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 15,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  spinAgainButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  closeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ResultModal;