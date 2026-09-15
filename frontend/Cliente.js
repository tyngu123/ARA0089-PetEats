import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from './src/theme/colors';

const logo = require('./assets/images/logo.png');
const fontFamily = Platform.select({
  web: 'Poppins, Nunito, sans-serif',
  default: 'Poppins',
});

const localApiUrl = Platform.select({
  android: 'http://10.0.2.2:3000',
  default: 'http://localhost:3000',
});
const apiUrl = (process.env.EXPO_PUBLIC_API_URL || localApiUrl).replace(/\/$/, '');

const Cliente = () => {
  const [petshops, setPetshops] = useState([]);
  const [status, setStatus] = useState('loading');
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;
    const timeout = setTimeout(() => controller.abort(), 8000);

    const loadPetshops = async () => {
      setStatus('loading');

      try {
        const response = await fetch(`${apiUrl}/api/petshops`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`API retornou ${response.status}`);
        }

        const data = await response.json();

        if (!Array.isArray(data.petshops)) {
          throw new Error('Formato inválido da resposta da API');
        }

        if (isActive) {
          setPetshops(data.petshops.slice(0, 3));
          setStatus('ready');
        }
      } catch (_error) {
        if (isActive) {
          setStatus('error');
        }
      } finally {
        clearTimeout(timeout);
      }
    };

    loadPetshops();

    return () => {
      isActive = false;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [reloadToken]);

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.brandRow}>
            <Image
              accessibilityLabel="Logo PetEats"
              resizeMode="contain"
              source={logo}
              style={styles.logo}
            />
            <View style={styles.brandTextArea}>
              <View style={styles.eyebrow}>
                <Ionicons color={colors.accent} name="paw-outline" size={15} />
                <Text style={styles.eyebrowText}>PETEATS</Text>
              </View>
              <Text style={styles.brandText}>Tudo para o seu pet</Text>
            </View>
          </View>

          <View style={styles.header}>
            <Text accessibilityRole="header" style={styles.title}>
              Petshops
            </Text>
            <Text style={styles.subtitle}>
              Confira as lojas e escolha onde cuidar do seu pet.
            </Text>
          </View>

          {status === 'loading' && (
            <View accessibilityLiveRegion="polite" style={styles.stateCard}>
              <ActivityIndicator color={colors.primary} size="large" />
              <Text style={styles.stateText}>Carregando petshops...</Text>
            </View>
          )}

          {status === 'error' && (
            <View accessibilityLiveRegion="polite" style={styles.stateCard}>
              <Ionicons color={colors.accent} name="cloud-offline-outline" size={30} />
              <Text style={styles.stateTitle}>Não foi possível carregar as lojas</Text>
              <Text style={styles.stateText}>
                Verifique se o backend está em execução e tente novamente.
              </Text>
              <Pressable
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.retryButton,
                  pressed && styles.retryButtonPressed,
                ]}
                onPress={() => setReloadToken((token) => token + 1)}
              >
                <Ionicons color={colors.surface} name="refresh" size={18} />
                <Text style={styles.retryText}>Tentar novamente</Text>
              </Pressable>
            </View>
          )}

          {status === 'ready' && petshops.length === 0 && (
            <View accessibilityLiveRegion="polite" style={styles.stateCard}>
              <Ionicons color={colors.primary} name="storefront-outline" size={30} />
              <Text style={styles.stateTitle}>Nenhum petshop disponível</Text>
              <Text style={styles.stateText}>Volte mais tarde para conferir as lojas.</Text>
            </View>
          )}

          {status === 'ready' && petshops.length > 0 && (
            <>
              <View style={styles.sectionRow}>
                <Text style={styles.sectionTitle}>Lojas disponíveis</Text>
                <Text style={styles.count}>{petshops.length} opções</Text>
              </View>

              <View style={styles.list}>
                {petshops.map((shop) => (
                  <View key={shop.id} style={styles.shopCard}>
                    <View style={styles.shopMain}>
                      <View style={styles.shopIcon}>
                        <Ionicons color={colors.primary} name="storefront-outline" size={30} />
                      </View>
                      <View style={styles.shopInfo}>
                        <Text style={styles.shopName}>{shop.name}</Text>
                        <Text style={styles.category}>{shop.category}</Text>
                        <View style={styles.locationRow}>
                          <Ionicons
                            color={colors.textSecondary}
                            name="location-outline"
                            size={15}
                          />
                          <Text style={styles.neighborhood}>{shop.neighborhood}</Text>
                        </View>
                      </View>
                      <View style={styles.rating}>
                        <Ionicons color={colors.accent} name="star" size={14} />
                        <Text style={styles.ratingText}>{shop.rating}</Text>
                      </View>
                    </View>

                    <View style={styles.deliveryRow}>
                      <View style={styles.deliveryDetail}>
                        <Ionicons color={colors.primary} name="time-outline" size={17} />
                        <Text style={styles.deliveryText}>{shop.deliveryTime}</Text>
                      </View>
                      <View style={styles.deliveryDetail}>
                        <Ionicons color={colors.primary} name="bicycle-outline" size={18} />
                        <Text style={styles.deliveryText}>Entrega {shop.deliveryFee}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>

              <Text style={styles.demoNote}>Lojas e informações de demonstração</Text>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  container: {
    alignItems: 'center',
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 28,
  },
  content: {
    maxWidth: 520,
    width: '100%',
  },
  brandRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 36,
  },
  logo: {
    height: 76,
    marginLeft: -8,
    marginRight: 2,
    width: 116,
  },
  brandTextArea: {
    flex: 1,
  },
  eyebrow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginBottom: 3,
  },
  eyebrowText: {
    color: colors.primary,
    fontFamily,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.1,
  },
  brandText: {
    color: colors.text,
    fontFamily,
    fontSize: 18,
    fontWeight: '700',
  },
  header: {
    marginBottom: 28,
  },
  title: {
    color: colors.text,
    fontFamily,
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: colors.textSecondary,
    fontFamily,
    fontSize: 15,
    lineHeight: 23,
    marginTop: 7,
  },
  sectionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    color: colors.text,
    fontFamily,
    fontSize: 18,
    fontWeight: '700',
  },
  count: {
    color: colors.primary,
    fontFamily,
    fontSize: 14,
    fontWeight: '600',
  },
  list: {
    gap: 16,
  },
  shopCard: {
    backgroundColor: colors.surface,
    borderColor: colors.primaryLight,
    borderRadius: 18,
    borderWidth: 1,
    elevation: 3,
    padding: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  shopMain: {
    alignItems: 'flex-start',
    flexDirection: 'row',
  },
  shopIcon: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 15,
    height: 62,
    justifyContent: 'center',
    marginRight: 13,
    width: 62,
  },
  shopInfo: {
    flex: 1,
  },
  shopName: {
    color: colors.text,
    fontFamily,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },
  category: {
    color: colors.textSecondary,
    fontFamily,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 2,
  },
  locationRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 3,
    marginTop: 5,
  },
  neighborhood: {
    color: colors.textSecondary,
    fontFamily,
    fontSize: 13,
  },
  rating: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 10,
    flexDirection: 'row',
    gap: 3,
    marginLeft: 5,
    paddingHorizontal: 7,
    paddingVertical: 6,
  },
  ratingText: {
    color: colors.text,
    fontFamily,
    fontSize: 13,
    fontWeight: '700',
  },
  deliveryRow: {
    borderColor: colors.primaryLight,
    borderTopWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 16,
    paddingTop: 14,
  },
  deliveryDetail: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  deliveryText: {
    color: colors.text,
    fontFamily,
    fontSize: 14,
    fontWeight: '600',
  },
  demoNote: {
    color: colors.textSecondary,
    fontFamily,
    fontSize: 13,
    marginTop: 24,
    textAlign: 'center',
  },
  stateCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.primaryLight,
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  stateTitle: {
    color: colors.text,
    fontFamily,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  stateText: {
    color: colors.textSecondary,
    fontFamily,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  retryButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 14,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 20,
  },
  retryButtonPressed: {
    opacity: 0.84,
  },
  retryText: {
    color: colors.surface,
    fontFamily,
    fontSize: 14,
    fontWeight: '700',
  },
});

export default Cliente;
