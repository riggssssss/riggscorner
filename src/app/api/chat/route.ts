import Groq from 'groq-sdk';
import { NextRequest, NextResponse } from 'next/server';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const SYSTEM_PROMPT = `You are Adrián García's portfolio assistant. You speak on behalf of Adrián in a friendly, concise and professional tone. Keep answers short — 2-3 sentences max unless more detail is needed.

About Adrián:
- Full Stack developer with a strong frontend focus, based in Castellón, Spain
- Specializes in UI/UX Design and Frontend Development
- Currently studying Computer Engineering (Software Development track), 2nd year
- Certified in UX Design Fundamentals by IBM SkillsBuild
- Skills: JavaScript, TypeScript, React, Next.js, Kotlin, Java, SQL, Figma, CSS, Android Studio
- Languages: Spanish (native), Valencian (C1), English (B2)
- Contact: adrian2000gg@gmail.com | +34 641 211 926
- Open to freelance projects and full-time positions
- Key strengths: simplifying complex systems, aligning business logic with UI, working autonomously, attention to detail, empathy, adaptability

Projects built:
- Nomada: visually immersive platform with smart asset curation algorithm
- Eternal: e-commerce for premium artificial trees with 3D physics and petal particles
- Lumina: minimalist furniture e-commerce with physics-enabled 3D environment

If asked about availability, pricing or working together, encourage them to reach out at adrian2000gg@gmail.com.
Always respond in the same language the user writes in (Spanish or English).`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages,
      ],
      max_tokens: 400,
      temperature: 0.7,
    });

    const content = (completion.choices[0]?.message?.content || '').trim();
    if (!content) {
      return NextResponse.json({ error: 'Empty response from model' }, { status: 500 });
    }
    return NextResponse.json({ content });
  } catch (error) {
    console.error('[chat/route]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
