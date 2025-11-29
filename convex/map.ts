import { query } from "./_generated/server";

export const getMapData = query({
    args: {},
    handler: async (ctx) => {
        const places = await ctx.db.query("places").collect();
        const hazards = await ctx.db.query("hazards").collect();

        return { places, hazards };
    },
});
