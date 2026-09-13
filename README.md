# 🌸 MoodMitra (मुड मित्र) — 3D Anime Emotional Safety & Study Companion

> **Talk. Support. Protect.**  
> An ultra-low latency, empathetic 3D anime companion and exam mentor (**Avatar: Mahiru**) designed specifically for Indian students preparing for high-stakes competitive exams (**NEET, JEE, Board Exams & College Entrance**).

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FCode-hk-hack%2FMood-Mitra&root-directory=frontend&env=GROQ_API_KEY,GEMINI_API_KEY,GNANI_API_KEY&envDescription=API%20Keys%20for%20Groq%20Llama%203.3,%20Gemini%20Director,%20and%20Gnani%20TTS&project-name=mood-mitra)

---

## 🌟 Overview & Mission

Competitive exam preparation in India is notorious for severe psychological stress, academic burnout, and social isolation. Studies show that **academic stress increases adolescent depression risk by 2.4x**, with **86% of Indian students reporting high parental and peer pressure** (*Jayanthi et al., 2015; JEHP, 2024*).

Traditional AI chat assistants fail these students because they:
1. Suffer from **toxic positivity** (*"Don't worry, cheer up! You can do it!"*).
2. Fail to understand authentic **Hinglish youth vernacular** (*kalesh*, *fati padi hai*, *drame*, *scene hogya*).
3. Lack physical embodiment, leading to cold, disengaged text interactions.
4. Have high latency (>8s) that breaks conversational immersion.

**MoodMitra** solves this by providing **Mahiru**: a living, breathing 3D anime elder sister and study mentor powered by a state-of-the-art multi-model AI pipeline, real-time lip-sync, and a deterministic safety guardrail.

---

## 🚀 Key Features

### 1. 🎭 3D Avatar Biomechanics & Radiant Face (Avatar: Mahiru)
* **Wide Sparkling Anime Eyes:** Bypasses default VRM joy presets that squish eyes into shut slits (`morphs[17]` and `morphs[16]` locked to 0; `morphs[22]` `Fcl_EYE_Spread` active).
* **Sweet Natural Smile:** Direct mesh blendshape animation on `morphs[31]` (`Fcl_MTH_Joy`), `morphs[26]` (`Fcl_MTH_Up`), and `morphs[8]` (`Fcl_BRW_Joy`).
* **Somatic 4-7-8 Breathing Motion:** Real-time sinusoidal chest, clavicle, and spine expansion curves (`Math.sin(time * 1.5) * 0.08`) that guide students down from acute panic attacks.
* **9 Distinct Kinematic Gestures:** `reassuring_palms`, `hand_to_heart`, `warm_welcome`, `thoughtful_chin`, `empathic_nod`, `encouraging_cheer`, `active_listening`, `somatic_breathing`, and `conversational_speaking`.
* **Sample-Accurate Lip-Sync:** Web Audio API FFT `AnalyserNode` driving mouth blendshapes (`Fcl_MTH_A`, `Fcl_MTH_I`, `Fcl_MTH_O`) in real-time.

### 2. 🧠 3-Stage Clinical Empathy Protocol (`counsel-chat` + `empathetic-dialogues`)
* **Validation First:** Validates emotional hurt directly without judgment or toxic cheerleading.
* **Cognitive Reframing:** Shifts perspective constructively (*"Mock tests are diagnostic instruments to spot revision gaps, not verdicts on your intelligence or final rank."*).
* **Micro-Action:** Prescribes 1 manageable, low-effort next step (*"Take 3 breaths, drink water, and let's review just 2 errors together."*).
* **Hinglish Slang Mastery (`l3cube-pune/hinglish-sentiment`):** Authentic code-mixed comprehension for family fights (*kalesh*), breakups (*drame*), and intense panic (*fati padi hai*).

