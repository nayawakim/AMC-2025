import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    //ravitaillement places and shelters
    places: defineTable({
        name: v.string(),
        type: v.string(), //water, food, shelter, etc.
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
        type: v.string(), //water, food, shelter, etc.
        latitude: v.number(),
        longitude: v.number(),
        cellLat: v.number(),
        cellLong: v.number(),
        createdAt: v.number(), //timestamp
        reporterId: v.string(), // Device ID string
    }).index("by_cell", ["cellLat", "cellLong"]),

  hazardReports: defineTable({
    severity: v.number(), //1-5
    latitude: v.number(),
    longitude: v.number(),
    cellLat: v.number(),
    cellLong: v.number(),
    createdAt: v.number(), //timestamp
    reporterId: v.string(), // Device ID string
  }).index("by_cell", ["cellLat", "cellLong"]),

  // Positions des utilisateurs connectés
  users: defineTable({
    userId: v.string(), // Device ID string (lié au QR code ID)
    latitude: v.number(),
    longitude: v.number(),
    lastSeen: v.number(), //timestamp
    isInfected: v.optional(v.boolean()), // true si la personne a été scannée comme infectée
  })
    .index("by_userId", ["userId"])
    .index("by_lastSeen", ["lastSeen"]),

  // Alertes de danger imminent
  dangerAlerts: defineTable({
    reporterId: v.string(), // Device ID de la personne qui a déclenché l'alerte
    latitude: v.number(),
    longitude: v.number(),
    createdAt: v.number(), //timestamp
    expiresAt: v.number(), //timestamp - alerte expire après 5 minutes
  })
    .index("by_expiresAt", ["expiresAt"])
    .index("by_reporterId", ["reporterId"]),
});
