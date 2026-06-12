'use client';

import { useMemo, useState } from 'react';
import Constellation from '@/components/Constellation';
import { BLOCK_LABELS, QUESTIONS, type Question } from '@/lib/questions';

type ScalarAnswers = Record<string, string>;
type MatrixAnswers = Record<string, Record<string, string>>;

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Os webhooks n8n ficam no servidor (app/api/email-lookup e app/api/confirm).
// O client só conversa com endpoints internos — PII e a origem dos webhooks
// nunca são expostas ao navegador.
const EMAIL_LOOKUP_ENDPOINT = '/api/email-lookup';
const CONFIRM_ENDPOINT = '/api/confirm';

// Documentos legais canônicos (footer E1)
const PRIVACY_URL = 'https://www.academialendaria.ai/politica-de-privacidade';
const TERMS_URL = 'https://www.academialendaria.ai/termos-de-uso';
const COOKIES_URL = 'https://www.academialendaria.ai/politica-de-cookies';
const SUPPORT_EMAIL_URL = 'mailto:suporte@academialendaria.ai';

// Suporte do time — +55 48 8800-0116
const SUPPORT_PHONE_DIGITS = '554888000116';
function buildSupportUrl(prefilled: string): string {
  return `https://wa.me/${SUPPORT_PHONE_DIGITS}?text=${encodeURIComponent(prefilled)}`;
}
const EMAIL_SUPPORT_URL = buildSupportUrl(
  'Olá, preciso de ajuda com a validação do meu e-mail na pesquisa de onboarding do Módulo Marketing da Máquina de Receita com IA.'
);
const SUPPORT_WHATSAPP_URL = buildSupportUrl(
  'Olá, preciso ajustar meu cadastro — o número que apareceu no sistema do Módulo Marketing está errado.'
);

const GROUP_REQUEST_URL =
  'https://chat.whatsapp.com/LARf5IRKWst4UlRv8OmaS1'; // grupo Módulo Marketing — Máquina de Receita com IA

type LookupResult = { found: boolean | null; error?: string };

function interpretEmailLookup(data: unknown): LookupResult {
  if (data == null) return { found: null };
  if (typeof data === 'boolean') return { found: data };
  if (typeof data === 'string') {
    const lower = data.toLowerCase();
    if (/n[ãa]o[\s_-]?encontrad|not[\s_-]?found|nao_encontrado/.test(lower))
      return { found: false };
    if (/encontrad|^found$|exists|^true$|^ok$|^sim$/.test(lower))
      return { found: true };
    return { found: null };
  }
  if (Array.isArray(data)) {
    for (const item of data) {
      const r = interpretEmailLookup(item);
      if (r.found !== null) return r;
    }
    return { found: null };
  }
  if (typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    const boolKeys = ['found', 'encontrado', 'exists', 'existe', 'success'];
    for (const k of boolKeys) {
      if (typeof obj[k] === 'boolean') return { found: obj[k] as boolean };
    }
    const strKeys = ['status', 'result', 'resultado', 'message', 'msg', 'response', 'retorno'];
    for (const k of strKeys) {
      if (obj[k] != null) {
        const r = interpretEmailLookup(obj[k]);
        if (r.found !== null) return r;
      }
    }
    for (const v of Object.values(obj)) {
      if (v && typeof v === 'object') {
        const r = interpretEmailLookup(v);
        if (r.found !== null) return r;
      }
    }
  }
  return { found: null };
}

async function lookupEmail(email: string): Promise<LookupResult> {
  try {
    const res = await fetch(EMAIL_LOOKUP_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) return { found: null, error: `http-${res.status}` };
    const raw = (await res.text()).trim();
    if (!raw) return { found: null, error: 'empty' };
    try {
      return interpretEmailLookup(JSON.parse(raw));
    } catch {
      return interpretEmailLookup(raw);
    }
  } catch {
    return { found: null, error: 'network' };
  }
}

function extractPhone(data: unknown): string | null {
  if (data == null) return null;
  if (typeof data === 'string') return data.trim() || null;
  if (Array.isArray(data)) {
    for (const item of data) {
      const p = extractPhone(item);
      if (p) return p;
    }
    return null;
  }
  if (typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    const keys = ['telefone', 'phone', 'whatsapp', 'contato', 'celular', 'numero', 'number'];
    for (const k of keys) {
      const v = obj[k];
      if (v != null && String(v).trim()) return String(v).trim();
    }
    for (const v of Object.values(obj)) {
      if (v && typeof v === 'object') {
        const p = extractPhone(v);
        if (p) return p;
      }
    }
  }
  return null;
}

