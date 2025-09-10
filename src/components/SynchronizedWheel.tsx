import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
  TouchableOpacity,
  Text,
} from 'react-native';
import Svg, { Circle, Path, Text as SvgText } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth } = Dimensions.get('window');
const wheelSize = Math.min(screenWidth * 0.8, 300);

interface SynchronizedWheelProps {
  options: string[];
  isSpinning: boolean;
  wheelRotation: number;
  onSpin: () => void;
  canSpin: boolean;
  partnerName?: string;
  spinnerName?: string;
}

const SynchronizedWheel: React.FC<SynchronizedWheelProps> = ({
  options,
  isSpinning,
  wheelRotation,
  onSpin,
  canSpin,
  partnerName,
  spinnerName,
}) => {
  const rotationAnim = useRef(new Animated.Value(0)).current;
  const pointerAnim = useRef(new Animated.Value(1)).current;
  const [currentRotation, setCurrentRotation] = useState(0);

  // Animate wheel rotation
  useEffect(() => {
    if (isSpinning) {
      // Start spinning animation
      rotationAnim.setValue(currentRotation);
      
      Animated.timing(rotationAnim, {
        toValue: wheelRotation,
        duration: 3000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();

      // Animate pointer during spin
      Animated.loop(
        Animated.sequence([
          Animated.timing(pointerAnim, {
            toValue: 0.8,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(pointerAnim, {
            toValue: 1.2,
            duration: 100,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      // Stop pointer animation
      Animated.timing(pointerAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
      
      setCurrentRotation(wheelRotation);
    }
  }, [isSpinning, wheelRotation]);

  // Generate wheel segments
  const generateWheelSegments = () => {
    if (options.length === 0) return null;

    const colors = [
      '#FF6B9D', '#C44569', '#F8B500', '#FECA57',
      '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3',
      '#FF9F43', '#10AC84', '#EE5A6F', '#60A3BC'
    ];

    const segmentAngle = 360 / options.length;
    const radius = wheelSize / 2 - 20;
    const centerX = wheelSize / 2;
    const centerY = wheelSize / 2;

    return options.map((option, index) => {
      const startAngle = index * segmentAngle - 90; // Start from top
      const endAngle = startAngle + segmentAngle;
      
      const startAngleRad = (startAngle * Math.PI) / 180;
      const endAngleRad = (endAngle * Math.PI) / 180;
      
      const x1 = centerX + radius * Math.cos(startAngleRad);
      const y1 = centerY + radius * Math.sin(startAngleRad);
      const x2 = centerX + radius * Math.cos(endAngleRad);
      const y2 = centerY + radius * Math.sin(endAngleRad);
      
      const largeArcFlag = segmentAngle > 180 ? 1 : 0;
      
      const pathData = [
        `M ${centerX} ${centerY}`,
        `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        'Z'
      ].join(' ');

      // Text position
      const textAngle = startAngleRad + (segmentAngle * Math.PI) / 360;
      const textRadius = radius * 0.7;
      const textX = centerX + textRadius * Math.cos(textAngle);
      const textY = centerY + textRadius * Math.sin(textAngle);

      return (
        <React.Fragment key={index}>
          <Path
            d={pathData}
            fill={colors[index % colors.length]}
            stroke="#FFFFFF"
            strokeWidth="2"
          />
          <SvgText
            x={textX}
            y={textY}
            fontSize="14"
            fontWeight="bold"
            fill="#FFFFFF"
            textAnchor="middle"
            alignmentBaseline="middle"
          >
            {option.length > 10 ? option.substring(0, 10) + '...' : option}
          </SvgText>
        </React.Fragment>
      );
    });
  };

  const getSpinButtonText = () => {
    if (isSpinning) {
      if (spinnerName && partnerName) {
        return spinnerName === 'me' ? '🎯 Girando...' : `🎯 ${partnerName} está girando...`;
      }
      return '🎯 Girando...';
    }
    return canSpin ? '🎯 Girar Ruleta' : '⏳ Esperando pareja...';
  };

  const getSpinButtonStyle = () => {
    if (isSpinning) return styles.spinButtonSpinning;
    if (!canSpin) return styles.spinButtonDisabled;
    return styles.spinButton;
  };

  return (
    <View style={styles.container}>
      {/* Wheel Pointer */}
      <Animated.View 
        style={[
          styles.pointer,
          {
            transform: [{ scale: pointerAnim }]
          }
        ]}
      >
        <Text style={styles.pointerText}>▼</Text>
      </Animated.View>

      {/* Wheel */}
      <Animated.View
        style={[
          styles.wheelContainer,
          {
            transform: [
              {
                rotate: rotationAnim.interpolate({
                  inputRange: [0, Math.PI * 2],
                  outputRange: ['0deg', '360deg'],
                }),
              },
            ],
          },
        ]}
      >
        <Svg width={wheelSize} height={wheelSize} style={styles.wheel}>
          <Circle
            cx={wheelSize / 2}
            cy={wheelSize / 2}
            r={wheelSize / 2 - 10}
            fill="transparent"
            stroke="#000000"
            strokeWidth="4"
          />
          {generateWheelSegments()}
        </Svg>
      </Animated.View>

      {/* Spin Button */}
      <TouchableOpacity
        style={getSpinButtonStyle()}
        onPress={onSpin}
        disabled={!canSpin || isSpinning}
      >
        <Text style={styles.spinButtonText}>
          {getSpinButtonText()}
        </Text>
      </TouchableOpacity>

      {/* Partner Status */}
      {partnerName && (
        <View style={styles.partnerStatus}>
          <Text style={styles.partnerText}>💕 Con: {partnerName}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  pointer: {
    position: 'absolute',
    top: 10,
    zIndex: 10,
  },
  pointerText: {
    fontSize: 40,
    color: '#E30070',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  wheelContainer: {
    marginTop: 30,
    marginBottom: 30,
  },
  wheel: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  spinButton: {
    backgroundColor: '#E30070',
    paddingHorizontal: 40,
    paddingVertical: 20,
    borderRadius: 25,
    shadowColor: '#E30070',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  spinButtonSpinning: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 40,
    paddingVertical: 20,
    borderRadius: 25,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  spinButtonDisabled: {
    backgroundColor: '#CCCCCC',
    paddingHorizontal: 40,
    paddingVertical: 20,
    borderRadius: 25,
  },
  spinButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  partnerStatus: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 20,
  },
  partnerText: {
    color: '#00D2D3',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SynchronizedWheel;