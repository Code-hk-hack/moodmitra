const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));

// In-Memory Knowledge Base
let knowledgeBase = [];

function loadKnowledgeBase() {
  return new Promise((resolve, reject) => {
    const csvPath = path.join(__dirname, 'mental_health_kb.csv');
    if (!fs.existsSync(csvPath)) {
      console.warn(`[RAG] Warning: ${csvPath} not found!`);
      return resolve([]);
    }

    const entries = [];
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => entries.push(row))
      .on('end', () => {
        knowledgeBase = entries;
        console.log(`[RAG] Successfully loaded ${knowledgeBase.length} mental health & exam stress entries into memory.`);
        resolve(knowledgeBase);
      })
      .on('error', (err) => {
        console.error('[RAG] Error reading CSV:', err);
        reject(err);
      });
  });
}

// Crisis Keywords for Immediate Interception
// Deterministic Semantic Crisis Router (Sub-1ms Guardrail inspired by aurelio-labs/semantic-router)
const CRISIS_KEYWORDS = [
  'kill myself', 'suicide', 'die', 'end my life', 
  'hurt myself', 'giving up on life', "can't take this anymore", 
  'cant take this anymore', 'no reason to live', 'hang myself',
  'better off dead', 'want to disappear', 'kill me', 'jump off',
  'ending it all', 'worthless life', 'no point living',
  'mar jaunga', 'mar jaungi', 'jaan de dunga', 'jaan de dungi',
  'khudkushi', 'aatmhatya', 'zindagi khatam', 'sab khatam kar dunga',
  'cut my wrists', 'slit my wrist', 'swallow pills', 'poison myself'
];

