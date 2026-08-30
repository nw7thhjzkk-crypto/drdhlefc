"use client";

import { useState, useTransition } from "react";
import { generateInsights } from "../actions";

export default function AskAI({ memberContext }: { memberContext: string }) {
  const [prompt, setPrompt] = useState("");
  const [insight, setInsight] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleAsk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    startTransition(async () => {
      const fullPrompt = `Context about the gym member:\n${memberContext}\n\nMember's question: ${prompt}`;
      try {
          const response = await generateInsights(fullPrompt);
          setInsight(response);
      } catch (error: unknown) {
          setInsight("Error generating insight.");
          console.error(error);
      }
    });
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg shadow-xl col-span-1 md:col-span-3 mt-8">
      <h2 className="text-lg font-medium text-zinc-100 mb-4 border-b border-zinc-800 pb-2">Ask Gemini AI</h2>

      <form onSubmit={handleAsk} className="flex flex-col space-y-4">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask a question about your diet, workouts, or general fitness..."
          className="w-full bg-zinc-950 border border-zinc-700 rounded p-3 text-sm text-zinc-200"
          rows={3}
          required
        ></textarea>

        <button
          type="submit"
          disabled={isPending}
          className="bg-yellow-600 text-zinc-950 font-bold px-4 py-2 rounded hover:bg-yellow-500 w-fit self-end disabled:opacity-50"
        >
          {isPending ? "Generating Insight..." : "Ask AI"}
        </button>
      </form>

      {insight && (
        <div className="mt-6 bg-zinc-950 p-4 rounded border border-zinc-700">
            <h3 className="text-sm font-bold text-yellow-500 mb-2">AI Insight:</h3>
            <div className="text-sm text-zinc-300 whitespace-pre-wrap">{insight}</div>
        </div>
      )}
    </div>
  );
}
