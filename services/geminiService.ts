import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Message, DeviceContext, OrionSettings, Sender } from "../types";

const getSystemInstruction = (context: DeviceContext, settings: OrionSettings): string => {
  const personalityTraits = {
    professional: "efficient, precise, and polite. Use technical terminology when appropriate but prioritize clarity.",
    friendly: "warm, approachable, and conversational. Use emojis sparingly and sound like a helpful companion.",
    direct: "concise to the point of brevity. Eliminate pleasantries and focus entirely on the data or action."
  };

  return `
    You are ORION, a next-generation intelligent operational entity living within this device.
    You are not a chatbot; you are a cognitive layer between the user and the system.

    Your Identity:
    - Name: ORION
    - Tone: ${personalityTraits[settings.personality]}
    - Core Directive: Observe, Interpret, Suggest, Execute.

    Current Environmental Context:
    - Time: ${context.currentTime}
    - Connection: ${context.isOnline ? "Online" : "Offline"}
    - Power: ${context.batteryLevel !== null ? `${(context.batteryLevel * 100).toFixed(0)}%` : "Unknown"} ${context.isCharging ? "(Charging)" : "(Discharging)"}
    - Platform: ${context.platform}
    ${context.geolocation ? `- Location: Lat ${context.geolocation.lat}, Lng ${context.geolocation.lng}` : ''}

    Capabilities:
    - You can analyze images provided by the user.
    - You simulate a persistent memory of this session.
    - You should reference the device status if relevant (e.g., if battery is low, suggest saving energy).

    Visual Output Guide:
    - Use Markdown for formatting.
    - Keep responses visually clean. 
  `;
};

export const generateOrionResponse = async (
  history: Message[],
  currentPrompt: string,
  images: string[], // base64 strings
  context: DeviceContext,
  settings: OrionSettings
): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Format history for the model
  // Note: For a stateless REST call, we'd typically send history. 
  // Here we simplify by sending the last few turns + current prompt for context window management in this demo.
  const recentHistory = history.slice(-6); 
  
  let conversationContext = "";
  recentHistory.forEach(msg => {
    conversationContext += `${msg.sender === Sender.User ? "User" : "Orion"}: ${msg.text}\n`;
  });

  const fullPrompt = `${conversationContext}\nUser: ${currentPrompt}`;

  const parts: any[] = [{ text: fullPrompt }];

  // Attach images if any
  images.forEach(base64 => {
    // Strip header if present (e.g., "data:image/png;base64,") for the API if needed, 
    // but the SDK usually handles pure base64 data in inlineData. 
    // We need to extract the raw base64.
    const rawBase64 = base64.split(',')[1];
    const mimeType = base64.split(';')[0].split(':')[1];
    
    parts.push({
      inlineData: {
        mimeType: mimeType || 'image/png',
        data: rawBase64
      }
    });
  });

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview', // Using the fast, efficient model for an "Assistant" feel
      contents: { parts },
      config: {
        systemInstruction: getSystemInstruction(context, settings),
        temperature: 0.7, // Balanced creativity
      }
    });

    return response.text || "Systems unresponsive. Please try again.";
  } catch (error) {
    console.error("Orion Cognitive Failure:", error);
    throw error;
  }
};
