import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { apiFetch } from '../../services/api';

type School = {
    id: number;
    name: string;
};

type FormData = {
    schoolId: string;
    profile: string;
    module: string;
    description: string;
};

type FormErrors = Partial<Record<keyof FormData, string>>;

const profiles = ['Diretor', 'Secretaria', 'Professor'];
const modules = ['Notas', 'Boletim', 'Frequência'];

export default function RegistroScreen() {
    const [form, setForm] = useState<FormData>({
        schoolId: '',
        profile: '',
        module: '',
        description: ''
    });
    const [errors, setErrors] = useState<FormErrors>({});
    const [schools, setSchools] = useState<School[]>([]);
    const [loadingSchools, setLoadingSchools] = useState(true);
    const [isSchoolListOpen, setIsSchoolListOpen] = useState(false);
    const [schoolQuery, setSchoolQuery] = useState('');
    const [saving, setSaving] = useState(false);
    const hasErrors = Object.values(errors).some(Boolean);

    const schoolName = useMemo(
        () => schools.find((school) => String(school.id) === form.schoolId)?.name || 'Selecione uma escola...',
        [form.schoolId, schools]
    );
    const filteredSchools = useMemo(
        () => schools.filter((school) => school.name.toLowerCase().includes(schoolQuery.trim().toLowerCase())),
        [schools, schoolQuery]
    );

    const handleChange = (field: keyof FormData, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => {
            const next = { ...prev };
            delete next[field];
            return next;
        });
    };

    const selecionarEscola = (schoolId: string) => {
        handleChange('schoolId', schoolId);
        setIsSchoolListOpen(false);
        setSchoolQuery('');
    };

    const carregarEscolas = async () => {
        setLoadingSchools(true);
        try {
            const response = await apiFetch('/api/schools');

            if (!response.ok) {
                Alert.alert('Erro', 'Não foi possível carregar as escolas.');
                return;
            }

            const data = await response.json();
            setSchools(Array.isArray(data) ? data : []);

        } catch (error) {
            console.error(error);
            Alert.alert('Erro de Conexão', 'Falha ao comunicar com o servidor.');
        } finally {
            setLoadingSchools(false);
        }
    };

    useEffect(() => {
        carregarEscolas();
    }, []);

    const validar = () => {
        const nextErrors: FormErrors = {};

        if (!form.schoolId) nextErrors.schoolId = 'Selecione uma escola.';
        if (!form.profile) nextErrors.profile = 'Selecione um perfil.';
        if (!form.module) nextErrors.module = 'Selecione um módulo.';
        if (!form.description.trim()) nextErrors.description = 'Descreva o atendimento.';

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const salvarRegistro = async () => {
        if (!validar()) return;

        setSaving(true);
        try {
            const response = await apiFetch('/api/registro', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    school_id: Number(form.schoolId),
                    profile: form.profile,
                    module: form.module,
                    description: form.description.trim()
                })
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.errors) {
                    const nextErrors: FormErrors = {};
                    if (data.errors.school_id?.[0]) nextErrors.schoolId = data.errors.school_id[0];
                    if (data.errors.profile?.[0]) nextErrors.profile = data.errors.profile[0];
                    if (data.errors.module?.[0]) nextErrors.module = data.errors.module[0];
                    if (data.errors.description?.[0]) nextErrors.description = data.errors.description[0];
                    setErrors(nextErrors);
                }

                Alert.alert('Erro', data.message || 'Não foi possível salvar o registro.');
                return;
            }

            Alert.alert('Sucesso', data.message || 'Registro salvo com sucesso!');
            setForm({
                schoolId: '',
                profile: '',
                module: '',
                description: ''
            });
            setErrors({});

        } catch (error) {
            console.error(error);
            Alert.alert('Erro de Conexão', 'Falha ao comunicar com o servidor.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            <View style={styles.header}>
                <Text style={styles.headerSubtitle}>Registrar atendimento</Text>
                <Text style={styles.headerTitle}>Novo Registro</Text>
            </View>

            {hasErrors && (
                <View style={styles.errorBox}>
                    <Text style={styles.errorTitle}>Ops! Verifique os erros abaixo:</Text>
                    {!!errors.schoolId && <Text style={styles.errorItem}>• {errors.schoolId}</Text>}
                    {!!errors.profile && <Text style={styles.errorItem}>• {errors.profile}</Text>}
                    {!!errors.module && <Text style={styles.errorItem}>• {errors.module}</Text>}
                    {!!errors.description && <Text style={styles.errorItem}>• {errors.description}</Text>}
                </View>
            )}

            <View style={styles.form}>
                <Text style={styles.label}>Escola</Text>
                {loadingSchools ? (
                    <View style={styles.loadingWrapper}>
                        <ActivityIndicator color="#2563eb" />
                    </View>
                ) : (
                    <View>
                        <TouchableOpacity
                            style={styles.selectTrigger}
                            onPress={() => setIsSchoolListOpen((prev) => !prev)}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.selectTriggerText} numberOfLines={1}>
                                {schoolName}
                            </Text>
                            <Text style={styles.selectTriggerIcon}>{isSchoolListOpen ? '▲' : '▼'}</Text>
                        </TouchableOpacity>

                        {isSchoolListOpen && (
                            <View style={styles.schoolListPanel}>
                                <TextInput
                                    style={styles.schoolSearchInput}
                                    placeholder="Buscar escola..."
                                    placeholderTextColor="#94a3b8"
                                    value={schoolQuery}
                                    onChangeText={setSchoolQuery}
                                />
                                <ScrollView
                                    style={styles.schoolList}
                                    nestedScrollEnabled
                                    keyboardShouldPersistTaps="handled"
                                >
                                    {filteredSchools.map((school) => (
                                        <TouchableOpacity
                                            key={school.id}
                                            style={[
                                                styles.schoolRow,
                                                form.schoolId === String(school.id) && styles.schoolRowSelected
                                            ]}
                                            onPress={() => selecionarEscola(String(school.id))}
                                            activeOpacity={0.8}
                                        >
                                            <Text
                                                style={[
                                                    styles.schoolRowText,
                                                    form.schoolId === String(school.id) && styles.schoolRowTextSelected
                                                ]}
                                            >
                                                {school.name}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                    {filteredSchools.length === 0 && (
                                        <Text style={styles.emptyText}>Nenhuma escola encontrada.</Text>
                                    )}
                                </ScrollView>
                            </View>
                        )}
                    </View>
                )}
                {!!errors.schoolId && <Text style={styles.inlineError}>{errors.schoolId}</Text>}

                <Text style={styles.label}>Perfil</Text>
                <View style={styles.optionRow}>
                    {profiles.map((item) => (
                        <TouchableOpacity
                            key={item}
                            style={[styles.chip, form.profile === item && styles.chipSelected]}
                            onPress={() => handleChange('profile', item)}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.chipText, form.profile === item && styles.chipTextSelected]}>{item}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
                {!!errors.profile && <Text style={styles.inlineError}>{errors.profile}</Text>}

                <Text style={styles.label}>Módulo</Text>
                <View style={styles.optionRow}>
                    {modules.map((item) => (
                        <TouchableOpacity
                            key={item}
                            style={[styles.chip, form.module === item && styles.chipSelected]}
                            onPress={() => handleChange('module', item)}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.chipText, form.module === item && styles.chipTextSelected]}>{item}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
                {!!errors.module && <Text style={styles.inlineError}>{errors.module}</Text>}

                <Text style={styles.label}>Descrição</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Descreva o atendimento"
                    placeholderTextColor="#94a3b8"
                    multiline
                    numberOfLines={4}
                    value={form.description}
                    onChangeText={(value) => handleChange('description', value)}
                    textAlignVertical="top"
                />
                {!!errors.description && <Text style={styles.inlineError}>{errors.description}</Text>}

                <TouchableOpacity
                    style={[styles.submitButton, saving && styles.submitButtonDisabled]}
                    onPress={salvarRegistro}
                    activeOpacity={0.8}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator color="#ffffff" />
                    ) : (
                        <Text style={styles.submitButtonText}>Salvar</Text>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    contentContainer: { paddingBottom: 96 },
    header: {
        backgroundColor: '#2563eb',
        paddingTop: 60,
        paddingHorizontal: 24,
        paddingBottom: 24,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24
    },
    headerSubtitle: { fontSize: 14, color: '#dbeafe' },
    headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#ffffff', marginTop: 2 },
    errorBox: {
        marginHorizontal: 16,
        marginTop: 16,
        backgroundColor: '#fee2e2',
        borderWidth: 1,
        borderColor: '#fecaca',
        borderRadius: 12,
        padding: 12
    },
    errorTitle: { color: '#b91c1c', fontWeight: 'bold', fontSize: 13 },
    errorItem: { color: '#dc2626', marginTop: 4, fontSize: 13 },
    form: { paddingHorizontal: 16, paddingTop: 16, gap: 10 },
    label: { fontSize: 14, fontWeight: 'bold', color: '#334155', marginTop: 2 },
    loadingWrapper: { paddingVertical: 14 },
    selectTrigger: {
        backgroundColor: '#f1f5f9',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    selectTriggerText: { color: '#1e293b', fontSize: 14, flex: 1, marginRight: 10 },
    selectTriggerIcon: { color: '#64748b', fontSize: 12 },
    schoolListPanel: {
        marginTop: 8,
        backgroundColor: '#ffffff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        overflow: 'hidden'
    },
    schoolSearchInput: {
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        paddingHorizontal: 12,
        paddingVertical: 10,
        color: '#0f172a'
    },
    schoolList: { maxHeight: 220 },
    schoolRow: {
        paddingHorizontal: 12,
        paddingVertical: 11,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9'
    },
    schoolRowSelected: { backgroundColor: '#dbeafe' },
    schoolRowText: { color: '#1e293b', fontSize: 13 },
    schoolRowTextSelected: { color: '#1d4ed8', fontWeight: '600' },
    emptyText: { color: '#64748b', fontSize: 13, marginTop: 2 },
    optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
        backgroundColor: '#f1f5f9',
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0'
    },
    chipSelected: { backgroundColor: '#dbeafe', borderColor: '#60a5fa' },
    chipText: { fontSize: 13, color: '#334155' },
    chipTextSelected: { color: '#1d4ed8', fontWeight: '600' },
    input: {
        backgroundColor: '#f1f5f9',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        paddingHorizontal: 12,
        paddingVertical: 10,
        color: '#0f172a'
    },
    textArea: { minHeight: 120 },
    inlineError: { color: '#dc2626', fontSize: 12, marginTop: -4, marginBottom: 2 },
    submitButton: {
        marginTop: 10,
        backgroundColor: '#2563eb',
        borderRadius: 14,
        paddingVertical: 14,
        alignItems: 'center'
    },
    submitButtonDisabled: { opacity: 0.7 },
    submitButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 }
});