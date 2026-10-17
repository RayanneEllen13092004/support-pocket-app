import * as SecureStore from 'expo-secure-store';

export const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.171.214.140:8000';

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
    const token = await SecureStore.getItemAsync('userToken');

    const headers: Record<string, string> = {
        Accept: 'application/json',
        ...(options.headers as Record<string, string>),
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    return response;
}