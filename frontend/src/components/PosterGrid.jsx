export const GRID = "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-8";

/** Grille d'affiches fluide (sans dizaines d'IntersectionObservers simultanés). */
export default function PosterGrid({ items, getKey, render }) {
  return (
    <div className={GRID}>
      {items.map((item) => (
        <div key={getKey(item)}>
          {render(item)}
        </div>
      ))}
    </div>
  );
}

export function PosterSkeleton({ count = 12, withAction = false }) {
  return (
    <div className={GRID} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          <div className="aspect-[2/3] rounded-xl skeleton" />
          <div className="h-3 w-3/4 mt-3 rounded skeleton" />
          <div className="h-2.5 w-1/3 mt-1.5 rounded skeleton" />
          {withAction && <div className="h-8 w-full mt-3 rounded-full skeleton" />}
        </div>
      ))}
    </div>
  );
}
