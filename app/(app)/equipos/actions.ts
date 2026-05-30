'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { routes } from '@/lib/constants/routes';
import { getCurrentUser } from '@/lib/supabase/auth';
import {
  acceptTeamInvitation,
  createTeam,
  inviteTeamMember,
  removeTeamMember,
  revokeTeamInvitation,
  setActiveTeam,
} from '@/services/team.service';

function normalizeNullableText(value: FormDataEntryValue | null, maxLength: number) {
  const normalized = String(value ?? '').trim();

  if (!normalized) {
    return null;
  }

  return normalized.slice(0, maxLength);
}

function resolveTeamRedirect(teamId?: string | null, params?: Record<string, string>) {
  const searchParams = new URLSearchParams();

  if (teamId) {
    searchParams.set('team', teamId);
  }

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      searchParams.set(key, value);
    }
  }

  const suffix = searchParams.toString();
  return suffix ? `${routes.teams}?${suffix}` : routes.teams;
}

export async function createTeamAction(formData: FormData) {
  const user = await getCurrentUser();

  if (!user) {
    redirect(routes.login);
  }

  const teamName = normalizeNullableText(formData.get('teamName'), 80);

  if (!teamName) {
    redirect(resolveTeamRedirect(null, { error: 'missing_team_name' }));
  }

  try {
    const createdTeam = await createTeam({
      userId: user.id,
      name: teamName,
    });

    revalidatePath(routes.teams);
    revalidatePath(routes.profile);
    revalidatePath('/', 'layout');
    redirect(resolveTeamRedirect(createdTeam.id, { success: 'team_created' }));
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'team_creation_requires_pro') {
        redirect(resolveTeamRedirect(null, { error: 'team_creation_requires_pro' }));
      }

      if (error.message === 'team_limit_reached') {
        redirect(resolveTeamRedirect(null, { error: 'team_limit_reached' }));
      }

      if (error.message === 'team_slug_conflict') {
        redirect(resolveTeamRedirect(null, { error: 'team_slug_conflict' }));
      }
    }

    redirect(resolveTeamRedirect(null, { error: 'create_team_failed' }));
  }
}

export async function inviteTeamMemberAction(formData: FormData) {
  const user = await getCurrentUser();

  if (!user) {
    redirect(routes.login);
  }

  const teamId = normalizeNullableText(formData.get('teamId'), 80);
  const email = normalizeNullableText(formData.get('email'), 160);

  if (!teamId) {
    redirect(resolveTeamRedirect(null, { error: 'missing_team_context' }));
  }

  if (!email) {
    redirect(resolveTeamRedirect(teamId, { error: 'missing_invitation_email' }));
  }

  try {
    await inviteTeamMember({
      teamId,
      userId: user.id,
      email,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'team_invitation_requires_pro') {
        redirect(resolveTeamRedirect(teamId, { error: 'team_invitation_requires_pro' }));
      }

      if (error.message === 'team_invitation_email_not_found') {
        redirect(resolveTeamRedirect(teamId, { error: 'team_invitation_email_not_found' }));
      }

      if (error.message === 'team_invitation_already_pending') {
        redirect(resolveTeamRedirect(teamId, { error: 'team_invitation_already_pending' }));
      }

      if (error.message === 'team_member_already_exists') {
        redirect(resolveTeamRedirect(teamId, { error: 'team_member_already_exists' }));
      }

      if (error.message === 'team_owner_required' || error.message === 'team_access_denied') {
        redirect(resolveTeamRedirect(teamId, { error: 'team_owner_required' }));
      }
    }

    redirect(resolveTeamRedirect(teamId, { error: 'team_invitation_failed' }));
  }

  revalidatePath(routes.teams);
  redirect(resolveTeamRedirect(teamId, { success: 'team_invitation_created' }));
}

