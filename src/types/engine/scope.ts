/**
 * Internal types of the analyzer: what a top-level Python name is bound to, and what a dotted
 * reference in an annotation resolves to.
 *
 * @module
 */
import type { Node } from 'web-tree-sitter';

import type { Span } from './analyze';

/** How pytongue treats a class, decided from its bases. */
export type ClassKind = 'model' | 'typeddict' | 'enum' | 'other';

/** `class X(...)` at module level. */
export interface ClassBinding {
	/** Discriminant. */
	kind: 'class';
	/** The `class_definition` node. */
	node: Node;
	/** Memoized result of the class-kind check. */
	classKind?: ClassKind;
}

/** `def x(...)` at module level. */
export interface FunctionBinding {
	/** Discriminant. */
	kind: 'function';
	/** The `function_definition` node. */
	node: Node;
}

/** A type alias: `X = Literal[...]`, `X: TypeAlias = ...`, `type X = ...` or `NewType`. */
export interface AliasBinding {
	/** Discriminant. */
	kind: 'alias';
	/** The aliased annotation node. */
	value: Node;
}

/** `T = TypeVar("T")` and friends. */
export interface TypeVarBinding {
	/** Discriminant. */
	kind: 'typevar';
}

/** `from .x import Y`, resolved to a file. */
export interface RelativeBinding {
	/** Discriminant. */
	kind: 'relative';
	/** The specifier of the target file. */
	specifier: string;
	/** The imported name. */
	imported: string;
	/** Where the local name appears. */
	span: Span;
}

/** `from . import x`, where `x` is a module file. */
export interface RelativeModuleBinding {
	/** Discriminant. */
	kind: 'relative-module';
	/** The specifier of the module file. */
	specifier: string;
	/** Where the local name appears. */
	span: Span;
}

/** A relative import whose target file does not exist. */
export interface MissingModuleBinding {
	/** Discriminant. */
	kind: 'relative-missing';
	/** The specifier that was looked for. */
	target: string;
}

/** `import x` or `import x as y`. */
export interface ModuleBinding {
	/** Discriminant. */
	kind: 'module';
	/** The dotted module name. */
	module: string;
}

/** `from package import x`. */
export interface FromBinding {
	/** Discriminant. */
	kind: 'from';
	/** The dotted module name. */
	module: string;
	/** The imported name. */
	name: string;
}

/** Any other top-level assignment. */
export interface OtherBinding {
	/** Discriminant. */
	kind: 'other';
}

/** What a top-level Python name is bound to. */
export type Binding =
	| ClassBinding
	| FunctionBinding
	| AliasBinding
	| TypeVarBinding
	| RelativeBinding
	| RelativeModuleBinding
	| MissingModuleBinding
	| ModuleBinding
	| FromBinding
	| OtherBinding;

/** A fully qualified name from a module, such as `typing.Optional`. */
export interface QualifiedName {
	/** Discriminant. */
	kind: 'qualified';
	/** The dotted qualified name. */
	name: string;
	/** The top-level module it belongs to. */
	module: string;
}

/** A class defined in this file. */
export interface LocalClassName {
	/** Discriminant. */
	kind: 'local-class';
	/** The class name. */
	name: string;
	/** How pytongue treats the class. */
	classKind: ClassKind;
}

/** A name from a relative import. */
export interface RelativeName {
	/** Discriminant. */
	kind: 'relative';
	/** The TypeScript spelling of the reference. */
	path: string[];
}

/** A type alias of this file. */
export interface AliasName {
	/** Discriminant. */
	kind: 'alias';
	/** The aliased annotation node. */
	value: Node;
}

/** A type variable. */
export interface TypeVarName {
	/** Discriminant. */
	kind: 'typevar';
}

/** A name from a relative import whose file does not exist. */
export interface MissingName {
	/** Discriminant. */
	kind: 'missing';
	/** The specifier that was looked for. */
	target: string;
}

/** A name with no binding. */
export interface UnresolvedName {
	/** Discriminant. */
	kind: 'unresolved';
	/** The dotted name as written. */
	name: string;
}

/** A name bound to something that is not a type. */
export interface NotATypeName {
	/** Discriminant. */
	kind: 'not-a-type';
	/** The dotted name as written. */
	name: string;
}

/** What a dotted reference in an annotation resolves to. */
export type Resolved =
	| QualifiedName
	| LocalClassName
	| RelativeName
	| AliasName
	| TypeVarName
	| MissingName
	| UnresolvedName
	| NotATypeName;

/** One name of a `from ... import ...` statement. */
export interface ImportedName {
	/** The imported (dotted) name. */
	imported: string;
	/** The local name it is bound to. */
	local: string;
	/** The node of the local name. */
	node: Node;
	/** The node of the imported name. */
	importedNode: Node;
}
