import { EducationArticle } from './types';

export const EDUCATION_CONTENT: EducationArticle[] = [
  {
    id: '1',
    title: 'Sobre o Prosterite',
    content: 'Prosterite é a solução completa para a saúde masculina. Sua fórmula dupla (Cápsulas + Gotas) atua na redução da inflamação da próstata e na regulação do fluxo urinário.',
    icon: 'info',
  },
  {
    id: '2',
    title: 'Cápsulas vs. Gotas',
    content: 'Manhã (Cápsula): Foco na proteção celular e redução do inchaço.\nNoite (Gotas): Foco no relaxamento do trato urinário para dormir sem interrupções.',
    icon: 'pill',
  },
  {
    id: '3',
    title: 'Resultados Esperados',
    content: 'Em 30 dias: Melhora no fluxo urinário.\nEm 60 dias: Redução das idas noturnas ao banheiro.\nEm 90 dias: Estabilização dos sintomas e maior vigor.',
    icon: 'check',
  },
  {
    id: '4',
    title: 'Urgência Médica',
    content: 'Se sentir dor extrema, bloqueio total da urina ou febre alta, procure um pronto-socorro. O Prosterite é um tratamento contínuo, não um remédio de emergência aguda.',
    icon: 'alert',
  },
];

export const INITIAL_MEDS_DEMO = [
  {
    id: 'med_prost_cap',
    name: 'Prosterite Cápsulas',
    dosage: '1 Cápsula',
    time: '08:00',
    history: [],
  },
  {
    id: 'med_prost_drop',
    name: 'Prosterite Gotas',
    dosage: '12 Gotas Sublinguais',
    time: '20:00',
    history: [],
  }
];