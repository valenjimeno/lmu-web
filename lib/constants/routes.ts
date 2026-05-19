export const routes = {
  home: '/',
  login: '/login',
  dashboard: '/dashboard',
  setups: '/setups',
  profile: '/profile',
} as const;

export const appNavigationItems = [
  {
    href: routes.profile,
    label: 'Perfil',
    title: 'Perfil',
    icon: 'profile',
  },
  {
    href: routes.setups,
    label: 'Setups',
    title: 'Setups',
    icon: 'speed',
  },
] as const;
