import { HapticTab } from '@/components/common/HapticTab';
import { COLORS } from '@/constants';
import Entypo from '@expo/vector-icons/Entypo';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View } from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { PressableWithOpacity } from '@/components';

export default function TabLayout() {
  

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.text,
        tabBarInactiveTintColor: COLORS.textLight,
        tabBarActiveBackgroundColor: "white",
        tabBarInactiveBackgroundColor: COLORS.textLight,
        headerShown: false,
        tabBarBackground: () => (
            <View
              style={{
                flex: 1,
                backgroundColor: COLORS.background,
              }}
            />
          ),
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
            backgroundColor: 'transparent', // Ensure background transparency for iOS
            borderTopWidth: 0
          },
          default: {
            backgroundColor: COLORS.background, // Fallback for Android and other platforms
            borderTopWidth: 0
            // position: 'absolute'
          },
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Entypo name="home" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="routines"
        options={{
          title: 'Routines',
          tabBarIcon: ({ color }) => <FontAwesome6 name="play-circle" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <FontAwesome6 name="gear" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
