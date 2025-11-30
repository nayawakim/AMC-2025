// app/(tabs)/chat.tsx

import { api } from "@/convex/_generated/api";
import { useAction } from "convex/react";
import { CameraView, useCameraPermissions } from "expo-camera";
import React, { useRef, useState } from "react";
import {
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// --- Assets ---
const CameraPng = require("../../assets/icons/camera.png");
const SendPng = require("../../assets/icons/send.png");
const BgImg = require("../../assets/icons/greytechbackground.jpg");

type Sender = "user" | "bot";

type Message = {
  id: string;
  from: Sender;
  text?: string;
  imageUri?: string;
};

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
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

  // état pour la caméra plein écran
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  // état IA
  const [isBotThinking, setIsBotThinking] = useState(false);

  // Convex action pour appeler l’IA
  const sendMessageAction = useAction(api.chat.sendMessage);

  async function getBotReply(userText: string): Promise<string> {
    const response = await sendMessageAction({ message: userText });
    return response.reply;
  }

  const handleSendText = async () => {
    if (!message.trim() || isBotThinking) return;

    const userText = message.trim();

    const userMsg: Message = {
      id: Date.now().toString(),
      from: "user",
      text: userText,
    };

    // ajoute le message user
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

  const openCamera = () => {
    setPreviewUri(null);
    setIsCameraOpen(true);
  };

  const handleCapture = async () => {
    try {
      if (!cameraRef.current) return;
      const photo = await cameraRef.current.takePictureAsync();
      setPreviewUri(photo.uri);
    } catch (e) {
      console.warn("Erreur prise de photo", e);
    }
  };

  const handleSendPreview = () => {
    if (!previewUri) return;
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        from: "user",
        imageUri: previewUri,
      },
    ]);
    setPreviewUri(null);
    setIsCameraOpen(false);
  };

  const handleCloseCamera = () => {
    setPreviewUri(null);
    setIsCameraOpen(false);
  };

  // --- Permission states ---

  if (!permission) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Chargement...</Text>
      </View>
    );
  }

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

  // --- Main UI ---

  return (
    <ImageBackground source={BgImg} style={styles.bg} resizeMode="cover">
      <SafeAreaView style={styles.safe}>
        {/* CHAT CARD ONLY */}
        <KeyboardAvoidingView
          style={styles.chatWrapper}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={80}
        >
          <View style={styles.chatCard}>
            <ScrollView
              style={styles.messages}
              contentContainerStyle={{ paddingVertical: 16 }}
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

            {/* Input row */}
            <View style={styles.inputRow}>
              <TouchableOpacity style={styles.cameraBtn} onPress={openCamera}>
                <Image source={CameraPng} style={styles.iconSmall} />
              </TouchableOpacity>

              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Comment puis-je t'aider ?"
                  placeholderTextColor="#9ca3af"
                  value={message}
                  onChangeText={setMessage}
                />
              </View>

              <TouchableOpacity
                style={styles.sendBtn}
                onPress={handleSendText}
                disabled={isBotThinking}
              >
                <Image source={SendPng} style={styles.sendIcon} />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* MODAL CAMÉRA PLEIN ÉCRAN */}
      <Modal
        visible={isCameraOpen}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <View style={styles.modalContainer}>
          {previewUri ? (
            <>
              <Image source={{ uri: previewUri }} style={styles.previewImage} />
              <View style={styles.modalButtonsRow}>
                <TouchableOpacity
                  style={styles.modalSecondaryButton}
                  onPress={() => setPreviewUri(null)}
                >
                  <Text style={styles.modalSecondaryText}>Retake</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalPrimaryButton}
                  onPress={handleSendPreview}
                >
                  <Text style={styles.modalPrimaryText}>Send</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.modalCloseAbsolute}
                onPress={handleCloseCamera}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <CameraView
                ref={cameraRef}
                style={styles.cameraFull}
                facing="back"
              />
              <TouchableOpacity
                style={styles.modalCloseAbsolute}
                onPress={handleCloseCamera}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
              <View style={styles.modalBottomBar}>
                <TouchableOpacity
                  style={styles.shutterOuter}
                  onPress={handleCapture}
                >
                  <View style={styles.shutterInner} />
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </Modal>
    </ImageBackground>
  );
}

/* ------- STYLES ------- */
const styles = StyleSheet.create({
  // background image container
  bg: {
    flex: 1,
    backgroundColor: "#0e0e10", // fallback behind the image
  },
  safe: {
    flex: 1,
    paddingTop: 6,
  },

  // generic loading / permission states
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0e0e10",
    paddingHorizontal: 24,
  },
  text: {
    color: "white",
    fontSize: 15,
    textAlign: "center",
    marginBottom: 16,
  },
  button: {
    backgroundColor: "white",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
  },
  buttonText: {
    color: "#0e0e10",
    fontWeight: "600",
    fontSize: 14,
  },

  // chat container
  chatWrapper: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },

  chatCard: {
    flex: 1,
    borderRadius: 30,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 14,

    // opacité du glass : change 0.80 pour plus / moins opaque
    backgroundColor: "rgba(15, 15, 20, 0.80)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",

    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
  },

  messages: {
    flex: 1,
  },

  // chat bubbles
  bubble: {
    maxWidth: "80%",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 22,
    marginVertical: 6,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#786a6a",
    borderBottomRightRadius: 10,
  },
  botBubble: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    borderBottomLeftRadius: 10,
  },

  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userText: {
    color: "white",
  },
  botText: {
    color: "#e5e7eb",
  },

  imageMessage: {
    width: 190,
    height: 130,
    borderRadius: 14,
  },

  // input bar
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 10,
    gap: 10,
  },
  cameraBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  inputWrapper: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 8,
    color: "white",
    fontSize: 14,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: "#961e1e",
    justifyContent: "center",
    alignItems: "center",
    opacity: 1,
  },
  sendIcon: {
    width: 20,
    height: 20,
    tintColor: "white",
    resizeMode: "contain",
  },

  iconSmall: {
    width: 20,
    height: 20,
    tintColor: "white",
    resizeMode: "contain",
  },

  /* --- Modal caméra --- */
  modalContainer: {
    flex: 1,
    backgroundColor: "black",
  },
  cameraFull: {
    flex: 1,
  },
  modalBottomBar: {
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  shutterOuter: {
    width: 72,
    height: 72,
    borderRadius: 999,
    borderWidth: 4,
    borderColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },
  shutterInner: {
    width: 52,
    height: 52,
    borderRadius: 999,
    backgroundColor: "white",
  },
  modalCloseAbsolute: {
    position: "absolute",
    top: 50,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  modalCloseText: {
    color: "white",
    fontSize: 16,
  },
  previewImage: {
    flex: 1,
    resizeMode: "cover",
  },
  modalButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: "rgba(0,0,0,0.8)",
  },
  modalSecondaryButton: {
    flex: 1,
    marginRight: 8,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
    alignItems: "center",
  },
  modalSecondaryText: {
    color: "white",
    fontSize: 14,
  },
  modalPrimaryButton: {
    flex: 1,
    marginLeft: 8,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: "#ef4444",
    alignItems: "center",
  },
  modalPrimaryText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
});
