import CurrentUserMarker from "@/components/map/CurrentUserMarker";
import { offsetCoordinates } from "@/lib/utils";
import * as Location from "expo-location";
import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import MapView from "react-native-maps";

const apocalypseMapStyle = [
    {
        elementType: "geometry",
        stylers: [{ saturation: -100 }, { lightness: -50 }],
    },
    {
        elementType: "labels.text.fill",
        stylers: [{ color: "#ff6b6b" }],
    },
    {
        elementType: "labels.text.stroke",
        stylers: [{ color: "#1a1a1a" }],
    },
];

export default function Map() {
    const [location, setLocation] = useState<{
        latitude: number;
        longitude: number;
    } | null>(null);
    const mapRef = useRef<MapView>(null);

    // On mount, start watching location updates
    useEffect(() => {
        (async () => {
            const { status } =
                await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") {
                console.log("Permission to access location was denied");
                return;
            }

            const loc = await Location.getCurrentPositionAsync({});
            setLocation(
                offsetCoordinates(loc.coords.latitude, loc.coords.longitude)
            );

            // Watch position for updates
            Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.BestForNavigation,
                    timeInterval: 500, // Update every half a second
                    distanceInterval: 1, // Update every 1 meter
                },
                (newLocation) => {
                    setLocation(
                        offsetCoordinates(
                            newLocation.coords.latitude,
                            newLocation.coords.longitude
                        )
                    );
                }
            );
        })();
    }, []);

    return (
        <View style={styles.container}>
            {location ? (
                <MapView
                    ref={mapRef}
                    style={styles.map}
                    mapType="satellite" // ADD THIS
                    customMapStyle={apocalypseMapStyle} // ADD THIS
                    showsUserLocation={false}
                    showsMyLocationButton={true}
                    followsUserLocation={true}
                    initialRegion={{
                        latitude: location.latitude,
                        longitude: location.longitude,
                        latitudeDelta: 0.001,
                        longitudeDelta: 0.001,
                    }}
                >
                    <CurrentUserMarker location={location} />
                </MapView>
            ) : (
                <Text>Loading your location...</Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    map: { width: "100%", height: "100%" },
});
