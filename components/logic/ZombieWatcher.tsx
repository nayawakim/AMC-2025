// components/ZombieWatcher.tsx

import React, { useEffect, useRef } from "react";
import { Alert } from "react-native";
import * as Location from "expo-location";

// Rayon de danger en mètres
const DANGER_RADIUS_METERS = 200;

// ⚠️ TEMP : coordonnées des zombies (à ajuster plus tard)
const ZOMBIES = [
  {
    id: "zombie-ets-1",
    latitude: 45.495,   // mets ici un point proche de toi
    longitude: -73.562, // pareil
  },
];

// Distance entre 2 points GPS en mètres (formule de Haversine)
function distanceInMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // rayon Terre
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export default function ZombieWatcher() {
  const hasAlertedRef = useRef(false);

  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;

    (async () => {
      const { status } =
        await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        console.log("Permission localisation refusée");
        return;
      }

      sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 5, // on met à jour tous les ~5m
        },
        ({ coords }) => {
          const { latitude, longitude } = coords;

          const zombieIsClose = ZOMBIES.some((z) => {
            const d = distanceInMeters(
              latitude,
              longitude,
              z.latitude,
              z.longitude
            );
            return d <= DANGER_RADIUS_METERS;
          });

          // Si un zombie est proche et qu’on n’a pas encore prévenu
          if (zombieIsClose && !hasAlertedRef.current) {
            hasAlertedRef.current = true;
            Alert.alert(
              "⚠️ Zombie proche",
              "Un zombie est à moins de 200m de toi, cours!"
            );
          }

          // Si plus aucun zombie proche → on réarme l’alerte
          if (!zombieIsClose && hasAlertedRef.current) {
            hasAlertedRef.current = false;
          }
        }
      );
    })();

    return () => {
      sub?.remove();
    };
  }, []);

  // 👇 Rien d’affiché à l’écran
  return null;
}

