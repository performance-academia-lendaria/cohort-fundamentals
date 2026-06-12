# Pesquisa de Onboarding — Máquina de Receita com IA · Módulo Marketing

Micro sistema de formulário de onboarding do Módulo Marketing da Máquina de Receita com IA. Coleta e-mail de compra + 6 respostas (incluindo a matriz de 4 frentes do método R.O.F.A.) e envia tudo via webhook para o n8n.

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

- `/` → redirect 307 → `/mria-marketing-boas-vindas/pesquisa/onboarding`
- `/mria-marketing-boas-vindas/pesquisa/onboarding` → formulário (uma pergunta por vez + barra de progresso)
- `/api/submit` (POST) → encaminha o payload ao webhook n8n

## Comportamento do formulário

- Uma pergunta visível por vez, com animação suave entre passos.
- Barra de progresso dourada indicando passo atual / total e porcentagem.
- Validações por tipo: obrigatório, e-mail, matriz exige todas as linhas preenchidas, "outro" exige texto.
- A Q4 (matriz 4×5 das frentes R.O.F.A.) ocupa uma tela única com legenda da escala 1–5.
- Tela final de confirmação no padrão "Resposta _confirmada_".

## Perguntas

| # | Bloco | Tipo | Campo |
|---|-------|------|-------|
| 1 | Identificação | email | `email` |
| 2 | Identificação | radio | `canal` (origem da matrícula) |
| 3 | Baseline | radio | `nivel_ia` (1–5) |
| 4 | Baseline | matrix | `dimensoes_aiox` (Pesquisa & Oferta, Funil & Páginas, Tráfego, Receita × 1–5) |
| 5 | Sua visão | textarea | `valeu_centavo` |
| 6 | Sua visão | textarea | `receio` |

Fonte de verdade das perguntas: `../pesquisa-onboarding-marketing.md`.

## Webhook

Por padrão envia para:
```
https://automacoes-lendarias.app.n8n.cloud/webhook/85de6ea6-5067-4b54-a7b8-545a3b79a2fa
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
    "email": "aluno@email.com",
    "canal": "youtube_31_05",
    "nivel_ia": "3",
    "dimensoes_aiox": {
      "oferta": "2",
      "funil": "3",
      "trafego": "2",
      "receita": "1"
    },
    "baseline_score": 2.0,
    "valeu_centavo": "...",
    "receio": "..."
  },
  "meta": {
    "source": "mria-marketing-boas-vindas/pesquisa/onboarding",
    "turma": "Módulo Marketing",
    "programa": "Máquina de Receita com IA",
    "userAgent": "..."
  }
}
```

Notas:
- Q2 "Outro" é serializado como `"outro: <texto digitado>"`.
- `baseline_score` é calculado server-side (média das 4 frentes da Q4, arredondado em 2 casas).

## Rodando localmente

```bash
npm install
npm run dev
# http://localhost:3000  →  redireciona pra /mria-marketing-boas-vindas/pesquisa/onboarding
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
│   ├── api/submit/route.ts                    # encaminha p/ webhook n8n
│   ├── mria-marketing-boas-vindas/pesquisa/onboarding/
│   │   ├── page.tsx
│   │   └── pesquisa-client.tsx                # fluxo "uma pergunta por vez"
│   ├── globals.css                            # design tokens Lendária + matrix
│   └── layout.tsx                             # next/font + metadata
├── components/
│   └── Constellation.tsx                      # fundo SVG cinematográfico
├── lib/
│   └── questions.ts                           # definição das perguntas (com matrix)
├── next.config.js
├── package.json
└── tsconfig.json
```
