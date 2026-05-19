export const routes = {
  home: '/',
  login: '/login',
  dashboard: '/dashboard',
  setups: '/setups',
  settings: '/settings',
} as const;

export const appNavigationItems = [
  {
    href: routes.setups,
    label: 'Setups',
    title: 'Setups',
    icon: 'speed',
  },
] as const;
