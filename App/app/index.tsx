
import React from "react";
import { useCallback, useEffect, useState } from 'react';
import { Button, Pressable, Text, View, StyleSheet, Animated } from "react-native";
import * as SplashScreen from 'expo-splash-screen';
import {COLORS, FONTS} from '../constants';
import { PressableBtn } from "@/components";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();


export default function Index() {

  const animated = new Animated.Value(1);

  const fadeIn = () => {
    Animated.timing(animated, {
      toValue: 0.4,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };
  const fadeOut = () => {
    Animated.timing(animated, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  setTimeout(()=> SplashScreen.hide(), 3000);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: COLORS.background
      }}
    >
      <Text style={{color: COLORS.text, fontSize: FONTS.size.medium}}>Edit app/index.tsx to edit this screen.</Text>
      <PressableBtn customStyles={{}}/>
    </View>
  );
}


const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 4,
    elevation: 3,
    backgroundColor: COLORS.secondary,
  },
  text: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: 'bold',
    letterSpacing: 0.25,
    color: 'white',
  },
});