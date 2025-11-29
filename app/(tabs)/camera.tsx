import { CameraView, useCameraPermissions } from "expo-camera";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isFront, setIsFront] = useState(false);

  // Si les permissions ne sont pas encore chargées
  if (!permission) return <View style={styles.center}><Text>Loading...</Text></View>;

  // Si la caméra n'est pas autorisée sur l'appareil
  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>L'application a besoin d'accéder à la caméra.</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.button}>
          <Text style={styles.buttonText}>Autoriser</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Sinon afficher la vraie caméra
  return (
    <View style={styles.container}>
      <CameraView 
        style={StyleSheet.absoluteFill} 
        facing={isFront ? "front" : "back"} 
      />

      {/* Boutons UI */}
      <View style={styles.controls}>
        <TouchableOpacity 
          style={styles.switchBtn}
          onPress={() => setIsFront(!isFront)}
        >
          <Text style={styles.buttonText}>🔄 Flip</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}


/* ------- STYLES ------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black"
  },
  center: {
    flex:1,
    alignItems:"center",
    justifyContent:"center",
    backgroundColor:"#000"
  },
  text:{ color:"white", marginBottom:10 },
  button:{
    backgroundColor:"white",
    paddingHorizontal:20,
    paddingVertical:10,
    borderRadius:8
  },
  buttonText:{ color:"black", fontWeight:"bold" },

  controls:{
    position:"absolute",
    bottom:40,
    width:"100%",
    alignItems:"center"
  },
  switchBtn:{
    backgroundColor:"rgba(255,255,255,0.3)",
    padding:12,
    borderRadius:50
  }
});

