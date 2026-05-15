import { toggleSetupFavoriteAction } from '@/app/(app)/setups/actions';

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
      <button
        type="submit"
        aria-label={isFavorite ? 'Quitar de favoritos' : 'Marcar como favorito'}
        title={isFavorite ? 'Quitar de favoritos' : 'Marcar como favorito'}
        className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition ${
          isFavorite
            ? 'border-[#ff9a4a55] bg-[#ff7a181f] text-[#ffb14f]'
            : 'border-white/10 bg-white/4 text-muted hover:border-[#ff9a4a55] hover:text-[#ffb14f]'
        }`}
      >
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
      </button>
    </form>
  );
}
