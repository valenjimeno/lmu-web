'use client';

import { usePathname } from 'next/navigation';
import { completeRequiredProfileAction } from '@/app/(app)/profile/actions';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { SubmitButton } from '@/components/ui/submit-button';
import type { Profile } from '@/types/profile.types';

type CompleteProfileModalProps = {
  profile: Profile | null;
};

export function CompleteProfileModal({ profile }: CompleteProfileModalProps) {
  const pathname = usePathname();

  return (
    <Modal
      title="Completa tu perfil"
      className="max-w-xl border border-[rgba(225,178,122,0.16)] bg-[linear-gradient(180deg,rgba(21,24,31,0.98),rgba(16,18,24,0.98))]"
    >
      <p className="text-sm leading-7 text-muted">
        Necesitamos nombre, apellido y nickname antes de que puedas seguir usando la app.
      </p>

      <form action={completeRequiredProfileAction} className="mt-6 space-y-4">
        <input type="hidden" name="returnTo" value={pathname || '/setups'} />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="complete-firstName">
              Nombre
            </label>
            <Input
              id="complete-firstName"
              name="firstName"
              placeholder="Tu nombre"
              defaultValue={profile?.firstName ?? ''}
              maxLength={80}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="complete-lastName">
              Apellido
            </label>
            <Input
              id="complete-lastName"
              name="lastName"
              placeholder="Tu apellido"
              defaultValue={profile?.lastName ?? ''}
              maxLength={120}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="complete-nickname">
            Nickname
          </label>
          <Input
            id="complete-nickname"
            name="nickname"
            placeholder="Como quieres que aparezca en la app"
            defaultValue={profile?.nickname ?? ''}
            maxLength={80}
            required
          />
        </div>

        <div className="flex justify-end border-t border-white/8 pt-5">
          <SubmitButton pendingLabel="Guardando perfil...">Guardar y continuar</SubmitButton>
        </div>
      </form>
    </Modal>
  );
}
