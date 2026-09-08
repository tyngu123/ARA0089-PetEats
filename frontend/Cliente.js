import React, { useState } from 'react';
import { View, Text, Button, TextInput, StyleSheet, Image } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
//import Menu from './Menu';
const Stack = createStackNavigator();
const Cliente = ({ navigation }) => {
  const [usermat, setUsermat] = useState('');
  const [usernome, setUsernome] = useState('');

  const handleGravar = async () => {
    try {
      const cliente = {
        matricula: usermat,
        nome: usernome,
      };
      // Recupera clientes já gravados
      const clientesSalvos = await AsyncStorage.getItem('clientes');
      let listaClientes = [];
      if (clientesSalvos !== null) {
        listaClientes = JSON.parse(clientesSalvos);
      }
      // Adiciona novo cliente
      listaClientes.push(cliente);
      console.log(listaClientes);
      // Salva novamente a lista
      await AsyncStorage.setItem(
        'clientes',
        JSON.stringify(listaClientes)
      );
      alert('Cliente gravado com sucesso!');
      // Limpa os campos
      setUsermat('');
      setUsernome('');
    } catch (error) {
      console.log(error);
      alert('Erro ao gravar os dados.');
    }
  };
  const handleVoltar = () => {
    navigation.navigate('Menu');
  };
  return (
    <View style={[styles.container, { backgroundColor: 'lightblue' }]}>
      {/* Exibindo a imagem no canto superior esquerdo */}
      {/* Container para imagem + label na mesma linha */}
      <View style={styles.header}>
        
        <Text style={[styles.label1, { marginBottom: 5, textAlign: 'center' }]}>
          SISTEMA DE CONTROLE EMPRESARIAL
        </Text>
        {/* Espaçador para compensar o logo */}
        <View
          style={{ width: 10 }} />
      </View>
      <View>
        <Text style={[styles.label2, { marginBottom: 1, textAlign: 'center' }]}>
          CONTROLE DE CLIENTES
        </Text>
      </View>
      {/* Input Container */}
      <View style={[styles.inputContainer1, { marginTop: 45 }]}>
        <View style={styles.inputGroup}>
          <Text style={styles.labelentrada}>Matrícula </Text>
          <TextInput
            // AJUSTE DO TAMANHO DA LARGURA DO TEXTINPUT
            // style={[styles.input, { width: 100, textAlign: 'center' }]}
            style={[styles.input, { width: 150 }]}
            value={usermat}
            onChangeText={setUsermat}
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.labelentrada}>Nome</Text>
          <TextInput
            // AJUSTE DO TAMANHO DA LARGURA DO TEXTINPUT
            style={[styles.input, { width: 500 }]}
            //secureTextEntry
            value={usernome}
            onChangeText={setUsernome}
          />
        </View>
      </View>
      {/* Flexibilidade da posição do botão */}
      <View style={styles.buttonContainer}>
        <View style={styles.buttonArea}>
          <Button title="Gravar" onPress={handleGravar} />
        </View>
        <View style={styles.buttonArea}>
          <Button title="Voltar" color="#c62e70" onPress={handleVoltar} />
        </View>
      </View>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 1,
  },
  header: {
    flexDirection: 'row', // coloca lado a lado
    alignItems: 'center', // alinha verticalmente
    justifyContent: 'space-between',
    width: '100%',
  },
  imagem: { //EXIBINDO CENTRALIDADO ANTES DO BOTÃO
    width: 80, // Defina a largura da imagem
    height: 80, // Defina a altura da imagem
    marginBottom: 10, // Espaço entre a imagem e o botão
  },
  label1: {
    color: 'blue',
    textAlign: 'center',
    fontSize: 22,
    fontFamily: 'Arial',
    fontWeight: 'bold',
  },
  label2: {
    color: 'black',
    fontSize: 18,
    fontFamily: 'Arial',
    fontWeight: 'bold',
  },
  labelentrada: {
    color: 'blue',
    fontSize: 18,
    fontFamily: 'Arial',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  /* ALINHA OS IMPUTS NA MESMA LINHA
  inputContainer1: {
  flexDirection: 'row',
  marginBottom: 15,
  }, */
  inputContainer1: {
    flexDirection: 'column',
    marginTop: 1,
    marginBottom: 15,
    padding: 10,
  },
  inputGroup: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  input: {
    flex: 1,
    padding: 10,
    fontSize: 18,
    fontWeight: 'bold',
    borderWidth: 1,
    borderColor: '#111202',
    backgroundColor: '#0bd74f',
    textAlign: 'left',
    marginBottom: 10,
  },
  ButtonVoltar: {
    backgroundColor: '#c62e70',
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonArea: {
    width: 150,
    marginBottom: 25,
  },
});

export default Cliente;