/**
 * Internal types of field analysis.
 *
 * @module
 */
import type { Node } from 'web-tree-sitter';

import type { RefType } from './analyze';

/** What the wrappers around a field annotation say about the field. */
export interface FieldWrappers {
	/** `ClassVar[...]`: not a field at all. */
	classVar: boolean;
	/** `Required[...]` (`true`) or `NotRequired[...]` (`false`), for TypedDicts. */
	required: boolean | undefined;
	/** The metadata arguments of `Annotated[T, ...]`. */
	metadata: Node[];
}

/** What `= value` and `Field(...)` say about a field. */
export interface FieldOptions {
	/** The input property name. */
	inputName: string;
	/** The output property name. */
	outputName: string;
	/** `Field(description=...)`. */
	description: string | undefined;
	/** Whether the field has a default. */
	hasDefault: boolean;
}

/** A member assignment (`NAME = value`) in an enum body. */
export interface EnumMember {
	/** The member name. */
	name: string;
	/** The value node. */
	value: Node;
}

/** The bases of a model or TypedDict that matter to pytongue. */
export interface ClassBases {
	/** Bases that are models or TypedDicts themselves. */
	bases: RefType[];
	/** The TypedDict `total=` flag (`true` unless `total=False`). */
	total: boolean;
}