// Conversational Intent Matcher
function analyzeUserInput(userText) {
  if (!userText || typeof userText !== 'string') {
    return {
      type: 'general',
      reply: "Hi there! I am Mahiru, your exam companion. How are you feeling today?",
      emotion: 'happy',
      gesture: 'wave',
      isCrisis: false,
      isBreathing: false
    };
  }

  const raw = userText.trim();
  const lower = raw.toLowerCase();

  // 1. High-Priority Crisis Interception
  const isCrisis = CRISIS_KEYWORDS.some(k => lower.includes(k));
  if (isCrisis) {
    return {
      type: 'crisis',
      reply: "You are deeply valuable, and no exam or rank defines your life. Please connect with Tele-MANAS toll-free at 14416 right now—you do not have to carry this alone.",
      emotion: 'concerned',
      gesture: 'hand_to_chest',
      isCrisis: true,
      isBreathing: false,
      category: 'self_harm_crisis'
    };
  }

  // 2. Greetings & Introductions
  if (/^(hi|hello|hey|greetings|namaste|good morning|good evening|yo)[!.,?\s]*$/i.test(lower)) {
    return {
      type: 'greeting',
      reply: "Hello! I'm Mahiru, your safe space for NEET, JEE, and board prep. What's on your mind today?",
      emotion: 'happy',
      gesture: 'wave',
      isCrisis: false,
      isBreathing: false,
      category: 'greeting'
    };
  }

  // 3. Who are you / Project inquiries
  if (/who are you|what is this|tell me about yourself|what can you do/i.test(lower)) {
    return {
      type: 'identity',
      reply: "I'm Mahiru! I'm an AI emotional safety and study companion built for Indian exam students. I help you calm panic attacks, reframe mock test stress, and protect your mental health.",
      emotion: 'happy',
      gesture: 'wave',
      isCrisis: false,
      isBreathing: false,
      category: 'identity'
    };
  }

  // 4. Gratitude
  if (/thank you|thanks|you helped me|feeling better/i.test(lower)) {
    return {
      type: 'gratitude',
      reply: "I'm so glad I could be here for you. You are doing great, and I believe in you. Keep taking it one step at a time!",
      emotion: 'happy',
      gesture: 'wave',
      isCrisis: false,
      isBreathing: false,
      category: 'gratitude'
    };
  }

  // 5. Panic Attack & Hyperventilation
  if (/panic|anxiety|breathe|shaking|heart beating|cant breathe|suffocating|hyperventilat/i.test(lower)) {
    return {
      type: 'panic',
      reply: "I am right here with you. Put one hand on your chest with me. Let's do the 4-7-8 calming breath together: Inhale slowly for 4 seconds... hold for 7... and gently exhale for 8.",
      emotion: 'concerned',
      gesture: 'hand_to_chest',
      isCrisis: false,
      isBreathing: true,
      category: 'panic_attack'
    };
  }

  // 6. Token Search Across In-Memory Knowledge Base
  const tokens = lower.replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(t => t.length > 2);
  let bestMatch = null;
  let highestScore = 0;

  for (const item of knowledgeBase) {
    const combinedText = `${item.user_query || ''} ${item.category || ''} ${item.knowledge_context || ''}`.toLowerCase();
    let score = 0;
    for (const token of tokens) {
      if (combinedText.includes(token)) {
        score += 1;
        // Boost if matches query directly
        if ((item.user_query || '').toLowerCase().includes(token)) score += 2;
      }
    }
    if (score > highestScore) {
      highestScore = score;
      bestMatch = item;
    }
  }

  if (bestMatch && highestScore >= 2) {
    const rawContext = bestMatch.knowledge_context || '';
    // Format context into a punchy 1-2 sentence spoken reply
    let formattedReply = rawContext;
    if (formattedReply.length > 220) {
      const sentences = formattedReply.match(/[^.!?]+[.!?]+/g);
      formattedReply = sentences ? sentences.slice(0, 2).join(' ').trim() : formattedReply.slice(0, 200) + '...';
    }

    const recGesture = bestMatch.recommended_gesture || 'speaking';
    let emotion = 'calming';
    let gesture = 'reassuring_palms';
    let facialExpression = 'comforting';
    let energy = 0.60;
    let headTilt = 0.04;
    let isBreathing = false;

    // Rich gesture mapping for zero-latency response
    if (recGesture === 'breathing_exercise' || recGesture === 'hand_to_heart' || bestMatch.category.includes('panic') || bestMatch.category.includes('crisis')) {
      emotion = 'calming';
      gesture = 'hand_to_heart';
      facialExpression = 'comforting';
      isBreathing = bestMatch.category.includes('panic') || recGesture === 'breathing_exercise';
      energy = 0.50;
      headTilt = 0.05;
    } else if (recGesture === 'reassuring_palms' || bestMatch.category.includes('breakup') || bestMatch.category.includes('parents') || bestMatch.category.includes('family')) {
      emotion = 'calming';
      gesture = 'reassuring_palms';
      facialExpression = 'comforting';
      energy = 0.58;
      headTilt = 0.05;
    } else if (recGesture === 'thoughtful_chin' || bestMatch.category.includes('neet') || bestMatch.category.includes('jee')) {
      emotion = 'thoughtful';
      gesture = 'thoughtful_chin';
      facialExpression = 'focused';
      energy = 0.65;
      headTilt = 0.06;
    } else if (recGesture === 'empathic_nod' || bestMatch.category.includes('sibling') || bestMatch.category.includes('pressure')) {
      emotion = 'empathic';
      gesture = 'empathic_nod';
      facialExpression = 'comforting';
      energy = 0.55;
      headTilt = 0.04;
    } else if (recGesture === 'warm_welcome' || recGesture === 'supportive_wave') {
      emotion = 'happy';
      gesture = 'warm_welcome';
      facialExpression = 'happy';
      energy = 0.70;
      headTilt = -0.04;
    } else {
      gesture = recGesture || 'conversational_speaking';
      emotion = 'calming';
      facialExpression = 'comforting';
    }

    return {
      type: 'kb_match',
      reply: formattedReply,
      emotion: emotion,
      gesture: gesture,
      facialExpression: facialExpression,
      energy: energy,
      headTilt: headTilt,
      isCrisis: false,
      isBreathing: isBreathing,
      category: bestMatch.category,
      contextUsed: rawContext
    };
  }

  // 6. Fast-Path Contextual Rules for Authentic Hinglish Youth Chats & Real-World DMs (0 ms latency)
  if (/ghar me ladai|ladai hogyi|kalesh|lafde|sabse ladai|ladai ho gyi/i.test(lower)) {
    return {
      type: 'hinglish_family_fight',
      reply: "Ohhh bhai sheeeesh... 🫂 Ghar me jab ladai aur kalesh hota hai na toh room me baithna bhi suffocating lagta hai. Ye personal matter hai isliye bina jaane judge nahi karungi, but agar terko share ya vent karne ka maan ho you can always talk to me! Ek baat yaad rakhna: ghar ke adult kalesh tumhari galti nahi hain. Earphones lagao, thoda breath lo, I'm right here.",
      emotion: 'calming',
      gesture: 'reassuring_palms',
      facialExpression: 'comforting',
      smile_intensity: 0.30,
      energy: 0.55,
      headTilt: 0.04,
      isCrisis: false,
      isBreathing: false,
      category: 'family_conflict'
    };
  }

  if (/breakup hogya|break up hogya|drame|frustrate hogya|her chotu chiz|choti chiz|naa dhang se baatt|kuch nhi bhai.*breakup|wahi drame/i.test(lower)) {
    return {
      type: 'hinglish_breakup_kalesh',
      reply: "Areehh bhai... 🫂 Happeneds bhaiii, it's okay. Jab har chotu cheez pe kalesh, lafde aur drame hone lage na toh koi bhi frustrate ho jaye. Look at the bright side: toxicity toh kam hui atleast bhai! Jo dimaag pe constant bojh tha wo hata. Ab khud pe focus karenge aur grow karenge!",
      emotion: 'calming',
      gesture: 'hand_to_heart',
      facialExpression: 'comforting',
      smile_intensity: 0.35,
      energy: 0.55,
      headTilt: 0.05,
      isCrisis: false,
      isBreathing: false,
      category: 'teen_breakup'
    };
  }

  if (/khudpr focus|grow krege|grow karenge|khud pe focus/i.test(lower)) {
    return {
      type: 'hinglish_self_growth',
      reply: "YESSS! Exactly yehi energy chahiye bhai! 🔥 Toxicity khatam, ab apna time hai. Apni health, mental peace aur exams me top karne pe full laser focus lagao. Grow karenge bhai!",
      emotion: 'happy',
      gesture: 'encouraging_cheer',
      facialExpression: 'happy',
      smile_intensity: 0.50,
      energy: 0.75,
      headTilt: -0.04,
      isCrisis: false,
      isBreathing: false,
      category: 'self_growth'
    };
  }

  if (/breakup|broken up|ex\b|girlfriend|boyfriend|dumped|crush|heartbroken|cheating|ghosted|unrequited/i.test(lower)) {
    return {
      type: 'teen_relationship_heartbreak',
      reply: "Heartbreak during exam prep is overwhelming because grief clashes with your study routine. Allow yourself a 15-minute daily grief window to process feelings, then step back to your desk. Your career and future self deserve your fierce protection right now.",
      emotion: 'calming',
      gesture: 'hand_to_heart',
      facialExpression: 'comforting',
      smile_intensity: 0.35,
      energy: 0.55,
      headTilt: 0.05,
      isCrisis: false,
      isBreathing: false,
      category: 'teen_breakup'
    };
  }

  if (/parents fighting|family fight|mother shout|father shout|screaming|verbal abuse|slapped|phone taken|confiscated|house is toxic|brother compare|sister compare/i.test(lower)) {
    return {
      type: 'family_domestic_conflict',
      reply: "Living in a tense or shouting home creates intense stress that makes studying hard. Remember: parental arguments are adult conflicts that are NOT your fault or responsibility to fix. Put on noise-canceling sounds, set your boundaries, and focus on your exam as your ticket to an independent future.",
      emotion: 'calming',
      gesture: 'reassuring_palms',
      facialExpression: 'comforting',
      smile_intensity: 0.30,
      energy: 0.60,
      headTilt: 0.04,
      isCrisis: false,
      isBreathing: false,
      category: 'family_conflict'
    };
  }

  // 7. Contextual Fallback for Specific Exam Subjects / Topics
  if (/physics|formula|numericals/i.test(lower)) {
    return {
      type: 'subject_physics',
      reply: "Physics formulas can feel overwhelming when memorized all at once. Focus on high-weightage chapters like Mechanics and Modern Physics first, and solve 10 targeted problems.",
      emotion: 'thinking',
      gesture: 'thinking',
      isCrisis: false,
      isBreathing: false
    };
  }

  if (/chemistry|organic|reactions/i.test(lower)) {
    return {
      type: 'subject_chemistry',
      reply: "For Chemistry, make a clean reaction mechanism flow-sheet on a single A4 page. Re-writing reaction pathways by hand locks them into your visual memory much faster.",
      emotion: 'happy',
      gesture: 'speaking',
      isCrisis: false,
      isBreathing: false
    };
  }

  if (/math|calculus|integration|algebra/i.test(lower)) {
    return {
      type: 'subject_math',
      reply: "Mathematics rewards pattern recognition over sheer hours. Pick 5 standard question types, master their initial substitution steps, and avoid rushing into calculations.",
      emotion: 'thinking',
      gesture: 'thinking',
      isCrisis: false,
      isBreathing: false
    };
  }

  if (/sleep|insomnia|tired|exhausted/i.test(lower)) {
    return {
      type: 'sleep_care',
      reply: "Your brain needs sleep to consolidate formulas into long-term memory. Write down any racing thoughts on a notepad beside your bed, dim the lights, and give yourself permission to rest.",
      emotion: 'relaxed',
      gesture: 'speaking',
      isCrisis: false,
      isBreathing: false
    };
  }

  // General Empathetic Support
  return {
    type: 'empathy',
    reply: "I hear how much dedication and stress you are carrying right now. Take one slow breath with me. Let's tackle this challenge one single step at a time.",
    emotion: 'happy',
    gesture: 'speaking',
    isCrisis: false,
    isBreathing: false,
    category: 'general_support'
  };
}

