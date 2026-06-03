import { NextResponse } from 'next/server';

const WEBHOOK_URL =
  process.env.N8N_WEBHOOK_URL ||
  'https://automacoes-lendarias.app.n8n.cloud/webhook/d4443326-a6ed-455f-a3f5-832f9d42e083';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const reqId = crypto.randomUUID();
  const startedAt = Date.now();

  let body: unknown;
  try {
    body = await req.json();
  } catch (err) {
    console.error('[submit]', reqId, 'invalid-json', err);
    return NextResponse.json({ error: 'invalid-json' }, { status: 400 });
  }

  const email =
    typeof body === 'object' && body !== null && 'answers' in body
      ? ((body as { answers?: { email?: string } }).answers?.email ?? null)
      : null;

  console.log('[submit]', reqId, 'received', { email });

  try {
    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const elapsed = Date.now() - startedAt;

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error('[submit]', reqId, 'webhook-failed', {
        status: res.status,
        elapsed,
        detail: text.slice(0, 500),
      });
      return NextResponse.json(
        { error: 'webhook-failed', status: res.status },
        { status: 502 }
      );
    }

    console.log('[submit]', reqId, 'ok', { elapsed });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[submit]', reqId, 'webhook-unreachable', err);
    return NextResponse.json(
      { error: 'webhook-unreachable' },
      { status: 502 }
    );
  }
}
