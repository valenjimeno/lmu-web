import { Button } from '@/components/ui/button';

export function AvatarUploader() {
  return (
    <aside className="app-shell-card rounded-[2rem] p-6">
      <p className="section-kicker font-semibold">Storage</p>
      <h2 className="mt-3 text-xl font-semibold tracking-tight text-white">Avatar uploader</h2>
      <p className="mt-3 text-sm leading-7 text-muted">
        La siguiente pieza natural es conectar Supabase Storage para foto de perfil, logos de equipo
        o assets personales del piloto.
      </p>
      <Button type="button" variant="secondary" className="mt-6">
        Proximamente
      </Button>
    </aside>
  );
}
