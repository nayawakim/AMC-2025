// app/(tabs)/scan.tsx
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { CameraView, useCameraPermissions } from "expo-camera";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface ScannedUser {
    id: string;
    infected: boolean;
}

export default function ScanScreen() {
    const [permission, requestPermission] = useCameraPermissions();
    const [isScanning, setIsScanning] = useState(true);
    const [scannedUser, setScannedUser] = useState<ScannedUser | null>(null);
    const [scanError, setScanError] = useState<string | null>(null);

    const markUserAsInfected = useMutation(api.users.markUserAsInfected);

    // état "chargement"
    if (!permission) {
        return (
            <View style={styles.center}>
                <Text style={styles.text}>Chargement des permissions...</Text>
            </View>
        );
    }

    // pas encore autorisé
    if (!permission.granted) {
        return (
            <View style={styles.center}>
                <Text style={styles.text}>
                    L'application a besoin de la caméra pour scanner les QR
                    codes.
                </Text>
                <TouchableOpacity
                    style={styles.button}
                    onPress={requestPermission}
                >
                    <Text style={styles.buttonText}>Autoriser la caméra</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // callback quand un QR est scanné
    const handleBarcodeScanned = async (result: any) => {
        if (!isScanning) return;

        setIsScanning(false);
        setScanError(null);

        try {
            const qrData = JSON.parse(result?.data);

            // Vérifier le format du QR code
            if (!qrData.id || typeof qrData.infected !== "boolean") {
                setScanError(
                    'Format QR invalide! Attendu: { "id": string, "infected": boolean }'
                );
                return;
            }

            // Sauvegarder les données scannées
            setScannedUser({
                id: qrData.id,
                infected: qrData.infected,
            });

            // Si la personne est infectée, la marquer dans Convex
            if (qrData.infected) {
                try {
                    await markUserAsInfected({ userId: qrData.id });
                    console.log(
                        `Utilisateur ${qrData.id} marqué comme infecté`
                    );
                } catch (err) {
                    console.error(
                        "Erreur lors du marquage de l'utilisateur comme infecté:",
                        err
                    );
                }
            }
        } catch {
            setScanError(
                "QR code invalide! Le contenu doit être un JSON valide."
            );
        }
    };

    const handleRescan = () => {
        setScannedUser(null);
        setScanError(null);
        setIsScanning(true);
    };

    // Couleur du cadre en fonction de l'infection
    const scanAreaBorderColor = scannedUser
        ? scannedUser.infected
            ? "#ef4444"
            : "#22c55e"
        : "#ef4444";

    return (
        <View style={styles.root}>
            {/* Zone caméra */}
            <View style={styles.cameraWrapper}>
                <CameraView
                    style={StyleSheet.absoluteFill}
                    onBarcodeScanned={
                        isScanning ? handleBarcodeScanned : undefined
                    }
                    barcodeScannerSettings={{
                        barcodeTypes: ["qr"],
                    }}
                />

                {/* Overlay sombre + cadre de visée */}
                <View style={styles.overlay}>
                    <View
                        style={[
                            styles.scanArea,
                            { borderColor: scanAreaBorderColor },
                        ]}
                    />
                    <Text style={styles.scanText}>
                        {isScanning
                            ? "Place le code QR dans le carré"
                            : scannedUser
                              ? scannedUser.infected
                                  ? "⚠️ PERSONNE INFECTÉE"
                                  : "✓ Personne saine"
                              : "Erreur de scan"}
                    </Text>
                </View>
            </View>

            {/* Résultat */}
            <View style={styles.resultContainer}>
                {scanError && (
                    <View style={styles.errorCard}>
                        <Text style={styles.errorTitle}>❌ Erreur</Text>
                        <Text style={styles.errorText}>{scanError}</Text>
                        <TouchableOpacity
                            style={styles.rescanButton}
                            onPress={handleRescan}
                        >
                            <Text style={styles.rescanText}>Réessayer</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {scannedUser && !scanError && (
                    <>
                        {scannedUser.infected ? (
                            // Carte rouge pour personne infectée
                            <View style={styles.infectedCard}>
                                <View style={styles.infectedHeader}>
                                    <Text style={styles.infectedIcon}>🦠</Text>
                                    <Text style={styles.infectedTitle}>
                                        INFECTÉ
                                    </Text>
                                </View>
                                <Text style={styles.infectedDescription}>
                                    Éloignez-vous immédiatement de cette
                                    personne !
                                </Text>
                                {/* <View style={styles.userIdContainer}>
                                    <Text style={styles.userIdLabel}>
                                        ID Utilisateur:
                                    </Text>
                                    <Text style={styles.userIdText}>
                                        {scannedUser.id}
                                    </Text>
                                </View> */}
                            </View>
                        ) : (
                            // Carte verte pour personne saine
                            <View style={styles.safeCard}>
                                <View style={styles.safeHeader}>
                                    <Text style={styles.safeIcon}>✓</Text>
                                    <Text style={styles.safeTitle}>SAIN</Text>
                                </View>
                                <Text style={styles.safeDescription}>
                                    Cette personne n'est pas infectée. Vous
                                    pouvez interagir en toute sécurité.
                                </Text>
                                {/* <View style={styles.userIdContainer}>
                                    <Text style={styles.userIdLabel}>
                                        ID Utilisateur:
                                    </Text>
                                    <Text style={styles.userIdText}>{scannedUser.id}</Text>
                                </View> */}
                            </View>
                        )}

                        <TouchableOpacity
                            style={styles.rescanButton}
                            onPress={handleRescan}
                        >
                            <Text style={styles.rescanText}>
                                Scanner un autre code
                            </Text>
                        </TouchableOpacity>
                    </>
                )}

                {!scannedUser && !scanError && (
                    <View style={styles.waitingCard}>
                        <Text style={styles.waitingText}>
                            En attente d'un scan...
                        </Text>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: "#020617",
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 24,
    },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#020617",
        padding: 24,
    },
    text: {
        color: "#e5e7eb",
        textAlign: "center",
        marginBottom: 12,
    },
    button: {
        backgroundColor: "#ef4444",
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 999,
    },
    buttonText: {
        color: "white",
        fontWeight: "600",
    },

    cameraWrapper: {
        height: "55%",
        borderRadius: 24,
        overflow: "hidden",
        backgroundColor: "black",
    },
    overlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    scanArea: {
        width: 220,
        height: 220,
        borderRadius: 24,
        borderWidth: 4,
        backgroundColor: "transparent",
    },
    scanText: {
        marginTop: 16,
        color: "#e5e7eb",
        fontSize: 15,
        fontWeight: "600",
    },

    resultContainer: {
        flex: 1,
        marginTop: 16,
    },

    // Carte d'attente
    waitingCard: {
        padding: 24,
        borderRadius: 20,
        backgroundColor: "#0b1120",
        borderWidth: 1,
        borderColor: "#1f2937",
        alignItems: "center",
        justifyContent: "center",
    },
    waitingText: {
        color: "#9ca3af",
        fontSize: 15,
        fontStyle: "italic",
    },

    // Carte d'erreur
    errorCard: {
        padding: 20,
        borderRadius: 20,
        backgroundColor: "#450a0a",
        borderWidth: 2,
        borderColor: "#ef4444",
    },
    errorTitle: {
        color: "#fecaca",
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 8,
    },
    errorText: {
        color: "#fca5a5",
        fontSize: 14,
        lineHeight: 20,
    },

    // Carte infectée (rouge)
    infectedCard: {
        padding: 20,
        borderRadius: 20,
        backgroundColor: "#7f1d1d",
        borderWidth: 3,
        borderColor: "#ef4444",
    },
    infectedHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    infectedIcon: {
        fontSize: 28,
        marginRight: 10,
    },
    infectedTitle: {
        color: "#fecaca",
        fontSize: 24,
        fontWeight: "800",
        letterSpacing: 1,
    },
    infectedDescription: {
        color: "#fca5a5",
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 16,
        fontWeight: "500",
    },

    // Carte saine (verte)
    safeCard: {
        padding: 20,
        borderRadius: 20,
        backgroundColor: "#14532d",
        borderWidth: 3,
        borderColor: "#22c55e",
    },
    safeHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    safeIcon: {
        fontSize: 28,
        marginRight: 10,
        color: "#86efac",
    },
    safeTitle: {
        color: "#bbf7d0",
        fontSize: 24,
        fontWeight: "800",
        letterSpacing: 1,
    },
    safeDescription: {
        color: "#86efac",
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 16,
        fontWeight: "500",
    },

    // Container ID utilisateur
    userIdContainer: {
        backgroundColor: "rgba(0, 0, 0, 0.3)",
        padding: 12,
        borderRadius: 10,
    },
    userIdLabel: {
        color: "#d1d5db",
        fontSize: 12,
        marginBottom: 4,
    },
    userIdText: {
        color: "#ffffff",
        fontSize: 14,
        fontWeight: "600",
        fontFamily: "monospace",
    },

    rescanButton: {
        marginTop: 16,
        alignSelf: "center",
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 999,
        backgroundColor: "#ef4444",
    },
    rescanText: {
        color: "white",
        fontWeight: "600",
        fontSize: 15,
    },
});
