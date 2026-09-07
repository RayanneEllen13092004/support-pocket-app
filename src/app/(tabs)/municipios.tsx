import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { apiFetch } from '../../services/api';

type Municipio = {
    id: number;
    name: string;
    anchor_instructions: string | null;
};

export default function MunicipiosScreen() {
    const [busca, setBusca] = useState('');
    const [municipios, setMunicipios] = useState<Municipio[]>([]);
    const [loading, setLoading] = useState(true);

    const carregarMunicipios = useCallback(async () => {
        setLoading(true);
        try {
            const response = await apiFetch('/api/municipios');

            if (!response.ok) {
                Alert.alert('Erro', 'Não foi possível carregar os municípios.');
                return;
            }

            const data = await response.json();

            setMunicipios(Array.isArray(data) ? (data as Municipio[]) : []);

        } catch (error) {
            console.error(error);
            Alert.alert('Erro de Conexão', 'Falha ao comunicar com o servidor.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        carregarMunicipios();
    }, [carregarMunicipios]);

    const filtrados = municipios.filter((m) =>
        m.name.toLowerCase().includes(busca.toLowerCase())
    );

    const renderItem = ({ item }: { item: Municipio }) => (
        <TouchableOpacity
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => router.push(`/municipio/${item.id}`)}
        >
            <View style={[styles.cardTopBar, { backgroundColor: item.anchor_instructions ? '#ef4444' : '#3b82f6' }]} />
            <View style={styles.cardContent}>
                <View>
                    <Text style={styles.cardTitle} numberOfLines={2}>{item.name}</Text>
                    {item.anchor_instructions && (
                        <View style={styles.anchorBadge}>
                            <View style={styles.anchorDot} />
                            <Text style={styles.anchorText}>Âncora</Text>
                        </View>
                    )}
                </View>
                <View style={styles.cardFooter}>
                    <Text style={styles.cardFooterText}>Ver detalhes ›</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Municípios</Text>
                <Text style={styles.headerSubtitle}>Consulte matrizes e regras</Text>

                <View style={styles.statsBox}>
                    <Text style={styles.statsLabel}>Total de Ativos</Text>
                    <View style={styles.statsNumberRow}>
                        <Ionicons name="stats-chart" size={20} color="#bfdbfe" />
                        <Text style={styles.statsNumber}>{municipios.length}</Text>
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
    header: { backgroundColor: '#2563eb', paddingTop: 60, paddingHorizontal: 24, paddingBottom: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, elevation: 5 },
    headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#ffffff' },
    headerSubtitle: { fontSize: 14, color: '#dbeafe', marginTop: 4 },
    statsBox: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 16, padding: 12, alignItems: 'center', marginTop: 20, alignSelf: 'center', width: '100%', maxWidth: 200, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    statsLabel: { fontSize: 10, textTransform: 'uppercase', color: '#dbeafe', fontWeight: 'bold', letterSpacing: 1 },
    statsNumberRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
    statsNumber: { fontSize: 28, fontWeight: '900', color: '#ffffff' },
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 12, marginTop: 20, paddingHorizontal: 12 },
    searchIcon: { marginRight: 8 },
    searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: '#1e293b' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContainer: { padding: 16, paddingBottom: 30 },
    row: { justifyContent: 'space-between', marginBottom: 12 },
    card: { width: '48%', backgroundColor: '#ffffff', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0', elevation: 2, minHeight: 120 },
    cardTopBar: { height: 4, width: '100%' },
    cardContent: { padding: 12, flex: 1, justifyContent: 'space-between' },
    cardTitle: { fontSize: 14, fontWeight: 'bold', color: '#1e293b', marginBottom: 8 },
    anchorBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef2f2', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
    anchorDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#dc2626', marginRight: 4 },
    anchorText: { fontSize: 10, fontWeight: 'bold', color: '#dc2626' },
    cardFooter: { marginTop: 12, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
    cardFooterText: { fontSize: 11, fontWeight: 'bold', color: '#2563eb' },
    emptyContainer: { padding: 40, alignItems: 'center' },
    emptyText: { color: '#64748b', fontSize: 14 }
});