### 3. ⚡ Ultra-Low Latency Voice & Live Voice Call Engine
* **Real-Time Energy VAD (Silero-Inspired):** Client-side Web Audio RMS energy tracking automatically finalizes speech after 800ms of silence—no need to click "Stop".
* **Sub-150ms Groq Whisper Large-v3-Turbo:** Automatic audio format sniffing (WAV/WEBM) with dedicated Indian exam Hinglish context prompting.
* **Live "Voice Call" Mode Toggle:** Dedicated hands-free call mode where Mahiru speaks aloud and automatically re-activates the microphone for continuous back-and-forth conversation.
* **Barge-In / Interrupt Support:** Speaking or clicking the mic immediately stops ongoing avatar speech.
* **Total Roundtrip Latency:** **<2.3 seconds** with full 24kHz linear PCM audio co-delivery.

### 4. 🛡️ Deterministic Semantic Crisis Router (<1ms Fast-Path)
* **Inspired by `aurelio-labs/semantic-router`:** Fast-path cluster classifier that intercepts self-harm or suicidal ideation in **<1ms** before touching the LLM queue.
* **Zero-Asking Safety Escalation:**
  * Displays India's official 24/7 **Tele-MANAS (14416 / 1800 891 4416)** helpline lock banner with 1-click direct dialing.
  * Automatically dispatches pre-formatted emergency check-in alerts to the student's configured **Parent and Friend** via WhatsApp (`wa.me`) and SMS (`sms:`).

---


---

## 🌐 1-Click Live Vercel Deployment

Deploy your own live, shareable instance of MoodMitra in ~60 seconds:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FCode-hk-hack%2FMood-Mitra&root-directory=frontend&env=GROQ_API_KEY,GEMINI_API_KEY,GNANI_API_KEY&envDescription=API%20Keys%20for%20Groq%20Llama%203.3,%20Gemini%20Director,%20and%20Gnani%20TTS&project-name=mood-mitra)

