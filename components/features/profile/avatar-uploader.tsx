import { Button } from '@/components/ui/button';

export function AvatarUploader() {
  return (
    <aside className="rounded-[2rem] border border-border bg-surface p-6">
      <p className="text-sm font-medium text-accent">Storage</p>
      <h2 className="mt-2 text-xl font-semibold tracking-tight">Avatar uploader</h2>
      <p className="mt-3 text-sm leading-7 text-muted">
        Placeholder visual para la futura integración con Supabase Storage.
      </p>
      <Button type="button" variant="secondary" className="mt-6">
        Subir archivo
      </Button>
    </aside>
  );
}
