import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const FloatingParticles = () => {
  const particles = useRef(
    Array.from({ length: 15 }, (_, index) => ({
      id: index,
      animatedValue: new Animated.Value(0),
      x: Math.random() * screenWidth,
      y: Math.random() * screenHeight,
      size: Math.random() * 20 + 10,
      emoji: ['💕', '💖', '✨', '🌟', '💫', '🎀', '🌸', '💗'][Math.floor(Math.random() * 8)],
    }))
  ).current;

  useEffect(() => {
    const animations = particles.map((particle) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(particle.animatedValue, {
            toValue: 1,
            duration: 3000 + Math.random() * 2000,
            useNativeDriver: true,
          }),
          Animated.timing(particle.animatedValue, {
            toValue: 0,
            duration: 3000 + Math.random() * 2000,
            useNativeDriver: true,
          }),
        ])
      );
    });

    animations.forEach((animation) => animation.start());

    return () => {
      animations.forEach((animation) => animation.stop());
    };
  }, []);

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.map((particle) => (
        <Animated.View
          key={particle.id}
          style={[
            styles.particle,
            {
              left: particle.x,
              top: particle.y,
              transform: [
                {
                  translateY: particle.animatedValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -50],
                  }),
                },
                {
                  scale: particle.animatedValue.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.5, 1, 0.5],
                  }),
                },
              ],
              opacity: particle.animatedValue.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.3, 1, 0.3],
              }),
            },
          ]}
        >
          <Animated.Text style={[styles.emoji, { fontSize: particle.size }]}>
            {particle.emoji}
          </Animated.Text>
        </Animated.View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  particle: {
    position: 'absolute',
  },
  emoji: {
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});

export default FloatingParticles;