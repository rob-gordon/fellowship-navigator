import { openrouter } from "@openrouter/ai-sdk-provider";
import { generateObject, streamText } from "ai";
import { z } from "zod";

export async function callLLM<TSchema extends z.ZodTypeAny>(
  prompt: string,
  schema: TSchema
) {
  try {
    const { object } = await generateObject({
      model: openrouter("openai/gpt-4o-mini"),
      messages: [{ role: "user", content: prompt }],
      schema,
      output: "object",
    });
    return object;
  } catch (error) {
    console.error("LLM call failed:", error);
    throw error;
  }
}
