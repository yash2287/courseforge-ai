import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, courseTitle, lessonTitle, lessonContent, chatHistory } = body;

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "AI service not configured" },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemPrompt = `You are a helpful, encouraging AI training assistant for the course "${courseTitle}".
${lessonTitle ? `The learner is currently on lesson: "${lessonTitle}"` : ""}

${lessonContent ? `Current lesson content for context (use this to answer questions accurately):
---
${lessonContent.substring(0, 3000)}
---` : ""}

Guidelines:
- Answer questions about the course material clearly and concisely
- If asked something outside the course scope, gently redirect to the course content
- Use examples and analogies to explain complex concepts
- Be encouraging and supportive
- Keep responses focused and under 300 words
- Format important terms in **bold** and use bullet points when listing items
- If you're not sure about something specific to the course, say so honestly`;

    // Build conversation history
    const contents = [];

    // Add previous messages for context (last 6 exchanges)
    const recentHistory = (chatHistory || []).slice(-12);
    for (const msg of recentHistory) {
      contents.push({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      });
    }

    // Add current message
    contents.push({
      role: "user",
      parts: [{ text: message }],
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents,
      config: {
        systemInstruction: systemPrompt,
        maxOutputTokens: 1000,
        temperature: 0.7,
      },
    });

    const text = response.text || "I'm sorry, I couldn't generate a response. Please try again.";

    return NextResponse.json({ response: text });
  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate response" },
      { status: 500 }
    );
  }
}
