/**
 * The result of analyzing one Python file.
 *
 * The content mapper turns it into TypeScript declarations and the runtime loader turns it into a
 * JavaScript module, so both halves always agree on names, signatures and exports.
 *
 * @module
 */

/** A half-open range of JavaScript string indices (UTF-16 code units) in the Python source. */
export interface Span {
	/** Index of the first code unit. */
	start: number;
	/** Index one past the last code unit. */
	end: number;
}

/** A value allowed inside `typing.Literal[...]`. */
export type LiteralValue = string | number | boolean | null;

/** The TypeScript keywords a Python annotation can translate to. */
export type KeywordName =
	| 'string'
	| 'number'
	| 'boolean'
	| 'null'
	| 'unknown'
	| 'void';

/** A primitive TypeScript type, such as `string` for `str`. */
export interface KeywordType {
	/** Discriminant. */
	kind: 'keyword';
	/** The TypeScript keyword to emit. */
	ts: KeywordName;
	/** Set when the type came from a Python `int`, which loses precision beyond ±(2^53−1). */
	int?: true;
}

/** A union of literal values, from `typing.Literal[...]` or an `Enum`. */
export interface LiteralType {
	/** Discriminant. */
	kind: 'literal';
	/** The literal members; an empty list means `never`. */
	values: LiteralValue[];
}

/** An array, from `list[T]`, `Sequence[T]`, `set[T]` and similar. */
export interface ArrayType {
	/** Discriminant. */
	kind: 'array';
	/** The element type. */
	element: TypeRef;
}

/** A fixed-length tuple, from `tuple[A, B]`. */
export interface TupleType {
	/** Discriminant. */
	kind: 'tuple';
	/** The element types, in order. */
	elements: TypeRef[];
}

/** A record, from `dict[K, V]` or `Mapping[K, V]`. */
export interface RecordType {
	/** Discriminant. */
	kind: 'record';
	/** The key type when it is a literal union, or `null` for plain `string` keys. */
	key: TypeRef | null;
	/** The value type. */
	value: TypeRef;
}

/** A union, from `A | B`, `Union[...]` or `Optional[...]`. */
export interface UnionType {
	/** Discriminant. */
	kind: 'union';
	/** The union members, already flattened. */
	members: TypeRef[];
}

/** A named type: a class of this file, or a name brought in by a relative import. */
export interface RefType {
	/** Discriminant. */
	kind: 'ref';
	/** The TypeScript spelling, one segment per dotted part (`['models', '$py$User']`). */
	path: string[];
	/** Where the name appears in the Python source. */
	span: Span;
}

/** Something pytongue cannot translate; emitted as `unknown`. */
export interface UnknownType {
	/** Discriminant. */
	kind: 'unknown';
	/** Why the annotation could not be translated, shown in hover. */
	reason: string;
	/** The diagnostic code reported in strict mode. */
	code: DiagnosticCode;
	/** The Python span the reason refers to. */
	span: Span;
}

/** Any translated Python annotation. */
export type TypeRef =
	| KeywordType
	| LiteralType
	| ArrayType
	| TupleType
	| RecordType
	| UnionType
	| RefType
	| UnknownType;

/** Diagnostic codes the content mapper reports (TypeScript prefixes them with `pytongue`). */
export const DiagnosticCode = {
	/** The Python file does not parse. */
	SyntaxError: 1001,
	/** A parameter or return value has no type hint (strict mode). */
	MissingAnnotation: 1002,
	/** An annotation has no TypeScript equivalent (strict mode). */
	Untranslatable: 1003,
	/** An annotation names a type from a third-party package (strict mode). */
	PackageType: 1004,
	/** An annotation names something that cannot be resolved (strict mode). */
	UnresolvedName: 1005,
} as const;

/** One of the {@link DiagnosticCode} values. */
export type DiagnosticCode =
	(typeof DiagnosticCode)[keyof typeof DiagnosticCode];

/** How a Python parameter can be passed. */
export type ParamKind =
	| 'positional-only'
	| 'normal'
	| 'keyword-only'
	| 'var-positional'
	| 'var-keyword';

