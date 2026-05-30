export const routes = {
  home: '/',
  login: '/login',
  auth: '/auth',
  dashboard: '/dashboard',
  comparison: '/comparison',
  setups: '/setups',
  sessions: '/sesiones',
  profile: '/profile',
  teams: '/equipos',
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
  {
    href: routes.teams,
    label: 'Equipos',
    title: 'Equipos',
    icon: 'teams',
  },
] as const;

export type AppNavigationItemIcon = (typeof appNavigationItems)[number]['icon'];
