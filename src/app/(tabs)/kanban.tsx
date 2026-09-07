import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Dimensions, Alert, ActivityIndicator } from 'react-native';
import { apiFetch } from '@/services/api';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = width * 0.85;

export default function KanbanScreen() {
    const [novaTarefa, setNovaTarefa] = useState('');
    const [loading, setLoading] = useState(false);
    const [tarefas, setTarefas] = useState({
        todo: [],
        doing: [],
        done: []
    });

    const carregarKanban = async () => {
        try {
            const response = await apiFetch('/api/kanban');

            if (response.ok) {
                const data = await response.json();
                setTarefas(data);
            }
        } catch (error) {
            console.error('Erro ao carregar kanban:', error);
        }
    };

    useEffect(() => {
        carregarKanban();
    }, []);

    const adicionarTarefa = async () => {
        if (!novaTarefa.trim()) return;

        setLoading(true);
        try {
            const response = await apiFetch('/api/kanban', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ title: novaTarefa, status: 'todo' })
            });

            if (response.ok) {
                setNovaTarefa('');
                carregarKanban();
            } else {
                const payload = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
                Alert.alert('Erro', payload.message || 'Não foi possível adicionar a tarefa.');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Erro de Conexão', 'Falha ao comunicar com o servidor.');
        } finally {
            setLoading(false);
        }
    };

    const mudarStatus = async (id, novoStatus) => {
        try {
            const response = await apiFetch(`/api/kanban/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: novoStatus })
            });

            if (response.ok) {
                carregarKanban();
            } else {
                Alert.alert('Erro', 'Não foi possível atualizar o status da tarefa.');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Erro', 'Falha de conexão ao tentar atualizar o status.');
        }
    };

    return (
        <View style={styles.container}>
            {/* Header Fixo */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Meu Kanban</Text>
                <Text style={styles.headerSubtitle}>Organize seus chamados escolares</Text>

                <View style={styles.formContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Nova tarefa..."
                        placeholderTextColor="#9ca3af"
                        value={novaTarefa}
                        onChangeText={setNovaTarefa}
                    />
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={adicionarTarefa}
                        activeOpacity={0.8}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#1d4ed8" size="small" />
                        ) : (
                            <Text style={styles.addButtonText}>+ Adicionar</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            {/* Colunas do Kanban */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={COLUMN_WIDTH + 16}
                decelerationRate="fast"
                contentContainerStyle={styles.scrollContent}
            >
                {/* COLUNA: A FAZER */}
                <View style={[styles.column, styles.colTodo]}>
                    <View style={styles.columnHeader}>
                        <Text style={[styles.columnTitle, { color: '#475569' }]}>A FAZER</Text>
                        <View style={[styles.badge, { backgroundColor: '#f1f5f9' }]}>
                            <Text style={[styles.badgeText, { color: '#475569' }]}>{tarefas.todo?.length || 0}</Text>
                        </View>
                    </View>

                    <ScrollView style={styles.taskList} showsVerticalScrollIndicator={false}>
                        {tarefas.todo?.map(task => (
                            <View key={task.id} style={styles.taskCard}>
                                <Text style={styles.taskTitle}>{task.title}</Text>
                                <View style={styles.cardActions}>
                                    <View />
                                    <TouchableOpacity onPress={() => mudarStatus(task.id, 'doing')} style={styles.moveButton}>
                                        <Text style={styles.moveButtonText}>Avançar →</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </ScrollView>
                </View>

                {/* COLUNA: EM ANDAMENTO */}
                <View style={[styles.column, styles.colDoing]}>
                    <View style={styles.columnHeader}>
                        <Text style={[styles.columnTitle, { color: '#1d4ed8' }]}>EM ANDAMENTO</Text>
                        <View style={[styles.badge, { backgroundColor: '#dbeafe' }]}>
                            <Text style={[styles.badgeText, { color: '#1d4ed8' }]}>{tarefas.doing?.length || 0}</Text>
                        </View>
                    </View>

                    <ScrollView style={styles.taskList} showsVerticalScrollIndicator={false}>
                        {tarefas.doing?.map(task => (
                            <View key={task.id} style={styles.taskCard}>
                                <Text style={styles.taskTitle}>{task.title}</Text>
                                <View style={styles.cardActions}>
                                    <TouchableOpacity onPress={() => mudarStatus(task.id, 'todo')} style={styles.moveButton}>
                                        <Text style={styles.moveButtonText}>← Voltar</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => mudarStatus(task.id, 'done')} style={styles.moveButtonDone}>
                                        <Text style={styles.moveButtonDoneText}>Concluir ✓</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </ScrollView>
                </View>

                {/* COLUNA: CONCLUÍDO */}
                <View style={[styles.column, styles.colDone]}>
                    <View style={styles.columnHeader}>
                        <Text style={[styles.columnTitle, { color: '#047857' }]}>CONCLUÍDO</Text>
                        <View style={[styles.badge, { backgroundColor: '#d1fae5' }]}>
                            <Text style={[styles.badgeText, { color: '#047857' }]}>{tarefas.done?.length || 0}</Text>
                        </View>
                    </View>

                    <ScrollView style={styles.taskList} showsVerticalScrollIndicator={false}>
                        {tarefas.done?.map(task => (
                            <View key={task.id} style={[styles.taskCard, { opacity: 0.8 }]}>
                                <Text style={[styles.taskTitle, { textDecorationLine: 'line-through', color: '#475569' }]}>
                                    {task.title}
                                </Text>
                                <View style={styles.cardActions}>
                                    <TouchableOpacity onPress={() => mudarStatus(task.id, 'doing')} style={styles.moveButton}>
                                        <Text style={styles.moveButtonText}>← Reabrir</Text>
                                    </TouchableOpacity>
                                    <View />
                                </View>
                            </View>
                        ))}
                    </ScrollView>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: { backgroundColor: '#2563eb', paddingTop: 60, paddingHorizontal: 24, paddingBottom: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5, marginBottom: 16 },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#ffffff' },
    headerSubtitle: { fontSize: 14, color: '#dbeafe', marginTop: 4 },
    formContainer: { flexDirection: 'row', marginTop: 16, gap: 8 },
    input: { flex: 1, backgroundColor: '#ffffff', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: '#1e293b' },
    addButton: { backgroundColor: '#ffffff', borderRadius: 12, paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center', minWidth: 90 },
    addButtonText: { color: '#1d4ed8', fontWeight: 'bold', fontSize: 14 },
    scrollContent: { paddingHorizontal: 16, paddingBottom: 24, gap: 16 },
    column: { width: COLUMN_WIDTH, borderRadius: 24, padding: 16, borderWidth: 1, maxHeight: '100%' },
    colTodo: { backgroundColor: '#ffffff', borderColor: '#e2e8f0' },
    colDoing: { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' },
    colDone: { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' },
    columnHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    columnTitle: { fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    badgeText: { fontSize: 12, fontWeight: 'bold' },
    taskList: { flex: 1 },
    taskCard: { backgroundColor: '#f8fafc', padding: 14, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
    taskTitle: { fontSize: 14, fontWeight: '600', color: '#1e293b', marginBottom: 8 },
    cardActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4, borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 8 },
    moveButton: { paddingVertical: 4, paddingHorizontal: 8 },
    moveButtonText: { fontSize: 12, color: '#2563eb', fontWeight: 'bold' },
    moveButtonDone: { paddingVertical: 4, paddingHorizontal: 8, backgroundColor: '#d1fae5', borderRadius: 6 },
    moveButtonDoneText: { fontSize: 12, color: '#047857', fontWeight: 'bold' }
});