
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const simulateLocalParticipants = async (location: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Simulate 3 unique people who might be nearby at this location: ${location}. 
      Give them short, catchy nicknames and a short "status" message that sounds like something someone would say in a proximity chat (casual, context-aware). 
      Format as JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              nickname: { type: Type.STRING },
              status: { type: Type.STRING },
              distance: { type: Type.NUMBER, description: "Distance in meters (between 5 and 50)" }
            },
            required: ["nickname", "status", "distance"]
          }
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Error:", error);
    return [];
  }
};

export const getGeminiResponse = async (userMessage: string, location: string, history: {role: string, text: string}[]) => {
  try {
    const chat = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: `You are part of a mesh-network proximity chat. The user is at ${location}. 
        You are simulating a helpful "Local Intelligence" bot named PROXIMA. 
        Keep responses extremely short (max 2 sentences), punchy, and helpful. 
        If they ask about the area, give them a cool fact. 
        If they are just chatting, be their proximity buddy.`,
      }
    });

    const response = await chat.sendMessage({ message: userMessage });
    return response.text;
  } catch (error) {
    return "Mesh link unstable. Check proximity...";
  }
};
