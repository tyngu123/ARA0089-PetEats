import Ionicons from '@expo/vector-icons/Ionicons';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomNav, GreenHeader, LogoBadge, Text } from './src/components/ui';
import { useAuth } from './src/context/AuthContext';
import { useCart } from './src/context/CartContext';
import { colors } from './src/theme/colors';

// Aba "Perfil" da barra inferior: dados do cliente e saída da conta.
const Menu = ({ navigation }) => {
  const { user, logout } = useAuth();
  const cart = useCart();
  const initials = (user?.name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

  const rows = [
    { icon: 'at-outline', label: 'Usuário', value: user?.username },
    { icon: 'call-outline', label: 'Telefone', value: user?.phone || 'Não informado' },
    { icon: 'location-outline', label: 'Endereço de entrega', value: user?.address || 'Não informado' },
  ];

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.headerArea}>
        <GreenHeader right={<LogoBadge />} title="Meu perfil" />
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.role}>Cliente PetEats</Text>
        </View>

        <View style={styles.card}>
          {rows.map((row) => (
            <View key={row.label} style={styles.row}>
              <Ionicons color={colors.primary} name={row.icon} size={18} />
              <View style={styles.rowText}>
                <Text style={styles.rowLabel}>{row.label}</Text>
                <Text style={styles.rowValue}>{row.value}</Text>
              </View>
            </View>
          ))}
        </View>

        <Pressable accessibilityRole="button" style={styles.option} onPress={() => navigation.navigate('MeusPedidos')}>
          <Ionicons color={colors.primary} name="receipt-outline" size={19} />
          <Text style={styles.optionText}>Meus pedidos</Text>
          <Ionicons color={colors.accent} name="chevron-forward" size={18} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          style={styles.option}
          onPress={() => {
            cart.clear();
            logout();
          }}
        >
          <Ionicons color={colors.danger} name="log-out-outline" size={19} />
          <Text style={[styles.optionText, { color: colors.danger }]}>Sair da conta</Text>
        </Pressable>
      </ScrollView>

      <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.navArea}>
        <BottomNav active="Perfil" cartCount={cart.count} navigation={navigation} />
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  headerArea: {
    backgroundColor: colors.primary,
  },
  content: {
    gap: 12,
    padding: 16,
  },
  card: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    gap: 4,
    padding: 16,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 32,
    height: 64,
    justifyContent: 'center',
    marginBottom: 4,
    width: 64,
  },
  avatarText: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: '700',
  },
  name: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '600',
  },
  role: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  row: {
    alignItems: 'flex-start',
    alignSelf: 'stretch',
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 6,
  },
  rowText: {
    flex: 1,
  },
  rowLabel: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  rowValue: {
    color: colors.text,
    fontSize: 14,
  },
  option: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    flexDirection: 'row',
    gap: 12,
    padding: 16,
  },
  optionText: {
    color: colors.text,
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  navArea: {
    backgroundColor: colors.surface,
  },
});

export default Menu;
