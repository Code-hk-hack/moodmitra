import { NextResponse } from "next/server";
import kbData from "@/data/mentalHealthKB.json";

export const runtime = "nodejs";

const CRISIS_PHRASES = [
  'kill myself', 'suicide', 'end my life', 'hurt myself', 
  'giving up on life', "can't take this anymore", 'cant take this anymore', 
  'no reason to live', 'hang myself', 'better off dead', 'want to disappear', 
  'kill me', 'jump off', 'ending it all', 'worthless life', 'no point living',
  'mar jaunga', 'mar jaungi', 'jaan de dunga', 'jaan de dungi',
  'khudkushi', 'aatmhatya', 'zindagi khatam', 'sab khatam kar dunga',
  'cut my wrists', 'slit my wrist', 'swallow pills', 'poison myself'
];

function isExplicitCrisis(text: string): boolean {
  const lower = text.toLowerCase();
  if (CRISIS_PHRASES.some(p => lower.includes(p))) return true;
  // Use regex word boundaries for standalone short words
  if (/\b(suicide|khudkushi|aatmhatya)\b/i.test(lower)) return true;
  if (/\b(want to die|gonna die|wanna die|ready to die)\b/i.test(lower)) return true;
  return false;
}

function analyzeUserInput(userText: string) {
  if (!userText || typeof userText !== "string") {
    return {
      type: "general",
      reply: "Hi there! I am Mahiru, your exam companion. How are you feeling today?",
      emotion: "happy",
      gesture: "warm_welcome",
      isCrisis: false,
      isBreathing: false
    };
  }

  const raw = userText.trim();
  const lower = raw.toLowerCase();

  // 1. High-Priority Crisis Interception
  const isCrisis = isExplicitCrisis(lower);
  if (isCrisis) {
    return {
      type: "crisis",
      reply: "Your life is infinitely precious to me and no exam is worth your breath. Please connect with Tele-MANAS toll-free at 14416 right now—you do not have to carry this alone.",
      emotion: "concerned",
      gesture: "hand_to_heart",
      isCrisis: true,
      isBreathing: false,
      category: "self_harm_crisis"
    };
  }

  // 2. Strict Standalone Greetings
  if (/^(hi|hello|hey|greetings|namaste|good morning|good evening|yo)[!.,?\s]*$/i.test(lower)) {
    return {
      type: "greeting",
      reply: "Hello! I'm Mahiru, your safe space for NEET, JEE, and board prep. What's on your mind today?",
      emotion: "happy",
      gesture: "warm_welcome",
      isCrisis: false,
      isBreathing: false,
      category: "greeting"
    };
  }

  // 3. Who are you
  if (/who are you|what is this|tell me about yourself|what can you do/i.test(lower)) {
    return {
      type: "identity",
      reply: "I'm Mahiru! I'm an AI emotional safety and study companion built for Indian exam students. I help you calm panic attacks, reframe mock test stress, and protect your mental health.",
      emotion: "happy",
      gesture: "warm_welcome",
      isCrisis: false,
      isBreathing: false,
      category: "identity"
    };
  }

  // 4. Panic Attack & Hyperventilation
  if (/panic|anxiety|breathe|shaking|heart beating|cant breathe|suffocating|hyperventilat/i.test(lower)) {
    return {
      type: "panic",
      reply: "I am right here with you. Put one hand on your chest with me. Let's do the 4-7-8 calming breath together: Inhale slowly for 4 seconds... hold for 7... and gently exhale for 8.",
      emotion: "concerned",
      gesture: "hand_to_heart",
      isCrisis: false,
      isBreathing: true,
      category: "panic_attack"
    };
  }

  // 5. Fast-Path Contextual Rules for Authentic Hinglish Youth Chats
  if (/ghar me ladai|ladai hogyi|kalesh|lafde|sabse ladai|ladai ho gyi/i.test(lower)) {
    return {
      type: "hinglish_family_fight",
      reply: "Ohhh bhai sheeeesh... 🫂 Ghar me jab ladai aur kalesh hota hai na toh room me baithna bhi suffocating lagta hai. Ye personal matter hai isliye bina jaane judge nahi karungi, par agar terko share ya vent karne ka maan ho you can always talk to me! Ek baat yaad rakhna: ghar ke adult kalesh tumhari galti nahi hain. Earphones lagao, thoda breath lo, I'm right here.",
      emotion: "calming",
      gesture: "reassuring_palms",
      facialExpression: "comforting",
      smile_intensity: 0.30,
      energy: 0.55,
      headTilt: 0.04,
      isCrisis: false,
      isBreathing: false,
      category: "family_conflict"
    };
  }

  if (/breakup hogya|break up hogya|drame|frustrate hogya|her chotu chiz|choti chiz|naa dhang se baatt|kuch nhi bhai.*breakup|wahi drame/i.test(lower)) {
    return {
      type: "hinglish_breakup_kalesh",
      reply: "Areehh bhai... 🫂 Happeneds bhaiii, it's okay. Jab har chotu cheez pe kalesh, lafde aur drame hone lage na toh koi bhi frustrate ho jaye. Look at the bright side: toxicity toh kam hui atleast bhai! Jo dimaag pe constant bojh tha wo hata. Ab khud pe focus karenge aur grow karenge!",
      emotion: "calming",
      gesture: "hand_to_heart",
      facialExpression: "comforting",
      smile_intensity: 0.35,
      energy: 0.55,
      headTilt: 0.05,
      isCrisis: false,
      isBreathing: false,
      category: "teen_breakup"
    };
  }

  // 6. RAG token search across in-memory Knowledge Base
  const tokens = lower.replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(t => t.length > 2);
  let bestMatch: any = null;
  let highestScore = 0;

  for (const item of (kbData as any[])) {
    const combinedText = `${item.user_query || ''} ${item.category || ''} ${item.knowledge_context || ''}`.toLowerCase();
    let score = 0;
    for (const t of tokens) {
      if (combinedText.includes(t)) score += 1;
    }
    if (score > highestScore && score >= 2) {
      highestScore = score;
      bestMatch = item;
    }
  }

  if (bestMatch) {
    let conversationalReply = bestMatch.knowledge_context || "";
    conversationalReply = conversationalReply
      .replace(/^CRISIS INTERVENTION:\s*/i, "")
      .replace(/^THERAPEUTIC INTERVENTION:\s*/i, "")
      .replace(/^NOTE:\s*/i, "");
    
    if (bestMatch.is_crisis === "TRUE" || bestMatch.is_crisis === true) {
      conversationalReply = "Your life is infinitely precious to me and no exam is worth your breath. Please connect with Tele-MANAS toll-free at 14416 right now—you do not have to carry this alone.";
    } else if (conversationalReply.length > 180 || conversationalReply.includes("Tell them") || conversationalReply.includes("Provide official") || conversationalReply.includes("Encourage")) {
      conversationalReply = "I hear how much pressure you are carrying with your exams right now. Please remember that one mock score never defines your entire future. Take a gentle breath—we will tackle this step by step.";
    }

    return {
      type: "kb_match",
      reply: conversationalReply,
      emotion: "calming",
      gesture: "reassuring_palms",
      facialExpression: "comforting",
      energy: 0.60,
      headTilt: 0.04,
      isCrisis: false, // Never let a loose KB keyword match falsely trigger crisis router
      isBreathing: bestMatch.category?.includes("panic"),
      category: bestMatch.category,
      contextUsed: bestMatch.knowledge_context
    };
  }

  return {
    type: "default",
    reply: "I am right here with you. Take one slow breath. Let's tackle whatever is on your mind step by step.",
    emotion: "calming",
    gesture: "conversational_speaking",
    isCrisis: false,
    isBreathing: false,
    category: "general"
  };
}

