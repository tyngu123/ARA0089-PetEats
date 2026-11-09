import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { request } from './src/api';
import { BottomNav, GreenHeader, StateCard, StatusBadge, Text, formatBRL, formatTime } from './src/components/ui';
import { useCart } from './src/context/CartContext';
import { useAuth } from './src/context/AuthContext';
import { colors } from './src/theme/colors';

const MeusPedidos = ({ navigation }) => {
  const { token } = useAuth();
  const cart = useCart();
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState(null);
  const [reload, setReload] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const load = () =>
        request('/api/orders', { token })
          .then((data) => {
            if (!active) return;
            setOrders(data.orders);
            setError(null);
          })
          .catch((loadError) => active && setError(loadError.message));
      load();
      const timer = setInterval(load, 6000);
      return () => {
        active = false;
        clearInterval(timer);
      };
    }, [token, reload])
  );

  return (
    <View style={styles.safeArea}>
      <StatusBar style="light" />
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.headerArea}>
        <GreenHeader title="Meus pedidos" />
      </SafeAreaView>
      <ScrollView contentContainerStyle={styles.list}>
        {!orders && !error && <StateCard loading text="Carregando pedidos..." />}
        {!orders && error && (
          <StateCard
            actionLabel="Tentar novamente"
            icon="cloud-offline-outline"
            text={error}
            title="Não foi possível carregar"
            onAction={() => setReload((value) => value + 1)}
          />
        )}
        {orders && orders.length === 0 && (
          <StateCard
            actionLabel="Ver produtos"
            icon="receipt-outline"
            text="Quando você fizer um pedido, ele aparece aqui."
            title="Nenhum pedido ainda"
            onAction={() => navigation.navigate('Inicio')}
          />
        )}
        {orders?.map((order) => (
          <Pressable
            key={order.id}
            accessibilityRole="button"
            style={({ pressed }) => [styles.card, pressed && { opacity: 0.88 }]}
            onPress={() => navigation.navigate('Pedido', { orderId: order.id })}
          >
            <View style={styles.top}>
              <Text style={styles.shop}>{order.petshopName}</Text>
              <Ionicons color={colors.accent} name="chevron-forward" size={18} />
            </View>
            <Text style={styles.meta}>
              Nº {String(order.id).padStart(4, '0')} · {formatTime(order.createdAt)}
            </Text>
            <Text numberOfLines={1} style={styles.items}>
              {order.items.map((item) => `${item.quantity}x ${item.name}`).join(', ')}
            </Text>
            <View style={styles.bottom}>
              <StatusBadge status={order.status} />
              <Text style={styles.total}>{formatBRL(order.total)}</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
      <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.navArea}>
        <BottomNav active="MeusPedidos" cartCount={cart.count} navigation={navigation} />
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  headerArea: {
    backgroundColor: colors.primary,
  },
  navArea: {
    backgroundColor: colors.surface,
  },
  list: {
    gap: 10,
    padding: 16,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    gap: 6,
    padding: 14,
  },
  top: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  shop: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  meta: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  items: {
    color: colors.text,
    fontSize: 13,
  },
  bottom: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  total: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '700',
  },
});

export default MeusPedidos;
