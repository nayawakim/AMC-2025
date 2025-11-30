import CurrentUserMarker from "@/components/map/CurrentUserMarker";
import { offsetCoordinates } from "@/lib/utils";
import Slider from "@react-native-community/slider";
import * as Location from "expo-location";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MapView, { Circle, Marker, PROVIDER_GOOGLE, Region } from "react-native-maps";

import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";

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

type PlaceType = "shelter" | "food" | "meds" | "danger";

// Couleurs des zones de danger selon la sévérité (0-5)
const getHazardColors = (severity: number) => {
    switch (severity) {
        case 0:
            return { stroke: "rgba(134, 239, 172, 0.9)", fill: "rgba(134, 239, 172, 0.3)" }; // vert très clair
        case 1:
            return { stroke: "rgba(34, 197, 94, 0.9)", fill: "rgba(34, 197, 94, 0.3)" }; // vert
        case 2:
            return { stroke: "rgba(22, 163, 74, 0.9)", fill: "rgba(22, 163, 74, 0.3)" }; // vert foncé
        case 3:
            return { stroke: "rgba(249, 115, 22, 0.9)", fill: "rgba(249, 115, 22, 0.3)" }; // orange
        case 4:
            return { stroke: "rgba(234, 88, 12, 0.9)", fill: "rgba(234, 88, 12, 0.3)" }; // orange-rouge
        case 5:
        default:
            return { stroke: "rgba(185, 28, 28, 0.9)", fill: "rgba(185, 28, 28, 0.3)" }; // rouge foncé
    }
};

