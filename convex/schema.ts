import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { PLACE_TYPE_VALUES } from "../constants";

const placeTypeValidator = v.union(...PLACE_TYPE_VALUES.map(v.literal));

export default defineSchema({
    //ravitaillement places and shelters
    places: defineTable({
        name: v.string(),
        type: placeTypeValidator, //water, food, shelter, etc.
        latitude: v.number(),
        longitude: v.number(),
        createdAt: v.number(), //timestamp
    }),
    //zone for hazards
    hazards: defineTable({
        name: v.string(),
        latitude: v.number(),
        longitude: v.number(),
        radiusMeters: v.number(),
        severity: v.number(), //1-5
        createAt: v.number(), //timestamp
    }),

    placeReports: defineTable({
        type: placeTypeValidator, //water, food, shelter, etc.
        latitude: v.number(),
        longitude: v.number(),
        cellLat: v.number(),
        cellLong: v.number(),
        createdAt: v.number(), //timestamp
        reporterId: v.string(),
    }).index("by_cell", ["cellLat", "cellLong"]),

    hazardReports: defineTable({
        severity: v.number(), //1-5
        latitude: v.number(),
        longitude: v.number(),
        cellLat: v.number(),
        cellLong: v.number(),
        createdAt: v.number(), //timestamp
        reporterId: v.string(),
    }).index("by_cell", ["cellLat", "cellLong"]),
});
