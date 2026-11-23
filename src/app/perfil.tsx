import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system/legacy';
import * as SecureStore from 'expo-secure-store';
import { BASE_URL } from '@/services/api';

export default function PerfilScreen() {
    const router = useRouter();

    const [foto, setFoto] = useState<string | null>(null);
    const [nome, setNome] = useState('');
    const [cargo, setCargo] = useState('');
    const [senhaAtual, setSenhaAtual] = useState('');
    const [novaSenha, setNovaSenha] = useState('');
    const [mostrarSenhaAtual, setMostrarSenhaAtual] = useState(false);
    const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false);
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const getAvatarStorageKey = useCallback(async () => {
        const normalizeStorageSuffix = (value: string) =>
            value.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '_');

        const userId = await SecureStore.getItemAsync('userId');
        if (userId) return `userAvatar_${normalizeStorageSuffix(userId)}`;

        const userEmail = await SecureStore.getItemAsync('userEmail');
        if (userEmail) return `userAvatar_${normalizeStorageSuffix(userEmail)}`;

        const userName = await SecureStore.getItemAsync('userName');
        if (userName) return `userAvatar_${normalizeStorageSuffix(userName)}`;

        return null;
    }, []);

    const carregarDadosUsuario = useCallback(async () => {
        const roleSalvaRaw = await SecureStore.getItemAsync('userRole');
        const roleSalva = roleSalvaRaw?.trim() ? roleSalvaRaw : 'Cargo não definido';
        const nomeSalvo = await SecureStore.getItemAsync('userName') || 'Usuário';
        const avatarKey = await getAvatarStorageKey();
        const fotoSalva = avatarKey ? await SecureStore.getItemAsync(avatarKey) : null;

        setNome(nomeSalvo);
        setCargo(roleSalva);

        if (fotoSalva) {
            setFoto(fotoSalva);
            return;
        }

        setFoto(null);
    }, [getAvatarStorageKey]);

    useEffect(() => {
        carregarDadosUsuario();
    }, [carregarDadosUsuario]);

    const salvarAvatarLocal = async (sourceUri: string) => {
        const avatarKey = await getAvatarStorageKey();
        if (!avatarKey) {
            Alert.alert('Erro', 'Não foi possível identificar o usuário. Faça login novamente.');
            return;
        }

        const previousAvatar = await SecureStore.getItemAsync(avatarKey);
        const avatarDir = `${FileSystem.documentDirectory}avatar/`;
        await FileSystem.makeDirectoryAsync(avatarDir, { intermediates: true });

        const finalUri = `${avatarDir}user-avatar-${Date.now()}.jpg`;
        await FileSystem.copyAsync({ from: sourceUri, to: finalUri });

        if (previousAvatar) {
            const oldInfo = await FileSystem.getInfoAsync(previousAvatar);
            if (oldInfo.exists) {
                await FileSystem.deleteAsync(previousAvatar, { idempotent: true });
            }
        }

        await SecureStore.setItemAsync(avatarKey, finalUri);
        setFoto(finalUri);
    };

    const tirarFoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permissão Negada', 'Precisamos de acesso à câmera para mudar o seu avatar.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (result.canceled) return;
        await salvarAvatarLocal(result.assets[0].uri);
    };

    const escolherDaGaleria = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== 'granted') {
            Alert.alert('Permissão Negada', 'Precisamos de acesso à galeria para escolher uma foto.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (result.canceled) return;
        await salvarAvatarLocal(result.assets[0].uri);
    };

    const menuAlterarFoto = () => {
        Alert.alert(
            "Foto de Perfil",
            "De onde você quer pegar a nova foto?",
            [
                { text: "Tirar Foto", onPress: tirarFoto },
                { text: "Escolher da Galeria", onPress: escolherDaGaleria },
                { text: "Cancelar", style: "cancel" }
            ]
        );
    };

    const handleSalvar = async () => {
        if (!senhaAtual || !novaSenha) {
            Alert.alert("Atenção", "Preencha a senha atual e a nova senha.");
            return;
        }

        if (novaSenha.length < 6) {
            Alert.alert("Atenção", "A nova senha deve ter no mínimo 6 caracteres.");
            return;
        }

        setLoading(true);

        try {
            const token = await SecureStore.getItemAsync('userToken');

            const response = await fetch(`${BASE_URL}/api/perfil/senha`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    senha_atual: senhaAtual,
                    nova_senha: novaSenha
                })
            });

            const data = await response.json();

            if (response.ok) {
                Alert.alert("Sucesso", "Sua senha foi atualizada!");
                setSenhaAtual('');
                setNovaSenha('');
            } else {
                Alert.alert("Erro", data.message || "Não foi possível atualizar a senha.");
            }
        } catch (error) {
            console.error("Erro na atualização de senha:", error);
            Alert.alert("Erro de Conexão", "Não foi possível conectar ao servidor.");
        } finally {
            setLoading(false);
        }
    };

    const confirmarExclusaoConta = () => {
        Alert.alert(
            "Excluir Conta",
            "Tem certeza que deseja excluir sua conta permanentemente? Todos os seus dados de acesso serão apagados e esta ação não poderá ser desfeita.",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Excluir Permanentemente",
                    style: "destructive",
                    onPress: handleExcluirConta,
                },
            ]
        );
    };

    const handleExcluirConta = async () => {
        setDeleting(true);
        try {
            const token = await SecureStore.getItemAsync('userToken');

            const response = await fetch(`${BASE_URL}/api/perfil/excluir-conta`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                await SecureStore.deleteItemAsync('userToken');
                await SecureStore.deleteItemAsync('userId');
                await SecureStore.deleteItemAsync('userEmail');
                await SecureStore.deleteItemAsync('userName');
                await SecureStore.deleteItemAsync('userRole');

                Alert.alert("Conta Excluída", "Sua conta foi removida permanentemente.");
                router.replace('/');
            } else {
                const data = await response.json().catch(() => ({}));
                Alert.alert("Erro", data.message || "Não foi possível excluir a conta.");
            }
        } catch (error) {
            console.error("Erro ao excluir conta:", error);
            Alert.alert("Erro de Conexão", "Não foi possível conectar ao servidor.");
        } finally {
            setDeleting(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1f2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Meu Perfil</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.avatarSection}>
                    <TouchableOpacity onPress={menuAlterarFoto} style={styles.avatarContainer}>
                        {foto ? (
                            <Image source={{ uri: foto }} style={styles.avatarPlaceholder} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Ionicons name="person" size={80} color="#9ca3af" />
                            </View>
                        )}
                        <View style={styles.editBadge}>
                            <Ionicons name="camera" size={16} color="#ffffff" />
                        </View>
                    </TouchableOpacity>
                    <View style={styles.avatarActions}>
                        <TouchableOpacity style={styles.avatarActionButton} onPress={tirarFoto} activeOpacity={0.8}>
                            <Ionicons name="camera-outline" size={16} color="#1f2937" />
                            <Text style={styles.avatarActionText}>Câmera</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.avatarActionButton} onPress={escolherDaGaleria} activeOpacity={0.8}>
                            <Ionicons name="images-outline" size={16} color="#1f2937" />
                            <Text style={styles.avatarActionText}>Galeria</Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.userName}>{nome}</Text>
                    <View style={styles.roleBadge}>
                        <Text style={styles.roleText}>{cargo}</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Segurança</Text>

                    <Text style={styles.label}>Senha Atual</Text>
                    <View style={styles.inputContainer}>
                        <Ionicons name="lock-closed-outline" size={20} color="#6b7280" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Digite sua senha atual"
                            secureTextEntry={!mostrarSenhaAtual}
                            value={senhaAtual}
                            onChangeText={setSenhaAtual}
                        />
                        <TouchableOpacity
                            onPress={() => setMostrarSenhaAtual(!mostrarSenhaAtual)}
                            style={styles.eyeButton}
                        >
                            <Ionicons
                                name={mostrarSenhaAtual ? "eye-off-outline" : "eye-outline"}
                                size={20}
                                color="#6b7280"
                            />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.label}>Nova Senha</Text>
                    <View style={styles.inputContainer}>
                        <Ionicons name="key-outline" size={20} color="#6b7280" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Digite a nova senha"
                            secureTextEntry={!mostrarNovaSenha}
                            value={novaSenha}
                            onChangeText={setNovaSenha}
                        />
                        <TouchableOpacity
                            onPress={() => setMostrarNovaSenha(!mostrarNovaSenha)}
                            style={styles.eyeButton}
                        >
                            <Ionicons
                                name={mostrarNovaSenha ? "eye-off-outline" : "eye-outline"}
                                size={20}
                                color="#6b7280"
                            />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                        onPress={handleSalvar}
                        disabled={loading}
                    >
                        <Text style={styles.saveButtonText}>
                            {loading ? 'Salvando...' : 'Salvar Nova Senha'}
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.dangerSection}>
                    <Text style={styles.dangerTitle}>Privacidade e Conta</Text>
                    <Text style={styles.dangerDescription}>
                        Seus dados ficam armazenados de forma segura em servidor PostgreSQL. Caso deseje encerrar seu acesso, a exclusão é imediata e irreversível.
                    </Text>

                    <TouchableOpacity
                        style={[styles.deleteButton, deleting && styles.deleteButtonDisabled]}
                        onPress={confirmarExclusaoConta}
                        disabled={deleting}
                    >
                        <Ionicons name="trash-outline" size={18} color="#ef4444" />
                        <Text style={styles.deleteButtonText}>
                            {deleting ? 'Excluindo conta...' : 'Excluir minha conta'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f3f4f6',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    backButton: {
        padding: 5,
        minWidth: 44,
        minHeight: 44,
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: 30,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 15,
    },
    avatarPlaceholder: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: '#e5e7eb',
        justifyContent: 'center',
        alignItems: 'center',
    },
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#2563eb',
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#f3f4f6',
    },
    userName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 5,
    },
    avatarActions: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
    },
    avatarActionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#e5e7eb',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 16,
        minHeight: 44,
    },
    avatarActionText: {
        color: '#1f2937',
        fontSize: 13,
        fontWeight: '600',
    },
    roleBadge: {
        backgroundColor: '#dbeafe',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    roleText: {
        color: '#2563eb',
        fontWeight: '600',
        fontSize: 14,
    },
    section: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 15,
    },
    label: {
        fontSize: 14,
        color: '#4b5563',
        marginBottom: 8,
        fontWeight: '500',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        marginBottom: 15,
        paddingHorizontal: 10,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        height: 48,
        color: '#1f2937',
    },
    eyeButton: {
        padding: 10,
        minWidth: 44,
        minHeight: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    saveButton: {
        backgroundColor: '#2563eb',
        borderRadius: 8,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 5,
    },
    saveButtonDisabled: {
        backgroundColor: '#93c5fd',
    },
    saveButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    dangerSection: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 20,
        borderWidth: 1,
        borderColor: '#fecaca',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    dangerTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#b91c1c',
        marginBottom: 6,
    },
    dangerDescription: {
        fontSize: 13,
        color: '#6b7280',
        lineHeight: 19,
        marginBottom: 16,
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#fef2f2',
        borderWidth: 1,
        borderColor: '#fecaca',
        borderRadius: 8,
        height: 48,
    },
    deleteButtonDisabled: {
        opacity: 0.6,
    },
    deleteButtonText: {
        color: '#ef4444',
        fontSize: 15,
        fontWeight: 'bold',
    },
});