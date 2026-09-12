import assert from "node:assert/strict"
import test from "node:test"

import {
	TURKISH_ALPHABET,
	asciifyTr,
	capitalizeTr,
	compareTr,
	foldTr,
	slugTr,
	sortTr,
	titleCaseTr,
	toLowerCaseTr,
	toUpperCaseTr,
} from "../dist/index.js"

test("toLowerCaseTr maps dotted and dotless i correctly", () => {
	assert.equal(toLowerCaseTr("ISTANBUL"), "\u0131stanbul")
	assert.equal(toLowerCaseTr("\u0130ZM\u0130R"), "izmir")
	assert.equal(toLowerCaseTr("I\u011eDIR"), "\u0131\u011fd\u0131r")
	assert.equal(toLowerCaseTr("TU\u011eBA"), "tu\u011fba")
})

test("toLowerCaseTr collapses I plus combining dot above into i", () => {
	// This is exactly what String.prototype.toLowerCase() leaves behind for İ.
	const decomposed = "I\u0307"
	assert.equal(toLowerCaseTr(decomposed), "i")
	assert.equal(toLowerCaseTr(decomposed).length, 1)
})

test("toLowerCaseTr fixes the behaviour plain toLowerCase gets wrong", () => {
	assert.notEqual("I".toLowerCase(), "\u0131")
	assert.equal(toLowerCaseTr("I"), "\u0131")
	assert.notEqual("\u0130".toLowerCase(), "i")
	assert.equal(toLowerCaseTr("\u0130"), "i")
})

test("toUpperCaseTr maps i to \u0130 and \u0131 to I", () => {
	assert.equal(toUpperCaseTr("istanbul"), "\u0130STANBUL")
	assert.equal(toUpperCaseTr("\u0131\u011fd\u0131r"), "I\u011eDIR")
	assert.equal(toUpperCaseTr("i\u011fne"), "\u0130\u011eNE")
})

test("case conversion round-trips across the Turkish alphabet", () => {
	const lower = TURKISH_ALPHABET.join("")
	assert.equal(toLowerCaseTr(toUpperCaseTr(lower)), lower)
})

test("empty and non-letter input is preserved", () => {
	for (const value of ["", "   ", "1234", "!?-_", "\u{1F600}"]) {
		assert.equal(toLowerCaseTr(value), value.toLowerCase())
		assert.equal(toUpperCaseTr(value), value.toUpperCase())
	}
})

test("asciifyTr transliterates Turkish letters and keeps case", () => {
	assert.equal(asciifyTr("\u00c7i\u011fdem \u015eahin"), "Cigdem Sahin")
	assert.equal(asciifyTr("\u00d6ZG\u00dcR"), "OZGUR")
	assert.equal(asciifyTr("\u0131\u0131\u0131"), "iii")
	assert.equal(asciifyTr("hello"), "hello")
})

test("foldTr produces one comparison key regardless of casing", () => {
	assert.equal(foldTr("\u0130STANBUL"), "istanbul")
	assert.equal(foldTr("istanbul"), "istanbul")
	assert.equal(foldTr("\u0131stanbul"), "istanbul")
	assert.equal(foldTr("  \u00c7A\u011eRI  Merkezi "), "cagri merkezi")
	assert.equal(foldTr("A\u011eRI"), "agri")
})

test("slugTr lowercases with Turkish rules before transliterating", () => {
	assert.equal(slugTr("\u015ei\u015fli G\u00fczel \u00c7ay"), "sisli-guzel-cay")
	assert.equal(slugTr("I\u011eDIR"), "igdir")
	assert.equal(slugTr("\u015eanl\u0131urfa'da G\u00fcne\u015f"), "sanliurfada-gunes")
	assert.equal(slugTr("\u0130stanbul \u2014 Kad\u0131k\u00f6y"), "istanbul-kadikoy")
})

test("slugTr trims and collapses separators", () => {
	assert.equal(slugTr("  --- Merhaba   D\u00fcnya ---  "), "merhaba-dunya")
	assert.equal(slugTr("a//b//c"), "a-b-c")
	assert.equal(slugTr(""), "")
	assert.equal(slugTr("!!!"), "")
})

test("slugTr honours separator and preserveTurkish options", () => {
	assert.equal(slugTr("G\u00fczel Yaz", { separator: "_" }), "guzel_yaz")
	assert.equal(
		slugTr("G\u00fczel Yaz", { preserveTurkish: true }),
		"g\u00fczel-yaz",
	)
})

test("compareTr orders the Turkish alphabet correctly", () => {
	assert.ok(compareTr("c", "\u00e7") < 0)
	assert.ok(compareTr("g", "\u011f") < 0)
	assert.ok(compareTr("\u0131", "i") < 0)
	assert.ok(compareTr("o", "\u00f6") < 0)
	assert.ok(compareTr("s", "\u015f") < 0)
	assert.ok(compareTr("u", "\u00fc") < 0)
	assert.equal(compareTr("ali", "AL\u0130"), 0)
})

test("sortTr sorts words the way a Turkish reader expects", () => {
	assert.deepEqual(
		sortTr(["\u00e7ilek", "cam", "\u0131spanak", "incir"]),
		["cam", "\u00e7ilek", "\u0131spanak", "incir"],
	)
	assert.deepEqual(
		sortTr(["\u00dcsk\u00fcdar", "Zonguldak", "\u00c7orum", "I\u011fd\u0131r"]),
		["\u00c7orum", "I\u011fd\u0131r", "\u00dcsk\u00fcdar", "Zonguldak"],
	)
	assert.ok(compareTr("\u015femsiye", "tabak") < 0)
})

test("sortTr does not mutate its input", () => {
	const input = ["b", "a"]
	const output = sortTr(input)
	assert.deepEqual(input, ["b", "a"])
	assert.deepEqual(output, ["a", "b"])
})

test("sortTr agrees with Intl.Collator('tr') when the runtime has the data", (t) => {
	const words = [
		"cam",
		"\u00e7ilek",
		"gemi",
		"\u011frlamak",
		"\u0131spanak",
		"incir",
		"okul",
		"\u00f6\u011frenci",
		"sabun",
		"\u015feker",
		"uzak",
		"\u00fczg\u00fcn",
	]
	const collator = new Intl.Collator("tr")
	if (collator.resolvedOptions().locale.split("-")[0] !== "tr") {
		t.skip("runtime has no Turkish collation data")
		return
	}
	assert.deepEqual(sortTr(words), [...words].sort(collator.compare))
})

test("capitalizeTr and titleCaseTr use Turkish casing", () => {
	assert.equal(capitalizeTr("istanbul"), "\u0130stanbul")
	assert.equal(capitalizeTr("\u0131\u015f\u0131k"), "I\u015f\u0131k")
	assert.equal(capitalizeTr("\u0130ZM\u0130R"), "\u0130zmir")
	assert.equal(capitalizeTr(""), "")
	assert.equal(
		titleCaseTr("\u0131\u015f\u0131k  \u0131lg\u0131n"),
		"I\u015f\u0131k  Ilg\u0131n",
	)
	assert.equal(titleCaseTr("ali veli"), "Ali Veli")
})

test("all exported functions are pure with respect to their input", () => {
	const input = "\u0130STANBUL \u00c7i\u011fdem"
	const before = input
	for (const fn of [
		toLowerCaseTr,
		toUpperCaseTr,
		asciifyTr,
		foldTr,
		slugTr,
		capitalizeTr,
		titleCaseTr,
	]) {
		fn(input)
	}
	assert.equal(input, before)
})
