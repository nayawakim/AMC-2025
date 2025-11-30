// app/(tabs)/chat.tsx

import { api } from "@/convex/_generated/api";
import { useAction } from "convex/react";
import React, { useState } from "react";
import {
  Image,
  ImageBackground,
  KeyboardAvoidingView,
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
const SendPng = require("../../assets/icons/send.png");
const BgImg = require("../../assets/icons/greytechbackground.jpg");

type Sender = "user" | "bot";

type Message = {
  id: string;
  from: Sender;
  text?: string;
  imageUri?: string;
};

export default function ChatScreen() {
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

  return (
    <ImageBackground source={BgImg} style={styles.bg} resizeMode="cover">
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={styles.chatWrapper}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={80}
        >
          <View style={styles.chatCard}>
            <ScrollView
              style={styles.messages}
              contentContainerStyle={{
                paddingVertical: 16,
                paddingHorizontal: 4,
              }}
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
                <View
                  style={[
                    styles.bubble,
                    styles.botBubble,
                    styles.thinkingBubble,
                  ]}
                >
                  <Text style={[styles.bubbleText, styles.botText]}>
                    Analyse en cours…
                  </Text>
                </View>
              )}
            </ScrollView>

            {/* Input row */}
            <View style={styles.inputRow}>
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
                style={[
                  styles.sendBtn,
                  isBotThinking && styles.sendBtnDisabled,
                ]}
                onPress={handleSendText}
                disabled={isBotThinking}
              >
                <Image source={SendPng} style={styles.sendIcon} />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
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

  // chat container
  chatWrapper: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },

  chatCard: {
    flex: 1,
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,

    backgroundColor: "rgba(9, 9, 12, 0.78)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",

    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
  },

  messages: {
    flex: 1,
  },

  // chat bubbles (more minimal / less cute)
  bubble: {
    maxWidth: "88%",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginVertical: 4,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#b91c1c", // deep red
    borderRadius: 14,
    borderBottomRightRadius: 6,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  botBubble: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(15,23,42,0.96)", // dark slate
    borderRadius: 14,
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.45)",
  },
  thinkingBubble: {
    opacity: 0.8,
  },

  bubbleText: {
    fontSize: 13,
    lineHeight: 19,
  },
  userText: {
    color: "white",
    fontWeight: "500",
  },
  botText: {
    color: "#e5e7eb",
  },

  imageMessage: {
    width: 190,
    height: 130,
    borderRadius: 12,
  },

  // input bar
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 10,
    gap: 10,
  },
  inputWrapper: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.4)",
    backgroundColor: "rgba(15,23,42,0.92)",
    paddingHorizontal: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 8,
    color: "white",
    fontSize: 14,
  },
  sendBtn: {
    width: 50,
    height: 50,
    borderRadius: 999,
    backgroundColor: "#a01111ff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#ffffff",
    shadowOpacity: 0.0,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  sendBtnDisabled: {
    opacity: 0.45,
  },
  sendIcon: {
    width: 20,
    height: 20,
    tintColor: "white",
    resizeMode: "contain",
  },
});
