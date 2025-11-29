import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    places: defineTable({
        name: v.string(),
        type: v.string(), //water, food, shelter, etc.
        latitude: v.number(),
        longitude: v.number(),

    }),
    hazards: defineTable({
        name: v.string(),
        latitude: v.number(),
        longitude: v.number(),
        radiusMeters: v.number(),
        severity: v.number(), //1-5
  }),
});