/** A parameter of a Python function. */
export interface Param {
	/** The Python parameter name. */
	name: string;
	/** Where the name appears in the Python source. */
	span: Span;
	/** How the parameter can be passed. */
	kind: ParamKind;
	/** Whether the parameter has a default value. */
	hasDefault: boolean;
	/** The parameter type; for `*args` and `**kwargs`, the type of one element. */
	type: TypeRef;
}

/** A top-level Python function. */
export interface FunctionInfo {
	/** Discriminant. */
	kind: 'function';
	/** The Python function name. */
	name: string;
	/** Where the name appears in the Python source. */
	span: Span;
	/** Whether it is an `async def`. */
	isAsync: boolean;
	/** Whether the body contains `yield`. */
	isGenerator: boolean;
	/** The parameters, in declaration order. */
	params: Param[];
	/** The return type; for a generator, the element type. */
	returns: TypeRef;
	/** The cleaned docstring, if any. */
	doc?: string;
}

/** A field of a `BaseModel` or `TypedDict`. */
export interface FieldInfo {
	/** The Python attribute name. */
	name: string;
	/** Where the name appears in the Python source. */
	span: Span;
	/** The property name on input (`validation_alias` or `alias` applied). */
	inputName: string;
	/** The property name on output (`serialization_alias` or `alias` applied). */
	outputName: string;
	/** The field type. */
	type: TypeRef;
	/** Whether callers may omit the field. */
	optionalInput: boolean;
	/** Whether results may omit the field. */
	optionalOutput: boolean;
	/** Set for `@computed_field`, which exists on output only. */
	outputOnly: boolean;
	/** The field docstring or `Field(description=...)`, if any. */
	doc?: string;
}

/** A Pydantic `BaseModel` or a `TypedDict`. */
export interface ModelInfo {
	/** Which kind of class it is. */
	kind: 'model' | 'typeddict';
	/** The Python class name. */
	name: string;
	/** Where the name appears in the Python source. */
	span: Span;
	/** Base classes that are models or TypedDicts themselves. */
	bases: RefType[];
	/** The fields, in declaration order. */
	fields: FieldInfo[];
	/** The cleaned class docstring, if any. */
	doc?: string;
}

/** An `Enum` subclass. */
export interface EnumInfo {
	/** Discriminant. */
	kind: 'enum';
	/** The Python class name. */
	name: string;
	/** Where the name appears in the Python source. */
	span: Span;
	/** The union of member values, or `unknown` when a value cannot be read statically. */
	type: TypeRef;
	/** The cleaned class docstring, if any. */
	doc?: string;
}

/** A class pytongue translates. */
export type ClassInfo = ModelInfo | EnumInfo;

/** `from .x import Y`, kept for `import type` in the virtual module. */
export interface NamedImport {
	/** Discriminant. */
	kind: 'named';
	/** The TypeScript module specifier of the target file (`./x.py`). */
	specifier: string;
	/** The imported Python name. */
	imported: string;
	/** The local name it is bound to. */
	local: string;
	/** Where the local name appears. */
	span: Span;
	/** Where the imported name appears. */
	importedSpan: Span;
}

/** `from . import x`, where `x` is a module. */
export interface NamespaceImport {
	/** Discriminant. */
	kind: 'namespace';
	/** The TypeScript module specifier of the target file. */
	specifier: string;
	/** The local name the module is bound to. */
	local: string;
	/** Where the local name appears. */
	span: Span;
}

/** A relative import between Python files. */
export type RelativeImport = NamedImport | NamespaceImport;

/** An exported function defined in this file. */
export interface FunctionExport {
	/** Discriminant. */
	kind: 'function';
	/** The exported name. */
	name: string;
}

/** An exported class defined in this file. */
export interface ClassExport {
	/** Discriminant. */
	kind: 'class';
	/** The exported name. */
	name: string;
}

/** A name in `__all__` that came from a relative import. */
export interface ReexportEntry {
	/** Discriminant. */
	kind: 'reexport';
	/** The exported name. */
	name: string;
	/** The specifier of the file it comes from. */
	specifier: string;
	/** The name in that file, or `*` for a whole module. */
	imported: string;
	/** Whether the name is a class there; `undefined` when the file could not be read. */
	isType: boolean | undefined;
	/** Where the import appears. */
	span: Span;
}

