/**
 * Dictionnaire de traduction FR / EN de VoCit.
 *
 * `en` est typé `typeof fr` : toute clé manquante ou en trop côté anglais
 * provoque une erreur de compilation → parité garantie entre les deux langues.
 *
 * Portée (décidée avec l'utilisateur) : INTERFACE + explications rédigées par le
 * LLM. Les libellés de preuves déterministes (`composantes`) et les conseils
 * restent en français pour l'instant (générés côté serveur).
 */

export type Locale = "fr" | "en";
export const LOCALES: Locale[] = ["fr", "en"];

export function isLocale(v: unknown): v is Locale {
  return v === "fr" || v === "en";
}

const fr = {
  tagline: "Vérifier avant de partager.",
  footer:
    "VoCit présente des preuves consultées, jamais un oracle. Le verdict est calculé par des règles transparentes à partir de sources vérifiables.",

  nav: {
    verifier: "Vérifier",
    radar: "Radar",
    conseils: "Conseils",
    rumeurs: "Rumeurs",
  },

  menu: {
    more: "Plus d'options",
    historique: "Historique",
    historiqueDesc: "Vos vérifications de cette session",
    apropos: "À propos",
    aproposDesc: "Qui est VoCit et comment ça marche",
    contester: "Contester un verdict",
    contesterDesc: "Signaler un verdict que vous jugez inexact",
    contact: "Contact / Partenaires",
    contactDesc: "Acteurs professionnels & accès API",
  },

  gate: {
    title: "Choisissez votre langue",
    subtitle: "Sélectionnez la langue de l'application.",
    fr: "Français",
    en: "English",
  },

  home: {
    helpTitle: "Comment ça marche —",
    helpBody:
      "choisissez le type de contenu ci-dessous (un texte, un lien d'article, une image… bientôt une vidéo ou un numéro), collez-le ou importez-le, puis touchez Vérifier. VoCit vous répond en quelques secondes avec un verdict, les preuves et les sources consultées. En cas de doute, ne partagez pas.",
    tabs: {
      texte: "Texte",
      lien: "Lien",
      image: "Image",
      video: "Vidéo",
      numero: "Numéro",
    },
    soon: "bientôt",
    textLabel: "Collez le message à vérifier",
    textPlaceholder:
      "Ex : MTN offre 50 000 FCFA de crédit gratuit, partagez à 10 contacts…",
    textHint:
      "Français, anglais, pidgin ou camfranglais — VoCit traduit avant d'analyser.",
    linkLabel: "Collez le lien de l'article à vérifier",
    linkPlaceholder: "https://exemple.cm/un-article…",
    linkHint:
      "VoCit ouvre la page, lit le titre, l'auteur et la date, vérifie le domaine et cherche des sources avant de conclure.",
    imageLabel: "Importez l'image à vérifier",
    imageChoose: "Choisir une image (capture, affiche, photo…)",
    imageFormats: "JPG, PNG ou WebP — max ~4,5 Mo",
    imageChange: "Changer",
    imageHint:
      "VoCit lit le texte de l'image (OCR), repère un éventuel montage et vérifie les affirmations véhiculées.",
    soonModuleA: "Module « ",
    soonModuleB: " » disponible à une prochaine étape de construction.",
    errNotImage: "Veuillez choisir un fichier image (JPG, PNG, WebP…).",
    errTooBig: "Image trop lourde (max ~4,5 Mo). Réduisez-la et réessayez.",
    btnVerify: "Vérifier",
    btnVerifyLink: "Vérifier le lien",
    btnVerifyImage: "Vérifier l'image",
    verifyAnother: "Vérifier un autre contenu",
    recentTitle: "Rumeurs récemment démenties",
  },

  analysing: "Analyse en cours…",

  steps: {
    text: {
      reception: "Réception du contenu",
      extraction: "Lecture et traduction",
      affirmations: "Identification des affirmations",
      corpus: "Recherche dans le corpus VoCit",
      web: "Recherche de sources sur le web",
      score: "Calcul du score",
    },
    link: {
      reception: "Réception du lien",
      page: "Récupération de la page",
      extraction: "Lecture du contenu",
      corpus: "Recherche dans le corpus VoCit",
      web: "Recherche de sources sur le web",
      score: "Calcul du score",
    },
    image: {
      reception: "Réception de l'image",
      extraction: "Lecture de l'image (OCR)",
      affirmations: "Affirmation véhiculée",
      corpus: "Recherche dans le corpus VoCit",
      web: "Recherche de sources sur le web",
      score: "Calcul du score",
    },
  },

  result: {
    evidenceTitle: "Ce que nous avons constaté",
    sourcesTitle: "Sources consultées",
    claimsTitle: "Affirmations examinées",
    adviceTitle: "Conseil de responsabilité numérique",
    scoreLabel: "indice de fiabilité",
    instantCorpus: "Réponse instantanée depuis le corpus VoCit",
    verifiedOn: "vérifié le",
    verifiedWeb: "Vérifié par recherche de sources",
    badges: {
      fiable: "source fiable",
      officiel: "site officiel",
      frauduleux: "domaine frauduleux",
      inconnu: "à vérifier",
    },
    statuts: {
      corroboree: "Corroborée",
      contredite: "Contredite",
      non_trouvee: "Non trouvée",
      non_verifiee: "Non vérifiée",
    },
  },

  extraction: {
    title: "Ce que VoCit a lu",
    claimsLabel: "Affirmations véhiculées",
    empty: "Aucun élément lisible n'a pu être extrait.",
    note: "Éléments extraits automatiquement, à titre indicatif. Ils ne décident pas du verdict.",
    champs: {
      ocr: "Texte détecté (OCR)",
      description: "Description visuelle",
      traduction: "Contenu (traduit si nécessaire)",
      titre: "Titre de la page",
      auteur: "Auteur",
      date: "Date de publication",
      domaine: "Domaine",
      fiabilite: "Fiabilité du domaine",
      extrait: "Extrait du contenu",
      ecart: "Écart entre le titre et le contenu",
    },
  },

  scoreInfo: {
    title: "Comment ce score est calculé",
    intro:
      "VoCit ne demande jamais à l'IA « est-ce vrai ? ». Le score part d'une base neutre, puis chaque indice vérifié ajoute ou retire des points selon une règle transparente et identique pour tous.",
    positive: "En faveur de la fiabilité",
    negative: "En défaveur",
    neutral: "À noter",
    provisional: "Score provisoire — preuves incomplètes",
    complete: "Score établi sur des preuves complètes",
    missingTitle: "Ce qui manque pour un score complet",
    missingIntro: "Le score ci-dessus reste valable, mais il serait plus solide avec :",
    missing: {
      recherche_web: "Une recherche web pour croiser les sources (non effectuée)",
      sources_fiables: "Au moins une source fiable ou officielle",
    } as Record<string, string>,
  },

  conseilsResp: {
    title: "Renforcer sa responsabilité numérique",
    sub: "Des réflexes simples pour reconnaître et stopper la désinformation.",
    items: [
      {
        titre: "Vérifiez la source",
        corps:
          "Avant de croire ou de partager, demandez-vous qui publie. Un site inconnu, une adresse bizarre ou l'absence d'auteur doivent alerter.",
      },
      {
        titre: "Méfiez-vous de l'émotion forte",
        corps:
          "La désinformation joue sur la peur, la colère ou l'indignation. Si un contenu vous fait réagir très fort, prenez le temps de vérifier avant de réagir.",
      },
      {
        titre: "Recoupez plusieurs sources",
        corps:
          "Une information vraie est en général reprise par plusieurs médias fiables. Si une seule page en parle, restez prudent.",
      },
      {
        titre: "Attention aux images et vidéos",
        corps:
          "Une photo peut être ancienne, sortie de son contexte ou fabriquée par IA. Cherchez l'origine de l'image avant de la croire.",
      },
      {
        titre: "Regardez toujours la date",
        corps:
          "De vieilles informations ressortent souvent comme si elles étaient récentes. Vérifiez la date de publication avant de relayer.",
      },
      {
        titre: "Dans le doute, ne partagez pas",
        corps:
          "Partager une fausse information, même sans le vouloir, cause du tort. Si vous n'êtes pas sûr, ne relayez pas : vérifiez ou signalez.",
      },
    ],
  },

  webNotice: {
    quotaTitle: "Recherche web non effectuée",
    quotaBody:
      "Le crédit d'API disponible est épuisé : VoCit n'a pas pu lancer la recherche web pour croiser les sources. Le résultat s'appuie donc uniquement sur les éléments déjà disponibles — il reste prudent.",
    errTitle: "Recherche web indisponible",
    errBody:
      "La recherche web n'a pas pu aboutir (service momentanément indisponible). Le résultat s'appuie uniquement sur les éléments déjà disponibles.",
  },

  niveaux: {
    fiable: "Fiable",
    douteux: "Douteux",
    faux: "Faux",
    insuffisant: "Éléments insuffisants",
  },

  hero: {
    label: "Messages de sensibilisation VoCit",
    slides: [
      {
        titre: "Vérifier avant de partager.",
        sous: "Un message douteux ? Envoyez-le, VoCit vous répond en quelques secondes.",
      },
      {
        titre: "Une fausse information n'est jamais sans conséquence.",
        sous: "Elle blesse, elle divise, elle peut mettre des vies en danger. Vérifiez avant de partager.",
      },
      {
        titre: "Une image, une voix, une vidéo peuvent être fabriquées.",
        sous: "L'intelligence artificielle rend le faux crédible. VoCit vous aide à faire la différence.",
      },
    ],
  },

  historique: {
    title: "Historique",
    sub: "Vos vérifications de cette session, sur cet appareil. Aucun compte, rien n'est envoyé au serveur.",
    empty: "Vous n'avez encore rien vérifié dans cette session.",
    verifyBtn: "Vérifier un contenu",
    clear: "Effacer l'historique",
  },

  rumeurs: {
    title: "Rumeurs",
    sub: "Le corpus public de VoCit : des cas déjà vérifiés, consultables sans rien soumettre. Une rumeur démentie une fois est démentie pour tout le monde.",
    unavailable: "Le corpus est momentanément indisponible.",
    verifiedOn: "Vérifié le",
  },

  radar: {
    title: "Radar",
    sub: "Cartographie des signalements par région du Cameroun.",
    demoBanner: "Données de démonstration",
    demoNote: "Chiffres fictifs, pour illustrer le fonctionnement du Radar.",
    top3Title: "Régions les plus actives",
    legendTitle: "Volume de signalements",
    legendLess: "Peu",
    legendMore: "Beaucoup",
    legendNoData: "Aucune donnée",
    hint: "Touchez une région de la carte pour voir son détail.",
    credit: "Contours administratifs : geoBoundaries (CC BY)",
    reports: "signalements",
    reportsRecensed: "recensés",
    updatedOn: "Mis à jour le",
    themeLabel: "Thème principal",
    evolutionTitle: "Évolution des signalements",
    noHistory: "Pas d'historique disponible.",
    close: "Fermer le détail",
    noData: "aucune donnée",
    types: {
      escroquerie: "Escroquerie",
      désinformation: "Désinformation",
      usurpation: "Usurpation d'identité",
    } as Record<string, string>,
  },

  conseilsPage: {
    title: "Conseils",
    sub: "Des réflexes simples pour reconnaître et stopper la désinformation au quotidien.",
  },

  contester: {
    title: "Contester un verdict",
    sub: "Un verdict vous semble inexact ? Signalez-le. Chaque verdict peut être contesté, et les cas ambigus sont examinés par des vérificateurs humains.",
    contentLabel: "Nom ou description du contenu",
    contentPlaceholder: "Ex : « MTN offre 50 000 FCFA de crédit gratuit »",
    reasonLabel: "Raison de la contestation",
    reasonPlaceholder:
      "Expliquez pourquoi le verdict vous semble inexact, avec des éléments ou sources si possible.",
    submit: "Envoyer la contestation",
    sentTitle: "Contestation transmise",
    sentBody:
      "Merci. Les cas contestés sont examinés par des vérificateurs humains. VoCit ne supprime aucun contenu : nous informons et corrigeons si les preuves le justifient.",
    again: "Contester un autre verdict",
    backHome: "Retour à la vérification",
  },

  contact: {
    title: "Contact / Partenaires",
    sub: "VoCit s'adresse aussi aux acteurs professionnels. Notre corpus et notre moteur de vérification sont accessibles via API.",
    offers: [
      {
        titre: "Médias & rédactions",
        desc: "Vérifiez rumeurs et contenus viraux avant publication, avec sources et verdict explicable.",
      },
      {
        titre: "Institutions & administrations",
        desc: "Démentez les faux communiqués et arnaques usurpant votre identité, à grande échelle.",
      },
      {
        titre: "Opérateurs & plateformes",
        desc: "Intégrez la vérification de contenus, de liens et de numéros via l'API VoCit.",
      },
    ],
    contactTitle: "Nous contacter",
    contactBody:
      "Vous représentez un média, une institution, un opérateur ou une plateforme intéressés par la vérification VoCit ou par un accès API ? Écrivez-nous.",
    note: "VoCit vérifie des faits, jamais des opinions. Aucun contenu n'est supprimé : nous informons et nous instruisons.",
  },

  apropos: {
    metaTitle: "À propos de VoCit — Vérifier avant de partager",
    title: "À propos de VoCit",
    intro:
      "VoCit (Voice of the Citizen) est une plateforme camerounaise qui aide chaque citoyen à vérifier un contenu douteux — texte, image, lien ou numéro de téléphone — avant de le croire ou de le partager.",
    whyTitle: "Pourquoi VoCit existe",
    whyBody: [
      "Le cyberespace camerounais est traversé chaque jour par des rumeurs, des contenus sortis de leur contexte, des images et des vidéos parfois générées par intelligence artificielle, et des tentatives d'escroquerie numérique. Beaucoup de citoyens veulent vérifier avant de partager, mais ils n'ont pas d'outil simple, rapide, et adapté à leur réalité pour le faire.",
      "VoCit répond à ce besoin. Vous soumettez un contenu, VoCit vous répond en quelques secondes.",
    ],
    howTitle: "Comment ça fonctionne",
    howIntro: "VoCit ne dit jamais simplement « vrai » ou « faux ». Il vous montre les preuves :",
    howList: [
      "Le contenu est d'abord comparé à notre corpus de rumeurs déjà vérifiées. S'il y correspond, la réponse est instantanée.",
      "S'il est nouveau, VoCit recherche des sources fiables sur le web pour établir les faits.",
      "Un score est calculé à partir de ces preuves — jamais deviné par une intelligence artificielle.",
      "Vous recevez le verdict, les sources consultées, et un conseil pour décider en connaissance de cause.",
    ],
    quote:
      "Notre principe : l'IA ne juge pas. Elle traduit, elle cherche, elle explique. Le verdict vient des preuves.",
    instructTitle: "VoCit vérifie, mais aussi instruit",
    instructBody: [
      "VoCit ne se limite pas à répondre « vrai » ou « faux ». À chaque vérification, la plateforme explique pourquoi un contenu est fiable ou non, quels signes permettent de le reconnaître, et quels réflexes adopter avant de partager. L'objectif est que chaque utilisateur devienne, avec le temps, plus autonome pour reconnaître seul une désinformation, sans dépendre uniquement de l'outil.",
      "C'est pour cela que VoCit accompagne aussi les citoyens, notamment les plus jeunes, à travers des contenus pédagogiques et des campagnes de sensibilisation à l'esprit critique et à l'usage responsable du numérique.",
    ],
    protectTitle: "Ce que VoCit protège",
    protect: [
      {
        titre: "La désinformation",
        desc: "Rumeurs, photos et vidéos sorties de leur contexte, faux communiqués.",
      },
      {
        titre: "Les escroqueries numériques",
        desc: "Faux dépôts Mobile Money, phishing, usurpations d'identité.",
      },
      {
        titre: "Les dérives de l'IA",
        desc: "Contenus trompeurs générés ou manipulés par intelligence artificielle.",
      },
    ],
    memoryTitle: "Une mémoire collective",
    memoryBody:
      "Chaque contenu vérifié enrichit un corpus commun, hébergé au Cameroun. Une rumeur démentie une fois est démentie pour toujours, pour tout le monde. C'est cette mémoire partagée qui rend VoCit plus utile chaque jour.",
    engageTitle: "Notre engagement",
    engageBody:
      "VoCit vérifie des faits, jamais des opinions. Nous ne supprimons aucun contenu : nous informons et nous instruisons. Chaque verdict peut être contesté, et les cas ambigus sont examinés par des vérificateurs humains.",
    closing: "Vérifier avant de partager.",
  },
};