export default function Map() {
    const [location, setLocation] = useState<{
        latitude: number;
        longitude: number;
    } | null>(null);

    const [region, setRegion] = useState<Region | null>(null);
    const mapRef = useRef<MapView>(null);

    //Convex
    const mapData = useQuery(api.map.getMapData, {});
    const reportPlace = useMutation(api.reports.reportPlace);
    const reportHazard = useMutation(api.reports.reportHazard);

    //Id per device
    const [reporterId] = useState(() => "device-" + Math.random().toString(36).slice(2));

    //UI ajout de points sur la carte
    const [isAdding, setIsAdding] = useState(false);
    const [selectedLat, setSelectedLat] = useState<number | null>(null);
    const [selectedLng, setSelectedLng] = useState<number | null>(null);
    const [isSheetVisible, setIsSheetVisible] = useState(false);
    const [selectedType, setSelectedType] = useState<PlaceType | null>(null);
    const [selectedSeverity, setSelectedSeverity] = useState(3);
    const [radiusMeters, setRadiusMeters] = useState(50);
    const [sliderKey, setSliderKey] = useState(0); // Force re-render des sliders

    const typeLabel = useMemo(() => {
        if (selectedType === "food") return "Nourriture / Eau";
        if (selectedType === "meds") return "Médicaments";
        if (selectedType === "danger") return "Zone de danger";
        if (selectedType === "shelter") return "Abri";
        return "Choisir un type";
    }, [selectedType]);

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
            const offset = offsetCoordinates(loc.coords.latitude, loc.coords.longitude);
            setLocation(offset);

            setRegion({
                latitude: offset.latitude,
                longitude: offset.longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
            })

            // Watch position for updates
            Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.BestForNavigation,
                    timeInterval: 500, // Update every half a second
                    distanceInterval: 1, // Update every 1 meter
                },
                (newLocation) => {
                    const off = offsetCoordinates(
                        newLocation.coords.latitude,
                        newLocation.coords.longitude
                    );
                    setLocation(off);
                }
            );
        })();
    }, []);

    if (!location || !region || !mapData)  {
        return(
            <View style={styles.center}>
            <Text>Chargement de la carte...</Text>
            </View>
        );
    }
    const {places, hazards} = mapData;
    //action UI
    const startAddPoint = () => {
        // Ouvre directement la bottom sheet, le marqueur central reste visible
        setIsAdding(true);
        setIsSheetVisible(true);
        setSelectedLat(null);
        setSelectedLng(null);
        setSelectedType(null);
    };
    
    const cancelAddPoint = () => {
        console.log("CLICK ANNULER");
        setIsAdding(false);
        setIsSheetVisible(false);
        setSelectedLat(null);
        setSelectedLng(null);
        setSelectedType(null);
        setSelectedSeverity(3);
        setRadiusMeters(50);
        setSliderKey(k => k + 1); // Force re-render des sliders
    };

    const submitPoint = async () => {
        console.log("CLICK VALIDER", { selectedLat, selectedLng, selectedType, region });
        
        // Use selected position, or fall back to current map center
        const finalLat = selectedLat ?? region?.latitude;
        const finalLng = selectedLng ?? region?.longitude;
        
        if (finalLat === undefined || finalLng === undefined || !selectedType) {
            console.log("EARLY RETURN - missing data:", { finalLat, finalLng, selectedType });
            return;
        }

        console.log("USING COORDS:", {
            type: selectedType,
            latitude: finalLat,
            longitude: finalLng,
            severity: selectedSeverity,
            radiusMeters,
            reporterId,
        });

        try {
            if (selectedType === "danger") {
                await reportHazard({
                    latitude: finalLat,
                    longitude: finalLng,
                    severity: selectedSeverity,
                    radiusMeters,
                    reporterId,
                });
            } else {
                await reportPlace({
                    type: selectedType,
                    latitude: finalLat,
                    longitude: finalLng,
                    reporterId,
                });
            }
        } catch (e) {
            console.error("Erreur lors de la soumission du point:", e);
        } finally {
            setIsAdding(false);
            setIsSheetVisible(false);
            setSelectedLat(null);
            setSelectedLng(null);
            setSelectedType(null);
            setSelectedSeverity(3);
            setRadiusMeters(50);
            setSliderKey(k => k + 1); // Force re-render des sliders
        }
    };
    
    return (
        <View style={styles.container}>
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            mapType="satellite"
            customMapStyle={apocalypseMapStyle}
            showsUserLocation={false}
            showsMyLocationButton={true}
            initialRegion={region}
            onRegionChangeComplete={(r) => setRegion(r)}
          >
            {/* Marker utilisateur perso */}
            {location && <CurrentUserMarker location={location} />}
    
            {/* Points de ravitaillement confirmés */}
            {places.map((p) => (
              <Marker
                key={p._id}
                coordinate={{ latitude: p.latitude, longitude: p.longitude }}
                title={p.name}
                description={
                  `Type: ${p.type}\n` +
                  `Créé: ${new Date(p.createdAt).toLocaleString()}`
                }
                pinColor="blue"
              />
            ))}
    
            {/* Zones de danger confirmées */}
            {hazards.map((h) => {
              const colors = getHazardColors(h.severity);
              return (
                <Circle
                  key={h._id}
                  center={{ latitude: h.latitude, longitude: h.longitude }}
                  radius={h.radiusMeters}
                  strokeColor={colors.stroke}
                  fillColor={colors.fill}
                />
              );
            })}
          </MapView>
    
          {/* Marqueur fixe au centre quand on ajoute */}
          {isAdding && (
            <View pointerEvents="none" style={styles.centerMarkerContainer}>
              <View style={styles.centerMarker} />
            </View>
          )}
    
          {/* Bouton Ajouter un emplacement */}
          {!isAdding && !isSheetVisible && (
            <View style={styles.addButtonContainer}>
              <TouchableOpacity style={styles.addButton} onPress={startAddPoint}>
                <Text style={styles.addButtonText}>Ajouter un emplacement</Text>
              </TouchableOpacity>
            </View>
          )}
    
          {/* Bottom sheet pour choisir type + sliders */}
          {isSheetVisible && (
            <View style={styles.bottomSheet}>
              <Text style={styles.sheetTitle}>Nouveau point</Text>
              <Text style={styles.sheetSubtitle}>
                Type sélectionné : {typeLabel}
              </Text>
    
              {/* Scroll horizontal des types */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.typeScroll}
              >
                <TypeChip
                  label="Abri"
                  selected={selectedType === "shelter"}
                  onPress={() => setSelectedType("shelter")}
                />
                <TypeChip
                  label="Nourriture / Eau"
                  selected={selectedType === "food"}
                  onPress={() => setSelectedType("food")}
                />
                <TypeChip
                  label="Médicaments"
                  selected={selectedType === "meds"}
                  onPress={() => setSelectedType("meds")}
                />
                <TypeChip
                  label="Zone de danger"
                  selected={selectedType === "danger"}
                  onPress={() => setSelectedType("danger")}
                />
              </ScrollView>
    
              {/* Sliders seulement pour zone de danger */}
              {selectedType === "danger" && (
                <>
                  <View style={styles.sliderBlock}>
                    <Text style={styles.sliderLabel}>
                      Niveau de danger : {Math.round(selectedSeverity)}
                    </Text>
                    <Slider
                      key={`severity-${sliderKey}`}
                      style={{ width: "100%", height: 40 }}
                      minimumValue={0}
                      maximumValue={5}
                      step={1}
                      value={selectedSeverity}
                      onValueChange={(val: number) => setSelectedSeverity(Math.round(val))}
                      minimumTrackTintColor="#ff4444"
                      maximumTrackTintColor="#ccc"
                    />
                  </View>
    
                  <View style={styles.sliderBlock}>
                    <Text style={styles.sliderLabel}>
                      Rayon de danger : {Math.round(radiusMeters)} m
                    </Text>
                    <Slider
                      key={`radius-${sliderKey}`}
                      style={{ width: "100%", height: 40 }}
                      minimumValue={10}
                      maximumValue={200}
                      step={10}
                      value={radiusMeters}
                      onValueChange={(val: number) => setRadiusMeters(Math.round(val))}
                      minimumTrackTintColor="#ff4444"
                      maximumTrackTintColor="#ccc"
                    />
                  </View>
                </>
              )}
    
              <View style={styles.sheetButtonsRow}>
                <TouchableOpacity style={styles.sheetCancel} onPress={cancelAddPoint}>
                  <Text style={styles.sheetCancelText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.sheetConfirm,
                    !selectedType && { opacity: 0.4 },
                  ]}
                  onPress={submitPoint}
                  disabled={!selectedType}
                >
                  <Text style={styles.sheetConfirmText}>Valider</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      );
    }
    
    type ChipProps = {
      label: string;
      selected: boolean;
      onPress: () => void;
    };
    
    function TypeChip({ label, selected, onPress }: ChipProps) {
      return (
        <TouchableOpacity
          onPress={onPress}
          style={[styles.chip, selected && styles.chipSelected]}
        >
          <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
            {label}
          </Text>
        </TouchableOpacity>
      );
    }
    
    const styles = StyleSheet.create({
      container: { flex: 1 },
      map: { width: "100%", height: "100%" },
      center: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
      },
      centerMarkerContainer: {
        position: "absolute",
        top: "50%",
        left: "50%",
        marginLeft: -10,
        marginTop: -20,
      },
      centerMarker: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: "red",
        borderWidth: 2,
        borderColor: "white",
      },
      addButtonContainer: {
        position: "absolute",
        bottom: 30,
        alignSelf: "center",
      },
      addButton: {
        backgroundColor: "#111827",
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 999,
      },
      addButtonText: {
        color: "white",
        fontWeight: "600",
        fontSize: 16,
      },
      confirmBar: {
        position: "absolute",
        bottom: 30,
        left: 16,
        right: 16,
        flexDirection: "row",
        justifyContent: "space-between",
      },
      cancelBtn: {
        flex: 1,
        marginRight: 8,
        paddingVertical: 10,
        borderRadius: 999,
        backgroundColor: "#e5e7eb",
        alignItems: "center",
      },
      confirmBtn: {
        flex: 2,
        paddingVertical: 10,
        borderRadius: 999,
        backgroundColor: "#16a34a",
        alignItems: "center",
      },
      cancelText: {
        color: "#111827",
        fontWeight: "500",
      },
      confirmText: {
        color: "white",
        fontWeight: "600",
      },
      bottomSheet: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        paddingTop: 12,
        paddingHorizontal: 16,
        paddingBottom: Platform.OS === "ios" ? 32 : 16,
        backgroundColor: "white",
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        elevation: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      sheetTitle: {
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 4,
      },
      sheetSubtitle: {
        fontSize: 14,
        color: "#6b7280",
        marginBottom: 8,
      },
      typeScroll: {
        marginVertical: 8,
      },
      chip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: "#d1d5db",
        marginRight: 8,
      },
      chipSelected: {
        backgroundColor: "#111827",
        borderColor: "#111827",
      },
      chipText: {
        color: "#4b5563",
        fontSize: 14,
        fontWeight: "500",
      },
      chipTextSelected: {
        color: "white",
      },
      sliderBlock: {
        marginTop: 12,
      },
      sliderLabel: {
        fontSize: 14,
        fontWeight: "500",
        marginBottom: 4,
      },
      sheetButtonsRow: {
        flexDirection: "row",
        marginTop: 16,
      },
      sheetCancel: {
        flex: 1,
        marginRight: 8,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: "#d1d5db",
        alignItems: "center",
        paddingVertical: 10,
      },
      sheetCancelText: {
        color: "#111827",
        fontWeight: "500",
      },
      sheetConfirm: {
        flex: 1,
        borderRadius: 999,
        backgroundColor: "#16a34a",
        alignItems: "center",
        paddingVertical: 10,
      },
      sheetConfirmText: {
        color: "white",
        fontWeight: "600",
      },
    });