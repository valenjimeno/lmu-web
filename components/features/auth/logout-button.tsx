import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';

type LogoutButtonProps = {
  className?: string;
  iconOnly?: boolean;
};

export function LogoutButton({ className, iconOnly = false }: LogoutButtonProps) {
  return (
    <form action="/auth/signout" method="post">
      <Button
        type="submit"
        variant="ghost"
        className={cn(className)}
        aria-label="Cerrar sesión"
        title="Cerrar sesión"
      >
        {iconOnly ? (
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 3v9" />
            <path d="M7.05 5.52a8 8 0 1 0 9.9 0" />
          </svg>
        ) : (
          'Cerrar sesión'
        )}
      </Button>
    </form>
  );
}
