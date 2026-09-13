# MoodMitra — Hackathon Master Plan & Discussion Record
**Date of Session:** September 12, 2026  
**Event:** All India Hackathon (AIH) 2026 (Unstop / Axcentra / Wolfram|One)  
**Project Name:** MoodMitra (Working title in folder: `ExamSoul` / `MM`)  
**Tagline:** *"Because grades should never come at the cost of emotional safety."*  
**Folder Location:** `E:\Mood Mitra\MM`

---

## 1. Executive Summary & Core Identity
* **What we are building:** An AI-powered emotional safety companion app purpose-built for Indian teenagers preparing for high-stakes competitive exams (**NEET, JEE, 10th/12th Boards**).
* **The Problem:** Compounding, silent pressures—mock test failures, formula anxiety, parental comparison ("Sharma ji ka beta"), coaching fee guilt, loneliness in Kota/hostels, and teenage heartbreak.
* **Core Philosophy:** **Talk $\rightarrow$ Support $\rightarrow$ Protect**. A warm, platonic "study buddy" / elder sibling (Mahiru), not a clinical hospital app or romantic companion. Never diagnoses; provides research-informed coping and escalates to trusted contacts when risk is high.

---

## 2. Hardware Constraints & Zero-Thermal Architecture
* **User Laptop:** Acer Aspire Lite (12th Gen Intel Core i5, 16 GB DDR5 RAM, Integrated Intel UHD / Iris Xe Graphics, NO dedicated GPU).
* **Golden Rule:** **NO local LLMs (Ollama/Llama.cpp) and NO heavy local vector databases (Chroma/Milvus)**. Running local inference on an integrated Core i5 saturates 100% of CPU threads, causes thermal throttling, and freezes the Three.js WebGL render loop.
* **The Winning Architecture:**
  1. **STT (Speech-to-Text):** Gnani.ai Prisma v2.5 cloud API (supports Hindi, Hinglish, Indian English, Tamil, etc.).
  2. **Cognitive Brain (LLM):** OpenRouter / Groq cloud API (Gemini 2.0 Flash / Llama 3.3 70B).
  3. **TTS (Text-to-Speech):** Gnani.ai Timbre v2.5 cloud API (voices: Kaveri, Nalini, Deepak).
  4. **3D Avatar & Rendering:** Three.js + `@pixiv/three-vrm` in WebGL 2.0. CPU usage: **8%–12%**, RAM: **~500 MB**, steady **60 FPS**.
  5. **Real-time Lip-Sync:** HTML5 Web Audio API `AnalyserNode` dynamically mapping audio amplitude to VRM `aa` mouth blendshape (<1% CPU).

---

## 3. The Gnani.ai Tactical Hackathon Advantage
* **Why this wins hackathon points:** Gnani.ai is an official sponsor/partner. Judges prioritize and give special awards to teams that deeply integrate partner APIs.
* **Cultural Fit:** Allows the 3D companion to speak authentic Indian accents, regional languages, and Hinglish, which deeply resonates with Indian exam students across Kota and Tier-2/3 cities.

---

## 4. Sub-400ms "Perceived 0-Latency" Pipeline
In live demos, dead silence ruins the experience. We implement a 5-step latency masking strategy:
1. **Instant Visual Hook ($T = 0\text{ ms}$):** The millisecond the user stops speaking, Three.js locally triggers a thinking/head-tilt animation. The avatar visibly reacts immediately.
2. **Sentence-Level Streaming ($T \approx 200\text{ ms}$):** As the cloud LLM streams tokens, our chunker splits at the first punctuation mark (`.`, `!`, `?`, `,`) and sends the first 4–6 words directly to Gnani TTS.
3. **Audio Streaming ($T \approx 350\text{ ms}$):** First audio packet begins playing while the LLM is still generating sentence 2 in the background.
4. **Fast Crossfades:** Three.js AnimationMixer transitions set to `0.15s` (snappy, not sluggish).
5. **Human Perception:** Feels instantaneous like a real-time phone call.

---

