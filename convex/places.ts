import { query } from "./_generated/server";

export const getPlaces = query({
    args: {},
    handler: async (ctx) => {
        const places = await ctx.db.query("places").collect();
        return places;
    },
});
