import { NextResponse } from 'next/server';

const WEBHOOK_URL =
  process.env.N8N_WEBHOOK_URL ||
  'https://automacoes-lendarias.app.n8n.cloud/webhook/85de6ea6-5067-4b54-a7b8-545a3b79a2fa';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type AnswerValue = string | Record<string, string>;

interface SubmitBody {
  respondedAt?: string;
  answers?: Record<string, AnswerValue>;
  meta?: Record<string, unknown>;
}

function computeBaselineScore(
  dims: Record<string, string> | undefined
): number | null {
  if (!dims) return null;
  const values = Object.values(dims)
    .map((v) => Number(v))
    .filter((n) => Number.isFinite(n) && n >= 1 && n <= 5);
  if (values.length === 0) return null;
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  return Math.round(avg * 100) / 100;
}

export async function POST(req: Request) {
  const reqId = crypto.randomUUID();
  const startedAt = Date.now();

  let body: SubmitBody;
  try {
    body = (await req.json()) as SubmitBody;
  } catch (err) {
    console.error('[submit]', reqId, 'invalid-json', err);
    return NextResponse.json({ error: 'invalid-json' }, { status: 400 });
  }

  const answers = body.answers ?? {};
  const email =
    typeof answers.email === 'string' ? answers.email : null;
  const dimensions =
    answers.dimensoes_aiox && typeof answers.dimensoes_aiox === 'object'
      ? (answers.dimensoes_aiox as Record<string, string>)
      : undefined;

  const baselineScore = computeBaselineScore(dimensions);

  const enriched = {
    ...body,
    answers: {
      ...answers,
      ...(baselineScore !== null ? { baseline_score: baselineScore } : {}),
    },
  };

  console.log('[submit]', reqId, 'received', { email, baselineScore });

  try {
    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(enriched),
    });

    const elapsed = Date.now() - startedAt;
    const text = await res.text().catch(() => '');

    if (!res.ok) {
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

    // Repassa o body do webhook ao cliente para que ele extraia o telefone.
    let webhookData: unknown = null;
    if (text) {
      try {
        webhookData = JSON.parse(text);
      } catch {
        webhookData = text;
      }
    }

    console.log('[submit]', reqId, 'ok', { elapsed, hasBody: text.length > 0 });
    return NextResponse.json({ ok: true, webhook: webhookData });
  } catch (err) {
    console.error('[submit]', reqId, 'webhook-unreachable', err);
    return NextResponse.json(
      { error: 'webhook-unreachable' },
      { status: 502 }
    );
  }
}
