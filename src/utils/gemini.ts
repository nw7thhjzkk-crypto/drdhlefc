
// Gemini AI integration

export async function getGeminiInsights(prompt: string): Promise<string | null> {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }

  // TODO: implement real Gemini API call
  void prompt;
  throw new Error("Gemini integration not yet implemented");
}
