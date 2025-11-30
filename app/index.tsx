import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { addUser, deleteUser, getUserId, initDatabase } from "@/lib/database";

export default function OnboardingScreen() {
  const router = useRouter();

  const [permission, requestPermission] = useCameraPermissions();
  const [isCheckingId, setIsCheckingId] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);

  // Au démarrage : initialiser la DB et charger l'ID s'il existe
  useEffect(() => {
    initDatabase();
    const userId = getUserId();
    if (userId) {
      setCurrentId(userId);
    }
    setIsCheckingId(false);
  }, []);

  const handleAskPermissionAndScan = async () => {
    if (!permission) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert(
          "Permission refusée",
          "La permission caméra est nécessaire pour scanner un QR code."
        );
        return;
      }
    } else if (!permission.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert(
          "Permission refusée",
          "La permission caméra est nécessaire pour scanner un QR code."
        );
        return;
      }
    }

    setIsScanning(true);
    setHasScanned(false);
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (hasScanned) return;
    setHasScanned(true);

    try {
      const qrData = JSON.parse(data);

      if (!qrData.id || typeof qrData.id !== "string") {
        Alert.alert(
          "QR invalide",
          'Le QR doit contenir un objet JSON avec un champ "id", par exemple : { "id": "abc123" }.'
        );
        setIsScanning(false);
        setHasScanned(false);
        return;
      }

      const existingUserId = getUserId();

      // Même ID qu'enregistré → ne pas réenregistrer, aller à la carte
      if (existingUserId === qrData.id) {
        setCurrentId(existingUserId);
        setIsScanning(false);
        router.replace("/(tabs)/map");
        return;
      }

      const result = addUser(qrData.id);

      if (!result.success) {
        Alert.alert(
          "Erreur",
          result.message || "Impossible d'enregistrer l'ID."
        );
        setIsScanning(false);
        setHasScanned(false);
        return;
      }

      setCurrentId(qrData.id);
      setIsScanning(false);
      router.replace("/(tabs)/map");
    } catch {
      Alert.alert(
        "QR invalide",
        "Le contenu du QR doit être un JSON valide contenant un champ 'id'."
      );
      setIsScanning(false);
      setHasScanned(false);
    }
  };

  const handleDeleteId = () => {
    if (!currentId) return;

    const result = deleteUser();

    if (!result.success) {
      Alert.alert(
        "Erreur",
        result.message || "Impossible de supprimer l'ID."
      );
      return;
    }

    setCurrentId(null);
  };

  const handleGoToMap = () => {
    if (!currentId) return;
    router.replace("/(tabs)/map");
  };

  // Pendant la vérification initiale
  if (isCheckingId) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Préparation de l'application...</Text>
      </SafeAreaView>
    );
  }

  // Mode scanner plein écran
  if (isScanning) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#020617" }}>
        <View style={{ flex: 1 }}>
          <View style={scanStyles.cameraWrapper}>
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              onBarcodeScanned={hasScanned ? undefined : handleBarCodeScanned}
              barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            />

            <View style={scanStyles.overlay}>
              <View style={scanStyles.scanArea} />
              <Text style={scanStyles.scanText}>
                Place le code QR dans la zone
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={scanStyles.closeBtn}
            onPress={() => {
              setIsScanning(false);
              setHasScanned(false);
            }}
          >
            <Text style={scanStyles.closeTxt}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Écran d’accueil
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Image
          source={require("@/assets/images/icon.png")}
          style={styles.logo}
        />

        <Text style={styles.subtitle}>
          Scanne ton QR code pour enregistrer ton ID
        </Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleAskPermissionAndScan}
        >
          <Text style={styles.primaryButtonText}>Scanner mon QR code</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.secondaryButton,
            !currentId && styles.secondaryButtonDisabled,
          ]}
          onPress={handleGoToMap}
          disabled={!currentId}
        >
          <Text
            style={[
              styles.secondaryButtonText,
              !currentId && styles.secondaryButtonTextDisabled,
            ]}
          >
            Aller à la carte
          </Text>
        </TouchableOpacity>

        {!permission?.granted && (
          <Text style={styles.permissionHint}>
            La caméra est utilisée uniquement pour scanner ton QR.{"\n"}
            Tu peux changer la permission dans les réglages du téléphone.
          </Text>
        )}

        {/* 🔽 Bloc "Changer d'utilisateur" pleine largeur, même taille que les autres */}
        {currentId && (
          <TouchableOpacity
            style={styles.changeUserButton}
            onPress={handleDeleteId}
          >
            <Text style={styles.changeUserText}>Changer d'utilisateur</Text>

            <View style={styles.changeUserX}>
              <Text style={styles.changeUserXText}>✖</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // générique
  container: {
    flex: 1,
    backgroundColor: "#050816",
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#cbd5f5",
    marginBottom: 24,
    textAlign: "center",
  },

  // bouton "Changer d'utilisateur" full-width
  changeUserButton: {
    marginTop: 16,
    width: "100%",
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#4b5563",
    backgroundColor: "#0f172a",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  changeUserText: {
    color: "#cbd5e1",
    fontSize: 15,
  },
  changeUserX: {
    backgroundColor: "#cbd5e1",
    width: 26,
    height: 26,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
  },
  changeUserXText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },

  // boutons
  primaryButton: {
    backgroundColor: "#ef4444",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 12,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    marginTop: 4,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ef4444",
  },
  secondaryButtonDisabled: {
    borderColor: "#4b5563",
    backgroundColor: "#1f2933",
  },
  secondaryButtonText: {
    color: "#ef4444",
    fontSize: 15,
    fontWeight: "500",
  },
  secondaryButtonTextDisabled: {
    color: "#6b7280",
  },

  permissionHint: {
    marginTop: 12,
    fontSize: 13,
    color: "#9ca3af",
  },

  // loading
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#050816",
  },
  loadingText: {
    marginTop: 12,
    color: "#e5e7eb",
  },

  logo: {
    width: 200,
    height: 200,
    alignSelf: "center",
    marginBottom: 20,
    resizeMode: "contain",
  },
});

const scanStyles = StyleSheet.create({
  cameraWrapper: {
    flex: 1,
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
    borderColor: "#ef4444",
    backgroundColor: "transparent",
  },
  scanText: {
    marginTop: 18,
    color: "#e5e7eb",
    fontSize: 15,
  },
  closeBtn: {
    backgroundColor: "#ef4444",
    padding: 12,
    borderRadius: 999,
    alignSelf: "center",
    marginBottom: 20,
    marginTop: 10,
    width: 150,
    alignItems: "center",
  },
  closeTxt: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
});
