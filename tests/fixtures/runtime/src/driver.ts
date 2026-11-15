// Runs runtime scenarios and prints one JSON line per case. Driven by tests/runtime.test.ts under
// `node --import pytongue/register` and `bun --preload pytongue/register`.
import { PythonError, PythonValidationError, PythonWorkerError } from "pytongue";
import * as broken from "./broken.py";
import * as cases from "./cases.py";
import { double, quadruple } from "./pkg/mod.py";

type Outcome = { ok: true; value: unknown } | { ok: false; error: Record<string, unknown> };

async function run(name: string, fn: () => Promise<unknown>): Promise<void> {
  let outcome: Outcome;
  try {
    outcome = { ok: true, value: await fn() };
  } catch (e) {
    const err = e as Error & Record<string, unknown>;
    outcome = {
      ok: false,
      error: {
        class: err instanceof PythonValidationError ? "PythonValidationError" : err instanceof PythonError ? "PythonError" : err instanceof PythonWorkerError ? "PythonWorkerError" : err.constructor.name,
        pyType: err.pyType,
        message: err.message,
        exitCode: err.exitCode,
        errors: Array.isArray(err.errors) ? err.errors.length : undefined,
      },
    };
  }
  console.log(JSON.stringify({ case: name, ...outcome }));
}

const only = process.argv[2];
if (only === "uv-missing") {
  await run("uv-missing", () => cases.echo({ name: "x" }));
  process.exit(0);
}

await run("echo", () => cases.echo({ name: "pen" }));
await run("validation", () => cases.echo({ name: 42 } as never));
await run("exception", () => cases.fail("boom"));
await run("nan", () => cases.nan());
await run("big-int", () => cases.big());
await run("noisy", () => cases.noisy(21));
await run("date-in-out", () => cases.day_after(new Date("2026-11-15T00:00:00Z").toISOString().slice(0, 10)));
await run("void", () => cases.nothing());
await run("async-concurrent", async () => {
  const start = Date.now();
  const tags = await Promise.all([cases.sleepy(300, "a"), cases.sleepy(300, "b"), cases.sleepy(300, "c")]);
  return { tags, concurrent: Date.now() - start < 800 };
});
await run("sync-fifo", async () => {
  const results = await Promise.all([cases.ordered("first", 200), cases.ordered("second", 0), cases.ordered("third", 0)]);
  return { last: results[2], thread: await cases.thread_name() };
});
await run("generator", async () => {
  const out: number[] = [];
  for await (const i of cases.counter(4)) out.push(i);
  return out;
});
await run("generator-break-closes", async () => {
  const out: number[] = [];
  for await (const i of cases.forever()) {
    out.push(i);
    if (i === 2) break;
  }
  await new Promise((r) => setTimeout(r, 200));
  return { out, closed: await cases.closed() };
});
await run("abandoned-iterator-closes", async () => {
  const collect = (globalThis as { gc?: () => void }).gc ?? (globalThis as { Bun?: { gc(force: boolean): void } }).Bun?.gc.bind(null, true);
  if (!collect) return "no gc exposed";
  await (async () => {
    const it = cases.abandoned()[Symbol.asyncIterator]();
    await it.next(); // opened, then dropped without return()
  })();
  for (let i = 0; i < 20 && !(await cases.closed()).includes("abandoned"); i++) {
    collect();
    await new Promise((r) => setTimeout(r, 50));
  }
  return (await cases.closed()).includes("abandoned");
});
await run("prefetch", async () => {
  // With PYTONGUE_PREFETCH=3 the runtime keeps requests ahead: after taking 1 item, Python has produced 3.
  const it = cases.tracked(10)[Symbol.asyncIterator]();
  const first = await it.next();
  await new Promise((r) => setTimeout(r, 200));
  const produced = (await cases.pulled()).length;
  await it.return!();
  return { first: first.value, produced };
});
await run("wrong-arguments", async () => (cases.echo as (...a: unknown[]) => Promise<unknown>)({ name: "x" }, "extra"));
await run("real-package", async () => ({ quadruple: await quadruple(3), double: await double(5) }));
await run("crash", () => cases.crash());
await run("after-crash-respawns", () => cases.echo({ name: "again" }));
await run("startup-failure", () => broken.f());
await run("startup-failure-no-respawn", async () => {
  const start = Date.now();
  try {
    await broken.f();
  } catch (e) {
    return { fast: Date.now() - start < 200, sameError: (e as PythonError).pyType };
  }
  return "unexpected success";
});
