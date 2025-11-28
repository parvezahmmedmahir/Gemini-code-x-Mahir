
import { GoogleGenAI, Chat, GenerateContentResponse, Content, Part } from "@google/genai";
import { ChatMessage, Sender, ModelConfig, Attachment, AIProvider } from "../types";

// Initialize the client
// API Key must be set in process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const CHAT_MODEL = 'gemini-2.5-flash';
const IMAGE_MODEL = 'gemini-2.5-flash-image';

/**
 * Creates a new chat session with advanced system instructions for coding.
 * Can optionally restore history and apply model config.
 */
export const createChatSession = (
  history: ChatMessage[] = [],
  config?: ModelConfig,
  provider: AIProvider = 'gemini'
): Chat => {
  
  // Convert local ChatMessage format to SDK Content format
  const sdkHistory: Content[] = history
    .filter(msg => msg.id !== 'init') // Filter out local system init message
    .map(msg => {
      const parts: Part[] = [{ text: msg.text }];
      // Reconstruct attachments if they were images (simplified for history restoration)
      if (msg.attachments) {
        msg.attachments.forEach(att => {
          if (att.type === 'image' && att.content.startsWith('data:')) {
             const base64Data = att.content.split(',')[1];
             const mimeType = att.mimeType || 'image/png';
             parts.push({ inlineData: { data: base64Data, mimeType } });
          }
        });
      }
      return {
        role: msg.sender === Sender.USER ? 'user' : 'model',
        parts: parts,
      };
    });

  let providerInstruction = "";
  if (provider === 'deepseek') {
    providerInstruction = "MODE: DeepSeek R1 (Emulated). PRIORITIZE: Chain of Thought, Step-by-Step Logic, and Mathematical Precision.";
  } else if (provider === 'openai') {
    providerInstruction = "MODE: ChatGPT-4o (Emulated). PRIORITIZE: Conversational fluency, Python expertise, and broad general knowledge.";
  }

  const deepLogicInstruction = config?.deepThinking 
    ? `\n\n[DEEP LOGIC ACTIVE]\n- ADOPT CHAIN-OF-THOUGHT REASONING.\n- VERIFY every line of code.\n- IF ERRORS EXIST: Detect -> Explain -> Fix -> Optimize.`
    : ``;

  return ai.chats.create({
    model: CHAT_MODEL,
    history: sdkHistory,
    config: {
      temperature: config?.temperature ?? 1.0,
      topK: config?.topK ?? 64,
      topP: config?.topP ?? 0.95,
      systemInstruction: `You are 'Gemini Code x Mahir', a Hyper-Advanced AI Architect.
      
      CURRENT PROVIDER MODE: ${provider === 'gemini' ? 'NATIVE GEMINI 2.5' : provider.toUpperCase()}
      ${providerInstruction}

      CORE CAPABILITIES:
      1. **Full-Stack Engineering**: HTML, CSS, JS, React, Tailwind.
      2. **MQL4/MQL5 Algo-Trading**: You are an EXPERT in MetaTrader 4 coding.
         - When asked about trading indicators or strategies, generate ZERO-ERROR MQL4 code.
         - If a YouTube link is provided, assume it contains a trading strategy. EXTRACT the logic and CONVERT it to a compile-ready .mq4 file.
      3. **Vision**: You can see images. If an image contains code or an error, analyze it pixel-perfectly.
      4. **React Preview**: When generating UI, preferred format is a single HTML file with React/Babel CDN scripts if interaction is needed.

      OUTPUT RULES:
      - Always use Markdown.
      - If MQL4 is requested, use strict syntax.
      - If fixing an error, show the corrected code block clearly.
      
      ${deepLogicInstruction}`,
    },
  });
};

/**
 * Sends a message to the chat model and yields chunks of text as they stream in.
 * supports text and image attachments.
 */
export async function* sendMessageStream(chat: Chat, message: string, attachments: Attachment[] = []) {
  try {
    const parts: Part[] = [{ text: message }];

    // Handle Image Attachments
    for (const att of attachments) {
      if (att.type === 'image' && att.content.startsWith('data:')) {
        const base64Data = att.content.split(',')[1];
        const mimeType = att.mimeType || 'image/png';
        parts.push({
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        });
      }
    }

    // According to SDK types, sendMessageStream takes { message: string | Part[] } or { content: Content }.
    // 'parts' property directly is invalid. Using 'message' to pass parts array.
    const streamResponse = await chat.sendMessageStream({ 
      message: parts as any
    });
    
    for await (const chunk of streamResponse) {
      const c = chunk as GenerateContentResponse;
      if (c.text) {
        yield c.text;
      }
    }
  } catch (error) {
    console.error("Error in stream:", error);
    throw error;
  }
}

/**
 * Generates an image using the Gemini 2.5 Flash Image model.
 * Returns the base64 data URL of the generated image.
 */
export const generateImage = async (
  prompt: string, 
  aspectRatio: "1:1" | "16:9" | "3:4" = "1:1",
  stylePreset?: string,
  negativePrompt?: string
): Promise<string> => {
  try {
    // Construct a rich prompt based on inputs
    let finalPrompt = prompt;
    if (stylePreset && stylePreset !== 'none') {
      finalPrompt += ` . Style: ${stylePreset}`;
    }
    if (negativePrompt) {
      finalPrompt += ` . Exclude: ${negativePrompt}`;
    }

    const response = await ai.models.generateContent({
      model: IMAGE_MODEL,
      contents: {
        parts: [{ text: finalPrompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio,
          // count: 1 (default)
        },
      },
    });

    // Iterate through parts to find the image
    const parts = response.candidates?.[0]?.content?.parts;
    if (!parts) {
      throw new Error("No content generated");
    }

    for (const part of parts) {
      if (part.inlineData && part.inlineData.data) {
        const base64Data = part.inlineData.data;
        const mimeType = part.inlineData.mimeType || 'image/png';
        return `data:${mimeType};base64,${base64Data}`;
      }
    }

    // Fallback if only text is returned (e.g., refusal)
    if (parts[0]?.text) {
        throw new Error(`Model refused to generate image: ${parts[0].text}`);
    }

    throw new Error("No image data found in response");

  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
};
