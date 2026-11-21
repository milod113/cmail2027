/**
 * Génération intelligente et réutilisable du code d'un poste.
 *
 * Objectif : proposer un code institutionnel court, lisible et stable,
 * construit à partir du département de rattachement et du titre du poste.
 *
 * Format : PREFIXE_DEPARTEMENT + "-" + SUFFIXE_POSTE
 * Exemples :
 *   Direction Générale        + Directeur Général  -> DG-DIR
 *   Sous-direction Numérisation + Sous-directeur   -> SDN-SDIR
 *   Bureau Communication      + Chef de bureau     -> BCOM-CHEF
 *   Bureau Réseaux            + Responsable        -> BRES-RESP
 *   Bureau Développement      + Secrétaire         -> BDEV-SEC
 *
 * La logique est volontairement pure (aucune dépendance React) afin d'être
 * réutilisable dans les pages Create et Edit des postes, et transposable
 * côté backend si la règle doit un jour être centralisée.
 */

const DIACRITICS_REGEX = /[\u0300-\u036f]/g;

/** Mots courants ignorés lors de la dérivation d'initiales. */
const STOP_WORDS = new Set([
    'le', 'la', 'les', 'de', 'des', 'du', 'd', 'l',
    'et', 'en', 'au', 'aux', 'a', 'pour', 'par', 'sur', 'dans', 'un', 'une',
]);

/**
 * Abréviations officielles à respecter en priorité.
 * Les clés sont des noms de départements normalisés (sans accents, minuscules).
 */
const DEPARTMENT_ALIASES: Record<string, string> = {
    'direction generale': 'DG',
    'secretariat general': 'SG',
    'direction des ressources humaines': 'DRH',
    'direction des systemes d information': 'DSI',
};

type PrefixStyle = 'initials' | 'compressed';

/**
 * Mots-clés de type hiérarchique reconnus en début de nom de département.
 * - "initials"   : le type est déjà explicite (D., SD.) -> on ajoute peu de lettres.
 * - "compressed" : le type seul est ambigu (B., S.) -> on compresse le mot distinctif.
 */
const DEPARTMENT_TYPES: Array<{
    keywords: string[];
    base: string;
    fallback: string;
    style: PrefixStyle;
    initialsCap: number;
}> = [
    { keywords: ['sous', 'direction'], base: 'SD', fallback: 'SD', style: 'initials', initialsCap: 2 },
    { keywords: ['direction'], base: 'D', fallback: 'DIR', style: 'initials', initialsCap: 3 },
    { keywords: ['bureau'], base: 'B', fallback: 'BUR', style: 'compressed', initialsCap: 3 },
    { keywords: ['service'], base: 'S', fallback: 'SRV', style: 'compressed', initialsCap: 3 },
    { keywords: ['departement'], base: 'DEP', fallback: 'DEP', style: 'compressed', initialsCap: 3 },
    { keywords: ['division'], base: 'DIV', fallback: 'DIV', style: 'compressed', initialsCap: 3 },
    { keywords: ['cellule'], base: 'CEL', fallback: 'CEL', style: 'compressed', initialsCap: 3 },
    { keywords: ['unite'], base: 'U', fallback: 'UNITE', style: 'compressed', initialsCap: 3 },
];

/**
 * Suffixes métier pour les titres de poste fréquents.
 * La correspondance se fait par préfixe de mots (du plus long au plus court),
 * donc "Directeur Général Adjoint" donne "DIR" comme "Directeur Général".
 */
