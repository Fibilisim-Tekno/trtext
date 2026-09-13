# trtext

[![npm version](https://img.shields.io/npm/v/trtext.svg)](https://www.npmjs.com/package/trtext)
[![npm downloads](https://img.shields.io/npm/dm/trtext.svg)](https://www.npmjs.com/package/trtext)
[![CI](https://github.com/Fibilisim-Tekno/trtext/actions/workflows/ci.yml/badge.svg)](https://github.com/Fibilisim-Tekno/trtext/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/trtext.svg)](./LICENSE)
[![zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen.svg)](./package.json)

Turkish-correct string operations for JavaScript and TypeScript. Zero
dependencies, no ICU data required, pure functions only.

## The problem

`String.prototype.toLowerCase()` is deliberately locale-independent, so it is
wrong for Turkish:

```js
"I".toLowerCase() // "i"  — should be "ı"
"İ".toLowerCase() // "i̇" — an "i" plus a combining dot above, length 2
"i".toUpperCase() // "I"  — should be "İ"
```

This is the [Turkish locale
bug](https://mattryall.net/blog/the-infamous-turkish-locale-bug), and it keeps
resurfacing: it has hit the [Kotlin
compiler](https://news.ycombinator.com/item?id=45559767),
[Gradle](https://github.com/gradle/gradle/issues/1506) and
[Vaadin](https://github.com/vaadin/flow/issues/7705), among many others. The
usual symptom is an identifier, class name, file extension or user login that
silently stops matching on a Turkish machine.

## What about `toLocaleLowerCase("tr")`?

**It works, and you should use it when you can.** On a runtime that ships
Turkish ICU data it is correct, including the awkward cases:

```js
"İ".toLocaleLowerCase("tr") // "i" — one character, no combining dot
"ISTANBUL".toLocaleLowerCase("tr") // "ıstanbul"
```

So this package is not here to fix `toLocaleLowerCase`. It exists for the cases
around it:

- **Runtimes without Turkish ICU data.** `toLocaleLowerCase("tr")` silently
  falls back to root-locale behaviour on a `small-icu` Node build, in some
  React Native setups and on older embedded runtimes. These functions carry
  their own mapping table, so the result never depends on how the host was
  compiled. Check what you have with
  `Intl.Collator.supportedLocalesOf(["tr"])`.
- **Everything `toLocaleLowerCase` does not do:** diacritic folding for search,
  ASCII transliteration, URL slugs and Turkish alphabet collation — the
  operations below.
- **Explicitness.** `foldTr(a) === foldTr(b)` is a deliberate comparison key,
  not a locale-tag argument that a refactor can drop.

If you already rely on ICU being present and you only need lowercasing, the
built-in is the right call and you do not need a dependency for it.

## Install

```sh
npm install trtext
```

## Usage

```js
import {
	toLowerCaseTr,
	toUpperCaseTr,
	foldTr,
	slugTr,
	sortTr,
	capitalizeTr,
} from "trtext"

toLowerCaseTr("İZMİR") // "izmir"
toLowerCaseTr("ISTANBUL") // "ıstanbul"
toUpperCaseTr("ığdır") // "IĞDIR"
capitalizeTr("istanbul") // "İstanbul"

foldTr("  ÇAĞRI  Merkezi ") // "cagri merkezi"
slugTr("Şanlıurfa'da Güneş") // "sanliurfada-gunes"

sortTr(["Üsküdar", "Zonguldak", "Çorum", "Iğdır"])
// ["Çorum", "Iğdır", "Üsküdar", "Zonguldak"]
```

### Case-insensitive search that actually works

The common bug is a user typing `istanbul` and not matching a stored
`İSTANBUL`. Fold both sides to one comparison key:

```js
const matches = cities.filter((city) => foldTr(city).includes(foldTr(query)))
```

## API

| Function | Description |
| --- | --- |
| `toLowerCaseTr(s)` | Lowercase with Turkish rules. `I` → `ı`, `İ` → `i`, and `I` + combining dot above → `i`. |
| `toUpperCaseTr(s)` | Uppercase with Turkish rules. `i` → `İ`, `ı` → `I`. |
| `capitalizeTr(s)` | First letter up, the rest down. |
| `titleCaseTr(s)` | Capitalize every word, preserving the original spacing. |
| `asciifyTr(s)` | Transliterate `çğıöşüâîû` to ASCII, preserving case. |
| `foldTr(s)` | Turkish lowercase + diacritics stripped + whitespace collapsed. A comparison key for search and deduplication. |
| `slugTr(s, opts?)` | URL slug. Options: `separator` (default `"-"`), `preserveTurkish` (default `false`). |
| `compareTr(a, b)` | Comparator for `Array.prototype.sort`, using Turkish alphabet order. |
| `sortTr(strings)` | New sorted array; the input is not mutated. |
| `TURKISH_ALPHABET` | The 29 letters in collation order. |

Collation follows the Turkish alphabet, where `ç` follows `c`, `ğ` follows
`g`, `ı` precedes `i`, `ö` follows `o`, `ş` follows `s` and `ü` follows `u`.
The test suite asserts that `sortTr` produces exactly the same order as
`Intl.Collator("tr")` on runtimes that ship Turkish collation data, and skips
rather than fails on runtimes that do not.

Characters outside the Turkish alphabet (digits, punctuation, foreign letters)
sort after it in code point order, so the ordering is always deterministic.

## Related work

- [`Intl.Collator`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Collator)
  and `toLocaleLowerCase("tr")` — the built-ins. Correct where ICU Turkish data
  is available; see the section above.
- [`slugify`](https://www.npmjs.com/package/slugify) — a general-purpose
  slugger with a much wider character map, but it lowercases with the default
  locale, so dotted and dotless `i` get mangled.
- [`turkish-deasciifier`](https://www.npmjs.com/package/turkish-deasciifier) —
  solves the opposite problem: guessing the missing diacritics in text typed on
  an ASCII keyboard.

## Development

```sh
npm install
npm test # builds, then runs the suite on the compiled output
```

## License

MIT

---

<details>
<summary>🇹🇷 Türkçe</summary>

### Neden gerekli

JavaScript'in `toLowerCase()` fonksiyonu bilinçli olarak yerel ayardan
bağımsızdır, bu yüzden Türkçede hatalı çalışır: `"I".toLowerCase()` sonucu
`"ı"` yerine `"i"` verir, `"İ".toLowerCase()` ise temiz bir `"i"` yerine
üzerinde birleşen nokta taşıyan iki karakterlik bir dize döndürür.

### `toLocaleLowerCase("tr")` ne olacak?

**O doğru çalışıyor** — Türkçe ICU verisi bulunan bir ortamda `"İ"` için tek
karakterlik temiz bir `"i"` döndürür. Bu paket onu düzeltmek için değil,
çevresindeki boşluklar için var: ICU verisi olmayan ortamlarda (`small-icu`
Node derlemeleri, bazı React Native kurulumları) sonucun ortama göre
değişmemesi için ve `toLocaleLowerCase`'in hiç yapmadığı işler için: arama
için diyakritik katlama, ASCII çevirisi, URL slug'ı ve Türk alfabesi
sıralaması.

Elinizde ICU varsa ve yalnızca küçük harfe çevirmek istiyorsanız, doğrusu
dildeki hazır fonksiyonu kullanmaktır; buna bağımlılık eklemeniz gerekmez.

### En sık görülen sorun

Kullanıcı `istanbul` yazıyor, veritabanındaki `İSTANBUL` kaydı bulunamıyor.
`foldTr` her iki tarafı tek bir karşılaştırma anahtarına indirger ve sorun
ortadan kalkar.

### Kurulum ve kullanım

```sh
npm install trtext
```

```js
import { toLowerCaseTr, slugTr, sortTr } from "trtext"

toLowerCaseTr("İZMİR") // "izmir"
slugTr("Şanlıurfa'da Güneş") // "sanliurfada-gunes"
sortTr(["Üsküdar", "Çorum"]) // ["Çorum", "Üsküdar"]
```

Sıralama Türk alfabesi düzenini izler: `ç` harfi `c`'den, `ğ` harfi `g`'den,
`ö` harfi `o`'dan, `ş` harfi `s`'den ve `ü` harfi `u`'dan sonra gelir; `ı`
harfi `i`'den önce gelir. Testler, Türkçe sıralama verisi bulunan ortamlarda
sonucun `Intl.Collator("tr")` ile birebir aynı olduğunu doğrular.

Tüm fonksiyonların listesi için yukarıdaki API tablosuna bakın. Katkılar ve
hata bildirimleri memnuniyetle karşılanır.

</details>
