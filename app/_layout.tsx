import { Stack } from "expo-router";
import React, { useMemo, useState } from "react";
import { SafeAreaView, StyleSheet, View } from "react-native";
import { ThemeContext } from "./theme-context";

export default function RootLayout() {
  const [theme, setTheme] = useState("light");
  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));
  const value = useMemo(() => ({ theme, toggleTheme }), [theme]);
  
  return (
    <ThemeContext.Provider value={value}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme === "dark" ? "#181a20" : "#fff" }]}>
        <View style={styles.content}>
          <Stack screenOptions={{ headerShown: false }} />
        </View>
      </SafeAreaView>
    </ThemeContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingBottom: 20, // Add some space from the bottom
  },
});
