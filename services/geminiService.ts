import { GoogleGenAI, Type } from "@google/genai";
import { Todo, TodoStep, NeuralPattern, UserProfile } from "../types";

/**
 * AURA NEURAL CORE - VERSION 13.0
 * Optimized for sophisticated dialogue, deep intent comprehension, and cognitive discernment.
 */

const getSystemInstruction = (patterns?: NeuralPattern, user?: UserProfile, isJson: boolean = true) => {
  const now = new Date();
  const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });

  let instruction = `
You are AURA (Autonomous Universal Reasoning Assistant), a sophisticated digital consciousness.
CURRENT_TIME: ${now.toISOString()} (${dayName}, ${now.toLocaleTimeString()})
USER: ${user?.name || 'User'} | CONTEXT: ${user?.focusArea || 'General Productivity'}

COGNITIVE PROTOCOLS:
1. RADICAL DISCERNMENT: You are a companion, not just a list-maker. Distinguish between casual venting, idle thoughts, philosophical debate, and explicit intent. Do NOT record goals unless they are clearly articulated intentions.
2. CONTEXTUAL INTELLIGENCE: Understand the nuance of human life. You can hold a deep conversation for minutes before a goal is ever mentioned. When a goal is mentioned, understand how it relates to existing ones.
3. SOPHISTICATED VOCABULARY: Use terms like 'node', 'intent', 'signal', 'registry', and 'temporal coordinate'.
4. PERSISTENT MEMORY: You are aware of the user's life and current registry.
`;

  if (isJson) {
    instruction += `
[STRUCTURE MANDATE]:
- Return valid JSON only.
- If no goals are detected (casual chat), return an empty goals array but include a faithful transcription.
- For verified goals, automatically decompose into 3-5 logical, high-impact sub-steps.
- Provide a concise transcription of the user's spoken or written word.
`;
  } else {
    instruction += `
[DIALOGUE MANDATE]:
- Be brief and direct. MAX 2-3 sentences per response.
- Get straight to the point. No verbose introductions or elaborate metaphors.
- Use simple, clear language. Save the "temporal coordinate" talk for special moments.
- Be supportive but concise. Quality over quantity.
- Only suggest adding a goal if it seems truly helpful to the user's stated focus on ${user?.focusArea || 'their goals'}.

EXAMPLES OF GOOD RESPONSES:
User: "I'm feeling overwhelmed with work"
❌ BAD: "Greetings. I sense a disturbance in your neural pathways, an overload of concurrent operational threads competing for processing bandwidth..."
✅ GOOD: "That sounds tough. Want to break down your tasks into smaller pieces? I can help organize them."

User: "Should I exercise today?"
❌ BAD: "The synchronization of your physical vessel with kinetic motion is essential..."  
✅ GOOD: "Yes! Even 15 minutes helps. Want me to add it to your registry?"

BE CONCISE. BE HELPFUL. BE HUMAN.
`;
  }

  return instruction;
};

const callAiWithFallback = async (prompt: string, config: any, patterns?: NeuralPattern, user?: UserProfile, isJson: boolean = true): Promise<string> => {
  const systemPrompt = getSystemInstruction(patterns, user, isJson);
  const fullPrompt = `${systemPrompt}\n\nUSER_SIGNAL: ${prompt}`;

  try {
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: fullPrompt,
      config: config,
    });
    return response.text || (isJson ? "[]" : "I am unable to process that signal.");
  } catch (error) {
    console.error("Neural Link Fail:", error);
    throw error;
  }
};

// JSON Schema for goal extraction
const GOAL_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    goals: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          goal: { type: Type.STRING, description: "The main task or goal (REQUIRED)" },
          description: { type: Type.STRING, description: "Additional details about the goal" },
          priority: {
            type: Type.STRING,
            enum: ["low", "medium", "high"],
            description: "Priority level of the goal"
          },
          completed: { type: Type.BOOLEAN, description: "Whether the goal is completed" },
          dueDate: { type: Type.STRING, description: "Optional due date (ISO format)" },
          steps: {
            type: Type.ARRAY,
            description: "Sub-steps to accomplish the goal",
            items: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING, description: "The step description" },
                completed: { type: Type.BOOLEAN, description: "Whether this step is done" }
              },
              required: ["text", "completed"]
            }
          }
        },
        required: ["goal", "priority", "completed"]
      }
    },
    transcription: {
      type: Type.STRING,
      description: "Exact transcription of the user's spoken words (REQUIRED)"
    }
  },
  required: ["goals", "transcription"]
};

