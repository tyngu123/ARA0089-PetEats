import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { request } from './src/api';
import { PrimaryButton, StateCard, Text, confirmAction, formatBRL, showMessage } from './src/components/ui';
import { useAuth } from './src/context/AuthContext';
import { colors, statusInfo } from './src/theme/colors';

// Etapas mostradas no Figma.
const STEPS = [
  { status: 'pendente', title: 'Pedido recebido', text: 'A loja recebeu seu pedido' },
  { status: 'aceito', title: 'Em separação', text: 'Separando seus produtos' },
  { status: 'enviado', title: 'Saiu para entrega', text: 'Seu pedido está a caminho' },
  { status: 'entregue', title: 'Entregue', text: 'Bom apetite para o seu pet!' },
];

const HEADLINES = {
  pendente: 'Pedido enviado!',
  aceito: 'Pedido confirmado!',
  enviado: 'Pedido a caminho!',
  entregue: 'Pedido entregue!',
  recusado: 'Pedido recusado',
  cancelado: 'Pedido cancelado',
};

const POLL_MS = 4000;

// Tela 4 do Figma: confirmação e acompanhamento do pedido em tempo real.
const Pedido = ({ navigation, route }) => {
  const { orderId } = route.params;
  const { token } = useAuth();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Consulta o pedido a cada 4 segundos enquanto a tela estiver aberta.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      const load = async () => {
        try {
          const data = await request(`/api/orders/${orderId}`, { token });
          if (active) {
            setOrder(data.order);
            setError(null);
          }
        } catch (loadError) {
          if (active) setError(loadError.message);
        }
      };
      load();
      const timer = setInterval(load, POLL_MS);
      return () => {
        active = false;
        clearInterval(timer);
      };
    }, [orderId, token])
  );

  const cancel = async () => {
    const ok = await confirmAction('Cancelar pedido?', 'A loja ainda não aceitou. Deseja cancelar?', 'Cancelar pedido');
    if (!ok) return;
    setIsCancelling(true);
    try {
      const data = await request(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        token,
        body: { status: 'cancelado' },
      });
      setOrder(data.order);
    } catch (cancelError) {
      showMessage('Não foi possível cancelar', cancelError.message);
    } finally {
      setIsCancelling(false);
    }
  };

  const goHome = () => navigation.reset({ index: 0, routes: [{ name: 'Inicio' }] });

  if (!order) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <StateCard
            icon="cloud-offline-outline"
            loading={!error}
            text={error || 'Carregando pedido...'}
            title={error ? 'Não foi possível carregar' : undefined}
          />
        </View>
      </SafeAreaView>
    );
  }

  const failed = order.status === 'recusado' || order.status === 'cancelado';
  const currentStep = STEPS.findIndex((step) => step.status === order.status);
  const info = statusInfo[order.status];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={[styles.ring, failed && { backgroundColor: info.background }]}>
          <View style={[styles.check, failed && { backgroundColor: info.color }]}>
            <Ionicons color={colors.surface} name={failed ? 'close' : 'checkmark'} size={44} />
          </View>
        </View>

        <Text accessibilityRole="header" style={styles.title}>
          {HEADLINES[order.status]}
        </Text>
        <Text style={styles.subtitle}>
          Pedido nº {String(order.id).padStart(4, '0')} · {order.petshopName}
        </Text>
        <Text style={styles.subtitle}>
          {failed
            ? order.status === 'recusado'
              ? 'A loja não pôde atender este pedido.'
              : 'Este pedido foi cancelado.'
            : `Previsão de entrega: ${order.deliveryTime}`}
        </Text>
        <Text style={styles.subtitle}>
          Total {formatBRL(order.total)} · {order.paymentMethod}
        </Text>

        {!failed && (
          <View style={styles.steps}>
            {STEPS.map((step, index) => {
              const done = index <= currentStep;
              return (
                <View key={step.status} style={styles.step}>
                  <View style={[styles.dot, done && styles.dotDone]} />
                  <View style={styles.stepText}>
                    <Text style={[styles.stepTitle, !done && styles.muted]}>{step.title}</Text>
                    <Text style={styles.stepSub}>{done ? step.text : 'Aguardando'}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton label="Acompanhar pedido" onPress={() => navigation.navigate('MeusPedidos')} />
        <Pressable accessibilityRole="link" style={styles.linkArea} onPress={goHome}>
          <Text style={styles.linkText}>
            Voltar ao <Text style={styles.link}>início</Text>
          </Text>
        </Pressable>
        {order.status === 'pendente' && (
          <Pressable accessibilityRole="button" disabled={isCancelling} style={styles.cancel} onPress={cancel}>
            <Text style={styles.cancelText}>{isCancelling ? 'Cancelando...' : 'Cancelar pedido'}</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.surface,
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  container: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 48,
  },
  ring: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 60,
    height: 112,
    justifyContent: 'center',
    marginBottom: 18,
    width: 112,
  },
  check: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 46,
    height: 92,
    justifyContent: 'center',
    width: 92,
  },
  title: {
    color: colors.text,
    fontSize: 21,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  steps: {
    alignSelf: 'stretch',
    gap: 14,
    marginTop: 26,
    maxWidth: 420,
  },
  step: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
  },
  dot: {
    backgroundColor: colors.muted,
    borderRadius: 8,
    height: 15,
    marginTop: 2,
    width: 15,
  },
  dotDone: {
    backgroundColor: colors.primary,
  },
  stepText: {
    flex: 1,
  },
  stepTitle: {
    color: colors.text,
    fontSize: 13.5,
    fontWeight: '600',
  },
  muted: {
    color: colors.text,
  },
  stepSub: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  footer: {
    alignSelf: 'center',
    gap: 2,
    maxWidth: 520,
    paddingBottom: 18,
    paddingHorizontal: 20,
    paddingTop: 10,
    width: '100%',
  },
  linkArea: {
    alignItems: 'center',
    paddingVertical: 10,
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
  cancel: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  cancelText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '500',
  },
});

export default Pedido;
