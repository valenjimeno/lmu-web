import Link from 'next/link';
import {
  acceptTeamInvitationAction,
  createTeamAction,
  inviteTeamMemberAction,
  removeTeamMemberAction,
  revokeTeamInvitationAction,
  setActiveTeamAction,
} from '@/app/(app)/equipos/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { routes } from '@/lib/constants/routes';
import type { UserEntitlements } from '@/services/entitlement.service';
import type {
  IncomingTeamInvitationSummary,
  TeamInvitationSummary,
  TeamMemberSummary,
  TeamSummary,
} from '@/services/team.service';

const messageByCode = {
  missing_team_name: 'Escribe un nombre para el equipo antes de crearlo.',
  team_creation_requires_pro: 'Tu plan actual no permite crear equipos. Necesitas Pro.',
  team_limit_reached:
    'Ya has alcanzado el número máximo de equipos permitidos para tu suscripción actual.',
  team_slug_conflict:
    'No hemos podido reservar un slug único para el equipo. Prueba con otro nombre.',
  create_team_failed: 'No hemos podido crear el equipo. Inténtalo de nuevo en unos segundos.',
  team_created: 'Equipo creado correctamente.',
  missing_invitation_email: 'Escribe un email válido antes de enviar la invitación.',
  team_invitation_requires_pro: 'Tu plan actual no permite invitar miembros. Necesitas Pro.',
  team_invitation_email_not_found: 'No existe ninguna cuenta registrada con ese email.',
  team_invitation_already_pending:
    'Ya existe una invitación pendiente para ese email en este equipo.',
  team_member_already_exists: 'Ese usuario ya pertenece al equipo.',
  team_invitation_failed: 'No hemos podido crear la invitación. Inténtalo de nuevo.',
  team_invitation_created: 'Invitación enviada correctamente.',
  team_invitation_not_found: 'La invitación ya no está disponible.',
  team_invitation_revoke_failed: 'No hemos podido revocar la invitación.',
  team_invitation_revoked: 'Invitación revocada.',
  team_owner_required: 'Solo el owner del equipo puede realizar esta acción.',
  team_member_not_found: 'No hemos encontrado ese miembro en el equipo.',
  team_member_remove_failed: 'No hemos podido eliminar al miembro.',
  team_member_removed: 'Miembro eliminado del equipo.',
  team_owner_removal_not_allowed: 'No puedes eliminar a otro owner desde esta vista.',
  team_owner_self_removal_not_allowed: 'No puedes salir de tu propio equipo desde aquí.',
  missing_team_context: 'Falta el contexto del equipo seleccionado.',
  missing_invitation_token: 'No hemos recibido la invitación que quieres aceptar.',
  missing_user_email: 'Tu usuario no tiene email disponible para aceptar invitaciones.',
  team_invitation_accepted: 'Te has unido al equipo correctamente.',
  team_active_updated: 'Equipo activo actualizado.',
  team_active_update_failed: 'No hemos podido actualizar el equipo activo.',
  team_invitation_email_mismatch: 'Esta invitación no coincide con el email de tu cuenta actual.',
  team_invitation_expired: 'La invitación ha expirado. Pide una nueva al owner del equipo.',
  team_invitation_accept_failed: 'No hemos podido aceptar la invitación.',
  team_access_denied: 'No tienes acceso a ese equipo.',
} as const;

type TeamsCardProps = {
  entitlements: UserEntitlements;
  teams: TeamSummary[];
  selectedTeam: TeamSummary | null;
  activeTeamId: string | null;
  members: TeamMemberSummary[];
  invitations: TeamInvitationSummary[];
  incomingInvitations: IncomingTeamInvitationSummary[];
  errorCode?: string;
  successCode?: string;
};

function formatPlanName(plan: UserEntitlements['plan']) {
  return plan === 'pro' ? 'Pro' : 'Lite';
}

function formatRoleName(role: TeamSummary['role']) {
  return role === 'owner' ? 'Owner' : 'Miembro';
}

