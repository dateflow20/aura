# GTD: Technical Systems & Neural Architecture Manual

GetThingsDone (GTD) is a multimodal productivity ecosystem. It operates on the principle of **Cognitive Discernment**, where the system distinguishes between human conversation and actionable intent.

## 🧠 Neural Core (Gemini Service)
This engine is the "Prefrontal Cortex" of GTD. It handles structured extraction from varied signals.

### Extraction Logic
- **Primary**: `gemini-2.5-flash` (Optimized for speed and JSON structure).
- **Secondary**: `gemini-3-pro` (Used for complex reasoning and sub-step decomposition).
- **Fallback**: DeepSeek Chat / Mistral (Ensures high availability).

## 🎙️ Signal Capture (Voice Mode)
GTD captures the raw audio of your intent.
- **Sample Rate**: 16kHz (Input) / 24kHz (Output).
- **Format**: 16-bit Linear PCM.
- **Latency**: Sub-200ms neural sync.

## 📋 Goal Registry
GTD doesn't just record a goal; it understands it. Complex goals are automatically broken down into **3-5 sub-steps** using Gemini’s reasoning capabilities, visible in the `EditTaskModal`.

## 🔒 Persistence Layer
- **State**: Redux-like state management with LocalStorage persistence.
- **Audio**: IndexedDB (`GTDDB`) for high-fidelity signal archives.
- **Cloud**: Supabase integration for cross-device synchronization.

## 🛠 Troubleshooting
GTD utilizes a Service Worker (`sw.js`). If the app behaves unexpectedly, you must:
1. Open DevTools > Application > Service Workers.
2. Click "Unregister".
3. Hard Refresh (Cmd+Shift+R).

*Created with ❤️ by GetThingsDone*