## 5. Datasets & In-Memory RAG (Created Today)
All datasets are verified, cleaned, and stored in `E:\Mood Mitra\MM\backend\`:

1. **Production In-Memory Knowledge Base:**
   * File: `E:\Mood Mitra\MM\backend\mental_health_kb.csv`
   * Contains NEET/JEE stress scenarios, parental comparison, heartbreak, somatic grounding (4-7-8 breathing, 5-4-3-2-1), and avatar animation triggers (`recommended_gesture`).
2. **Crisis Intervention Guardrail (`is_crisis = TRUE`):**
   * Pre-programmed to immediately intercept self-harm/suicidal keywords, snap the avatar to `urgent_listening` posture, and read out official Indian emergency helplines:
     * **Tele-MANAS (Govt of India 24/7):** `14416`
     * **KIRAN Mental Health Helpline:** `1800-599-0019`
     * **NIMHANS:** `080-46110007`
     * **AASRA:** `+91-9820466726`
3. **Full Reference Datasets:**
   * `E:\Mood Mitra\MM\backend\data\counsel_chat_reference.csv` (1,100+ verified licensed therapist Q&As from CounselChat).
   * `E:\Mood Mitra\MM\backend\data\mental_health_faq_reference.csv` (clinical FAQ corpus).
4. **Emotion-to-Avatar State Matrix:**
   * File: `E:\Mood Mitra\MM\backend\data\emotion_avatar_map.json`
   * Maps 28 Google GoEmotions / Empathetic states to VRM blendshapes, Mixamo `.vrma` gestures, and Gnani TTS voice pacing.
5. **Clinical Evidence & Safety Framework:**
   * File: `E:\Mood Mitra\MM\backend\data\RESEARCH_AND_SAFETY_FRAMEWORK.md`
   * Contains the PubMed research citations (Jayanthi et al., JEHP), WHO/UNICEF AI for Youth compliance, and pitch defense points.

---

## 6. Graphify Knowledge Graph (Installed & Configured)
* Graphify is installed in the project with native Antigravity rules (`E:\Mood Mitra\MM\.agents\rules\graphify.md`).
* Output visualizers generated in `E:\Mood Mitra\MM\graphify-out\`:
  * `graph.html` (Interactive physics visualizer)
  * `GRAPH_TREE.html` (D3 v7 collapsible tree)
  * `MM-callflow.html` (Mermaid.js call-flow diagram)
  * `GRAPH_REPORT.md` (God nodes & community report: 122 nodes, 115 edges, 15 communities)
  * `graph.json` (Persistent graph)

---

## 7. Antigravity Super-Tools & Skills Cheat Sheet
* Full manual saved at: `E:\Mood Mitra\MM\ANTIGRAVITY_SUPER_TOOLS_USER_GUIDE.md`
* **How to call skills in chat:** Simply type `@skill-name`!
* **Top 6 Skills for Tomorrow's Build:**
  1. `@senior-fullstack` — Orchestrating the data flow between frontend, backend, and Gnani.ai.
  2. `@backend-dev-guidelines` — Express endpoints (`/api/synthesize`, `/api/health`, CORS, streaming audio).
  3. `@rag-engineer` — In-memory keyword/cosine retrieval on `mental_health_kb.csv`.
  4. `@prompt-engineering` — Mahiru's system prompt (platonic elder-sibling persona, emotion tags).
  5. `@frontend-developer` — Three.js `@pixiv/three-vrm` 3D avatar viewport integration into Next.js.
  6. `@react-best-practices` — Real-time Web Audio API lip-sync and 60 FPS performance without memory leaks.

---

## 8. Tomorrow's Execution Plan (Step-by-Step)
When starting tomorrow, follow this sequence:
1. **Step 1:** Backend Proxy — Implement Express `/api/synthesize` endpoint with Gnani.ai API key.
2. **Step 2:** In-Memory RAG — Mount `loadKnowledgeBase('mental_health_kb.csv')` and the crisis interceptor.
3. **Step 3:** 3D Avatar Viewport — Add Three.js VRM container into `ChatInterface.tsx` with fallback.
4. **Step 4:** Real-Time Lip Sync — Connect Web Audio API `AnalyserNode` to the avatar's `aa` blendshape.
5. **Step 5:** Streaming Pipeline — Wire sentence-level chunking from LLM to Gnani TTS with Push-to-Talk audio.
6. **Step 6:** Polish & Rehearse — Rehearse live demo with Hindi & English voice, test crisis safety escalation, and finalize pitch deck.

---
*Generated and saved on September 12, 2026. All assets preserved and ready for hackathon execution.*
