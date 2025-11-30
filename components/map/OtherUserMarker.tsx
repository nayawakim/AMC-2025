import { StyleSheet, View } from "react-native";
import { Marker } from "react-native-maps";

export default function OtherUserMarker({
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
    markerContainer: {
        alignItems: "center",
        justifyContent: "center",
    },
    outerCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: "rgba(34, 197, 94, 0.3)", // Vert avec transparence
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
        backgroundColor: "#22c55e", // Vert
    },
});