export async function revokeTeamInvitationAction(formData: FormData) {
  const user = await getCurrentUser();

  if (!user) {
    redirect(routes.login);
  }

  const teamId = normalizeNullableText(formData.get('teamId'), 80);
  const invitationId = normalizeNullableText(formData.get('invitationId'), 80);

  if (!teamId || !invitationId) {
    redirect(resolveTeamRedirect(teamId, { error: 'missing_team_context' }));
  }

  try {
    await revokeTeamInvitation({
      invitationId,
      teamId,
      userId: user.id,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'team_invitation_not_found') {
        redirect(resolveTeamRedirect(teamId, { error: 'team_invitation_not_found' }));
      }

      if (error.message === 'team_owner_required' || error.message === 'team_access_denied') {
        redirect(resolveTeamRedirect(teamId, { error: 'team_owner_required' }));
      }
    }

    redirect(resolveTeamRedirect(teamId, { error: 'team_invitation_revoke_failed' }));
  }

  revalidatePath(routes.teams);
  redirect(resolveTeamRedirect(teamId, { success: 'team_invitation_revoked' }));
}

export async function removeTeamMemberAction(formData: FormData) {
  const user = await getCurrentUser();

  if (!user) {
    redirect(routes.login);
  }

  const teamId = normalizeNullableText(formData.get('teamId'), 80);
  const memberUserId = normalizeNullableText(formData.get('memberUserId'), 80);

  if (!teamId || !memberUserId) {
    redirect(resolveTeamRedirect(teamId, { error: 'missing_team_context' }));
  }

  try {
    await removeTeamMember({
      teamId,
      memberUserId,
      userId: user.id,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message === 'team_owner_required' ||
        error.message === 'team_access_denied' ||
        error.message === 'team_owner_removal_not_allowed' ||
        error.message === 'team_owner_self_removal_not_allowed'
      ) {
        redirect(resolveTeamRedirect(teamId, { error: error.message }));
      }

      if (error.message === 'team_member_not_found') {
        redirect(resolveTeamRedirect(teamId, { error: 'team_member_not_found' }));
      }
    }

    redirect(resolveTeamRedirect(teamId, { error: 'team_member_remove_failed' }));
  }

  revalidatePath(routes.teams);
  redirect(resolveTeamRedirect(teamId, { success: 'team_member_removed' }));
}

export async function acceptTeamInvitationAction(formData: FormData) {
  const user = await getCurrentUser();

  if (!user) {
    redirect(routes.login);
  }

  const token = normalizeNullableText(formData.get('token'), 120);

  if (!token) {
    redirect(resolveTeamRedirect(null, { error: 'missing_invitation_token' }));
  }

  if (!user.email) {
    redirect(resolveTeamRedirect(null, { error: 'missing_user_email' }));
  }

  try {
    const acceptedInvitation = await acceptTeamInvitation({
      token,
      userId: user.id,
      userEmail: user.email,
    });

    revalidatePath(routes.teams);
    revalidatePath(routes.profile);
    revalidatePath('/', 'layout');
    redirect(
      resolveTeamRedirect(acceptedInvitation.teamId, { success: 'team_invitation_accepted' }),
    );
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message === 'team_invitation_not_found' ||
        error.message === 'team_invitation_email_mismatch' ||
        error.message === 'team_invitation_expired' ||
        error.message === 'team_member_already_exists' ||
        error.message === 'missing_user_email'
      ) {
        redirect(resolveTeamRedirect(null, { error: error.message }));
      }
    }

    redirect(resolveTeamRedirect(null, { error: 'team_invitation_accept_failed' }));
  }
}

export async function setActiveTeamAction(formData: FormData) {
  const user = await getCurrentUser();

  if (!user) {
    redirect(routes.login);
  }

  const teamId = normalizeNullableText(formData.get('teamId'), 80);

  if (!teamId) {
    redirect(resolveTeamRedirect(null, { error: 'missing_team_context' }));
  }

  try {
    await setActiveTeam({
      teamId,
      userId: user.id,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'team_access_denied') {
        redirect(resolveTeamRedirect(null, { error: 'team_access_denied' }));
      }
    }

    redirect(resolveTeamRedirect(teamId, { error: 'team_active_update_failed' }));
  }

  revalidatePath(routes.teams);
  revalidatePath(routes.profile);
  revalidatePath(routes.setups);
  revalidatePath(routes.sessions);
  revalidatePath('/', 'layout');
  redirect(resolveTeamRedirect(teamId, { success: 'team_active_updated' }));
}
