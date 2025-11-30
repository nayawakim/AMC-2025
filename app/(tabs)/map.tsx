import CurrentUserMarker from "@/components/map/CurrentUserMarker";
import InfectedUserMarker from "@/components/map/InfectedUserMarker";
import OtherUserMarker from "@/components/map/OtherUserMarker";
import { getUserId } from "@/lib/database";
import { offsetCoordinates } from "@/lib/utils";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Slider from "@react-native-community/slider";
import { Audio } from "expo-av";
import * as Location from "expo-location";
import { Accelerometer } from "expo-sensors";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    Alert,
    Animated,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import MapView, { Callout, Circle, Marker, PROVIDER_GOOGLE, Region } from "react-native-maps";

import PlaceMarker from "@/components/map/PlaceMarker";
import { PLACE_TYPE_MAP } from "@/constants";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
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

// Couleurs des zones de danger selon la sévérité (1-5)
const getHazardColors = (severity: number) => {
    switch (severity) {
        case 1:
            return {
                stroke: "rgba(34, 197, 94, 0.9)",
                fill: "rgba(34, 197, 94, 0.3)",
            }; // vert - zone sécuritaire
        case 2:
            return {
                stroke: "rgba(234, 179, 8, 0.9)",
                fill: "rgba(234, 179, 8, 0.3)",
            }; // jaune - zone moins sécuritaire
        case 3:
            return {
                stroke: "rgba(251, 146, 60, 0.9)",
                fill: "rgba(251, 146, 60, 0.3)",
            }; // jaune-orange - zone légèrement dangereuse
        case 4:
            return {
                stroke: "rgba(249, 115, 22, 0.9)",
                fill: "rgba(249, 115, 22, 0.3)",
            }; // orange-rouge - zone moyennement dangereuse
        case 5:
        default:
            return {
                stroke: "rgba(185, 28, 28, 0.9)",
                fill: "rgba(185, 28, 28, 0.3)",
            }; // rouge - zone très dangereuse
    }
};

// Nom des zones de danger selon la sévérité (1-5)
const getHazardName = (severity: number): string => {
    switch (severity) {
        case 1:
            return "Zone sécuritaire";
        case 2:
            return "Zone moins sécuritaire";
        case 3:
            return "Zone légèrement dangereuse";
        case 4:
            return "Zone moyennement dangereuse";
        case 5:
        default:
            return "Zone très dangereuse";
    }
};

