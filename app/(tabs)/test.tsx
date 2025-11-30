import { api } from '@/convex/_generated/api';
import {
  getUserId,
  initDatabase,
  addUser,
  deleteUser,
} from '@/lib/database';
import { useMutation } from 'convex/react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TestScreen() {
  const [currentId, setCurrentId] = useState<string>('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const markUserAsInfected = useMutation(api.users.markUserAsInfected);

  useEffect(() => {
    // Initialize database on mount
    initDatabase();
    loadUserId();
  }, []);

  const loadUserId = () => {
    const userId = getUserId();
    if (userId) {
      setCurrentId(userId);
    } else {
      setCurrentId('');
    }
  };

  const generateRandomId = (): string => {
    return Math.random().toString(36).substring(2, 15) +
           Math.random().toString(36).substring(2, 15);
  };

  const handleSaveId = async () => {
    // Check if an ID already exists
    const existingId = getUserId();
    if (existingId) {
      setMessage({
        text: 'You already have an ID! Delete it first to generate a new one.',
        type: 'error',
      });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    const newId = generateRandomId();
    setCurrentId(newId);

    const result = addUser(newId);

    setMessage({
      text: result.message,
      type: result.success ? 'success' : 'error',
    });

    if (result.success) {
      loadUserId();
    }

    // Clear message after 3 seconds
    setTimeout(() => setMessage(null), 3000);
  };

  const handleDeleteId = () => {
    Alert.alert(
      'Delete ID',
      `Are you sure you want to delete this ID?\n\n${currentId}`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const result = deleteUser();

            setMessage({
              text: result.message,
              type: result.success ? 'success' : 'error',
            });

            if (result.success) {
              setCurrentId('');
              loadUserId();
            }

            setTimeout(() => setMessage(null), 3000);
          },
        },
      ]
    );
  };

  const handleOpenScanner = async () => {
    if (!permission) {
      return;
    }

    if (!permission.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Permission Required', 'Camera permission is required to scan QR codes.');
        return;
      }
    }

    setShowScanner(true);
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    try {
      const qrData = JSON.parse(data);

      if (!qrData.id || typeof qrData.infected !== 'boolean') {
        setMessage({
          text: 'Invalid QR code format! Expected: { "id": string, "infected": boolean }',
          type: 'error',
        });
        setTimeout(() => setMessage(null), 3000);
        setShowScanner(false);
        return;
      }

      // Mark the user as infected in Convex if needed
      if (qrData.infected) {
        markUserAsInfected({ userId: qrData.id }).catch((err: unknown) => {
          console.error("Erreur lors du marquage de l'utilisateur comme infecté:", err);
        });
      }

      setMessage({
        text: `Scanned user ${qrData.id} (${qrData.infected ? 'INFECTED' : 'SAFE'})`,
        type: 'success',
      });

      setTimeout(() => setMessage(null), 3000);
      setShowScanner(false);
    } catch {
      setMessage({
        text: 'Invalid QR code! Must be valid JSON.',
        type: 'error',
      });
      setTimeout(() => setMessage(null), 3000);
      setShowScanner(false);
    }
  };


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>SQLite Test Page</Text>
        <Text style={styles.subtitle}>
          Test saving and deleting random IDs
        </Text>

        {/* Message Display */}
        {message && (
          <View
            style={[
              styles.messageBox,
              message.type === 'success' ? styles.successBox : styles.errorBox,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                message.type === 'success' ? styles.successText : styles.errorText,
              ]}
            >
              {message.text}
            </Text>
          </View>
        )}

        {/* Current ID Display */}
        {currentId && (
          <View style={styles.currentIdBox}>
            <Text style={styles.currentIdLabel}>Your ID:</Text>
            <Text style={styles.currentIdText}>{currentId}</Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.button,
              currentId ? styles.disabledButton : styles.saveButton
            ]}
            onPress={handleSaveId}
            disabled={!!currentId}
          >
            <Text style={styles.buttonText}>
              {currentId ? 'ID Already Generated' : 'Generate & Save ID'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.scanButton]}
            onPress={handleOpenScanner}
          >
            <Text style={styles.buttonText}>Scan QR Code</Text>
          </TouchableOpacity>
        </View>

        {/* Saved ID Details */}
        {currentId && (
          <View style={styles.listContainer}>
            <Text style={styles.listTitle}>
              Your Saved ID
            </Text>

            <View style={styles.idItem}>
              <View style={styles.idInfo}>
                <Text style={styles.idText}>{currentId}</Text>
              </View>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDeleteId}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {!currentId && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              No ID saved yet. Click the button above to generate and save your unique ID.
            </Text>
          </View>
        )}
      </View>

      {/* QR Scanner Modal */}
      <Modal
        visible={showScanner}
        animationType="slide"
        onRequestClose={() => setShowScanner(false)}
      >
        <SafeAreaView style={styles.scannerContainer}>
          <View style={styles.scannerHeader}>
            <Text style={styles.scannerTitle}>Scan QR Code</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowScanner(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>

          <CameraView
            style={styles.camera}
            facing="back"
            onBarcodeScanned={handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
          />

          <View style={styles.scannerInstructions}>
            <Text style={styles.instructionsText}>
              Point your camera at a QR code
            </Text>
            <Text style={styles.instructionsSubtext}>
              Expected format: {'\n'}
              {`{ "id": "...", "infected": true/false }`}
            </Text>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  messageBox: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  successBox: {
    backgroundColor: '#d4edda',
    borderColor: '#c3e6cb',
    borderWidth: 1,
  },
  errorBox: {
    backgroundColor: '#f8d7da',
    borderColor: '#f5c6cb',
    borderWidth: 1,
  },
  messageText: {
    fontSize: 14,
    fontWeight: '500',
  },
  successText: {
    color: '#155724',
  },
  errorText: {
    color: '#721c24',
  },
  currentIdBox: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  currentIdLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  currentIdText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    fontFamily: 'monospace',
  },
  buttonContainer: {
    marginBottom: 24,
    gap: 12,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  scanButton: {
    backgroundColor: '#34C759',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    flex: 1,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  scrollView: {
    flex: 1,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  idItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  idInfo: {
    flex: 1,
    marginRight: 12,
  },
  idText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#666',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  qrSection: {
    flex: 1,
    marginTop: 24,
  },
  qrScrollView: {
    flex: 1,
  },
  qrItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  qrInfo: {
    flex: 1,
    marginRight: 12,
  },
  qrMetadata: {
    marginTop: 8,
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  infectedBadge: {
    backgroundColor: '#ffebee',
  },
  safeBadge: {
    backgroundColor: '#e8f5e9',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  infectedText: {
    color: '#c62828',
  },
  safeText: {
    color: '#2e7d32',
  },
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  scannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#000',
  },
  scannerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  camera: {
    flex: 1,
  },
  scannerInstructions: {
    padding: 24,
    backgroundColor: '#000',
    alignItems: 'center',
  },
  instructionsText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  instructionsSubtext: {
    color: '#999',
    fontSize: 12,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
});
