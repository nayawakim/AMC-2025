import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Fonction pour calculer la distance en mètres entre deux points GPS
function distanceInMeters(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 6371000; // Rayon de la Terre en mètres
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Créer une alerte de danger imminent
export const createDangerAlert = mutation({
    args: {
        reporterId: v.string(),
        latitude: v.number(),
        longitude: v.number(),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        const expiresAt = now + 5 * 60 * 1000; // Expire après 5 minutes

        await ctx.db.insert("dangerAlerts", {
            reporterId: args.reporterId,
            latitude: args.latitude,
            longitude: args.longitude,
            createdAt: now,
            expiresAt,
        });

        console.log("Alerte de danger créée:", {
            reporterId: args.reporterId,
            latitude: args.latitude,
            longitude: args.longitude,
        });
    },
});

// Récupérer les alertes actives dans un rayon de 50m
export const getActiveAlertsNearby = query({
    args: {
        latitude: v.number(),
        longitude: v.number(),
        radiusMeters: v.number(), // 50m par défaut
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        
        // Récupérer toutes les alertes non expirées
        const allAlerts = await ctx.db
            .query("dangerAlerts")
            .withIndex("by_expiresAt")
            .filter((q) => q.gte(q.field("expiresAt"), now))
            .collect();

        // Filtrer par distance
        const nearbyAlerts = allAlerts.filter((alert) => {
            const distance = distanceInMeters(
                args.latitude,
                args.longitude,
                alert.latitude,
                alert.longitude
            );
            return distance <= args.radiusMeters;
        });

        // Calculer la distance pour chaque alerte
        return nearbyAlerts.map((alert) => {
            const distance = distanceInMeters(
                args.latitude,
                args.longitude,
                alert.latitude,
                alert.longitude
            );
            return {
                ...alert,
                distanceMeters: Math.round(distance),
            };
        });
    },
});

// Nettoyer les alertes expirées (peut être appelé périodiquement)
export const cleanupExpiredAlerts = mutation({
    args: {},
    handler: async (ctx) => {
        const now = Date.now();
        const expiredAlerts = await ctx.db
            .query("dangerAlerts")
            .withIndex("by_expiresAt")
            .filter((q) => q.lt(q.field("expiresAt"), now))
            .collect();

        for (const alert of expiredAlerts) {
            await ctx.db.delete(alert._id);
        }

        return { deleted: expiredAlerts.length };
    },
});