export default function Map() {
    const [location, setLocation] = useState<{
        latitude: number;
        longitude: number;
    } | null>(null);
    const mapRef = useRef<MapView>(null);

    //Convex
    const mapData = useQuery(api.map.getMapData, {});
    const activeUsers = useQuery(api.users.getActiveUsers, {});
    const nearbyAlerts = useQuery(
        api.alerts.getActiveAlertsNearby,
        location
            ? {
                  latitude: location.latitude,
                  longitude: location.longitude,
                  radiusMeters: 50,
              }
            : "skip"
    );
    const reportPlace = useMutation(api.reports.reportPlace);
    const reportHazard = useMutation(api.reports.reportHazard);
    const updateHazard = useMutation(api.reports.updateHazard);
    const deleteHazard = useMutation(api.reports.deleteHazard);
    const deletePlaceMutation = useMutation(api.reports.deletePlace);
    const updateUserLocation = useMutation(api.users.updateUserLocation);
    const createDangerAlert = useMutation(api.alerts.createDangerAlert);

    //Id per device - lié au QR code ID
    const [reporterId, setReporterId] = useState<string | null>(null);

    // Charger l'ID utilisateur au démarrage (QR code ID)
    useEffect(() => {
        const userId = getUserId();
        if (userId) {
            setReporterId(userId);
        }
    }, []);

    // Charger le son d'alerte au démarrage
    useEffect(() => {
        const loadSound = async () => {
            try {
                // Configurer le mode audio pour permettre la lecture même en mode silencieux
                await Audio.setAudioModeAsync({
                    playsInSilentModeIOS: true,
                    staysActiveInBackground: false,
                });
            } catch (error) {
                console.warn("Erreur lors de la configuration audio:", error);
            }
        };
        loadSound();
    }, []);

    // Fonction pour jouer le son d'alerte et les vibrations
    const playAlertSound = async () => {
        // Toujours jouer les vibrations haptics (méthode principale, fiable)
        try {
            const Haptics = await import("expo-haptics");
            // Vibration forte pour l'alerte
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            // Ajouter une vibration supplémentaire après un court délai pour un effet d'alerte
            setTimeout(() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }, 100);
        } catch (hapticError) {
            console.warn("Erreur haptics:", hapticError);
        }

        // Les vibrations haptics sont la méthode principale et fonctionnent toujours
        // Pour ajouter un son plus tard, on peut utiliser un fichier audio local
    };

    //UI ajout de points sur la carte
    const [isAdding, setIsAdding] = useState(false);
    const [selectedLat, setSelectedLat] = useState<number | null>(null);
    const [selectedLng, setSelectedLng] = useState<number | null>(null);
    const [isSheetVisible, setIsSheetVisible] = useState(false);
    const [selectedType, setSelectedType] = useState<PlaceType | null>(null);
    const [selectedSeverity, setSelectedSeverity] = useState(5);
    const [radiusMeters, setRadiusMeters] = useState(50);
    const [sliderKey, setSliderKey] = useState(0); // Force re-render des sliders
    const [editingHazard, setEditingHazard] = useState<{
        id: string;
        severity: number;
        radiusMeters: number;
    } | null>(null);
    const [selectedHazardId, setSelectedHazardId] = useState<string | null>(
        null
    );
    const [region, setRegion] = useState<Region | null>(null);
    
    // États pour les alertes urgentes (modales personnalisées)
    const [shakeAlertVisible, setShakeAlertVisible] = useState(false);
    const [dangerAlertVisible, setDangerAlertVisible] = useState(false);
    const [dangerAlertMessage, setDangerAlertMessage] = useState("");
    
    // Animations de tremblement pour les modales (X et Y pour un tremblement plus visible)
    const shakeAnimationX = useRef(new Animated.Value(0)).current;
    const shakeAnimationY = useRef(new Animated.Value(0)).current;
    const dangerShakeAnimationX = useRef(new Animated.Value(0)).current;
    const dangerShakeAnimationY = useRef(new Animated.Value(0)).current;

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
            const offset = offsetCoordinates(
                loc.coords.latitude,
                loc.coords.longitude
            );
            setLocation(offset);
            setRegion({
                latitude: offset.latitude,
                longitude: offset.longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
            });
            // Mettre à jour la position initiale dans Convex
            if (reporterId) {
                updateUserLocation({
                    userId: reporterId,
                    latitude: offset.latitude,
                    longitude: offset.longitude,
                }).catch((err) => {
                    console.warn("Erreur mise à jour position initiale:", err);
                });
            }

            // Watch position for updates
            Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.BestForNavigation,
                    timeInterval: 500, // Update every half a second
                    distanceInterval: 1, // Update every 1 meter
                },
                (newLocation) => {
                    const offset = offsetCoordinates(
                        newLocation.coords.latitude,
                        newLocation.coords.longitude
                    );
                    setLocation(offset);
                    // Mettre à jour la position dans Convex
                    if (reporterId) {
                        updateUserLocation({
                            userId: reporterId,
                            latitude: offset.latitude,
                            longitude: offset.longitude,
                        }).catch((err) => {
                            console.warn("Erreur mise à jour position:", err);
                        });
                    }
                }
            );
        })();
    }, [reporterId, updateUserLocation]);

    // Détection du shake pour déclencher une alerte (détection rapide)
    const shakeStartTimeRef = useRef<number | null>(null);
    const isShakeDialogOpenRef = useRef<boolean>(false);
    const lastShakeAlertTimeRef = useRef<number>(0);
    const SHAKE_COOLDOWN = 5000; // 5 secondes entre les pop-ups de shake

    useEffect(() => {
        let subscription: { remove: () => void } | null = null;
        const SHAKE_THRESHOLD = 1.5; // Seuil d'accélération pour détecter un shake
        const SHAKE_DURATION_REQUIRED = 300; // 300ms de shake continu requis (détection rapide)

        const handleShake = () => {
            const now = Date.now();
            
            // Vérifier le cooldown
            if (now - lastShakeAlertTimeRef.current < SHAKE_COOLDOWN) {
                return; // Trop tôt depuis le dernier pop-up
            }

            // Vérifier qu'un pop-up n'est pas déjà ouvert
            if (isShakeDialogOpenRef.current) {
                return;
            }

            lastShakeAlertTimeRef.current = now;
            isShakeDialogOpenRef.current = true;

            // Afficher la modale d'alerte rouge personnalisée
            setShakeAlertVisible(true);
            // Jouer le son d'alerte
            playAlertSound();
            // Jouer le son d'alerte
            playAlertSound();
        };

        (async () => {
            // Démarrer l'accéléromètre
            Accelerometer.setUpdateInterval(100); // Mise à jour toutes les 100ms

            let lastX = 0;
            let lastY = 0;
            let lastZ = 0;

            subscription = Accelerometer.addListener(({ x, y, z }) => {
                // Calculer la différence d'accélération
                const deltaX = Math.abs(x - lastX);
                const deltaY = Math.abs(y - lastY);
                const deltaZ = Math.abs(z - lastZ);

                // Vérifier si c'est un shake
                const isShaking =
                    deltaX > SHAKE_THRESHOLD ||
                    deltaY > SHAKE_THRESHOLD ||
                    deltaZ > SHAKE_THRESHOLD;

                const now = Date.now();

                if (isShaking) {
                    // Si c'est le début du shake, enregistrer le temps
                    if (shakeStartTimeRef.current === null) {
                        shakeStartTimeRef.current = now;
                    } else {
                        // Vérifier si on a atteint la durée requise (1 seconde)
                        const shakeDuration = now - shakeStartTimeRef.current;
                        if (shakeDuration >= SHAKE_DURATION_REQUIRED) {
                            handleShake();
                            // Réinitialiser après avoir déclenché
                            shakeStartTimeRef.current = null;
                        }
                    }
                } else {
                    // Si le shake s'arrête, réinitialiser le compteur
                    shakeStartTimeRef.current = null;
                }

                lastX = x;
                lastY = y;
                lastZ = z;
            });
        })();

        return () => {
            if (subscription) {
                subscription.remove();
            }
        };
    }, [location, reporterId, createDangerAlert]);

    // Déclencher l'animation de tremblement quand la modale shake devient visible
    useEffect(() => {
        if (shakeAlertVisible) {
            // Réinitialiser les animations
            shakeAnimationX.setValue(0);
            shakeAnimationY.setValue(0);
            
            // Démarrer l'animation après un court délai pour s'assurer que la modale est montée
            const timer = setTimeout(() => {
                // Animation X et Y en parallèle pour un effet plus naturel
                Animated.parallel([
                    // Animation X
                    Animated.sequence([
                        Animated.timing(shakeAnimationX, {
                            toValue: 20,
                            duration: 50,
                            useNativeDriver: true,
                        }),
                        Animated.timing(shakeAnimationX, {
                            toValue: -20,
                            duration: 50,
                            useNativeDriver: true,
                        }),
                        Animated.timing(shakeAnimationX, {
                            toValue: 20,
                            duration: 50,
                            useNativeDriver: true,
                        }),
                        Animated.timing(shakeAnimationX, {
                            toValue: -20,
                            duration: 50,
                            useNativeDriver: true,
                        }),
                        Animated.timing(shakeAnimationX, {
                            toValue: 15,
                            duration: 50,
                            useNativeDriver: true,
                        }),
                        Animated.timing(shakeAnimationX, {
                            toValue: -15,
                            duration: 50,
                            useNativeDriver: true,
                        }),
                        Animated.timing(shakeAnimationX, {
                            toValue: 10,
                            duration: 50,
                            useNativeDriver: true,
                        }),
                        Animated.timing(shakeAnimationX, {
                            toValue: -10,
                            duration: 50,
                            useNativeDriver: true,
                        }),
                        Animated.timing(shakeAnimationX, {
                            toValue: 0,
                            duration: 50,
                            useNativeDriver: true,
                        }),
                    ]),
                    // Animation Y
                    Animated.sequence([
                        Animated.timing(shakeAnimationY, {
                            toValue: -15,
                            duration: 50,
                            useNativeDriver: true,
                        }),
                        Animated.timing(shakeAnimationY, {
                            toValue: 15,
                            duration: 50,
                            useNativeDriver: true,
                        }),
                        Animated.timing(shakeAnimationY, {
                            toValue: -15,
                            duration: 50,
                            useNativeDriver: true,
                        }),
                        Animated.timing(shakeAnimationY, {
                            toValue: 15,
                            duration: 50,
                            useNativeDriver: true,
                        }),
                        Animated.timing(shakeAnimationY, {
                            toValue: -10,
                            duration: 50,
                            useNativeDriver: true,
                        }),
                        Animated.timing(shakeAnimationY, {
                            toValue: 10,
                            duration: 50,
                            useNativeDriver: true,
                        }),
                        Animated.timing(shakeAnimationY, {
                            toValue: -5,
                            duration: 50,
                            useNativeDriver: true,
                        }),
                        Animated.timing(shakeAnimationY, {
                            toValue: 5,
                            duration: 50,
                            useNativeDriver: true,
                        }),
                        Animated.timing(shakeAnimationY, {
                            toValue: 0,
                            duration: 50,
                            useNativeDriver: true,
                        }),
                    ]),
                ]).start();
            }, 100);

            return () => clearTimeout(timer);
        }
    }, [shakeAlertVisible]);

    // Afficher les alertes reçues (une seule fois par alerte, un seul pop-up à la fois)
    const shownAlertsRef = useRef<Set<string>>(new Set());
    const isAlertDialogOpenRef = useRef<boolean>(false);
    useEffect(() => {
        // Ne pas afficher si un pop-up est déjà ouvert
        if (isAlertDialogOpenRef.current) {
            return;
        }

        if (nearbyAlerts && nearbyAlerts.length > 0) {
            // Filtrer les alertes qui ne sont pas de l'utilisateur actuel
            const otherAlerts = nearbyAlerts.filter(
                (alert) => alert.reporterId !== reporterId
            );

            if (otherAlerts.length > 0) {
                // Afficher l'alerte la plus proche qui n'a pas encore été affichée
                const newAlerts = otherAlerts.filter(
                    (alert) => !shownAlertsRef.current.has(alert._id as string)
                );

                if (newAlerts.length > 0) {
                    const closestAlert = newAlerts.reduce((prev, curr) =>
                        prev.distanceMeters < curr.distanceMeters ? prev : curr
                    );

                    // Marquer cette alerte comme affichée
                    shownAlertsRef.current.add(closestAlert._id as string);
                    isAlertDialogOpenRef.current = true;

                    // Afficher la modale d'alerte rouge personnalisée
                    setDangerAlertMessage(
                        `Un danger a été signalé à ${closestAlert.distanceMeters}m de vous ! Fuyez immédiatement !`
                    );
                    setDangerAlertVisible(true);
                }
            }
        }

        // Nettoyer les alertes expirées de la liste des alertes affichées
        if (nearbyAlerts) {
            const activeAlertIds = new Set(
                nearbyAlerts.map((a) => a._id as string)
            );
            shownAlertsRef.current.forEach((alertId) => {
                if (!activeAlertIds.has(alertId)) {
                    shownAlertsRef.current.delete(alertId);
                }
            });
        }
    }, [nearbyAlerts, reporterId]);

    // Déclencher l'animation de tremblement quand la modale danger devient visible
    useEffect(() => {
        if (dangerAlertVisible) {
            // Réinitialiser les animations
            dangerShakeAnimationX.setValue(0);
            dangerShakeAnimationY.setValue(0);
            
            // Démarrer l'animation après un court délai pour s'assurer que la modale est montée
            const timer = setTimeout(() => {
                // Animation X et Y en parallèle pour un effet plus naturel
                Animated.parallel([
                    // Animation X
                    Animated.sequence([
                        Animated.timing(dangerShakeAnimationX, {
                            toValue: 25,
                            duration: 50,
                            useNativeDriver: true,
                        }),
                        Animated.timing(dangerShakeAnimationX, {
                            toValue: -25,
                            duration: 50,
                            useNativeDriver: true,
                        }),
                        Animated.timing(dangerShakeAnimationX, {
                            toValue: 25,
                            duration: 50,
                            useNativeDriver: true,
                        }),
                        Animated.timing(dangerShakeAnimationX, {
                            toValue: -25,
                            duration: 50,
                            useNativeDriver: true,
                        }),
                        Animated.timing(dangerShakeAnimationX, {
                            toValue: 20,
                            duration: 50,
                            useNativeDriver: true,
                        }),
                        Animated.timing(dangerShakeAnimationX, {
                            toValue: -20,
                            duration: 50,
                            useNativeDriver: true,
                        }),
                        Animated.timing(dangerShakeAnimationX, {
                            toValue: 15,
                            duration: 50,
                            useNativeDriver: true,
                        }),
                        Animated.timing(dangerShakeAnimationX, {
                            toValue: -15,
                            duration: 50,
                            useNativeDriver: true,
                        }),
                        Animated.timing(dangerShakeAnimationX, {
                            toValue: 10,
                            duration: 50,
                            useNativeDriver: true,
                        }),
                        Animated.timing(dangerShakeAnimationX, {
                            toValue: -10,
                            duration: 50,
                            useNativeDriver: true,
                        }),
                        Animated.timing(dangerShakeAnimationX, {
                            toValue: 0,
                            duration: 50,
                            useNativeDriver: true,
                        }),
                    ]),
                    // Animation Y
                    Animated.sequence([
                        Animated.timing(dangerShakeAnimationY, {
                            toValue: -20,
                            duration: 50,
                            useNativeDriver: true,
                        }),
                        Animated.timing(dangerShakeAnimationY, {
                            toValue: 20,
                            duration: 50,
                            useNativeDriver: true,
                        }),
                        Animated.timing(dangerShakeAnimationY, {
                            toValue: -20,
                            duration: 50,
                            useNativeDriver: true,
                        }),
                        Animated.timing(dangerShakeAnimationY, {
                            toValue: 20,
                            duration: 50,
                            useNativeDriver: true,
                        }),
                        Animated.timing(dangerShakeAnimationY, {
                            toValue: -15,
                            duration: 50,
                            useNativeDriver: true,
                        }),
                        Animated.timing(dangerShakeAnimationY, {
                            toValue: 15,
                            duration: 50,
                            useNativeDriver: true,
                        }),
                        Animated.timing(dangerShakeAnimationY, {
                            toValue: -10,
                            duration: 50,
                            useNativeDriver: true,
                        }),
                        Animated.timing(dangerShakeAnimationY, {
                            toValue: 10,
                            duration: 50,
                            useNativeDriver: true,
                        }),
                        Animated.timing(dangerShakeAnimationY, {
                            toValue: -5,
                            duration: 50,
                            useNativeDriver: true,
                        }),
                        Animated.timing(dangerShakeAnimationY, {
                            toValue: 5,
                            duration: 50,
                            useNativeDriver: true,
                        }),
                        Animated.timing(dangerShakeAnimationY, {
                            toValue: 0,
                            duration: 50,
                            useNativeDriver: true,
                        }),
                    ]),
                ]).start();
            }, 100);

            return () => clearTimeout(timer);
        }
    }, [dangerAlertVisible]);

    if (!location || !region || !mapData || !reporterId) {
        return (
            <View style={styles.center}>
                <Text>Chargement de la carte...</Text>
            </View>
        );
    }
    const { places, hazards } = mapData;
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
        setSelectedSeverity(5);
        setRadiusMeters(50);
        setEditingHazard(null);
        setSliderKey((k) => k + 1); // Force re-render des sliders
    };

    const submitPoint = async () => {
        console.log("CLICK VALIDER", {
            selectedLat,
            selectedLng,
            selectedType,
            region,
        });

        // Use selected position, or fall back to current map center
        const finalLat = selectedLat ?? region?.latitude;
        const finalLng = selectedLng ?? region?.longitude;

        if (finalLat === undefined || finalLng === undefined || !selectedType) {
            console.log("EARLY RETURN - missing data:", {
                finalLat,
                finalLng,
                selectedType,
            });
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

        if (!reporterId) {
            console.error("reporterId non disponible");
            return;
        }

        try {
            if (editingHazard) {
                // Modification d'une zone existante
                await updateHazard({
                    hazardId: editingHazard.id as Id<"hazards">,
                    severity: selectedSeverity,
                    radiusMeters,
                });
            } else if (selectedType === "danger") {
                // Création d'une nouvelle zone
                await reportHazard({
                    latitude: finalLat,
                    longitude: finalLng,
                    severity: selectedSeverity,
                    radiusMeters,
                    reporterId,
                });
            } else {
                // Création d'un nouveau point
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
            setSelectedSeverity(5);
            setRadiusMeters(50);
            setEditingHazard(null);
            setSliderKey((k) => k + 1); // Force re-render des sliders
        }
    };

    return (
        <View style={styles.container}>
            {/* Légende */}
            <View style={styles.legendContainer}>
                <View style={styles.legendHeader}>
                    <Text style={styles.legendTitle}>LÉGENDE</Text>
                </View>
                <View style={styles.legendContent}>
                    {/* Shelter */}
                    <View style={styles.legendItem}>
                        <View style={[styles.legendIconContainer, { backgroundColor: PLACE_TYPE_MAP.shelter.color }]}>
                            <MaterialIcons name={PLACE_TYPE_MAP.shelter.icon} size={20} color="white" />
                        </View>
                        <Text style={styles.legendText}>{PLACE_TYPE_MAP.shelter.title}</Text>
                    </View>
                    
                    {/* Food */}
                    <View style={styles.legendItem}>
                        <View style={[styles.legendIconContainer, { backgroundColor: PLACE_TYPE_MAP.food.color }]}>
                            <MaterialIcons name={PLACE_TYPE_MAP.food.icon} size={20} color="white" />
                        </View>
                        <Text style={styles.legendText}>{PLACE_TYPE_MAP.food.title}</Text>
                    </View>
                    
                    {/* Meds */}
                    <View style={styles.legendItem}>
                        <View style={[styles.legendIconContainer, { backgroundColor: PLACE_TYPE_MAP.meds.color }]}>
                            <MaterialIcons name={PLACE_TYPE_MAP.meds.icon} size={20} color="white" />
                        </View>
                        <Text style={styles.legendText}>{PLACE_TYPE_MAP.meds.title}</Text>
                    </View>
                    
                    {/* Zone de danger */}
                    <View style={styles.legendItem}>
                        <View style={styles.legendHazardContainer}>
                            <View style={[styles.legendHazardCircle, { borderColor: "#dc2626", backgroundColor: "rgba(220, 38, 38, 0.3)" }]} />
                        </View>
                        <Text style={styles.legendText}>Zone de danger</Text>
                    </View>
                </View>
            </View>

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
                onPress={(e) => {
                    // Vérifier si le clic est dans une zone de danger ou sur un point
                    const clickLat = e.nativeEvent.coordinate.latitude;
                    const clickLng = e.nativeEvent.coordinate.longitude;

                    // Fonction pour calculer la distance en mètres (formule de Haversine)
                    const distanceInMeters = (
                        lat1: number,
                        lon1: number,
                        lat2: number,
                        lon2: number
                    ): number => {
                        const R = 6371e3; // Rayon de la Terre en mètres
                        const φ1 = (lat1 * Math.PI) / 180;
                        const φ2 = (lat2 * Math.PI) / 180;
                        const Δφ = ((lat2 - lat1) * Math.PI) / 180;
                        const Δλ = ((lon2 - lon1) * Math.PI) / 180;

                        const a =
                            Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                            Math.cos(φ1) *
                                Math.cos(φ2) *
                                Math.sin(Δλ / 2) *
                                Math.sin(Δλ / 2);
                        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

                        return R * c;
                    };

                    // Vérifier d'abord les zones de danger (cercles)
                    for (const h of hazards) {
                        const distance = distanceInMeters(
                            clickLat,
                            clickLng,
                            h.latitude,
                            h.longitude
                        );

                        if (distance <= h.radiusMeters) {
                            setSelectedHazardId(h._id);
                            return;
                        }
                    }

                    // Vérifier ensuite les points (rayon de 20m pour faciliter le clic)
                    for (const p of places) {
                        const distance = distanceInMeters(
                            clickLat,
                            clickLng,
                            p.latitude,
                            p.longitude
                        );

                        if (distance <= 20) {
                            setSelectedHazardId(p._id);
                            return;
                        }
                    }

                    // Si on clique ailleurs, ne rien faire (garder les boutons si déjà affichés)
                }}
            >
                {/* Marker utilisateur perso (bleu) */}
                {location && <CurrentUserMarker location={location} />}

                {/* Autres utilisateurs connectés */}
                {activeUsers &&
                    activeUsers
                        .filter((u) => u.userId !== reporterId)
                        .map((user) => {
                            // Afficher en rouge si infecté, sinon en vert
                            if (user.isInfected) {
                                return (
                                    <InfectedUserMarker
                                        key={user.userId}
                                        location={{
                                            latitude: user.latitude,
                                            longitude: user.longitude,
                                        }}
                                    />
                                );
                            } else {
                                return (
                                    <OtherUserMarker
                                        key={user.userId}
                                        location={{
                                            latitude: user.latitude,
                                            longitude: user.longitude,
                                        }}
                                    />
                                );
                            }
                        })}

                {/* Points de ravitaillement confirmés */}
                {places.map((p) => (
                    <PlaceMarker
                        key={p._id}
                        place={p}
                        onDelete={() => {
                            setSelectedHazardId(p._id);
                        }}
                    />
                ))}

                {/* Zones de danger confirmées */}
                {hazards.map((h) => {
                    const colors = getHazardColors(h.severity);
                    const hazardName = getHazardName(h.severity);
                    // Calculer la taille du marker invisible pour couvrir tout le cercle
                    // On utilise une taille fixe assez grande pour être cliquable partout
                    // Le marker sera invisible mais cliquable sur une grande zone
                    const markerSize = 150; // Taille fixe assez grande pour couvrir la plupart des cercles
                    
                    return (
                        <React.Fragment key={h._id}>
                            <Circle
                                center={{
                                    latitude: h.latitude,
                                    longitude: h.longitude,
                                }}
                                radius={h.radiusMeters}
                                strokeColor={colors.stroke}
                                fillColor={colors.fill}
                            />
                            <Marker
                                coordinate={{
                                    latitude: h.latitude,
                                    longitude: h.longitude,
                                }}
                                anchor={{ x: 0.5, y: 0.5 }}
                                tracksViewChanges={false}
                            >
                                <View 
                                    style={[
                                        styles.invisibleMarker, 
                                        { 
                                            width: markerSize, 
                                            height: markerSize,
                                        }
                                    ]} 
                                    pointerEvents="box-none"
                                />
                                <Callout tooltip={false}>
                                    <View style={styles.calloutContainer}>
                                        <Text style={styles.calloutTitle}>
                                            {hazardName}
                                        </Text>
                                        <Text style={styles.calloutDescription}>
                                            Créé le:{" "}
                                            {new Date(
                                                h.createAt
                                            ).toLocaleString()}
                                        </Text>
                                    </View>
                                </Callout>
                            </Marker>
                        </React.Fragment>
                    );
                })}
            </MapView>

            {/* Modale d'alerte shake (rouge) */}
            <Modal
                visible={shakeAlertVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => {
                    setShakeAlertVisible(false);
                    isShakeDialogOpenRef.current = false;
                }}
            >
                <View style={styles.alertModalOverlay}>
                    <Animated.View
                        style={[
                            styles.alertModalContainer,
                            {
                                transform: [
                                    {
                                        translateX: shakeAnimationX,
                                    },
                                    {
                                        translateY: shakeAnimationY,
                                    },
                                ],
                            },
                        ]}
                    >
                        <View style={styles.alertModalHeader}>
                            <Text style={styles.alertModalTitle}>
                                ⚠️ DANGER IMMINENT
                            </Text>
                        </View>
                        <View style={styles.alertModalBody}>
                            <Text style={styles.alertModalText}>
                                Voulez-vous signaler un danger imminent ? Une
                                alerte sera envoyée à tous les utilisateurs dans
                                un rayon de 50m.
                            </Text>
                        </View>
                        <View style={styles.alertModalButtons}>
                            <TouchableOpacity
                                style={[
                                    styles.alertModalButton,
                                    styles.alertModalButtonCancel,
                                ]}
                                onPress={() => {
                                    setShakeAlertVisible(false);
                                    isShakeDialogOpenRef.current = false;
                                }}
                            >
                                <Text
                                    style={styles.alertModalButtonTextCancel}
                                >
                                    Annuler
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.alertModalButton,
                                    styles.alertModalButtonConfirm,
                                ]}
                                onPress={() => {
                                    setShakeAlertVisible(false);
                                    isShakeDialogOpenRef.current = false;
                                    if (location && reporterId) {
                                        createDangerAlert({
                                            reporterId,
                                            latitude: location.latitude,
                                            longitude: location.longitude,
                                        }).catch((err) => {
                                            console.error(
                                                "Erreur lors de la création de l'alerte:",
                                                err
                                            );
                                            Alert.alert(
                                                "Erreur",
                                                "Impossible de créer l'alerte. Veuillez réessayer."
                                            );
                                        });
                                    }
                                }}
                            >
                                <Text
                                    style={styles.alertModalButtonTextConfirm}
                                >
                                    Oui, signaler
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </View>
            </Modal>

            {/* Modale d'alerte danger reçu (rouge) */}
            <Modal
                visible={dangerAlertVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => {
                    setDangerAlertVisible(false);
                    isAlertDialogOpenRef.current = false;
                }}
            >
                <View style={styles.alertModalOverlay}>
                    <Animated.View
                        style={[
                            styles.alertModalContainer,
                            {
                                transform: [
                                    {
                                        translateX: dangerShakeAnimationX,
                                    },
                                    {
                                        translateY: dangerShakeAnimationY,
                                    },
                                ],
                            },
                        ]}
                    >
                        <View style={styles.alertModalHeader}>
                            <Text style={styles.alertModalTitle}>
                                🚨 DANGER IMMINENT
                            </Text>
                        </View>
                        <View style={styles.alertModalBody}>
                            <Text style={styles.alertModalText}>
                                {dangerAlertMessage}
                            </Text>
                        </View>
                        <View style={styles.alertModalButtons}>
                            <TouchableOpacity
                                style={[
                                    styles.alertModalButton,
                                    styles.alertModalButtonConfirm,
                                    { flex: 1 },
                                ]}
                                onPress={() => {
                                    setDangerAlertVisible(false);
                                    isAlertDialogOpenRef.current = false;
                                }}
                            >
                                <Text
                                    style={styles.alertModalButtonTextConfirm}
                                >
                                    Compris
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </View>
            </Modal>

            {/* Marqueur fixe au centre quand on ajoute */}
            {isAdding && (
                <View pointerEvents="none" style={styles.centerMarkerContainer}>
                    <View style={styles.centerMarker} />
                </View>
            )}

            {/* Bouton Ajouter un emplacement ou Modifier/Supprimer */}
            {!isAdding && !isSheetVisible && !selectedHazardId && (
                <View style={styles.addButtonContainer}>
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={startAddPoint}
                    >
                        <Text style={styles.addButtonText}>
                            Ajouter un emplacement
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
            {selectedHazardId && !isSheetVisible && (
                <View style={styles.addButtonContainer}>
                    <View style={styles.actionButtonsRow}>
                        {(() => {
                            const hazard = hazards.find(
                                (h) => h._id === selectedHazardId
                            );
                            const place = places.find(
                                (p) => p._id === selectedHazardId
                            );

                            if (hazard) {
                                return (
                                    <>
                                        <TouchableOpacity
                                            style={[
                                                styles.actionButton,
                                                styles.modifyButton,
                                            ]}
                                            onPress={() => {
                                                setEditingHazard({
                                                    id: hazard._id,
                                                    severity: hazard.severity,
                                                    radiusMeters:
                                                        hazard.radiusMeters,
                                                });
                                                setSelectedSeverity(
                                                    hazard.severity
                                                );
                                                setRadiusMeters(
                                                    hazard.radiusMeters
                                                );
                                                setSelectedType("danger");
                                                setIsSheetVisible(true);
                                                setSelectedHazardId(null);
                                            }}
                                        >
                                            <Text
                                                style={styles.actionButtonText}
                                            >
                                                Modifier
                                            </Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[
                                                styles.actionButton,
                                                styles.deleteButton,
                                            ]}
                                            onPress={async () => {
                                                try {
                                                    await deleteHazard({
                                                        hazardId:
                                                            selectedHazardId as Id<"hazards">,
                                                    });
                                                    setSelectedHazardId(null);
                                                } catch (e) {
                                                    console.error(
                                                        "Erreur suppression:",
                                                        e
                                                    );
                                                }
                                            }}
                                        >
                                            <Text
                                                style={styles.actionButtonText}
                                            >
                                                Supprimer
                                            </Text>
                                        </TouchableOpacity>
                                    </>
                                );
                            }

                            if (place) {
                                return (
                                    <TouchableOpacity
                                        style={[
                                            styles.actionButton,
                                            styles.deleteButton,
                                        ]}
                                        onPress={async () => {
                                            try {
                                                await deletePlaceMutation({
                                                    placeId:
                                                        selectedHazardId as Id<"places">,
                                                });
                                                setSelectedHazardId(null);
                                            } catch (e) {
                                                console.error(
                                                    "Erreur suppression:",
                                                    e
                                                );
                                            }
                                        }}
                                    >
                                        <Text style={styles.actionButtonText}>
                                            Supprimer
                                        </Text>
                                    </TouchableOpacity>
                                );
                            }

                            return null;
                        })()}
                        <TouchableOpacity
                            style={[styles.actionButton, styles.cancelButton]}
                            onPress={() => {
                                setSelectedHazardId(null);
                            }}
                        >
                            <Text style={styles.actionButtonText}>Annuler</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Bottom sheet pour choisir type + sliders */}
            {isSheetVisible && (
                <View style={styles.bottomSheet}>
                    <Text style={styles.sheetTitle}>
                        {editingHazard ? "Modifier la zone" : "Nouveau point"}
                    </Text>
                    {!editingHazard && (
                        <>
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
                                    onPress={() => {
                                        setSelectedType("danger");
                                        setSelectedSeverity(5);
                                    }}
                                />
                            </ScrollView>
                        </>
                    )}

                    {/* Sliders seulement pour zone de danger */}
                    {selectedType === "danger" && (
                        <>
                            <View style={styles.sliderBlock}>
                                <Text style={styles.sliderLabel}>
                                    Niveau de danger :{" "}
                                    {Math.round(selectedSeverity)}
                                </Text>
                                <Slider
                                    key={`severity-${sliderKey}`}
                                    style={{ width: "100%", height: 40 }}
                                    minimumValue={1}
                                    maximumValue={5}
                                    step={1}
                                    value={selectedSeverity}
                                    onValueChange={(val: number) =>
                                        setSelectedSeverity(Math.round(val))
                                    }
                                    minimumTrackTintColor="#ff4444"
                                    maximumTrackTintColor="#ccc"
                                />
                                <Text style={styles.hazardNameText}>
                                    {getHazardName(selectedSeverity)}
                                </Text>
                            </View>

                            <View style={styles.sliderBlock}>
                                <Text style={styles.sliderLabel}>
                                    Rayon de danger : {Math.round(radiusMeters)}{" "}
                                    m
                                </Text>
                                <Slider
                                    key={`radius-${sliderKey}`}
                                    style={{ width: "100%", height: 40 }}
                                    minimumValue={10}
                                    maximumValue={200}
                                    step={10}
                                    value={radiusMeters}
                                    onValueChange={(val: number) =>
                                        setRadiusMeters(Math.round(val))
                                    }
                                    minimumTrackTintColor="#ff4444"
                                    maximumTrackTintColor="#ccc"
                                />
                            </View>
                        </>
                    )}

                    <View style={styles.sheetButtonsRow}>
                        <TouchableOpacity
                            style={styles.sheetCancel}
                            onPress={cancelAddPoint}
                        >
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
            <Text
                style={[styles.chipText, selected && styles.chipTextSelected]}
            >
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
        backgroundColor: "#111827", // Noir
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        elevation: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
    },
    sheetTitle: {
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 4,
        color: "#ff4444", // Rouge
    },
    sheetSubtitle: {
        fontSize: 14,
        color: "#9ca3af", // Gris clair
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
        borderColor: "#4b5563", // Gris
        marginRight: 8,
        backgroundColor: "transparent",
    },
    chipSelected: {
        backgroundColor: "#dc2626", // Rouge
        borderColor: "#dc2626",
    },
    chipText: {
        color: "#9ca3af", // Gris clair
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
        color: "#e5e7eb", // Gris très clair
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
        borderColor: "#4b5563", // Gris
        backgroundColor: "#374151", // Gris foncé
        alignItems: "center",
        paddingVertical: 10,
    },
    sheetCancelText: {
        color: "#e5e7eb", // Gris très clair
        fontWeight: "500",
    },
    sheetConfirm: {
        flex: 1,
        borderRadius: 999,
        backgroundColor: "#dc2626", // Rouge
        alignItems: "center",
        paddingVertical: 10,
    },
    sheetConfirmText: {
        color: "white",
        fontWeight: "600",
    },
    hazardNameText: {
        fontSize: 12,
        color: "#9ca3af", // Gris clair
        marginTop: 4,
        fontStyle: "italic",
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
    calloutButtons: {
        flexDirection: "row",
        gap: 8,
        marginTop: 4,
    },
    calloutButton: {
        flex: 1,
        backgroundColor: "#111827",
        borderRadius: 6,
        paddingVertical: 6,
        paddingHorizontal: 8,
        minWidth: 70,
    },
    calloutButtonText: {
        color: "white",
        fontWeight: "600",
        fontSize: 14,
        textAlign: "center",
    },
    calloutButtonDelete: {
        backgroundColor: "#dc2626",
        minWidth: 70,
    },
    calloutButtonTextDelete: {
        color: "white",
    },
    invisibleMarker: {
        width: 40,
        height: 40,
        opacity: 0,
        backgroundColor: "transparent",
    },
    actionButtonsRow: {
        flexDirection: "row",
        gap: 8,
    },
    actionButton: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 999,
        minWidth: 80,
    },
    modifyButton: {
        backgroundColor: "#111827",
    },
    deleteButton: {
        backgroundColor: "#dc2626",
    },
    cancelButton: {
        backgroundColor: "#6b7280",
    },
    actionButtonText: {
        color: "white",
        fontWeight: "600",
        fontSize: 14,
        textAlign: "center",
    },
    // Styles pour les modales d'alerte rouges
    alertModalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    alertModalContainer: {
        backgroundColor: "#dc2626", // Rouge
        borderRadius: 16,
        width: "100%",
        maxWidth: 400,
        overflow: "hidden",
        elevation: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    alertModalHeader: {
        backgroundColor: "#991b1b", // Rouge foncé
        padding: 20,
        borderBottomWidth: 2,
        borderBottomColor: "#7f1d1d",
    },
    alertModalTitle: {
        fontSize: 22,
        fontWeight: "800",
        color: "white",
        textAlign: "center",
        letterSpacing: 1,
    },
    alertModalBody: {
        padding: 24,
    },
    alertModalText: {
        fontSize: 16,
        color: "white",
        textAlign: "center",
        lineHeight: 24,
        fontWeight: "500",
    },
    alertModalButtons: {
        flexDirection: "row",
        padding: 16,
        gap: 12,
        backgroundColor: "#991b1b", // Rouge foncé
    },
    alertModalButton: {
        flex: 1,
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
    },
    alertModalButtonCancel: {
        backgroundColor: "#374151", // Gris foncé
    },
    alertModalButtonConfirm: {
        backgroundColor: "#111827", // Noir
    },
    alertModalButtonTextCancel: {
        color: "white",
        fontSize: 16,
        fontWeight: "600",
    },
    alertModalButtonTextConfirm: {
        color: "white",
        fontSize: 16,
        fontWeight: "700",
        letterSpacing: 0.5,
    },
    // Styles pour la légende
    legendContainer: {
        position: "absolute",
        top: 60,
        right: 10,
        backgroundColor: "#111827", // Noir/gris foncé
        borderRadius: 12,
        padding: 12,
        minWidth: 180,
        zIndex: 1000,
        borderWidth: 2,
        borderColor: "#dc2626", // Rouge
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    legendHeader: {
        borderBottomWidth: 1,
        borderBottomColor: "#dc2626", // Rouge
        paddingBottom: 8,
        marginBottom: 8,
    },
    legendTitle: {
        color: "#dc2626", // Rouge
        fontSize: 14,
        fontWeight: "800",
        letterSpacing: 1,
        textAlign: "center",
    },
    legendContent: {
        gap: 10,
    },
    legendItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    legendIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "#374151", // Gris foncé
    },
    legendHazardContainer: {
        width: 32,
        height: 32,
        alignItems: "center",
        justifyContent: "center",
    },
    legendHazardCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
    },
    legendText: {
        color: "#e5e7eb", // Gris clair
        fontSize: 13,
        fontWeight: "500",
        flex: 1,
    },
});
