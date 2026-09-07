import React, { useCallback, useEffect, useMemo, useState } from 'react';
// import { ActivityIndicator, Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import * as DocumentPicker from 'expo-document-picker';
import { apiFetch } from '../../services/api';
import { ActivityIndicator, Alert, Linking, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type MunicipalityDocument = {
    id: number;
    name: string;
    path: string;
    download_url: string;
    created_at: string;
};

type MunicipalityDetails = {
    id: number;
    name: string;
    anchor_instructions: string | null;
    curriculum_matrix: string | null;
    documents: MunicipalityDocument[];
};

export default function MunicipioDetalhesScreen() {
    const { id } = useLocalSearchParams();
    const municipalityId = useMemo(() => String(id ?? ''), [id]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [municipality, setMunicipality] = useState<MunicipalityDetails | null>(null);

    const carregarDetalhes = useCallback(async () => {
        setLoading(true);
        try {
            const role = await SecureStore.getItemAsync('userRole');

            if (role) {
                setUserRole(role);
            } else {
                const userResponse = await apiFetch('/api/user');
                if (userResponse.ok) {
                    const userData = await userResponse.json();
                    const fetchedRole = userData?.role ?? null;
                    setUserRole(fetchedRole);
                    if (fetchedRole) {
                        await SecureStore.setItemAsync('userRole', fetchedRole);
                    }
                }
            }

            const response = await apiFetch(`/api/municipios/${municipalityId}`);

            if (!response.ok) {
                Alert.alert('Erro', 'Não foi possível carregar os dados do município.');
                return;
            }

            const payload = await response.json();
            setMunicipality(payload as MunicipalityDetails);

        } catch (error) {
            console.error(error);
            Alert.alert('Erro de Conexão', 'Falha ao comunicar com o servidor.');
        } finally {
            setLoading(false);
        }
    }, [municipalityId]);

    useEffect(() => {
        carregarDetalhes();
    }, [carregarDetalhes]);

    const baixarDocumento = async (url: string) => {
        const canOpen = await Linking.canOpenURL(url);
        if (!canOpen) {
            Alert.alert('Erro', 'Não foi possível abrir este documento.');
            return;
        }
        await Linking.openURL(url);
    };

    const anexarDocumento = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: '*/*',
                copyToCacheDirectory: true,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const file = result.assets[0];

                // 1. PASSO PROFISSIONAL: Inspecionar o que o celular nos devolveu
                console.log("👉 DADOS BRUTOS DO ARQUIVO:", file);

                // Se não vier URI, paramos aqui antes de quebrar o app
                if (!file.uri) {
                    Alert.alert('Erro', 'O arquivo selecionado é inválido (sem URI).');
                    return;
                }

                setUploading(true);

                const formData = new FormData();

                // 2. Montagem ESTRITA do objeto (apenas as 3 chaves exigidas pelo React Native)
                const uriLimpa = Platform.OS === 'android' ? file.uri : file.uri.replace('file://', '');

                formData.append('arquivo', {
                    uri: uriLimpa,
                    name: file.name || 'documento.pdf',
                    type: file.mimeType || 'application/pdf',
                } as any);

                // 3. PASSO PROFISSIONAL 2: Garantir que o apiFetch não force 'application/json'
                const response = await apiFetch(`/api/municipios/${municipalityId}/documentos`, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Accept': 'application/json',
                        // Remover ou anular o Content-Type para forçar o fetch a calcular o boundary do multipart
                        'Content-Type': 'multipart/form-data',
                    }
                });

                if (!response.ok) {
                    const errorMessage = await response.text();
                    console.error("Erro retornado pela API:", errorMessage);
                    throw new Error('Falha ao salvar no servidor');
                }

                Alert.alert('Sucesso!', 'O arquivo foi enviado com sucesso.');
                carregarDetalhes();
            }
        } catch (error) {
            console.error('Erro no upload:', error);
            Alert.alert('Erro', 'Falha ao enviar o documento.');
        } finally {
            setUploading(false);
        }
    };


    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator color="#2563eb" />
            </View>
        );
    }

    if (!municipality) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.emptyText}>Município não encontrado.</Text>
            </View>
        );
    }

    const isSupervisor = userRole === 'supervisor';

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.navigate('/municipios')}>
                    <Ionicons name="chevron-back" size={20} color="#dbeafe" />
                    <Text style={styles.backText}>Voltar</Text>
                </TouchableOpacity>

                <Text style={styles.title}>{municipality.name}</Text>
                <Text style={styles.subtitle}>Visão geral e regras operacionais</Text>

                <View style={styles.badgeContainer}>
                    {municipality.anchor_instructions ? (
                        <View style={[styles.badge, styles.badgeRed]}>
                            <View style={[styles.badgeDot, { backgroundColor: '#fca5a5' }]} />
                            <Text style={styles.badgeTextRed}>Possui regras de âncora</Text>
                        </View>
                    ) : (
                        <View style={[styles.badge, styles.badgeGreen]}>
                            <Text style={styles.badgeTextGreen}>Sem regras de âncora</Text>
                        </View>
                    )}
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {municipality.anchor_instructions && (
                    <View style={[styles.card, styles.cardRed]}>
                        <View style={[styles.cardHeader, styles.cardHeaderRed]}>
                            <View style={styles.headerRow}>
                                <View style={[styles.cardDot, { backgroundColor: '#dc2626' }]} />
                                <Text style={styles.cardTitleRed}>INSTRUÇÕES DO ÂNCORA</Text>
                            </View>
                        </View>
                        <View style={styles.cardBody}>
                            <Text style={styles.cardTextRed}>{municipality.anchor_instructions}</Text>
                        </View>
                    </View>
                )}

                <View style={[styles.card, styles.cardSlate]}>
                    <View style={[styles.cardHeader, styles.cardHeaderSlate]}>
                        <View style={styles.headerRow}>
                            <View style={[styles.cardDot, { backgroundColor: '#3b82f6' }]} />
                            <Text style={styles.cardTitleSlate}>MATRIZ CURRICULAR</Text>
                        </View>
                    </View>
                    <View style={styles.cardBody}>
                        <Text style={styles.cardTextSlate}>
                            {municipality.curriculum_matrix || 'Sem matriz curricular cadastrada.'}
                        </Text>
                    </View>
                </View>

                <View style={[styles.card, styles.cardSlate]}>
                    <View style={[styles.cardHeader, styles.cardHeaderSlate, styles.documentHeader]}>
                        <View style={styles.headerRow}>
                            <View style={[styles.cardDot, { backgroundColor: '#2563eb' }]} />
                            <Text style={styles.cardTitleSlate}>ANEXOS</Text>
                        </View>
                        {isSupervisor && (
                            <TouchableOpacity
                                style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
                                onPress={anexarDocumento}
                                activeOpacity={0.8}
                                disabled={uploading}
                            >
                                {uploading ? (
                                    <ActivityIndicator color="#ffffff" size="small" />
                                ) : (
                                    <>
                                        <Ionicons name="attach" size={14} color="#ffffff" />
                                        <Text style={styles.uploadButtonText}>Anexar</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        )}
                    </View>
                    <View style={styles.cardBody}>
                        {!isSupervisor && (
                            <Text style={styles.helperText}>
                                Você pode visualizar e baixar os documentos anexados.
                            </Text>
                        )}

                        {municipality.documents.length === 0 ? (
                            <Text style={styles.emptyText}>Nenhum documento anexado.</Text>
                        ) : (
                            municipality.documents.map((document) => (
                                <TouchableOpacity
                                    key={document.id}
                                    style={styles.documentRow}
                                    onPress={() => baixarDocumento(document.download_url)}
                                    activeOpacity={0.8}
                                >
                                    <View style={styles.documentInfo}>
                                        <Ionicons name="document-text-outline" size={18} color="#2563eb" />
                                        <Text style={styles.documentName} numberOfLines={1}>
                                            {document.name}
                                        </Text>
                                    </View>
                                    <Ionicons name="download-outline" size={18} color="#475569" />
                                </TouchableOpacity>
                            ))
                        )}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { backgroundColor: '#2563eb', paddingTop: 50, paddingHorizontal: 24, paddingBottom: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, elevation: 5 },
    backButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 16 },
    backText: { color: '#dbeafe', fontWeight: 'bold', marginLeft: 4 },
    title: { fontSize: 28, fontWeight: 'bold', color: '#ffffff' },
    subtitle: { fontSize: 14, color: '#dbeafe', marginTop: 4 },
    badgeContainer: { marginTop: 12 },
    badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, alignSelf: 'flex-start', borderWidth: 1 },
    badgeRed: { backgroundColor: 'rgba(239,68,68,0.2)', borderColor: 'rgba(254,202,202,0.3)' },
    badgeGreen: { backgroundColor: 'rgba(16,185,129,0.2)', borderColor: 'rgba(167,243,208,0.3)' },
    badgeDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
    badgeTextRed: { fontSize: 11, fontWeight: 'bold', color: '#fee2e2' },
    badgeTextGreen: { fontSize: 11, fontWeight: 'bold', color: '#d1fae5' },
    content: { padding: 16, gap: 16, paddingBottom: 40 },
    card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
    cardHeader: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
    headerRow: { flexDirection: 'row', alignItems: 'center' },
    cardDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
    cardBody: { padding: 16 },
    cardRed: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
    cardHeaderRed: { backgroundColor: '#fef2f2', borderBottomColor: '#fee2e2' },
    cardTitleRed: { fontSize: 12, fontWeight: 'bold', color: '#991b1b' },
    cardTextRed: { fontSize: 14, color: '#7f1d1d', lineHeight: 22 },
    cardSlate: { backgroundColor: '#f8fafc', borderColor: '#e2e8f0' },
    cardHeaderSlate: { backgroundColor: '#f1f5f9', borderBottomColor: '#e2e8f0' },
    cardTitleSlate: { fontSize: 12, fontWeight: 'bold', color: '#334155' },
    cardTextSlate: { fontSize: 14, color: '#334155', lineHeight: 22 },
    documentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    uploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#2563eb',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    uploadButtonDisabled: { opacity: 0.7 },
    uploadButtonText: { color: '#ffffff', fontSize: 12, fontWeight: 'bold' },
    helperText: { color: '#64748b', fontSize: 12, marginBottom: 10 },
    documentRow: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    documentInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, marginRight: 8 },
    documentName: { color: '#1e293b', fontSize: 13, flex: 1 },
    emptyText: { color: '#64748b', fontSize: 14 }
});
