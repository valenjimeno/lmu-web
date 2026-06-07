import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';
import { FormPending } from '@/components/ui/form-pending';
import { Spinner } from '@/components/ui/spinner';

type LogoutButtonProps = {
  className?: string;
  iconOnly?: boolean;
  fullWidth?: boolean;
};

export function LogoutButton({
  className,
  iconOnly = false,
  fullWidth = false,
}: LogoutButtonProps) {
  return (
    <form action="/auth/signout" method="post" className={cn(fullWidth ? 'w-full' : undefined)}>
      <FormPending>
        {(pending) => (
          <Button
            type="submit"
            variant="ghost"
            className={cn(className)}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            disabled={pending}
            isLoading={pending && !iconOnly}
            loadingLabel="Cerrando sesión..."
          >
            {iconOnly ? (
              pending ? (
                <Spinner className="h-4 w-4" />
              ) : (
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
              )
            ) : (
              'Cerrar sesión'
            )}
          </Button>
        )}
      </FormPending>
    </form>
  );
}
