'use client';

import { useMemo, useState } from 'react';
import Constellation from '@/components/Constellation';
import { BLOCK_LABELS, QUESTIONS, type Question } from '@/lib/questions';

type Answers = Record<string, string>;

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RX = /\d/;

function validate(q: Question, raw: string, otherText: string): string | null {
  const value = (raw ?? '').trim();
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
  const [answers, setAnswers] = useState<Answers>({});
  const [otherTexts, setOtherTexts] = useState<Answers>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const visibleQuestions = useMemo(
    () => QUESTIONS.filter((q) => !q.showIf || q.showIf(answers)),
    [answers]
  );

  const total = visibleQuestions.length;
  const safeStep = Math.min(step, total - 1);
  const current = visibleQuestions[safeStep];
  const progress = submitted
    ? 100
    : Math.round(((safeStep + 0) / total) * 100);

  function setAnswer(id: string, value: string) {
    setAnswers((a) => ({ ...a, [id]: value }));
    setError(null);
  }

  function setOther(id: string, value: string) {
    setOtherTexts((o) => ({ ...o, [id]: value }));
    setError(null);
  }

  async function handleNext() {
    if (!current) return;
    const raw = answers[current.id] ?? '';
    const other = otherTexts[current.id] ?? '';
    const v = validate(current, raw, other);
    if (v) {
      setError(v);
      return;
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
      const payload = {
        respondedAt: new Date().toISOString(),
        answers: QUESTIONS.reduce<Answers>((acc, q) => {
          if (q.showIf && !q.showIf(answers)) return acc;
          const value = answers[q.id] ?? '';
          if (q.type === 'radio' && value === 'outro') {
            acc[q.id] = `outro: ${otherTexts[q.id]?.trim() ?? ''}`;
          } else if (value) {
            acc[q.id] = value;
          }
          return acc;
        }, {}),
        meta: {
          source: 'sistema-dspc/pesquisa',
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
    return (
      <main className="shell">
        <Constellation />
        <div className="container">
          <Header />
          <div className="done">
            <h1 className="done-title">Resposta confirmada</h1>
            <p className="done-text">
              Valeu, <strong>{answers.nome?.split(' ')[0] || 'parceiro(a)'}</strong>.
              Suas respostas chegaram <em>direitinho</em> pra gente — vamos usar isso
              pra preparar um caso REAL ao vivo na sua medida.
              <br /><br />
              A gente se vê no Zoom.
            </p>
            <span className="bracket-cta">Academia Lendária</span>
          </div>
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
              {String(safeStep + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
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
            />

            {error && <span className="input-error">{error}</span>}
            {submitError && <span className="input-error">{submitError}</span>}

            <div className="nav">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={handleBack}
                disabled={safeStep === 0 || submitting}
              >
                ← Voltar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleNext}
                disabled={submitting}
              >
                {submitting ? (
                  <span className="pulse"><span /><span /><span /></span>
                ) : safeStep === total - 1 ? (
                  'Enviar respostas'
                ) : (
                  'Próxima →'
                )}
              </button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function Header() {
  return (
    <div className="brand">
      <span className="brand-pill">Academia Lendária</span>
      <h1 className="brand-title">Sistema 4D · Pesquisa</h1>
    </div>
  );
}

interface QuestionFieldProps {
  question: Question;
  value: string;
  onChange: (v: string) => void;
  otherValue: string;
  onOtherChange: (v: string) => void;
}

function QuestionField({
  question,
  value,
  onChange,
  otherValue,
  onOtherChange,
}: QuestionFieldProps) {
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
            placeholder="Conta qual é o outro motivo..."
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