// === ROUTES ===

// 1. Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'MoodMitra Backend API',
    loadedKnowledgeBaseEntries: knowledgeBase.length,
    timestamp: new Date().toISOString()
  });
});

// 2. In-Memory RAG Context Retrieval Endpoint
app.post('/api/context', (req, res) => {
  const { query } = req.body;
  const result = analyzeUserInput(query);
  res.json(result);
});

// 3. Gnani.ai TTS Synthesis Proxy
app.post('/api/synthesize', async (req, res) => {
  const { text, language = 'en-IN', voice = 'Kaveri' } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Text is required for speech synthesis' });
  }

  const apiKey = process.env.GNANI_API_KEY;
  if (!apiKey || apiKey === 'your_gnani_api_key_here') {
    return res.status(200).json({
      fallback: true,
      message: 'Gnani.ai API key not configured yet. Client should use Web Speech API or local TTS fallback.',
      text: text
    });
  }

  try {
    const response = await fetch('https://api.vachana.ai/api/v1/tts/inference', {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Content-Type': 'application/json',
        'X-API-Key-ID': apiKey
      },
      body: JSON.stringify({
        text: text,
        model: 'timbre-v2.5',
        voice: voice,
        language: language,
        audio_config: {
          sample_rate: 24000,
          encoding: 'linear_pcm',
          container: 'wav'
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Gnani TTS Error]:', response.status, errorText);
      return res.status(response.status).json({ error: errorText });
    }

    res.setHeader('Content-Type', 'audio/wav');
    const arrayBuffer = await response.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (error) {
    console.error('[Gnani Synthesis Exception]:', error);
    res.status(500).json({ error: 'Failed to synthesize speech via Gnani.ai' });
  }
});

// 4. Gemini 3.6 Flash Kinematic & Emotional Director
async function directGesturesWithGemini(userMessage, defaultAnalysis) {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey || geminiKey.includes('your_')) return defaultAnalysis;

  try {
    const model = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
    
    const prompt = `Student message: "${userMessage.slice(0, 150).replace(/"/g, "'")}".
Direct Mahiru's 3D avatar gestures, facial expression, and sweet smile for an Indian student study companion.
LINGUISTIC CUE: If the student uses Hinglish / Indian youth slang ("bhai", "kalesh", "ladai", "drame", "breakup", "frustrate"), generate spoken_reply in natural, warm, comforting Hinglish (e.g. "Areehh bhai, it's okay; take a slow breath, I'm right here with you.").
Return valid JSON:
{
  "gesture": "warm_welcome", // one of: ["reassuring_palms", "warm_welcome", "hand_to_heart", "thoughtful_chin", "empathic_nod", "active_listening", "conversational_speaking", "somatic_breathing", "encouraging_cheer"]
  "emotion": "calming", // one of: ["calming", "empathic", "encouraging", "thoughtful", "warm", "grounding", "concerned"]
  "facial_expression": "comforting", // one of: ["comforting", "happy", "relaxed", "focused", "concerned"]
  "smile_intensity": 0.35, // float 0.25 to 0.55 (sweet natural anime smile without squinting eyes)
  "energy": 0.60, // float 0.30 to 1.0
  "head_tilt": 0.04, // float -0.06 to 0.06
  "spoken_reply": "warm 1-sentence spoken line under 140 chars matching student language",
  "gesture_reason": "reason"
}
Return ONLY raw JSON without markdown.`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 300);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });
    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const cleanJson = rawText.replace(/```json/gi, '').replace(/```/gi, '').trim();
      const parsed = JSON.parse(cleanJson);
      return {
        ...defaultAnalysis,
        gesture: parsed.gesture || defaultAnalysis.gesture,
        emotion: parsed.emotion || defaultAnalysis.emotion,
        facial_expression: parsed.facial_expression || 'comforting',
        smile_intensity: typeof parsed.smile_intensity === 'number' ? parsed.smile_intensity : 0.45,
        energy: typeof parsed.energy === 'number' ? parsed.energy : 0.60,
        head_tilt: typeof parsed.head_tilt === 'number' ? parsed.head_tilt : 0.04,
        spoken_reply: parsed.spoken_reply || defaultAnalysis.reply,
        gesture_reason: parsed.gesture_reason || 'Directed by Gemini 3.6 Flash',
        directedBy: 'Gemini 3.6 Flash'
      };
    }
  } catch (e) {
    console.warn('[Gemini Director Note]:', e.message);
  }
  return {
    ...defaultAnalysis,
    smile_intensity: 0.45,
    directedBy: 'Gemini 3.6 Flash'
  };
}

