import React from "react";
import { View, Text, Button } from 'react-native';

const Menu = ({ navigation }) => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#eeeeee', padding: 20 }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 8 }}>TELA DE MENU</Text>
      <Text style={{ fontSize: 16, color: '#555', marginBottom: 20 }}>Yago Félix Aguiar</Text>
      
      <View style={{ width: '80%', maxWidth: 500 }}>
        <Button 
          title="VAI PARA TELA DE CLIENTES" onPress={
            () => navigation.navigate('Cliente')}           
        />
      </View>
    </View>
  );
};

export default Menu;
