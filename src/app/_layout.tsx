import React from 'react';
import { Stack } from 'expo-router';

export default function RootLayout() {
    return (
        <Stack>

            <Stack.Screen name="index" options={{ headerShown: false }} />

            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

            <Stack.Screen
                name="perfil"
                options={{
                    headerShown: false,
                    presentation: 'card'
                }}
            />
            <Stack.Screen
                name="municipio/[id]"
                options={{
                    headerShown: false
                }}
            />

        </Stack>
    );
}