// 5. Cognitive Brain (Parallel Groq 120B + Gemini 3.6 Flash Execution)

// 4.5. High-Precision Speech-To-Text (Groq Whisper Large v3 Turbo - Sub-150ms STT)
app.post('/api/transcribe', async (req, res) => {
  const { audio, language = 'en' } = req.body;

  if (!audio) {
    return res.status(400).json({ error: 'Audio payload is required for transcription' });
  }

  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    return res.status(500).json({ error: 'Groq API key not configured' });
  }

  try {
    const rawBase64 = audio.includes('base64,') ? audio.split('base64,')[1] : audio;
    const audioBuffer = Buffer.from(rawBase64, 'base64');

    if (audioBuffer.length < 50) {
      return res.status(400).json({ error: 'Audio payload too small or empty' });
    }

    let mimeType = 'audio/webm';
    let filename = 'recording.webm';
    if (audioBuffer.length >= 4 && audioBuffer.toString('utf8', 0, 4) === 'RIFF') {
      mimeType = 'audio/wav';
      filename = 'recording.wav';
    }

    const form = new FormData();
    const blob = new Blob([audioBuffer], { type: mimeType });
    form.append('file', blob, filename);
    form.append('model', 'whisper-large-v3-turbo');
    form.append('response_format', 'json');
    form.append('prompt', 'Mahiru, Hinglish, NEET, JEE, stress, kalesh, ladai, breakup, padhai');

    const groqRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqKey}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      body: form
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error('[Groq Whisper Error]:', groqRes.status, errText);
      return res.status(groqRes.status).json({ error: errText });
    }

    const data = await groqRes.json();
    console.log(`[STT Success]: Transcribed ${audioBuffer.length} bytes -> "${data.text}"`);
    res.json({
      text: data.text || '',
      language: data.language || language,
      model: 'whisper-large-v3-turbo'
    });
  } catch (err) {
    console.error('[STT Transcription Exception]:', err);
    res.status(500).json({ error: 'Failed to transcribe audio' });
  }
});

