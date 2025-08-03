import { Ionicons } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";
import { useContext } from "react";
import { Text, TouchableOpacity } from "react-native";
import { ThemeContext } from "../theme-context";

function HeaderRight() {
  const router = useRouter();
  const { theme } = useContext(ThemeContext);
  
  return (
    <TouchableOpacity
      style={{ marginRight: 16 }}
      onPress={() => router.push("/setting/setting")}
    >
      <Ionicons 
        name="settings-sharp" 
        size={24} 
        color={theme === "dark" ? "#fff" : "#000"} 
      />
    </TouchableOpacity>
  );
}

export default function MainLayout() {
  const { theme } = useContext(ThemeContext);
  
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#007AFF",
        headerShown: true,
        headerTitle: () => (
          <Text style={{ 
            fontWeight: "bold", 
            fontSize: 18,
            color: theme === "dark" ? "#fff" : "#000"
          }}>
            FX Pulse
          </Text>
        ),
        headerRight: () => <HeaderRight />,
        headerStyle: {
          backgroundColor: theme === "dark" ? "#23262f" : "#fff",
        },
        tabBarStyle: {
          height: 80,
          paddingBottom: 24,
          paddingTop: 8,
          borderTopWidth: 0.5,
          borderTopColor: theme === "dark" ? "#333" : "#ddd",
          backgroundColor: theme === "dark" ? "#23262f" : "#fff",
        },
        tabBarLabelStyle: {
          fontSize: 16,
          marginBottom: 6,
        },
        tabBarIconStyle: {
          marginTop: 6,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