### Deployment Steps:
1. Click the **Deploy with Vercel** button above (or import `Code-hk-hack/Mood-Mitra` at [vercel.com/new](https://vercel.com/new)).
2. If importing manually, set **Root Directory** to `frontend`.
3. Provide the 3 Environment Variables:
   * `GROQ_API_KEY`: Required for Groq Llama 3.3 70B & Whisper Large v3 Turbo ([Groq Console](https://console.groq.com/keys))
   * `GEMINI_API_KEY`: Required for Gemini 3.6 Flash Real-Time Kinematic Director ([Google AI Studio](https://aistudio.google.com/))
   * `GNANI_API_KEY`: Required for Gnani.ai 24kHz Indian English TTS (*optional, automatic Web Speech fallback included*)
4. Click **Deploy**. Vercel will compile the Next.js App Router and serverless API endpoints, giving you a live `https://mood-mitra.vercel.app` URL to share!

## 🏗️ Technical Architecture

```
                       [ Student (Voice / Text) ]
                                   │
                                   ▼
                ┌──────────────────────────────────────┐
                │        Next.js 16 Frontend           │
                │  - Three.js + @pixiv/three-vrm       │
                │  - Real-Time Energy VAD (Web Audio)  │
                │  - Dual-Engine SpeechRecognition     │
                │  - Trusted Circle / Guardian Hub     │
                └──────────────────┬───────────────────┘
                                   │ HTTP /api/chat
                                   ▼
                ┌──────────────────────────────────────┐
                │        Node.js Express Backend       │
                │  - Deterministic Crisis Router (<1ms)│
                │  - 140+ Clinical Knowledge Base (RAG)│
                └──────────┬───────────────┬───────────┘
                           │               │
            ┌──────────────┴────┐    ┌─────┴──────────────┐
            ▼                   ▼    ▼                    ▼
     [ Groq Cloud ]     [ Google Gemini ]     [ Gnani.ai ]      [ Groq Whisper ]
    openai/gpt-oss-120b    gemini-3.6-flash     timbre-v2.5    whisper-large-v3-turbo
    (Cognitive Brain)    (Kinematic Director)  (24kHz PCM TTS)    (Sub-150ms STT)
```

---

## 💻 Tech Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend Framework** | **Next.js 16 (App Router)** | Modern React 19 architecture with Turbopack |
| **3D Engine** | **Three.js + `@pixiv/three-vrm`** | Real-time VRM anime avatar rendering, kinematics & lip-sync |
| **Styling & UI** | **Tailwind CSS + Framer Motion** | Glassmorphism, cyber-minimalist dark aesthetics |
| **Backend API** | **Node.js + Express** | High-concurrency RESTful microservice pipeline |
| **Cognitive Brain** | **Groq Cloud (`openai/gpt-oss-120b`)** | 350-token reasoner completions in <0.9s |
| **Kinematic Director**| **Google Gemini 3.6 Flash** | Facial expression, smile, and gesture classification |
| **Voice Synthesis** | **Gnani.ai `timbre-v2.5`** | Primary 24kHz linear PCM voice (`Kaveri`, `en-IN`) |
| **Voice Fallback** | **Web Speech API / Sarvam AI** | 0ms local fallback ensuring 100% voice uptime |
| **Speech Recognition**| **Groq Whisper Large v3 Turbo** | Dual-engine STT with Web Speech & Web Audio VAD |
| **Emergency Hub** | **Tele-MANAS (14416) + WhatsApp/SMS** | Unprompted multi-channel guardian escalation |

---

## ⚙️ Quickstart Guide

### Prerequisites
* **Node.js** v18.0 or higher
* **Git** installed
* API Keys for **Groq Cloud**, **Google Gemini**, and **Gnani.ai** (optional, fallback provided)

### 1. Clone the Repository
```bash
git clone https://github.com/Code-hk-hack/Mood-Mitra.git
cd Mood-Mitra
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
```
Edit `backend/.env` with your credentials:
```env
PORT=5000
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-120b
GROQ_MAX_TOKENS=350

GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.6-flash

GNANI_API_KEY=your_gnani_api_key_here
GNANI_TTS_VOICE=Kaveri
GNANI_TTS_LANG=en-IN
GNANI_TTS_MODEL=timbre-v2.5
```
Start the backend server:
```bash
npm start
# Server runs on http://localhost:5000
```

### 3. Frontend Setup
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
# App opens on http://localhost:3000/chat
```

---

## 📁 Repository Structure

```text
Mood-Mitra/
├── backend/
│   ├── data/
│   │   ├── HINGLISH_YOUTH_CHAT_TRAINING_DATASET.md   # Curated youth chat dataset
│   │   ├── counsel_chat_reference.csv                # Counsel-Chat clinical Q&A
│   │   └── mental_health_faq_reference.csv           # Clinical FAQ reference
│   ├── mental_health_kb.csv                          # 140 in-memory RAG entries
│   ├── server.js                                     # Express server & multi-model router
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx                              # Landing page with student stats
│   │   │   └── chat/page.tsx                         # 3D interactive chat interface
│   │   └── components/
│   │       ├── Avatar3D.tsx                          # VRM model, kinematics & lip-sync
│   │       └── ChatInterface.tsx                     # VAD STT, voice call, SOS circle
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## 🛡️ Safety & Responsible AI

MoodMitra is designed as an **emotional safety companion and mentor**, not a medical substitute for psychiatric therapy:
* **Immediate Interception:** Any query exhibiting suicidal ideation or self-harm triggers the **Deterministic Crisis Router (<1ms)**, bypassing AI generation.
* **Official Helplines:** Integrated direct dialing to **Tele-MANAS (14416)**, Government of India's 24/7 mental health helpline.
* **Trusted Circle Dispatch:** Pre-formatted WhatsApp and SMS emergency messages sent to emergency contacts without asking for user permission during high-risk moments.
* **Privacy First:** Trusted contact numbers and chat state remain strictly in client-side `localStorage`.

---

## 📜 License & Citation

Built with ❤️ for Indian students.  
Created by [Code-hk-hack](https://github.com/Code-hk-hack).
