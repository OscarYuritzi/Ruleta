import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  BackHandler,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import FloatingParticles from '../components/FloatingParticles';

const SavedWheelsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { userName, coupleName } = route.params as any;

  const [savedWheels, setSavedWheels] = useState([
    {
      id: '1',
      name: 'Citas Románticas',
      type: 'normal',
      options: ['Cena romántica', 'Paseo por el parque', 'Película en casa', 'Picnic'],
      lastUsed: new Date('2024-01-15'),
      color: ['#f093fb', '#f5576c'],
    },
    {
      id: '2',
      name: 'Actividades Divertidas',
      type: 'normal',
      options: ['Karaoke', 'Juegos de mesa', 'Cocinar juntos', 'Bailar'],
      lastUsed: new Date('2024-01-10'),
      color: ['#4facfe', '#00f2fe'],
    },
    {
      id: '3',
      name: 'Sorpresas Especiales',
      type: 'surprise',
      options: ['💕 Abrazo largo', '💋 Beso sorpresa', '🌹 Regalo especial', '💌 Carta de amor'],
      lastUsed: new Date('2024-01-05'),
      color: ['#667eea', '#764ba2'],
    },
  ]);

  useEffect(() => {
    // Handle back button
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    
    return () => {
      backHandler.remove();
    };
  }, []);

  const handleBackPress = () => {
    navigation.goBack();
    return true;
  };

  const handleLoadWheel = (wheel: any) => {
    Alert.alert(
      '🎯 Cargar Ruleta',
      `¿Quieres cargar "${wheel.name}" y usarla con tu pareja?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cargar',
          onPress: () => {
            // Navigate to appropriate wheel screen with loaded options
            if (wheel.type === 'normal') {
              navigation.navigate('NormalWheel' as never, {
                userName,
                coupleName,
                preloadedOptions: wheel.options,
              } as never);
            } else if (wheel.type === 'surprise') {
              navigation.navigate('SurpriseWheel' as never, {
                userName,
                coupleName,
              } as never);
            }
          },
        },
      ]
    );
  };

  const handleDeleteWheel = (wheelId: string, wheelName: string) => {
    Alert.alert(
      '🗑️ Eliminar Ruleta',
      `¿Estás seguro de que quieres eliminar "${wheelName}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            setSavedWheels(prev => prev.filter(wheel => wheel.id !== wheelId));
            Alert.alert('✅ Eliminado', 'La ruleta ha sido eliminada');
          },
        },
      ]
    );
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getWheelIcon = (type: string) => {
    switch (type) {
      case 'normal': return '🎯';
      case 'surprise': return '💕';
      case 'mystery': return '🎁';
      default: return '🎲';
    }
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
          <Text style={styles.title}>Ruletas Guardadas 💾</Text>
        </View>

        {/* User Info */}
        <View style={styles.userInfo}>
          <Text style={styles.welcomeText}>Tus configuraciones guardadas 📂</Text>
          <Text style={styles.coupleText}>Pareja: {coupleName} 💕</Text>
        </View>

        {/* Saved Wheels List */}
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.wheelsContainer}>
            {savedWheels.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>📭</Text>
                <Text style={styles.emptyTitle}>No hay ruletas guardadas</Text>
                <Text style={styles.emptyDescription}>
                  Crea y guarda tus configuraciones favoritas para usarlas más tarde
                </Text>
              </View>
            ) : (
              savedWheels.map((wheel) => (
                <TouchableOpacity
                  key={wheel.id}
                  style={styles.wheelCard}
                  onPress={() => handleLoadWheel(wheel)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={wheel.color}
                    style={styles.wheelGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.wheelContent}>
                      <View style={styles.wheelHeader}>
                        <Text style={styles.wheelIcon}>{getWheelIcon(wheel.type)}</Text>
                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={() => handleDeleteWheel(wheel.id, wheel.name)}
                        >
                          <Text style={styles.deleteButtonText}>🗑️</Text>
                        </TouchableOpacity>
                      </View>
                      
                      <Text style={styles.wheelName}>{wheel.name}</Text>
                      <Text style={styles.wheelType}>
                        Tipo: {wheel.type === 'normal' ? 'Normal' : wheel.type === 'surprise' ? 'Sorpresa' : 'Misteriosa'}
                      </Text>
                      
                      <View style={styles.optionsPreview}>
                        <Text style={styles.optionsTitle}>Opciones ({wheel.options.length}):</Text>
                        <Text style={styles.optionsText} numberOfLines={2}>
                          {wheel.options.slice(0, 3).join(' • ')}
                          {wheel.options.length > 3 ? '...' : ''}
                        </Text>
                      </View>
                      
                      <Text style={styles.lastUsed}>
                        Último uso: {formatDate(wheel.lastUsed)}
                      </Text>
                      
                      <View style={styles.loadButton}>
                        <Text style={styles.loadButtonText}>Cargar Ruleta ✨</Text>
                      </View>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* Add New Wheel Button */}
          <TouchableOpacity
            style={styles.addWheelCard}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#ffecd2', '#fcb69f']}
              style={styles.wheelGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.wheelContent}>
                <Text style={styles.wheelIcon}>➕</Text>
                <Text style={styles.wheelName}>Crear Nueva Ruleta</Text>
                <Text style={styles.wheelDescription}>
                  Vuelve al menú principal para crear y guardar nuevas configuraciones
                </Text>
                <View style={styles.loadButton}>
                  <Text style={styles.loadButtonText}>Ir al Menú 🎲</Text>
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
    fontSize: 18,
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
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#E30070',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
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
  addWheelCard: {
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
  wheelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 15,
  },
  wheelIcon: {
    fontSize: 40,
  },
  deleteButton: {
    padding: 5,
  },
  deleteButtonText: {
    fontSize: 20,
  },
  wheelName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  wheelType: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 15,
  },
  optionsPreview: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
    padding: 15,
    width: '100%',
    marginBottom: 15,
  },
  optionsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  optionsText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
  },
  lastUsed: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 20,
  },
  loadButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  loadButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  wheelDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
});

export default SavedWheelsScreen;