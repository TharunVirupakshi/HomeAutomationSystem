import { COLORS } from "@/constants";
import { Stack } from "expo-router";
import React, {useState, useEffect, useCallback} from "react";
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from '../hooks/useFonts'; 
import { DefaultTheme, NavigationContainer } from "@react-navigation/native";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {

  const [isReady, setIsReady] = useState(false);
  const fontsLoaded = useFonts();

  useEffect(()=>{
    const checkFonts = async() => {
      if (fontsLoaded) {
        setIsReady(true);
      }else{
        setIsReady(false);
      }
      setTimeout(()=> SplashScreen.hide(), 2000);
    }

    checkFonts();
  }, [fontsLoaded])
  

  const navTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: 'transparent',
    },
  };

  return <Stack
    
    screenOptions={{
      headerShown: false,
      headerStyle: {
        backgroundColor: COLORS.background
      }, 
      headerTitleStyle: {
        fontWeight: 'bold',
        color: COLORS.text
      },
      headerTintColor: COLORS.primary,
      presentation: 'transparentModal'
    }}>
      
      <Stack.Screen name='(tabs)' options={{
        headerStyle: {
          backgroundColor: COLORS.background
        }
      }}/>
      
      </Stack>;
}
