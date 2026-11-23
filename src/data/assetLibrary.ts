export interface VectorAssetPreset {
  id: string;
  name: string;
  category: 'Ideias & Negócios' | 'Tech & 3D' | 'Pessoas & Ação' | 'Diagramas & Setas' | 'Engenharia';
  defaultStrokeColor: string;
  defaultFillColor: string;
  svg: string;
}

export const VECTOR_ASSETS: VectorAssetPreset[] = [
  {
    id: 'lightbulb',
    name: 'Ideia / Lâmpada',
    category: 'Ideias & Negócios',
    defaultStrokeColor: '#18181b',
    defaultFillColor: '#fef08a',
    svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <path d="M60 18 C38 18 24 34 24 53 C24 67 34 77 42 84 L44 94 L76 94 L78 84 C86 77 96 67 96 53 C96 34 82 18 60 18 Z" fill="#fef08a" stroke="#18181b" stroke-width="3"/>
      <path d="M46 98 L74 98 M49 105 L71 105 M54 111 L66 111" stroke="#18181b" stroke-width="3"/>
      <path d="M52 84 L52 63 L45 55 M68 84 L68 63 L75 55 M52 63 C56 67 64 67 68 63" stroke="#d97706" stroke-width="2.5"/>
      <path d="M60 4 L60 12 M18 22 L25 28 M102 22 L95 28 M6 53 L15 53 M114 53 L105 53" stroke="#ea580c" stroke-width="3"/>
    </svg>`,
  },
  {
    id: 'rocket',
    name: 'Foguete Lançamento',
    category: 'Ideias & Negócios',
    defaultStrokeColor: '#18181b',
    defaultFillColor: '#fed7aa',
    svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <path d="M60 10 C78 24 84 52 78 82 L42 82 C36 52 42 24 60 10 Z" fill="#fed7aa" stroke="#18181b" stroke-width="3"/>
      <circle cx="60" cy="46" r="11" fill="#bae6fd" stroke="#18181b" stroke-width="3"/>
      <path d="M42 62 L24 78 L34 88 L43 81 M78 62 L96 78 L86 88 L77 81" fill="#fca5a5" stroke="#18181b" stroke-width="3"/>
      <path d="M49 84 L71 84 L67 92 L53 92 Z" stroke="#18181b" stroke-width="2.5"/>
      <path d="M51 96 C48 106 56 112 60 116 C64 112 72 106 69 96" stroke="#ea580c" stroke-width="3"/>
    </svg>`,
  },
  {
    id: 'growth-chart',
    name: 'Gráfico Crescimento',
    category: 'Ideias & Negócios',
    defaultStrokeColor: '#18181b',
    defaultFillColor: '#bbf7d0',
    svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 18 L16 102 L106 102" stroke="#18181b" stroke-width="3.5"/>
      <rect x="26" y="76" width="14" height="24" fill="#e2e8f0" stroke="#18181b" stroke-width="2.5"/>
      <rect x="48" y="60" width="14" height="40" fill="#bae6fd" stroke="#18181b" stroke-width="2.5"/>
      <rect x="70" y="42" width="14" height="58" fill="#86efac" stroke="#18181b" stroke-width="2.5"/>
      <path d="M24 68 L48 48 L68 54 L96 20 M82 20 L97 19 L97 34" stroke="#0f766e" stroke-width="3.5"/>
    </svg>`,
  },
  {
    id: 'target',
    name: 'Alvo & Precisão',
    category: 'Ideias & Negócios',
    defaultStrokeColor: '#18181b',
    defaultFillColor: '#fecaca',
    svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <circle cx="56" cy="64" r="42" fill="#fee2e2" stroke="#18181b" stroke-width="3"/>
      <circle cx="56" cy="64" r="28" fill="#ffffff" stroke="#18181b" stroke-width="2.8"/>
      <circle cx="56" cy="64" r="13" fill="#ef4444" stroke="#18181b" stroke-width="2.8"/>
      <path d="M58 62 L106 14 M92 14 L106 14 L106 28 M84 22 L90 12 M98 36 L108 30" stroke="#ea580c" stroke-width="3"/>
    </svg>`,
  },
  {
    id: 'clock',
    name: 'Relógio / Tempo',
    category: 'Ideias & Negócios',
    defaultStrokeColor: '#18181b',
    defaultFillColor: '#e0f2fe',
    svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="62" r="42" fill="#e0f2fe" stroke="#18181b" stroke-width="3"/>
      <path d="M50 12 L70 12 M60 12 L60 20 M90 26 L98 18" stroke="#18181b" stroke-width="3"/>
      <path d="M60 28 L60 33 M60 91 L60 96 M26 62 L31 62 M89 62 L94 62" stroke="#64748b" stroke-width="2.5"/>
      <path d="M60 62 L60 36 M60 62 L80 72" stroke="#ea580c" stroke-width="3.5"/>
      <circle cx="60" cy="62" r="4" fill="#18181b" stroke="#18181b" stroke-width="2"/>
    </svg>`,
  },
  {
    id: 'trophy',
    name: 'Troféu Resultado',
    category: 'Ideias & Negócios',
    defaultStrokeColor: '#18181b',
    defaultFillColor: '#fde047',
    svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <path d="M34 22 L86 22 L82 54 C80 70 70 78 60 78 C50 78 40 70 38 54 Z" fill="#fde047" stroke="#18181b" stroke-width="3"/>
      <path d="M35 28 L18 28 C16 44 24 54 37 54 M85 28 L102 28 C104 44 96 54 83 54" stroke="#18181b" stroke-width="3"/>
      <path d="M60 78 L60 96 M40 96 L80 96 L84 106 L36 106 Z" fill="#cbd5e1" stroke="#18181b" stroke-width="3"/>
    </svg>`,
  },
  {
    id: 'smartphone',
    name: 'Celular / App Mobile',
    category: 'Tech & 3D',
    defaultStrokeColor: '#18181b',
    defaultFillColor: '#dbeafe',
    svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <rect x="34" y="12" width="52" height="96" rx="8" fill="#f1f5f9" stroke="#18181b" stroke-width="3"/>
      <rect x="40" y="24" width="40" height="68" fill="#dbeafe" stroke="#18181b" stroke-width="2"/>
      <path d="M52 18 L68 18" stroke="#18181b" stroke-width="2.5"/>
      <circle cx="60" cy="100" r="3.5" stroke="#18181b" stroke-width="2"/>
      <path d="M46 44 L74 44 M46 56 L66 56 M46 68 L74 68" stroke="#0f766e" stroke-width="2.8"/>
    </svg>`,
  },
  {
    id: 'cube-3d',
    name: 'Cubo 3D Isométrico',
    category: 'Tech & 3D',
    defaultStrokeColor: '#18181b',
    defaultFillColor: '#fed7aa',
    svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <polygon points="60,14 102,38 60,62 18,38" fill="#ffedd5" stroke="#18181b" stroke-width="3"/>
      <polygon points="18,38 60,62 60,106 18,82" fill="#fed7aa" stroke="#18181b" stroke-width="3"/>
      <polygon points="102,38 102,82 60,106 60,62" fill="#fdba74" stroke="#18181b" stroke-width="3"/>
      <path d="M60 14 L60 62 M18 82 L60 58 L102 82" stroke="#9a3412" stroke-width="1.8"/>
    </svg>`,
  },
  {
    id: 'blockchain-nodes',
    name: 'Blocos & Rede Blockchain',
    category: 'Tech & 3D',
    defaultStrokeColor: '#18181b',
    defaultFillColor: '#ccfbf1',
    svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <rect x="44" y="14" width="32" height="24" rx="4" fill="#ccfbf1" stroke="#18181b" stroke-width="2.8"/>
      <rect x="14" y="76" width="32" height="24" rx="4" fill="#e0f2fe" stroke="#18181b" stroke-width="2.8"/>
      <rect x="74" y="76" width="32" height="24" rx="4" fill="#fef3c7" stroke="#18181b" stroke-width="2.8"/>
      <path d="M52 38 L34 76 M68 38 L86 76 M46 88 L74 88" stroke="#0f766e" stroke-width="3"/>
      <circle cx="60" cy="26" r="4" fill="#0f766e" stroke="#0f766e" stroke-width="2"/>
      <circle cx="30" cy="88" r="4" fill="#0284c7" stroke="#0284c7" stroke-width="2"/>
      <circle cx="90" cy="88" r="4" fill="#d97706" stroke="#d97706" stroke-width="2"/>
    </svg>`,
  },
  {
    id: 'gpu-chip',
    name: 'Processador / GPU',
    category: 'Tech & 3D',
    defaultStrokeColor: '#18181b',
    defaultFillColor: '#e2e8f0',
    svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <rect x="30" y="30" width="60" height="60" rx="6" fill="#e2e8f0" stroke="#18181b" stroke-width="3"/>
      <rect x="44" y="44" width="32" height="32" rx="3" fill="#fed7aa" stroke="#ea580c" stroke-width="2.5"/>
      <path d="M44 16 L44 30 M60 16 L60 30 M76 16 L76 30 M44 90 L44 104 M60 90 L60 104 M76 90 L76 104" stroke="#18181b" stroke-width="3"/>
      <path d="M16 44 L30 44 M16 60 L30 60 M16 76 L30 76 M90 44 L104 44 M90 60 L104 60 M90 76 L104 76" stroke="#18181b" stroke-width="3"/>
    </svg>`,
  },
  {
    id: 'cloud-sync',
    name: 'Nuvem & Dados',
    category: 'Tech & 3D',
    defaultStrokeColor: '#18181b',
    defaultFillColor: '#e0f2fe',
    svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 82 L88 82 C100 82 106 73 106 63 C106 53 98 46 89 45 C86 30 73 20 58 20 C42 20 29 32 28 47 C19 49 14 56 14 65 C14 75 22 82 32 82 Z" fill="#e0f2fe" stroke="#18181b" stroke-width="3"/>
      <path d="M48 64 L60 52 L72 64 M60 52 L60 96 M50 88 L60 98 L70 88" stroke="#0f766e" stroke-width="3"/>
    </svg>`,
  },
  {
    id: 'gears',
    name: 'Engrenagens / Sistema',
    category: 'Tech & 3D',
    defaultStrokeColor: '#18181b',
    defaultFillColor: '#e2e8f0',
    svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <circle cx="46" cy="50" r="22" fill="#e2e8f0" stroke="#18181b" stroke-width="3"/>
      <circle cx="46" cy="50" r="9" fill="#ffffff" stroke="#18181b" stroke-width="2.5"/>
      <path d="M46 20 L46 28 M46 72 L46 80 M16 50 L24 50 M68 50 L76 50 M25 29 L31 35 M61 65 L67 71 M67 29 L61 35 M31 65 L25 71" stroke="#18181b" stroke-width="4"/>
      <circle cx="84" cy="80" r="16" fill="#fed7aa" stroke="#18181b" stroke-width="3"/>
      <circle cx="84" cy="80" r="6" fill="#ffffff" stroke="#18181b" stroke-width="2.5"/>
      <path d="M84 58 L84 64 M84 96 L84 102 M62 80 L68 80 M100 80 L106 80" stroke="#18181b" stroke-width="3.5"/>
    </svg>`,
  },
  {
    id: 'person-thinking',
    name: 'Pessoa Pensando',
    category: 'Pessoas & Ação',
    defaultStrokeColor: '#18181b',
    defaultFillColor: '#fde68a',
    svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <circle cx="46" cy="36" r="16" fill="#fde68a" stroke="#18181b" stroke-width="3"/>
      <path d="M22 104 C22 78 32 62 46 62 C60 62 70 78 70 104" fill="#bfdbfe" stroke="#18181b" stroke-width="3"/>
      <path d="M58 66 L68 52 L54 46" stroke="#18181b" stroke-width="3"/>
      <circle cx="78" cy="36" r="4" stroke="#0f766e" stroke-width="2.5"/>
      <circle cx="90" cy="24" r="6" stroke="#0f766e" stroke-width="2.5"/>
      <path d="M98 14 C108 14 112 24 104 30 C98 34 90 28 96 18 Z" fill="#fef3c7" stroke="#0f766e" stroke-width="2.5"/>
    </svg>`,
  },
  {
    id: 'presenter',
    name: 'Apresentador / Quadro',
    category: 'Pessoas & Ação',
    defaultStrokeColor: '#18181b',
    defaultFillColor: '#bbf7d0',
    svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <rect x="46" y="18" width="60" height="44" rx="4" fill="#f8fafc" stroke="#18181b" stroke-width="3"/>
      <path d="M56 46 L68 34 L78 40 L94 26" stroke="#0f766e" stroke-width="3"/>
      <circle cx="28" cy="34" r="12" fill="#fde68a" stroke="#18181b" stroke-width="3"/>
      <path d="M12 104 L16 62 C16 54 22 50 28 50 C34 50 40 54 40 62 L44 104" fill="#fed7aa" stroke="#18181b" stroke-width="3"/>
      <path d="M36 58 L62 44" stroke="#18181b" stroke-width="3"/>
    </svg>`,
  },
  {
    id: 'team-network',
    name: 'Equipe Conectada',
    category: 'Pessoas & Ação',
    defaultStrokeColor: '#18181b',
    defaultFillColor: '#dbeafe',
    svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="30" r="12" fill="#fde68a" stroke="#18181b" stroke-width="2.8"/>
      <path d="M42 60 C42 48 50 44 60 44 C70 44 78 48 78 60" fill="#dbeafe" stroke="#18181b" stroke-width="2.8"/>
      <circle cx="28" cy="72" r="10" fill="#fde68a" stroke="#18181b" stroke-width="2.8"/>
      <path d="M12 100 C12 90 18 86 28 86 C38 86 44 90 44 100" fill="#bbf7d0" stroke="#18181b" stroke-width="2.8"/>
      <circle cx="92" cy="72" r="10" fill="#fde68a" stroke="#18181b" stroke-width="2.8"/>
      <path d="M76 100 C76 90 82 86 92 86 C102 86 108 90 108 100" fill="#fed7aa" stroke="#18181b" stroke-width="2.8"/>
      <path d="M46 58 L34 64 M74 58 L86 64 M44 88 L76 88" stroke="#0f766e" stroke-width="2.5"/>
    </svg>`,
  },
  {
    id: 'house-blueprint',
    name: 'Casa / Projeto Civil',
    category: 'Engenharia',
    defaultStrokeColor: '#18181b',
    defaultFillColor: '#ffedd5',
    svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 56 L60 18 L106 56" stroke="#ea580c" stroke-width="3.5"/>
      <path d="M24 48 L24 102 L96 102 L96 48" fill="#ffedd5" stroke="#18181b" stroke-width="3"/>
      <rect x="48" y="66" width="24" height="36" fill="#fed7aa" stroke="#18181b" stroke-width="2.5"/>
      <rect x="74" y="62" width="14" height="14" fill="#bae6fd" stroke="#18181b" stroke-width="2"/>
      <path d="M10 110 L110 110 M10 106 L10 114 M110 106 L110 114" stroke="#0f766e" stroke-width="2"/>
    </svg>`,
  },
  {
    id: 'bridge-structure',
    name: 'Ponte / Treliça Estrutural',
    category: 'Engenharia',
    defaultStrokeColor: '#18181b',
    defaultFillColor: '#e2e8f0',
    svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 76 L112 76" stroke="#18181b" stroke-width="4"/>
      <path d="M14 76 L32 36 L88 36 L106 76" stroke="#18181b" stroke-width="3"/>
      <path d="M32 36 L44 76 L60 36 L76 76 L88 36" stroke="#ea580c" stroke-width="2.5"/>
      <path d="M20 76 L20 98 M100 76 L100 98" stroke="#18181b" stroke-width="5"/>
    </svg>`,
  },
  {
    id: 'arrow-curved',
    name: 'Seta Curva Fluxo',
    category: 'Diagramas & Setas',
    defaultStrokeColor: '#ea580c',
    defaultFillColor: '#fed7aa',
    svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 86 C22 40 58 24 98 42" stroke="#ea580c" stroke-width="4"/>
      <path d="M82 26 L102 44 L78 54" stroke="#ea580c" stroke-width="4"/>
    </svg>`,
  },
  {
    id: 'check-badge',
    name: 'Checklist Aprovado',
    category: 'Diagramas & Setas',
    defaultStrokeColor: '#0f766e',
    defaultFillColor: '#ccfbf1',
    svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="42" fill="#ccfbf1" stroke="#0f766e" stroke-width="3.5"/>
      <path d="M38 62 L53 77 L84 44" stroke="#0f766e" stroke-width="5"/>
    </svg>`,
  },
  {
    id: 'speech-bubble',
    name: 'Balão de Fala',
    category: 'Diagramas & Setas',
    defaultStrokeColor: '#18181b',
    defaultFillColor: '#fef9c3',
    svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 28 C18 20 24 16 32 16 L88 16 C96 16 102 20 102 28 L102 68 C102 76 96 80 88 80 L50 80 L30 98 L34 80 L32 80 C24 80 18 76 18 68 Z" fill="#fef9c3" stroke="#18181b" stroke-width="3"/>
      <path d="M36 40 L84 40 M36 56 L72 56" stroke="#64748b" stroke-width="3"/>
    </svg>`,
  },
  {
    id: 'highlight-underline',
    name: 'Sublinhado / Destaque',
    category: 'Diagramas & Setas',
    defaultStrokeColor: '#ea580c',
    defaultFillColor: '#fed7aa',
    svg: `<svg viewBox="0 0 120 60" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 34 C38 26 78 24 110 30 M22 44 C48 39 76 38 98 42" stroke="#ea580c" stroke-width="4.5"/>
    </svg>`,
  },
];
