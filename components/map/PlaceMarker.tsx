import { PLACE_TYPE_MAP } from "@/constants";
import { Doc } from "@/convex/_generated/dataModel";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { StyleSheet, View } from "react-native";
import { Marker } from "react-native-maps";

export default function PlaceMarker({ place }: { place: Doc<"places"> }) {
    const placeConfig = PLACE_TYPE_MAP[place.type];

    return (
        <Marker
            coordinate={{
                latitude: place.latitude,
                longitude: place.longitude,
            }}
            anchor={{ x: 0.5, y: 0.5 }}
            title={place.name}
            description={placeConfig.title}
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
});
