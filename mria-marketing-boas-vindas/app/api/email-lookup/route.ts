import { NextResponse } from 'next/server';

// Webhook n8n mantido EXCLUSIVAMENTE no servidor — nunca exposto ao client.
// O lookup confirma se um e-mail consta na base de compras do Módulo Marketing; expor a URL
// no navegador permitiria enumeração da base de compradores sem controle.
const EMAIL_LOOKUP_WEBHOOK_URL =
  process.env.N8N_EMAIL_LOOKUP_WEBHOOK_URL ||
  'https://automacoes-lendarias.app.n8n.cloud/webhook/b4bbb68a-8aee-4476-880d-59e3846d7c61';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const reqId = crypto.randomUUID();

  let email: string | null = null;
  try {
    const body = (await req.json()) as { email?: unknown };
    email = typeof body.email === 'string' ? body.email.trim() : null;
  } catch (err) {
    console.error('[email-lookup]', reqId, 'invalid-json', err);
    return NextResponse.json({ error: 'invalid-json' }, { status: 400 });
  }

  if (!email) {
    return NextResponse.json({ error: 'missing-email' }, { status: 400 });
  }

  try {
    const res = await fetch(EMAIL_LOOKUP_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        source: 'mria-marketing-boas-vindas/pesquisa/onboarding',
        event: 'email-lookup',
      }),
    });

    if (!res.ok) {
      console.error('[email-lookup]', reqId, 'webhook-failed', res.status);
      return NextResponse.json({ error: `http-${res.status}` }, { status: 502 });
    }

    // Repassa o corpo cru para o client interpretar (interpretEmailLookup),
    // sem expor a origem do webhook.
    const raw = (await res.text()).trim();
    return new NextResponse(raw, {
      status: 200,
      headers: {
        'Content-Type': res.headers.get('content-type') ?? 'text/plain; charset=utf-8',
      },
    });
  } catch (err) {
    console.error('[email-lookup]', reqId, 'webhook-unreachable', err);
    return NextResponse.json({ error: 'network' }, { status: 502 });
  }
}
