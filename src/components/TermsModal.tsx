import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { BASE_URL } from '@/services/api';

export function TermsModal() {
    const [visible, setVisible] = useState(false);
    const [accepted, setAccepted] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        verificarAceiteTermos();
    }, []);

    const verificarAceiteTermos = async () => {
        try {
            const token = await SecureStore.getItemAsync('userToken');
            if (!token) return;

            const response = await fetch(`${BASE_URL}/api/user`, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const user = await response.json();
                if (!user.terms_accepted_at) {
                    setVisible(true);
                }
            }
        } catch (error) {
            console.error('Erro ao verificar termos:', error);
        }
    };

    const handleAceitar = async () => {
        if (!accepted) {
            Alert.alert('Atenção', 'Marque a caixa de confirmação para continuar.');
            return;
        }

        setLoading(true);
        try {
            const token = await SecureStore.getItemAsync('userToken');

            const response = await fetch(`${BASE_URL}/api/perfil/aceitar-termos`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                setVisible(false);
            } else {
                Alert.alert('Erro', 'Não foi possível registrar o aceite dos termos.');
            }
        } catch (error) {
            console.error('Erro ao aceitar termos:', error);
            Alert.alert('Erro de Conexão', 'Verifique sua internet e tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
            <View style={styles.overlay}>
                <View style={styles.card}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="shield-checkmark-outline" size={28} color="#2563eb" />
                    </View>

                    <Text style={styles.title}>Termos de Armazenamento de Dados</Text>

                    <ScrollView style={styles.textContainer} showsVerticalScrollIndicator={true}>
                        <Text style={styles.paragraph}>
                            Para continuar utilizando o <Text style={styles.bold}>Support Pocket</Text>, leia e concorde com nossa política de dados em conformidade com a LGPD:
                        </Text>
                        <Text style={styles.paragraph}>
                            <Text style={styles.bold}>Onde seus dados são salvos:</Text> Suas credenciais de acesso, registros de atendimento, snippets e tarefas do Kanban são armazenados de forma criptografada em banco de dados <Text style={styles.bold}>PostgreSQL</Text> hospedado em servidor institucional controlado.
                        </Text>
                        <Text style={styles.paragraph}>
                            <Text style={styles.bold}>Seus direitos:</Text> Você pode solicitar ou executar a exclusão permanente da sua conta e dos seus dados pessoais a qualquer momento através da tela <Text style={styles.bold}>Meu Perfil</Text>.
                        </Text>
                    </ScrollView>

                    <TouchableOpacity
                        style={styles.checkboxRow}
                        onPress={() => setAccepted(!accepted)}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name={accepted ? 'checkbox' : 'square-outline'}
                            size={24}
                            color={accepted ? '#2563eb' : '#6b7280'}
                        />
                        <Text style={styles.checkboxLabel}>
                            Li e concordo com o armazenamento e tratamento dos meus dados conforme descrito acima.
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, (!accepted || loading) && styles.buttonDisabled]}
                        onPress={handleAceitar}
                        disabled={!accepted || loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#ffffff" />
                        ) : (
                            <Text style={styles.buttonText}>Aceitar e Continuar</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        elevation: 5,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#dbeafe',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 19,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 12,
    },
    textContainer: {
        maxHeight: 190,
        marginBottom: 16,
    },
    paragraph: {
        fontSize: 14,
        color: '#4b5563',
        lineHeight: 20,
        marginBottom: 10,
    },
    bold: {
        fontWeight: 'bold',
        color: '#1f2937',
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 20,
        minHeight: 44,
    },
    checkboxLabel: {
        flex: 1,
        fontSize: 13,
        color: '#374151',
        lineHeight: 18,
    },
    button: {
        backgroundColor: '#2563eb',
        borderRadius: 10,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonDisabled: {
        backgroundColor: '#93c5fd',
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 15,
        fontWeight: 'bold',
    },
});