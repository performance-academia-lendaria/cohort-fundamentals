export type QuestionType = 'text' | 'email' | 'tel' | 'textarea' | 'radio' | 'matrix';

export interface RadioOption {
  value: string;
  label: string;
}

export interface MatrixRow {
  id: string;
  label: string;
  description?: string;
}

export interface Question {
  id: string;
  block: 1 | 2 | 3;
  type: QuestionType;
  label: string;
  helper?: string;
  placeholder?: string;
  required?: boolean;
  options?: RadioOption[];
  allowOther?: boolean;
  rows?: MatrixRow[];
  scale?: number[];
  scaleLegend?: { min: string; max: string };
  showIf?: (answers: Record<string, string>) => boolean;
}

export const QUESTIONS: Question[] = [
  // ===== BLOCO 1 — IDENTIFICAÇÃO =====
  {
    id: 'email',
    block: 1,
    type: 'email',
    label: 'Qual o e-mail que você usou pra comprar a Máquina de Receita com IA?',
    helper: 'Mesmo e-mail da Hotmart — usamos pra vincular sua resposta à sua matrícula.',
    placeholder: 'voce@email.com',
    required: true,
  },
  {
    id: 'canal',
    block: 1,
    type: 'radio',
    label: 'Como você chegou até a turma?',
    required: true,
    allowOther: true,
    options: [
      { value: 'youtube_31_05', label: 'Aula gratuita no YouTube (31/05)' },
      { value: 'zoom_sistema_dspc', label: 'Zoom Sistema DSPC (08/06)' },
      { value: 'indicacao', label: 'Indicação de outro aluno' },
      { value: 'link_alana', label: 'Link direto da Alana' },
      { value: 'aluno_lendario', label: 'Já era aluno Lendário' },
      { value: 'trafego_pago', label: 'Tráfego pago (Instagram, YouTube, Google)' },
      { value: 'outro', label: 'Outro' },
    ],
  },

  // ===== BLOCO 2 — BASELINE PAREÁVEL =====
  {
    id: 'nivel_ia',
    block: 2,
    type: 'radio',
    label: 'Qual seu nível atual de uso de IA?',
    helper: 'Escolhe a opção que mais se aproxima da sua realidade hoje.',
    required: true,
    options: [
      { value: '1', label: '1. Uso só ChatGPT/Claude como chat de texto' },
      { value: '2', label: '2. Uso IA com prompts elaborados, mas só no chat' },
      { value: '3', label: '3. Já usei ferramentas de IA além do chat (geradores de imagem/vídeo, automações, no-code), mas sem método' },
      { value: '4', label: '4. Já montei algo funcional com IA (campanha, página, automação), mas sem consistência' },
      { value: '5', label: '5. Já oriento outras pessoas no uso de IA' },
    ],
  },
  {
    id: 'dimensoes_aiox',
    block: 2,
    type: 'matrix',
    label: 'Marque seu nível ATUAL em cada uma destas 4 frentes (método R.O.F.A.)',
    helper: 'Vamos repetir essa mesma matriz na formatura pra medir o quanto você evoluiu — então responde honesto, não tem certo nem errado.',
    required: true,
    scale: [1, 2, 3, 4, 5],
    scaleLegend: { min: '1 = não sei nada', max: '5 = domino completamente' },
    rows: [
      {
        id: 'oferta',
        label: 'Pesquisa & Oferta',
        description: 'Minerar dores reais do mercado e montar uma oferta forte com IA',
      },
      {
        id: 'funil',
        label: 'Funil & Páginas',
        description: 'Construir funil, página de venda e criativos com IA',
      },
      {
        id: 'trafego',
        label: 'Tráfego',
        description: 'Estruturar e otimizar campanhas de mídia paga (Meta/Google) com IA',
      },
      {
        id: 'receita',
        label: 'Receita',
        description: 'Ler os números (CAC, LTV, ROAS, payback) e decidir onde mexer pra crescer o faturamento',
      },
    ],
  },

  // ===== BLOCO 3 — KPI PESSOAL + SINAL QUALITATIVO =====
  {
    id: 'valeu_centavo',
    block: 3,
    type: 'textarea',
    label:
      'Se ao final do módulo você disser "valeu cada centavo", o que teria que ter acontecido?',
    helper: 'Sem filtro — fala o que pra VOCÊ significaria sucesso.',
    placeholder: 'Pensa um pouco antes de responder.',
    required: true,
  },
  {
    id: 'receio',
    block: 3,
    type: 'textarea',
    label: 'Qual seu MAIOR receio ou bloqueio ao começar?',
    helper: 'Honesto. O que mais te preocupa antes da Aula 1?',
    placeholder: 'Pode ser técnico, de tempo, de método — o que vier primeiro.',
    required: true,
  },
];

export const BLOCK_LABELS: Record<1 | 2 | 3, string> = {
  1: 'Bloco 01 · Identificação',
  2: 'Bloco 02 · Onde você está hoje',
  3: 'Bloco 03 · Sua visão',
};