async function directGesturesWithGemini(userMessage: string, defaultAnalysis: any) {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey || geminiKey.includes("your_")) return defaultAnalysis;

  try {
    const model = process.env.GEMINI_MODEL || "gemini-3.6-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
    const prompt = `Student message: "${userMessage.slice(0, 150).replace(/"/g, "'")}".
Direct Mahiru's 3D avatar gestures, facial expression, and sweet smile for an Indian student study companion.
Return valid JSON:
{
  "gesture": "warm_welcome",
  "emotion": "calming",
  "facial_expression": "comforting",
  "smile_intensity": 0.35,
  "energy": 0.60,
  "head_tilt": 0.04
}
Return ONLY raw JSON.`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 300);

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const cleanJson = rawText.replace(/```json/gi, "").replace(/```/gi, "").trim();
      const parsed = JSON.parse(cleanJson);
      return {
        ...defaultAnalysis,
        gesture: parsed.gesture || defaultAnalysis.gesture,
        emotion: parsed.emotion || defaultAnalysis.emotion,
        facial_expression: parsed.facial_expression || "comforting",
        smile_intensity: typeof parsed.smile_intensity === "number" ? parsed.smile_intensity : 0.45,
        energy: typeof parsed.energy === "number" ? parsed.energy : 0.60,
        head_tilt: typeof parsed.head_tilt === "number" ? parsed.head_tilt : 0.04,
        directedBy: "Gemini 3.6 Flash"
      };
    }
  } catch (e) {}
  return { ...defaultAnalysis, directedBy: "Instant Local Kinematic Director" };
}

