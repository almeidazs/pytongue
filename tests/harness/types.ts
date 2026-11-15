/**
 * Renders what the TypeScript checker actually sees for a `.py` module (TypeScript's `.types`
 * baselines), through TypeScript 7.1's programmatic API with content mappers enabled.
 *
 * The async API is used because the sync one reads `stdout._handle.fd`, which Bun lacks.
 *
 * @module
 */
import {
	formatDiagnostics,
	SymbolFlags,
	TypeFormatFlags,
	type Checker,
	type Program,
	type Type,
} from 'typescript/async';

const FORMAT =
	TypeFormatFlags.UseFullyQualifiedType | TypeFormatFlags.NoTruncation;

/**
 * Replaces absolute `import("…/x.py")` qualifiers with a relative one, so baselines do not
 * depend on where the repository lives.
 *
 * @param text - A type string.
 * @param dir - The case directory.
 * @returns The text with paths shortened.
 */
function shortenPaths(text: string, dir: string): string {
	return text.replaceAll(`import("${dir}/`, 'import("./');
}

/**
 * Describes every export of a module as the checker resolves it, followed by any TypeScript
 * errors in the module (an emitted module must type-check).
 *
 * @param program - The program holding the file.
 * @param checker - The program's checker.
 * @param file - The `.py` file's absolute path.
 * @param dir - The case directory, stripped from type strings.
 * @returns The baseline text.
 */
export async function renderTypes(
	program: Program,
	checker: Checker,
	file: string,
	dir: string,
): Promise<string> {
	const lines: string[] = [];
	const moduleSymbol = await checker.getSymbolOfSourceFile(file);

	if (!moduleSymbol) return '(not in the program)\n';

	const show = async (type: Type) =>
		shortenPaths(await checker.typeToString(type, undefined, FORMAT), dir);

	for (const exported of await checker.getExportsOfModule(moduleSymbol)) {
		if (exported.name.startsWith('$py$')) continue;

		const symbol =
			exported.flags & SymbolFlags.Alias
				? await checker.getAliasedSymbol(exported)
				: exported;

		if (symbol.flags & SymbolFlags.Value) {
			lines.push(
				`${exported.name}: ${await show(await checker.getTypeOfSymbol(symbol))}`,
			);

			continue;
		}

		lines.push(`type ${exported.name}`);

		const declared = await checker.getDeclaredTypeOfSymbol(symbol);

		for (const property of await checker.getPropertiesOfType(declared)) {
			const optional = property.flags & SymbolFlags.Optional ? '?' : '';
			const type = await show(await checker.getTypeOfSymbol(property));

			lines.push(`  ${property.name}${optional}: ${type}`);
		}
	}

	const diagnostics = [
		...(await program.getSyntacticDiagnostics(file)),
		...(await program.getSemanticDiagnostics(file)),
	];

	if (diagnostics.length)
		lines.push(
			'',
			'--- TypeScript errors ---',
			shortenPaths(formatDiagnostics(diagnostics, program), dir),
		);

	return (lines.length ? lines.join('\n') : '(no exports)') + '\n';
}
