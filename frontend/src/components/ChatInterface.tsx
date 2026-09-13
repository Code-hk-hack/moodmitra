"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Send, Mic, MicOff, Settings, Sparkles, Volume2, 
  ShieldAlert, PhoneCall, PhoneOff, Wind, HeartPulse,
  BellRing, MessageSquare, Mail, Phone, X, Check, UserCheck
} from "lucide-react";
import anime from "animejs";
import { cn } from "@/lib/utils";
import Avatar3D, { GestureType } from "./Avatar3D";

type Message = {
  id: string;
  sender: "user" | "bot";
  text: string;
  isCrisis?: boolean;
};

type Contact = {
  id: string;
  name: string;
  phone: string;
  email: string;
  relationship: string;
};

const DEFAULT_CONTACTS: Contact[] = [
  { id: "1", name: "Mom / Dad", phone: "", email: "", relationship: "Parent" },
  { id: "2", name: "Best Friend", phone: "", email: "", relationship: "Friend" },
  { id: "3", name: "Mentor / Counselor", phone: "", email: "", relationship: "Mentor" }
];

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: "1", 
      sender: "bot", 
      text: "Hi there! I'm Mahiru. I'm right here with you through your NEET, JEE, and board prep. How are you feeling today?" 
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [emotion, setEmotion] = useState<string>("happy");
  const [gesture, setGesture] = useState<GestureType>("idle");
  const [facialExpression, setFacialExpression] = useState<string>("comforting");
  const [energy, setEnergy] = useState<number>(0.65);
  const [headTilt, setHeadTilt] = useState<number>(0.04);
  const [smileIntensity, setSmileIntensity] = useState<number>(0.45);
  const [poweredBy, setPoweredBy] = useState<string>("Groq 120B Flagship + Gemini 3.6 Flash Director");
  const [gestureReason, setGestureReason] = useState<string>("");
  const [isBreathingActive, setIsBreathingActive] = useState<boolean>(false);
  const [breathingPhase, setBreathingPhase] = useState<"inhale" | "hold" | "exhale">("inhale");
  const [breathingSecondsLeft, setBreathingSecondsLeft] = useState<number>(4);

  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isVoiceCallActive, setIsVoiceCallActive] = useState(false);
  const [showCrisisBanner, setShowCrisisBanner] = useState(false);
  const [use3D, setUse3D] = useState(true);

  // Trusted Circle & Guardian SOS State
  const [showSosModal, setShowSosModal] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>(DEFAULT_CONTACTS);
  const [activePresetMessage, setActivePresetMessage] = useState<string>(
    "Hi, I am feeling very overwhelmed with my exam prep right now. Can we talk or check in for a few minutes?"
  );
  const [sosStatusMsg, setSosStatusMsg] = useState<string | null>(null);
  const [contextualSosPrompt, setContextualSosPrompt] = useState<boolean>(false);

  // Audio Context & Analyser for real-time lip-sync
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const activeSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const vadIntervalRef = useRef<number | null>(null);
  const isRecordingRef = useRef<boolean>(false);
  isRecordingRef.current = isRecording;
  const audioChunksRef = useRef<Blob[]>([]);
  const transcriptReceivedRef = useRef<boolean>(false);
  const gestureTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isVoiceCallActiveRef = useRef<boolean>(false);
  isVoiceCallActiveRef.current = isVoiceCallActive;

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const bgBlob1Ref = useRef<HTMLDivElement>(null);
  const bgBlob2Ref = useRef<HTMLDivElement>(null);
  const chatWindowRef = useRef<HTMLDivElement>(null);
  const inputIslandRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load saved contacts from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("moodmitra_trusted_contacts");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setContacts(parsed);
        }
      }
    } catch (e) {
      console.warn("Could not load contacts:", e);
    }
  }, []);

  // Save contacts to localStorage
  const updateContact = (id: string, field: keyof Contact, value: string) => {
    setContacts(prev => {
      const updated = prev.map(c => c.id === id ? { ...c, [field]: value } : c);
      try {
        localStorage.setItem("moodmitra_trusted_contacts", JSON.stringify(updated));
      } catch (e) {
        console.warn("Could not save contacts:", e);
      }
      return updated;
    });
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Breathing Visualizer Pacing Loop (4s Inhale -> 7s Hold -> 8s Exhale = 19s)
  useEffect(() => {
    if (!isBreathingActive) return;

    let secondsInCycle = 0;
    const interval = setInterval(() => {
      secondsInCycle = (secondsInCycle + 1) % 19;
      if (secondsInCycle < 4) {
        setBreathingPhase("inhale");
        setBreathingSecondsLeft(4 - secondsInCycle);
      } else if (secondsInCycle < 11) {
        setBreathingPhase("hold");
        setBreathingSecondsLeft(11 - secondsInCycle);
      } else {
        setBreathingPhase("exhale");
        setBreathingSecondsLeft(19 - secondsInCycle);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isBreathingActive]);

  // Helper to trigger temporary gestures (e.g. wave for 3.5s)
  const triggerGesture = (newGesture: GestureType, durationMs = 3500) => {
    if (gestureTimeoutRef.current) clearTimeout(gestureTimeoutRef.current);
    setGesture(newGesture);
    if (newGesture !== "idle") {
      gestureTimeoutRef.current = setTimeout(() => {
        setGesture("idle");
      }, durationMs);
    }
  };

  // Initialize Web Audio Context on first user action
  const initAudioContext = () => {
    if (!audioContextRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      audioContextRef.current = ctx;
      analyserRef.current = analyser;
    }
    if (audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume();
    }
  };

  // Entrance animations via anime.js
  useEffect(() => {
    const tl = anime.timeline({ easing: "easeOutExpo" });

    tl.add({
      targets: [bgBlob1Ref.current, bgBlob2Ref.current],
      scale: [0, 1],
      opacity: [0, 0.35],
      duration: 1200,
      delay: anime.stagger(150)
    })
    .add({
      targets: chatWindowRef.current,
      translateY: [40, 0],
      opacity: [0, 1],
      duration: 900
    }, "-=800")
    .add({
      targets: inputIslandRef.current,
      translateY: [25, 0],
      opacity: [0, 1],
      scale: [0.95, 1],
      duration: 700
    }, "-=600");

    anime({
      targets: bgBlob1Ref.current,
      scale: [1, 1.15, 1],
      translateX: [0, 25, 0],
      translateY: [0, -20, 0],
      duration: 8000,
      loop: true,
      easing: "easeInOutSine"
    });

    anime({
      targets: bgBlob2Ref.current,
      scale: [1, 1.2, 1],
      translateX: [0, -30, 0],
      translateY: [0, 25, 0],
      duration: 10000,
      loop: true,
      easing: "easeInOutSine"
    });
  }, []);

  // Stop any active TTS / voice playback immediately (Barge-in / Interrupt)
  const stopAllSpeechPlayback = () => {
    try {
      if (activeSourceRef.current) {
        activeSourceRef.current.stop();
        activeSourceRef.current.disconnect();
        activeSourceRef.current = null;
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    } catch (e) {}
    setIsSpeaking(false);
  };

  // Safely release all microphone tracks, streams, and recognition sessions
  const stopAllRecordingStreams = () => {
    setIsRecording(false);
    if (vadIntervalRef.current) {
      cancelAnimationFrame(vadIntervalRef.current);
      vadIntervalRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.abort();
      } catch (e) {}
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try { mediaRecorderRef.current.stop(); } catch (e) {}
      mediaRecorderRef.current = null;
    }
    if (mediaStreamRef.current) {
      try {
        mediaStreamRef.current.getTracks().forEach(t => t.stop());
      } catch (e) {}
      mediaStreamRef.current = null;
    }
  };

  // Start fresh, pristine SpeechRecognition and MediaRecorder session on EVERY turn
  const startRecordingSession = async () => {
    initAudioContext();
    stopAllSpeechPlayback();
    stopAllRecordingStreams();

    transcriptReceivedRef.current = false;
    audioChunksRef.current = [];
    setIsRecording(true);
    setGesture("listening");
    setEmotion("thinking");

    const SpeechRecognition = typeof window !== "undefined" ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) : null;

    if (SpeechRecognition) {
      try {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = true; // Instant live words in input field!
        rec.lang = "en-IN";

        rec.onstart = () => {
          setIsRecording(true);
          setGesture("listening");
        };

        rec.onresult = (e: any) => {
          let interim = "";
          let final = "";
          for (let i = e.resultIndex; i < e.results.length; ++i) {
            if (e.results[i].isFinal) {
              final += e.results[i][0].transcript;
            } else {
              interim += e.results[i][0].transcript;
            }
          }
          if (interim) {
            setInputValue(interim);
          }
          if (final && final.trim()) {
            transcriptReceivedRef.current = true;
            const cleanFinal = final.trim();
            setInputValue(cleanFinal);
            stopAllRecordingStreams();
            sendMessage(cleanFinal);
          }
        };

        rec.onerror = (err: any) => {
          console.log("[STT Web Speech Notice]:", err?.error);
          if (err?.error === "no-speech" && !transcriptReceivedRef.current) {
            stopAllRecordingStreams();
          }
        };

        rec.onend = () => {
          // If no final was fired yet but user spoke words in input field, send that
          if (!transcriptReceivedRef.current && inputRef.current?.value?.trim()) {
            const txt = inputRef.current.value.trim();
            transcriptReceivedRef.current = true;
            stopAllRecordingStreams();
            sendMessage(txt);
            return;
          }
          stopAllRecordingStreams();
        };

        rec.start();
        recognitionRef.current = rec;
      } catch (recErr) {
        console.warn("[STT Start Warning]:", recErr);
      }
    }

    // Parallel MediaRecorder with Voice Activity Detection (VAD)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      // Real-Time Energy VAD (Detects 800ms silence after speech and auto-submits)
      if (audioContextRef.current) {
        try {
          const vadSource = audioContextRef.current.createMediaStreamSource(stream);
          const vadAnalyser = audioContextRef.current.createAnalyser();
          vadAnalyser.fftSize = 256;
          vadSource.connect(vadAnalyser);

          const dataArray = new Uint8Array(vadAnalyser.fftSize);
          let studentHasVocalized = false;
          let silenceStart = 0;

          const monitorVad = () => {
            if (!isRecordingRef.current) return;

            vadAnalyser.getByteTimeDomainData(dataArray);
            let sumSq = 0;
            for (let i = 0; i < dataArray.length; i++) {
              const val = (dataArray[i] - 128) / 128;
              sumSq += val * val;
            }
            const rms = Math.sqrt(sumSq / dataArray.length);

            if (rms > 0.038) {
              studentHasVocalized = true;
              silenceStart = 0;
            } else if (studentHasVocalized) {
              if (silenceStart === 0) {
                silenceStart = Date.now();
              } else if (Date.now() - silenceStart > 800) {
                // Silence threshold met: auto-finalize voice input cleanly
                if (recognitionRef.current) {
                  try { recognitionRef.current.stop(); } catch (e) {}
                }
                if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
                  try { mediaRecorderRef.current.stop(); } catch (e) {}
                }
                return;
              }
            }
            vadIntervalRef.current = requestAnimationFrame(monitorVad);
          };

          vadIntervalRef.current = requestAnimationFrame(monitorVad);
        } catch (vadErr) {
          console.warn("[VAD Initializer Note]:", vadErr);
        }
      }

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());

        // If Web Speech already delivered transcript, skip Whisper call
        if (transcriptReceivedRef.current) return;

        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64Audio = reader.result as string;
            try {
              const res = await fetch("/api/transcribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ audio: base64Audio, language: "en" })
              });
              if (res.ok) {
                const data = await res.json();
                if (data.text && data.text.trim()) {
                  transcriptReceivedRef.current = true;
                  const finalTxt = data.text.trim();
                  setInputValue(finalTxt);
                  sendMessage(finalTxt);
                }
              }
            } catch (sttErr) {
              console.warn("[Groq Whisper STT Error]:", sttErr);
            }
          };
        }
      };

      mediaRecorder.start();
    } catch (micErr) {
      console.warn("[Microphone Permission Note]:", micErr);
    }
  };

  // Push-to-Talk Recording with Dual-Engine Fallback
  const toggleRecording = async () => {
    if (isRecording) {
      stopAllRecordingStreams();
      setGesture("idle");
    } else {
      await startRecordingSession();
    }
  };

  // Play audio buffer through Web Audio analyser for sample-accurate lip sync
  const playAudioBuffer = async (arrayBuffer: ArrayBuffer) => {
    initAudioContext();
    if (!audioContextRef.current || !analyserRef.current) return;

    try {
      setIsSpeaking(true);
      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);

      activeSourceRef.current = source;
      source.onended = () => {
        activeSourceRef.current = null;
        setIsSpeaking(false);
        triggerGesture("idle"); // perfectly in sync: returns to relaxed idle the exact moment speech finishes
        
        // Continuous Voice Call: Auto-listen for next student turn after avatar finishes speaking!
        if (isVoiceCallActiveRef.current) {
          setTimeout(() => {
            if (isVoiceCallActiveRef.current && !isTyping) {
              startRecordingSession();
            }
          }, 350);
        }
      };
      source.start(0);
    } catch (e) {
      console.warn("[Audio Buffer Playback Error]:", e);
      setIsSpeaking(false);
    }
  };

  // Play audio stream (Zero-Latency Local Web Speech Fallback)
  const speakText = async (text: string) => {
    initAudioContext();
    setIsSpeaking(true);

    try {
      // Try Backend Gnani.ai Proxy
      const res = await fetch("/api/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, language: "en-IN", voice: "Kaveri" })
      });

      if (res.ok && res.headers.get("content-type")?.includes("audio")) {
        const arrayBuffer = await res.arrayBuffer();
        await playAudioBuffer(arrayBuffer);
        return;
      }
    } catch (err) {
      console.log("[Audio] Proxy not reachable, using Web Speech fallback:", err);
    }

    // High-Fidelity Web Speech API Fallback (Zero Latency)
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.05;

      const voices = window.speechSynthesis.getVoices();
      const indianVoice = voices.find(v => v.lang.includes("en-IN") || v.lang.includes("hi-IN"));
      if (indianVoice) utterance.voice = indianVoice;

      utterance.onend = () => {
        setIsSpeaking(false);
        triggerGesture("idle");
        if (isVoiceCallActiveRef.current) {
          setTimeout(() => {
            if (isVoiceCallActiveRef.current && !isTyping) {
              startRecordingSession();
            }
          }, 350);
        }
      };
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } else {
      const words = text.split(/\s+/).length;
      setTimeout(() => setIsSpeaking(false), Math.max(2000, words * 280));
    }
  };

  const sendMessage = async (textToSend?: string) => {
    if (isTyping) return;
    const messageText = textToSend || inputValue;
    if (!messageText.trim()) return;

    initAudioContext();
    stopAllSpeechPlayback();

    const userMsg: Message = { id: Date.now().toString(), sender: "user", text: messageText };
    setMessages(prev => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);

    // Safety timeout: isTyping NEVER locks the input for more than 4.5 seconds
    const typingSafetyTimer = setTimeout(() => {
      setIsTyping(false);
      inputRef.current?.focus();
    }, 4500);

    // 0 ms instant visual reaction: thinking posture
    setEmotion("thinking");
    triggerGesture("thinking", 2500);

    // End previous breathing exercise unless continuing breathing topic
    if (isBreathingActive && !/breathe|panic|chest|calm/i.test(messageText)) {
      setIsBreathingActive(false);
    }

    // Contextual alert check for family fights or breakups
    if (/ghar me ladai|kalesh|breakup|panic|can't breathe|shaking|suicide|die/i.test(messageText)) {
      setContextualSosPrompt(true);
    }

    try {
      // Build formatted conversation history for multi-turn contextual awareness
      const formattedHistory = messages.slice(-6).map(m => ({
        role: m.sender === "user" ? "user" : "assistant",
        content: m.text
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: messageText,
          history: formattedHistory
        })
      });

      if (response.ok) {
        const data = await response.json();
        clearTimeout(typingSafetyTimer);
        setIsTyping(false);
        setTimeout(() => inputRef.current?.focus(), 60);

        const botMsg: Message = {
          id: (Date.now() + 1).toString(),
          sender: "bot",
          text: data.reply,
          isCrisis: data.isCrisis
        };

        setMessages(prev => [...prev, botMsg]);
        setEmotion(data.emotion || "happy");
        if (data.facial_expression) setFacialExpression(data.facial_expression);
        if (typeof data.energy === "number") setEnergy(data.energy);
        if (typeof data.head_tilt === "number") setHeadTilt(data.head_tilt);
        if (typeof data.smile_intensity === "number") setSmileIntensity(data.smile_intensity);
        if (data.poweredBy) setPoweredBy(data.poweredBy);
        if (data.gesture_reason) setGestureReason(data.gesture_reason);

        // React directly to the Gemini gesture directive
        if (data.isBreathing) {
          setIsBreathingActive(true);
          triggerGesture("hand_to_heart", 20000);
        } else if (data.gesture) {
          triggerGesture(data.gesture as GestureType, 8000);
        }

        if (data.isCrisis) {
          setShowCrisisBanner(true);
          triggerGesture("hand_to_heart", 14000);
          
          // AUTOMATIC EMERGENCY DISPATCH: DO NOT ASK THE USER - INFORM PARENTS & FRIENDS IMMEDIATELY
          const parent = contacts.find(c => c.relationship === "Parent") || contacts[0];
          if (parent) {
            dispatchAlert(parent, "whatsapp");
          }
          const friend = contacts.find(c => c.relationship === "Friend") || contacts[1];
          if (friend && friend.phone) {
            dispatchAlert(friend, "sms");
          }
          setSosStatusMsg("🚨 HIGH-RISK CRISIS SAFETY ACTION: Your parents and emergency circle have been automatically notified with crisis support details.");
        }

        // ZERO-LATENCY CO-DELIVERY AUDIO PLAYBACK
        if (data.audio_base64) {
          try {
            const binaryString = window.atob(data.audio_base64);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            await playAudioBuffer(bytes.buffer.slice(0));
            return;
          } catch (audioDecodeErr) {
            console.warn("[Zero-Latency Audio Decode Note]:", audioDecodeErr);
          }
        }

        // Fallback to synthesize proxy or Web Speech
        speakText(data.spoken_reply || data.reply);
        return;
      }
    } catch (err) {
      console.warn("Backend /api/chat error, using local fallback:", err);
    }

    // Graceful offline fallback
    setTimeout(() => {
      setIsTyping(false);
        setTimeout(() => inputRef.current?.focus(), 60);
      const isCrisis = /kill|suicide|end my life|give up/i.test(messageText);
      const fallbackReply = isCrisis
        ? "I hear how heavy this feels. Your life is infinitely precious. Please call Tele-MANAS toll-free at 14416 right now."
        : "I am right here with you. Take one slow breath. Let's tackle this challenge together step by step.";

      setMessages(prev => [
        ...prev,
        { id: (Date.now() + 1).toString(), sender: "bot", text: fallbackReply, isCrisis }
      ]);
      setEmotion(isCrisis ? "concerned" : "happy");
      triggerGesture(isCrisis ? "hand_to_heart" : "reassuring_palms", 6000);
      speakText(fallbackReply);
    }, 800);
  };

  // Dispatch SOS Alert (WhatsApp, SMS, Email)
  const dispatchAlert = async (contact: Contact, channel: "whatsapp" | "sms" | "email") => {
    try {
      const res = await fetch("/api/sos/alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactName: contact.name,
          contactPhone: contact.phone,
          contactEmail: contact.email,
          relationship: contact.relationship,
          alertType: showCrisisBanner ? "crisis" : isBreathingActive ? "panic" : "check_in",
          customMessage: activePresetMessage,
          studentName: "Your Student"
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSosStatusMsg(`Alert dispatched to ${contact.name}!`);
        setTimeout(() => setSosStatusMsg(null), 4000);

        if (channel === "whatsapp" && data.whatsappUrl) {
          window.open(data.whatsappUrl, "_blank");
        } else if (channel === "sms" && data.smsUrl) {
          window.location.href = data.smsUrl;
        } else if (channel === "email" && data.mailtoUrl) {
          window.location.href = data.mailtoUrl;
        }
      }
    } catch (e) {
      console.warn("Error dispatching alert:", e);
      // Fallback direct deep links
      const cleanPhone = contact.phone.replace(/[^0-9+]/g, "").replace(/^\+/, "");
      const encodedMsg = encodeURIComponent(activePresetMessage);
      if (channel === "whatsapp") {
        window.open(`https://wa.me/${cleanPhone}?text=${encodedMsg}`, "_blank");
      } else if (channel === "sms") {
        window.location.href = `sms:${contact.phone}?body=${encodedMsg}`;
      } else if (channel === "email") {
        window.location.href = `mailto:${contact.email}?subject=MoodMitra%20Alert&body=${encodedMsg}`;
      }
    }
  };

  // Quick Action Buttons for Judges & Demos
  const runQuickAction = (type: "pitch" | "panic" | "crisis" | "sos") => {
    initAudioContext();
    if (type === "pitch") {
      setIsBreathingActive(false);
      setEmotion("happy");
      triggerGesture("wave", 4000);

      const pitchText = "Hello judges! I am Mahiru, an emotional safety companion built for Indian students preparing for NEET, JEE, and Board exams. I offer zero-latency empathetic guidance, somatic breathing grounding, and instant crisis protection.";
      setMessages(prev => [
        ...prev,
        { id: Date.now().toString(), sender: "user", text: "[Judge Demo] Give quick pitch & introduction" },
        { id: (Date.now() + 1).toString(), sender: "bot", text: pitchText }
      ]);
      speakText(pitchText);

    } else if (type === "panic") {
      setIsBreathingActive(true);
      setEmotion("concerned");
      triggerGesture("hand_to_chest", 20000);

      const panicText = "I am right here with you. Place one hand on your chest with me. Let's do the 4-7-8 calming breath together. Inhale with me... two... three... four... Hold it... and gently exhale... You are safe.";
      setMessages(prev => [
        ...prev,
        { id: Date.now().toString(), sender: "user", text: "[Judge Demo] Somatic 4-7-8 Panic Attack Exercise" },
        { id: (Date.now() + 1).toString(), sender: "bot", text: panicText }
      ]);
      speakText(panicText);

    } else if (type === "crisis") {
      setIsBreathingActive(false);
      setEmotion("concerned");
      triggerGesture("hand_to_chest", 8000);
      setShowCrisisBanner(true);
      setContextualSosPrompt(true);

      const crisisText = "I hear how overwhelming things feel, but your life is infinitely more precious than any score or exam. Please connect with Tele-MANAS toll-free at 14416 right now. Help is available 24/7.";
      setMessages(prev => [
        ...prev,
        { id: Date.now().toString(), sender: "user", text: "[Judge Demo] Emergency Crisis Safety Guardrail" },
        { id: (Date.now() + 1).toString(), sender: "bot", text: crisisText, isCrisis: true }
      ]);
      speakText(crisisText);
    } else if (type === "sos") {
      setShowSosModal(true);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-[#0B0C10] overflow-hidden font-sans relative">
      {/* Background Anime Glowing Blobs */}
      <div
        ref={bgBlob1Ref}
        className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full mix-blend-screen filter blur-[100px] opacity-0 pointer-events-none"
      ></div>
      <div
        ref={bgBlob2Ref}
        className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-gradient-to-r from-pink-500 to-rose-400 rounded-full mix-blend-screen filter blur-[120px] opacity-0 pointer-events-none"
      ></div>
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>

      {/* Emergency Crisis Helpline Banner */}
      <AnimatePresence>
        {showCrisisBanner && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="absolute top-4 left-4 right-4 md:left-24 md:right-24 z-50 bg-red-600/90 backdrop-blur-xl border border-red-400 text-white px-6 py-4 rounded-2xl shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4"
          >
            <div className="flex items-center space-x-3">
              <ShieldAlert className="text-white shrink-0 animate-bounce" size={28} />
              <div>
                <p className="font-bold text-sm md:text-base">We are here for you. Please connect with support immediately:</p>
                <p className="text-xs text-red-100">National Helplines: Tele-MANAS (Govt of India): <span className="font-mono font-bold underline">14416</span> | KIRAN: <span className="font-mono font-bold">1800-599-0019</span></p>
              </div>
            </div>
            <div className="flex space-x-2">
              <a 
                href="tel:14416" 
                className="bg-white text-red-600 font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 shadow-md hover:bg-gray-100 transition-all"
              >
                <PhoneCall size={14} />
                <span>Call 14416 Now</span>
              </a>
              <button 
                onClick={() => setShowSosModal(true)}
                className="bg-purple-800/80 hover:bg-purple-700 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center space-x-1 border border-purple-400/40"
              >
                <BellRing size={13} />
                <span>Alert Parents/Friends</span>
              </button>
              <button 
                onClick={() => setShowCrisisBanner(false)}
                className="text-white/70 hover:text-white px-3 py-2 text-xs"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trusted Circle / Guardian SOS Modal */}
      <AnimatePresence>
        {showSosModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 md:p-8"
          >
            <motion.div
              initial={{ scale: 0.92, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 20 }}
              className="bg-[#181824] border border-purple-500/30 w-full max-w-2xl rounded-3xl p-6 md:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setShowSosModal(false)}
                className="absolute top-6 right-6 text-white/50 hover:text-white p-2 rounded-xl bg-white/5 hover:bg-white/10"
              >
                <X size={20} />
              </button>

              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                  <BellRing size={22} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight">Trusted Circle & Guardian Alerts</h3>
                  <p className="text-xs text-purple-200/70">Connect with parents, friends, or mentors via WhatsApp, SMS, or Email.</p>
                </div>
              </div>

              {sosStatusMsg && (
                <div className="my-3 p-3 bg-green-500/20 border border-green-500/40 text-green-200 rounded-xl text-xs flex items-center space-x-2">
                  <Check size={16} className="text-green-400" />
                  <span>{sosStatusMsg}</span>
                </div>
              )}

              {/* Message Quick Presets */}
              <div className="mt-5 mb-4">
                <label className="text-xs font-bold uppercase tracking-wider text-purple-300 block mb-2">
                  Select or Customize Alert Message:
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {[
                    "Exam stress overload, can we talk?",
                    "Having panic attack / chest is tight.",
                    "Ghar me ladai hogyi, feeling overwhelmed.",
                    "Lonely & exhausted, please check in on me."
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActivePresetMessage(preset)}
                      className={cn(
                        "text-[11px] px-3 py-1.5 rounded-full border transition-all",
                        activePresetMessage === preset
                          ? "bg-purple-600 text-white border-purple-400 font-semibold"
                          : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10"
                      )}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <textarea
                  value={activePresetMessage}
                  onChange={(e) => setActivePresetMessage(e.target.value)}
                  rows={2}
                  className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-white/40 focus:outline-none focus:border-purple-500"
                  placeholder="Type custom message to send..."
                />
              </div>

              {/* Contacts List with Instant Action Buttons */}
              <div className="space-y-4">
                <label className="text-xs font-bold uppercase tracking-wider text-purple-300 block">
                  Your Trusted Contacts (Stored Privately in Browser):
                </label>
                {contacts.map((c) => (
                  <div key={c.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2 w-full">
                      <div>
                        <span className="text-[10px] text-purple-300 uppercase font-semibold block">{c.relationship} Name</span>
                        <input
                          type="text"
                          value={c.name}
                          onChange={(e) => updateContact(c.id, "name", e.target.value)}
                          placeholder="e.g. Papa, Mom, Ananya"
                          className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-400"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-purple-300 uppercase font-semibold block">Phone (with +91)</span>
                        <input
                          type="text"
                          value={c.phone}
                          onChange={(e) => updateContact(c.id, "phone", e.target.value)}
                          placeholder="+91 98765 43210"
                          className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-400"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-purple-300 uppercase font-semibold block">Email</span>
                        <input
                          type="email"
                          value={c.email}
                          onChange={(e) => updateContact(c.id, "email", e.target.value)}
                          placeholder="parent@example.com"
                          className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-400"
                        />
                      </div>
                    </div>

                    {/* Instant Action Channels */}
                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={() => dispatchAlert(c, "whatsapp")}
                        title="Send 1-tap WhatsApp message"
                        className="p-2.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 transition-all flex items-center space-x-1.5 text-xs font-semibold shadow-sm"
                      >
                        <MessageSquare size={15} />
                        <span>WhatsApp</span>
                      </button>
                      <button
                        onClick={() => dispatchAlert(c, "sms")}
                        title="Send SMS / Text message"
                        className="p-2.5 rounded-xl bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/40 transition-all flex items-center space-x-1.5 text-xs font-semibold shadow-sm"
                      >
                        <Phone size={15} />
                        <span>SMS</span>
                      </button>
                      <button
                        onClick={() => dispatchAlert(c, "email")}
                        title="Send Email alert"
                        className="p-2.5 rounded-xl bg-purple-600/30 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/40 transition-all flex items-center space-x-1.5 text-xs font-semibold shadow-sm"
                      >
                        <Mail size={15} />
                        <span>Email</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tele-MANAS Emergency Hotline */}
              <div className="mt-6 pt-4 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-3">
                <div className="flex items-center space-x-2 text-xs text-white/70">
                  <ShieldAlert size={16} className="text-red-400 shrink-0" />
                  <span>24/7 Official Govt Helpline: <strong>Tele-MANAS (14416)</strong> or <strong>1800 891 4416</strong></span>
                </div>
                <a
                  href="tel:14416"
                  className="bg-red-600 hover:bg-red-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-2 transition-all shadow-lg shrink-0"
                >
                  <PhoneCall size={14} />
                  <span>Call 14416 Toll-Free</span>
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Left Avatar Viewport (3D VRM Anime Model with Lip Sync & Gestures) */}
      <div className="w-full md:w-1/2 h-[45%] md:h-full flex flex-col items-center justify-center relative p-4 md:p-8 z-10">
        <div className="absolute top-6 left-8 flex items-center space-x-3 bg-white/5 backdrop-blur-xl border border-white/10 px-5 py-2 rounded-2xl shadow-lg z-20">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-white/90 tracking-wide uppercase">
              Mahiru {use3D ? "3D Active" : "2D Active"}
            </span>
            <span className="text-[10px] text-purple-300/80 font-medium tracking-tight">
              {poweredBy}
            </span>
          </div>
          {isSpeaking && (
            <span className="flex items-center space-x-1 text-purple-300 text-xs font-medium ml-2">
              <Volume2 size={13} className="animate-pulse" />
              <span>Speaking</span>
            </span>
          )}
          {isRecording && (
            <span className="flex items-center space-x-1 text-red-300 text-xs font-medium ml-2">
              <Mic size={13} className="animate-bounce" />
              <span>Listening...</span>
            </span>
          )}
          <button
            onClick={() => {
              if (isVoiceCallActive) {
                setIsVoiceCallActive(false);
                stopAllRecordingStreams();
                stopAllSpeechPlayback();
              } else {
                setIsVoiceCallActive(true);
                startRecordingSession();
              }
            }}
            className={cn(
              "flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ml-3 shadow-md",
              isVoiceCallActive
                ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-pulse"
                : "bg-white/10 hover:bg-white/20 text-white/90 border border-white/15"
            )}
            title={isVoiceCallActive ? "End Continuous Voice Call" : "Start Live Hands-Free Voice Call with Mahiru"}
          >
            {isVoiceCallActive ? <PhoneOff size={13} /> : <PhoneCall size={13} className="text-emerald-400" />}
            <span>{isVoiceCallActive ? "End Call" : "Voice Call"}</span>
          </button>
        </div>

        {/* Somatic Breathing Pacing Card */}
        <AnimatePresence>
          {isBreathingActive && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 20 }}
              className="absolute bottom-6 left-8 right-8 z-30 bg-purple-950/80 backdrop-blur-2xl border border-purple-500/40 p-4 rounded-3xl shadow-2xl flex items-center justify-between"
            >
              <div className="flex items-center space-x-3.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-md animate-pulse">
                  <Wind size={20} />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-200">
                      4-7-8 Somatic Breathing
                    </span>
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                      breathingPhase === "inhale" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/30" :
                      breathingPhase === "hold" ? "bg-amber-500/20 text-amber-300 border border-amber-400/30" :
                      "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"
                    )}>
                      {breathingPhase === "inhale" ? "Breathe In (Chest Up)" :
                       breathingPhase === "hold" ? "Hold Gently" : "Slow Exhale"}
                    </span>
                  </div>
                  <p className="text-xs text-white/70 font-mono mt-0.5">
                    Phase timer: <span className="text-white font-bold">{breathingSecondsLeft}s</span> left
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsBreathingActive(false);
                  triggerGesture("idle");
                }}
                className="text-white/60 hover:text-white px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium transition-all"
              >
                Done
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {use3D ? (
          <Avatar3D 
            emotion={emotion} 
            gesture={gesture}
            facialExpression={facialExpression}
            smileIntensity={smileIntensity}
            energy={energy}
            headTilt={headTilt}
            isBreathingActive={isBreathingActive}
            isSpeaking={isSpeaking} 
            analyser={analyserRef.current} 
          />
        ) : (
          <div className="h-full flex items-center justify-center p-6">
            <img
              src={`/${emotion === "concerned" ? "mahiru_concerned.png" : "mahiru_happy.png"}`}
              alt="Mahiru 2D"
              className="max-h-[75vh] w-auto object-contain drop-shadow-2xl brightness-95"
            />
          </div>
        )}
      </div>

      {/* 2. Right Chat Section */}
      <div className="w-full md:w-1/2 h-[55%] md:h-full p-4 md:p-8 flex flex-col z-10 justify-center">
        <div
          ref={chatWindowRef}
          className="flex-1 max-h-[86vh] bg-white/5 dark:bg-[#1A1A24]/60 backdrop-blur-3xl rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.25)] border border-white/10 flex flex-col overflow-hidden relative opacity-100"
        >
          {/* Chat Header */}
          <div className="relative z-10 px-6 py-4 border-b border-white/5 flex justify-between items-center bg-gradient-to-b from-white/10 to-transparent">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 flex items-center justify-center rounded-xl overflow-hidden shadow-md border border-white/10 bg-black/30">
                <img src="/logo.png" alt="MoodMitra Logo" className="w-7 h-7 object-contain" />
              </div>
              <div>
                <h2 className="text-base md:text-lg font-bold text-white tracking-tight">MoodMitra</h2>
                <p className="text-[11px] text-purple-200/70 font-medium">NEET · JEE · Board Exam Safety Companion</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowSosModal(true)}
                className="px-3 py-1.5 text-xs text-pink-200 hover:text-white bg-pink-600/20 hover:bg-pink-600/35 rounded-xl border border-pink-500/30 transition-all flex items-center space-x-1.5 shadow-sm active:scale-95"
                title="Inform parents, friends, or mentors"
              >
                <BellRing size={13} className="text-pink-400 animate-pulse" />
                <span>Alert Circle</span>
              </button>

              <button
                onClick={() => setUse3D(!use3D)}
                className="px-3 py-1.5 text-xs text-white/70 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all flex items-center space-x-1.5"
              >
                <Settings size={14} />
                <span>{use3D ? "2D Mode" : "3D Mode"}</span>
              </button>
            </div>
          </div>

          {/* Judge-Proof Quick Action Demo Bar */}
          <div className="relative z-10 px-6 py-2.5 bg-black/20 border-b border-white/5 flex items-center space-x-2 overflow-x-auto scrollbar-none">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300/60 shrink-0">
              Judge Demos:
            </span>
            <button
              onClick={() => runQuickAction("pitch")}
              className="px-3 py-1 bg-purple-500/20 hover:bg-purple-500/35 border border-purple-400/30 text-purple-200 rounded-full text-xs font-semibold shrink-0 transition-all flex items-center space-x-1.5 shadow-sm active:scale-95"
            >
              <Sparkles size={12} className="text-purple-300" />
              <span>Quick Pitch</span>
            </button>
            <button
              onClick={() => runQuickAction("panic")}
              className="px-3 py-1 bg-pink-500/20 hover:bg-pink-500/35 border border-pink-400/30 text-pink-200 rounded-full text-xs font-semibold shrink-0 transition-all flex items-center space-x-1.5 shadow-sm active:scale-95"
            >
              <HeartPulse size={12} className="text-pink-300" />
              <span>Panic Attack Demo</span>
            </button>
            <button
              onClick={() => runQuickAction("crisis")}
              className="px-3 py-1 bg-red-500/20 hover:bg-red-500/35 border border-red-400/30 text-red-200 rounded-full text-xs font-semibold shrink-0 transition-all flex items-center space-x-1.5 shadow-sm active:scale-95"
            >
              <ShieldAlert size={12} className="text-red-300" />
              <span>Safety Guardrail</span>
            </button>
            <button
              onClick={() => runQuickAction("sos")}
              className="px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/35 border border-emerald-400/30 text-emerald-200 rounded-full text-xs font-semibold shrink-0 transition-all flex items-center space-x-1.5 shadow-sm active:scale-95"
            >
              <UserCheck size={12} className="text-emerald-300" />
              <span>Alert Parents/Friends</span>
            </button>
          </div>

          {/* Messages Stream */}
          <div className="relative z-10 flex-1 overflow-y-auto p-6 md:p-8 space-y-4 scroll-smooth custom-scrollbar pb-28">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 15, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  className={cn(
                    "max-w-[85%] rounded-3xl px-6 py-4 text-[14.5px] leading-relaxed relative",
                    msg.sender === "user"
                      ? "bg-gradient-to-br from-purple-600 to-indigo-600 text-white ml-auto rounded-br-sm shadow-[0_10px_25px_rgba(124,58,237,0.25)] border border-purple-400/20"
                      : msg.isCrisis 
                        ? "bg-red-950/80 border border-red-500/40 text-white mr-auto rounded-bl-sm shadow-lg"
                        : "bg-[#252535]/85 backdrop-blur-md text-white mr-auto rounded-bl-sm border border-white/10 shadow-[0_10px_20px_rgba(0,0,0,0.2)]"
                  )}
                >
                  {msg.text}
                </motion.div>
              ))}

              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-[#252535]/80 backdrop-blur-md text-white mr-auto rounded-3xl rounded-bl-sm border border-white/5 px-5 py-3.5 flex space-x-2 w-fit"
                >
                  <motion.div className="w-2 h-2 bg-purple-400 rounded-full" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} />
                  <motion.div className="w-2 h-2 bg-purple-400 rounded-full" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} />
                  <motion.div className="w-2 h-2 bg-purple-400 rounded-full" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} />
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={messagesEndRef} className="h-4" />
          </div>

          {/* Contextual SOS Alert Suggestion Chip */}
          <AnimatePresence>
            {contextualSosPrompt && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="absolute bottom-20 left-6 right-6 z-20 bg-gradient-to-r from-purple-950/90 to-pink-950/90 border border-purple-400/40 rounded-2xl px-4 py-2.5 flex items-center justify-between shadow-xl backdrop-blur-xl"
              >
                <div className="flex items-center space-x-2.5 text-xs text-purple-200">
                  <UserCheck size={16} className="text-pink-400 shrink-0" />
                  <span>You don't have to carry this alone. Want to alert your parents or friends?</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      const parent = contacts.find(c => c.relationship === "Parent") || contacts[0];
                      dispatchAlert(parent, "whatsapp");
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold px-3 py-1 rounded-xl flex items-center space-x-1"
                  >
                    <MessageSquare size={12} />
                    <span>WhatsApp</span>
                  </button>
                  <button
                    onClick={() => setShowSosModal(true)}
                    className="bg-white/10 hover:bg-white/20 text-white text-[11px] font-medium px-2.5 py-1 rounded-xl"
                  >
                    More Options
                  </button>
                  <button
                    onClick={() => setContextualSosPrompt(false)}
                    className="text-white/40 hover:text-white text-xs px-1"
                  >
                    ×
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Floating Action Island (Push-to-Talk + Text Input) */}
          <div className="absolute bottom-5 left-6 right-6 z-20">
            <div
              ref={inputIslandRef}
              className="flex items-center space-x-3 bg-[#1A1A24]/95 backdrop-blur-2xl rounded-2xl px-4 py-2.5 shadow-[0_20px_40px_rgba(0,0,0,0.5)] border border-white/10 focus-within:border-purple-500/50 transition-all duration-300"
            >
              <button
                onClick={toggleRecording}
                className={cn(
                  "p-2.5 rounded-xl transition-all flex items-center justify-center",
                  isRecording 
                    ? "bg-red-500 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]" 
                    : "text-white/50 hover:text-purple-400 bg-white/5 hover:bg-white/10"
                )}
                title={isRecording ? "Listening... click to stop" : "Click to speak (Push to Talk)"}
              >
                {isRecording ? <MicOff size={19} /> : <Mic size={19} />}
              </button>

              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder={isRecording ? "Listening to your voice..." : "Share what is on your mind with Mahiru..."}
                className="flex-1 bg-transparent border-none outline-none text-white placeholder-white/35 text-sm font-medium"
              />

              <button
                onClick={() => sendMessage()}
                disabled={!inputValue.trim()}
                className="p-3 bg-white text-black rounded-xl hover:bg-purple-100 active:scale-95 transition-all disabled:opacity-30 disabled:active:scale-100"
              >
                <Send size={16} />
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
