import Image from "next/image";

/**
 * Bannière « hero » en tête de page (Conseils, Rumeurs…) : image plein cadre +
 * scrim dégradé vert de marque, titre et sous-titre superposés. Composant serveur
 * (aucun hook) — utilisable directement dans les pages serveur.
 */
export function PageBanner({
  image,
  titre,
  sous,
  priority = true,
}: {
  image: string;
  titre: string;
  sous?: string;
  priority?: boolean;
}) {
  return (
    <section className="relative mb-5 h-40 overflow-hidden rounded-2xl shadow-card sm:h-52 lg:h-60">
      <Image
        src={image}
        alt=""
        fill
        priority={priority}
        sizes="(max-width: 672px) 100vw, 672px"
        className="object-cover object-center"
      />
      {/* Scrim dégradé vert de marque, du bas vers le haut */}
      <div className="absolute inset-0 bg-gradient-to-t from-brand-700/95 via-brand-700/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
        <h1 className="text-2xl font-extrabold tracking-tight text-white drop-shadow sm:text-3xl">
          {titre}
        </h1>
        {sous && (
          <p className="mt-1.5 max-w-xl text-xs leading-snug text-white/90 sm:text-sm">{sous}</p>
        )}
      </div>
    </section>
  );
}
