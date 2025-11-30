import { v } from "convex/values";
import { mutation } from "./_generated/server";

function roundCoordinates(value: number) {
    return Number(value.toFixed(3)); //100m de precision
}

export const reportPlace = mutation({
    args: {
        type: v.string(),
        latitude: v.number(),
        longitude: v.number(),
        reporterId: v.string(), // Device ID string
    },
    handler: async (ctx, args) => {
        const cellLat = roundCoordinates(args.latitude);
        const cellLong = roundCoordinates(args.longitude);

        await ctx.db.insert("placeReports", {
            type: args.type,
            latitude: args.latitude,
            longitude: args.longitude,
            cellLat,
            cellLong,
            createdAt: Date.now(),
            reporterId: args.reporterId,
        });

        const reports = await ctx.db
            .query("placeReports")
            .withIndex("by_cell", (q) =>
                q.eq("cellLat", cellLat).eq("cellLong", cellLong)
            )
            .collect();
        const count = reports.length;
        const threshold = 1;

        const existingPlace = await ctx.db
            .query("places")
            .filter((q) =>
                q.and(
                    q.eq(q.field("type"), args.type),
                    q.gte(q.field("latitude"), cellLat - 0.001),
                    q.lte(q.field("latitude"), cellLat + 0.001),
                    q.gte(q.field("longitude"), cellLong - 0.001),
                    q.lte(q.field("longitude"), cellLong + 0.001)
                )
            )
            .first();
        if (count >= threshold && !existingPlace) {
            await ctx.db.insert("places", {
                name: `${args.type} (confirmé)`,
                type: args.type,
                latitude: args.latitude,
                longitude: args.longitude,
                createdAt: Date.now(),
            });
        }
    },
});

export const reportHazard = mutation({
    args: {
        latitude: v.number(),
        longitude: v.number(),
        radiusMeters: v.number(),
        severity: v.number(),
        reporterId: v.string(), // Device ID string
    },
    handler: async (ctx, args) => {
        const cellLat = roundCoordinates(args.latitude);
        const cellLong = roundCoordinates(args.longitude);

        await ctx.db.insert("hazardReports", {
            latitude: args.latitude,
            longitude: args.longitude,
            severity: args.severity,
            cellLat,
            cellLong,
            createdAt: Date.now(),
            reporterId: args.reporterId,
        });

        const reports = await ctx.db
            .query("hazardReports")
            .withIndex("by_cell", (q) =>
                q.eq("cellLat", cellLat).eq("cellLong", cellLong)
            )
            .collect();
        const count = reports.length;
        const threshold = 1; // Baissé à 1 pour faciliter les tests

        const existingHazard = await ctx.db
            .query("hazards")
            .filter((q) =>
                q.and(
                    q.gte(q.field("latitude"), cellLat - 0.001),
                    q.lte(q.field("latitude"), cellLat + 0.001),
                    q.gte(q.field("longitude"), cellLong - 0.001),
                    q.lte(q.field("longitude"), cellLong + 0.001)
                )
            )
            .first();
        if (count >= threshold && !existingHazard) {
            // Nom de la zone selon le niveau de sévérité (1-5)
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

            console.log("BACKEND: CREATING OFFICIAL HAZARD", {
                count,
                threshold,
                latitude: args.latitude,
                longitude: args.longitude,
                severity: args.severity,
                radiusMeters: args.radiusMeters,
            });
            await ctx.db.insert("hazards", {
                name: getHazardName(args.severity),
                latitude: args.latitude,
                longitude: args.longitude,
                radiusMeters: args.radiusMeters,
                severity: args.severity,
                createAt: Date.now(),
            });
        } else {
            console.log("Hazard NOT created:", {
                count,
                threshold,
                needsMoreReports: count < threshold,
                existingHazard: !!existingHazard,
                cellLat,
                cellLong,
                reason: existingHazard
                    ? "Hazard already exists in this area"
                    : `Need ${threshold - count} more report(s) to create hazard`,
            });
        }
    },
});

// Modifier une zone de danger
export const updateHazard = mutation({
    args: {
        hazardId: v.id("hazards"),
        severity: v.number(),
        radiusMeters: v.number(),
    },
    handler: async (ctx, args) => {
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

        await ctx.db.patch(args.hazardId, {
            name: getHazardName(args.severity),
            severity: args.severity,
            radiusMeters: args.radiusMeters,
        });
    },
});

// Supprimer une zone de danger
export const deleteHazard = mutation({
    args: {
        hazardId: v.id("hazards"),
    },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.hazardId);
    },
});

// Supprimer un point
export const deletePlace = mutation({
    args: {
        placeId: v.id("places"),
    },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.placeId);
    },
});
