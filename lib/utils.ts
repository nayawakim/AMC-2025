import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function offsetCoordinates(
    latitude: number,
    longitude: number,
    north: number = 0,
    south: number = 26,
    west: number = 36,
    east: number = 0
) {
    // Earth's radius in meters
    const earthRadius = 6371000;

    // Calculate net north/south movement
    const netNorthSouth = north - south; // positive = north, negative = south

    // Calculate net west/east movement
    const netWestEast = east - west; // positive = east, negative = west

    // Calculate latitude offset in degrees
    const latOffset = (netNorthSouth / earthRadius) * (180 / Math.PI);

    // Calculate longitude offset in degrees
    // Adjust for latitude to maintain consistent distance
    const lonOffset =
        (netWestEast / (earthRadius * Math.cos((latitude * Math.PI) / 180))) *
        (180 / Math.PI);

    return {
        latitude: latitude + latOffset,
        longitude: longitude + lonOffset,
    };
}
