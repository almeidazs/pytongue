import type { Lang, Span } from './models.py';
import {
	classify,
	classify_many,
	pick,
	slow_words,
	stream_tokens,
	untyped,
	type Result,
	type Token,
} from './sentiment.py';

// Exact type assertions: tsc fails if any of these drift.
type Equal<A, B> =
	(<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
		? true
		: false;
type Expect<T extends true> = T;

export type Checks = [
	Expect<Equal<Lang, 'pt' | 'en'>>,
	Expect<Equal<Span['label'], string | undefined>>,
	Expect<Equal<Result['label'], 'positive' | 'negative' | 'neutral'>>,
	Expect<Equal<Result['tokens'], Token[]>>,
	Expect<Equal<Result['at'], string | null>>,
	Expect<Equal<Result['confident'], boolean>>,
	Expect<Equal<Result['score'], number>>,
	Expect<Equal<NonNullable<Result['stamp']>['created'], string>>,
	Expect<Equal<Result.Input['tokens'], Token.Input[] | undefined>>,
	Expect<Equal<Token.Input['pos'], string | null | undefined>>,
	Expect<
		Equal<
			Parameters<typeof classify>,
			[text: string, kwargs?: { top_k?: number; lang?: 'pt' | 'en' }]
		>
	>,
	Expect<Equal<ReturnType<typeof classify>, Promise<Result>>>,
	Expect<Equal<ReturnType<typeof stream_tokens>, AsyncIterable<Token>>>,
	Expect<Equal<ReturnType<typeof slow_words>, AsyncIterable<string>>>,
	Expect<Equal<Parameters<typeof untyped>, [x: unknown, y: number]>>,
	Expect<Equal<ReturnType<typeof untyped>, Promise<unknown>>>,
	Expect<
		Equal<
			Parameters<typeof pick>,
			[
				items: string[],
				index?: number,
				kwargs?: { default?: string | null },
			]
		>
	>,
];

/** Never called: calls that must type-check, and calls that must not. */
export async function calls(): Promise<void> {
	await classify('aula ótima', { lang: 'pt' });
	await classify_many(['great', 'awful'], ['boa'], { verbose: true });
	for await (const token of stream_tokens('one two')) token.text satisfies string;
	await pick(['a'], 5, { default: 'none' });
	await untyped({ any: 'thing' }, 1);
	// @ts-expect-error: top_k is a keyword argument (it has a default), not positional.
	await classify('x', 2);
	// @ts-expect-error: lang must be "pt" | "en".
	await classify('x', { lang: 'fr' });
	// @ts-expect-error: text is a str.
	await classify(42);
}
