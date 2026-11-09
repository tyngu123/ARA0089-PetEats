import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/poppins';
import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import Carrinho from './Carrinho';
import Cliente from './Cliente';
import Empresa from './Empresa';
import Login from './Login';
import Menu from './Menu';
import MeusPedidos from './MeusPedidos';
import Pedido from './Pedido';
import Registro from './Registro';
import { setFontsReady } from './src/components/ui';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import { createSimpleStackNavigator } from './src/navigation/SimpleStack';
import { colors } from './src/theme/colors';

const Stack = createSimpleStackNavigator();

const Loading = () => (
  <View style={{ alignItems: 'center', backgroundColor: colors.surface, flex: 1, justifyContent: 'center' }}>
    <ActivityIndicator color={colors.primary} size="large" />
  </View>
);

// Mostra telas diferentes para visitante, cliente e empresa.
const Routes = () => {
  const { user, isRestoring } = useAuth();

  if (isRestoring) return <Loading />;

  return (
    <Stack.Navigator>
      {!user && (
        <>
          <Stack.Screen component={Login} name="Login" />
          <Stack.Screen component={Registro} name="Registro" />
        </>
      )}
      {user?.role === 'cliente' && (
        <>
          <Stack.Screen component={Cliente} name="Inicio" />
          <Stack.Screen component={Carrinho} name="Carrinho" />
          <Stack.Screen component={Pedido} name="Pedido" />
          <Stack.Screen component={MeusPedidos} name="MeusPedidos" />
          <Stack.Screen component={Menu} name="Perfil" />
        </>
      )}
      {user?.role === 'empresa' && <Stack.Screen component={Empresa} name="Empresa" />}
    </Stack.Navigator>
  );
};

const App = () => {
  // Carrega a fonte Poppins usada no protótipo do Figma.
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
  });

  if (!fontsLoaded && !fontError) return <Loading />;
  setFontsReady(Boolean(fontsLoaded));

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CartProvider>
          <NavigationContainer>
            <Routes />
          </NavigationContainer>
        </CartProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
};

export default App;
