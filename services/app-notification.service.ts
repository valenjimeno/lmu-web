import { routes } from '@/lib/constants/routes';
import type { AppNavigationItemIcon } from '@/lib/constants/routes';
import { getPendingInvitationsForUser } from '@/services/team.service';

export type AppNotification = {
  id: string;
  title: string;
  description: string;
  href: string;
  ctaLabel: string;
  count: number;
  category: 'team-invitations';
};

export type AppNavigationBadgeMap = Partial<Record<AppNavigationItemIcon, number>>;

export async function getAppNotifications(input: { userEmail: string | null | undefined }) {
  const normalizedEmail = input.userEmail?.trim() ?? '';

  if (!normalizedEmail) {
    return {
      items: [] as AppNotification[],
      navigationBadges: {} as AppNavigationBadgeMap,
    };
  }

  const pendingInvitations = await getPendingInvitationsForUser({
    userEmail: normalizedEmail,
  });

  if (pendingInvitations.length === 0) {
    return {
      items: [] as AppNotification[],
      navigationBadges: {} as AppNavigationBadgeMap,
    };
  }

  return {
    items: [
      {
        id: 'team-invitations',
        title:
          pendingInvitations.length === 1
            ? 'Tienes 1 invitacion de equipo pendiente'
            : `Tienes ${pendingInvitations.length} invitaciones de equipo pendientes`,
        description: 'Puedes revisarlas y aceptarlas desde la seccion de Equipos cuando quieras.',
        href: routes.teams,
        ctaLabel: 'Ver invitaciones',
        count: pendingInvitations.length,
        category: 'team-invitations',
      },
    ] satisfies AppNotification[],
    navigationBadges: {
      teams: pendingInvitations.length,
    } satisfies AppNavigationBadgeMap,
  };
}
