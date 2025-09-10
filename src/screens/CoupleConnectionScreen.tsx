import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import FloatingParticles from '../components/FloatingParticles';

const CoupleConnectionScreen = () => {
  const navigation = useNavigation();
  const [userName, setUserName] = useState('');
  const [coupleName, setCoupleName] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    if (!userName.trim() || !coupleName.trim()) {
      Alert.alert('❌ Error', 'Por favor completa ambos campos');
      return;
    }

    if (userName.trim().length < 2) {
      Alert.alert('❌ Error', 'Tu nombre debe tener al menos 2 caracteres');
      return;
    }

    if (coupleName.trim().length < 3) {
      Alert.alert('❌ Error', 'El nombre de pareja debe tener al menos 3 caracteres');
      return;
    }

    setIsConnecting(true);

    try {
      console.log(`👤 Usuario: ${userName} - Pareja: ${coupleName}`);
      
      // Simular conexión exitosa
      setTimeout(() => {
        console.log('✅ Conexión simulada exitosa');
        
        // Navegar a la selección de ruletas
        navigation.navigate('WheelSelection', {
          userName: userName.trim(),
          coupleName: coupleName.trim(),
        });
        
        setIsConnecting(false);
      }, 1500);
      
    } catch (error) {
      console.error('❌ Error general:', error);
      Alert.alert('❌ Error', 'Error conectando. Inténtalo de nuevo.');
      setIsConnecting(false);
    }
  };

  return (
    <LinearGradient colors={['#ff9a9e', '#fecfef', '#fecfef']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <FloatingParticles />
        
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.logo}>
                🐶 Ruletas del Amor 💕✨
              </Text>
              <Text style={styles.subtitle}>
                Diversión romántica para parejas 🌟
              </Text>
            </View>

            {/* Connection Card */}
            <View style={styles.connectionCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>💕 Información de Pareja</Text>
                <Text style={styles.cardSubtitle}>
                  Ingresa tu información para comenzar
                </Text>
              </View>

              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Tu Nombre:</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ej: María, Juan..."
                    placeholderTextColor="#999"
                    value={userName}
                    onChangeText={setUserName}
                    maxLength={20}
                    autoCapitalize="words"
                    returnKeyType="next"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Nombre de tu Pareja:</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ej: Ana, Carlos..."
                    placeholderTextColor="#999"
                    value={coupleName}
                    onChangeText={setCoupleName}
                    maxLength={30}
                    autoCapitalize="words"
                    returnKeyType="done"
                    onSubmitEditing={handleConnect}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.connectButton, isConnecting && styles.connectButtonDisabled]}
                  onPress={handleConnect}
                  disabled={isConnecting}
                >
                  <Text style={styles.connectButtonText}>
                    {isConnecting ? '⏳ Iniciando...' : '💑 Comenzar'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Help Section */}
              <View style={styles.helpSection}>
                <Text style={styles.helpTitle}>💡 ¿Qué puedes hacer?</Text>
                <View style={styles.helpList}>
                  <View style={styles.helpItem}>
                    <Text style={styles.helpEmoji}>🎁</Text>
                    <Text style={styles.helpText}>
                      <Text style={styles.bold}>Ruleta Misteriosa:</Text> Sorpresas ocultas
                    </Text>
                  </View>
                  <View style={styles.helpItem}>
                    <Text style={styles.helpEmoji}>🎀</Text>
                    <Text style={styles.helpText}>
                      <Text style={styles.bold}>Ruleta Normal:</Text> Crea opciones personalizadas
                    </Text>
                  </View>
                  <View style={styles.helpItem}>
                    <Text style={styles.helpEmoji}>💗</Text>
                    <Text style={styles.helpText}>
                      <Text style={styles.bold}>Ruleta Sorpresa:</Text> Actividades románticas
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#E30070',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  connectionCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 25,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E30070',
    marginBottom: 10,
  },
  cardSubtitle: {
    fontSize: 16,
    color: '#CCC',
    textAlign: 'center',
    lineHeight: 22,
  },
  bold: {
    fontWeight: 'bold',
    color: '#E30070',
  },
  form: {
    marginBottom: 30,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E30070',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: '#E30070',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 15,
    fontSize: 16,
    color: '#FFF',
  },
  connectButton: {
    backgroundColor: '#E30070',
    borderRadius: 25,
    paddingVertical: 18,
    paddingHorizontal: 40,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#E30070',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  connectButtonDisabled: {
    backgroundColor: '#999',
    shadowOpacity: 0,
    elevation: 0,
  },
  connectButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  helpSection: {
    backgroundColor: 'rgba(227, 0, 112, 0.1)',
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(227, 0, 112, 0.3)',
  },
  helpTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E30070',
    marginBottom: 15,
    textAlign: 'center',
  },
  helpList: {
    gap: 12,
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  helpEmoji: {
    fontSize: 16,
    marginTop: 2,
  },
  helpText: {
    flex: 1,
    fontSize: 14,
    color: '#CCC',
    lineHeight: 20,
  },
});

export default CoupleConnectionScreen;