# Pesquisa de Onboarding — sistema config-driven

Motor único compartilhado por todas as turmas. **Criar uma turma nova = 1 arquivo** (`index.html` casca) + 1 entrada no proxy.

## Como funciona

```
Navegador  →  /api/onboarding  →  n8n
             (esconde + roteia)
```

- **`shared/pesquisa-engine.css`** + **`shared/pesquisa-engine.js`** — o motor (form, matriz, validação de e-mail, LGPD, telefone, tela final). Não duplicar.
- **`api/onboarding.js`** — proxy único. Guarda os webhooks do n8n no servidor e roteia por `{ turma, etapa }`. O navegador nunca vê uma URL do n8n.
- **Cada turma** = uma casca fina (`.../pesquisa/onboarding/index.html`) só com `window.PESQUISA_CONFIG`.

## Criar a pesquisa de uma turma nova (ex.: "produto")

### 1. Registrar os webhooks no proxy
Em `api/onboarding.js`, adicione a turma no mapa `WEBHOOKS`:

```js
produto: {
  'email-lookup': N8N + '<uuid-do-webhook-lookup>',
  submit:         N8N + '<uuid-do-webhook-submit>',
  confirm:        N8N + '<uuid-do-webhook-confirm>',
},
```

### 2. Criar a casca
Copie uma casca existente (ex.: `mria/comercial/pesquisa/onboarding/index.html`) para a rota da nova turma e ajuste:

- **Os caminhos relativos** dos `<link>`/`<script>`/`apiUrl` conforme a profundidade da pasta até a raiz `/fundamentals`:
  - 2 níveis (`mria-marketing-boas-vindas/pesquisa/onboarding`) → `../../`
  - 3 níveis (`mria/comercial/pesquisa/onboarding`) → `../../../`
- **`PESQUISA_CONFIG`**: `turma` (igual à chave do passo 1), `titulo`, `brandPill`, `turmaLabel`, `grupoNome`, `groupUrl`, `source`, e as `questions`.

### 3. Subir
`git add` + `git commit` + `git push`. A Vercel publica sozinha. Teste em
`https://guide.lendario.ai/fundamentals/<rota>` e valide um `email-lookup`.

## Campos do PESQUISA_CONFIG

| Campo | Para que serve |
|-------|----------------|
| `turma` | chave de roteamento no `/api/onboarding` (deve existir no mapa `WEBHOOKS`) |
| `apiUrl` | caminho relativo até `/api/onboarding` |
| `titulo` | `<title>` da página |
| `brandPill` | texto da pílula no topo |
| `programa` / `turmaLabel` | usados em copy, suporte e payload |
| `grupoNome` | nome do grupo exibido na tela final |
| `groupUrl` | link de entrada no grupo (WhatsApp/sndflw) |
| `source` | string de origem registrada no n8n |
| `supportPhoneDigits` | WhatsApp do suporte (só dígitos) |
| `blockLabels` | rótulos dos blocos (1/2/3) |
| `questions` | array de perguntas (`email`, `radio`, `textarea`, `matrix`) |

## Tipos de pergunta suportados
`email` (com validação de compra), `text`, `tel`, `textarea`, `radio` (com `allowOther`), `matrix` (escala 1–5 com `rows`). Perguntas condicionais via `showIf(answers)`.
