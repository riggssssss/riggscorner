import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { name, email, message } = await req.json();

    const resend = new Resend(process.env.RESEND_API_KEY);

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Basic email validation
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(email)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    const { error } = await resend.emails.send({
      from: 'Portfolio Contact <onboarding@resend.dev>',
      to: 'adrian2000gg@gmail.com',
      replyTo: email,
      subject: `Message from ${name} via portfolio`,
      text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
      html: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #0a0a0a; color: #fff; border-radius: 16px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #000 0%, #1a0d0f 60%, #000 100%); padding: 32px 32px 24px; border-bottom: 1px solid rgba(201,138,151,0.2);">
            <div style="font-size: 22px; font-weight: 600; color: #fff; margin-bottom: 4px;">New message</div>
            <div style="font-size: 13px; color: rgba(201,138,151,0.8);">via your portfolio chatbot</div>
          </div>
          <div style="padding: 28px 32px;">
            <div style="margin-bottom: 20px;">
              <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(255,255,255,0.3); margin-bottom: 6px;">From</div>
              <div style="font-size: 15px; color: rgba(255,255,255,0.9); font-weight: 500;">${name}</div>
              <div style="font-size: 13px; color: #c98a97; margin-top: 2px;">${email}</div>
            </div>
            <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 20px;">
              <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(255,255,255,0.3); margin-bottom: 10px;">Message</div>
              <div style="font-size: 14px; color: rgba(255,255,255,0.85); line-height: 1.7; white-space: pre-wrap;">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
            </div>
          </div>
          <div style="padding: 16px 32px 28px; font-size: 12px; color: rgba(255,255,255,0.2); text-align: center;">
            Reply directly to this email to respond to ${name}.
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('[contact/route] Resend error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[contact/route]', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
