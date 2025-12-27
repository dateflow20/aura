# AURA: Technical Systems & Neural Architecture Manual

## 1. System Overview
AURA (Autonomous Universal Reasoning Assistant) is a multimodal productivity ecosystem. It operates on the principle of **Cognitive Discernment**, where the system distinguishes between human conversation and actionable intent.

---

## 2. The Neural Core (AI Services)

### 2.1 Multimodal Extraction Engine (`gemini-3-flash-preview`)
This engine is the "Prefrontal Cortex" of AURA. It handles structured extraction from varied signals.
- **Text Signal**: Processes chat history to maintain context.
- **Audio Signal**: Transcribes and extracts "Goal Nodes" simultaneously.
- **Visual Signal**: Uses OCR and semantic reasoning to identify goals in images.

### 2.2 Live Neural Sync (`gemini-2.5-flash-native-audio-preview-09-2025`)
The "Nervous System" of the app. It manages the low-latency Voice Mode.
- **Streaming PCM**: Raw audio data is sliced into 1024-sample chunks to minimize the "Cognitive Gap" (latency).
- **Discernment Protocol**: The system is instructed to prioritize dialogue. It only triggers the `add_goal` tool when it detects a "Firm Directive".

---

## 3. Feature Breakdown

### 3.1 Voice Mode & Reactive HUD
The Voice Mode interface is a reactive neural representation:
- **The Eyes**: Rotate and squint based on frequency data (`analyser.getByteFrequencyData`).
- **Chromatic Resonance**: Users can shift the "Eye Color" to change the visual frequency profile.
- **Noise Suppression (NR)**: A user-controllable toggle in the HUD that adjusts the `navigator.mediaDevices.getUserMedia` constraints to filter ambient environment noise.

### 3.2 Signal Archive (Signal Replay)
AURA captures the raw audio of your intent.
- **Logic**: When a task is extracted from audio, the Base64 signal is stored in **IndexedDB**.
- **Utility**: In the "List" or "Notes" mode, you can play back your original voice note to hear the context of your past self.

### 3.3 Neural Deconstruction
AURA doesn't just record a goal; it understands it. Complex goals are automatically broken down into **3-5 sub-steps** using Gemini’s reasoning capabilities, visible in the `EditTaskModal`.

### 3.4 Branding & Presence
The system includes persistent "Powered by Ryanflow.ink" branding, establishing the origin of the neural architecture.

---

## 4. Technical Specifications

### 4.1 Audio Normalization (`services/audioUtils.ts`)
The API requires raw 16-bit PCM.
- **Encoding**: Float32 values from the mic (-1.0 to 1.0) are clamped and scaled to 16-bit integers (-32768 to 32767).
- **Decoding**: Incoming Base64 PCM data is converted back to Float32 for playback via the `AudioContext` destination.

### 4.2 Permission Matrix (`metadata.json`)
- `microphone`: Required for Neural Sync and Voice Commands.
- `camera`: Required for Optical Node Scanning.

---

## 5. Deployment & Local Setup (The Vite Framework)

To run AURA outside of a cloud environment (e.g., Netlify, Vercel, or Local VS Code), follow these mandates:

### 5.1 Local Execution
1. Install Node.js.
2. Run `npm install` in the project root.
3. Run `npm run dev`.
4. Create a `.env` file and add `VITE_API_KEY=your_key`. Note: The `vite.config.ts` bridges this to `process.env.API_KEY` automatically.

### 5.2 The "Worker" (War) Conflict
AURA utilizes a Service Worker (`sw.js`). If the app behaves unexpectedly or "refers to War" (old worker state), you must:
- Open Chrome DevTools > Application > Service Workers.
- Click **Unregister** or **Update on reload**.
- This ensures the neural cache is purged and the latest architecture is loaded.

### 5.3 Netlify Deployment
1. Push to GitHub.
2. Link the repository to Netlify.
3. In Netlify Build Settings, set the Build Command to `npm run build` and the Publish Directory to `dist`.
4. Add your Gemini API Key in Netlify's **Environment Variables** as `API_KEY`.

---

## 6. Evolution Log (Full Prompt History)

1.  **Initial Directive**: "We are going to create a to-do list application... speak."
2.  **Intelligence**: "Make the AI voice more intelligent... understand goals... conversational."
3.  **Aesthetics**: "Powered by Ryanflow.ink... adjust chat input UI."
4.  **Deployment Fix**: "Restore camera... add voice input to chat... fix offline/socket issues."

---

## 7. Storage Strategy
- **State (`localStorage`)**: User Profile, App Mode, Todo Registry, UI Settings.
- **Archive (`IndexedDB`)**: Binary Audio Signals (Base64 WebM/PCM).

---

## 8. Operating Instructions
- **To Inject Signal**: Press the large central orb in "Notes" mode.
- **To Synchronize**: Enter "Voice Mode" (Bottom-right icon) for a live conversation.
- **To Decipher Visuals**: Use "Scan" mode to point your camera at physical notes.
- **To Archive**: Use the "Goal Registry" to check off completed neural nodes.