function validate(
  q: Question,
  raw: string,
  otherText: string,
  matrix: Record<string, string> | undefined
): string | null {
  const value = (raw ?? '').trim();

  if (q.type === 'matrix' && q.rows) {
    const filledRows = q.rows.filter((r) => matrix?.[r.id]);
    if (q.required && filledRows.length < q.rows.length) {
      return `Marca seu nível em todas as ${q.rows.length} dimensões antes de seguir.`;
    }
    return null;
  }

  if (q.required && !value) return 'Esse campo é obrigatório.';
  if (q.type === 'email' && value && !EMAIL_RX.test(value))
    return 'Coloca um e-mail válido (ex.: voce@email.com).';
  if (q.type === 'tel' && value && value.replace(/\D/g, '').length < 10)
    return 'Coloca o WhatsApp com DDD.';
  if (q.type === 'radio' && value === 'outro' && !otherText.trim())
    return 'Conta pra gente qual é o "outro".';
  return null;
}

export default function PesquisaClient() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<ScalarAnswers>({});
  const [otherTexts, setOtherTexts] = useState<ScalarAnswers>({});
  const [matrixAnswers, setMatrixAnswers] = useState<MatrixAnswers>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmedPhone, setConfirmedPhone] = useState<string | null>(null);
  const [validatingEmail, setValidatingEmail] = useState(false);
  const [showEmailSupport, setShowEmailSupport] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const visibleQuestions = useMemo(
    () => QUESTIONS.filter((q) => !q.showIf || q.showIf(answers)),
    [answers]
  );

  const total = visibleQuestions.length;
  const safeStep = Math.min(step, total - 1);
  const current = visibleQuestions[safeStep];
  const progress = submitted ? 100 : Math.round((safeStep / total) * 100);

  function setAnswer(id: string, value: string) {
    setAnswers((a) => ({ ...a, [id]: value }));
    setError(null);
  }

  function setOther(id: string, value: string) {
    setOtherTexts((o) => ({ ...o, [id]: value }));
    setError(null);
  }

  function setMatrixCell(qId: string, rowId: string, value: string) {
    setMatrixAnswers((m) => ({
      ...m,
      [qId]: { ...(m[qId] ?? {}), [rowId]: value },
    }));
    setError(null);
  }

  async function handleNext() {
    if (!current) return;
    const raw = answers[current.id] ?? '';
    const other = otherTexts[current.id] ?? '';
    const v = validate(current, raw, other, matrixAnswers[current.id]);
    if (v) {
      setError(v);
      return;
    }

    // Antes de avançar a partir do e-mail, valida o aceite e se a compra existe
    if (current.id === 'email') {
      if (!accepted) {
        setError(
          'Pra continuar, confirma que leu e aceita os Termos de Uso e a Política de Privacidade.'
        );
        return;
      }
      setValidatingEmail(true);
      setError(null);
      const result = await lookupEmail(raw.trim());
      setValidatingEmail(false);
      if (result.found === false) {
        setShowEmailSupport(true);
        setError(
          'Não encontramos esse e-mail na nossa base de compras do Módulo Marketing. Confere se digitou certo — ou se usou outro e-mail na hora da compra.'
        );
        return;
      }
      if (result.found === null) {
        console.warn('[email-lookup] inconclusivo:', result.error);
      }
      setShowEmailSupport(false);
    }

    if (safeStep < total - 1) {
      setStep(safeStep + 1);
      return;
    }
    await submit();
  }

  function handleBack() {
    if (safeStep === 0) return;
    setError(null);
    setStep(safeStep - 1);
  }

  async function submit() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const payloadAnswers: Record<string, string | Record<string, string>> = {};

      for (const q of QUESTIONS) {
        if (q.showIf && !q.showIf(answers)) continue;

        if (q.type === 'matrix') {
          const m = matrixAnswers[q.id];
          if (m && Object.keys(m).length > 0) payloadAnswers[q.id] = m;
          continue;
        }

        const value = answers[q.id] ?? '';
        if (!value) continue;

        if (q.type === 'radio' && value === 'outro') {
          payloadAnswers[q.id] = `outro: ${otherTexts[q.id]?.trim() ?? ''}`;
        } else {
          payloadAnswers[q.id] = value;
        }
      }

      const payload = {
        respondedAt: new Date().toISOString(),
        answers: payloadAnswers,
        meta: {
          source: 'mria-marketing-boas-vindas/pesquisa/onboarding',
          turma: 'Módulo Marketing',
          programa: 'Máquina de Receita com IA',
          userAgent:
            typeof navigator !== 'undefined' ? navigator.userAgent : null,
        },
      };

      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('falha-no-envio');

      // Lê o body — esperamos { ok: true, webhook: ... } com o telefone aninhado
      try {
        const data = (await res.json()) as { webhook?: unknown };
        setConfirmedPhone(extractPhone(data?.webhook));
      } catch {
        setConfirmedPhone(null);
      }

      setSubmitted(true);
    } catch {
      setSubmitError(
        'Não rolou enviar agora. Confere sua conexão e tenta de novo em alguns segundos.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    const handleConfirm = (e: React.MouseEvent<HTMLAnchorElement>) => {
      // Monta payload com TUDO que foi coletado:
      // - telefone: vem do webhook de submit (sistema da Hotmart)
      // - email: vem do input da Q1 (validado contra a base)
      // - respostas: o resto da pesquisa, pro n8n cruzar contexto se quiser
      const payload = {
        event: 'confirm-group-entry',
        telefone: confirmedPhone || null,
        email: (answers.email || '').trim() || null,
        respondedAt: new Date().toISOString(),
        source: 'mria-marketing-boas-vindas/pesquisa/onboarding',
        turma: 'Módulo Marketing',
        programa: 'Máquina de Receita com IA',
        respostas: {
          canal: answers.canal || null,
          canal_outro: (otherTexts.canal || '').trim() || null,
          nivel_ia: answers.nivel_ia || null,
          dimensoes_aiox: matrixAnswers.dimensoes_aiox || null,
          valeu_centavo: answers.valeu_centavo || null,
          receio: answers.receio || null,
        },
      };
      // Best-effort: dispara para o endpoint interno (que faz proxy ao n8n).
      // Sem logar payload — contém PII (telefone, e-mail).
      try {
        fetch(CONFIRM_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          keepalive: true,
          body: JSON.stringify(payload),
        }).catch(() => {});
      } catch {
        /* não bloqueia a entrada no grupo */
      }
      if (!GROUP_REQUEST_URL) {
        e.preventDefault();
        alert(
          'Webhook de confirmação enviado.\n\nO link de entrada no grupo ainda não foi configurado — o time vai te chamar manualmente.'
        );
      }
    };

    const handleWrong = (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (!SUPPORT_WHATSAPP_URL) {
        e.preventDefault();
        alert(
          'O link do suporte ainda não foi configurado.\n\nPor enquanto, fale com o time da Academia Lendária pelos canais de costume.'
        );
      }
    };

    return (
      <main className="shell">
        <Constellation />
        <div className="container">
          <Header />
          <div className="done">
            <h1 className="done-title">
              Resposta <em>confirmada</em>
            </h1>
            <p className="done-text">
              Você vai solicitar entrada no grupo de WhatsApp{' '}
              <strong>Módulo Marketing — Máquina de Receita com IA</strong>. O número
              cadastrado em nosso sistema, que será autorizado a entrar no
              grupo, é:
            </p>
            <div className="done-phone-box">
              <span className="done-phone-label">Número cadastrado</span>
              <span
                className={`done-phone${confirmedPhone ? '' : ' done-phone-muted'}`}
              >
                {confirmedPhone ?? 'não identificado — fale com o suporte'}
              </span>
            </div>
            <div className="done-actions">
              <a
                className={`btn btn-primary${GROUP_REQUEST_URL ? '' : ' btn-disabled'}`}
                href={GROUP_REQUEST_URL || '#'}
                target={GROUP_REQUEST_URL ? '_blank' : undefined}
                rel="noopener"
                onClick={handleConfirm}
                title={
                  GROUP_REQUEST_URL ? undefined : 'Link do grupo ainda não configurado'
                }
              >
                Número Correto → Solicitar entrada no grupo
              </a>
              <a
                className={`btn btn-ghost${SUPPORT_WHATSAPP_URL ? '' : ' btn-disabled'}`}
                href={SUPPORT_WHATSAPP_URL || '#'}
                target={SUPPORT_WHATSAPP_URL ? '_blank' : undefined}
                rel="noopener"
                onClick={handleWrong}
                title={
                  SUPPORT_WHATSAPP_URL ? undefined : 'Link do suporte ainda não configurado'
                }
              >
                Número errado → Alterar cadastro com suporte
              </a>
            </div>
            <p className="done-text-small">
              Ao solicitar entrada, aguarde, o time da Academia Lendária aprova
              seu ingresso no grupo o mais breve possível.
            </p>
            <span className="brand-wordmark">
              Academia Lendár<span className="bracket">[IA]</span>
            </span>
          </div>
          <LegalFooter />
        </div>
      </main>
    );
  }

  return (
    <main className="shell">
      <Constellation />
      <div className="container">
        <Header />

        <div className="progress" aria-label="Progresso do formulário">
          <div className="progress-meta">
            <span className="progress-count">
              {String(safeStep + 1).padStart(2, '0')} /{' '}
              {String(total).padStart(2, '0')}
            </span>
            <span className="progress-percent">{progress}%</span>
          </div>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${Math.max(progress, 4)}%` }}
            />
          </div>
        </div>

        {current && (
          <section key={current.id} className="card">
            <span className="block-tag">{BLOCK_LABELS[current.block]}</span>

            <h2 className="question">{current.label}</h2>
            {current.helper && <p className="helper">{current.helper}</p>}

            <QuestionField
              question={current}
              value={answers[current.id] ?? ''}
              onChange={(v) => setAnswer(current.id, v)}
              otherValue={otherTexts[current.id] ?? ''}
              onOtherChange={(v) => setOther(current.id, v)}
              matrixValue={matrixAnswers[current.id] ?? {}}
              onMatrixChange={(rowId, v) =>
                setMatrixCell(current.id, rowId, v)
              }
            />

            {error && <span className="input-error">{error}</span>}
            {submitError && <span className="input-error">{submitError}</span>}

            {current.id === 'email' && showEmailSupport && (
              <div className="support-panel">
                <p className="support-panel-text">
                  Caso não lembre qual é o seu e-mail, ou já tenha validado a
                  digitação e o e-mail esteja correto, por favor entre em
                  contato com nosso suporte clicando no botão abaixo.
                </p>
                <a
                  className="btn btn-danger-soft"
                  href={EMAIL_SUPPORT_URL}
                  target="_blank"
                  rel="noopener"
                >
                  Falar com o suporte no WhatsApp →
                </a>
              </div>
            )}

            {current.id === 'email' && (
              <div className="consent">
                <p className="consent-notice">
                  Ao enviar este formulário, você declara estar ciente de que
                  seus dados serão tratados pela ACADEMIA LENDÁRIA LTDA. para
                  fins de contato, atendimento, envio de informações e
                  comunicações relacionadas aos nossos produtos, serviços e
                  conteúdos, conforme nossa{' '}
                  <a href={PRIVACY_URL} target="_blank" rel="noopener">
                    Política de Privacidade
                  </a>
                  .
                </p>
                <label className="consent-check">
                  <input
                    type="checkbox"
                    checked={accepted}
                    onChange={(e) => {
                      setAccepted(e.target.checked);
                      setError(null);
                    }}
                  />
                  <span className="consent-check-mark" aria-hidden="true" />
                  <span className="consent-check-label">
                    Li e aceito os{' '}
                    <a href={TERMS_URL} target="_blank" rel="noopener">
                      Termos de Uso
                    </a>{' '}
                    e a{' '}
                    <a href={PRIVACY_URL} target="_blank" rel="noopener">
                      Política de Privacidade
                    </a>{' '}
                    da ACADEMIA LENDÁRIA LTDA.
                  </span>
                </label>
              </div>
            )}

            <div className="nav">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={handleBack}
                disabled={safeStep === 0 || submitting || validatingEmail}
              >
                ← Voltar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleNext}
                disabled={submitting || validatingEmail}
              >
                {submitting || validatingEmail ? (
                  <span className="pulse">
                    <span />
                    <span />
                    <span />
                  </span>
                ) : safeStep === total - 1 ? (
                  'Enviar respostas'
                ) : (
                  'Próxima →'
                )}
              </button>
            </div>
          </section>
        )}
        <LegalFooter />
      </div>
    </main>
  );
}

function LegalFooter() {
  return (
    <footer className="legal-footer" role="contentinfo">
      <nav className="legal-footer-links" aria-label="Documentos legais">
        <a href={PRIVACY_URL} target="_blank" rel="noopener">
          Política de Privacidade
        </a>
        <a href={TERMS_URL} target="_blank" rel="noopener">
          Termos de Uso
        </a>
        <a href={COOKIES_URL} target="_blank" rel="noopener">
          Política de Cookies
        </a>
        <a href={SUPPORT_EMAIL_URL}>Suporte</a>
      </nav>
      <p className="legal-footer-cnpj">
        ACADEMIA LENDÁRIA LTDA. · CNPJ 37.348.342/0001-07
      </p>
      <p className="legal-footer-copy">
        © 2026 Academia Lendária. Todos os direitos reservados.
      </p>
    </footer>
  );
}

function Header() {
  return (
    <div className="brand">
      <span className="brand-pill">Máquina de Receita com IA · Módulo Marketing</span>
      <h1 className="brand-title">Pesquisa de Onboarding</h1>
    </div>
  );
}

interface QuestionFieldProps {
  question: Question;
  value: string;
  onChange: (v: string) => void;
  otherValue: string;
  onOtherChange: (v: string) => void;
  matrixValue: Record<string, string>;
  onMatrixChange: (rowId: string, v: string) => void;
}

function QuestionField({
  question,
  value,
  onChange,
  otherValue,
  onOtherChange,
  matrixValue,
  onMatrixChange,
}: QuestionFieldProps) {
  if (question.type === 'matrix' && question.rows && question.scale) {
    return (
      <div className="field">
        {question.scaleLegend && (
          <div className="matrix-scale-legend">
            <span>
              <strong>{question.scaleLegend.min}</strong>
            </span>
            <span>
              <strong>{question.scaleLegend.max}</strong>
            </span>
          </div>
        )}
        <div className="matrix" role="group" aria-label={question.label}>
          {question.rows.map((row) => {
            const rowValue = matrixValue[row.id] ?? '';
            return (
              <div
                key={row.id}
                className={`matrix-row ${rowValue ? 'filled' : ''}`}
              >
                <div className="matrix-row-header">
                  <span className="matrix-row-title">{row.label}</span>
                  {row.description && (
                    <span className="matrix-row-description">
                      {row.description}
                    </span>
                  )}
                </div>
                <div
                  className="matrix-scale"
                  role="radiogroup"
                  aria-label={`Nível em ${row.label}`}
                >
                  {question.scale!.map((n) => {
                    const v = String(n);
                    const selected = rowValue === v;
                    return (
                      <button
                        key={n}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        className={`matrix-scale-btn ${selected ? 'selected' : ''}`}
                        onClick={() => onMatrixChange(row.id, v)}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (question.type === 'textarea') {
    return (
      <div className="field">
        <textarea
          className="textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={question.placeholder}
          autoFocus
        />
      </div>
    );
  }

  if (question.type === 'radio' && question.options) {
    return (
      <div className="field">
        <div className="options" role="radiogroup">
          {question.options.map((opt) => {
            const selected = value === opt.value;
            return (
              <label
                key={opt.value}
                className={`option ${selected ? 'selected' : ''}`}
              >
                <input
                  type="radio"
                  name={question.id}
                  value={opt.value}
                  checked={selected}
                  onChange={() => onChange(opt.value)}
                />
                <span className="option-mark" aria-hidden="true" />
                <span className="option-label">{opt.label}</span>
              </label>
            );
          })}
        </div>
        {question.allowOther && value === 'outro' && (
          <input
            className="input option-other"
            placeholder="Conta qual é o outro canal..."
            value={otherValue}
            onChange={(e) => onOtherChange(e.target.value)}
            autoFocus
          />
        )}
      </div>
    );
  }

  return (
    <div className="field">
      <input
        className="input"
        type={question.type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={question.placeholder}
        autoComplete={
          question.type === 'email'
            ? 'email'
            : question.type === 'tel'
              ? 'tel'
              : question.id === 'nome'
                ? 'name'
                : 'off'
        }
        autoFocus
      />
    </div>
  );
}
