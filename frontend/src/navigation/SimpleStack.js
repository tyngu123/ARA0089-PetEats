import { StackRouter, createNavigatorFactory, useNavigationBuilder } from '@react-navigation/native';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { colors } from '../theme/colors';

// Navegador em pilha feito só com Views do React Native.
// Substitui o native-stack (react-native-screens), que no Android/Expo Go
// fazia o teclado abrir e fechar sozinho ao tocar nos campos de texto.
// As telas anteriores continuam montadas (escondidas) para manter o estado.
const SimpleStackNavigator = (props) => {
  const builder = useNavigationBuilder(StackRouter, props);
  const { state, descriptors } = builder;

  const content = (
    <View style={styles.container}>
      {state.routes.map((route, index) => {
        const isFocused = index === state.index;
        return (
          <View
            key={route.key}
            pointerEvents={isFocused ? 'auto' : 'none'}
            style={[styles.screen, !isFocused && styles.hidden]}
          >
            {descriptors[route.key].render()}
          </View>
        );
      })}
    </View>
  );

  // React Navigation 7 usa NavigationContent; versões mais novas usam render().
  if (builder.NavigationContent) {
    const { NavigationContent } = builder;
    return <NavigationContent>{content}</NavigationContent>;
  }
  return builder.render(content);
};

export const createSimpleStackNavigator = createNavigatorFactory(SimpleStackNavigator);

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  screen: {
    flex: 1,
  },
  hidden: {
    display: 'none',
  },
});
