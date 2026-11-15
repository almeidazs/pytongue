# Tests

| Layer | Where | What it proves |
| --- | --- | --- |
| Corpus | `tests/cases/**/*.py` | Each file is analyzed and emitted; output is compared with golden baselines. |
| Checker types | `tests/e2e/types.test.ts` | What the real TypeScript 7.1 checker sees per export (`.types` baselines); an emitted module must type-check. |
| LSP | `tests/e2e/lsp.test.ts` | Hover, definition, references and diagnostics through `tsc --lsp`. |
| Runtime | `tests/runtime`, `tests/e2e/runtime.test.ts` | Real uv workers: errors, streams, crashes, Node and Bun. |
| Properties | `tests/engine/properties.test.ts`, `tests/e2e/generated.test.ts` | fast-check: the mapper never throws, output is well-formed, generated signatures round-trip through the real worker. |
| Python worker | `python/tests` | pytest + Hypothesis for `pytongue_bridge`. |

## Corpus cases

A case is one `.py` file. Leading comments are directives:

- `# @strict: true` turns on strict mode.
- `# @filename: other.py` starts another file of the same case (text before it is `main.py`).
- `# E:7 pytongue1002` at the end of a line expects that diagnostic there (column optional).
- Files named `valid*` must say `# should not generate diagnostics` and produce none.

Baselines live in `tests/baselines/reference/`; each run writes what it produced to
`tests/baselines/local/` (ignored), so `git diff --no-index` shows a change. Accept new output with:

```bash
bun run baselines          # or: UPDATE_BASELINES=1 bun test
PYTONGUE_CASES=models bun test tests/engine/corpus.test.ts   # one folder
```

Review baseline diffs like code: a baseline locks behaviour in.

## Fuzzing

Pushes use a fixed seed. `bun run fuzz` runs the heavy version with a random seed;
`PYTONGUE_FUZZ_SEED=<n>` replays one.
