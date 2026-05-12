import { Button } from '@/components/ui/button';

export function LogoutButton() {
  return (
    <form action="/auth/signout" method="post">
      <Button type="submit" variant="ghost">
        Cerrar sesión
      </Button>
    </form>
  );
}