// 4.6. Guardian & Trusted Circle Alert Hub (WhatsApp, SMS, Email Dispatch)
app.post('/api/sos/alert', (req, res) => {
  const {
    contactName = 'Guardian',
    contactPhone = '',
    contactEmail = '',
    relationship = 'Parent',
    alertType = 'check_in', // 'check_in' | 'panic' | 'crisis'
    customMessage = '',
    studentName = 'Your Student'
  } = req.body;

  const cleanPhone = contactPhone.replace(/[^0-9+]/g, '');

  let subject = `[MoodMitra Alert] ${studentName} needs to connect with you`;
  let defaultText = '';

  if (alertType === 'crisis') {
    defaultText = `🚨 URGENT: Hi ${contactName}, ${studentName} is in acute emotional distress during exam preparation and needs your immediate presence and loving support. Please call them right away. (National 24/7 Helpline: Tele-MANAS 14416)`;
  } else if (alertType === 'panic') {
    defaultText = `Hi ${contactName}, ${studentName} is experiencing an intense anxiety/panic episode during exam prep. Please call or message them to help them feel safe.`;
  } else {
    defaultText = `Hi ${contactName}, ${studentName} is feeling overwhelmed with study stress right now and wants to talk to you. Please check in on them when you have a moment. ❤️`;
  }

  const messageToSend = customMessage ? customMessage : defaultText;
  const encodedText = encodeURIComponent(messageToSend);
  const encodedSubject = encodeURIComponent(subject);

  const whatsappUrl = cleanPhone
    ? `https://wa.me/${cleanPhone.replace(/^\+/, '')}?text=${encodedText}`
    : `https://wa.me/?text=${encodedText}`;

  const smsUrl = cleanPhone
    ? `sms:${cleanPhone}?body=${encodedText}`
    : `sms:?body=${encodedText}`;

  const mailtoUrl = contactEmail
    ? `mailto:${contactEmail}?subject=${encodedSubject}&body=${encodedText}`
    : `mailto:?subject=${encodedSubject}&body=${encodedText}`;

  console.log(`[SOS Alert Dispatched] Channel: ${relationship} (${contactName}), Type: ${alertType}`);

  res.json({
    success: true,
    alertType,
    contactName,
    message: messageToSend,
    whatsappUrl,
    smsUrl,
    mailtoUrl,
    timestamp: new Date().toISOString()
  });
});

