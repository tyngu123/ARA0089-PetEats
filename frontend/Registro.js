import Ionicons from '@expo/vector-icons/Ionicons';
import { StatusBar } from 'expo-status-bar';
import React, { useRef, useState } from 'react';
import { Image, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Field, PrimaryButton, Text, showMessage } from './src/components/ui';
import { useAuth } from './src/context/AuthContext';
import { colors } from './src/theme/colors';

const logo = require('./assets/images/logo.png');

const roles = [
  { id: 'cliente', icon: 'paw-outline', title: 'Sou cliente' },
  { id: 'empresa', icon: 'storefront-outline', title: 'Sou empresa' },
];

const Registro = ({ navigation }) => {
  const { register } = useAuth();
  const [role, setRole] = useState('cliente');
  const [form, setForm] = useState({
    name: '',
    username: '',
    password: '',
    passwordConfirmation: '',
    phone: '',
    address: '',
    storeName: '',
    neighborhood: '',
    deliveryFee: '',
  });
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // No Android o teclado cobre a parte de baixo da tela. Guardamos a posição de
  // cada campo e, ao tocar nele, rolamos a tela para deixá-lo visível.
  const scrollRef = useRef(null);
  const positions = useRef({ content: 0, form: 0, fields: {} });
  const track = (key) => ({
    onLayout: (event) => {
      positions.current.fields[key] = event.nativeEvent.layout.y;
    },
    onFocus: () => {
      setTimeout(() => {
        const { content, form, fields } = positions.current;
        scrollRef.current?.scrollTo({ y: Math.max(content + form + (fields[key] || 0) - 16, 0), animated: true });
      }, 250);
    },
  });

  const set = (key) => (value) => setForm((current) => ({ ...current, [key]: value }));
  const isCompany = role === 'empresa';

  const handleRegister = async () => {
    const required = ['name', 'username', 'password', 'passwordConfirmation', 'address'];
    if (isCompany) required.push('storeName', 'neighborhood');
    if (required.some((key) => !form[key].trim())) {
      showMessage('Campos obrigatórios', 'Preencha todos os campos para continuar.');
      return;
    }
    if (form.password.length < 6) {
      showMessage('Senha muito curta', 'Use pelo menos 6 caracteres na senha.');
      return;
    }
    if (form.password !== form.passwordConfirmation) {
      showMessage('Senhas diferentes', 'Confira a confirmação da senha.');
      return;
    }

    setIsLoading(true);
    try {
      // O cadastro é salvo no banco de dados na nuvem e já entra na conta.
      await register({
        role,
        name: form.name.trim(),
        username: form.username.trim().toLowerCase(),
        password: form.password,
        phone: form.phone.trim(),
        address: form.address.trim(),
        storeName: form.storeName.trim(),
        neighborhood: form.neighborhood.trim(),
        deliveryFee: form.deliveryFee.trim() || '0',
      });
    } catch (error) {
      setIsLoading(false);
      showMessage('Não foi possível cadastrar', error.message);
    }
  };

  const visibility = (
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
  );

  // Tela de cadastro no mesmo estilo da tela 1 do Figma.
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView behavior="padding" style={styles.flex}>
        <ScrollView
          ref={scrollRef}
          automaticallyAdjustKeyboardInsets
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View
            style={styles.content}
            onLayout={(event) => {
              positions.current.content = event.nativeEvent.layout.y;
            }}
          >
            <Image accessibilityLabel="Logo PetEats" resizeMode="contain" source={logo} style={styles.logo} />
            <Text style={styles.subtitle}>
              Ração e petiscos do pet shop do seu bairro, entregues na sua porta.
            </Text>

            <View style={styles.segment}>
              {roles.map((option) => {
                const active = role === option.id;
                return (
                  <Pressable
                    key={option.id}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: active }}
                    style={[styles.segmentItem, active && styles.segmentItemActive]}
                    onPress={() => setRole(option.id)}
                  >
                    <Ionicons color={active ? colors.surface : colors.textSecondary} name={option.icon} size={16} />
                    <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{option.title}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View
              style={styles.form}
              onLayout={(event) => {
                positions.current.form = event.nativeEvent.layout.y;
              }}
            >
              <Field
                {...track('name')}
                autoCapitalize="words"
                label={isCompany ? 'Nome do responsável' : 'Nome completo'}
                placeholder="Maria da Silva"
                value={form.name}
                onChangeText={set('name')}
              />
              {isCompany && (
                <>
                  <Field
                    {...track('storeName')}
                    autoCapitalize="words"
                    label="Nome da loja"
                    placeholder="Pet Shop do Bairro"
                    value={form.storeName}
                    onChangeText={set('storeName')}
                  />
                  <Field
                    {...track('neighborhood')}
                    autoCapitalize="words"
                    label="Bairro / cidade"
                    placeholder="Icaraí, Niterói"
                    value={form.neighborhood}
                    onChangeText={set('neighborhood')}
                  />
                </>
              )}
              <Field
                {...track('username')}
                autoCapitalize="none"
                autoCorrect={false}
                label="Usuário"
                placeholder="seu usuário (sem espaços)"
                value={form.username}
                onChangeText={set('username')}
              />
              <Field
                {...track('phone')}
                keyboardType="phone-pad"
                label="Telefone (WhatsApp)"
                placeholder="(21) 9 0000-0000"
                value={form.phone}
                onChangeText={set('phone')}
              />
              <Field
                {...track('address')}
                label={isCompany ? 'Endereço da loja' : 'Endereço de entrega'}
                placeholder="Rua Exemplo, 123 – Icaraí, Niterói"
                value={form.address}
                onChangeText={set('address')}
              />
              {isCompany && (
                <Field
                  {...track('deliveryFee')}
                  keyboardType="decimal-pad"
                  label="Taxa de entrega (R$)"
                  placeholder="5,00"
                  value={form.deliveryFee}
                  onChangeText={set('deliveryFee')}
                />
              )}
              <Field
                {...track('password')}
                autoCapitalize="none"
                label="Senha"
                placeholder="mínimo de 6 caracteres"
                right={visibility}
                secureTextEntry={!isPasswordVisible}
                value={form.password}
                onChangeText={set('password')}
              />
              <Field
                {...track('passwordConfirmation')}
                autoCapitalize="none"
                label="Confirmar senha"
                placeholder="digite a senha novamente"
                secureTextEntry={!isPasswordVisible}
                value={form.passwordConfirmation}
                onChangeText={set('passwordConfirmation')}
                onSubmitEditing={handleRegister}
              />

              <PrimaryButton
                label={isCompany ? 'Cadastrar loja' : 'Criar conta'}
                loading={isLoading}
                style={styles.button}
                onPress={handleRegister}
              />

              <View style={styles.linkRow}>
                <Text style={styles.linkText}>Já tem conta?</Text>
                <Pressable accessibilityRole="link" hitSlop={10} onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.link}>Entrar</Text>
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
  container: {
    alignItems: 'center',
    flexGrow: 1,
    paddingBottom: 32,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  content: {
    alignItems: 'center',
    maxWidth: 420,
    width: '100%',
  },
  logo: {
    height: 120,
    width: 190,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 18,
    marginTop: 4,
    paddingHorizontal: 18,
    textAlign: 'center',
  },
  segment: {
    alignSelf: 'stretch',
    backgroundColor: colors.background,
    borderRadius: 12,
    flexDirection: 'row',
    gap: 4,
    marginBottom: 14,
    padding: 4,
  },
  segmentItem: {
    alignItems: 'center',
    borderRadius: 9,
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    paddingVertical: 9,
  },
  segmentItemActive: {
    backgroundColor: colors.primary,
  },
  segmentText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  segmentTextActive: {
    color: colors.surface,
    fontWeight: '600',
  },
  form: {
    alignSelf: 'stretch',
    gap: 10,
  },
  button: {
    marginTop: 6,
  },
  linkRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
    justifyContent: 'center',
    marginTop: 4,
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

export default Registro;
