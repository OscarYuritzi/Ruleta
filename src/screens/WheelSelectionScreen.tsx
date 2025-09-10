import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  BackHandler,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import FloatingParticles from '../components/FloatingParticles';

const WheelSelectionScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { userName, coupleName, useSupabase } = route.params as any;

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        navigation.goBack();
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription?.remove();
    }, [navigation])
  );

  const wheelOptions = [
    {
      id: 'mystery',
      title: '🎁 Ruleta Misteriosa',
      description: 'Sorpresas que se revelan solo al girar',
      gradient: ['#667eea', '#764ba2'],
      screen: 'MysteryWheel',
      icon: '🎁',
    },
    {
      id: 'normal',
      title: '🎯 Ruleta Normal',
      description: 'Personaliza tus propias opciones',
      gradient: ['#f093fb', '#f5576c'],
      screen: 'NormalWheel',
      icon: '🎯',
    },
    {
      id: 'surprise',
      title: '💕 Ruleta Sorpresa',
      description: 'Actividades románticas especiales',
      gradient: ['#4facfe', '#00f2fe'],
      screen: 'SurpriseWheel',
      icon: '💕',
    },
  ];

  const handleWheelSelect = (wheelOption: any) => {
    navigation.navigate(wheelOption.screen as never, {
      userName,
      coupleName,
      useSupabase,
    } as never);
  };

  const handleBackPress = () => {
    navigation.goBack();
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
          <Text style={styles.title}>Elige tu Ruleta 🎲</Text>
        </View>

        {/* User Info */}
        <View style={styles.userInfo}>
          <Text style={styles.welcomeText}>¡Hola {userName}! 👋</Text>
          <Text style={styles.coupleText}>Pareja: {coupleName} 💕</Text>
        </View>

        {/* Wheel Options */}
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.wheelsContainer}>
            {wheelOptions.map((wheel) => (
              <TouchableOpacity
                key={wheel.id}
                style={styles.wheelCard}
                onPress={() => handleWheelSelect(wheel)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={wheel.gradient}
                  style={styles.wheelGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.wheelContent}>
                    <Text style={styles.wheelIcon}>{wheel.icon}</Text>
                    <Text style={styles.wheelTitle}>{wheel.title}</Text>
                    <Text style={styles.wheelDescription}>{wheel.description}</Text>
                    <View style={styles.selectButton}>
                      <Text style={styles.selectButtonText}>Seleccionar ✨</Text>
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>

          {/* Saved Wheels Option */}
          <TouchableOpacity
            style={styles.savedWheelsCard}
            onPress={() => navigation.navigate('SavedWheels' as never, { userName, coupleName, useSupabase } as never)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#ffecd2', '#fcb69f']}
              style={styles.wheelGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.wheelContent}>
                <Text style={styles.wheelIcon}>💾</Text>
                <Text style={styles.wheelTitle}>Ruletas Guardadas</Text>
                <Text style={styles.wheelDescription}>Accede a tus configuraciones favoritas</Text>
                <View style={styles.selectButton}>
                  <Text style={styles.selectButtonText}>Ver Guardadas 📂</Text>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
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
  userInfo: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E30070',
    marginBottom: 5,
  },
  coupleText: {
    fontSize: 16,
    color: '#666',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 15,
  },
  scrollView: {
    flex: 1,
  },
  wheelsContainer: {
    paddingHorizontal: 20,
    gap: 20,
  },
  wheelCard: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  savedWheelsCard: {
    marginHorizontal: 20,
    marginBottom: 30,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  wheelGradient: {
    padding: 25,
  },
  wheelContent: {
    alignItems: 'center',
  },
  wheelIcon: {
    fontSize: 50,
    marginBottom: 15,
  },
  wheelTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
    textAlign: 'center',
  },
  wheelDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  selectButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  selectButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default WheelSelectionScreen;