/** A name in `__all__` that came from a package; exported as `unknown`. */
export interface PackageExport {
	/** Discriminant. */
	kind: 'package';
	/** The exported name. */
	name: string;
	/** The package it comes from. */
	module: string;
	/** Where the name appears (unused, kept for symmetry). */
	span: Span;
}

/** One public export of the module. */
export type ExportEntry =
	| FunctionExport
	| ClassExport
	| ReexportEntry
	| PackageExport;

/** A supported class, exported on the `$py$` surface. */
export interface SurfaceClass {
	/** Discriminant. */
	kind: 'class';
	/** The Python name. */
	name: string;
}

/** A function declared in the module, exported on the `$py$` surface as a type-only name. */
export interface SurfaceFunction {
	/** Discriminant. */
	kind: 'function';
	/** The Python name. */
	name: string;
}

/** A type alias (`Label = Literal[...]`), exported on the `$py$` surface. */
export interface SurfaceAlias {
	/** Discriminant. */
	kind: 'alias';
	/** The Python name. */
	name: string;
	/** The aliased type. */
	type: TypeRef;
}

/** An unsupported class, exported on the `$py$` surface as `unknown`. */
export interface SurfaceUnknown {
	/** Discriminant. */
	kind: 'unknown';
	/** The Python name. */
	name: string;
}

/** A name from a relative import, re-exported on the `$py$` surface. */
export interface SurfaceRelative {
	/** Discriminant. */
	kind: 'relative';
	/** The local name. */
	name: string;
	/** The specifier of the file it comes from. */
	specifier: string;
	/** The name in that file. */
	imported: string;
}

/** A module from `from . import x`, re-exported on the `$py$` surface. */
export interface SurfaceRelativeModule {
	/** Discriminant. */
	kind: 'relative-module';
	/** The local name. */
	name: string;
	/** The specifier of the module file. */
	specifier: string;
}

/**
 * The module's type surface for other `.py` files, exported as `$py$<name>`.
 *
 * Python's explicit `from .x import Y` works for private names, names outside `__all__` and type
 * aliases, so annotations across files go through this surface instead of the public exports.
 */
export type SurfaceEntry =
	| SurfaceClass
	| SurfaceFunction
	| SurfaceAlias
	| SurfaceUnknown
	| SurfaceRelative
	| SurfaceRelativeModule;

/** A Python syntax error found by tree-sitter. */
export interface SyntaxErrorInfo {
	/** Where the error is. */
	span: Span;
	/** A human-readable message. */
	message: string;
}

/** Everything the content mapper and the runtime loader need to know about one Python file. */
export interface ModuleInfo {
	/** Every top-level function, exported or not. */
	functions: FunctionInfo[];
	/** Every supported top-level class. */
	classes: ClassInfo[];
	/** Relative imports, for `import type` in the virtual module. */
	imports: RelativeImport[];
	/** The public exports. */
	exports: ExportEntry[];
	/** The `$py$` type surface for other `.py` files. */
	surface: SurfaceEntry[];
	/**
	 * Every name bound at module level (functions, classes, variables, imports), exported or not.
	 * It tells a name another file does not export (silently ignored) from one that does not
	 * exist (an `ImportError` in Python, so an error here too).
	 */
	definedNames: string[];
	/** Notes that apply to the whole module, shown on every export's hover. */
	moduleNotes: string[];
	/** Syntax errors, if any. */
	syntaxErrors: SyntaxErrorInfo[];
	/** The raw TOML of the `# /// script` block (PEP 723), if any. */
	scriptMetadata?: string;
}

/** File access for resolving relative imports. No Python is needed. */
export interface AnalyzeHost {
	/**
	 * Tells whether a regular file exists.
	 *
	 * @param path - An absolute path.
	 * @returns `true` when the path is an existing file.
	 */
	fileExists(path: string): boolean;
	/**
	 * Reads a UTF-8 text file.
	 *
	 * @param path - An absolute path.
	 * @returns The file contents, or `undefined` when it cannot be read.
	 */
	readFile(path: string): string | undefined;
}
