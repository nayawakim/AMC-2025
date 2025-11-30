import { action } from "./_generated/server";
import { v } from "convex/values";

export const sendMessage = action({
  args: {
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error("OPENAI_API_KEY not configured in Convex environment");
    }

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "Tu es une IA conseillère dans une apocalypse zombie."
            },
            {
              role: "user",
              content: args.message
            }
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return {
        reply: data.choices[0].message.content
      };
    } catch (error) {
      console.error("Error calling OpenAI:", error);
      throw error;
    }
  },
});
