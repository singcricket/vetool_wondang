import {
  Activity,
  BarChart4Icon,
  BuildingIcon,
  HeartPulseIcon,
  HomeIcon,
  ListChecksIcon,
  NotebookPen,
  PawPrintIcon,
  SyringeIcon,
  Folder,
} from 'lucide-react'

export const HOS_SIDEBAR_MENUS = [
  {
    name: '병원 홈',
    path: '',
    isReady: true,
    icon: <HomeIcon />,
  },
  {
    name: '환자목록',
    path: 'patients',
    isReady: true,
    icon: <PawPrintIcon />,
  },
  {
    name: '입원차트',
    path: 'icu',
    isReady: true,
    icon: <SyringeIcon />,
  },
  {
    name: '모니터링',
    path: 'monitoring',
    isReady: true,
    icon: <Activity />,
  },
  {
    name: '심초차트',
    path: 'echocardio',
    isReady: true,
    icon: <HeartPulseIcon />,
  },
  // {
  //   name: '건강검진차트',
  //   path: 'checkup',
  //   isReady: false,
  //   icon: <ListChecksIcon />,
  // },
  // {
  //   name: '데이터분석',
  //   path: 'analytics',
  //   isReady: false,
  //   icon: <BarChart4Icon />,
  // },
  {
    name: '진료노트',
    path: 'notes',
    isReady: true,
    icon: <NotebookPen />,
  },
  {
    name: '컬렉션',
    path: 'collections',
    isReady: true,
    icon: <Folder />,
  },
  {
    name: '벳툴',
    path: 'super',
    isReady: true,
    icon: <BuildingIcon />,
  },
] as const
