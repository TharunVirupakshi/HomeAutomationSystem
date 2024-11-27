
import React from "react";
import { useCallback, useEffect, useState } from 'react';
import { Button, Pressable, Text, View, StyleSheet, Animated, Image, TouchableOpacity} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SplashScreen from 'expo-splash-screen';
import {COLORS, FONTS} from '../constants';
import { PressableBtn, PressableWithOpacity } from "@/components";
import { Stack } from "expo-router";
import AntDesign from '@expo/vector-icons/AntDesign';
import Entypo from '@expo/vector-icons/Entypo';



const header = () => {
  return (
    <View style={styles.customHeader}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          // borderStyle: "solid",
          // borderWidth: 0.5,
          // borderColor: "white",
          
        }}
      >
        <Image
          source={require("../assets/images/app-adaptive-icon-white.png")} // Replace with your logo path
          style={styles.logo}
        />
        <View style={{
          height: '100%',
          width: 0.5,
          backgroundColor: "grey",
          marginHorizontal: 15
        }}/>
        <PressableWithOpacity>
          <View style={{flexDirection: "row", alignItems: "center"}}>
            <Text style={{
              includeFontPadding: false,
              fontSize: FONTS.size.large,
              fontFamily: FONTS.medium,
              color: COLORS.text,
              marginRight: 5
            }}>My Home</Text>
          <Entypo name="chevron-small-down" size={15} color="white" />
        </View>
      </PressableWithOpacity>
      </View>
    </View>
  );
};


export default function Index() {



  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: COLORS.background,
        paddingHorizontal: 15,
        paddingTop: 10
      }}
    >
   
      <Stack.Screen 
        options={{
          headerShown: true,
          headerTitle: header,
          headerShadowVisible: false
        }}
      />
     
        <View style={{backgroundColor: COLORS.card, borderRadius: 10, padding: 15}}>
          <Text style={{color: COLORS.text, fontSize: FONTS.size.extraLarge, fontFamily: FONTS.medium}}>Hi, Paul</Text>
          <Text style={{color: COLORS.textLight, fontSize: FONTS.size.small, fontFamily: FONTS.regular}}>Let's get started</Text>
          <PressableBtn customStyles={{
            button:{
              marginTop: 5,
              
            },
            text: {
              fontFamily: FONTS.medium,
              includeFontPadding: false
            }
          }} btnText={"Get started"}/>
        </View>
     
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  customHeader: {
    flexDirection: "row",
    backgroundColor: COLORS.background,
    // backgroundColor: "grey",
    width: "100%",
    paddingVertical: 15
  },
  headerText: {
    fontSize: FONTS.size.large,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    // textAlign: "center",
  },
  headerBottomBorder: {
    width: "100%",
    height: 2,
    backgroundColor: "white",
    // marginTop: 10,
  },
  logo: {
    width: 30,
    height: 30,
    objectFit: "contain"
  },
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