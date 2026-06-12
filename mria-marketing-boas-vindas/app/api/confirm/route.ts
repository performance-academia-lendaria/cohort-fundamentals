import { NextResponse } from 'next/server';

// Webhook n8n de confirmação de entrada no grupo — mantido no servidor.
// O payload carrega PII (telefone, e-mail) e não pode trafegar de um endpoint
// exposto no client.
const CONFIRM_WEBHOOK_URL =
  process.env.N8N_CONFIRM_WEBHOOK_URL ||
  'https://automacoes-lendarias.app.n8n.cloud/webhook/51e49334-9147-4e9e-b24a-f325b8c763ea';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const reqId = crypto.randomUUID();

  let body: unknown;
  try {
    body = await req.json();
  } catch (err) {
    console.error('[confirm]', reqId, 'invalid-json', err);
    return NextResponse.json({ error: 'invalid-json' }, { status: 400 });
  }

  try {
    const res = await fetch(CONFIRM_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      console.error('[confirm]', reqId, 'webhook-failed', res.status);
      return NextResponse.json(
        { error: 'webhook-failed', status: res.status },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[confirm]', reqId, 'webhook-unreachable', err);
    return NextResponse.json({ error: 'webhook-unreachable' }, { status: 502 });
  }
}
