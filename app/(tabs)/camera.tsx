import { View, Text, StyleSheet } from "react-native";

export default function CameraScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>📷 Camera Page</Text>
        <Text style={styles.subtitle}>Cette page est un placeholder temporaire.</Text>
        <Text style={styles.helper}>
          ➤ Si tu vois ceci dans Expo → TON ROUTING FONCTIONNE 🎉
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: "#1c1c1c",
    padding: 25,
    borderRadius: 16,
    width: "85%",
    borderWidth: 1,
    borderColor: "#333",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    color: "#bbb",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 18,
  },
  helper: {
    color: "#ff4444",
    textAlign: "center",
    fontWeight: "500",
    marginTop: 10,
  }
});