const TITLE_SUFFIXES: Record<string, string> = {
    'directeur general': 'DIR',
    'directrice generale': 'DIR',
    'sous directeur': 'SDIR',
    'sous directrice': 'SDIR',
    'directeur': 'DIR',
    'directrice': 'DIR',
    'chef de bureau': 'CHEF',
    'chef de service': 'CHEF',
    'chef de departement': 'CHEF',
    'chef de division': 'CHEF',
    'chef service': 'CHEF',
    'chef': 'CHEF',
    'responsable': 'RESP',
    'secretaire general': 'SEC',
    'secretaire generale': 'SEC',
    'secretaire': 'SEC',
    'coordinateur': 'COORD',
    'coordonnateur': 'COORD',
    'coordinatrice': 'COORD',
    'assistant': 'ASSIST',
    'assistante': 'ASSIST',
    'infirmier': 'INFIRM',
    'infirmiere': 'INFIRM',
    'medecin': 'MED',
    'pharmacien': 'PHARMA',
    'pharmacienne': 'PHARMA',
    'technicien': 'TECH',
    'technicienne': 'TECH',
    'ingenieur': 'ING',
    'ingenieure': 'ING',
    'adjoint': 'ADJ',
    'adjointe': 'ADJ',
    'agent': 'AGENT',
    'auditeur': 'AUDIT',
    'inspecteur': 'INSP',
    'planificateur': 'PLAN',
    'statisticien': 'STAT',
    'archiviste': 'ARCH',
};

