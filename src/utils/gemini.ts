import { GoogleGenerativeAI } from "@google/generative-ai";

// Gemini AI integration
export async function getGeminiInsights(prompt: string) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return "Error: GEMINI_API_KEY is not configured in the environment.";
  }

  try {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return text;
  } catch (error: unknown) {
    console.error("Gemini AI Error:", error);
    return `Error generating insights: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}
