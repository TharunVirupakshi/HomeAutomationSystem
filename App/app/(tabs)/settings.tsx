import React from "react";
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { COLORS, FONTS } from "../../constants";

export default function Settings() {
  const router = useRouter();

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: COLORS.background,
        paddingHorizontal: 15,
        paddingTop: 10,
      }}
    >
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Settings",
          headerTitleStyle: {
            color: COLORS.text,
          },
          headerStyle: {
            backgroundColor: COLORS.background,
          },
        }}
      />

      <View style={styles.optionContainer}>
        <TouchableOpacity
          style={styles.option}
          // onPress={() => router.push("/manage-devices")}
        > 
          <Text style={styles.optionText}>Manage Devices</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.option}
          // onPress={() => router.push("/manage-devices")}
        > 
          <Text style={styles.optionText}>Manage Master Server</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  optionContainer: {
    // marginTop: 20,
  },
  option: {
    paddingVertical: 10,
    includeFontPadding: false,
    // paddingHorizontal: 20,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    // marginBottom: 15,
  },
  optionText: {
    fontSize: FONTS.size.medium,
    fontFamily: FONTS.medium,
    color: COLORS.text,
  },
});