/** Normalise une chaîne : accents retirés, minuscules, séparateurs réduits à des espaces. */
function normalize(value: string): string {
    return value
        .normalize('NFD')
        .replace(DIACRITICS_REGEX, '')
        .replace(/[\u2019']/g, ' ')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim()
        .replace(/\s+/g, ' ');
}

/** Retourne les mots significatifs (hors mots vides) d'une chaîne normalisée. */
function significantWords(value: string): string[] {
    return normalize(value)
        .split(' ')
        .filter((word) => word.length > 0 && !STOP_WORDS.has(word));
}

/** Construit les initiales d'une liste de mots, plafonnées à maxLength caractères. */
function initials(words: string[], maxLength: number): string {
    return words
        .map((word) => word.charAt(0))
        .join('')
        .slice(0, maxLength);
}

/** Forme canonique utilisée pour comparer deux codes entre eux. */
function canonicalCode(code: string): string {
    return code.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/**
 * Dérive le préfixe département depuis son nom (et éventuellement son type hiérarchique).
 *
 * Ordre de résolution :
 * 1. alias officiel exact ;
 * 2. mot-clé de type reconnu au début du nom (Direction, Sous-direction, Bureau...) ;
 * 3. mot-clé de type reconnu dans le level_type du département ;
 * 4. repli générique sur les initiales des mots significatifs.
 */
export function deriveDepartmentPrefix(rawName: string, rawLevelType?: string | null): string {
    const normalizedName = normalize(rawName);

    if (!normalizedName) {
        return '';
    }

    const alias = DEPARTMENT_ALIASES[normalizedName];
    if (alias) {
        return alias;
    }

    const words = normalizedName.split(' ');

    for (const type of DEPARTMENT_TYPES) {
        if (!type.keywords.every((keyword, index) => words[index] === keyword)) {
            continue;
        }

        const rest = significantWords(words.slice(type.keywords.length).join(' '));
        return buildTypedPrefix(type, rest);
    }

    // Le nom ne commence pas par un type connu : on tente le level_type (ex. "Bureau").
    if (rawLevelType) {
        const levelWords = normalize(rawLevelType).split(' ');

        for (const type of DEPARTMENT_TYPES) {
            if (!type.keywords.every((keyword, index) => levelWords[index] === keyword)) {
                continue;
            }

            return buildTypedPrefix(type, significantWords(normalizedName));
        }
    }

    // Repli générique : initiales des mots significatifs.
    const rest = significantWords(normalizedName);
    if (rest.length === 0) {
        return '';
    }

    if (rest.length === 1) {
        return rest[0].slice(0, 3).toUpperCase();
    }

    return initials(rest, 4).toUpperCase();
}

/** Assemble le préfixe d'un département dont le type hiérarchique est identifié. */
function buildTypedPrefix(
    type: { base: string; fallback: string; style: PrefixStyle; initialsCap: number },
    rest: string[],
): string {
    if (rest.length === 0) {
        return type.fallback;
    }

    if (type.style === 'initials') {
        return (type.base + initials(rest, type.initialsCap)).toUpperCase();
    }

    // Style compressé : un seul mot distinctif -> on en garde les premières lettres.
    if (rest.length === 1) {
        return (type.base + rest[0].slice(0, 3)).toUpperCase();
    }

    // Plusieurs mots distinctifs : un type déjà explicite (DEP, DIV, CEL...) laisse
    // place aux initiales seules ; un type court (B, S, U...) est enrichi par elles.
    const suffixInitials = initials(rest, type.initialsCap);

    if (type.base.length >= 3) {
        return suffixInitials.toUpperCase();
    }

    return (type.base + suffixInitials).toUpperCase();
}

/**
 * Dérive le suffixe poste depuis le titre.
 * Dictionnaire métier d'abord, puis repli sur les initiales des mots significatifs.
 */
export function derivePositionSuffix(rawTitle: string): string {
    const normalizedTitle = normalize(rawTitle);

    if (!normalizedTitle) {
        return '';
    }

    const entries = Object.entries(TITLE_SUFFIXES).sort((a, b) => b[0].length - a[0].length);

    for (const [key, suffix] of entries) {
        if (normalizedTitle === key || normalizedTitle.startsWith(`${key} `)) {
            return suffix;
        }
    }

    const words = significantWords(normalizedTitle);
    if (words.length === 0) {
        return '';
    }

    if (words.length === 1) {
        return words[0].slice(0, 4).toUpperCase();
    }

    return initials(words, 4).toUpperCase();
}

export type PositionCodeParts = {
    prefix: string;
    suffix: string;
};

/** Retourne les deux briques du code (préfixe département / suffixe poste), sans assemblage. */
export function getPositionCodeParts(
    departmentName?: string | null,
    title?: string | null,
    departmentLevelType?: string | null,
): PositionCodeParts {
    return {
        prefix: deriveDepartmentPrefix(departmentName ?? '', departmentLevelType),
        suffix: derivePositionSuffix(title ?? ''),
    };
}

export type PositionCodeSuggestionInput = {
    departmentName?: string | null;
    departmentLevelType?: string | null;
    title?: string | null;
    /** Codes déjà présents en base, pour garantir une suggestion disponible. */
    existingCodes?: readonly string[] | null;
};

/**
 * Suggère un code complet et unique pour un poste.
 * Les parties manquantes sont simplement omises : la suggestion reste
 * "incomplète mais honnête" tant que le formulaire n'est pas assez renseigné.
 */
export function suggestPositionCode(input: PositionCodeSuggestionInput): string {
    const { prefix, suffix } = getPositionCodeParts(
        input.departmentName,
        input.title,
        input.departmentLevelType,
    );

    const base = [prefix, suffix]
        .filter(Boolean)
        .join('-')
        .toUpperCase();

    if (!base) {
        return '';
    }

    return makeUniqueCode(base, input.existingCodes ?? []);
}

/** Ajoute un suffixe numérique (-2, -3, ...) si le code de base est déjà pris. */
function makeUniqueCode(base: string, existingCodes: readonly string[]): string {
    const takenCodes = new Set(existingCodes.map(canonicalCode));

    if (!takenCodes.has(canonicalCode(base))) {
        return base;
    }

    for (let attempt = 2; attempt <= 99; attempt += 1) {
        const candidate = `${base}-${attempt}`;

        if (!takenCodes.has(canonicalCode(candidate))) {
            return candidate;
        }
    }

    // Repli extrêmement improbable : le backend validera l'unicité de toute façon.
    return base;
}

/** Indique si un code saisi correspond déjà à un autre poste (aide live en UI). */
export function isPositionCodeTaken(code: string, existingCodes?: readonly string[] | null): boolean {
    const trimmed = code.trim();

    if (!trimmed || !existingCodes || existingCodes.length === 0) {
        return false;
    }

    const canonical = canonicalCode(trimmed);

    return existingCodes.some((existing) => canonicalCode(existing) === canonical);
}