// =============================================================================
// /api/onboarding — Proxy único de onboarding (MRIA)
//
// Esconde os webhooks do n8n do lado do servidor e roteia por { turma, etapa }.
// O navegador nunca vê uma URL do n8n — só chama /api/onboarding.
//
// O cliente envia: { turma, etapa, payload }
//   - turma:  'marketing' | 'comercial'
//   - etapa:  'email-lookup' | 'submit' | 'confirm'
//   - payload: o corpo exato que o n8n já espera (mantém os fluxos atuais
//              funcionando sem nenhuma alteração no n8n).
//
// A resposta do n8n é repassada de volta ao cliente (necessária para
// 'email-lookup' → found, e 'submit' → telefone cadastrado).
//
// Servido em: guide.lendario.ai/fundamentals/api/onboarding
// =============================================================================

const N8N = 'https://automacoes-lendarias.app.n8n.cloud/webhook/';

// Mapa turma → etapa → webhook (lado servidor; nunca exposto ao cliente).
const WEBHOOKS = {
  marketing: {
    'email-lookup': N8N + 'b4bbb68a-8aee-4476-880d-59e3846d7c61',
    submit:         N8N + '85de6ea6-5067-4b54-a7b8-545a3b79a2fa',
    confirm:        N8N + '51e49334-9147-4e9e-b24a-f325b8c763ea',
  },
  comercial: {
    'email-lookup': N8N + '0697b6f6-3376-46b1-8676-87612793d615',
    submit:         N8N + '73d374e5-4565-429e-b9ed-f48907ad33b4',
    confirm:        N8N + '4945f028-462f-42d0-948c-55358152c74e',
  },
};

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
    turmas: Object.keys(WEBHOOKS),
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

  const turmaMap = WEBHOOKS[turma];
  if (!turmaMap) return json({ error: 'turma-desconhecida', turma }, 400);

  const url = turmaMap[etapa];
  if (!url) return json({ error: 'etapa-desconhecida', etapa }, 400);

  if (payload == null || typeof payload !== 'object') {
    return json({ error: 'payload-ausente' }, 400);
  }

  // Repassa ao n8n exatamente o payload que a página montou.
  try {
    const upstream = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
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
