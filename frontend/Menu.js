import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import {
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

const Menu = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
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
            <View style={styles.brandCopy}>
              <View style={styles.eyebrow}>
                <Ionicons color={colors.accent} name="paw-outline" size={15} />
                <Text style={styles.eyebrowText}>PAINEL PETEATS</Text>
              </View>
              <Text style={styles.welcome}>Olá, Yago</Text>
            </View>
          </View>

          <View style={styles.header}>
            <Text accessibilityRole="header" style={styles.title}>
              O que você deseja acessar?
            </Text>
            <Text style={styles.subtitle}>Escolha uma opção para continuar.</Text>
          </View>

          <Pressable
            accessibilityHint="Abre a lista de petshops"
            accessibilityLabel="Acessar petshops"
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.menuCard,
              pressed && styles.menuCardPressed,
            ]}
            onPress={() => navigation.navigate('Cliente')}
          >
            <View style={styles.iconContainer}>
              <Ionicons color={colors.primary} name="storefront-outline" size={28} />
            </View>
            <View style={styles.cardCopy}>
              <Text style={styles.cardTitle}>Petshops</Text>
              <Text style={styles.cardDescription}>Conheça as lojas disponíveis</Text>
            </View>
            <Ionicons color={colors.accent} name="chevron-forward" size={23} />
          </Pressable>

          <View style={styles.securityNote}>
            <Ionicons
              color={colors.primary}
              name="shield-checkmark-outline"
              size={16}
            />
            <Text style={styles.securityText}>Ambiente seguro PetEats</Text>
          </View>
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
    paddingVertical: 32,
  },
  content: {
    maxWidth: 480,
    width: '100%',
  },
  brandRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 48,
  },
  logo: {
    height: 86,
    marginLeft: -10,
    marginRight: 4,
    width: 132,
  },
  brandCopy: {
    flex: 1,
  },
  eyebrow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4,
  },
  eyebrowText: {
    color: colors.primary,
    fontFamily,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.1,
  },
  welcome: {
    color: colors.text,
    fontFamily,
    fontSize: 22,
    fontWeight: '700',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    color: colors.text,
    fontFamily,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    lineHeight: 36,
  },
  subtitle: {
    color: colors.textSecondary,
    fontFamily,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
  },
  menuCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.primaryLight,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 92,
    paddingHorizontal: 18,
    paddingVertical: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  menuCardPressed: {
    opacity: 0.84,
    transform: [{ scale: 0.99 }],
  },
  iconContainer: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 15,
    height: 56,
    justifyContent: 'center',
    marginRight: 14,
    width: 56,
  },
  cardCopy: {
    flex: 1,
  },
  cardTitle: {
    color: colors.text,
    fontFamily,
    fontSize: 18,
    fontWeight: '700',
  },
  cardDescription: {
    color: colors.textSecondary,
    fontFamily,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 3,
  },
  securityNote: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    marginTop: 28,
  },
  securityText: {
    color: colors.textSecondary,
    fontFamily,
    fontSize: 12,
  },
});

export default Menu;
