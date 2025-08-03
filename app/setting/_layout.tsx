import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React, { useContext } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ThemeContext } from "../theme-context";

export default function SettingLayout() {
  const { theme } = useContext(ThemeContext);
  const router = useRouter();
  const themedStyles = theme === "dark" ? darkStyles : styles;

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: theme === "dark" ? "#181a20" : "#fff",
        },
        headerTintColor: theme === "dark" ? "#fff" : "#000",
        headerTitleStyle: {
          fontWeight: "bold",
        },
        headerShadowVisible: false,
        headerLeft: () => (
          <TouchableOpacity
            style={themedStyles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons 
              name="arrow-back" 
              size={24} 
              color={theme === "dark" ? "#fff" : "#000"} 
            />
          </TouchableOpacity>
        ),
        headerTitle: () => (
          <View style={themedStyles.headerTitleContainer}>
            <Ionicons 
              name="settings-outline" 
              size={24} 
              color={theme === "dark" ? "#fff" : "#000"} 
            />
            <Text style={themedStyles.headerTitle}>Settings</Text>
          </View>
        ),
        headerRight: () => (
          <View style={themedStyles.headerRight}>
            <TouchableOpacity 
              style={themedStyles.headerButton}
              onPress={() => {
                // Show help or navigate to help screen
                console.log("Help pressed");
              }}
            >
              <Ionicons 
                name="help-circle-outline" 
                size={24} 
                color={theme === "dark" ? "#fff" : "#000"} 
              />
            </TouchableOpacity>
          </View>
        ),
      }}
    >
      <Stack.Screen
        name="setting"
        options={{
          headerShown: true,
        }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  backButton: {
    padding: 8,
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: "transparent",
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 8,
    color: "#2c3e50",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerButton: {
    padding: 8,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: "transparent",
  },
});

const darkStyles = StyleSheet.create({
  ...styles,
  headerTitle: {
    ...styles.headerTitle,
    color: "#fff",
  },
}); 