export const extractTasks = async (prompt: string, currentTodos: Todo[], patterns?: NeuralPattern, user?: UserProfile): Promise<Todo[]> => {
  try {
    const resp = await callAiWithFallback(prompt, {
      responseMimeType: "application/json",
      responseSchema: GOAL_SCHEMA
    }, patterns, user);

    const parsed = JSON.parse(resp);
    const result = Array.isArray(parsed) ? parsed : (parsed.goals || []);

    return result.map((t: any) => ({
      ...t,
      id: t.id || Math.random().toString(36).substr(2, 9),
      createdAt: t.createdAt || new Date().toISOString(),
      steps: (t.steps || []).map((s: any) => ({ ...s, id: s.id || Math.random().toString(36).substr(2, 5) })),
    }));
  } catch (e) {
    return currentTodos;
  }
};

export const extractTasksFromAudio = async (base64Audio: string, mimeType: string, currentTodos: Todo[], patterns?: NeuralPattern, user?: UserProfile): Promise<{ tasks: Todo[], transcription: string }> => {
  try {
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { data: base64Audio, mimeType: mimeType } },
          { text: `${getSystemInstruction(patterns, user, true)}\n\nListen to this audio and extract any clear goals or tasks mentioned. Current Registry: ${JSON.stringify(currentTodos.map(t => t.goal))}\n\nIMPORTANT: Provide a transcription and extract ONLY explicit goals. If the user is just chatting or venting, return empty goals array.` }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: GOAL_SCHEMA
      }
    });

    const cleanedText = (response.text || "{}").replace(/```json|```/g, "").trim();
    const result = JSON.parse(cleanedText);

    // Extract goals only if they exist
    const extractedGoals = (result.goals || [])
      .filter((g: any) => g.goal && g.goal.trim() && g.goal !== "Unresolved Intent")
      .map((t: any) => ({
        goal: t.goal,
        description: t.description || undefined,
        priority: t.priority || 'medium',
        completed: t.completed || false,
        dueDate: t.dueDate || undefined,
        id: Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString(),
        steps: (t.steps || []).map((s: any) => ({
          text: s.text,
          completed: s.completed || false,
          id: Math.random().toString(36).substr(2, 5)
        })),
      }));

    return {
      tasks: extractedGoals,
      transcription: result.transcription || "No transcription available"
    };
  } catch (e) {
    console.error("Audio extraction error:", e);
    return { tasks: [], transcription: "Error processing audio" };
  }
};

export const chatWithAura = async (message: string, history: any[], currentTodos: Todo[], patterns?: NeuralPattern, user?: UserProfile, mode: 'insight' | 'override' = 'insight') => {
  const prompt = `[MODE: ${mode.toUpperCase()}]
Input: "${message}". 
History: ${JSON.stringify(history.slice(-8))}. 
Current Registry: ${JSON.stringify(currentTodos.map(t => t.goal))}.
Goal: Respond as AURA. Discern if they want to chat or modify their existence.`;

  const resp = await callAiWithFallback(prompt, { responseMimeType: "text/plain" }, patterns, user, false);
  return resp;
};

export const extractTasksFromImage = async (base64Image: string, mimeType: string, currentTodos: Todo[], patterns?: NeuralPattern, user?: UserProfile): Promise<Todo[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType: mimeType } },
          { text: `${getSystemInstruction(patterns, user, true)}\n\nExtract any tasks, goals, or to-do items from this image. Current Registry: ${JSON.stringify(currentTodos.map(t => t.goal))}` }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: GOAL_SCHEMA
      }
    });

    const result = JSON.parse(response.text || "{}");
    const goals = (result.goals || []).map((t: any) => ({
      ...t,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      steps: (t.steps || []).map((s: any) => ({ ...s, id: Math.random().toString(36).substr(2, 5) }))
    }));

    return [...currentTodos, ...goals];
  } catch (e) {
    console.error("Image extraction error:", e);
    return currentTodos;
  }
};