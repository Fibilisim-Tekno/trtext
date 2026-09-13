# Contributing

Thanks for taking the time to help.

## Setup

```bash
git clone https://github.com/Fibilisim-Tekno/trtext.git
cd trtext
npm install
```

## Build and test

```bash
npm run build
node --test test/*.test.mjs
```

`npm test` runs both steps, and `prepublishOnly` runs `npm test`, so a broken
build cannot be published.

Tests are plain Node test-runner files under `test/`, written against the
compiled output in `dist/`. There is no test framework and there are no
runtime dependencies — please keep it that way.

## Guidelines

- Every behaviour change needs a test that fails before the fix.
- Keep the package dependency-free. Node's built-in `Intl` is allowed, but the
  casing and folding helpers must stay correct on runtimes built without full
  ICU data (for example `small-icu` Node builds), so do not replace their
  implementations with `toLocaleLowerCase`/`toLocaleUpperCase`.
- CI runs on Node 18, 20 and 22. Do not use APIs newer than Node 18.
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/)
  (`fix:`, `feat:`, `docs:`, `test:`, `chore:`).

## Reporting a bug

Please include the input string, the output you got, the output you expected,
and your Node version plus platform. If the bug is locale-related, also paste
the result of:

```js
new Intl.Collator("tr").resolvedOptions().locale
```

so we can tell whether your runtime ships Turkish ICU data.
