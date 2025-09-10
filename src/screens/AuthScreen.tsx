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
import { dualDatabaseService } from '../services/dualDatabaseService';

const AuthScreen = () => {
  const navigation = useNavigation();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userName, setUserName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('❌ Error', 'Por favor completa todos los campos');
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      Alert.alert('❌ Error', 'Las contraseñas no coinciden');
      return;
    }

    if (!isLogin && !userName.trim()) {
      Alert.alert('❌ Error', 'Por favor ingresa tu nombre');
      return;
    }

    setIsLoading(true);

    try {
      let user;
      
      if (isLogin) {
        // Login
        user = await dualDatabaseService.loginUser(email.trim(), password);
        console.log('✅ Login exitoso:', user);
        
        // Navegar a pantalla de conexión de pareja
        navigation.navigate('CoupleConnection' as never, {
          userEmail: email.trim(),
          userName: user.displayName || user.email?.split('@')[0] || 'Usuario',
        } as never);
      } else {
        // Registro
        user = await dualDatabaseService.registerUser(email.trim(), password, userName.trim());
        console.log('✅ Registro exitoso:', user);
        
        Alert.alert(
          '🎉 ¡Registro Exitoso!',
          'Tu cuenta ha sido creada correctamente',
          [
            {
              text: 'Continuar',
              onPress: () => {
                navigation.navigate('CoupleConnection' as never, {
                  userEmail: email.trim(),
                  userName: userName.trim(),
                } as never);
              }
            }
          ]
        );
      }
    } catch (error: any) {
      console.error('❌ Error de autenticación:', error);
      
      let errorMessage = 'Error de conexión';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'Usuario no encontrado';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Contraseña incorrecta';
      } else if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Este email ya está registrado';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'La contraseña debe tener al menos 6 caracteres';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Email inválido';
      }
      
      Alert.alert('❌ Error', errorMessage);
    } finally {
      setIsLoading(false);
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
                {isLogin ? 'Inicia sesión para conectar con tu pareja' : 'Crea tu cuenta para comenzar'}
              </Text>
            </View>

            {/* Auth Card */}
            <View style={styles.authCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>
                  {isLogin ? '🔐 Iniciar Sesión' : '📝 Crear Cuenta'}
                </Text>
              </View>

              <View style={styles.form}>
                {/* Email */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email:</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="tu@email.com"
                    placeholderTextColor="#999"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    editable={!isLoading}
                  />
                </View>

                {/* Nombre (solo para registro) */}
                {!isLogin && (
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
                      editable={!isLoading}
                    />
                  </View>
                )}

                {/* Contraseña */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Contraseña:</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Mínimo 6 caracteres"
                    placeholderTextColor="#999"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoComplete="password"
                    editable={!isLoading}
                  />
                </View>

                {/* Confirmar contraseña (solo para registro) */}
                {!isLogin && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Confirmar Contraseña:</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Repite tu contraseña"
                      placeholderTextColor="#999"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry
                      editable={!isLoading}
                    />
                  </View>
                )}

                {/* Auth Button */}
                <TouchableOpacity
                  style={[styles.authButton, isLoading && styles.authButtonDisabled]}
                  onPress={handleAuth}
                  disabled={isLoading}
                >
                  <Text style={styles.authButtonText}>
                    {isLoading 
                      ? `⏳ ${isLogin ? 'Iniciando sesión' : 'Creando cuenta'}...` 
                      : `${isLogin ? '🔐 Iniciar Sesión' : '📝 Crear Cuenta'}`
                    }
                  </Text>
                </TouchableOpacity>

                <Text style={styles.syncInfo}>
                  🔄 Sincronización automática en Firebase y Supabase
                </Text>

                {/* Switch Auth Mode */}
                <TouchableOpacity
                  style={styles.switchButton}
                  onPress={() => setIsLogin(!isLogin)}
                  disabled={isLoading}
                >
                  <Text style={styles.switchButtonText}>
                    {isLogin 
                      ? '¿No tienes cuenta? Regístrate aquí' 
                      : '¿Ya tienes cuenta? Inicia sesión'
                    }
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Help Section */}
              <View style={styles.helpSection}>
                <Text style={styles.helpTitle}>💡 ¿Por qué necesito registrarme?</Text>
                <View style={styles.helpList}>
                  <View style={styles.helpItem}>
                    <Text style={styles.helpEmoji}>🔒</Text>
                    <Text style={styles.helpText}>
                      <Text style={styles.bold}>Seguridad:</Text> Protege tus sesiones de pareja
                    </Text>
                  </View>
                  <View style={styles.helpItem}>
                    <Text style={styles.helpEmoji}>💾</Text>
                    <Text style={styles.helpText}>
                      <Text style={styles.bold}>Persistencia:</Text> Guarda tus configuraciones favoritas
                    </Text>
                  </View>
                  <View style={styles.helpItem}>
                    <Text style={styles.helpEmoji}>🔄</Text>
                    <Text style={styles.helpText}>
                      <Text style={styles.bold}>Sincronización:</Text> Conecta automáticamente con tu pareja
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
  authCard: {
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
  authButton: {
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
  authButtonDisabled: {
    backgroundColor: '#999',
    shadowOpacity: 0,
    elevation: 0,
  },
  authButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  syncInfo: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginTop: 15,
    fontSize: 12,
  },
  switchButton: {
    alignItems: 'center',
    marginTop: 20,
  },
  switchButtonText: {
    color: '#E30070',
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: 'underline',
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
  bold: {
    fontWeight: 'bold',
    color: '#E30070',
  },
});

export default AuthScreen;