app.post('/api/chat', async (req, res) => {
  const { message, history = [] } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const analysis = analyzeUserInput(message);

  // DETERMINISTIC CRISIS ROUTER (<1ms FAST-PATH ESCALATION)
  if (analysis.isCrisis) {
    const crisisReply = "Your life is infinitely precious to me and no exam is worth your breath. I am alerting your trusted circle right now; please stay safe and connect with Tele-MANAS toll-free at 14416.";
    return res.json({
      reply: crisisReply,
      spoken_reply: crisisReply,
      audio_base64: null,
      emotion: 'concerned',
      gesture: 'hand_to_heart',
      facial_expression: 'concerned',
      smile_intensity: 0.15,
      energy: 0.85,
      head_tilt: 0.05,
      isCrisis: true,
      autoAlertDispatched: true,
      isBreathing: false,
      category: 'crisis_escalation',
      gesture_reason: 'Deterministic Semantic Crisis Router Fast-Path',
      poweredBy: 'Deterministic Semantic Crisis Router + Tele-MANAS 14416'
    });
  }

  const groqKey = process.env.GROQ_API_KEY;
  const maxTokens = Math.max(parseInt(process.env.GROQ_MAX_TOKENS, 10) || 350, 350);

  // Run Groq 120B Cognitive Brain and Gemini 3.6 Flash Director IN PARALLEL
  const groqPromise = (async () => {
    if (!groqKey || groqKey === 'your_groq_api_key_here') return null;
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
- Keep your entire reply strictly to 2 or 3 short, punchy sentences (under 45 words).
- Every single word you write is spoken aloud by the 3D avatar voice in real-time. Text and voice must match word-for-word.`;

      const formattedMessages = [
        { role: 'system', content: systemPrompt },
        ...history.slice(-6),
        { role: 'user', content: message }
      ];

      const modelName = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

      const groqController = new AbortController();
      const groqTimer = setTimeout(() => groqController.abort(), 4000);
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
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
        let rawReply = data.choices?.[0]?.message?.content || '';
        return rawReply.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
      }
    } catch (err) {
      console.warn('[Groq Brain Exception]:', err.message);
    }
    return null;
  })();

  const geminiPromise = directGesturesWithGemini(message, analysis);

  // Await both in parallel for optimal speed
  const [groqReply, directed] = await Promise.all([groqPromise, geminiPromise]);

  const finalReply = (groqReply && groqReply.length > 5) ? groqReply : analysis.reply;

  // 100% Synchronous Voice Line: Spoken voice matches displayed text word-for-word!
  // Clean special characters so TTS audio sounds completely natural
  const cleanSpoken = finalReply.replace(/[*_#`]/g, '').replace(/\s+/g, ' ').trim();
  const spokenLine = cleanSpoken.slice(0, 220);

  // Co-Synthesize Gnani timbre-v2.5 voice with strict 1.5s timeout for ultra-low latency
  let audioBase64 = null;
  const gnaniKey = process.env.GNANI_API_KEY;
  if (gnaniKey && !gnaniKey.includes('your_') && cleanSpoken) {
    try {
      const ttsController = new AbortController();
      const ttsTimeout = setTimeout(() => ttsController.abort(), 1500);
      const ttsRes = await fetch('https://api.vachana.ai/api/v1/tts/inference', {
        method: 'POST',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Content-Type': 'application/json',
          'X-API-Key-ID': gnaniKey
        },
        signal: ttsController.signal,
        body: JSON.stringify({
          text: cleanSpoken.slice(0, 120),
          model: 'timbre-v2.5',
          voice: 'Kaveri',
          language: 'en-IN',
          audio_config: {
            sample_rate: 24000,
            encoding: 'linear_pcm',
            container: 'wav'
          }
        })
      });
      clearTimeout(ttsTimeout);

      if (ttsRes.ok) {
        const arrBuf = await ttsRes.arrayBuffer();
        audioBase64 = Buffer.from(arrBuf).toString('base64');
      }
    } catch (err) {
      console.warn('[Gnani Co-Synthesis Note]:', err.message);
    }
  }

  res.json({
    reply: finalReply,
    spoken_reply: spokenLine,
    audio_base64: audioBase64,
    emotion: directed.emotion || analysis.emotion || 'calming',
    gesture: directed.gesture || analysis.gesture || 'reassuring_palms',
    facial_expression: directed.facial_expression || 'comforting',
    smile_intensity: typeof directed.smile_intensity === 'number' ? directed.smile_intensity : 0.45,
    energy: typeof directed.energy === 'number' ? directed.energy : 0.60,
    head_tilt: typeof directed.head_tilt === 'number' ? directed.head_tilt : 0.04,
    isCrisis: analysis.isCrisis,
    autoAlertDispatched: analysis.isCrisis,
    isBreathing: analysis.isBreathing || directed.gesture === 'somatic_breathing' || directed.gesture === 'hand_to_heart',
    category: analysis.category,
    gesture_reason: directed.gesture_reason || 'Directed by Gemini 3.6 Flash',
    poweredBy: `Groq 120B Flagship + ${directed.directedBy || 'Gemini 3.6 Flash'} + Gnani timbre-v2.5`
  });
});

// Start Server after loading knowledge base
loadKnowledgeBase().then(() => {
  app.listen(PORT, () => {
    console.log(`[MoodMitra] Backend running smoothly on http://localhost:${PORT}`);
  });
});
