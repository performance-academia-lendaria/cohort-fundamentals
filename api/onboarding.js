// =============================================================================
// /api/onboarding — Proxy único de onboarding (MRIA)
//
// Esconde o webhook do n8n do lado do servidor. O navegador nunca vê a URL do
// n8n — só chama /api/onboarding.
//
// O cliente envia: { turma, etapa, payload }
//   - turma:  'marketing' | 'comercial'
//   - etapa:  'email-lookup' | 'submit' | 'confirm'
//   - payload: o corpo que a página montou para aquela etapa.
//
// O proxy repassa para UM ÚNICO webhook n8n um corpo achatado
// { turma, etapa, ...payload } — a workflow roteia internamente por "etapa"
// (Switch) e usa "turma" para casar a compra.
//   Workflow: [WH] [LEADS] [SHEETS+AC] - sistema novo (1 webhook)
//
// A resposta do n8n é repassada de volta ao cliente (necessária para
// 'email-lookup' → found, e 'submit' → telefone cadastrado).
//
// Servido em: guide.lendario.ai/fundamentals/api/onboarding
// =============================================================================

// Webhook único (lado servidor; nunca exposto ao cliente).
const N8N_WEBHOOK = 'https://automacoes-lendarias.app.n8n.cloud/webhook/onboarding';

const TURMAS = ['marketing', 'comercial'];
const ETAPAS = ['email-lookup', 'submit', 'confirm'];

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

// Health check — não chama o n8n. Útil para confirmar deploy/rota.
export async function GET() {
  return json({
    ok: true,
    service: 'onboarding-proxy',
    turmas: TURMAS,
    etapas: ETAPAS,
  });
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'invalid-json' }, 400);
  }

  const turma = String(body?.turma || '').trim();
  const etapa = String(body?.etapa || '').trim();
  const payload = body?.payload;

  if (!TURMAS.includes(turma)) return json({ error: 'turma-desconhecida', turma }, 400);
  if (!ETAPAS.includes(etapa)) return json({ error: 'etapa-desconhecida', etapa }, 400);
  if (payload == null || typeof payload !== 'object') {
    return json({ error: 'payload-ausente' }, 400);
  }

  // Corpo achatado: a workflow lê body.turma / body.etapa e os campos do payload.
  const upstreamBody = { ...payload, turma, etapa };

  // O n8n valida o Origin da requisição (forbidden_origin). Como agora quem
  // chama é o servidor (não o navegador), repassamos o Origin/Referer do
  // cliente — caindo no domínio oficial como padrão.
  const ORIGIN = request.headers.get('origin') || 'https://guide.lendario.ai';
  const REFERER = request.headers.get('referer') || ORIGIN + '/fundamentals/';

  try {
    const upstream = await fetch(N8N_WEBHOOK, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: ORIGIN,
        Referer: REFERER,
      },
      body: JSON.stringify(upstreamBody),
    });

    // Devolve o corpo do n8n de forma transparente (texto cru), preservando
    // o status. O cliente já interpreta JSON ou texto.
    const text = await upstream.text();
    // Log sem PII: apenas roteamento e status (nunca o payload/corpo).
    if (!upstream.ok) {
      console.warn(`[onboarding] upstream ${turma}/${etapa} → HTTP ${upstream.status}`);
    }
    return new Response(text, {
      status: upstream.status,
      headers: {
        'Content-Type':
          upstream.headers.get('content-type') || 'text/plain; charset=utf-8',
      },
    });
  } catch (err) {
    // Sem PII: só identifica a rota e a natureza do erro.
    console.error(`[onboarding] falha de upstream em ${turma}/${etapa}: ${err?.name || 'erro'}`);
    return json({ error: 'upstream-falhou' }, 502);
  }
}
