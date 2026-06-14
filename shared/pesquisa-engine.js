// =============================================================================
// pesquisa-engine.js — Motor compartilhado da pesquisa de onboarding (MRIA)
//
// Cada turma define window.PESQUISA_CONFIG na casca (index.html) e carrega
// este arquivo. O motor monta a página, roda o formulário e fala SÓ com
// /api/onboarding ({ turma, etapa, payload }) — nunca com o n8n direto.
//
// Campos esperados em PESQUISA_CONFIG:
//   turma             'marketing' | 'comercial'  (chave de roteamento no /api)
//   apiUrl            caminho relativo até /api/onboarding (ex.: '../../api/onboarding')
//   titulo            <title> da página
//   brandPill         texto da pílula no topo
//   programa          ex.: 'Máquina de Receita com IA'
//   turmaLabel        ex.: 'Módulo Marketing'
//   grupoNome         nome do grupo exibido na tela final
//   groupUrl          link de entrada no grupo (WhatsApp/sndflw)
//   source            string de origem enviada ao n8n
//   supportPhoneDigits  ex.: '554888000116'
//   blockLabels       { 1: '...', 2: '...', 3: '...' }
//   questions         array de perguntas (ver formato no original)
// =============================================================================
(function () {
  'use strict';

  const CONFIG = window.PESQUISA_CONFIG;
  if (!CONFIG) { console.error('[pesquisa] PESQUISA_CONFIG ausente'); return; }

  const API_URL = CONFIG.apiUrl || '../../api/onboarding';
  const TURMA = CONFIG.turma;
  const QUESTIONS = CONFIG.questions || [];
  const BLOCK_LABELS = CONFIG.blockLabels || {};

  const PRIVACY_URL = 'https://www.academialendaria.ai/politica-de-privacidade';
  const TERMS_URL = 'https://www.academialendaria.ai/termos-de-uso';
  const COOKIES_URL = 'https://www.academialendaria.ai/politica-de-cookies';
  const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const SUPPORT_PHONE_DIGITS = CONFIG.supportPhoneDigits || '554888000116';
  function buildSupportUrl(prefilled) {
    return 'https://wa.me/' + SUPPORT_PHONE_DIGITS + '?text=' + encodeURIComponent(prefilled);
  }
  const EMAIL_SUPPORT_URL = buildSupportUrl(
    'Olá, preciso de ajuda com a validação do meu e-mail na pesquisa de onboarding do ' +
    CONFIG.turmaLabel + ' da ' + CONFIG.programa + '.'
  );
  const SUPPORT_WHATSAPP_URL = buildSupportUrl(
    'Olá, preciso ajustar meu cadastro — o número que apareceu no sistema do ' +
    CONFIG.turmaLabel + ' está errado.'
  );
  const GROUP_REQUEST_URL = CONFIG.groupUrl || '';

  // ---------------------------------------------------------------------------
  // Chamada única ao proxy. Repassa { turma, etapa, payload }.
  // ---------------------------------------------------------------------------
  function callApi(etapa, payload, opts) {
    return fetch(API_URL, Object.assign({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ turma: TURMA, etapa: etapa, payload: payload }),
    }, opts || {}));
  }

  // ---------------------------------------------------------------------------
  // Monta a estrutura da página (chrome) a partir do config.
  // ---------------------------------------------------------------------------
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  function mountChrome() {
    document.title = CONFIG.titulo || 'Pesquisa de Onboarding | Academia Lendária';
    document.body.innerHTML = `
  <svg class="constellation" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
    <line x1="8" y1="18" x2="22" y2="8" stroke="rgba(201,178,152,0.15)" stroke-width="0.08"/>
    <line x1="22" y1="8" x2="38" y2="24" stroke="rgba(201,178,152,0.15)" stroke-width="0.08"/>
    <line x1="38" y1="24" x2="55" y2="12" stroke="rgba(201,178,152,0.15)" stroke-width="0.08"/>
    <line x1="55" y1="12" x2="88" y2="15" stroke="rgba(201,178,152,0.15)" stroke-width="0.08"/>
    <line x1="72" y1="28" x2="88" y2="15" stroke="rgba(201,178,152,0.15)" stroke-width="0.08"/>
    <line x1="14" y1="62" x2="32" y2="78" stroke="rgba(201,178,152,0.15)" stroke-width="0.08"/>
    <line x1="32" y1="78" x2="48" y2="85" stroke="rgba(201,178,152,0.15)" stroke-width="0.08"/>
    <line x1="48" y1="85" x2="64" y2="70" stroke="rgba(201,178,152,0.15)" stroke-width="0.08"/>
    <line x1="64" y1="70" x2="82" y2="88" stroke="rgba(201,178,152,0.15)" stroke-width="0.08"/>
    <line x1="6" y1="40" x2="14" y2="62" stroke="rgba(201,178,152,0.15)" stroke-width="0.08"/>
    <line x1="28" y1="45" x2="58" y2="50" stroke="rgba(201,178,152,0.15)" stroke-width="0.08"/>
    <circle cx="8" cy="18" r="0.22" fill="#E4D8CA" opacity="0.7"/>
    <circle cx="22" cy="8" r="0.29" fill="#E4D8CA" opacity="0.5"/>
    <circle cx="38" cy="24" r="0.18" fill="#E4D8CA" opacity="0.6"/>
    <circle cx="55" cy="12" r="0.25" fill="#E4D8CA" opacity="0.8"/>
    <circle cx="72" cy="28" r="0.20" fill="#E4D8CA" opacity="0.5"/>
    <circle cx="88" cy="15" r="0.31" fill="#E4D8CA" opacity="0.7"/>
    <circle cx="14" cy="62" r="0.23" fill="#E4D8CA" opacity="0.6"/>
    <circle cx="32" cy="78" r="0.27" fill="#E4D8CA" opacity="0.7"/>
    <circle cx="48" cy="85" r="0.18" fill="#E4D8CA" opacity="0.4"/>
    <circle cx="64" cy="70" r="0.32" fill="#E4D8CA" opacity="0.8"/>
    <circle cx="82" cy="88" r="0.22" fill="#E4D8CA" opacity="0.6"/>
    <circle cx="92" cy="55" r="0.25" fill="#E4D8CA" opacity="0.5"/>
    <circle cx="6" cy="40" r="0.20" fill="#E4D8CA" opacity="0.5"/>
    <circle cx="28" cy="45" r="0.16" fill="#E4D8CA" opacity="0.4"/>
    <circle cx="58" cy="50" r="0.23" fill="#E4D8CA" opacity="0.6"/>
  </svg>

  <main class="container">
    <header class="brand">
      <span class="brand-pill">${escapeHtml(CONFIG.brandPill || '')}</span>
      <h1 class="brand-title">Pesquisa de Onboarding</h1>
    </header>

    <section id="form-section">
      <div class="progress" aria-label="Progresso do formulário">
        <div class="progress-meta">
          <span id="progress-count" class="progress-count">01 / 06</span>
          <span id="progress-percent" class="progress-percent">0%</span>
        </div>
        <div class="progress-track">
          <div id="progress-fill" class="progress-fill"></div>
        </div>
      </div>
      <div id="card" class="card"></div>
    </section>

    <section id="done-section" class="hidden">
      <div class="done">
        <h1 class="done-title">Resposta <em>confirmada</em></h1>
        <p class="done-text">
          Você vai solicitar entrada no grupo de WhatsApp
          <strong>${escapeHtml(CONFIG.grupoNome || '')}</strong>. O número cadastrado
          em nosso sistema, que será autorizado a entrar no grupo, é:
        </p>
        <div class="done-phone-box">
          <span class="done-phone-label">Número cadastrado</span>
          <span id="done-phone" class="done-phone done-phone-muted">aguardando…</span>
        </div>
        <div class="done-actions">
          <a id="btn-confirm" class="btn btn-primary" href="#" rel="noopener">
            Número Correto → Solicitar entrada no grupo
          </a>
          <a id="btn-wrong" class="btn btn-ghost" href="#" rel="noopener">
            Número errado → Alterar cadastro com suporte
          </a>
        </div>
        <p class="done-text-small">
          Ao solicitar entrada, aguarde, o time da Academia Lendária aprova
          seu ingresso no grupo o mais breve possível.
        </p>
        <span class="brand-wordmark">Academia Lendár<span class="bracket">[IA]</span></span>
      </div>
    </section>

    <footer class="legal-footer">
      <nav class="legal-footer-links" aria-label="Documentos legais">
        <a href="${PRIVACY_URL}" target="_blank" rel="noopener">Política de Privacidade</a>
        <a href="${TERMS_URL}" target="_blank" rel="noopener">Termos de Uso</a>
        <a href="${COOKIES_URL}" target="_blank" rel="noopener">Política de Cookies</a>
        <a href="mailto:suporte@academialendaria.ai">Suporte</a>
      </nav>
      <p class="legal-footer-cnpj">ACADEMIA LENDÁRIA LTDA. · CNPJ 37.348.342/0001-07</p>
      <p class="legal-footer-copy">© 2026 Academia Lendária. Todos os direitos reservados.</p>
    </footer>
  </main>`;
  }

  // ---------------------------------------------------------------------------
  // Estado + lógica do formulário (preservada do original).
  // ---------------------------------------------------------------------------
  const state = { step: 0, answers: {}, others: {}, matrix: {}, submitting: false, validatingEmail: false, showEmailSupport: false, confirmedPhone: null, accepted: false };

  function visibleQuestions() {
    return QUESTIONS.filter((q) => !q.showIf || q.showIf(state.answers));
  }

  function validate(q, value, other, matrix) {
    value = (value || '').trim();
    if (q.type === 'matrix') {
      const filled = (q.rows || []).filter((r) => matrix && matrix[r.id]).length;
      if (q.required && filled < (q.rows || []).length) {
        return `Marca seu nível em todas as ${q.rows.length} dimensões antes de seguir.`;
      }
      return null;
    }
    if (q.required && !value) return 'Esse campo é obrigatório.';
    if (q.type === 'email' && value && !EMAIL_RX.test(value)) return 'Coloca um e-mail válido (ex.: voce@email.com).';
    if (q.type === 'tel' && value && value.replace(/\D/g, '').length < 10) return 'Coloca o WhatsApp com DDD.';
    if (q.type === 'radio' && value === 'outro' && !(other || '').trim()) return 'Conta pra gente qual é o "outro".';
    return null;
  }

  function render() {
    const list = visibleQuestions();
    const total = list.length;
    const step = Math.min(state.step, total - 1);
    const q = list[step];
    const progress = Math.round((step / total) * 100);

    document.getElementById('progress-count').textContent =
      String(step + 1).padStart(2, '0') + ' / ' + String(total).padStart(2, '0');
    document.getElementById('progress-percent').textContent = progress + '%';
    document.getElementById('progress-fill').style.width = Math.max(progress, 4) + '%';

    const card = document.getElementById('card');
    card.innerHTML = '';

    const tag = document.createElement('span');
    tag.className = 'block-tag';
    tag.textContent = BLOCK_LABELS[q.block];
    card.appendChild(tag);

    const title = document.createElement('h2');
    title.className = 'question';
    title.textContent = q.label;
    card.appendChild(title);

    if (q.helper) {
      const h = document.createElement('p');
      h.className = 'helper';
      h.textContent = q.helper;
      card.appendChild(h);
    }

    const field = document.createElement('div');
    field.className = 'field';
    card.appendChild(field);

    const value = state.answers[q.id] || '';
    const other = state.others[q.id] || '';
    const matrixVal = state.matrix[q.id] || {};

    if (q.type === 'matrix') {
      if (q.scaleLegend) {
        const legend = document.createElement('div');
        legend.className = 'matrix-scale-legend';
        legend.innerHTML = `<span><strong>${escapeHtml(q.scaleLegend.min)}</strong></span><span><strong>${escapeHtml(q.scaleLegend.max)}</strong></span>`;
        field.appendChild(legend);
      }
      const matrix = document.createElement('div');
      matrix.className = 'matrix';
      matrix.setAttribute('role', 'group');
      q.rows.forEach((row) => {
        const rowVal = matrixVal[row.id] || '';
        const rowEl = document.createElement('div');
        rowEl.className = 'matrix-row' + (rowVal ? ' filled' : '');
        rowEl.innerHTML = `
          <div class="matrix-row-header">
            <span class="matrix-row-title">${escapeHtml(row.label)}</span>
            ${row.description ? `<span class="matrix-row-description">${escapeHtml(row.description)}</span>` : ''}
          </div>
          <div class="matrix-scale" role="radiogroup" aria-label="Nível em ${escapeHtml(row.label)}"></div>
        `;
        const scaleEl = rowEl.querySelector('.matrix-scale');
        q.scale.forEach((n) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.setAttribute('role', 'radio');
          const selected = rowVal === String(n);
          btn.setAttribute('aria-checked', selected ? 'true' : 'false');
          btn.className = 'matrix-scale-btn' + (selected ? ' selected' : '');
          btn.textContent = n;
          btn.addEventListener('click', () => {
            if (!state.matrix[q.id]) state.matrix[q.id] = {};
            state.matrix[q.id][row.id] = String(n);
            clearError();
            render();
          });
          scaleEl.appendChild(btn);
        });
        matrix.appendChild(rowEl);
      });
      field.appendChild(matrix);
    } else if (q.type === 'textarea') {
      const ta = document.createElement('textarea');
      ta.className = 'textarea';
      ta.placeholder = q.placeholder || '';
      ta.value = value;
      ta.addEventListener('input', (e) => { state.answers[q.id] = e.target.value; clearError(); });
      field.appendChild(ta);
      setTimeout(() => ta.focus(), 50);
    } else if (q.type === 'radio') {
      const opts = document.createElement('div');
      opts.className = 'options';
      opts.setAttribute('role', 'radiogroup');
      q.options.forEach((opt) => {
        const lbl = document.createElement('label');
        lbl.className = 'option' + (value === opt.value ? ' selected' : '');
        lbl.innerHTML = `
          <input type="radio" name="${q.id}" value="${escapeHtml(opt.value)}" ${value === opt.value ? 'checked' : ''}>
          <span class="option-mark" aria-hidden="true"></span>
          <span class="option-label">${escapeHtml(opt.label)}</span>
        `;
        lbl.addEventListener('click', () => {
          state.answers[q.id] = opt.value;
          clearError();
          render();
        });
        opts.appendChild(lbl);
      });
      field.appendChild(opts);

      if (q.allowOther && value === 'outro') {
        const otherInput = document.createElement('input');
        otherInput.className = 'input option-other';
        otherInput.placeholder = 'Conta qual é o outro canal...';
        otherInput.value = other;
        otherInput.addEventListener('input', (e) => { state.others[q.id] = e.target.value; clearError(); });
        field.appendChild(otherInput);
        setTimeout(() => otherInput.focus(), 50);
      }
    } else {
      const inp = document.createElement('input');
      inp.className = 'input';
      inp.type = q.type;
      inp.placeholder = q.placeholder || '';
      inp.value = value;
      inp.autocomplete = q.type === 'email' ? 'email' : q.type === 'tel' ? 'tel' : 'off';
      inp.addEventListener('input', (e) => { state.answers[q.id] = e.target.value; clearError(); });
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); handleNext(); } });
      field.appendChild(inp);
      setTimeout(() => inp.focus(), 50);
    }

    if (q.id === 'email') {
      const consent = document.createElement('div');
      consent.className = 'consent';
      consent.innerHTML = `
        <p class="consent-notice">
          Ao enviar este formulário, você declara estar ciente de que seus dados serão
          tratados pela ACADEMIA LENDÁRIA LTDA. para fins de contato, atendimento, envio
          de informações e comunicações relacionadas aos nossos produtos, serviços e
          conteúdos, conforme nossa <a href="${PRIVACY_URL}" target="_blank" rel="noopener">Política de Privacidade</a>.
        </p>
        <label class="consent-check">
          <input type="checkbox" ${state.accepted ? 'checked' : ''}>
          <span class="consent-check-mark" aria-hidden="true"></span>
          <span class="consent-check-label">
            Li e aceito os <a href="${TERMS_URL}" target="_blank" rel="noopener">Termos de Uso</a>
            e a <a href="${PRIVACY_URL}" target="_blank" rel="noopener">Política de Privacidade</a>
            da ACADEMIA LENDÁRIA LTDA.
          </span>
        </label>
      `;
      consent.querySelector('input[type="checkbox"]').addEventListener('change', (e) => {
        state.accepted = e.target.checked;
        clearError();
      });
      card.appendChild(consent);
    }

    const errEl = document.createElement('span');
    errEl.id = 'error';
    errEl.className = 'input-error';
    errEl.style.display = 'none';
    card.appendChild(errEl);

    if (q.id === 'email' && state.showEmailSupport) {
      const supportPanel = document.createElement('div');
      supportPanel.className = 'support-panel';
      supportPanel.innerHTML = `
        <p class="support-panel-text">
          Caso não lembre qual é o seu e-mail, ou já tenha validado a digitação
          e o e-mail esteja correto, por favor entre em contato com nosso
          suporte clicando no botão abaixo.
        </p>
        <a class="btn btn-danger-soft" href="${EMAIL_SUPPORT_URL}" target="_blank" rel="noopener">
          Falar com o suporte no WhatsApp →
        </a>
      `;
      card.appendChild(supportPanel);
    }

    const nav = document.createElement('div');
    nav.className = 'nav';
    const busy = state.submitting || state.validatingEmail;
    nav.innerHTML = `
      <button type="button" class="btn btn-ghost" id="btn-back" ${step === 0 || busy ? 'disabled' : ''}>← Voltar</button>
      <button type="button" class="btn btn-primary" id="btn-next" ${busy ? 'disabled' : ''}>
        ${busy ? '<span class="pulse"><span></span><span></span><span></span></span>' : (step === total - 1 ? 'Enviar respostas' : 'Próxima →')}
      </button>
    `;
    card.appendChild(nav);

    document.getElementById('btn-back').addEventListener('click', handleBack);
    document.getElementById('btn-next').addEventListener('click', handleNext);
  }

  function showError(msg) {
    const e = document.getElementById('error');
    if (!e) return;
    e.textContent = msg;
    e.style.display = 'block';
  }

  function clearError() {
    const e = document.getElementById('error');
    if (e) { e.textContent = ''; e.style.display = 'none'; }
  }

  function handleBack() {
    if (state.step === 0) return;
    state.step--;
    clearError();
    render();
  }

  async function handleNext() {
    const list = visibleQuestions();
    const q = list[state.step];
    const err = validate(q, state.answers[q.id], state.others[q.id], state.matrix[q.id]);
    if (err) { showError(err); return; }

    if (q.id === 'email') {
      if (!state.accepted) {
        showError('Pra continuar, confirma que leu e aceita os Termos de Uso e a Política de Privacidade.');
        return;
      }
      state.validatingEmail = true;
      clearError();
      render();
      const email = (state.answers[q.id] || '').trim();
      const result = await lookupEmail(email);
      state.validatingEmail = false;
      if (result.found === false) {
        state.showEmailSupport = true;
        render();
        showError(
          'Não encontramos esse e-mail na nossa base de compras do ' + CONFIG.turmaLabel +
          '. Confere se digitou certo — ou se usou outro e-mail na hora da compra.'
        );
        return;
      }
      if (result.found === null) {
        console.warn('[email-lookup] inconclusivo:', result.error);
      }
      state.showEmailSupport = false;
    }

    if (state.step < list.length - 1) {
      state.step++;
      clearError();
      render();
      return;
    }
    await submit();
  }

  async function lookupEmail(email) {
    try {
      const res = await callApi('email-lookup', {
        email: email,
        source: CONFIG.source,
        event: 'email-lookup',
      });
      if (!res.ok) return { found: null, error: 'http-' + res.status };
      const raw = (await res.text()).trim();
      if (!raw) return { found: null, error: 'empty' };
      try {
        const data = JSON.parse(raw);
        return interpretEmailLookup(data);
      } catch {
        return interpretEmailLookup(raw);
      }
    } catch (err) {
      return { found: null, error: 'network' };
    }
  }

  function interpretEmailLookup(data) {
    if (data == null) return { found: null };
    if (typeof data === 'boolean') return { found: data };
    if (typeof data === 'string') {
      const lower = data.toLowerCase();
      if (/n[ãa]o[\s_-]?encontrad|not[\s_-]?found|nao_encontrado/.test(lower)) return { found: false };
      if (/encontrad|^found$|exists|^true$|^ok$|^sim$/.test(lower)) return { found: true };
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
      const boolKeys = ['found', 'encontrado', 'exists', 'existe', 'success'];
      for (const k of boolKeys) {
        if (typeof data[k] === 'boolean') return { found: data[k] };
      }
      const strKeys = ['status', 'result', 'resultado', 'message', 'msg', 'response', 'retorno'];
      for (const k of strKeys) {
        if (data[k] != null) {
          const r = interpretEmailLookup(data[k]);
          if (r.found !== null) return r;
        }
      }
      for (const v of Object.values(data)) {
        if (v && typeof v === 'object') {
          const r = interpretEmailLookup(v);
          if (r.found !== null) return r;
        }
      }
    }
    return { found: null };
  }

  function computeBaselineScore(dims) {
    if (!dims) return null;
    const vals = Object.values(dims).map(Number).filter((n) => Number.isFinite(n) && n >= 1 && n <= 5);
    if (vals.length === 0) return null;
    return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100;
  }

  async function submit() {
    state.submitting = true;
    render();

    const payload = {
      respondedAt: new Date().toISOString(),
      answers: {},
      meta: {
        source: CONFIG.source,
        turma: CONFIG.turmaLabel,
        programa: CONFIG.programa,
        userAgent: navigator.userAgent,
        referrer: document.referrer || null,
      },
    };

    QUESTIONS.forEach((q) => {
      if (q.showIf && !q.showIf(state.answers)) return;
      if (q.type === 'matrix') {
        const m = state.matrix[q.id];
        if (m && Object.keys(m).length > 0) payload.answers[q.id] = m;
        return;
      }
      const v = state.answers[q.id];
      if (v === undefined || v === '') return;
      if (q.type === 'radio' && v === 'outro') {
        payload.answers[q.id] = 'outro: ' + ((state.others[q.id] || '').trim());
      } else {
        payload.answers[q.id] = v;
      }
    });

    const score = computeBaselineScore(payload.answers.dimensoes_aiox);
    if (score !== null) payload.answers.baseline_score = score;

    try {
      const res = await callApi('submit', payload);
      if (!res.ok) throw new Error('http-' + res.status);

      let phone = null;
      try {
        const raw = await res.text();
        if (raw) {
          try {
            const data = JSON.parse(raw);
            phone = extractPhone(data);
          } catch {
            const trimmed = raw.trim();
            if (/\d{8,}/.test(trimmed)) phone = trimmed;
          }
        }
      } catch {
        /* segue com phone=null */
      }
      state.confirmedPhone = phone;
      showDone();
    } catch (err) {
      state.submitting = false;
      render();
      showError('Não rolou enviar agora. Confere sua conexão e tenta de novo em alguns segundos.');
    }
  }

  function extractPhone(data) {
    if (!data) return null;
    if (typeof data === 'string') return data.trim() || null;
    if (Array.isArray(data)) {
      for (const item of data) {
        const p = extractPhone(item);
        if (p) return p;
      }
      return null;
    }
    if (typeof data === 'object') {
      const keys = ['telefone', 'phone', 'whatsapp', 'contato', 'celular', 'numero', 'number'];
      for (const k of keys) {
        if (data[k] != null && String(data[k]).trim()) return String(data[k]).trim();
      }
      for (const v of Object.values(data)) {
        if (v && typeof v === 'object') {
          const p = extractPhone(v);
          if (p) return p;
        }
      }
    }
    return null;
  }

  function showDone() {
    document.getElementById('form-section').classList.add('hidden');
    document.getElementById('done-section').classList.remove('hidden');

    const phoneEl = document.getElementById('done-phone');
    if (state.confirmedPhone) {
      phoneEl.textContent = state.confirmedPhone;
      phoneEl.classList.remove('done-phone-muted');
    } else {
      phoneEl.textContent = 'não identificado — fale com o suporte';
      phoneEl.classList.add('done-phone-muted');
    }

    const btnConfirm = document.getElementById('btn-confirm');
    const btnWrong = document.getElementById('btn-wrong');

    if (GROUP_REQUEST_URL) {
      btnConfirm.href = GROUP_REQUEST_URL;
      btnConfirm.target = '_blank';
      btnConfirm.classList.remove('btn-disabled');
    } else {
      btnConfirm.classList.add('btn-disabled');
      btnConfirm.title = 'Link do grupo ainda não configurado';
    }
    btnConfirm.onclick = (e) => {
      const payload = {
        event: 'confirm-group-entry',
        telefone: state.confirmedPhone || null,
        email: (state.answers.email || '').trim() || null,
        respondedAt: new Date().toISOString(),
        source: CONFIG.source,
        turma: CONFIG.turmaLabel,
        programa: CONFIG.programa,
        respostas: {
          canal: state.answers.canal || null,
          canal_outro: (state.others.canal || '').trim() || null,
          nivel_ia: state.answers.nivel_ia || null,
          dimensoes_aiox: state.matrix.dimensoes_aiox || null,
          valeu_centavo: state.answers.valeu_centavo || null,
          receio: state.answers.receio || null,
        },
      };
      // Fire-and-forget com keepalive (mobile abre o app do WhatsApp na sequência).
      // Sem console.log — payload contém PII.
      try {
        callApi('confirm', payload, { keepalive: true }).catch(() => {});
      } catch (err) {
        /* não bloqueia a entrada no grupo */
      }
      if (!GROUP_REQUEST_URL) {
        e.preventDefault();
        alert('Webhook de confirmação enviado.\n\nO link de entrada no grupo ainda não foi configurado — o time vai te chamar manualmente.');
      }
    };

    if (SUPPORT_WHATSAPP_URL) {
      btnWrong.href = SUPPORT_WHATSAPP_URL;
      btnWrong.target = '_blank';
      btnWrong.classList.remove('btn-disabled');
    } else {
      btnWrong.classList.add('btn-disabled');
      btnWrong.title = 'Link do suporte ainda não configurado';
    }
    btnWrong.onclick = (e) => {
      if (!SUPPORT_WHATSAPP_URL) {
        e.preventDefault();
        alert('O link do suporte ainda não foi configurado.\n\nPor enquanto, fale com o time da Academia Lendária pelos canais de costume.');
      }
    };

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Boot
  mountChrome();
  render();
})();
