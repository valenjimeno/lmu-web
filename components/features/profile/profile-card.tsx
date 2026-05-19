import { updateProfileAction } from '@/app/(app)/profile/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Profile } from '@/types/profile.types';

const messageByCode = {
  missing_required_fields: 'Completa nombre, apellido y nickname antes de guardar.',
  profile_updated: 'Perfil actualizado correctamente.',
} as const;

type ProfileCardProps = {
  profile: Profile | null;
  errorCode?: string;
  successCode?: string;
};

export function ProfileCard({ profile, errorCode, successCode }: ProfileCardProps) {
  const successMessage =
    successCode && successCode in messageByCode
      ? messageByCode[successCode as keyof typeof messageByCode]
      : null;
  const errorMessage =
    errorCode && errorCode in messageByCode
      ? messageByCode[errorCode as keyof typeof messageByCode]
      : null;

  return (
    <section className="app-shell-card max-w-4xl rounded-[2rem] p-6">
      <p className="section-kicker font-semibold">Perfil</p>
      <form action={updateProfileAction} className="mt-8 space-y-5">
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

        <div className="flex flex-col gap-3 border-t border-white/8 pt-5 sm:flex-row sm:items-center sm:justify-end">
          <Button type="submit">Guardar perfil</Button>
        </div>
      </form>
    </section>
  );
}
