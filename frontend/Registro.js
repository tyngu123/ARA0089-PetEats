import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useRef, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from './src/context/AuthContext';
import { colors } from './src/theme/colors';

const logo = require('./assets/images/logo.png');
const fontFamily = Platform.select({
  web: 'Poppins, Nunito, sans-serif',
  default: 'Poppins',
});

const showMessage = (title, message) => {
  if (Platform.OS === 'web') {
    globalThis.alert(`${title}\n\n${message}`);
    return;
  }

  Alert.alert(title, message);
};

const Registro = ({ navigation }) => {
  const { registerAccount } = useAuth();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [focusedField, setFocusedField] = useState(null);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmationVisible, setIsConfirmationVisible] = useState(false);

  const usernameInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const confirmationInputRef = useRef(null);

  const handleRegister = () => {
    if (!name.trim() || !username.trim() || !password || !passwordConfirmation) {
      showMessage('Campos obrigatórios', 'Preencha todos os campos para continuar.');
      return;
    }

    if (password.length < 6) {
      showMessage('Senha muito curta', 'Use pelo menos 6 caracteres na senha.');
      return;
    }

    if (password !== passwordConfirmation) {
      showMessage('Senhas diferentes', 'Confira a confirmação da senha.');
      return;
    }

    registerAccount({
      name: name.trim(),
      username: username.trim(),
      password,
    });

    showMessage('Cadastro concluído', 'Sua conta foi criada com sucesso.');
    navigation.navigate('Login', { registeredUsername: username.trim() });
  };

  const renderVisibilityButton = (visible, onPress, label) => (
    <Pressable
      accessibilityLabel={visible ? `Ocultar ${label}` : `Mostrar ${label}`}
      accessibilityRole="button"
      hitSlop={10}
      style={styles.visibilityButton}
      onPress={onPress}
    >
      <Ionicons
        color={colors.textSecondary}
        name={visible ? 'eye-off-outline' : 'eye-outline'}
        size={21}
      />
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <Pressable
              accessibilityHint="Retorna para a tela de login"
              accessibilityLabel="Voltar para o login"
              accessibilityRole="button"
              hitSlop={10}
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons color={colors.primary} name="arrow-back" size={22} />
              <Text style={styles.backButtonText}>Voltar</Text>
            </Pressable>

            <View style={styles.logoArea}>
              <View style={styles.logoGlow} />
              <Image
                accessibilityLabel="Logo PetEats"
                resizeMode="contain"
                source={logo}
                style={styles.logo}
              />
            </View>

            <View style={styles.header}>
              <View style={styles.eyebrow}>
                <Ionicons color={colors.accent} name="paw-outline" size={15} />
                <Text style={styles.eyebrowText}>FAÇA PARTE DO PETEATS</Text>
              </View>
              <Text accessibilityRole="header" style={styles.title}>
                Crie sua conta
              </Text>
              <Text style={styles.subtitle}>Preencha seus dados para começar.</Text>
            </View>

            <View style={styles.form}>
              <View style={styles.field}>
                <Text style={styles.label}>Nome completo</Text>
                <View
                  style={[
                    styles.inputContainer,
                    focusedField === 'name' && styles.inputFocused,
                  ]}
                >
                  <Ionicons
                    color={focusedField === 'name' ? colors.primary : colors.textSecondary}
                    name="person-outline"
                    size={20}
                  />
                  <TextInput
                    accessibilityLabel="Nome completo"
                    autoCapitalize="words"
                    autoComplete="name"
                    placeholder="Digite seu nome"
                    placeholderTextColor={colors.textSecondary}
                    returnKeyType="next"
                    style={styles.input}
                    value={name}
                    onBlur={() => setFocusedField(null)}
                    onChangeText={setName}
                    onFocus={() => setFocusedField('name')}
                    onSubmitEditing={() => usernameInputRef.current?.focus()}
                  />
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Usuário</Text>
                <View
                  style={[
                    styles.inputContainer,
                    focusedField === 'username' && styles.inputFocused,
                  ]}
                >
                  <Ionicons
                    color={
                      focusedField === 'username' ? colors.primary : colors.textSecondary
                    }
                    name="at-outline"
                    size={20}
                  />
                  <TextInput
                    ref={usernameInputRef}
                    accessibilityLabel="Usuário"
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholder="Escolha um usuário"
                    placeholderTextColor={colors.textSecondary}
                    returnKeyType="next"
                    style={styles.input}
                    value={username}
                    onBlur={() => setFocusedField(null)}
                    onChangeText={setUsername}
                    onFocus={() => setFocusedField('username')}
                    onSubmitEditing={() => passwordInputRef.current?.focus()}
                  />
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Senha</Text>
                <View
                  style={[
                    styles.inputContainer,
                    focusedField === 'password' && styles.inputFocused,
                  ]}
                >
                  <Ionicons
                    color={
                      focusedField === 'password' ? colors.primary : colors.textSecondary
                    }
                    name="lock-closed-outline"
                    size={20}
                  />
                  <TextInput
                    ref={passwordInputRef}
                    accessibilityHint="Use pelo menos 6 caracteres"
                    accessibilityLabel="Senha"
                    autoCapitalize="none"
                    autoComplete="new-password"
                    placeholder="Crie uma senha"
                    placeholderTextColor={colors.textSecondary}
                    returnKeyType="next"
                    secureTextEntry={!isPasswordVisible}
                    style={styles.input}
                    value={password}
                    onBlur={() => setFocusedField(null)}
                    onChangeText={setPassword}
                    onFocus={() => setFocusedField('password')}
                    onSubmitEditing={() => confirmationInputRef.current?.focus()}
                  />
                  {renderVisibilityButton(
                    isPasswordVisible,
                    () => setIsPasswordVisible((visible) => !visible),
                    'senha'
                  )}
                </View>
                <Text style={styles.helperText}>Use pelo menos 6 caracteres</Text>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Confirmar senha</Text>
                <View
                  style={[
                    styles.inputContainer,
                    focusedField === 'confirmation' && styles.inputFocused,
                  ]}
                >
                  <Ionicons
                    color={
                      focusedField === 'confirmation'
                        ? colors.primary
                        : colors.textSecondary
                    }
                    name="checkmark-circle-outline"
                    size={20}
                  />
                  <TextInput
                    ref={confirmationInputRef}
                    accessibilityLabel="Confirmar senha"
                    autoCapitalize="none"
                    autoComplete="new-password"
                    placeholder="Digite a senha novamente"
                    placeholderTextColor={colors.textSecondary}
                    returnKeyType="done"
                    secureTextEntry={!isConfirmationVisible}
                    style={styles.input}
                    value={passwordConfirmation}
                    onBlur={() => setFocusedField(null)}
                    onChangeText={setPasswordConfirmation}
                    onFocus={() => setFocusedField('confirmation')}
                    onSubmitEditing={handleRegister}
                  />
                  {renderVisibilityButton(
                    isConfirmationVisible,
                    () => setIsConfirmationVisible((visible) => !visible),
                    'confirmação da senha'
                  )}
                </View>
              </View>

              <Pressable
                accessibilityLabel="Criar conta"
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.button,
                  pressed && styles.buttonPressed,
                ]}
                onPress={handleRegister}
              >
                <Text style={styles.buttonText}>Criar conta</Text>
                <Ionicons color={colors.surface} name="arrow-forward" size={20} />
              </Pressable>

              <View style={styles.loginRow}>
                <Text style={styles.loginText}>Já tem uma conta?</Text>
                <Pressable
                  accessibilityHint="Retorna para a tela de login"
                  accessibilityRole="link"
                  hitSlop={10}
                  onPress={() => navigation.navigate('Login')}
                >
                  <Text style={styles.loginLink}>Entrar</Text>
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
    backgroundColor: colors.background,
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  container: {
    alignItems: 'center',
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  content: {
    maxWidth: 420,
    width: '100%',
  },
  backButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: 7,
    minHeight: 44,
  },
  backButtonText: {
    color: colors.primary,
    fontFamily,
    fontSize: 14,
    fontWeight: '700',
  },
  logoArea: {
    alignItems: 'center',
    height: 116,
    justifyContent: 'center',
    marginBottom: 10,
    position: 'relative',
  },
  logoGlow: {
    backgroundColor: colors.primaryLight,
    borderRadius: 70,
    height: 82,
    opacity: 0.26,
    position: 'absolute',
    width: 132,
  },
  logo: {
    height: 110,
    width: 178,
  },
  header: {
    marginBottom: 26,
  },
  eyebrow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    marginBottom: 9,
  },
  eyebrowText: {
    color: colors.primary,
    fontFamily,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.1,
  },
  title: {
    color: colors.text,
    fontFamily,
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textSecondary,
    fontFamily,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
    textAlign: 'center',
  },
  form: {
    gap: 18,
  },
  field: {
    gap: 8,
  },
  label: {
    color: colors.text,
    fontFamily,
    fontSize: 14,
    fontWeight: '600',
  },
  inputContainer: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.primaryLight,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    height: 54,
    paddingHorizontal: 16,
  },
  inputFocused: {
    borderColor: colors.primary,
    elevation: 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 9,
  },
  input: {
    color: colors.text,
    flex: 1,
    fontFamily,
    fontSize: 15,
    height: '100%',
    paddingHorizontal: 12,
    paddingVertical: 0,
  },
  visibilityButton: {
    alignItems: 'center',
    height: 38,
    justifyContent: 'center',
    marginRight: -8,
    width: 38,
  },
  helperText: {
    color: colors.textSecondary,
    fontFamily,
    fontSize: 12,
  },
  button: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 14,
    elevation: 4,
    flexDirection: 'row',
    gap: 10,
    height: 54,
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  buttonPressed: {
    opacity: 0.84,
    transform: [{ scale: 0.99 }],
  },
  buttonText: {
    color: colors.surface,
    fontFamily,
    fontSize: 16,
    fontWeight: '700',
  },
  loginRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
    marginBottom: 8,
  },
  loginText: {
    color: colors.textSecondary,
    fontFamily,
    fontSize: 14,
  },
  loginLink: {
    color: colors.primary,
    fontFamily,
    fontSize: 14,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});

export default Registro;
