# Pesquisa Sistema 4D — Cohort Fundamentals

Micro sistema de formulário pré-Zoom (Sistema 4D). Coleta e-mail de compra + respostas das 3 etapas da pesquisa e envia tudo via webhook para o n8n.

## Stack

- **Next.js 16** (App Router, React 19)
- **TypeScript**
- **next/font** (Inter + Orbitron, self-hosted, zero CLS)
- Deploy: **Vercel** (Fluid Compute, runtime Node.js)

## Identidade visual

Segue a v3.0 — **Lendária (Black + Gold)** — descrita em
`branding/diretrizes/DIRETRIZES-DESIGN.md`. Tokens replicados em
`app/globals.css`.

## Rotas

- `/` → redirect 307 → `/sistema-dspc/pesquisa`
- `/sistema-dspc/pesquisa` → formulário (uma pergunta por vez + barra de progresso)
- `/api/submit` (POST) → encaminha o payload ao webhook n8n

## Comportamento do formulário

- Uma pergunta visível por vez, com animação suave entre passos.
- Barra de progresso dourada indicando passo atual / total e porcentagem.
- Validações por tipo: obrigatório, e-mail, telefone com DDD, "outro" exige texto.
- Pergunta de faturamento mensal só aparece se a anterior indicou que já fatura.
- Tela final de confirmação no padrão "Resposta _confirmada_".

## Webhook

Por padrão envia para:
```
https://automacoes-lendarias.app.n8n.cloud/webhook/d4443326-a6ed-455f-a3f5-832f9d42e083
```

Pode ser sobrescrito via variável de ambiente:
```
N8N_WEBHOOK_URL=https://...
```

### Payload enviado

```json
{
  "respondedAt": "2026-06-03T15:30:00.000Z",
  "answers": {
    "nome": "Roger",
    "email": "roger@email.com",
    "telefone": "(11) 99999-9999",
    "dor_real": "...",
    "nicho_ia": "...",
    "faturamento_ia": "recorrente",
    "faturamento_mensal": "5_15k",
    "expectativa_zoom": "...",
    "ultimo_investimento": "ultimo_ano",
    "termina_que_comeca": "ao_vivo",
    "horas_semana": "5_8h",
    "custo_nada_mudar": "...",
    "motivo_nao_seguir": "tempo",
    "investimento_hoje": "10k",
    "onde_12_meses": "...",
    "melhor_horario": "20h"
  },
  "meta": {
    "source": "sistema-dspc/pesquisa",
    "userAgent": "..."
  }
}
```

Perguntas com a opção "Outro" são serializadas como `"outro: <texto digitado>"`.

## Rodando localmente

```bash
npm install
npm run dev
# http://localhost:3000  →  redireciona pra /sistema-dspc/pesquisa
```

## Deploy na Vercel

1. Subir o repositório em `https://github.com/performance-academia-lendaria/cohort-fundamentals`.
2. Importar na Vercel (Framework detectado automaticamente: Next.js).
3. (Opcional) Definir `N8N_WEBHOOK_URL` em **Project Settings → Environment Variables**.
4. Deploy.

## Estrutura

```
sistema_pesquisa/
├── app/
│   ├── api/submit/route.ts        # encaminha p/ webhook n8n
│   ├── sistema-dspc/pesquisa/
│   │   ├── page.tsx
│   │   └── pesquisa-client.tsx    # fluxo "uma pergunta por vez"
│   ├── globals.css                # design tokens Lendária
│   └── layout.tsx                 # next/font + metadata
├── components/
│   └── Constellation.tsx          # fundo SVG cinematográfico
├── lib/
│   └── questions.ts               # definição das perguntas + condicionais
├── next.config.js
├── package.json
└── tsconfig.json
```
