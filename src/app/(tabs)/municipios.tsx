import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { apiFetch } from '../../services/api';

type Municipio = {
    id: number;
    name: string;
    anchor_instructions: string | null;
    is_active: boolean | number;
};

export default function MunicipiosScreen() {
    const [busca, setBusca] = useState('');
    const [municipios, setMunicipios] = useState<Municipio[]>([]);
    const [loading, setLoading] = useState(true);

    const [userRole, setUserRole] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [municipioEditando, setMunicipioEditando] = useState<number | null>(null);
    const [novoNome, setNovoNome] = useState('');
    const [novasInstrucoes, setNovasInstrucoes] = useState('');

    const carregarMunicipios = useCallback(async () => {
        setLoading(true);
        try {
            const response = await apiFetch('/api/municipios');
            if (!response.ok) return;
            const data = await response.json();
            setMunicipios(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        carregarMunicipios();
        SecureStore.getItemAsync('userRole').then(role => setUserRole(role?.toLowerCase() || null));
    }, [carregarMunicipios]);

    const salvarMunicipio = async () => {
        if (!novoNome.trim()) {
            Alert.alert('Atenção', 'O nome do município é obrigatório.');
            return;
        }

        setIsSaving(true);

        const url = municipioEditando ? `/api/municipios/${municipioEditando}` : '/api/municipios';
        const method = municipioEditando ? 'PUT' : 'POST';

        try {
            const response = await apiFetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    name: novoNome.trim(),
                    anchor_instructions: novasInstrucoes.trim() || null,
                    is_active: true
                })
            });

            if (response.ok) {
                Alert.alert('Sucesso', `Município ${municipioEditando ? 'atualizado' : 'adicionado'} com sucesso!`);
                fecharFormulario();
                carregarMunicipios();
            } else {
                const payload = await response.json().catch(() => ({}));
                Alert.alert('Erro', payload.message || 'Não foi possível salvar.');
            }
        } catch (error) {
            Alert.alert('Erro', 'Falha ao conectar com o servidor.');
        } finally {
            setIsSaving(false);
        }
    };

    const confirmarDesativacao = (id: number, nome: string) => {
        Alert.alert(
            'Desativar Município',
            `Tem certeza que deseja desativar ${nome}? Ele não será excluído, mas ficará inativo.`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Desativar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const response = await apiFetch(`/api/municipios/${id}`, { method: 'DELETE' });
                            if (response.ok) {
                                carregarMunicipios();
                            }
                        } catch (error) {
                            Alert.alert('Erro', 'Não foi possível desativar.');
                        }
                    }
                }
            ]
        );
    };

    const abrirEdicao = (m: Municipio) => {
        setMunicipioEditando(m.id);
        setNovoNome(m.name);
        setNovasInstrucoes(m.anchor_instructions || '');
        setShowForm(true);
    };

    const fecharFormulario = () => {
        setShowForm(false);
        setMunicipioEditando(null);
        setNovoNome('');
        setNovasInstrucoes('');
    };

    const filtrados = municipios.filter((m) =>
        m.name.toLowerCase().includes(busca.toLowerCase())
    );

    const renderItem = ({ item }: { item: Municipio }) => {
        const isDesativado = item.is_active === false || item.is_active === 0;

        return (
            <TouchableOpacity
                style={[styles.card, isDesativado && styles.cardDesativado]}
                activeOpacity={0.7}
                onPress={() => router.push(`/municipio/${item.id}`)}
            >
                <View style={[styles.cardTopBar, { backgroundColor: isDesativado ? '#94a3b8' : (item.anchor_instructions ? '#ef4444' : '#3b82f6') }]} />
                <View style={styles.cardContent}>
                    <View>
                        <Text style={[styles.cardTitle, isDesativado && styles.textDesativado]} numberOfLines={2}>
                            {item.name}
                        </Text>

                        {isDesativado ? (
                            <View style={[styles.anchorBadge, { backgroundColor: '#f1f5f9' }]}>
                                <Text style={[styles.anchorText, { color: '#64748b' }]}>Desativado</Text>
                            </View>
                        ) : (
                            item.anchor_instructions && (
                                <View style={styles.anchorBadge}>
                                    <View style={styles.anchorDot} />
                                    <Text style={styles.anchorText}>Âncora</Text>
                                </View>
                            )
                        )}
                    </View>

                    <View style={styles.cardFooter}>
                        <Text style={[styles.cardFooterText, isDesativado && styles.textDesativado]}>Ver detalhes ›</Text>

                        {/* Ações do Supervisor */}
                        {userRole === 'supervisor' && (
                            <View style={styles.cardActions}>
                                <TouchableOpacity onPress={() => abrirEdicao(item)} style={styles.actionBtn}>
                                    <Ionicons name="pencil" size={16} color="#64748b" />
                                </TouchableOpacity>
                                {!isDesativado && (
                                    <TouchableOpacity onPress={() => confirmarDesativacao(item.id, item.name)} style={styles.actionBtn}>
                                        <Ionicons name="power" size={16} color="#ef4444" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderHeader = () => (
        <View>
            <View style={styles.header}>
                <View style={styles.headerTopRow}>
                    <View>
                        <Text style={styles.headerTitle}>Municípios</Text>
                        <Text style={styles.headerSubtitle}>Consulte matrizes e regras</Text>
                    </View>

                    {userRole === 'supervisor' && (
                        <TouchableOpacity
                            style={styles.addButton}
                            onPress={() => showForm ? fecharFormulario() : setShowForm(true)}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.addButtonText}>{showForm ? '×' : '+'}</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.statsBox}>
                    <Text style={styles.statsLabel}>Total de Ativos</Text>
                    <View style={styles.statsNumberRow}>
                        <Ionicons name="stats-chart" size={20} color="#bfdbfe" />
                        <Text style={styles.statsNumber}>{municipios.filter(m => m.is_active !== false && m.is_active !== 0).length}</Text>
                    </View>
                </View>

                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#94a3b8" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar município..."
                        placeholderTextColor="#94a3b8"
                        value={busca}
                        onChangeText={setBusca}
                    />
                </View>
            </View>

            {showForm && (
                <View style={styles.formCard}>
                    <Text style={styles.formTitle}>{municipioEditando ? 'Editar município' : 'Novo município'}</Text>

                    {/* LABEL ADICIONADA AQUI */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Nome do município <Text style={styles.required}>*</Text></Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ex: Maceió"
                            placeholderTextColor="#94a3b8"
                            value={novoNome}
                            onChangeText={setNovoNome}
                        />
                    </View>

                    {/* LABEL ADICIONADA AQUI */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Instruções da Âncora (opcional)</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Regras para este município..."
                            placeholderTextColor="#94a3b8"
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                            value={novasInstrucoes}
                            onChangeText={setNovasInstrucoes}
                        />
                    </View>
                    <View style={styles.formActions}>
                        <TouchableOpacity style={[styles.formButton, styles.formButtonSecondary]} onPress={fecharFormulario}>
                            <Text style={styles.formButtonSecondaryText}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.formButton, isSaving && { opacity: 0.7 }]}
                            onPress={salvarMunicipio}
                            disabled={isSaving}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.formButtonText}>
                                {isSaving ? 'Salvando...' : (municipioEditando ? 'Atualizar' : 'Salvar')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator color="#2563eb" />
                </View>
            ) : (
                <FlatList
                    data={filtrados}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    numColumns={2}
                    ListHeaderComponent={renderHeader()}
                    contentContainerStyle={styles.listContainer}
                    columnWrapperStyle={styles.row}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>Nenhum município encontrado.</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: { backgroundColor: '#2563eb', paddingTop: 60, paddingHorizontal: 24, paddingBottom: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, elevation: 5, marginBottom: 16 },
    headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#ffffff' },
    headerSubtitle: { fontSize: 14, color: '#dbeafe', marginTop: 4 },
    addButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
    addButtonText: { color: '#ffffff', fontSize: 24, fontWeight: 'bold', lineHeight: 24 },
    statsBox: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 16, padding: 12, alignItems: 'center', marginTop: 20, alignSelf: 'center', width: '100%', maxWidth: 200, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    statsLabel: { fontSize: 10, textTransform: 'uppercase', color: '#dbeafe', fontWeight: 'bold', letterSpacing: 1 },
    statsNumberRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
    statsNumber: { fontSize: 28, fontWeight: '900', color: '#ffffff' },
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 12, marginTop: 20, paddingHorizontal: 12 },
    searchIcon: { marginRight: 8 },
    searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: '#1e293b' },
    formCard: { marginHorizontal: 16, marginBottom: 16, backgroundColor: '#ffffff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#e2e8f0', gap: 10 },
    formTitle: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
    input: { backgroundColor: '#f8fafc', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 12, paddingVertical: 10, color: '#0f172a' },
    textArea: { minHeight: 80 },
    formActions: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end' },
    formButton: { backgroundColor: '#2563eb', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
    formButtonText: { color: '#ffffff', fontWeight: 'bold' },
    formButtonSecondary: { backgroundColor: '#e2e8f0' },
    formButtonSecondaryText: { color: '#334155', fontWeight: 'bold' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContainer: { paddingBottom: 30 },
    row: { justifyContent: 'space-between', marginBottom: 12, paddingHorizontal: 16 },
    // Adicione junto com os estilos de formulário existentes:
    inputGroup: { gap: 4 },
    inputLabel: { fontSize: 13, fontWeight: '600', color: '#475569', marginLeft: 4 },
    required: { color: '#ef4444' },

    // Estilos do Cartão
    card: { width: '48%', backgroundColor: '#ffffff', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0', elevation: 2, minHeight: 120 },
    cardDesativado: { opacity: 0.6, backgroundColor: '#f8fafc' },
    textDesativado: { color: '#94a3b8' },
    cardTopBar: { height: 4, width: '100%' },
    cardContent: { padding: 12, flex: 1, justifyContent: 'space-between' },
    cardTitle: { fontSize: 14, fontWeight: 'bold', color: '#1e293b', marginBottom: 8 },
    anchorBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef2f2', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
    anchorDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#dc2626', marginRight: 4 },
    anchorText: { fontSize: 10, fontWeight: 'bold', color: '#dc2626' },

    // Rodapé do Cartão e Botões de Ação
    cardFooter: { marginTop: 12, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f1f5f9', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    cardFooterText: { fontSize: 11, fontWeight: 'bold', color: '#2563eb' },
    cardActions: { flexDirection: 'row', gap: 8 },
    actionBtn: { padding: 4 },

    emptyContainer: { padding: 40, alignItems: 'center' },
    emptyText: { color: '#64748b', fontSize: 14 }
});