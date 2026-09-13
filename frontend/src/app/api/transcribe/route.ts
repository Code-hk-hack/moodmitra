import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { audio, language = "en" } = await req.json();
    if (!audio) {
      return NextResponse.json({ error: "Audio payload is required for transcription" }, { status: 400 });
    }

    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey || groqKey.includes("your_")) {
      return NextResponse.json({ error: "Groq API key not configured" }, { status: 500 });
    }

    const rawBase64 = audio.includes("base64,") ? audio.split("base64,")[1] : audio;
    const audioBuffer = Buffer.from(rawBase64, "base64");

    if (audioBuffer.length < 50) {
      return NextResponse.json({ error: "Audio payload too small or empty" }, { status: 400 });
    }

    let mimeType = "audio/webm";
    let filename = "recording.webm";
    if (audioBuffer.length >= 4 && audioBuffer.toString("utf8", 0, 4) === "RIFF") {
      mimeType = "audio/wav";
      filename = "recording.wav";
    }

    const form = new FormData();
    const blob = new Blob([audioBuffer], { type: mimeType });
    form.append("file", blob, filename);
    form.append("model", "whisper-large-v3-turbo");
    form.append("response_format", "json");
    form.append("prompt", "Mahiru, Hinglish, NEET, JEE, stress, kalesh, ladai, breakup, padhai");

    const groqRes = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqKey}`,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      },
      body: form
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      return NextResponse.json({ error: errText }, { status: groqRes.status });
    }

    const data = await groqRes.json();
    return NextResponse.json({
      text: data.text || "",
      language: data.language || language,
      model: "whisper-large-v3-turbo"
    });
  } catch (err: any) {
    console.error("[Next.js /api/transcribe error]:", err);
    return NextResponse.json({ error: "Failed to transcribe audio" }, { status: 500 });
  }
}