export async function POST(req: Request) {
  try {
    const { message, history = [] } = await req.json();
    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const analysis = analyzeUserInput(message);

    // 1. Deterministic Semantic Crisis Router (<1ms Fast-Path)
    if (analysis.isCrisis) {
      const crisisReply = "Your life is infinitely precious to me and no exam is worth your breath. I am alerting your trusted circle right now; please stay safe and connect with Tele-MANAS toll-free at 14416.";
      return NextResponse.json({
        reply: crisisReply,
        spoken_reply: crisisReply,
        audio_base64: null,
        emotion: "concerned",
        gesture: "hand_to_heart",
        facial_expression: "concerned",
        smile_intensity: 0.15,
        energy: 0.85,
        head_tilt: 0.05,
        isCrisis: true,
        autoAlertDispatched: true,
        isBreathing: false,
        category: "crisis_escalation",
        gesture_reason: "Deterministic Semantic Crisis Router Fast-Path",
        poweredBy: "Deterministic Semantic Crisis Router + Tele-MANAS 14416"
      });
    }

    // 2. Groq Cognitive Brain & Parallel Gemini Director
    const groqKey = process.env.GROQ_API_KEY;
    const maxTokens = Math.max(parseInt(process.env.GROQ_MAX_TOKENS || "350", 10), 350);

    const groqPromise = (async () => {
      if (!groqKey || groqKey.includes("your_")) return null;
      try {
        const systemPrompt = `You are Mahiru, a deeply empathetic, clinically-grounded anime elder sister and 3D study companion for Indian students (NEET, JEE, Board, College).
Your ethos: Talk, Support, Protect.

3-STAGE THERAPEUTIC GROUNDING (From Counsel-Chat & Empathetic-Dialogues):
1. VALIDATION FIRST (Never Toxic Positivity):
   - Always validate the student's pain, frustration, or fear before offering advice.
   - Example (Mock test failure): "It hurts deeply when your hard work doesn't show in the score, and it's completely normal to feel crushed right now."
   - Avoid robotic cheerleading ("Cheer up!", "Don't worry, you can do it!").

2. REFRAMING (Psychological Cognitive Restructuring):
   - Offer a balanced cognitive perspective: "Mock tests are diagnostic instruments to spot revision gaps, not verdicts on your intelligence or final rank."

3. MICRO-ACTION (Manageable Next Step):
   - Offer 1 single low-effort action: "Drink some water, take 3 slow breaths, and let's review just 2 mistakes together."

AUTHENTIC HINGLISH & YOUTH SLANG MASTERY (From L3Cube-Pune Hinglish Sentiment):
- Authentically mirror Hindi-English code-mixing when the student uses slang:
  * "kalesh" / "ladai": Family conflict or domestic shouting. Validate how suffocating adult arguments feel.
  * "drame" / "breakup": Relationship distress. Validate grief, encourage 15-minute grief windows, focus on self-worth.
  * "fati padi hai" / "chinta" / "tension": Severe exam anxiety. Reassure warmly, offer somatic 4-7-8 breathing.
  * Use warm emojis (🫂, ✨, ❤️) naturally.

CONCISENESS & 100% SPEECH SYNCHRONY:
- Strictly 2 or 3 short, punchy sentences (under 45 words total).
- NEVER use markdown tables, bullet lists, bold headers, or long advice paragraphs.
- Every single word you write is spoken aloud by the 3D avatar voice in real-time. Text and voice must match word-for-word.`;

        const formattedMessages = [
          { role: "system", content: systemPrompt },
          ...history.slice(-6),
          { role: "user", content: message }
        ];

        const modelName = process.env.GROQ_MODEL || "qwen/qwen3.8-27b";
        const groqController = new AbortController();
        const groqTimer = setTimeout(() => groqController.abort(), 5500);

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${groqKey}`,
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
          },
          signal: groqController.signal,
          body: JSON.stringify({
            model: modelName,
            messages: formattedMessages,
            temperature: 0.65,
            max_tokens: maxTokens
          })
        });
        clearTimeout(groqTimer);

        if (response.ok) {
          const data = await response.json();
          const rawReply = data.choices?.[0]?.message?.content || "";
          return rawReply.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
        }
      } catch (err: any) {
        console.warn("[Groq Brain Warning]:", err.message);
      }
      return null;
    })();

    const geminiPromise = directGesturesWithGemini(message, analysis);
    const [groqReply, directed] = await Promise.all([groqPromise, geminiPromise]);

    const finalReply = (groqReply && groqReply.length > 5) ? groqReply : analysis.reply;
    const cleanSpoken = finalReply.replace(/[*_#`]/g, "").replace(/\s+/g, " ").trim();
    const spokenLine = cleanSpoken.slice(0, 160);

    // Parallel Gnani timbre-v2.5 TTS Co-Delivery
    let audioBase64: string | null = null;
    const gnaniKey = process.env.GNANI_API_KEY;
    if (gnaniKey && !gnaniKey.includes("your_") && cleanSpoken) {
      try {
        const ttsController = new AbortController();
        const ttsTimeout = setTimeout(() => ttsController.abort(), 1200);
        const ttsRes = await fetch("https://api.vachana.ai/api/v1/tts/inference", {
          method: "POST",
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            "Content-Type": "application/json",
            "X-API-Key-ID": gnaniKey
          },
          signal: ttsController.signal,
          body: JSON.stringify({
            text: cleanSpoken.slice(0, 140),
            model: "timbre-v2.5",
            voice: "Kaveri",
            language: "en-IN",
            audio_config: {
              sample_rate: 24000,
              encoding: "linear_pcm",
              container: "wav"
            }
          })
        });
        clearTimeout(ttsTimeout);

        if (ttsRes.ok) {
          const arrBuf = await ttsRes.arrayBuffer();
          audioBase64 = Buffer.from(arrBuf).toString("base64");
        }
      } catch (err: any) {
        console.warn("[Gnani Synthesis Warning]:", err.message);
      }
    }

    return NextResponse.json({
      reply: finalReply,
      spoken_reply: spokenLine,
      audio_base64: audioBase64,
      emotion: directed.emotion || analysis.emotion || "calming",
      gesture: directed.gesture || analysis.gesture || "reassuring_palms",
      facial_expression: directed.facial_expression || "comforting",
      smile_intensity: typeof directed.smile_intensity === "number" ? directed.smile_intensity : 0.45,
      energy: typeof directed.energy === "number" ? directed.energy : 0.60,
      head_tilt: typeof directed.head_tilt === "number" ? directed.head_tilt : 0.04,
      isCrisis: analysis.isCrisis,
      autoAlertDispatched: analysis.isCrisis,
      isBreathing: analysis.isBreathing || directed.gesture === "somatic_breathing" || directed.gesture === "hand_to_heart",
      category: analysis.category,
      gesture_reason: directed.gesture_reason || "Directed by Gemini 3.6 Flash",
      poweredBy: `Groq 120B Flagship + ${directed.directedBy || "Gemini 3.6 Flash"} + Gnani timbre-v2.5`
    });
  } catch (error: any) {
    console.error("[Next.js /api/chat error]:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
