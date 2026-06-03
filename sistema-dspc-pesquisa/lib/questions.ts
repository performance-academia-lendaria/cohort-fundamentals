export type QuestionType = 'text' | 'email' | 'tel' | 'textarea' | 'radio';

export interface RadioOption {
  value: string;
  label: string;
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
  showIf?: (answers: Record<string, string>) => boolean;
}

export const QUESTIONS: Question[] = [
  // ===== BLOCO 1 — IDENTIFICAÇÃO =====
  {
    id: 'nome',
    block: 1,
    type: 'text',
    label: 'Primeiro, como podemos te chamar?',
    placeholder: 'Seu nome completo',
    required: true,
  },
  {
    id: 'email',
    block: 1,
    type: 'email',
    label: 'Qual o e-mail que você usou pra comprar?',
    helper: 'Esse é o e-mail que usamos pra vincular sua resposta à sua compra.',
    placeholder: 'voce@email.com',
    required: true,
  },
  {
    id: 'telefone',
    block: 1,
    type: 'tel',
    label: 'E seu WhatsApp pra gente te chamar?',
    placeholder: '(11) 99999-9999',
    required: true,
  },

  // ===== BLOCO 2 — DOR E POSICIONAMENTO =====
  {
    id: 'dor_real',
    block: 2,
    type: 'textarea',
    label:
      'Pra eu poder rodar um caso REAL ao vivo no Zoom: me descreve uma dor cara e recorrente — sua, do seu negócio, ou de um nicho que você conhece bem.',
    helper:
      'Me dá uma noção de quanto ela custa por semana (horas perdidas, dinheiro ou oportunidade que escapa).',
    placeholder: 'Conta com suas palavras...',
    required: true,
  },
  {
    id: 'nicho_ia',
    block: 2,
    type: 'textarea',
    label:
      'Se você fosse vender um serviço de IA amanhã, pra qual nicho ou mercado você venderia?',
    helper: 'Pode ser real ou um chute — quero saber pra onde sua cabeça vai.',
    placeholder: 'Pode escrever em uma frase...',
    required: true,
  },
  {
    id: 'faturamento_ia',
    block: 2,
    type: 'radio',
    label: 'Você já faturou alguma coisa com IA?',
    required: true,
    options: [
      { value: 'nunca', label: 'Nunca faturei' },
      { value: 'avulsos', label: 'Fiz 1 ou alguns trabalhos avulsos' },
      { value: 'recorrente', label: 'Já faturo recorrente e quero escalar' },
      {
        value: 'negocio',
        label: 'Tenho negócio e quero levar IA pros meus clientes',
      },
    ],
  },
  {
    id: 'faturamento_mensal',
    block: 2,
    type: 'radio',
    label: 'Quanto, por mês, mais ou menos?',
    helper: 'Só pra quem já fatura com IA.',
    required: true,
    options: [
      { value: 'ate_2k', label: 'Até R$ 2k' },
      { value: '2_5k', label: 'R$ 2–5k' },
      { value: '5_15k', label: 'R$ 5–15k' },
      { value: '15k_mais', label: 'R$ 15k+' },
    ],
    showIf: (a) => a.faturamento_ia === 'avulsos' || a.faturamento_ia === 'recorrente' || a.faturamento_ia === 'negocio',
  },
  {
    id: 'expectativa_zoom',
    block: 2,
    type: 'textarea',
    label:
      "No fim do Zoom, o que precisa ter acontecido pra você falar: 'isso valeu MUITO mais que os R$88'?",
    placeholder: 'Sem filtro — fala honesto.',
    required: true,
  },

  // ===== BLOCO 3 — PERFIL E COMPROMETIMENTO =====
  {
    id: 'ultimo_investimento',
    block: 3,
    type: 'radio',
    label:
      'Quando foi a última vez que você investiu em VOCÊ — curso, mentoria, comunidade paga — pra destravar algo profissional?',
    required: true,
    options: [
      { value: 'nunca', label: 'Nunca investi' },
      { value: 'faz_tempo', label: 'Já investi, mas faz tempo' },
      { value: 'ultimo_ano', label: 'Investi no último ano' },
      {
        value: 'recorrente',
        label: 'Invisto recorrente, é prioridade pra mim',
      },
    ],
  },
  {
    id: 'termina_que_comeca',
    block: 3,
    type: 'radio',
    label: 'E você costuma TERMINAR o que começa?',
    required: true,
    options: [
      { value: 'quase_tudo', label: 'Termino quase tudo' },
      { value: 'ao_vivo', label: 'Termino quando é ao vivo / com turma' },
      { value: 'largo_metade', label: 'Começo e largo na metade' },
      { value: 'nem_comeco', label: 'Compro e nem começo' },
    ],
  },
  {
    id: 'horas_semana',
    block: 3,
    type: 'radio',
    label:
      'Se pudesse receber ao vivo, um acompanhamento próximo do meu time, em encontros ao longo de 4 semanas: sendo 100% honesto, quantas horas por semana você teria pra dedicar?',
    required: true,
    options: [
      { value: 'menos_2h', label: 'Menos de 2h' },
      { value: '2_4h', label: '2–4h' },
      { value: '5_8h', label: '5–8h' },
      {
        value: 'mais_8h',
        label: 'Mais de 8h, tô decidido(a) a mergulhar de cabeça',
      },
    ],
  },
  {
    id: 'custo_nada_mudar',
    block: 3,
    type: 'textarea',
    label:
      'Se daqui a 12 meses NADA mudar na sua relação com IA, qual o custo disso pra você?',
    helper: 'Em dinheiro, oportunidade, posição no mercado.',
    placeholder: 'Pensa um pouco antes de responder.',
    required: true,
  },
  {
    id: 'motivo_nao_seguir',
    block: 3,
    type: 'radio',
    label:
      'Imagina que, depois do Zoom, você decide NÃO ir mais fundo nisso agora. Qual seria o motivo mais provável?',
    required: true,
    allowOther: true,
    options: [
      { value: 'dinheiro', label: 'Dinheiro' },
      { value: 'tempo', label: 'Tempo' },
      { value: 'medo', label: 'Medo de não dar conta' },
      { value: 'provas', label: 'Preciso de mais provas de que funciona' },
      { value: 'falar_alguem', label: 'Preciso falar com alguém antes' },
      { value: 'outro', label: 'Outro' },
    ],
  },
  {
    id: 'investimento_hoje',
    block: 3,
    type: 'radio',
    label:
      'Se você pudesse "magicamente" resolver os maiores problemas do seu negócio com IA, quanto você investiria pra começar isso HOJE?',
    required: true,
    options: [
      { value: '5k', label: 'R$ 5 mil' },
      { value: '10k', label: 'R$ 10 mil' },
      { value: '15k', label: 'R$ 15 mil' },
      { value: '25k', label: 'R$ 25 mil' },
      { value: '45k_mais', label: 'R$ 45 mil ou mais' },
    ],
  },
  {
    id: 'onde_12_meses',
    block: 3,
    type: 'textarea',
    label:
      'Onde você quer estar daqui a 12 meses na sua relação com IA — em uma frase?',
    placeholder: 'Uma frase só. A primeira que vier.',
    required: true,
  },
  {
    id: 'melhor_horario',
    block: 3,
    type: 'radio',
    label:
      'Sabendo que nosso encontro pode demorar de 2 a 4h, qual seria o melhor horário de início?',
    required: true,
    options: [
      { value: '18h', label: '18h' },
      { value: '19h', label: '19h' },
      { value: '20h', label: '20h' },
    ],
  },
];

export const BLOCK_LABELS: Record<1 | 2 | 3, string> = {
  1: 'Bloco 01 · Quem é você',
  2: 'Bloco 02 · Dor e mercado',
  3: 'Bloco 03 · Comprometimento',
};
