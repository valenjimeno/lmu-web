import { createTeamAction, updateProfileAction } from '@/app/(app)/profile/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { UserEntitlements } from '@/services/entitlement.service';
import type { TeamSummary } from '@/services/team.service';
import type { Profile } from '@/types/profile.types';

const messageByCode = {
  missing_required_fields: 'Completa nombre, apellido y nickname antes de guardar.',
  missing_team_name: 'Escribe un nombre para el equipo antes de crearlo.',
  team_creation_requires_pro: 'Tu plan actual no permite crear equipos. Necesitas Pro.',
  team_limit_reached:
    'Ya has alcanzado el número máximo de equipos permitidos para tu suscripción actual.',
  team_slug_conflict:
    'No hemos podido reservar un slug único para el equipo. Prueba con otro nombre.',
  create_team_failed: 'No hemos podido crear el equipo. Inténtalo de nuevo en unos segundos.',
  profile_updated: 'Perfil actualizado correctamente.',
  team_created: 'Equipo creado correctamente.',
} as const;

type ProfileCardProps = {
  profile: Profile | null;
  entitlements: UserEntitlements;
  teams: TeamSummary[];
  errorCode?: string;
  successCode?: string;
};

function formatPlanName(plan: UserEntitlements['plan']) {
  return plan === 'pro' ? 'Pro' : 'Lite';
}

function formatRoleName(role: TeamSummary['role']) {
  return role === 'owner' ? 'Owner' : 'Miembro';
}

export function ProfileCard({
  profile,
  entitlements,
  teams,
  errorCode,
  successCode,
}: ProfileCardProps) {
  const successMessage =
    successCode && successCode in messageByCode
      ? messageByCode[successCode as keyof typeof messageByCode]
      : null;
  const errorMessage =
    errorCode && errorCode in messageByCode
      ? messageByCode[errorCode as keyof typeof messageByCode]
      : null;
  const teamsOwnedCount = teams.filter((team) => team.role === 'owner').length;

  return (
    <section className="app-shell-card max-w-5xl rounded-[2rem] p-6">
      <p className="section-kicker font-semibold">Perfil</p>

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

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.9fr)]">
        <form
          action={updateProfileAction}
          className="space-y-5 rounded-[1.6rem] border border-white/8 bg-white/[0.03] p-5"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="firstName">
                Nombre
              </label>
              <Input
                id="firstName"
                name="firstName"
                placeholder="Tu nombre"
                defaultValue={profile?.firstName ?? ''}
                maxLength={80}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="lastName">
                Apellido
              </label>
              <Input
                id="lastName"
                name="lastName"
                placeholder="Tu apellido"
                defaultValue={profile?.lastName ?? ''}
                maxLength={120}
                required
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-foreground" htmlFor="nickname">
                Nickname
              </label>
              <Input
                id="nickname"
                name="nickname"
                placeholder="Como quieres que aparezca en la app"
                defaultValue={profile?.nickname ?? ''}
                maxLength={80}
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-white/8 pt-5 sm:flex-row sm:items-center sm:justify-end">
            <Button type="submit">Guardar perfil</Button>
          </div>
        </form>

        <div className="space-y-5">
          <section className="rounded-[1.6rem] border border-white/8 bg-white/[0.03] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-white">Plan actual</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  {formatPlanName(entitlements.plan)}
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted">
                  {entitlements.canCreateTeams
                    ? 'Tu suscripción actual ya permite crear equipos y colaborar con otros pilotos.'
                    : 'Con Lite puedes trabajar en solitario. Necesitarás Pro para crear equipos e importar en lote.'}
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
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Importación</p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {entitlements.canBulkImportSessions ? 'Lote' : 'Individual'}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {entitlements.canBulkImportSessions
                    ? `Hasta ${entitlements.maxSessionsPerBulkImport ?? 'varias'} sesiones por envío.`
                    : 'Una sesión cada vez.'}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[1.6rem] border border-white/8 bg-white/[0.03] p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-white">Equipos</p>
                <p className="mt-1 text-sm text-muted">
                  Gestiona tu primer espacio colaborativo desde aquí.
                </p>
              </div>
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/72">
                {teams.length} {teams.length === 1 ? 'equipo' : 'equipos'}
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {teams.length > 0 ? (
                teams.map((team) => (
                  <div
                    key={team.id}
                    className="rounded-[1.2rem] border border-white/8 bg-black/10 px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-white">{team.name}</p>
                        <p className="mt-1 text-xs text-muted">@{team.slug}</p>
                      </div>
                      <span className="rounded-full border border-[rgba(225,178,122,0.22)] bg-[rgba(225,178,122,0.08)] px-3 py-1 text-xs text-[#f5d4aa]">
                        {formatRoleName(team.role)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[1.2rem] border border-dashed border-white/12 bg-black/10 px-4 py-4 text-sm text-muted">
                  Aún no perteneces a ningún equipo.
                </div>
              )}
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
                  El plan Lite no permite crear equipos. Cuando demos el siguiente paso, aquí
                  conectaremos el upgrade a Pro.
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
      </div>
    </section>
  );
}
