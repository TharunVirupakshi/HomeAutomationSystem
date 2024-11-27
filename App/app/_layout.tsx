import { COLORS } from "@/constants";
import { Stack } from "expo-router";
import React, {useState, useEffect, useCallback} from "react";
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from '../hooks/useFonts'; 

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
      setTimeout(()=> SplashScreen.hide(), 1000);
    }

    checkFonts();
  }, [fontsLoaded])
  

 

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
      headerTintColor: COLORS.primary
    }}/>;
}
