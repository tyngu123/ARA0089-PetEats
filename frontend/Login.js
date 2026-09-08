import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useEffect, useRef, useState } from 'react';
import {
    Image,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from './src/context/AuthContext';
import { colors } from './src/theme/colors';

const logo = require('./assets/images/logo.png');
const fontFamily = Platform.select({
    web: 'Poppins, Nunito, sans-serif',
    default: 'Poppins',
});

const Login = ({ navigation, route }) => {
    const { registeredAccount } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [focusedField, setFocusedField] = useState(null);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const passwordInputRef = useRef(null);

    useEffect(() => {
        if (route.params?.registeredUsername) {
            setUsername(route.params.registeredUsername);
        }
    }, [route.params?.registeredUsername]);

    const handleLogin = () => {
        const isDefaultAccount = username === 'yago' && password === '123';
        const isRegisteredAccount =
            registeredAccount?.username === username &&
            registeredAccount?.password === password;

        if (isDefaultAccount || isRegisteredAccount) {
            alert('Login bem-sucedido');
            navigation.navigate('Menu');
        } else {
            alert('Usuário e/ou Senha inválidos');
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.container}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.content}>
                        <View style={styles.logoArea}>
                            <View style={styles.logoGlow} />
                            <Image
                                accessibilityLabel="Logo PetEats"
                                resizeMode="contain"
                                source={logo}
                                style={styles.logo}
                            />
                        </View>

                        <View style={styles.header}>
                            <View style={styles.eyebrow}>
                                <Ionicons
                                    color={colors.accent}
                                    name="paw-outline"
                                    size={15}
                                />
                                <Text style={styles.eyebrowText}>BEM-VINDO AO PETEATS</Text>
                            </View>
                            <Text accessibilityRole="header" style={styles.title}>
                                Acesse sua conta
                            </Text>
                            <Text style={styles.subtitle}>
                                Entre para cuidar de quem faz parte da família.
                            </Text>
                        </View>

                        <View style={styles.form}>
                            <View style={styles.field}>
                                <Text style={styles.label}>Usuário</Text>
                                <View
                                    style={[
                                        styles.inputContainer,
                                        focusedField === 'username' && styles.inputFocused,
                                    ]}
                                >
                                    <Ionicons
                                        color={
                                            focusedField === 'username'
                                                ? colors.primary
                                                : colors.textSecondary
                                        }
                                        name="person-outline"
                                        size={20}
                                    />
                                    <TextInput
                                        accessibilityLabel="Usuário"
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        placeholder="Digite seu usuário"
                                        placeholderTextColor={colors.textSecondary}
                                        returnKeyType="next"
                                        style={styles.input}
                                        value={username}
                                        onBlur={() => setFocusedField(null)}
                                        onChangeText={setUsername}
                                        onFocus={() => setFocusedField('username')}
                                        onSubmitEditing={() => passwordInputRef.current?.focus()}
                                    />
                                </View>
                            </View>

                            <View style={styles.field}>
                                <Text style={styles.label}>Senha</Text>
                                <View
                                    style={[
                                        styles.inputContainer,
                                        focusedField === 'password' && styles.inputFocused,
                                    ]}
                                >
                                    <Ionicons
                                        color={
                                            focusedField === 'password'
                                                ? colors.primary
                                                : colors.textSecondary
                                        }
                                        name="lock-closed-outline"
                                        size={20}
                                    />
                                    <TextInput
                                        ref={passwordInputRef}
                                        accessibilityLabel="Senha"
                                        autoCapitalize="none"
                                        placeholder="Digite sua senha"
                                        placeholderTextColor={colors.textSecondary}
                                        returnKeyType="done"
                                        secureTextEntry={!isPasswordVisible}
                                        style={styles.input}
                                        value={password}
                                        onBlur={() => setFocusedField(null)}
                                        onChangeText={setPassword}
                                        onFocus={() => setFocusedField('password')}
                                        onSubmitEditing={handleLogin}
                                    />
                                    <Pressable
                                        accessibilityLabel={
                                            isPasswordVisible ? 'Ocultar senha' : 'Mostrar senha'
                                        }
                                        accessibilityRole="button"
                                        hitSlop={10}
                                        style={styles.visibilityButton}
                                        onPress={() => setIsPasswordVisible((visible) => !visible)}
                                    >
                                        <Ionicons
                                            color={colors.textSecondary}
                                            name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
                                            size={21}
                                        />
                                    </Pressable>
                                </View>
                            </View>

                            <Pressable
                                accessibilityLabel="Entrar na conta"
                                accessibilityRole="button"
                                style={({ pressed }) => [
                                    styles.button,
                                    pressed && styles.buttonPressed,
                                ]}
                                onPress={handleLogin}
                            >
                                <Text style={styles.buttonText}>Entrar</Text>
                                <Ionicons
                                    color={colors.surface}
                                    name="arrow-forward"
                                    size={20}
                                />
                            </Pressable>

                            <View style={styles.registerRow}>
                                <Text style={styles.registerText}>Ainda não tem uma conta?</Text>
                                <Pressable
                                    accessibilityHint="Abre o formulário para criar uma conta"
                                    accessibilityRole="link"
                                    hitSlop={10}
                                    onPress={() => navigation.navigate('Registro')}
                                >
                                    <Text style={styles.registerLink}>Cadastre-se</Text>
                                </Pressable>
                            </View>

                            <View style={styles.securityNote}>
                                <Ionicons
                                    color={colors.primary}
                                    name="shield-checkmark-outline"
                                    size={16}
                                />
                                <Text style={styles.securityText}>Seus dados estão protegidos</Text>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.background,
    },
    keyboardView: {
        flex: 1,
    },
    container: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 32,
    },
    content: {
        width: '100%',
        maxWidth: 420,
    },
    logoArea: {
        alignItems: 'center',
        height: 160,
        justifyContent: 'center',
        marginBottom: 20,
        position: 'relative',
    },
    logoGlow: {
        backgroundColor: colors.primaryLight,
        borderRadius: 90,
        height: 118,
        opacity: 0.26,
        position: 'absolute',
        width: 180,
    },
    logo: {
        height: 150,
        width: 230,
    },
    header: {
        marginBottom: 30,
    },
    eyebrow: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: 6,
        justifyContent: 'center',
        marginBottom: 10,
    },
    eyebrowText: {
        color: colors.primary,
        fontFamily,
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1.1,
    },
    title: {
        color: colors.text,
        fontFamily,
        fontSize: 30,
        fontWeight: '700',
        letterSpacing: -0.5,
        textAlign: 'center',
    },
    subtitle: {
        color: colors.textSecondary,
        fontFamily,
        fontSize: 15,
        lineHeight: 22,
        marginTop: 8,
        paddingHorizontal: 12,
        textAlign: 'center',
    },
    form: {
        gap: 18,
    },
    field: {
        gap: 8,
    },
    label: {
        color: colors.text,
        fontFamily,
        fontSize: 14,
        fontWeight: '600',
    },
    inputContainer: {
        alignItems: 'center',
        height: 54,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.primaryLight,
        borderRadius: 14,
        flexDirection: 'row',
        paddingHorizontal: 16,
    },
    inputFocused: {
        borderColor: colors.primary,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 9,
        elevation: 2,
    },
    input: {
        flex: 1,
        height: '100%',
        color: colors.text,
        fontFamily,
        fontSize: 15,
        paddingHorizontal: 12,
        paddingVertical: 0,
    },
    visibilityButton: {
        alignItems: 'center',
        height: 38,
        justifyContent: 'center',
        marginRight: -8,
        width: 38,
    },
    button: {
        alignItems: 'center',
        backgroundColor: colors.primary,
        borderRadius: 14,
        flexDirection: 'row',
        gap: 10,
        height: 54,
        justifyContent: 'center',
        marginTop: 6,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 4,
    },
    buttonPressed: {
        opacity: 0.84,
        transform: [{ scale: 0.99 }],
    },
    buttonText: {
        color: colors.surface,
        fontFamily,
        fontSize: 16,
        fontWeight: '700',
    },
    securityNote: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: 6,
        justifyContent: 'center',
        marginTop: 2,
    },
    securityText: {
        color: colors.textSecondary,
        fontFamily,
        fontSize: 12,
    },
    registerRow: {
        alignItems: 'center',
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        justifyContent: 'center',
        marginTop: 2,
    },
    registerText: {
        color: colors.textSecondary,
        fontFamily,
        fontSize: 14,
    },
    registerLink: {
        color: colors.primary,
        fontFamily,
        fontSize: 14,
        fontWeight: '700',
        textDecorationLine: 'underline',
    },
});

export default Login;
