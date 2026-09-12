/**
 * Turkish-correct text utilities. Zero dependencies.
 *
 * Why this exists: JavaScript's `toLowerCase()` / `toUpperCase()` are
 * locale-independent, so `"I".toLowerCase()` returns `"i"` instead of the
 * Turkish `"ı"`, and `"İ".toLowerCase()` returns `"i\u0307"` (an `i` plus a
 * combining dot above) rather than a clean `"i"`. `toLocaleLowerCase("tr")`
 * fixes the first case but still depends on the host ICU build and still
 * leaves the combining mark behind in the second. These helpers are explicit
 * and deterministic on every runtime.
 */

const COMBINING_DOT_ABOVE = "\u0307"

/**
 * Lowercase a string using Turkish rules.
 *
 * - `I` -> `ı`
 * - `İ` (U+0130) -> `i`
 * - `I` followed by a combining dot above -> `i`
 *
 * @example
 * toLowerCaseTr("ISTANBUL") // "ıstanbul"
 * toLowerCaseTr("İZMİR") // "izmir"
 */
export function toLowerCaseTr(input: string): string {
	if (input.length === 0) return input
	let out = ""
	for (let i = 0; i < input.length; i++) {
		const ch = input[i] as string
		if (ch === "I") {
			if (input[i + 1] === COMBINING_DOT_ABOVE) {
				out += "i"
				i++
			} else {
				out += "ı"
			}
			continue
		}
		if (ch === "\u0130") {
			out += "i"
			continue
		}
		out += ch.toLowerCase()
	}
	return out
}

/**
 * Uppercase a string using Turkish rules.
 *
 * - `i` -> `İ`
 * - `ı` -> `I`
 *
 * @example
 * toUpperCaseTr("iğne") // "İĞNE"
 */
export function toUpperCaseTr(input: string): string {
	if (input.length === 0) return input
	let out = ""
	for (const ch of input) {
		if (ch === "i") {
			out += "\u0130"
			continue
		}
		if (ch === "ı") {
			out += "I"
			continue
		}
		out += ch.toUpperCase()
	}
	return out
}

const ASCII_MAP: Record<string, string> = {
	ç: "c",
	ğ: "g",
	ı: "i",
	ö: "o",
	ş: "s",
	ü: "u",
	"â": "a",
	"î": "i",
	"û": "u",
	Ç: "C",
	Ğ: "G",
	Ö: "O",
	Ş: "S",
	Ü: "U",
	"\u0130": "I",
	"Â": "A",
	"Î": "I",
	"Û": "U",
}

/**
 * Replace Turkish-specific letters with their closest ASCII equivalents,
 * preserving letter case. Characters outside the Turkish set are untouched.
 *
 * @example
 * asciifyTr("Çiğdem Şahin") // "Cigdem Sahin"
 */
export function asciifyTr(input: string): string {
	let out = ""
	for (const ch of input) {
		out += ASCII_MAP[ch] ?? ch
	}
	return out
}

/**
 * Normalize a string for case-insensitive, diacritic-insensitive comparison
 * and search. Applies Turkish lowercasing, then strips Turkish diacritics,
 * then collapses whitespace.
 *
 * Both `"İSTANBUL"` and `"istanbul"` fold to `"istanbul"`, so user input
 * matches stored data regardless of how either was capitalized.
 *
 * @example
 * foldTr("  ÇAĞRI  Merkezi ") // "cagri merkezi"
 */
export function foldTr(input: string): string {
	return asciifyTr(toLowerCaseTr(input)).replace(/\s+/g, " ").trim()
}

export type SlugOptions = {
	/** Separator between words. Defaults to `"-"`. */
	separator?: string
	/**
	 * Keep Turkish letters instead of transliterating them to ASCII.
	 * Defaults to `false`, which is what URLs almost always want.
	 */
	preserveTurkish?: boolean
}

