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
const LogoSK = require("../../assets/icons/logoSK.png");

type Sender = "user" | "bot";

type Message = {
    id: string;
    from: Sender;
    text?: string;
    imageUri?: string;
};

export default function ChatScreen() {
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);

    const [isBotThinking, setIsBotThinking] = useState(false);

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
                            {messages.map((m) =>
                                m.from === "bot" ? (
                                    <View key={m.id} style={styles.botRow}>
                                        <View style={styles.botBar} />
                                        <View
                                            style={[
                                                styles.bubble,
                                                styles.botBubble,
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
                                                        styles.botText,
                                                    ]}
                                                >
                                                    {m.text}
                                                </Text>
                                            )}
                                        </View>
                                    </View>
                                ) : (
                                    <View
                                        key={m.id}
                                        style={[
                                            styles.bubble,
                                            styles.userBubble,
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
                                                    styles.userText,
                                                ]}
                                            >
                                                {m.text}
                                            </Text>
                                        )}
                                    </View>
                                )
                            )}

                            {isBotThinking && (
                                <View style={styles.botRow}>
                                    <View style={styles.botBar} />
                                    <View
                                        style={[
                                            styles.bubble,
                                            styles.botBubble,
                                            styles.thinkingBubble,
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.bubbleText,
                                                styles.botText,
                                            ]}
                                        >
                                            Analyse en cours…
                                        </Text>
                                    </View>
                                </View>
                            )}
                        </ScrollView>

                        {/* Input row */}
                        <View style={styles.inputRow}>
                            <View style={styles.inputWrapper}>
                                <Image
                                    source={LogoSK}
                                    style={styles.inputLogo}
                                />

                                <TextInput
                                    style={styles.input}
                                    placeholder="Comment puis-je vous aider ?"
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
                                <Image
                                    source={SendPng}
                                    style={styles.sendIcon}
                                />
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
    bg: {
        flex: 1,
        backgroundColor: "#0e0e10",
    },
    safe: {
        flex: 1,
        paddingTop: 6,
    },

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

    bubble: {
        maxWidth: "88%",
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 12,
        marginVertical: 4,
    },
    userBubble: {
        alignSelf: "flex-end",
        backgroundColor: "#D7263D",
        borderRadius: 14,
        borderBottomRightRadius: 6,
        borderWidth: 1,
        marginVertical: 6,
        borderColor: "#fecaca",
    },
    botBubble: {
        alignSelf: "flex-start",
        backgroundColor: "rgba(15,23,42,0.96)",
        borderRadius: 14,
        borderBottomLeftRadius: 6,
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.45)",
    },

    botRow: {
        flexDirection: "row",
        alignItems: "stretch",
        gap: 6,
    },
    botBar: {
        width: 3,
        backgroundColor: "#D7263D",
        borderRadius: 20,
        marginTop: 6,
        marginBottom: 6,
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

    inputRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingTop: 10,
        gap: 10,
    },
    inputWrapper: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 999,
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.4)",
        backgroundColor: "rgba(15,23,42,0.92)",
        paddingHorizontal: 12,
    },

    inputLogo: {
        width: 30,
        height: 30,
        marginRight: 8,
        tintColor: "#D7263D", // enlève si tu veux garder les vraies couleurs
        resizeMode: "contain",
    },

    input: {
        flex: 1,
        paddingVertical: 8,
        color: "white",
        fontSize: 14,
        height: 50,
    },

    sendBtn: {
        width: 50,
        height: 50,
        borderRadius: 999,
        backgroundColor: "#D7263D",
        justifyContent: "center",
        alignItems: "center",
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
