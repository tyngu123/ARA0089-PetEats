import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { request } from './src/api';
import {
  BottomNav,
  Chip,
  LogoBadge,
  ProductIcon,
  StateCard,
  Text,
  confirmAction,
  formatBRL,
  inputFont,
} from './src/components/ui';
import { useAuth } from './src/context/AuthContext';
import { useCart } from './src/context/CartContext';
import { colors } from './src/theme/colors';

const CATEGORIES = ['Todos', 'Ração cães', 'Ração gatos', 'Petiscos', 'Outros'];
const SECTION_TITLES = {
  Todos: 'Todos os produtos',
  'Ração cães': 'Ração para cães',
  'Ração gatos': 'Ração para gatos',
  Petiscos: 'Petiscos',
  Outros: 'Outros produtos',
};

// Bairro do endereço do cliente, ex.: "Rua X, 10 – Icaraí, Niterói" -> "Icaraí, Niterói".
const deliveryArea = (address) => {
  if (!address) return 'Informe seu endereço';
  const parts = address.split(/\s[–-]\s/);
  return parts.length > 1 ? parts[parts.length - 1] : address;
};

// Tela 2 do Figma: catálogo de produtos das lojas cadastradas.
const Cliente = ({ navigation, route }) => {
  const { user } = useAuth();
  const cart = useCart();
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState('loading');
  const [category, setCategory] = useState('Todos');
  const [search, setSearch] = useState('');
  const searchRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const data = await request('/api/products');
      setProducts(data.products);
      setStatus('ready');
    } catch (_error) {
      setStatus((current) => (current === 'ready' ? 'ready' : 'error'));
    }
  }, []);

  // Atualiza o catálogo sempre que a tela volta a aparecer.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // Botão "Buscar" da barra inferior.
  useEffect(() => {
    if (route.params?.focusSearch) searchRef.current?.focus();
  }, [route.params?.focusSearch]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter(
      (product) =>
        (category === 'Todos' || product.category === category) &&
        (!term ||
          product.name.toLowerCase().includes(term) ||
          product.petshop.name.toLowerCase().includes(term))
    );
  }, [products, category, search]);

  const quantityOf = (productId) => cart.items.find((item) => item.product.id === productId)?.quantity || 0;

  const addToCart = async (product) => {
    if (cart.count > 0 && cart.shop?.id !== product.petshop.id) {
      const replace = await confirmAction(
        'Trocar de loja?',
        `Seu carrinho tem produtos de ${cart.shop.name}. Cada pedido é feito em uma loja. Deseja esvaziar o carrinho e comprar em ${product.petshop.name}?`,
        'Trocar'
      );
      if (!replace) return;
    }
    cart.add(product.petshop, product);
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.headerArea}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.flex}>
              <Text style={styles.deliverLabel}>Entregar em</Text>
              <Pressable
                accessibilityRole="button"
                style={styles.locationRow}
                onPress={() => navigation.navigate('Perfil')}
              >
                <Text numberOfLines={1} style={styles.location}>
                  {deliveryArea(user?.address)}
                </Text>
                <Ionicons color={colors.surface} name="caret-down" size={13} />
              </Pressable>
            </View>
            <LogoBadge />
          </View>
          <View style={styles.search}>
            <Ionicons color={colors.placeholder} name="search" size={15} />
            <TextInput
              ref={searchRef}
              accessibilityLabel="Buscar"
              placeholder="Buscar ração, petiscos, lojas..."
              placeholderTextColor={colors.placeholder}
              style={[styles.searchInput, { fontFamily: inputFont() }]}
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </View>
      </SafeAreaView>

      <View>
        <ScrollView horizontal contentContainerStyle={styles.chips} showsHorizontalScrollIndicator={false}>
          {CATEGORIES.map((item) => (
            <Chip key={item} active={category === item} label={item} onPress={() => setCategory(item)} />
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled">
        {status === 'loading' && <StateCard loading text="Carregando produtos..." />}
        {status === 'error' && (
          <StateCard
            actionLabel="Tentar novamente"
            icon="cloud-offline-outline"
            text="Verifique sua conexão. Na primeira abertura o servidor pode levar até 1 minuto para responder."
            title="Não foi possível carregar"
            onAction={() => {
              setStatus('loading');
              load();
            }}
          />
        )}
        {status === 'ready' && (
          <>
            <Text style={styles.section}>{SECTION_TITLES[category]}</Text>
            {visible.length === 0 ? (
              <StateCard icon="search-outline" text="Tente outra categoria ou busca." title="Nenhum produto encontrado" />
            ) : (
              <View style={styles.grid}>
                {visible.map((product, index) => {
                  const quantity = quantityOf(product.id);
                  return (
                    <View key={product.id} style={styles.card}>
                      <ProductIcon
                        category={product.category}
                        size={30}
                        style={[styles.cardImage, index % 2 === 1 && { backgroundColor: colors.primarySoft }]}
                      />
                      <Text numberOfLines={2} style={styles.cardTitle}>
                        {product.name}
                      </Text>
                      <Text numberOfLines={1} style={styles.cardShop}>
                        {product.petshop.name}
                      </Text>
                      <View style={styles.cardFooter}>
                        <Text style={styles.price}>{formatBRL(product.price)}</Text>
                        <Pressable
                          accessibilityLabel={`Adicionar ${product.name} ao carrinho`}
                          accessibilityRole="button"
                          hitSlop={8}
                          style={styles.add}
                          onPress={() => addToCart(product)}
                        >
                          {quantity > 0 ? (
                            <Text style={styles.addCount}>{quantity}</Text>
                          ) : (
                            <Ionicons color={colors.surface} name="add" size={18} />
                          )}
                        </Pressable>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>

      <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.navArea}>
        <BottomNav
          active="Inicio"
          cartCount={cart.count}
          navigation={navigation}
          onSearch={() => searchRef.current?.focus()}
        />
      </SafeAreaView>
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
    paddingBottom: 16,
    paddingHorizontal: 18,
    paddingTop: 10,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  deliverLabel: {
    color: colors.surface,
    fontSize: 11,
    opacity: 0.85,
  },
  locationRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  location: {
    color: colors.surface,
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  search: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 10,
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 12,
  },
  searchInput: {
    color: colors.text,
    flex: 1,
    fontSize: 13,
    minHeight: 40,
    paddingVertical: 0,
  },
  chips: {
    gap: 7,
    paddingHorizontal: 16,
    paddingBottom: 4,
    paddingTop: 14,
  },
  list: {
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  section: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    elevation: 1,
    flexBasis: '46%',
    flexGrow: 1,
    maxWidth: '49%',
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
  },
  cardImage: {
    height: 74,
    marginBottom: 7,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 12.5,
    fontWeight: '600',
    lineHeight: 17,
  },
  cardShop: {
    color: colors.textSecondary,
    fontSize: 10.5,
    marginBottom: 6,
    marginTop: 2,
  },
  cardFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 'auto',
  },
  price: {
    color: colors.primary,
    fontSize: 13.5,
    fontWeight: '700',
  },
  add: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 8,
    height: 26,
    justifyContent: 'center',
    width: 26,
  },
  addCount: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: '700',
  },
  navArea: {
    backgroundColor: colors.surface,
  },
});

export default Cliente;
