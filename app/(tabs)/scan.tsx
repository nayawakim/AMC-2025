// app/(tabs)/scan.tsx
import { CameraView, useCameraPermissions } from "expo-camera";
import React, { useState } from "react";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(true);
  const [scannedData, setScannedData] = useState<string | null>(null);

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
          L'application a besoin de la caméra pour scanner les QR codes.
        </Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Autoriser la caméra</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // callback quand un QR est scanné
  const handleBarcodeScanned = (result: any) => {
    if (!isScanning) return;

    setIsScanning(false);
    setScannedData(result?.data ?? "Aucune donnée lue");
  };

  return (
    <View style={styles.root}>
      {/* Zone caméra */}
      <View style={styles.cameraWrapper}>
        <CameraView
          style={StyleSheet.absoluteFill}
          onBarcodeScanned={isScanning ? handleBarcodeScanned : undefined}
          barcodeScannerSettings={{
            // on ne veut que les QR codes
            barcodeTypes: ["qr"],
          }}
        />

        {/* Overlay sombre + cadre de visée */}
        <View style={styles.overlay}>
          <View style={styles.scanArea} />
          <Text style={styles.scanText}>
            Place le code QR dans le carré
          </Text>
        </View>
      </View>

      {/* Résultat */}
      <View style={styles.resultCard}>
        <Text style={styles.resultTitle}>Résultat du scan</Text>
        <Text style={styles.resultText}>
          {scannedData ? scannedData : "Aucun code scanné pour l’instant."}
        </Text>

        {scannedData && (
          <TouchableOpacity
            style={styles.rescanButton}
            onPress={() => {
              setScannedData(null);
              setIsScanning(true);
            }}
          >
            <Text style={styles.rescanText}>Scanner un autre code</Text>
          </TouchableOpacity>
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
    borderWidth: 3,
    borderColor: "#ef4444",
    backgroundColor: "transparent",
  },
  scanText: {
    marginTop: 16,
    color: "#e5e7eb",
    fontSize: 14,
  },

  resultCard: {
    flex: 1,
    marginTop: 16,
    borderRadius: 20,
    padding: 16,
    backgroundColor: "#0b1120",
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  resultTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  resultText: {
    color: "#d1d5db",
    fontSize: 14,
  },
  rescanButton: {
    marginTop: 16,
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#ef4444",
  },
  rescanText: {
    color: "white",
    fontWeight: "500",
  },
});
