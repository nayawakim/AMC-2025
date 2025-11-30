import { v } from "convex/values";
import { mutation } from "./_generated/server";

function roundCoordinates(value: number){
    return Number(value.toFixed(3)); //100m de precision
}

export const reportPlace = mutation({
    args: {
        type: v.string(),
        latitude: v.number(),
        longitude: v.number(),
        reporterId: v.id("users"),
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

        const reports = await ctx.db.query("placeReports").withIndex("by_cell", q => q.eq("cellLat", cellLat).eq("cellLong", cellLong)).collect();
        const count = reports.length;
        const threshold = 3;

        const existingPlace = await ctx.db.query("places")
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
            if (count >= threshold && !existingPlace){
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
        reporterId: v.id("users"),
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

        const reports = await ctx.db.query("hazardReports").withIndex("by_cell", (q) => q.eq("cellLat", cellLat).eq("cellLong", cellLong)).collect();
        const count = reports.length;
        const threshold = 3;

        const existingHazard = await ctx.db.query("hazards")
            .filter((q) =>
                q.and(
                    q.gte(q.field("latitude"), cellLat - 0.001),
                    q.lte(q.field("latitude"), cellLat + 0.001),
                    q.gte(q.field("longitude"), cellLong - 0.001),
                    q.lte(q.field("longitude"), cellLong + 0.001)
                )
            )
            .first();
            if (count >= threshold && !existingHazard){
                await ctx.db.insert("hazards", {
                    name: "Zone de danger",
                    latitude: args.latitude,
                    longitude: args.longitude,
                    radiusMeters: args.radiusMeters,
                    severity: args.severity,
                    createAt: Date.now(),
                });
            }
    },
});