import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { BASE_URL } from '@/services/api';

export default function LoginScreen() {
  const router = useRouter();
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const realizarLogin = async () => {
    if (!email || !password) {
      Alert.alert('Atenção', 'Por favor, preencha o e-mail e a senha.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${BASE_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        await SecureStore.setItemAsync('userToken', data.token);
        await SecureStore.setItemAsync('userEmail', email.trim().toLowerCase());

        if (data.user?.role) {
          await SecureStore.setItemAsync('userRole', data.user.role);
        }

        if (data.user?.name) {
          await SecureStore.setItemAsync('userName', data.user.name);
        }

        if (data.user?.id !== undefined && data.user?.id !== null) {
          await SecureStore.setItemAsync('userId', String(data.user.id));
        }

        router.replace('/(tabs)/dashboard');
      } else {
        Alert.alert('Erro', data.message || 'Credenciais inválidas.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Erro de Conexão', 'Não foi possível conectar ao servidor. O Laravel está rodando?');
    } finally {
      setLoading(false);
    }
  };

  return (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.container}>

          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <View style={styles.logoBox}>
                <Text style={styles.logoText}>SP</Text>
                <View style={styles.notificationDot} />
              </View>
            </View>
            <Text style={styles.title}>Support Pocket</Text>
            <Text style={styles.subtitle}>Gestão de Atendimento</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>E-mail corporativo</Text>
              <TextInput
                  style={styles.input}
                  placeholder="nome@empresa.com.br"
                  placeholderTextColor="#9ca3af"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Senha</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                    style={styles.passwordInput}
                    placeholder="Digite sua senha"
                    placeholderTextColor="#9ca3af"
                    secureTextEntry={!mostrarSenha}
                    value={password}
                    onChangeText={setPassword}
                />
                <TouchableOpacity style={styles.eyeIcon} onPress={() => setMostrarSenha(!mostrarSenha)}>
                  <Ionicons name={mostrarSenha ? 'eye-outline' : 'eye-off-outline'} size={24} color="#6b7280" />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
                style={[styles.button, loading && { opacity: 0.7 }]}
                activeOpacity={0.8}
                onPress={realizarLogin}
                disabled={loading}
            >
              {loading ? (
                  <ActivityIndicator color="#ffffff" />
              ) : (
                  <Text style={styles.buttonText}>Entrar</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity>
              <Text style={styles.forgotPassword}>Esqueci minha senha</Text>
            </TouchableOpacity>
          </View>

        </View>
      </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff', justifyContent: 'center', paddingHorizontal: 32 },
  header: { alignItems: 'center', marginBottom: 48 },
  logoContainer: { marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5 },
  logoBox: { width: 96, height: 96, backgroundColor: '#2563eb', borderRadius: 24, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  logoText: { color: '#ffffff', fontSize: 40, fontWeight: '900', fontStyle: 'italic' },
  notificationDot: { position: 'absolute', top: 16, right: 16, width: 16, height: 16, backgroundColor: '#60a5fa', borderRadius: 8 },
  title: { fontSize: 30, fontWeight: '800', color: '#111827', letterSpacing: -0.5 },
  subtitle: { fontSize: 16, color: '#6b7280', fontWeight: '500', marginTop: 8 },
  form: { gap: 20 },
  inputGroup: { marginBottom: 4 },
  label: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 8, marginLeft: 4 },
  input: { backgroundColor: '#f3f4f6', borderRadius: 16, paddingHorizontal: 20, paddingVertical: 16, fontSize: 16, color: '#1f2937' },
  passwordContainer: { position: 'relative', justifyContent: 'center' },
  passwordInput: { backgroundColor: '#f3f4f6', borderRadius: 16, paddingHorizontal: 20, paddingVertical: 16, paddingRight: 50, fontSize: 16, color: '#1f2937' },
  eyeIcon: { position: 'absolute', right: 16, padding: 4 },
  button: { backgroundColor: '#2563eb', borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginTop: 8, shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  buttonText: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
  footer: { marginTop: 32, alignItems: 'center' },
  forgotPassword: { color: '#2563eb', fontSize: 14, fontWeight: '700', textDecorationLine: 'underline' },
});