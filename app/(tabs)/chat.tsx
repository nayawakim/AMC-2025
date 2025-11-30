// app/(tabs)/chat.tsx  (camera + chat, sleek UI + PNG icons)

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
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";

const CameraPng = require("../../assets/icons/camera.png");
const SendPng = require("../../assets/icons/send.png");
const FlipPng = require("../../assets/icons/flip.png");

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
  const cameraRef = useRef<CameraView | null>(null);

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

  const [isBotThinking, setIsBotThinking] = useState(false);

  // Use Convex action instead of fetch
  const sendMessageAction = useAction(api.chat.sendMessage);

  async function getBotReply(userText: string): Promise<string> {
    try {
      const response = await sendMessageAction({ message: userText });
      return response.reply;
    } catch (err) {
      console.warn("Erreur IA Convex", err);
      throw err;
    }
  }

  const handleSend = async () => {
    if (!message.trim() || isBotThinking) return;

    const userText = message.trim();
    const userMsg: Message = {
      id: Date.now().toString(),
      from: "user",
      text: userText,
    };

    setMessages((prev) => [...prev, userMsg]);
    setMessage("");

    try {
      setIsBotThinking(true);

      const botText = await getBotReply(userText);

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        from: "bot",
        text: botText,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (e) {
      console.warn("Erreur IA", e);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          from: "bot",
          text:
            "Erreur IA : " +
            (e instanceof Error ? e.message : String(e)),
        },
      ]);
    } finally {
      setIsBotThinking(false);
    }
  };

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

  if (!permission)
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Chargement...</Text>
      </View>
    );

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>
          L&apos;application a besoin d&apos;accéder à la caméra.
        </Text>
        <TouchableOpacity onPress={requestPermission} style={styles.button}>
          <Text style={styles.buttonText}>Autoriser</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.cameraWrapper}>
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing={isFront ? "front" : "back"}
        />
        <View style={styles.cameraOverlay} />
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.iconButtonGhost}
            onPress={() => setIsFront(!isFront)}
          >
            <Image source={FlipPng} style={styles.iconSmall} />
          </TouchableOpacity>
        </View>
      </View>

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

          {isBotThinking && (
            <View style={[styles.bubble, styles.botBubble]}>
              <Text style={[styles.bubbleText, styles.botText]}>
                Analyse en cours...
              </Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.inputRow}>
          <TouchableOpacity
            style={styles.cameraBtn}
            onPress={handleTakePicture}
          >
            <Image source={CameraPng} style={styles.iconSmall} />
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder="Comment puis-je t'aider ?"
            placeholderTextColor="#9ca3af"
            value={message}
            onChangeText={setMessage}
          />

          <TouchableOpacity
            style={styles.sendBtn}
            onPress={handleSend}
            disabled={isBotThinking}
          >
            <Image source={SendPng} style={styles.sendIcon} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#020617" },
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
  cameraWrapper: {
    height: "25%",
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: "black",
    borderRadius: 24,
    overflow: "hidden",
  },
  cameraOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 60,
    backgroundColor: "rgba(15,23,42,0.6)",
  },
  controls: {
    position: "absolute",
    right: 12,
    bottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconButtonGhost: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: "rgba(15,23,42,0.75)",
    borderWidth: 1,
    borderColor: "#4b5563",
    alignItems: "center",
    justifyContent: "center",
  },
  iconSmall: { width: 20, height: 20, resizeMode: "contain" },
  chatContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  messages: { flex: 1 },
  bubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 18,
    marginVertical: 6,
    gap: 6,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#ef4444",
    borderBottomRightRadius: 6,
  },
  botBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#1f2937",
    borderBottomLeftRadius: 6,
  },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  userText: { color: "white", fontWeight: "500" },
  botText: { color: "#e5e7eb" },
  imageMessage: { width: 180, height: 120, borderRadius: 16 },
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
  sendIcon: {
    width: 20,
    height: 20,
    tintColor: "white",
    resizeMode: "contain",
  },
});

