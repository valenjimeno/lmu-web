export const routes = {
  home: '/',
  login: '/login',
  dashboard: '/dashboard',
  setups: '/setups',
  sessions: '/sesiones',
  profile: '/profile',
} as const;

export const appNavigationItems = [
  {
    href: routes.dashboard,
    label: 'Dashboard',
    title: 'Dashboard',
    icon: 'dashboard',
  },
  {
    href: routes.setups,
    label: 'Setups',
    title: 'Setups',
    icon: 'speed',
  },
  {
    href: routes.sessions,
    label: 'Sesiones',
    title: 'Sesiones',
    icon: 'sessions',
  },
] as const;
