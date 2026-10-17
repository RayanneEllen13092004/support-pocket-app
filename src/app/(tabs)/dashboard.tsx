import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useIsFocused, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';

export default function DashboardScreen() {
    const router = useRouter();
    const isFocused = useIsFocused();
    const [avatarUri, setAvatarUri] = useState<string | null>(null);
    const hour = new Date().getHours();
    const saudacao = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

    const getAvatarStorageKey = async () => {
        const normalizeStorageSuffix = (value: string) =>
            value.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '_');

        const userId = await SecureStore.getItemAsync('userId');
        if (userId) return `userAvatar_${normalizeStorageSuffix(userId)}`;

        const userEmail = await SecureStore.getItemAsync('userEmail');
        if (userEmail) return `userAvatar_${normalizeStorageSuffix(userEmail)}`;

        const userName = await SecureStore.getItemAsync('userName');
        if (userName) return `userAvatar_${normalizeStorageSuffix(userName)}`;

        return null;
    };

    useEffect(() => {
        let active = true;

        const carregarAvatar = async () => {
            const avatarKey = await getAvatarStorageKey();
            if (!avatarKey) {
                if (active) setAvatarUri(null);
                return;
            }

            const fotoSalva = await SecureStore.getItemAsync(avatarKey);
            if (!fotoSalva) {
                if (active) setAvatarUri(null);
                return;
            }

            const info = await FileSystem.getInfoAsync(fotoSalva);
            if (info.exists) {
                if (active) setAvatarUri(fotoSalva);
            } else {
                if (active) setAvatarUri(null);
                await SecureStore.deleteItemAsync(avatarKey);
            }
        };

        if (isFocused) {
            carregarAvatar();
        }

        return () => {
            active = false;
        };
    }, [isFocused]);

    const fazerLogout = async () => {
        await SecureStore.deleteItemAsync('userToken');
        await SecureStore.deleteItemAsync('userRole');
        await SecureStore.deleteItemAsync('userName');
        await SecureStore.deleteItemAsync('userId');
        await SecureStore.deleteItemAsync('userEmail');
        setAvatarUri(null);
        router.replace('/');
    };
    const irParaSnippets = () => router.push('/snippets');
    const irParaRegistro = () => router.push('/registro');
    const irParaKanban = () => router.push('/kanban');
    const irParaPerfil = () => router.push('/perfil');

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>

            {/* Header com Gradiente Visual */}
            <View style={styles.header}>
                <View style={styles.headerTopRow}>
                    <Text style={styles.greeting}>{saudacao}, suporte</Text>

                    {/* Contêiner para agrupar os ícones à direita */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>

                        {/* Botão de Perfil */}
                        <TouchableOpacity onPress={irParaPerfil} activeOpacity={0.7} style={styles.profileButton}>
                            {avatarUri ? (
                                <Image source={{ uri: avatarUri }} style={styles.profileAvatar} />
                            ) : (
                                <Ionicons name="person-circle-outline" size={24} color="#ffffff" />
                            )}
                        </TouchableOpacity>

                        {/* Botão de Logout*/}
                        <TouchableOpacity onPress={fazerLogout} style={styles.logoutButton} activeOpacity={0.7}>
                            <Ionicons name="log-out-outline" size={24} color="#ffffff" />
                        </TouchableOpacity>

                    </View>
                </View>
                <Text style={styles.title}>Support Pocket</Text>
                <Text style={styles.subtitle}>Visão rápida do atendimento escolar</Text>

                {/* Métricas rápidas no topo */}
                <View style={styles.topStatsGrid}>
                    <View style={styles.topStatCard}>
                        <Text style={styles.topStatLabel}>HOJE</Text>
                        <Text style={styles.topStatValue}>30</Text>
                    </View>
                    <View style={styles.topStatCard}>
                        <Text style={styles.topStatLabel}>ABERTOS</Text>
                        <Text style={styles.topStatValue}>12</Text>
                    </View>
                    <View style={styles.topStatCard}>
                        <Text style={styles.topStatLabel}>SLA</Text>
                        <Text style={styles.topStatValue}>92%</Text>
                    </View>
                </View>
            </View>

            <View style={styles.body}>

                {/* Cards de Comparativo */}
                <View style={styles.rowGrid}>
                    <View style={styles.card}>
                        <Text style={styles.cardSubText}>Chamados hoje</Text>
                        <Text style={styles.cardMainValue}>30</Text>
                        <Text style={styles.cardTrendPositive}>+8% vs ontem</Text>
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.cardSubText}>Em aberto</Text>
                        <Text style={styles.cardMainValue}>12</Text>
                        <Text style={styles.cardTrendWarning}>Atenção ao módulo Notas</Text>
                    </View>
                </View>

                {/* Alerta do Dia */}
                <View style={styles.alertCard}>
                    <Text style={styles.alertTitle}>Alerta do dia</Text>
                    <Text style={styles.alertText}>18 chamados (60%) foram sobre o módulo de Notas na rede estadual.</Text>
                </View>

                {/* Ações Rápidas */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Ações rápidas</Text>

                    <View style={styles.actionList}>
                        <TouchableOpacity style={styles.actionButton} activeOpacity={0.7} onPress={irParaSnippets}>
                            <Text style={styles.actionButtonText}>Ver Snippets</Text>
                            <Ionicons name="chevron-forward" size={18} color="#6b7280" />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionButton} activeOpacity={0.7} onPress={irParaRegistro}>
                            <Text style={styles.actionButtonText}>Novo Registro</Text>
                            <Ionicons name="chevron-forward" size={18} color="#6b7280" />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionButton} activeOpacity={0.7} onPress={irParaKanban}>
                            <Text style={styles.actionButtonText}>Abrir Kanban</Text>
                            <Ionicons name="chevron-forward" size={18} color="#6b7280" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Distribuição por Módulo */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitleUppercase}>Distribuição por módulo</Text>

                    <View style={styles.progressContainer}>
                        <View style={styles.progressHeader}>
                            <Text style={styles.progressLabel}>Notas</Text>
                            <Text style={styles.progressValue}>60%</Text>
                        </View>
                        <View style={styles.progressBarBackground}>
                            <View style={[styles.progressBarFill, { width: '60%', backgroundColor: '#2563eb' }]} />
                        </View>
                    </View>

                    <View style={styles.progressContainer}>
                        <View style={styles.progressHeader}>
                            <Text style={styles.progressLabel}>Frequência</Text>
                            <Text style={styles.progressValue}>25%</Text>
                        </View>
                        <View style={styles.progressBarBackground}>
                            <View style={[styles.progressBarFill, { width: '25%', backgroundColor: '#4f46e5' }]} />
                        </View>
                    </View>

                    <View style={styles.progressContainer}>
                        <View style={styles.progressHeader}>
                            <Text style={styles.progressLabel}>Boletim</Text>
                            <Text style={styles.progressValue}>15%</Text>
                        </View>
                        <View style={styles.progressBarBackground}>
                            <View style={[styles.progressBarFill, { width: '15%', backgroundColor: '#10b981' }]} />
                        </View>
                    </View>

                </View>

            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    contentContainer: { paddingBottom: 40 },
    header: { backgroundColor: '#2563eb', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 24, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
    headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    greeting: { fontSize: 14, color: '#dbeafe' },
    profileButton: { alignItems: 'center', justifyContent: 'center' },
    profileAvatar: {
        width: 30,
        height: 30,
        borderRadius: 15,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.85)',
        backgroundColor: '#93c5fd'
    },
    logoutButton: { padding: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8 },
    title: { fontSize: 28, fontWeight: 'bold', color: '#ffffff', marginTop: 4 },
    subtitle: { fontSize: 14, color: '#dbeafe', marginTop: 2 },
    topStatsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, gap: 8 },
    topStatCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 10, alignItems: 'center' },
    topStatLabel: { fontSize: 10, color: '#dbeafe', fontWeight: 'bold', letterSpacing: 0.5 },
    topStatValue: { fontSize: 18, color: '#ffffff', fontWeight: 'bold', marginTop: 2 },
    body: { padding: 16, gap: 16 },
    rowGrid: { flexDirection: 'row', gap: 12 },
    card: { flex: 1, backgroundColor: '#ffffff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
    cardSubText: { fontSize: 12, color: '#64748b' },
    cardMainValue: { fontSize: 22, fontWeight: 'bold', color: '#0f172a', marginTop: 4 },
    cardTrendPositive: { fontSize: 11, color: '#059669', fontWeight: '600', marginTop: 4 },
    cardTrendWarning: { fontSize: 11, color: '#d97706', fontWeight: '600', marginTop: 4 },
    alertCard: { backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fde68a', borderRadius: 16, padding: 16 },
    alertTitle: { fontSize: 14, fontWeight: 'bold', color: '#92400e' },
    alertText: { fontSize: 13, color: '#b45309', marginTop: 4, lineHeight: 18 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#0f172a', marginBottom: 12 },
    sectionTitleUppercase: { fontSize: 12, fontWeight: 'bold', color: '#64748b', marginBottom: 12, letterSpacing: 0.5 },
    actionList: { gap: 8 },
    actionButton: { backgroundColor: '#f1f5f9', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    actionButtonText: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
    progressContainer: { marginBottom: 12 },
    progressHeader: { flexDirection: 'row', justifyContent: 'space-between', fontSize: 13, color: '#475569', marginBottom: 6 },
    progressLabel: { fontSize: 13, color: '#475569', fontWeight: '500' },
    progressValue: { fontSize: 13, color: '#475569', fontWeight: 'bold' },
    progressBarBackground: { height: 8, backgroundColor: '#f1f5f9', borderRadius: 4, overflow: 'hidden' },
    progressBarFill: { height: '100%', borderRadius: 4 }
});