const en: typeof fr = {
  tagline: "Check before you share.",
  footer:
    "VoCit shows the evidence it consulted, never an oracle. The verdict is computed by transparent rules from verifiable sources.",

  nav: {
    verifier: "Check",
    radar: "Radar",
    conseils: "Tips",
    rumeurs: "Rumors",
  },

  menu: {
    more: "More options",
    historique: "History",
    historiqueDesc: "Your checks from this session",
    apropos: "About",
    aproposDesc: "Who VoCit is and how it works",
    contester: "Contest a verdict",
    contesterDesc: "Report a verdict you find inaccurate",
    contact: "Contact / Partners",
    contactDesc: "Professional actors & API access",
  },

  gate: {
    title: "Choose your language",
    subtitle: "Select the app language.",
    fr: "Français",
    en: "English",
  },

  home: {
    helpTitle: "How it works —",
    helpBody:
      "choose the type of content below (a text, an article link, an image… soon a video or a phone number), paste or upload it, then tap Check. VoCit answers within seconds with a verdict, the evidence and the sources it consulted. When in doubt, don't share.",
    tabs: {
      texte: "Text",
      lien: "Link",
      image: "Image",
      video: "Video",
      numero: "Number",
    },
    soon: "soon",
    textLabel: "Paste the message to check",
    textPlaceholder:
      "E.g. MTN is giving 50,000 FCFA free credit, share to 10 contacts…",
    textHint:
      "French, English, Pidgin or Camfranglais — VoCit translates before analysing.",
    linkLabel: "Paste the article link to check",
    linkPlaceholder: "https://example.cm/an-article…",
    linkHint:
      "VoCit opens the page, reads the title, author and date, checks the domain and searches for sources before concluding.",
    imageLabel: "Upload the image to check",
    imageChoose: "Choose an image (screenshot, poster, photo…)",
    imageFormats: "JPG, PNG or WebP — max ~4.5 MB",
    imageChange: "Change",
    imageHint:
      "VoCit reads the text in the image (OCR), spots possible tampering and checks the claims it conveys.",
    soonModuleA: "The “",
    soonModuleB: "” module will be available in a future build step.",
    errNotImage: "Please choose an image file (JPG, PNG, WebP…).",
    errTooBig: "Image too large (max ~4.5 MB). Reduce it and try again.",
    btnVerify: "Check",
    btnVerifyLink: "Check the link",
    btnVerifyImage: "Check the image",
    verifyAnother: "Check another item",
    recentTitle: "Recently debunked rumors",
  },

  analysing: "Analysing…",

  steps: {
    text: {
      reception: "Content received",
      extraction: "Reading and translation",
      affirmations: "Identifying claims",
      corpus: "Searching the VoCit corpus",
      web: "Searching sources on the web",
      score: "Computing the score",
    },
    link: {
      reception: "Link received",
      page: "Fetching the page",
      extraction: "Reading the content",
      corpus: "Searching the VoCit corpus",
      web: "Searching sources on the web",
      score: "Computing the score",
    },
    image: {
      reception: "Image received",
      extraction: "Reading the image (OCR)",
      affirmations: "Conveyed claim",
      corpus: "Searching the VoCit corpus",
      web: "Searching sources on the web",
      score: "Computing the score",
    },
  },

  result: {
    evidenceTitle: "What we found",
    sourcesTitle: "Sources checked",
    claimsTitle: "Claims examined",
    adviceTitle: "Digital responsibility advice",
    scoreLabel: "reliability index",
    instantCorpus: "Instant answer from the VoCit corpus",
    verifiedOn: "checked on",
    verifiedWeb: "Verified by source search",
    badges: {
      fiable: "reliable source",
      officiel: "official site",
      frauduleux: "fraudulent domain",
      inconnu: "to be checked",
    },
    statuts: {
      corroboree: "Corroborated",
      contredite: "Contradicted",
      non_trouvee: "Not found",
      non_verifiee: "Not checked",
    },
  },

  extraction: {
    title: "What VoCit read",
    claimsLabel: "Conveyed claims",
    empty: "No readable element could be extracted.",
    note: "Automatically extracted, for information only. It does not decide the verdict.",
    champs: {
      ocr: "Detected text (OCR)",
      description: "Visual description",
      traduction: "Content (translated if needed)",
      titre: "Page title",
      auteur: "Author",
      date: "Publication date",
      domaine: "Domain",
      fiabilite: "Domain reliability",
      extrait: "Content excerpt",
      ecart: "Gap between title and content",
    },
  },

  scoreInfo: {
    title: "How this score is computed",
    intro:
      "VoCit never asks the AI “is this true?”. The score starts from a neutral baseline, then each verified signal adds or removes points under a transparent rule that is the same for everyone.",
    positive: "In favour of reliability",
    negative: "Against",
    neutral: "Worth noting",
    provisional: "Provisional score — incomplete evidence",
    complete: "Score based on complete evidence",
    missingTitle: "What is missing for a complete score",
    missingIntro: "The score above still holds, but it would be stronger with:",
    missing: {
      recherche_web: "A web search to cross-check sources (not performed)",
      sources_fiables: "At least one reliable or official source",
    } as Record<string, string>,
  },

  conseilsResp: {
    title: "Strengthen your digital responsibility",
    sub: "Simple reflexes to spot and stop disinformation.",
    items: [
      {
        titre: "Check the source",
        corps:
          "Before believing or sharing, ask who is publishing. An unknown site, an odd address or a missing author should raise a flag.",
      },
      {
        titre: "Beware of strong emotion",
        corps:
          "Disinformation plays on fear, anger or outrage. If a piece of content makes you react strongly, take time to verify before reacting.",
      },
      {
        titre: "Cross-check several sources",
        corps:
          "True information is usually reported by several reliable outlets. If only one page mentions it, stay cautious.",
      },
      {
        titre: "Watch out for images and videos",
        corps:
          "A photo may be old, taken out of context or AI-generated. Look for the origin of the image before believing it.",
      },
      {
        titre: "Always check the date",
        corps:
          "Old information often resurfaces as if it were recent. Check the publication date before relaying it.",
      },
      {
        titre: "When in doubt, don't share",
        corps:
          "Sharing false information, even unintentionally, causes harm. If you are not sure, don't relay it: verify or report it.",
      },
    ],
  },

  webNotice: {
    quotaTitle: "Web search not performed",
    quotaBody:
      "The available API credit is exhausted: VoCit could not run the web search to cross-check sources. The result therefore relies only on the elements already available — it stays cautious.",
    errTitle: "Web search unavailable",
    errBody:
      "The web search could not complete (service temporarily unavailable). The result relies only on the elements already available.",
  },

  niveaux: {
    fiable: "Reliable",
    douteux: "Doubtful",
    faux: "False",
    insuffisant: "Insufficient evidence",
  },

  hero: {
    label: "VoCit awareness messages",
    slides: [
      {
        titre: "Check before you share.",
        sous: "A doubtful message? Send it, VoCit answers within seconds.",
      },
      {
        titre: "False information is never without consequence.",
        sous: "It hurts, it divides, it can put lives at risk. Check before you share.",
      },
      {
        titre: "An image, a voice, a video can be fabricated.",
        sous: "Artificial intelligence makes fakes believable. VoCit helps you tell the difference.",
      },
    ],
  },

  historique: {
    title: "History",
    sub: "Your checks from this session, on this device. No account, nothing is sent to the server.",
    empty: "You haven't checked anything in this session yet.",
    verifyBtn: "Check an item",
    clear: "Clear history",
  },

  rumeurs: {
    title: "Rumors",
    sub: "VoCit's public corpus: cases already checked, browsable without submitting anything. A rumor debunked once is debunked for everyone.",
    unavailable: "The corpus is momentarily unavailable.",
    verifiedOn: "Checked on",
  },

  radar: {
    title: "Radar",
    sub: "Reports mapped by region across Cameroon.",
    demoBanner: "Demonstration data",
    demoNote: "Fictional figures, to illustrate how the Radar works.",
    top3Title: "Most active regions",
    legendTitle: "Report volume",
    legendLess: "Low",
    legendMore: "High",
    legendNoData: "No data",
    hint: "Tap a region on the map to see its details.",
    credit: "Administrative boundaries: geoBoundaries (CC BY)",
    reports: "reports",
    reportsRecensed: "recorded",
    updatedOn: "Updated on",
    themeLabel: "Main theme",
    evolutionTitle: "Reports over time",
    noHistory: "No history available.",
    close: "Close details",
    noData: "no data",
    types: {
      escroquerie: "Scam",
      désinformation: "Disinformation",
      usurpation: "Impersonation",
    } as Record<string, string>,
  },

  conseilsPage: {
    title: "Tips",
    sub: "Simple reflexes to spot and stop disinformation in everyday life.",
  },

  contester: {
    title: "Contest a verdict",
    sub: "A verdict seems inaccurate? Report it. Every verdict can be contested, and ambiguous cases are reviewed by human fact-checkers.",
    contentLabel: "Name or description of the content",
    contentPlaceholder: "E.g. “MTN is giving 50,000 FCFA free credit”",
    reasonLabel: "Reason for the challenge",
    reasonPlaceholder:
      "Explain why the verdict seems inaccurate, with evidence or sources if possible.",
    submit: "Send challenge",
    sentTitle: "Challenge submitted",
    sentBody:
      "Thank you. Contested cases are reviewed by human fact-checkers. VoCit removes no content: we inform and correct when the evidence warrants it.",
    again: "Contest another verdict",
    backHome: "Back to checking",
  },

  contact: {
    title: "Contact / Partners",
    sub: "VoCit also serves professional actors. Our corpus and verification engine are available via API.",
    offers: [
      {
        titre: "Media & newsrooms",
        desc: "Check rumors and viral content before publishing, with sources and an explainable verdict.",
      },
      {
        titre: "Institutions & government",
        desc: "Debunk fake press releases and scams impersonating you, at scale.",
      },
      {
        titre: "Operators & platforms",
        desc: "Integrate checking of content, links and phone numbers via the VoCit API.",
      },
    ],
    contactTitle: "Contact us",
    contactBody:
      "You represent a media outlet, an institution, an operator or a platform interested in VoCit checking or API access? Write to us.",
    note: "VoCit checks facts, never opinions. No content is removed: we inform and educate.",
  },

  apropos: {
    metaTitle: "About VoCit — Check before you share",
    title: "About VoCit",
    intro:
      "VoCit (Voice of the Citizen) is a Cameroonian platform that helps every citizen check a doubtful piece of content — text, image, link or phone number — before believing or sharing it.",
    whyTitle: "Why VoCit exists",
    whyBody: [
      "Cameroon's cyberspace is crossed every day by rumors, content taken out of context, images and videos sometimes generated by artificial intelligence, and digital scam attempts. Many citizens want to check before sharing, but they lack a simple, fast tool suited to their reality to do so.",
      "VoCit answers this need. You submit a piece of content, VoCit answers within seconds.",
    ],
    howTitle: "How it works",
    howIntro: "VoCit never simply says “true” or “false”. It shows you the evidence:",
    howList: [
      "The content is first compared to our corpus of already-checked rumors. If it matches, the answer is instant.",
      "If it is new, VoCit searches reliable sources on the web to establish the facts.",
      "A score is computed from this evidence — never guessed by an artificial intelligence.",
      "You receive the verdict, the sources consulted, and advice to decide with full knowledge.",
    ],
    quote:
      "Our principle: AI does not judge. It translates, it searches, it explains. The verdict comes from the evidence.",
    instructTitle: "VoCit checks, but also educates",
    instructBody: [
      "VoCit does not stop at answering “true” or “false”. With each check, the platform explains why a piece of content is reliable or not, which signs help recognise it, and which reflexes to adopt before sharing. The goal is that every user becomes, over time, more autonomous at recognising disinformation on their own, without relying solely on the tool.",
      "This is why VoCit also supports citizens, especially the youngest, through educational content and awareness campaigns on critical thinking and responsible use of digital tools.",
    ],
    protectTitle: "What VoCit protects against",
    protect: [
      {
        titre: "Disinformation",
        desc: "Rumors, photos and videos taken out of context, fake press releases.",
      },
      {
        titre: "Digital scams",
        desc: "Fake Mobile Money deposits, phishing, identity theft.",
      },
      {
        titre: "AI misuse",
        desc: "Misleading content generated or manipulated by artificial intelligence.",
      },
    ],
    memoryTitle: "A collective memory",
    memoryBody:
      "Every checked item enriches a shared corpus, hosted in Cameroon. A rumor debunked once is debunked forever, for everyone. It is this shared memory that makes VoCit more useful every day.",
    engageTitle: "Our commitment",
    engageBody:
      "VoCit checks facts, never opinions. We remove no content: we inform and educate. Every verdict can be contested, and ambiguous cases are reviewed by human fact-checkers.",
    closing: "Check before you share.",
  },
};

export const DICT: Record<Locale, typeof fr> = { fr, en };
export type Dict = typeof fr;

export function getDict(locale: Locale): Dict {
  return DICT[locale];
}
