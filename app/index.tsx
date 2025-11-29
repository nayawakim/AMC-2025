import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native";

export default function Index() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
   
    const timer = setTimeout(() => setReady(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (!ready) {
    return (
      <View style={styles.container}>

        {/* 🔥 ton image png */}
        <Image 
          source={require("../assets/images/icon.png")}
          style={{ width: 200, height: 200, marginBottom: 20 }}
          resizeMode="contain"
        />

        <Text style={styles.subtitle}>Chargement de la carte...</Text>
        <ActivityIndicator size="large" color="#ff3333" style={{ marginTop: 20 }} />
      </View>
    );
  }

  return <Redirect href="(tabs)/map" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  subtitle: {
    color: "#bbb",
    marginTop: 8,
  },
});
