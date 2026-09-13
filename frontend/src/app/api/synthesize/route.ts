import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { text, language = "en-IN", voice = "Kaveri" } = await req.json();
    if (!text || !text.trim()) {
      return NextResponse.json({ error: "Text is required for speech synthesis" }, { status: 400 });
    }

    const apiKey = process.env.GNANI_API_KEY;
    if (!apiKey || apiKey.includes("your_")) {
      return NextResponse.json({
        fallback: true,
        message: "Gnani.ai API key not configured. Client should use Web Speech fallback.",
        text
      });
    }

    const response = await fetch("https://api.vachana.ai/api/v1/tts/inference", {
      method: "POST",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Content-Type": "application/json",
        "X-API-Key-ID": apiKey
      },
      body: JSON.stringify({
        text,
        model: "timbre-v2.5",
        voice,
        language,
        audio_config: {
          sample_rate: 24000,
          encoding: "linear_pcm",
          container: "wav"
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: errorText }, { status: response.status });
    }

    const arrayBuffer = await response.arrayBuffer();
    return new Response(arrayBuffer, {
      headers: {
        "Content-Type": "audio/wav"
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to synthesize speech via Gnani.ai" }, { status: 500 });
  }
}
