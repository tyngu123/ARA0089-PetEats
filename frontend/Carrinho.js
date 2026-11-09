import Ionicons from '@expo/vector-icons/Ionicons';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { request } from './src/api';
import {
  BottomNav,
  Chip,
  PrimaryButton,
  ProductIcon,
  StateCard,
  Text,
  formatBRL,
  inputFont,
  showMessage,
} from './src/components/ui';
import { useAuth } from './src/context/AuthContext';
import { useCart } from './src/context/CartContext';
import { colors } from './src/theme/colors';

const PAYMENTS = ['Pix na entrega', 'Cartão na entrega', 'Dinheiro'];

const Header = ({ onBack, right }) => (
  <SafeAreaView edges={['top', 'left', 'right']} style={styles.headerArea}>
    <StatusBar style="light" />
    <View style={styles.header}>
      <Pressable accessibilityLabel="Voltar" accessibilityRole="button" hitSlop={10} style={styles.back} onPress={onBack}>
        <Ionicons color={colors.surface} name="chevron-back" size={20} />
        <Text style={styles.headerTitle}>Meu carrinho</Text>
      </Pressable>
      {right}
    </View>
  </SafeAreaView>
);

// Tela 3 do Figma: carrinho de compras.
const Carrinho = ({ navigation }) => {
  const { token, user } = useAuth();
  const cart = useCart();
  const [address, setAddress] = useState(user?.address || '');
  const [payment, setPayment] = useState(PAYMENTS[0]);
  const [isSending, setIsSending] = useState(false);

  const goBack = () => navigation.navigate('Inicio');

  const confirmOrder = async () => {
    if (!address.trim()) {
      showMessage('Endereço obrigatório', 'Informe onde o pedido deve ser entregue.');
      return;
    }
    setIsSending(true);
    try {
      // O pedido é gravado na nuvem e aparece na hora no painel da empresa.
      const { order } = await request('/api/orders', {
        method: 'POST',
        token,
        body: {
          petshopId: cart.shop.id,
          items: cart.items.map((item) => ({ productId: item.product.id, quantity: item.quantity })),
          address: address.trim(),
          paymentMethod: payment,
        },
      });
      cart.clear();
      navigation.reset({
        index: 1,
        routes: [{ name: 'Inicio' }, { name: 'Pedido', params: { orderId: order.id } }],
      });
    } catch (error) {
      setIsSending(false);
      showMessage('Não foi possível enviar o pedido', error.message);
    }
  };

  if (cart.count === 0) {
    return (
      <View style={styles.screen}>
        <Header onBack={goBack} />
        <View style={styles.list}>
          <StateCard
            actionLabel="Ver produtos"
            icon="cart-outline"
            text="Escolha os produtos no catálogo e eles aparecem aqui."
            title="Seu carrinho está vazio"
            onAction={goBack}
          />
        </View>
        <View style={styles.flex} />
        <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.navArea}>
          <BottomNav active="Carrinho" navigation={navigation} />
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Header
        right={<Text style={styles.headerCount}>{cart.count} {cart.count === 1 ? 'item' : 'itens'}</Text>}
        onBack={goBack}
      />

      <KeyboardAvoidingView behavior="padding" style={styles.flex}>
        <ScrollView contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled">
          {cart.items.map(({ product, quantity }) => (
            <View key={product.id} style={styles.item}>
              <ProductIcon category={product.category} size={24} style={styles.itemImage} />
              <View style={styles.itemInfo}>
                <Text numberOfLines={2} style={styles.itemName}>
                  {product.name}
                </Text>
                <Text style={styles.itemShop}>{cart.shop.name}</Text>
                <Text style={styles.itemPrice}>{formatBRL(product.price * quantity)}</Text>
              </View>
              <View style={styles.qty}>
                <Pressable
                  accessibilityLabel={`Diminuir ${product.name}`}
                  accessibilityRole="button"
                  hitSlop={6}
                  style={styles.qtyButton}
                  onPress={() => cart.changeQuantity(product.id, -1)}
                >
                  <Ionicons color={colors.primary} name="remove" size={14} />
                </Pressable>
                <Text style={styles.qtyText}>{quantity}</Text>
                <Pressable
                  accessibilityLabel={`Aumentar ${product.name}`}
                  accessibilityRole="button"
                  hitSlop={6}
                  style={styles.qtyButton}
                  onPress={() => cart.changeQuantity(product.id, 1)}
                >
                  <Ionicons color={colors.primary} name="add" size={14} />
                </Pressable>
              </View>
            </View>
          ))}

          <View style={styles.box}>
            <Text style={styles.boxTitle}>Endereço de entrega</Text>
            <TextInput
              accessibilityLabel="Endereço de entrega"
              multiline
              placeholder="Rua, número – bairro"
              placeholderTextColor={colors.placeholder}
              style={[styles.boxInput, { fontFamily: inputFont() }]}
              value={address}
              onChangeText={setAddress}
            />
          </View>

          <View style={styles.box}>
            <Text style={styles.boxTitle}>Pagamento</Text>
            <View style={styles.payments}>
              {PAYMENTS.map((option) => (
                <Chip key={option} active={payment === option} label={option} onPress={() => setPayment(option)} />
              ))}
            </View>
          </View>

          <View style={styles.box}>
            <View style={styles.line}>
              <Text style={styles.lineText}>Subtotal</Text>
              <Text style={styles.lineText}>{formatBRL(cart.subtotal)}</Text>
            </View>
            <View style={styles.line}>
              <Text style={styles.lineText}>Taxa de entrega</Text>
              <Text style={styles.lineText}>{formatBRL(cart.deliveryFee)}</Text>
            </View>
            <View style={[styles.line, styles.totalLine]}>
              <Text style={styles.total}>Total</Text>
              <Text style={styles.total}>{formatBRL(cart.total)}</Text>
            </View>
          </View>
        </ScrollView>

        <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.footer}>
          <PrimaryButton label="Confirmar pedido" loading={isSending} variant="orange" onPress={confirmOrder} />
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  headerArea: {
    backgroundColor: colors.primary,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 14,
    paddingHorizontal: 14,
    paddingTop: 10,
  },
  back: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  headerTitle: {
    color: colors.surface,
    fontSize: 17,
    fontWeight: '600',
  },
  headerCount: {
    color: colors.surface,
    fontSize: 12,
    opacity: 0.9,
  },
  list: {
    gap: 10,
    padding: 16,
  },
  item: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    elevation: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
  },
  itemImage: {
    height: 52,
    width: 52,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  itemShop: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  itemPrice: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 3,
  },
  qty: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  qtyButton: {
    alignItems: 'center',
    borderColor: colors.primary,
    borderRadius: 7,
    borderWidth: 1.5,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  qtyText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
    minWidth: 12,
    textAlign: 'center',
  },
  box: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    elevation: 1,
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
  },
  boxTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  boxInput: {
    color: colors.textSecondary,
    fontSize: 13,
    minHeight: 22,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  payments: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  line: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  lineText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  totalLine: {
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderTopWidth: 1,
    marginTop: 4,
    paddingTop: 8,
  },
  total: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  footer: {
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  navArea: {
    backgroundColor: colors.surface,
  },
});

export default Carrinho;
