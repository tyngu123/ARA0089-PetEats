import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  Text as RNText,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { colors, statusInfo } from '../theme/colors';

// ---------- Fonte Poppins (a mesma do Figma) ----------
const FAMILIES = {
  400: 'Poppins_400Regular',
  500: 'Poppins_500Medium',
  600: 'Poppins_600SemiBold',
  700: 'Poppins_700Bold',
  800: 'Poppins_800ExtraBold',
};
let fontsReady = false;
export const setFontsReady = (ready) => {
  fontsReady = ready;
};

const familyFor = (weight) => {
  const value = weight === 'bold' ? 700 : Number(weight) || 400;
  if (value >= 800) return FAMILIES[800];
  if (value >= 700) return FAMILIES[700];
  if (value >= 600) return FAMILIES[600];
  if (value >= 500) return FAMILIES[500];
  return FAMILIES[400];
};

// Text do app: escolhe a variação da Poppins pelo fontWeight do estilo.
export const Text = ({ style, ...props }) => {
  if (!fontsReady) return <RNText {...props} style={style} />;
  const flat = StyleSheet.flatten(style) || {};
  return <RNText {...props} style={[style, { fontFamily: familyFor(flat.fontWeight), fontWeight: 'normal' }]} />;
};

export const fontFamily = undefined;
export const inputFont = () => (fontsReady ? FAMILIES[400] : undefined);

export const logoIcon = require('../../assets/images/logo-icon.png');

