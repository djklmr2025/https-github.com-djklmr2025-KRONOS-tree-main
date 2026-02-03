
import { GoogleGenAI, Type } from "@google/genai";
import { KeyEntry } from "../types";

export const analyzeKeystrokes = async (entries: KeyEntry[]): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Format data for analysis
  const sequence = entries.map(e => e.key).join('');
  const timings = entries.map(e => e.interval).slice(0, 50); // Send subset for context

  const prompt = `
    Analyze the following keyboard activity captured by the KRONOS system.
    
    Sequence: "${sequence}"
    Timings (ms between keys): [${timings.join(', ')}]
    
    Tasks:
    1. Identify any typing patterns or habits.
    2. Detect if the sequence looks like natural language, code, or random input.
    3. Provide a brief summary of the user's focus.
    
    Note: This is a diagnostic keyboard capture.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "You are KRONOS-AI, a high-tech system analyst specializing in human-computer interaction patterns. Be concise, technical, and professional."
      }
    });

    return response.text || "Unable to generate analysis.";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "Analysis failed due to an API error.";
  }
};
