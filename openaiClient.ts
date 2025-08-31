import OpenAI from "openai";

/**
 * The OpenAI client instance used for making API requests to OpenAI services.
 * 
 * Usage:
 *   import { openai } from "./openaiClient";
 *   // Use openai.chat.completions.create({...}) to interact with OpenAI's chat API.
 * 
 * Ensure that the OPENAI_API_KEY environment variable is set for authentication.
 */

const apiKey = process.env.OPENAI_API_KEY || "";

if (!apiKey) {
  throw new Error("Missing OpenAI API key. Please set OPENAI_API_KEY in your environment variables.");
}

export const openai = new OpenAI({
  apiKey
});
