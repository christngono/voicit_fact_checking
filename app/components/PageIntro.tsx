/** En-tête de page réutilisable — titre + sous-titre, style cohérent avec l'accueil. */
export function PageIntro({ titre, sous }: { titre: string; sous?: string }) {
  return (
    <header className="mb-5">
      <h1 className="text-2xl font-extrabold tracking-tight text-ink">{titre}</h1>
      {sous && <p className="mt-1 text-sm text-gray-500">{sous}</p>}
    </header>
  );
}
