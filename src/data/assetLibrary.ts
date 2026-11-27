export interface VectorAssetPreset {
  id: string;
  name: string;
  category:
    | 'Ideias & Negócios'
    | 'Marketing & Educação'
    | 'Tech & 3D'
    | 'Pessoas & Ação'
    | 'Diagramas & Setas'
    | 'Engenharia';
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
  // --- Ideias & Negócios (Premium Pack) ---
  {
    id: 'money-bag',
    name: 'Saco de Dinheiro / Lucro',
    category: 'Ideias & Negócios',
    defaultStrokeColor: '#18181b',
    defaultFillColor: '#bbf7d0',
    svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <path d="M44 20 L76 20 L68 34 L52 34 Z" fill="#fde68a" stroke="#18181b" stroke-width="3"/>
      <path d="M48 34 C28 46 20 68 24 88 C28 102 44 108 60 108 C76 108 92 102 96 88 C100 68 92 46 72 34 Z" fill="#bbf7d0" stroke="#18181b" stroke-width="3"/>
      <path d="M45 34 L75 34" stroke="#ea580c" stroke-width="4"/>
      <path d="M60 50 L60 92 M69 58 C69 53 51 53 51 60 C51 67 69 68 69 76 C69 84 51 84 51 78" stroke="#0f766e" stroke-width="3.5"/>
    </svg>`,
  },
  {
    id: 'handshake',
    name: 'Aperto de Mão / Parceria',
    category: 'Ideias & Negócios',
    defaultStrokeColor: '#18181b',
    defaultFillColor: '#fed7aa',
    svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 46 L28 46 L34 78 L8 78 Z" fill="#bfdbfe" stroke="#18181b" stroke-width="3"/>
      <path d="M112 46 L92 46 L86 78 L112 78 Z" fill="#bbf7d0" stroke="#18181b" stroke-width="3"/>
      <path d="M28 50 L50 42 L68 50 L92 48 L88 76 L72 86 L46 84 L32 74 Z" fill="#fed7aa" stroke="#18181b" stroke-width="3"/>
      <path d="M46 60 L64 74 M54 56 L72 70 M62 52 L78 65" stroke="#18181b" stroke-width="2.5"/>
      <path d="M60 20 L60 32 M44 24 L50 34 M76 24 L70 34" stroke="#ea580c" stroke-width="2.8"/>
    </svg>`,
  },
  {
    id: 'funnel-sales',
    name: 'Funil de Vendas',
    category: 'Ideias & Negócios',
    defaultStrokeColor: '#18181b',
    defaultFillColor: '#bae6fd',
    svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <polygon points="16,22 104,22 86,46 34,46" fill="#dbeafe" stroke="#18181b" stroke-width="3"/>
      <polygon points="34,46 86,46 72,70 48,70" fill="#bae6fd" stroke="#18181b" stroke-width="3"/>
      <polygon points="48,70 72,70 68,94 52,94" fill="#86efac" stroke="#18181b" stroke-width="3"/>
      <circle cx="60" cy="105" r="7" fill="#fde047" stroke="#18181b" stroke-width="2.5"/>
      <path d="M36 12 L42 18 M60 8 L60 18 M84 12 L78 18" stroke="#ea580c" stroke-width="2.8"/>
    </svg>`,
  },
  {
    id: 'calendar-plan',
    name: 'Agenda / Cronograma',
    category: 'Ideias & Negócios',
    defaultStrokeColor: '#18181b',
    defaultFillColor: '#fef3c7',
    svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <rect x="18" y="24" width="84" height="80" rx="8" fill="#ffffff" stroke="#18181b" stroke-width="3"/>
      <rect x="18" y="24" width="84" height="22" rx="6" fill="#fed7aa" stroke="#18181b" stroke-width="3"/>
      <path d="M38 14 L38 30 M82 14 L82 30" stroke="#18181b" stroke-width="4"/>
      <path d="M32 60 L44 60 M54 60 L66 60 M76 60 L88 60 M32 76 L44 76 M54 76 L66 76 M32 90 L44 90" stroke="#64748b" stroke-width="3"/>
      <path d="M72 78 L80 86 L94 70" stroke="#0f766e" stroke-width="3.5"/>
    </svg>`,
  },
  {
    id: 'crown-vip',
    name: 'Coroa / Liderança VIP',
    category: 'Ideias & Negócios',
    defaultStrokeColor: '#18181b',
    defaultFillColor: '#fde047',
    svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 84 L22 36 L44 58 L60 28 L76 58 L98 36 L104 84 Z" fill="#fde047" stroke="#18181b" stroke-width="3"/>
      <rect x="16" y="84" width="88" height="14" rx="4" fill="#fbbf24" stroke="#18181b" stroke-width="3"/>
      <circle cx="22" cy="34" r="5" fill="#ea580c" stroke="#18181b" stroke-width="2"/>
      <circle cx="60" cy="25" r="6" fill="#ea580c" stroke="#18181b" stroke-width="2"/>
      <circle cx="98" cy="34" r="5" fill="#ea580c" stroke="#18181b" stroke-width="2"/>
      <circle cx="60" cy="70" r="6" fill="#ef4444" stroke="#18181b" stroke-width="2"/>
    </svg>`,
  },
  {
    id: 'wallet-card',
    name: 'Cartão & Pagamento',
    category: 'Ideias & Negócios',
    defaultStrokeColor: '#18181b',
    defaultFillColor: '#ccfbf1',
    svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <rect x="14" y="28" width="92" height="62" rx="8" fill="#ccfbf1" stroke="#18181b" stroke-width="3"/>
      <rect x="14" y="42" width="92" height="12" fill="#18181b" stroke="#18181b" stroke-width="2"/>
      <rect x="24" y="62" width="20" height="14" rx="2" fill="#fde047" stroke="#18181b" stroke-width="2"/>
      <path d="M54 68 L92 68 M54 78 L78 78" stroke="#0f766e" stroke-width="3"/>
    </svg>`,
  },
  // --- Marketing & Educação ---
  {
    id: 'megaphone',
    name: 'Megafone / Campanha',
    category: 'Marketing & Educação',
    defaultStrokeColor: '#18181b',
    defaultFillColor: '#fed7aa',
    svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <path d="M22 48 L44 48 L86 24 L86 86 L44 64 L22 64 Z" fill="#fed7aa" stroke="#18181b" stroke-width="3"/>
      <path d="M32 64 L40 94 L52 92 L46 64" fill="#e2e8f0" stroke="#18181b" stroke-width="3"/>
      <path d="M44 48 L44 64" stroke="#18181b" stroke-width="3"/>
      <path d="M96 42 L110 34 M98 55 L114 55 M96 68 L110 76" stroke="#ea580c" stroke-width="3.5"/>
    </svg>`,
  },
  {
    id: 'video-play',
    name: 'Vídeo / Player YouTube',
    category: 'Marketing & Educação',
    defaultStrokeColor: '#18181b',
    defaultFillColor: '#fecaca',
    svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <rect x="12" y="24" width="96" height="64" rx="14" fill="#fee2e2" stroke="#18181b" stroke-width="3"/>
      <polygon points="50,40 50,72 78,56" fill="#ef4444" stroke="#18181b" stroke-width="3"/>
      <path d="M18 100 L102 100" stroke="#94a3b8" stroke-width="4"/>
      <path d="M18 100 L56 100" stroke="#ea580c" stroke-width="4"/>
      <circle cx="56" cy="100" r="5" fill="#ea580c" stroke="#18181b" stroke-width="2"/>
    </svg>`,
  },
  {
    id: 'book-open',
    name: 'Livro Aberto / Curso',
    category: 'Marketing & Educação',
    defaultStrokeColor: '#18181b',
    defaultFillColor: '#fef9c3',
    svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 30 C32 24 48 28 60 36 L60 94 C48 86 32 84 14 88 Z" fill="#fef9c3" stroke="#18181b" stroke-width="3"/>
      <path d="M106 30 C88 24 72 28 60 36 L60 94 C72 86 88 84 106 88 Z" fill="#fffbeb" stroke="#18181b" stroke-width="3"/>
      <path d="M24 46 L50 48 M24 58 L50 60 M24 70 L46 72" stroke="#64748b" stroke-width="2.5"/>
      <path d="M70 48 L96 46 M70 60 L96 58 M70 72 L92 70" stroke="#64748b" stroke-width="2.5"/>
    </svg>`,
  },
  {
    id: 'graduation-cap',
    name: 'Formatura / Ensino',
    category: 'Marketing & Educação',
    defaultStrokeColor: '#18181b',
    defaultFillColor: '#dbeafe',
    svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <polygon points="60,22 110,46 60,70 10,46" fill="#dbeafe" stroke="#18181b" stroke-width="3"/>
      <path d="M30 56 L30 82 C44 92 76 92 90 82 L90 56" fill="#bfdbfe" stroke="#18181b" stroke-width="3"/>
      <path d="M102 50 L102 82 M96 86 L102 82 L108 86" stroke="#ea580c" stroke-width="3"/>
    </svg>`,
  },
  {
    id: 'magnet-leads',
    name: 'Ímã de Clientes / Leads',
    category: 'Marketing & Educação',
    defaultStrokeColor: '#18181b',
    defaultFillColor: '#fca5a5',
    svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <path d="M26 24 L26 66 C26 88 42 102 60 102 C78 102 94 88 94 66 L94 24 L74 24 L74 66 C74 76 68 82 60 82 C52 82 46 76 46 66 L46 24 Z" fill="#fca5a5" stroke="#18181b" stroke-width="3"/>
      <rect x="26" y="24" width="20" height="16" fill="#e2e8f0" stroke="#18181b" stroke-width="3"/>
      <rect x="74" y="24" width="20" height="16" fill="#e2e8f0" stroke="#18181b" stroke-width="3"/>
      <path d="M34 10 L36 17 M60 8 L60 16 M86 10 L84 17" stroke="#ea580c" stroke-width="3"/>
    </svg>`,
  },
  {
    id: 'star-rating',
    name: 'Estrela / Avaliação 5★',
    category: 'Marketing & Educação',
    defaultStrokeColor: '#18181b',
    defaultFillColor: '#fde047',
    svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <polygon points="60,14 73,42 104,46 81,67 87,98 60,83 33,98 39,67 16,46 47,42" fill="#fde047" stroke="#18181b" stroke-width="3"/>
      <path d="M60 32 L66 48 L82 50" stroke="#ea580c" stroke-width="2.5"/>
    </svg>`,
  },
  // --- Tech & 3D (Premium Pack) ---
  {
    id: 'ai-brain',
    name: 'IA / Cérebro Neural',
    category: 'Tech & 3D',
    defaultStrokeColor: '#18181b',
    defaultFillColor: '#e9d5ff',
    svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <path d="M58 24 C42 22 30 32 30 46 C20 50 18 66 28 74 C28 88 42 96 58 94 Z" fill="#f3e8ff" stroke="#18181b" stroke-width="3"/>
      <path d="M62 24 C78 22 90 32 90 46 C100 50 102 66 92 74 C92 88 78 96 62 94 Z" fill="#dbeafe" stroke="#18181b" stroke-width="3"/>
      <circle cx="42" cy="46" r="4" fill="#7c3aed" stroke="#7c3aed" stroke-width="2"/>
      <circle cx="44" cy="70" r="4" fill="#7c3aed" stroke="#7c3aed" stroke-width="2"/>
      <circle cx="78" cy="46" r="4" fill="#0284c7" stroke="#0284c7" stroke-width="2"/>
      <circle cx="76" cy="70" r="4" fill="#0284c7" stroke="#0284c7" stroke-width="2"/>
      <path d="M42 46 L78 46 M44 70 L76 70 M42 46 L76 70 M78 46 L44 70" stroke="#6366f1" stroke-width="2"/>
    </svg>`,
  },
  {
    id: 'laptop-code',
    name: 'Notebook / Programação',
    category: 'Tech & 3D',
    defaultStrokeColor: '#18181b',
    defaultFillColor: '#e0f2fe',
    svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="22" width="80" height="54" rx="5" fill="#e0f2fe" stroke="#18181b" stroke-width="3"/>
      <path d="M10 82 L110 82 L102 94 L18 94 Z" fill="#cbd5e1" stroke="#18181b" stroke-width="3"/>
      <path d="M46 40 L34 49 L46 58 M74 40 L86 49 L74 58 M64 36 L56 62" stroke="#0f766e" stroke-width="3.2"/>
    </svg>`,
  },
  {
    id: 'shield-security',
    name: 'Escudo / Segurança Digital',
    category: 'Tech & 3D',
    defaultStrokeColor: '#18181b',
    defaultFillColor: '#bbf7d0',
    svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <path d="M60 14 L98 28 L94 64 C90 86 76 98 60 106 C44 98 30 86 26 64 L22 28 Z" fill="#bbf7d0" stroke="#18181b" stroke-width="3"/>
      <rect x="46" y="54" width="28" height="24" rx="4" fill="#ffffff" stroke="#18181b" stroke-width="2.8"/>
      <path d="M52 54 L52 44 C52 38 68 38 68 44 L68 54" stroke="#18181b" stroke-width="2.8"/>
      <circle cx="60" cy="66" r="3" fill="#0f766e" stroke="#0f766e" stroke-width="2"/>
    </svg>`,
  },
  {
    id: 'robot-assistant',
    name: 'Robô / Automação',
    category: 'Tech & 3D',
    defaultStrokeColor: '#18181b',
    defaultFillColor: '#e2e8f0',
    svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <path d="M60 14 L60 28" stroke="#18181b" stroke-width="3"/>
      <circle cx="60" cy="12" r="5" fill="#ea580c" stroke="#18181b" stroke-width="2.5"/>
      <rect x="26" y="28" width="68" height="48" rx="12" fill="#e2e8f0" stroke="#18181b" stroke-width="3"/>
      <circle cx="46" cy="48" r="7" fill="#38bdf8" stroke="#18181b" stroke-width="2.5"/>
      <circle cx="74" cy="48" r="7" fill="#38bdf8" stroke="#18181b" stroke-width="2.5"/>
      <path d="M46 64 L74 64" stroke="#18181b" stroke-width="3"/>
      <path d="M16 44 L26 44 M94 44 L104 44 M38 76 L34 104 L86 104 L82 76" fill="#cbd5e1" stroke="#18181b" stroke-width="3"/>
    </svg>`,
  },
  // --- Pessoas & Ação (Premium Pack) ---
  {
    id: 'person-celebrating',
    name: 'Pessoa Comemorando',
    category: 'Pessoas & Ação',
    defaultStrokeColor: '#18181b',
    defaultFillColor: '#fef08a',
    svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="28" r="14" fill="#fde68a" stroke="#18181b" stroke-width="3"/>
      <path d="M44 50 L76 50 L72 86 L48 86 Z" fill="#bbf7d0" stroke="#18181b" stroke-width="3"/>
      <path d="M44 54 L20 26 M76 54 L100 26" stroke="#18181b" stroke-width="3.5"/>
      <path d="M52 86 L44 110 M68 86 L76 110" stroke="#18181b" stroke-width="3.5"/>
      <path d="M28 14 L34 18 M92 14 L86 18 M60 4 L60 10" stroke="#ea580c" stroke-width="3"/>
    </svg>`,
  },
  {
    id: 'person-working',
    name: 'Trabalhando no PC',
    category: 'Pessoas & Ação',
    defaultStrokeColor: '#18181b',
    defaultFillColor: '#dbeafe',
    svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <circle cx="38" cy="30" r="13" fill="#fde68a" stroke="#18181b" stroke-width="3"/>
      <path d="M18 82 C18 60 26 48 38 48 C50 48 56 60 56 82" fill="#dbeafe" stroke="#18181b" stroke-width="3"/>
      <path d="M42 64 L66 72" stroke="#18181b" stroke-width="3"/>
      <polygon points="72,44 102,44 96,76 66,76" fill="#e2e8f0" stroke="#18181b" stroke-width="3"/>
      <path d="M10 82 L110 82 M20 82 L20 106 M100 82 L100 106" stroke="#18181b" stroke-width="3.5"/>
    </svg>`,
  },
  {
    id: 'customer-chat',
    name: 'Atendimento / Conversa',
    category: 'Pessoas & Ação',
    defaultStrokeColor: '#18181b',
    defaultFillColor: '#ccfbf1',
    svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <circle cx="30" cy="48" r="12" fill="#fde68a" stroke="#18181b" stroke-width="3"/>
      <path d="M14 96 C14 74 20 66 30 66 C40 66 46 74 46 96" fill="#bfdbfe" stroke="#18181b" stroke-width="3"/>
      <circle cx="90" cy="48" r="12" fill="#fde68a" stroke="#18181b" stroke-width="3"/>
      <path d="M74 96 C74 74 80 66 90 66 C100 66 106 74 106 96" fill="#fed7aa" stroke="#18181b" stroke-width="3"/>
      <rect x="42" y="14" width="36" height="24" rx="6" fill="#ccfbf1" stroke="#0f766e" stroke-width="2.8"/>
      <path d="M50 24 L70 24 M50 31 L64 31" stroke="#0f766e" stroke-width="2.5"/>
    </svg>`,
  },
  {
    id: 'runner-fast',
    name: 'Velocidade / Agilidade',
    category: 'Pessoas & Ação',
    defaultStrokeColor: '#18181b',
    defaultFillColor: '#fed7aa',
    svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <circle cx="76" cy="24" r="11" fill="#fde68a" stroke="#18181b" stroke-width="3"/>
      <path d="M68 38 L52 66 L76 76 L68 104" stroke="#18181b" stroke-width="4"/>
      <path d="M52 66 L30 92 M62 46 L94 46 M60 48 L38 56" stroke="#18181b" stroke-width="3.5"/>
      <path d="M10 38 L34 38 M6 54 L26 54 M14 70 L32 70" stroke="#ea580c" stroke-width="3"/>
    </svg>`,
  },
  // --- Engenharia (Premium Pack) ---
  {
    id: 'crane-construction',
    name: 'Guindaste / Obra Civil',
    category: 'Engenharia',
    defaultStrokeColor: '#18181b',
    defaultFillColor: '#fde047',
    svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <path d="M30 106 L30 24 L42 24 L42 106" fill="#fde047" stroke="#18181b" stroke-width="3"/>
      <path d="M12 34 L106 34 L106 24 L12 24 Z" fill="#facc15" stroke="#18181b" stroke-width="3"/>
      <path d="M36 12 L102 24 M36 12 L16 24" stroke="#18181b" stroke-width="2.5"/>
      <path d="M88 34 L88 68 M80 68 L96 68 L96 86 L80 86 Z" fill="#fed7aa" stroke="#ea580c" stroke-width="3"/>
      <path d="M14 106 L64 106" stroke="#18181b" stroke-width="4"/>
    </svg>`,
  },
  {
    id: 'compass-drafting',
    name: 'Compasso & Esquadro',
    category: 'Engenharia',
    defaultStrokeColor: '#18181b',
    defaultFillColor: '#e0f2fe',
    svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <polygon points="18,98 18,28 88,98" fill="#e0f2fe" stroke="#18181b" stroke-width="3"/>
      <polygon points="30,86 30,54 62,86" fill="#ffffff" stroke="#18181b" stroke-width="2.2"/>
      <circle cx="72" cy="24" r="7" fill="#fed7aa" stroke="#18181b" stroke-width="2.8"/>
      <path d="M68 30 L48 92 M76 30 L98 92 M54 66 C66 72 80 72 92 66" stroke="#ea580c" stroke-width="3"/>
    </svg>`,
  },
  {
    id: 'building-tower',
    name: 'Edifício / Arquitetura',
    category: 'Engenharia',
    defaultStrokeColor: '#18181b',
    defaultFillColor: '#dbeafe',
    svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <rect x="24" y="20" width="46" height="84" fill="#dbeafe" stroke="#18181b" stroke-width="3"/>
      <rect x="70" y="46" width="28" height="58" fill="#e2e8f0" stroke="#18181b" stroke-width="3"/>
      <path d="M34 32 L42 32 M52 32 L60 32 M34 46 L42 46 M52 46 L60 46 M34 60 L42 60 M52 60 L60 60 M34 74 L42 74 M52 74 L60 74" stroke="#0284c7" stroke-width="3"/>
      <path d="M78 58 L90 58 M78 72 L90 72 M78 86 L90 86 M10 104 L110 104" stroke="#18181b" stroke-width="3"/>
    </svg>`,
  },
  {
    id: 'solar-panel',
    name: 'Energia Solar / Sustentável',
    category: 'Engenharia',
    defaultStrokeColor: '#18181b',
    defaultFillColor: '#bae6fd',
    svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <circle cx="92" cy="26" r="12" fill="#fde047" stroke="#ea580c" stroke-width="2.8"/>
      <polygon points="24,48 90,48 102,88 12,88" fill="#bae6fd" stroke="#18181b" stroke-width="3"/>
      <path d="M46 48 L42 88 M68 48 L72 88 M18 68 L96 68" stroke="#0284c7" stroke-width="2.4"/>
      <path d="M57 88 L57 104 M38 104 L76 104" stroke="#18181b" stroke-width="3.5"/>
    </svg>`,
  },
  // --- Diagramas & Setas (Premium Pack) ---
  {
    id: 'mindmap-diagram',
    name: 'Mapa Mental / Conexões',
    category: 'Diagramas & Setas',
    defaultStrokeColor: '#18181b',
    defaultFillColor: '#fef3c7',
    svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="16" fill="#fef08a" stroke="#18181b" stroke-width="3"/>
      <circle cx="22" cy="26" r="11" fill="#dbeafe" stroke="#18181b" stroke-width="2.8"/>
      <circle cx="98" cy="26" r="11" fill="#bbf7d0" stroke="#18181b" stroke-width="2.8"/>
      <circle cx="22" cy="94" r="11" fill="#fed7aa" stroke="#18181b" stroke-width="2.8"/>
      <circle cx="98" cy="94" r="11" fill="#f3e8ff" stroke="#18181b" stroke-width="2.8"/>
      <path d="M48 48 L30 34 M72 48 L90 34 M48 72 L30 86 M72 72 L90 86" stroke="#0f766e" stroke-width="2.8"/>
    </svg>`,
  },
  {
    id: 'cycle-loop',
    name: 'Ciclo Contínuo (3 Passos)',
    category: 'Diagramas & Setas',
    defaultStrokeColor: '#0f766e',
    defaultFillColor: '#ccfbf1',
    svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <path d="M36 28 C52 16 74 18 88 32" stroke="#0f766e" stroke-width="4"/>
      <path d="M78 20 L90 33 L74 36" stroke="#0f766e" stroke-width="3.5"/>
      <path d="M96 50 C102 70 92 90 74 98" stroke="#ea580c" stroke-width="4"/>
      <path d="M88 94 L72 99 L78 84" stroke="#ea580c" stroke-width="3.5"/>
      <path d="M52 100 C32 94 20 76 24 54" stroke="#0284c7" stroke-width="4"/>
      <path d="M16 64 L24 51 L34 62" stroke="#0284c7" stroke-width="3.5"/>
    </svg>`,
  },
  {
    id: 'warning-alert',
    name: 'Alerta / Atenção',
    category: 'Diagramas & Setas',
    defaultStrokeColor: '#18181b',
    defaultFillColor: '#fef08a',
    svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <polygon points="60,14 108,98 12,98" fill="#fef08a" stroke="#18181b" stroke-width="3.5"/>
      <path d="M60 42 L60 72" stroke="#ea580c" stroke-width="5"/>
      <circle cx="60" cy="84" r="3.5" fill="#ea580c" stroke="#ea580c" stroke-width="2"/>
    </svg>`,
  },
  {
    id: 'starburst-callout',
    name: 'Selo Destaque / Oferta',
    category: 'Diagramas & Setas',
    defaultStrokeColor: '#ea580c',
    defaultFillColor: '#ffedd5',
    svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <polygon points="60,8 72,26 94,18 92,40 112,50 96,66 106,88 84,90 78,112 60,98 42,112 36,90 14,88 24,66 8,50 28,40 26,18 48,26" fill="#ffedd5" stroke="#ea580c" stroke-width="3"/>
      <path d="M40 60 L54 74 L82 46" stroke="#ea580c" stroke-width="4.5"/>
    </svg>`,
  },
];
