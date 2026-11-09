import Ionicons from '@expo/vector-icons/Ionicons';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { Image, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Field, PrimaryButton, Text, showMessage } from './src/components/ui';
import { useAuth } from './src/context/AuthContext';
import { colors } from './src/theme/colors';

const logo = require('./assets/images/logo.png');

// Tela de entrada no mesmo estilo da tela 1 do Figma.
const Login = ({ navigation, route }) => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const passwordInputRef = useRef(null);

  useEffect(() => {
    if (route.params?.registeredUsername) {
      setUsername(route.params.registeredUsername);
    }
  }, [route.params?.registeredUsername]);

  // Confere usuário e senha no banco de dados na nuvem.
  // Depois do login, o App.js abre a área do cliente ou da empresa.
  const handleLogin = async () => {
    if (!username.trim() || !password) {
      showMessage('Campos obrigatórios', 'Informe usuário e senha.');
      return;
    }
    setIsLoading(true);
    try {
      await login(username.trim().toLowerCase(), password);
    } catch (error) {
      setIsLoading(false);
      showMessage('Não foi possível entrar', error.message);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView behavior="padding" style={styles.flex}>
        <ScrollView
          automaticallyAdjustKeyboardInsets
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <Image accessibilityLabel="Logo PetEats" resizeMode="contain" source={logo} style={styles.logo} />
            <Text style={styles.subtitle}>
              Ração e petiscos do pet shop do seu bairro, entregues na sua porta.
            </Text>

            <View style={styles.form}>
              <Field
                autoCapitalize="none"
                autoCorrect={false}
                label="Usuário"
                placeholder="seu usuário"
                returnKeyType="next"
                value={username}
                onChangeText={setUsername}
                onSubmitEditing={() => passwordInputRef.current?.focus()}
              />
              <Field
                autoCapitalize="none"
                inputRef={passwordInputRef}
                label="Senha"
                placeholder="••••••••"
                returnKeyType="done"
                right={
                  <Pressable
                    accessibilityLabel={isPasswordVisible ? 'Ocultar senha' : 'Mostrar senha'}
                    accessibilityRole="button"
                    hitSlop={10}
                    onPress={() => setIsPasswordVisible((visible) => !visible)}
                  >
                    <Ionicons
                      color={colors.textSecondary}
                      name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                    />
                  </Pressable>
                }
                secureTextEntry={!isPasswordVisible}
                value={password}
                onChangeText={setPassword}
                onSubmitEditing={handleLogin}
              />

              <PrimaryButton label="Entrar" loading={isLoading} style={styles.button} onPress={handleLogin} />

              <View style={styles.linkRow}>
                <Text style={styles.linkText}>Não tem conta?</Text>
                <Pressable accessibilityRole="link" hitSlop={10} onPress={() => navigation.navigate('Registro')}>
                  <Text style={styles.link}>Cadastre-se</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.surface,
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  // Formulário alinhado no topo: assim o teclado do celular não cobre os campos.
  container: {
    alignItems: 'center',
    flexGrow: 1,
    paddingBottom: 32,
    paddingHorizontal: 24,
    paddingTop: 28,
  },
  content: {
    alignItems: 'center',
    maxWidth: 420,
    width: '100%',
  },
  logo: {
    height: 150,
    width: 220,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 26,
    marginTop: 6,
    paddingHorizontal: 18,
    textAlign: 'center',
  },
  form: {
    alignSelf: 'stretch',
    gap: 12,
  },
  button: {
    marginTop: 6,
  },
  linkRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
    justifyContent: 'center',
    marginTop: 6,
  },
  linkText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  link: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '600',
  },
});

export default Login;
