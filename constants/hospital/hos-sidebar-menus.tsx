import {
  Activity,
  BarChart4,
  Building,
  HeartPulse,
  Home,
  ListChecks,
  Microscope,
  NotebookPen,
  PawPrint,
  Syringe,
  Folder,
  Waves,
  BrainCircuit,
  Eye,
  Cone,
} from 'lucide-react'

const ToothIcon = ({ size = 24, color = 'currentColor', strokeWidth = 2, ...props }: { size?: number; color?: string; strokeWidth?: number; [key: string]: any }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {/* 송곳니(Fang) — 뾰족한 크라운 + 깊게 갈라진 두 갈래 치근 */}
    <path d="M8 2C6 2 4.5 3.5 4.5 5.5C4.5 7.5 5.5 9.5 6.5 11.5C7.5 13.5 8 15 7 17.5C6 20 5.5 22 8 22C9.5 22 10 20 10.5 18C11 16 11.5 14 12 12C12.5 14 13 16 13.5 18C14 20 14.5 22 16 22C18.5 22 18 20 17 17.5C16 15 16.5 13.5 17.5 11.5C18.5 9.5 19.5 7.5 19.5 5.5C19.5 3.5 18 2 16 2C14 2 13 3 12 4C11 3 10 2 8 2Z" />
  </svg>
);

export const HOS_SIDEBAR_MENUS = [
  {
    name: '병원 홈',
    path: '',
    isReady: true,
    isVetOnly: false,
    icon: <Home />,
  },
  {
    name: '환자목록',
    path: 'patients',
    isReady: true,
    isVetOnly: false,
    icon: <PawPrint />,
  },
  {
    name: '입원차트',
    path: 'icu',
    isReady: true,
    isVetOnly: false,
    icon: <Syringe />,
  },
  {
    name: '모니터링',
    path: 'monitoring',
    isReady: true,
    isVetOnly: false,
    icon: <Activity />,
  },
  {
    name: '심초차트',
    path: 'echocardio',
    isReady: true,
    isVetOnly: true,
    icon: <HeartPulse />,
  },
  {
    name: '복부초음파',
    path: 'ultrasound',
    isReady: true,
    isVetOnly: true,
    icon: <Cone />,
  },
  {
    name: '치과',
    path: 'dental',
    isReady: true,
    isVetOnly: true,
    icon: <ToothIcon />,
  },
  {
    name: '안과',
    path: 'ophthalmic',
    isReady: true,
    isVetOnly: true,
    icon: <Eye />,
  },
  {
    name: '신경계',
    path: 'neuro',
    isReady: true,
    isVetOnly: true,
    icon: <BrainCircuit />,
  },
  {
    name: '세포학',
    path: 'cytology',
    isReady: true,
    isVetOnly: true,
    icon: <Microscope />,
  },
  {
    name: '진료노트',
    path: 'notes',
    isReady: true,
    isVetOnly: false,
    icon: <NotebookPen />,
  },
  {
    name: '컬렉션',
    path: 'collections',
    isReady: true,
    isVetOnly: false,
    icon: <Folder />,
  },
  {
    name: '벳툴',
    path: 'super',
    isReady: true,
    isVetOnly: true,
    icon: <Building />,
  },
] as const
