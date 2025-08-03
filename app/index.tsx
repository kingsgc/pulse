import { useRouter } from "expo-router";
import { useContext, useEffect, useState } from "react";
import { Image, Text, View } from "react-native";
import { ThemeContext } from "./theme-context";

export default function Index() {
  const [activeDot, setActiveDot] = useState(0);
  const router = useRouter();
  const { theme } = useContext(ThemeContext);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveDot((prev) => (prev + 1) % 5);
    }, 300);
    const timeout = setTimeout(() => {
      router.replace("/main/home");
    }, 3000);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [router]);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: theme === "dark" ? "#181a20" : "#fff",
      }}
    >
      <Image
        source={require("../assets/images/icon.png")}
        style={{ width: 100, height: 100, marginBottom: 32 }}
        resizeMode="contain"
      />
      <View style={{ flexDirection: "row", marginBottom: 32 }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <View
            key={i}
            style={{
              width: 16,
              height: 16,
              borderRadius: 8,
              backgroundColor: i === activeDot ? "#27ae60" : "#b7eacb",
              marginHorizontal: 6,
              opacity: 1,
              transform: [{ scale: i === activeDot ? 1.2 : 1 }],
            }}
          />
        ))}
      </View>
      <Text style={{ 
        fontSize: 22, 
        fontWeight: "bold", 
        textAlign: "center",
        color: theme === "dark" ? "#fff" : "#000"
      }}>
        Trade Forex News With Confidence
      </Text>
    </View>
  );
}
