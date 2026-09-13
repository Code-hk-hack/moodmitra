import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const {
      contactName = "Guardian",
      contactPhone = "",
      contactEmail = "",
      relationship = "Parent",
      alertType = "check_in",
      customMessage = "",
      studentName = "Your Student"
    } = await req.json();

    const cleanPhone = contactPhone.replace(/[^0-9+]/g, "");

    const defaultMessages: Record<string, string> = {
      check_in: `Hi ${contactName}, ${studentName} is feeling overwhelmed with exam preparation right now. Could you please call or check in on them when you have a moment? - Sent via MoodMitra`,
      panic: `URGENT: ${studentName} is experiencing high anxiety / panic symptoms during study prep right now. Please reach out to them immediately. - MoodMitra Alert`,
      crisis: `CRITICAL SAFETY ALERT: ${studentName} has signaled acute emotional distress. Please contact them right now. If unreachable, please call Tele-MANAS (Govt of India Helpline) at 14416 (Toll-Free 24/7). - MoodMitra Safety System`
    };

    const messageToSend = customMessage || defaultMessages[alertType] || defaultMessages.check_in;

    const encodedMsg = encodeURIComponent(messageToSend);
    const whatsappUrl = cleanPhone ? `https://wa.me/${cleanPhone.replace("+", "")}?text=${encodedMsg}` : null;
    const smsUrl = cleanPhone ? `sms:${cleanPhone}?body=${encodedMsg}` : null;
    const mailtoUrl = contactEmail ? `mailto:${contactEmail}?subject=${encodeURIComponent(`[MoodMitra Care Alert] Check-in for ${studentName}`)}&body=${encodedMsg}` : null;

    return NextResponse.json({
      success: true,
      alertType,
      contactName,
      message: messageToSend,
      whatsappUrl,
      smsUrl,
      mailtoUrl,
      timestamp: new Date().toISOString()
    });
  } catch (e: any) {
    return NextResponse.json({ error: "Failed to dispatch SOS alert" }, { status: 500 });
  }
}
