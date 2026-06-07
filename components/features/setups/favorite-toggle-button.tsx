import { toggleSetupFavoriteAction } from '@/app/(app)/setups/actions';
import { FormPending } from '@/components/ui/form-pending';
import { Spinner } from '@/components/ui/spinner';

type FavoriteToggleButtonProps = {
  setupId: string;
  isFavorite: boolean;
  returnTo: string;
};

export function FavoriteToggleButton({ setupId, isFavorite, returnTo }: FavoriteToggleButtonProps) {
  return (
    <form action={toggleSetupFavoriteAction}>
      <input type="hidden" name="setupId" value={setupId} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <input type="hidden" name="makeFavorite" value={isFavorite ? '0' : '1'} />
      <FormPending>
        {(pending) => (
          <button
            type="submit"
            aria-label={isFavorite ? 'Quitar de favoritos' : 'Marcar como favorito'}
            title={isFavorite ? 'Quitar de favoritos' : 'Marcar como favorito'}
            disabled={pending}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition disabled:cursor-wait disabled:opacity-80 ${
              isFavorite
                ? 'border-[rgba(215,170,109,0.26)] bg-[rgba(215,170,109,0.12)] text-[#f1c487]'
                : 'border-white/10 bg-white/[0.03] text-muted hover:border-[rgba(215,170,109,0.24)] hover:text-[#f1c487]'
            }`}
          >
            {pending ? (
              <Spinner className="h-4 w-4" />
            ) : (
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill={isFavorite ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path
                  d="m12 3.8 2.5 5.07 5.6.82-4.05 3.94.95 5.57L12 16.56 7 19.2l.95-5.57L3.9 9.69l5.6-.82L12 3.8Z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        )}
      </FormPending>
    </form>
  );
}
