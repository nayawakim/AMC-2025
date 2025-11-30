import { PLACE_TYPE_MAP } from "@/constants";
import { Doc } from "@/convex/_generated/dataModel";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Callout, Marker } from "react-native-maps";

export default function PlaceMarker({
    place,
    onDelete,
}: {
    place: Doc<"places">;
    onDelete?: () => void;
}) {
    const placeConfig = PLACE_TYPE_MAP[place.type as keyof typeof PLACE_TYPE_MAP] || {
        title: place.type,
        icon: "place" as keyof typeof MaterialIcons.glyphMap,
        color: "#6b7280",
    };

    return (
        <Marker
            coordinate={{
                latitude: place.latitude,
                longitude: place.longitude,
            }}
            anchor={{ x: 0.5, y: 0.5 }}
        >
            <View style={styles.markerContainer}>
                <View
                    style={[
                        styles.iconContainer,
                        { backgroundColor: placeConfig.color },
                    ]}
                >
                    <MaterialIcons
                        name={placeConfig.icon}
                        size={24}
                        color="white"
                    />
                </View>
            </View>
            <Callout tooltip={false}>
                <View style={styles.calloutContainer}>
                    <Text style={styles.calloutTitle}>{place.name}</Text>
                    <Text style={styles.calloutDescription}>
                        {placeConfig.title}
                    </Text>
                </View>
            </Callout>
        </Marker>
    );
}

const styles = StyleSheet.create({
    markerContainer: {
        alignItems: "center",
        justifyContent: "center",
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 3,
        borderColor: "#fff",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    calloutContainer: {
        padding: 8,
        minWidth: 200,
    },
    calloutTitle: {
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 4,
        color: "#111827",
    },
    calloutDescription: {
        fontSize: 12,
        color: "#6b7280",
        marginBottom: 8,
    },
    calloutButtonDelete: {
        backgroundColor: "#dc2626",
        borderRadius: 6,
        paddingVertical: 6,
        paddingHorizontal: 12,
        marginTop: 4,
        minWidth: 100,
    },
    calloutButtonTextDelete: {
        color: "white",
        fontWeight: "600",
        fontSize: 14,
        textAlign: "center",
    },
});
