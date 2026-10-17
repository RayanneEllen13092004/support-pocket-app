import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TabLayout() {
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
            <Tabs screenOptions={{
                tabBarActiveTintColor: '#2563eb',
                tabBarInactiveTintColor: '#9ca3af',
                headerShown: false,
                tabBarStyle: {
                    paddingBottom: 5,
                    paddingTop: 5,
                    height: 60
                }
            }}>
                <Tabs.Screen
                    name="dashboard"
                    options={{
                        title: 'Home',
                        tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={24} color={color} />,
                    }}
                />
                <Tabs.Screen
                    name="municipios"
                    options={{
                        title: 'Municípios',
                        tabBarIcon: ({ color }) => <Ionicons name="map-outline" size={24} color={color} />,
                    }}
                />
                <Tabs.Screen
                    name="snippets"
                    options={{
                        title: 'Snippets',
                        tabBarIcon: ({ color }) => <Ionicons name="code-slash-outline" size={24} color={color} />,
                    }}
                />
                <Tabs.Screen
                    name="kanban"
                    options={{
                        title: 'Kanban',
                        tabBarIcon: ({ color }) => <Ionicons name="albums-outline" size={24} color={color} />,
                    }}
                />
                <Tabs.Screen
                    name="registro"
                    options={{
                        title: 'Registro',
                        tabBarIcon: ({ color }) => <Ionicons name="add-circle-outline" size={24} color={color} />,
                    }}
                />
            </Tabs>
        </SafeAreaView>
    );
}