function formatMemberLabel(member: TeamMemberSummary) {
  const fullName = [member.firstName?.trim(), member.lastName?.trim()].filter(Boolean).join(' ');

  return fullName || member.displayName?.trim() || 'Miembro del equipo';
}

function formatInvitationStatus(status: TeamInvitationSummary['status']) {
  switch (status) {
    case 'accepted':
      return 'Aceptada';
    case 'revoked':
      return 'Revocada';
    case 'expired':
      return 'Expirada';
    default:
      return 'Pendiente';
  }
}

export function TeamsCard({
  entitlements,
  teams,
  selectedTeam,
  activeTeamId,
  members,
  invitations,
  incomingInvitations,
  errorCode,
  successCode,
}: TeamsCardProps) {
  const successMessage =
    successCode && successCode in messageByCode
      ? messageByCode[successCode as keyof typeof messageByCode]
      : null;
  const errorMessage =
    errorCode && errorCode in messageByCode
      ? messageByCode[errorCode as keyof typeof messageByCode]
      : null;
  const teamsOwnedCount = teams.filter((team) => team.role === 'owner').length;
  const isOwner = selectedTeam?.role === 'owner';
  const canInviteMembers = Boolean(selectedTeam && isOwner && entitlements.canInviteToTeams);
  const isSelectedTeamActive = Boolean(selectedTeam && selectedTeam.id === activeTeamId);

  return (
    <section className="app-shell-card max-w-6xl rounded-[2rem] p-6">
      <p className="section-kicker font-semibold">Equipos</p>

      {(successMessage || errorMessage) && (
        <div className="mt-6 space-y-3">
          {successMessage ? (
            <p className="rounded-[1.3rem] border border-[rgba(140,214,169,0.22)] bg-[rgba(140,214,169,0.08)] px-4 py-3 text-sm text-[#b9efc6]">
              {successMessage}
            </p>
          ) : null}

          {errorMessage ? (
            <p className="rounded-[1.3rem] border border-[rgba(244,154,141,0.22)] bg-[rgba(244,154,141,0.08)] px-4 py-3 text-sm text-[#f3b4aa]">
              {errorMessage}
            </p>
          ) : null}
        </div>
      )}

      <div className="mt-8 grid gap-6 xl:grid-cols-[18rem_minmax(0,1fr)]">
        <div className="space-y-5">
          {incomingInvitations.length > 0 ? (
            <section className="rounded-[1.6rem] border border-[rgba(140,214,169,0.16)] bg-[rgba(140,214,169,0.04)] p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-white">Invitaciones para ti</p>
                  <p className="mt-1 text-sm text-muted">
                    Puedes aceptar aquí mismo las invitaciones pendientes asociadas a tu email.
                  </p>
                </div>
                <span className="rounded-full border border-[rgba(140,214,169,0.22)] bg-[rgba(140,214,169,0.08)] px-3 py-1 text-xs text-[#b9efc6]">
                  {incomingInvitations.length}{' '}
                  {incomingInvitations.length === 1 ? 'pendiente' : 'pendientes'}
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {incomingInvitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="flex flex-col gap-3 rounded-[1.2rem] border border-white/8 bg-black/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium text-white">{invitation.teamName}</p>
                      <p className="mt-1 text-xs text-muted">
                        {invitation.teamSlug ? `@${invitation.teamSlug}` : 'Equipo sin slug'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="rounded-full border border-[rgba(140,214,169,0.22)] bg-[rgba(140,214,169,0.08)] px-3 py-1 text-xs text-[#b9efc6]">
                        Invitación pendiente
                      </span>
                      <form action={acceptTeamInvitationAction}>
                        <input type="hidden" name="token" value={invitation.token} />
                        <Button type="submit" className="min-h-10 px-4 py-2">
                          Aceptar
                        </Button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <section className="rounded-[1.6rem] border border-white/8 bg-white/[0.03] p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-white">Tus equipos</p>
                <p className="mt-1 text-sm text-muted">
                  Selecciona el espacio con el que quieres trabajar.
                </p>
              </div>
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/72">
                {teams.length} {teams.length === 1 ? 'equipo' : 'equipos'}
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {teams.length > 0 ? (
                teams.map((team) => {
                  const isSelected = selectedTeam?.id === team.id;
                  const isActive = team.id === activeTeamId;

                  return (
                    <Link
                      key={team.id}
                      href={`${routes.teams}?team=${team.id}`}
                      className={`block rounded-[1.2rem] border px-4 py-3 transition ${
                        isSelected
                          ? 'border-[rgba(225,178,122,0.26)] bg-[rgba(225,178,122,0.08)]'
                          : 'border-white/8 bg-black/10 hover:border-white/16'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium text-white">{team.name}</p>
                          <p className="mt-1 text-xs text-muted">@{team.slug}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {isActive ? (
                            <span className="rounded-full border border-[rgba(140,214,169,0.22)] bg-[rgba(140,214,169,0.08)] px-3 py-1 text-xs text-[#b9efc6]">
                              Activo
                            </span>
                          ) : null}
                          <span className="rounded-full border border-[rgba(225,178,122,0.22)] bg-[rgba(225,178,122,0.08)] px-3 py-1 text-xs text-[#f5d4aa]">
                            {formatRoleName(team.role)}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })
              ) : (
                <div className="rounded-[1.2rem] border border-dashed border-white/12 bg-black/10 px-4 py-4 text-sm text-muted">
                  Aún no perteneces a ningún equipo.
                </div>
              )}
            </div>
          </section>

          <section className="rounded-[1.6rem] border border-white/8 bg-white/[0.03] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-white">Acceso actual</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  Equipos en {formatPlanName(entitlements.plan)}
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted">
                  {entitlements.canCreateTeams
                    ? 'Puedes crear equipos e invitar colaboradores desde este espacio.'
                    : 'Equipos es una funcionalidad Pro. Desde Lite puedes verla, pero no crear ni gestionar nuevos equipos.'}
                </p>
              </div>
              <span className="rounded-full border border-[rgba(225,178,122,0.28)] bg-[rgba(225,178,122,0.12)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#f5d4aa]">
                {formatPlanName(entitlements.plan)}
              </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.2rem] border border-white/8 bg-black/10 p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted">
                  Equipos propios
                </p>
                <p className="mt-2 text-2xl font-semibold text-white">{teamsOwnedCount}</p>
                <p className="mt-1 text-xs text-muted">
                  Límite actual: {entitlements.maxTeamsOwned ?? 'Sin límite'}
                </p>
              </div>
              <div className="rounded-[1.2rem] border border-white/8 bg-black/10 p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Invitaciones</p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {entitlements.canInviteToTeams ? 'Activas' : 'Bloqueadas'}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {entitlements.canInviteToTeams
                    ? 'Owners Pro pueden invitar nuevos miembros.'
                    : 'Necesitas Pro para invitar colaboradores.'}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[1.6rem] border border-white/8 bg-white/[0.03] p-5">
            <div>
              <p className="text-sm font-medium text-white">Crear equipo</p>
              <p className="mt-1 text-sm text-muted">Solo disponible para miembros Pro.</p>
            </div>

            <form action={createTeamAction} className="mt-5 space-y-4 border-t border-white/8 pt-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="teamName">
                  Nombre del equipo
                </label>
                <Input
                  id="teamName"
                  name="teamName"
                  placeholder="Ej. LMU Endurance"
                  maxLength={80}
                  disabled={!entitlements.canCreateTeams}
                />
              </div>

              {!entitlements.canCreateTeams ? (
                <p className="rounded-[1.2rem] border border-[rgba(225,178,122,0.22)] bg-[rgba(225,178,122,0.08)] px-4 py-3 text-sm text-[#f5d4aa]">
                  El plan Lite no permite crear equipos. Cuando conectemos el upgrade, este será el
                  punto de entrada para pasar a Pro.
                </p>
              ) : null}

              <div className="flex justify-end">
                <Button type="submit" disabled={!entitlements.canCreateTeams}>
                  Crear equipo
                </Button>
              </div>
            </form>
          </section>
        </div>

        <div className="space-y-5">
          <section className="rounded-[1.6rem] border border-white/8 bg-white/[0.03] p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-white">
                  {selectedTeam ? selectedTeam.name : 'Equipo no seleccionado'}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {selectedTeam
                    ? `Gestiona miembros e invitaciones de @${selectedTeam.slug}.`
                    : 'Selecciona un equipo para ver sus miembros e invitaciones.'}
                </p>
              </div>
              {selectedTeam ? (
                <div className="flex items-center gap-2">
                  {isSelectedTeamActive ? (
                    <span className="rounded-full border border-[rgba(140,214,169,0.22)] bg-[rgba(140,214,169,0.08)] px-3 py-1 text-xs text-[#b9efc6]">
                      Equipo activo
                    </span>
                  ) : null}
                  <span className="rounded-full border border-[rgba(225,178,122,0.22)] bg-[rgba(225,178,122,0.08)] px-3 py-1 text-xs text-[#f5d4aa]">
                    {formatRoleName(selectedTeam.role)}
                  </span>
                </div>
              ) : null}
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[1.2rem] border border-white/8 bg-black/10 p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Miembros</p>
                <p className="mt-2 text-2xl font-semibold text-white">{members.length}</p>
                <p className="mt-1 text-xs text-muted">Incluye owners y miembros activos.</p>
              </div>
              <div className="rounded-[1.2rem] border border-white/8 bg-black/10 p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Pendientes</p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {invitations.filter((invitation) => invitation.status === 'pending').length}
                </p>
                <p className="mt-1 text-xs text-muted">Invitaciones aún sin aceptar.</p>
              </div>
              <div className="rounded-[1.2rem] border border-white/8 bg-black/10 p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Permiso</p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {isOwner ? 'Owner' : selectedTeam ? 'Miembro' : 'Sin equipo'}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {isOwner
                    ? 'Puedes invitar y gestionar miembros.'
                    : 'Solo los owners pueden gestionar invitaciones.'}
                </p>
              </div>
            </div>

            {selectedTeam ? (
              <div className="mt-5 border-t border-white/8 pt-5">
                {isSelectedTeamActive ? (
                  <p className="rounded-[1.2rem] border border-[rgba(140,214,169,0.22)] bg-[rgba(140,214,169,0.08)] px-4 py-3 text-sm text-[#b9efc6]">
                    Este es tu equipo activo. Lo usaremos como contexto por defecto en los
                    siguientes flujos de colaboración.
                  </p>
                ) : (
                  <form action={setActiveTeamAction} className="flex justify-end">
                    <input type="hidden" name="teamId" value={selectedTeam.id} />
                    <Button type="submit" variant="secondary">
                      Marcar como equipo activo
                    </Button>
                  </form>
                )}
              </div>
            ) : null}
          </section>

          <section className="rounded-[1.6rem] border border-white/8 bg-white/[0.03] p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-white">Miembros del equipo</p>
                <p className="mt-1 text-sm text-muted">
                  Vista rápida de quién forma parte del espacio colaborativo.
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {selectedTeam ? (
                members.length > 0 ? (
                  members.map((member) => (
                    <div
                      key={member.userId}
                      className="flex flex-col gap-3 rounded-[1.2rem] border border-white/8 bg-black/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-medium text-white">{formatMemberLabel(member)}</p>
                        <p className="mt-1 text-xs text-muted">
                          {member.displayName ? `@${member.displayName}` : 'Perfil sin nickname'}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="rounded-full border border-[rgba(225,178,122,0.22)] bg-[rgba(225,178,122,0.08)] px-3 py-1 text-xs text-[#f5d4aa]">
                          {formatRoleName(member.role)}
                        </span>
                        {isOwner && member.role !== 'owner' ? (
                          <form action={removeTeamMemberAction}>
                            <input type="hidden" name="teamId" value={selectedTeam.id} />
                            <input type="hidden" name="memberUserId" value={member.userId} />
                            <Button type="submit" variant="ghost" className="min-h-10 px-3 py-2">
                              Quitar
                            </Button>
                          </form>
                        ) : null}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[1.2rem] border border-dashed border-white/12 bg-black/10 px-4 py-4 text-sm text-muted">
                    Todavía no hay miembros visibles en este equipo.
                  </div>
                )
              ) : (
                <div className="rounded-[1.2rem] border border-dashed border-white/12 bg-black/10 px-4 py-4 text-sm text-muted">
                  Selecciona un equipo para consultar sus miembros.
                </div>
              )}
            </div>
          </section>

          <section className="rounded-[1.6rem] border border-white/8 bg-white/[0.03] p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-white">Invitaciones</p>
                <p className="mt-1 text-sm text-muted">
                  {isOwner
                    ? 'Invita miembros por email y gestiona el estado de cada invitación.'
                    : 'Solo el owner del equipo puede ver y enviar invitaciones.'}
                </p>
              </div>
            </div>

            <form
              action={inviteTeamMemberAction}
              className="mt-5 space-y-4 border-t border-white/8 pt-5"
            >
              <input type="hidden" name="teamId" value={selectedTeam?.id ?? ''} />
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="invite-email">
                  Email del miembro
                </label>
                <Input
                  id="invite-email"
                  name="email"
                  type="email"
                  placeholder="piloto@equipo.com"
                  maxLength={160}
                  disabled={!canInviteMembers}
                />
              </div>

              {!selectedTeam ? (
                <p className="rounded-[1.2rem] border border-white/10 bg-black/10 px-4 py-3 text-sm text-muted">
                  Selecciona un equipo para empezar a invitar miembros.
                </p>
              ) : !isOwner ? (
                <p className="rounded-[1.2rem] border border-[rgba(225,178,122,0.22)] bg-[rgba(225,178,122,0.08)] px-4 py-3 text-sm text-[#f5d4aa]">
                  Eres miembro de este equipo, pero solo el owner puede enviar invitaciones.
                </p>
              ) : !entitlements.canInviteToTeams ? (
                <p className="rounded-[1.2rem] border border-[rgba(225,178,122,0.22)] bg-[rgba(225,178,122,0.08)] px-4 py-3 text-sm text-[#f5d4aa]">
                  Tu plan actual no permite invitar miembros. Necesitas Pro.
                </p>
              ) : null}

              <div className="flex justify-end">
                <Button type="submit" disabled={!canInviteMembers}>
                  Enviar invitación
                </Button>
              </div>
            </form>

            <div className="mt-5 space-y-3 border-t border-white/8 pt-5">
              {selectedTeam ? (
                invitations.length > 0 ? (
                  invitations.map((invitation) => (
                    <div
                      key={invitation.id}
                      className="flex flex-col gap-3 rounded-[1.2rem] border border-white/8 bg-black/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-medium text-white">{invitation.email}</p>
                        <p className="mt-1 text-xs text-muted">
                          Estado: {formatInvitationStatus(invitation.status)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="rounded-full border border-[rgba(225,178,122,0.22)] bg-[rgba(225,178,122,0.08)] px-3 py-1 text-xs text-[#f5d4aa]">
                          {formatInvitationStatus(invitation.status)}
                        </span>
                        {isOwner && invitation.status === 'pending' ? (
                          <form action={revokeTeamInvitationAction}>
                            <input type="hidden" name="teamId" value={selectedTeam.id} />
                            <input type="hidden" name="invitationId" value={invitation.id} />
                            <Button type="submit" variant="ghost" className="min-h-10 px-3 py-2">
                              Revocar
                            </Button>
                          </form>
                        ) : null}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[1.2rem] border border-dashed border-white/12 bg-black/10 px-4 py-4 text-sm text-muted">
                    No hay invitaciones registradas para este equipo.
                  </div>
                )
              ) : (
                <div className="rounded-[1.2rem] border border-dashed border-white/12 bg-black/10 px-4 py-4 text-sm text-muted">
                  Selecciona un equipo para ver sus invitaciones.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
