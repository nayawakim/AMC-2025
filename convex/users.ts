import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Mettre à jour la position de l'utilisateur
export const updateUserLocation = mutation({
    args: {
        userId: v.string(),
        latitude: v.number(),
        longitude: v.number(),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("users")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .first();

        if (existing) {
            // Mettre à jour la position existante
            await ctx.db.patch(existing._id, {
                latitude: args.latitude,
                longitude: args.longitude,
                lastSeen: Date.now(),
            });
        } else {
            // Créer un nouvel utilisateur avec infected = false par défaut
            await ctx.db.insert("users", {
                userId: args.userId,
                latitude: args.latitude,
                longitude: args.longitude,
                lastSeen: Date.now(),
                isInfected: false,
            });
        }
    },
});

// Récupérer tous les utilisateurs actifs (vu dans les 30 dernières secondes)
export const getActiveUsers = query({
    args: {},
    handler: async (ctx) => {
        const thirtySecondsAgo = Date.now() - 30000; // 30 secondes
        const allUsers = await ctx.db
            .query("users")
            .withIndex("by_lastSeen")
            .filter((q) => q.gte(q.field("lastSeen"), thirtySecondsAgo))
            .collect();

        return allUsers;
    },
});

// Marquer un utilisateur comme infecté (appelé lors du scan d'un QR code infecté)
export const markUserAsInfected = mutation({
    args: {
        userId: v.string(), // QR code ID de la personne infectée
    },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .first();

        if (user) {
            // Mettre à jour le statut d'infection
            await ctx.db.patch(user._id, {
                isInfected: true,
            });
            console.log("Utilisateur marqué comme infecté:", args.userId);
        } else {
            // Si l'utilisateur n'existe pas encore, on ne fait rien
            // Il sera marqué comme infecté quand il se connectera
            console.log("Utilisateur non trouvé pour marquer comme infecté:", args.userId);
        }
    },
});

