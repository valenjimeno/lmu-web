import Link from 'next/link';
import { updateProfileAction } from '@/app/(app)/profile/actions';
import { Input } from '@/components/ui/input';
import { SubmitButton } from '@/components/ui/submit-button';
import { routes } from '@/lib/constants/routes';
import type { UserEntitlements } from '@/services/entitlement.service';
import type { Profile } from '@/types/profile.types';

const messageByCode = {
  missing_required_fields: 'Completa nombre, apellido y nickname antes de guardar.',
  profile_updated: 'Perfil actualizado correctamente.',
} as const;

type ProfileCardProps = {
  profile: Profile | null;
  entitlements: UserEntitlements;
  errorCode?: string;
  successCode?: string;
};

function formatPlanName(plan: UserEntitlements['plan']) {
  return plan === 'pro' ? 'Pro' : 'Lite';
}

export function ProfileCard({ profile, entitlements, errorCode, successCode }: ProfileCardProps) {
  const successMessage =
    successCode && successCode in messageByCode
      ? messageByCode[successCode as keyof typeof messageByCode]
      : null;
  const errorMessage =
    errorCode && errorCode in messageByCode
      ? messageByCode[errorCode as keyof typeof messageByCode]
      : null;

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
            <SubmitButton pendingLabel="Guardando perfil...">Guardar perfil</SubmitButton>
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
                    : 'Con Lite puedes trabajar en solitario. Necesitarás Pro para desbloquear Equipos e importación en lote.'}
                </p>
              </div>
              <span className="rounded-full border border-[rgba(225,178,122,0.28)] bg-[rgba(225,178,122,0.12)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#f5d4aa]">
                {formatPlanName(entitlements.plan)}
              </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.2rem] border border-white/8 bg-black/10 p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Equipos</p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {entitlements.canCreateTeams ? 'Activo' : 'Bloqueado'}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {entitlements.canCreateTeams
                    ? 'Gestiona tus espacios colaborativos desde la seccion Equipos.'
                    : 'Actualiza a Pro para crear y gestionar equipos.'}
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
            <p className="text-sm font-medium text-white">Espacios Pro</p>
            <p className="mt-2 text-sm leading-6 text-muted">
              La gestion de equipos ya no vive dentro del perfil. Ahora tiene su propio espacio para
              crecer sin mezclar configuracion personal con colaboracion.
            </p>
            <Link
              href={routes.teams}
              className="mt-5 inline-flex rounded-full border border-[rgba(225,178,122,0.24)] bg-[rgba(225,178,122,0.1)] px-4 py-2 text-sm font-semibold text-[#f5d4aa] transition hover:bg-[rgba(225,178,122,0.16)]"
            >
              Ir a Equipos
            </Link>
          </section>
        </div>
      </div>
    </section>
  );
}
