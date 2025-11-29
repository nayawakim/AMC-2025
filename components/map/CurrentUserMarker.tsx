import { StyleSheet, View } from "react-native";
import { Marker } from "react-native-maps";

export default function CurrentUserMarker({
    location,
}: {
    location: {
        latitude: number;
        longitude: number;
    };
}) {
    return (
        <Marker
            coordinate={{
                latitude: location.latitude,
                longitude: location.longitude,
            }}
            anchor={{ x: 0.5, y: 0.5 }}
        >
            <View style={styles.markerContainer}>
                <View style={styles.outerCircle}>
                    <View style={styles.innerCircle} />
                </View>
            </View>
        </Marker>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    map: { width: "100%", height: "100%" },
    markerContainer: {
        alignItems: "center",
        justifyContent: "center",
    },
    outerCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: "rgba(0, 122, 255, 0.3)",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        borderColor: "#fff",
        shadowColor: "#fff",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    innerCircle: {
        width: 16,
        height: 16,
        borderRadius: 100,
        backgroundColor: "#007AFF",
    },
});