/**
 * Build a URL-safe slug from Turkish text.
 *
 * Unlike generic slug libraries, this lowercases with Turkish rules first, so
 * dotted and dotless `i` survive the round trip instead of being mangled by
 * the default locale.
 *
 * @example
 * slugTr("Şanlıurfa'da Güneş") // "sanliurfada-gunes"
 */
export function slugTr(input: string, options: SlugOptions = {}): string {
	const separator = options.separator ?? "-"
	const lowered = toLowerCaseTr(input)
	const base = options.preserveTurkish ? lowered : asciifyTr(lowered)
	const allowed = options.preserveTurkish
		? /[^a-z0-9çğıöşü]+/g
		: /[^a-z0-9]+/g
	const slug = base
		.normalize("NFC")
		.replace(/['’`]/g, "")
		.replace(allowed, separator)
	const escaped = separator.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
	return slug
		.replace(new RegExp(`${escaped}{2,}`, "g"), separator)
		.replace(new RegExp(`^${escaped}|${escaped}$`, "g"), "")
}

/** The Turkish alphabet in collation order. */
export const TURKISH_ALPHABET = [
	"a",
	"b",
	"c",
	"ç",
	"d",
	"e",
	"f",
	"g",
	"ğ",
	"h",
	"ı",
	"i",
	"j",
	"k",
	"l",
	"m",
	"n",
	"o",
	"ö",
	"p",
	"r",
	"s",
	"ş",
	"t",
	"u",
	"ü",
	"v",
	"y",
	"z",
] as const

const COLLATION_RANK = new Map<string, number>(
	TURKISH_ALPHABET.map((letter, index) => [letter, index]),
)

function rankOf(ch: string): number {
	const rank = COLLATION_RANK.get(ch)
	if (rank !== undefined) return rank
	// Unknown characters (digits, punctuation, foreign letters) sort after the
	// Turkish alphabet, in code point order, so ordering stays deterministic.
	return TURKISH_ALPHABET.length + (ch.codePointAt(0) ?? 0)
}

/**
 * Compare two strings using Turkish alphabet order, where `ç` follows `c`,
 * `ğ` follows `g`, `ı` precedes `i`, `ö` follows `o`, `ş` follows `s` and `ü`
 * follows `u`.
 *
 * Returns a negative number, zero, or a positive number, so it can be passed
 * straight to `Array.prototype.sort`.
 *
 * @example
 * ["çilek", "cam", "ıspanak", "incir"].sort(compareTr)
 * // ["cam", "çilek", "ıspanak", "incir"]
 */
export function compareTr(a: string, b: string): number {
	const left = [...toLowerCaseTr(a.normalize("NFC"))]
	const right = [...toLowerCaseTr(b.normalize("NFC"))]
	const length = Math.min(left.length, right.length)
	for (let i = 0; i < length; i++) {
		const diff = rankOf(left[i] as string) - rankOf(right[i] as string)
		if (diff !== 0) return diff
	}
	return left.length - right.length
}

/**
 * Sort an array of strings in Turkish alphabet order. Returns a new array and
 * leaves the input untouched.
 */
export function sortTr(values: ReadonlyArray<string>): Array<string> {
	return [...values].sort(compareTr)
}

/**
 * Uppercase the first letter of a string with Turkish rules and lowercase the
 * rest.
 *
 * @example
 * capitalizeTr("istanbul") // "İstanbul"
 */
export function capitalizeTr(input: string): string {
	if (input.length === 0) return input
	const chars = [...input]
	const first = chars[0] as string
	return toUpperCaseTr(first) + toLowerCaseTr(chars.slice(1).join(""))
}

/**
 * Capitalize every whitespace-separated word with Turkish rules, preserving
 * the original spacing.
 *
 * @example
 * titleCaseTr("ışık  ılgın") // "Işık  Ilgın"
 */
export function titleCaseTr(input: string): string {
	return input.replace(/\S+/g, (word) => capitalizeTr(word))
}
