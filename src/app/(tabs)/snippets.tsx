import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';

type Snippet = {
    id: number;
    title: string;
    category: string;
    body: string;
};

const snippetsData: Snippet[] = [
    {
        id: 1,
        title: 'Saudação inicial',
        category: 'Atendimento',
        body: 'Olá! Aqui é do suporte. Pode me informar o município e uma descrição do problema?'
    },
    {
        id: 2,
        title: 'Solicitação de evidência',
        category: 'Diagnóstico',
        body: 'Para analisarmos melhor, envie print da tela com a mensagem de erro e o horário da ocorrência.'
    },
    {
        id: 3,
        title: 'Confirmação de resolução',
        category: 'Encerramento',
        body: 'Ajuste aplicado com sucesso. Consegue validar no seu ambiente e me confirmar, por favor?'
    }
];

export default function SnippetsScreen() {
    const [snippets, setSnippets] = useState<Snippet[]>(snippetsData);
    const [copiedId, setCopiedId] = useState<number | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [newSnippet, setNewSnippet] = useState({
        title: '',
        category: '',
        body: ''
    });

    const copiarSnippet = async (snippet: Snippet) => {
        await Clipboard.setStringAsync(snippet.body);
        setCopiedId(snippet.id);
        setTimeout(() => setCopiedId(null), 1500);
    };

    const salvarSnippet = () => {
        if (!newSnippet.title.trim() || !newSnippet.body.trim()) {
            return;
        }

        const snippetToSave: Snippet = {
            id: editingId ?? Date.now(),
            title: newSnippet.title.trim(),
            category: newSnippet.category.trim() || 'Sem categoria',
            body: newSnippet.body.trim()
        };

        setSnippets((prev) =>
            editingId
                ? prev.map((snippet) => (snippet.id === editingId ? snippetToSave : snippet))
                : [snippetToSave, ...prev]
        );

        setNewSnippet({ title: '', category: '', body: '' });
        setShowForm(false);
        setEditingId(null);
    };

    const abrirEdicao = (snippet: Snippet) => {
        setNewSnippet({
            title: snippet.title,
            category: snippet.category,
            body: snippet.body
        });
        setEditingId(snippet.id);
        setShowForm(true);
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            <View style={styles.header}>
                <View style={styles.headerTopRow}>
                    <View>
                        <Text style={styles.headerSubtitle}>Respostas rápidas</Text>
                        <Text style={styles.headerTitle}>Snippets</Text>
                    </View>

                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => setShowForm((prev) => !prev)}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.addButtonText}>+</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {showForm && (
                <View style={styles.formCard}>
                <Text style={styles.formTitle}>{editingId ? 'Editar snippet' : 'Novo snippet'}</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Título"
                        placeholderTextColor="#94a3b8"
                        value={newSnippet.title}
                        onChangeText={(value) => setNewSnippet((prev) => ({ ...prev, title: value }))}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Categoria"
                        placeholderTextColor="#94a3b8"
                        value={newSnippet.category}
                        onChangeText={(value) => setNewSnippet((prev) => ({ ...prev, category: value }))}
                    />
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Texto do snippet"
                        placeholderTextColor="#94a3b8"
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                        value={newSnippet.body}
                        onChangeText={(value) => setNewSnippet((prev) => ({ ...prev, body: value }))}
                    />
                    <View style={styles.formActions}>
                        <TouchableOpacity
                            style={[styles.formButton, styles.formButtonSecondary]}
                            onPress={() => {
                                setShowForm(false);
                                setEditingId(null);
                                setNewSnippet({ title: '', category: '', body: '' });
                            }}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.formButtonSecondaryText}>Cancelar</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.formButton}
                            onPress={salvarSnippet}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.formButtonText}>Salvar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            <View style={styles.list}>
                {snippets.map((snippet) => (
                    <View key={snippet.id} style={styles.card}>
                        <View style={styles.cardTop}>
                            <View style={styles.cardInfo}>
                                <Text style={styles.title}>{snippet.title}</Text>
                                <Text style={styles.category}>{snippet.category}</Text>
                            </View>

                            <View style={styles.cardActions}>
                                <TouchableOpacity
                                    style={styles.iconButton}
                                    onPress={() => abrirEdicao(snippet)}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.iconButtonText}>✎</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.copyButton}
                                    onPress={() => copiarSnippet(snippet)}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.copyButtonText}>
                                        {copiedId === snippet.id ? 'Copiado!' : 'Copiar'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <Text style={styles.body}>{snippet.body}</Text>
                    </View>
                ))}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    contentContainer: { paddingBottom: 24 },
    header: {
        backgroundColor: '#2563eb',
        paddingTop: 60,
        paddingHorizontal: 24,
        paddingBottom: 24,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24
    },
    headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    headerSubtitle: { fontSize: 14, color: '#dbeafe' },
    headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#ffffff', marginTop: 2 },
    addButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.18)',
        alignItems: 'center',
        justifyContent: 'center'
    },
    addButtonText: { color: '#ffffff', fontSize: 24, fontWeight: 'bold', lineHeight: 24 },
    formCard: {
        margin: 16,
        marginTop: 0,
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        gap: 10
    },
    formTitle: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
    input: {
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        paddingHorizontal: 12,
        paddingVertical: 10,
        color: '#0f172a'
    },
    textArea: { minHeight: 100 },
    formActions: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end' },
    formButton: {
        backgroundColor: '#2563eb',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10
    },
    formButtonText: { color: '#ffffff', fontWeight: 'bold' },
    formButtonSecondary: { backgroundColor: '#e2e8f0' },
    formButtonSecondaryText: { color: '#334155', fontWeight: 'bold' },
    list: { padding: 16, gap: 12 },
    card: {
        backgroundColor: '#f3f4f6',
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: '#e5e7eb'
    },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
    cardInfo: { flex: 1 },
    cardActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    title: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
    category: { fontSize: 12, color: '#6b7280', marginTop: 3 },
    iconButton: {
        width: 34,
        height: 34,
        borderRadius: 9,
        backgroundColor: '#e2e8f0',
        alignItems: 'center',
        justifyContent: 'center'
    },
    iconButtonText: { color: '#334155', fontSize: 16, fontWeight: 'bold', lineHeight: 16 },
    copyButton: {
        backgroundColor: '#2563eb',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8
    },
    copyButtonText: { color: '#ffffff', fontSize: 12, fontWeight: 'bold' },
    body: { fontSize: 14, color: '#4b5563', marginTop: 10, lineHeight: 20 }
});