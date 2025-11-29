// app/(tabs)/chat.tsx  (camera + chat)

import { CameraView, useCameraPermissions } from "expo-camera";
import React, { useRef, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type Sender = "user" | "bot";

type Message = {
  id: string;
  from: Sender;
  text?: string;
  imageUri?: string;
};

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isFront, setIsFront] = useState(false);

  // référence vers la caméra pour prendre une photo
  const cameraRef = useRef<CameraView | null>(null);

  // état du chat
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", from: "user", text: "c'est un zombie ??" },
    {
      id: "2",
      from: "bot",
      text:
        "La personne identifiée dans l'image est effectivement un zombie. " +
        "La position de la caméra par rapport au zombie indique que vous êtes à environ 10 mètres de l'infecté. " +
        "Votre localisation indique aussi que la zone sécuritaire la plus accessible est au nord-est. " +
        "Je vous conseille de vous déplacer vers l'arrière à gauche pour y accéder.",
    },
  ]);

  const handleSend = () => {
    if (!message.trim()) return;
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), from: "user", text: message.trim() },
    ]);
    setMessage("");
  };

  // 📷 bouton à côté du send : prend une photo et l'envoie dans le chat
  const handleTakePicture = async () => {
    try {
      if (!cameraRef.current) return;
      const photo = await cameraRef.current.takePictureAsync();

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          from: "user",
          imageUri: photo.uri,
        },
      ]);
    } catch (e) {
      console.warn("Erreur prise de photo", e);
    }
  };

  // Permissions pas encore chargées
  if (!permission)
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Chargement...</Text>
      </View>
    );

  // Caméra non autorisée
  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>
          L'application a besoin d'accéder à la caméra.
        </Text>
        <TouchableOpacity onPress={requestPermission} style={styles.button}>
          <Text style={styles.buttonText}>Autoriser</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Vue principale : caméra + chat
  return (
    <View style={styles.root}>
      {/* Bloc caméra en haut */}
      <View style={styles.cameraWrapper}>
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing={isFront ? "front" : "back"}
        />

        {/* Bouton flip par-dessus la caméra */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.switchBtn}
            onPress={() => setIsFront(!isFront)}
          >
            <Text style={styles.buttonText}>🔄 Flip</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bloc chat en bas */}
      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={80}
      >
        <ScrollView
          style={styles.messages}
          contentContainerStyle={{ paddingVertical: 12 }}
        >
          {messages.map((m) => (
            <View
              key={m.id}
              style={[
                styles.bubble,
                m.from === "user" ? styles.userBubble : styles.botBubble,
              ]}
            >
              {m.imageUri && (
                <Image
                  source={{ uri: m.imageUri }}
                  style={styles.imageMessage}
                />
              )}

              {m.text && (
                <Text
                  style={[
                    styles.bubbleText,
                    m.from === "user" ? styles.userText : styles.botText,
                  ]}
                >
                  {m.text}
                </Text>
              )}
            </View>
          ))}
        </ScrollView>

        {/* Ligne d'input : bouton caméra + input + bouton send */}
        <View style={styles.inputRow}>
          <TouchableOpacity
            style={styles.cameraBtn}
            onPress={handleTakePicture}
          >
            <Text style={styles.cameraIcon}>📷</Text>
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder="Comment puis-je t'aider ?"
            placeholderTextColor="#9ca3af"
            value={message}
            onChangeText={setMessage}
          />
          <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
            <Text style={styles.sendText}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

/* ------- STYLES ------- */
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#020617",
  },

  /* --- états simples --- */
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
  },
  text: { color: "white", marginBottom: 10 },
  button: {
    backgroundColor: "white",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: { color: "black", fontWeight: "bold" },

  /* --- caméra --- */
  cameraWrapper: {
    height: "25%", // ~ comme dans ton Figma
    backgroundColor: "black",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: "hidden",
  },
  controls: {
    position: "absolute",
    bottom: 20,
    width: "100%",
    alignItems: "center",
  },
  switchBtn: {
    backgroundColor: "rgba(255,255,255,0.3)",
    padding: 12,
    borderRadius: 50,
  },

  /* --- chat --- */
  chatContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  messages: {
    flex: 1,
  },
  bubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 16,
    marginVertical: 6,
    gap: 6,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#ef4444",
    borderBottomRightRadius: 4,
  },
  botBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#1f2937",
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 14,
  },
  userText: {
    color: "white",
  },
  botText: {
    color: "#e5e7eb",
  },

  imageMessage: {
    width: 180,
    height: 120,
    borderRadius: 12,
  },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 8,
  },

  cameraBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#374151",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#020617",
  },
  cameraIcon: {
    fontSize: 18,
    color: "#e5e7eb",
  },

  input: {
    flex: 1,
    backgroundColor: "#020617",
    borderColor: "#374151",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: "white",
    fontSize: 14,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: "#ef4444",
    justifyContent: "center",
    alignItems: "center",
  },
  sendText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});