// ---------- Utilitários ----------
export const formatBRL = (value) =>
  `R$ ${Number(value || 0).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;

export const formatTime = (iso) => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (number) => String(number).padStart(2, '0');
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)} às ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

// Alert.alert não aparece no navegador; por isso usamos window.alert na web.
export const showMessage = (title, message) => {
  if (Platform.OS === 'web') {
    globalThis.alert(message ? `${title}\n\n${message}` : title);
    return;
  }
  Alert.alert(title, message);
};

export const confirmAction = (title, message, confirmLabel = 'Confirmar') =>
  new Promise((resolve) => {
    if (Platform.OS === 'web') {
      resolve(globalThis.confirm(`${title}\n\n${message}`));
      return;
    }
    Alert.alert(title, message, [
      { text: 'Voltar', style: 'cancel', onPress: () => resolve(false) },
      { text: confirmLabel, onPress: () => resolve(true) },
    ]);
  });

// ---------- Componentes ----------
const categoryIcons = {
  'Ração cães': { name: 'paw', color: colors.accent, background: colors.accentSoft },
  'Ração gatos': { name: 'fish', color: colors.primary, background: colors.primarySoft },
  Petiscos: { name: 'nutrition', color: '#C8793A', background: colors.accentSoft },
  Outros: { name: 'cube', color: colors.primary, background: colors.primarySoft },
};

export const ProductIcon = ({ category, size = 30, style }) => {
  const icon = categoryIcons[category] || categoryIcons.Outros;
  return (
    <View style={[styles.productIcon, { backgroundColor: icon.background }, style]}>
      <Ionicons color={icon.color} name={icon.name} size={size} />
    </View>
  );
};

export const LogoBadge = () => (
  <View style={styles.logoBadge}>
    <Image accessibilityLabel="PetEats" resizeMode="contain" source={logoIcon} style={styles.logoBadgeImage} />
  </View>
);

// Cabeçalho verde do Figma.
export const GreenHeader = ({ title, subtitle, onBack, right, children }) => (
  <View style={styles.header}>
    <View style={styles.headerRow}>
      {onBack ? (
        <Pressable
          accessibilityLabel="Voltar"
          accessibilityRole="button"
          hitSlop={12}
          style={styles.headerBack}
          onPress={onBack}
        >
          <Ionicons color={colors.surface} name="chevron-back" size={22} />
        </Pressable>
      ) : null}
      <View style={styles.headerTexts}>
        {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
        <Text accessibilityRole="header" numberOfLines={1} style={styles.headerTitle}>
          {title}
        </Text>
      </View>
      {right}
    </View>
    {children}
  </View>
);

export const PrimaryButton = ({ label, icon, onPress, loading, disabled, variant = 'green', style }) => {
  const background =
    variant === 'orange' ? colors.accent : variant === 'danger' ? colors.danger : colors.primary;
  const outline = variant === 'outline';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        outline ? styles.buttonOutline : { backgroundColor: background },
        (disabled || loading) && styles.buttonDisabled,
        pressed && styles.buttonPressed,
        style,
      ]}
      onPress={onPress}
    >
      {loading ? (
        <ActivityIndicator color={outline ? colors.primary : colors.surface} />
      ) : (
        <>
          {icon ? <Ionicons color={outline ? colors.primary : colors.surface} name={icon} size={18} /> : null}
          <Text style={[styles.buttonText, outline && { color: colors.primary }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
};

// Campo do Figma: o rótulo fica pequeno, dentro da caixa, acima do texto.
export const Field = ({ label, helper, style, inputRef, right, onFocus, onBlur, onLayout, icon: _icon, ...inputProps }) => {
  const [focused, setFocused] = React.useState(false);
  return (
    <View style={style} onLayout={onLayout}>
      <View style={[styles.inputBox, focused && styles.inputBoxFocused]}>
        <View style={styles.inputColumn}>
          {label ? <Text style={styles.inputLabel}>{label}</Text> : null}
          <TextInput
            ref={inputRef}
            placeholderTextColor={colors.placeholder}
            style={[styles.input, { fontFamily: inputFont() }]}
            {...inputProps}
            onBlur={(event) => {
              setFocused(false);
              onBlur?.(event);
            }}
            onFocus={(event) => {
              setFocused(true);
              onFocus?.(event);
            }}
          />
        </View>
        {right}
      </View>
      {helper ? <Text style={styles.helper}>{helper}</Text> : null}
    </View>
  );
};

export const Chip = ({ label, active, onPress }) => (
  <Pressable
    accessibilityRole="button"
    accessibilityState={{ selected: active }}
    style={[styles.chip, active && styles.chipActive]}
    onPress={onPress}
  >
    <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
  </Pressable>
);

export const StatusBadge = ({ status }) => {
  const info = statusInfo[status] || statusInfo.pendente;
  return (
    <View style={[styles.badge, { backgroundColor: info.background }]}>
      <View style={[styles.badgeDot, { backgroundColor: info.color }]} />
      <Text style={[styles.badgeText, { color: info.color }]}>{info.label}</Text>
    </View>
  );
};

export const StateCard = ({ icon, title, text, loading, actionLabel, onAction }) => (
  <View accessibilityLiveRegion="polite" style={styles.stateCard}>
    {loading ? (
      <ActivityIndicator color={colors.primary} size="large" />
    ) : (
      <Ionicons color={colors.accent} name={icon || 'information-circle-outline'} size={32} />
    )}
    {title ? <Text style={styles.stateTitle}>{title}</Text> : null}
    {text ? <Text style={styles.stateText}>{text}</Text> : null}
    {actionLabel ? (
      <PrimaryButton icon="refresh" label={actionLabel} style={{ alignSelf: 'stretch' }} onPress={onAction} />
    ) : null}
  </View>
);

// Barra inferior do Figma: Início, Buscar, Carrinho, Pedidos, Perfil.
const TABS = [
  { id: 'Inicio', label: 'Início', icon: 'home' },
  { id: 'Buscar', label: 'Buscar', icon: 'search' },
  { id: 'Carrinho', label: 'Carrinho', icon: 'cart' },
  { id: 'MeusPedidos', label: 'Pedidos', icon: 'receipt' },
  { id: 'Perfil', label: 'Perfil', icon: 'person' },
];

export const BottomNav = ({ active, navigation, cartCount = 0, onSearch }) => (
  <View style={styles.nav}>
    {TABS.map((tab) => {
      const isActive = active === tab.id;
      return (
        <Pressable
          key={tab.id}
          accessibilityLabel={tab.label}
          accessibilityRole="tab"
          accessibilityState={{ selected: isActive }}
          style={styles.navItem}
          onPress={() => {
            if (tab.id === 'Buscar') {
              if (onSearch) onSearch();
              else navigation.navigate('Inicio', { focusSearch: Date.now() });
              return;
            }
            if (!isActive) navigation.navigate(tab.id);
          }}
        >
          <View>
            <Ionicons
              color={isActive ? colors.primary : '#B5B5B5'}
              name={isActive ? tab.icon : `${tab.icon}-outline`}
              size={21}
            />
            {tab.id === 'Carrinho' && cartCount > 0 ? (
              <View style={styles.navBadge}>
                <Text style={styles.navBadgeText}>{cartCount}</Text>
              </View>
            ) : null}
          </View>
          <Text style={[styles.navText, isActive && styles.navTextActive]}>{tab.label}</Text>
        </Pressable>
      );
    })}
  </View>
);

export const styles = StyleSheet.create({
  productIcon: {
    alignItems: 'center',
    borderRadius: 9,
    justifyContent: 'center',
  },
  logoBadge: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 10,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  logoBadgeImage: {
    height: 32,
    width: 32,
  },
  header: {
    backgroundColor: colors.primary,
    paddingBottom: 16,
    paddingHorizontal: 18,
    paddingTop: 12,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  headerBack: {
    alignItems: 'center',
    height: 34,
    justifyContent: 'center',
    marginLeft: -8,
    width: 28,
  },
  headerTexts: {
    flex: 1,
  },
  headerSubtitle: {
    color: colors.surface,
    fontSize: 12,
    opacity: 0.85,
  },
  headerTitle: {
    color: colors.surface,
    fontSize: 17,
    fontWeight: '600',
  },
  button: {
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 50,
    paddingHorizontal: 18,
  },
  buttonOutline: {
    backgroundColor: colors.surface,
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: '600',
  },
  inputBox: {
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1.5,
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  inputBoxFocused: {
    backgroundColor: colors.surface,
    borderColor: colors.primary,
  },
  inputColumn: {
    flex: 1,
  },
  inputLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
  input: {
    color: colors.text,
    fontSize: 15,
    minHeight: 28,
    paddingHorizontal: 0,
    paddingVertical: 2,
  },
  helper: {
    color: colors.textSecondary,
    fontSize: 11,
    marginLeft: 4,
    marginTop: 4,
  },
  chip: {
    backgroundColor: colors.surface,
    borderColor: '#E1E1E1',
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  chipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  chipText: {
    color: colors.text,
    fontSize: 13,
  },
  chipTextActive: {
    color: colors.surface,
    fontWeight: '600',
  },
  badge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 20,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeDot: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  stateCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 30,
  },
  stateTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  stateText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  nav: {
    backgroundColor: colors.surface,
    borderColor: '#EEEEEE',
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingBottom: 10,
    paddingTop: 8,
  },
  navItem: {
    alignItems: 'center',
    flex: 1,
    gap: 2,
  },
  navText: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  navTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  navBadge: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 9,
    height: 18,
    justifyContent: 'center',
    minWidth: 18,
    paddingHorizontal: 4,
    position: 'absolute',
    right: -12,
    top: -6,
  },
  navBadgeText: {
    color: colors.surface,
    fontSize: 10,
    fontWeight: '700',
  },
});
