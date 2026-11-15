/**
 * What pytongue knows about Python names: builtins, typing constructs and the standard-library
 * and Pydantic types with a JSON form. Names are canonical qualified names (see `canonicalName`).
 *
 * @module
 */

/** Builtin names usable in annotations without an import. */
export const BUILTINS: ReadonlySet<string> = new Set([
	'str',
	'int',
	'float',
	'complex',
	'bool',
	'bytes',
	'bytearray',
	'memoryview',
	'list',
	'dict',
	'set',
	'frozenset',
	'tuple',
	'object',
	'type',
]);

/** Modules pytongue knows; any other module counts as a third-party package. */
export const KNOWN_MODULES: ReadonlySet<string> = new Set([
	'builtins',
	'typing',
	'datetime',
	'uuid',
	'decimal',
	'pathlib',
	'collections',
	'enum',
	'pydantic',
	'ipaddress',
	're',
]);

/** Containers that become `T[]`. */
export const ARRAY_LIKE: ReadonlySet<string> = new Set([
	'builtins.list',
	'builtins.set',
	'builtins.frozenset',
	'typing.Sequence',
	'typing.MutableSequence',
	'typing.Collection',
	'typing.AbstractSet',
	'typing.MutableSet',
	'typing.Iterable',
	'typing.Iterator',
	'typing.Reversible',
]);

/** Return annotations of a sync generator, whose first argument is the element type. */
export const SYNC_GENERATORS: ReadonlySet<string> = new Set([
	'typing.Iterator',
	'typing.Iterable',
	'typing.Generator',
]);

/** Return annotations of an async generator, whose first argument is the element type. */
export const ASYNC_GENERATORS: ReadonlySet<string> = new Set([
	'typing.AsyncIterator',
	'typing.AsyncIterable',
	'typing.AsyncGenerator',
]);

/** Mappings that become `Record<string, V>`. */
export const MAPPING_LIKE: ReadonlySet<string> = new Set([
	'builtins.dict',
	'typing.Mapping',
	'typing.MutableMapping',
]);

/** Types whose JSON form is a string. */
export const STRING_LIKE: ReadonlySet<string> = new Set([
	'builtins.str',
	'typing.LiteralString',
	'datetime.datetime',
	'datetime.date',
	'datetime.time',
	'datetime.timedelta',
	'uuid.UUID',
	'decimal.Decimal',
	'pathlib.Path',
	'pathlib.PurePath',
	'pathlib.PosixPath',
	'pathlib.WindowsPath',
	'ipaddress.IPv4Address',
	'ipaddress.IPv6Address',
	'ipaddress.IPv4Network',
	'ipaddress.IPv6Network',
	'ipaddress.IPv4Interface',
	'ipaddress.IPv6Interface',
	'pydantic.EmailStr',
	'pydantic.NameEmail',
	'pydantic.AnyUrl',
	'pydantic.AnyHttpUrl',
	'pydantic.HttpUrl',
	'pydantic.FileUrl',
	'pydantic.WebsocketUrl',
	'pydantic.StrictStr',
	'pydantic.SecretStr',
	'pydantic.UUID4',
	'pydantic.UUID1',
	'pydantic.FutureDate',
	'pydantic.PastDate',
	'pydantic.AwareDatetime',
	'pydantic.NaiveDatetime',
	'pydantic.FutureDatetime',
	'pydantic.PastDatetime',
]);

/** Integer types (`number`, with the safe-integer note). */
export const INT_LIKE: ReadonlySet<string> = new Set([
	'builtins.int',
	'pydantic.StrictInt',
	'pydantic.PositiveInt',
	'pydantic.NegativeInt',
	'pydantic.NonNegativeInt',
	'pydantic.NonPositiveInt',
]);

/** Floating-point types (`number`). */
export const FLOAT_LIKE: ReadonlySet<string> = new Set([
	'builtins.float',
	'pydantic.StrictFloat',
	'pydantic.PositiveFloat',
	'pydantic.NegativeFloat',
	'pydantic.NonNegativeFloat',
	'pydantic.NonPositiveFloat',
	'pydantic.FiniteFloat',
]);

/** Boolean types (`boolean`). */
export const BOOL_LIKE: ReadonlySet<string> = new Set([
	'builtins.bool',
	'pydantic.StrictBool',
]);

/** Byte types, which have no JSON form. */
export const BYTES_LIKE: ReadonlySet<string> = new Set([
	'builtins.bytes',
	'builtins.bytearray',
	'builtins.memoryview',
]);

/** Wrappers whose first argument is the actual type. */
export const UNWRAP: ReadonlySet<string> = new Set([
	'typing.Annotated',
	'typing.Required',
	'typing.NotRequired',
	'typing.ReadOnly',
	'typing.ClassVar',
	'typing.Final',
]);

/** Bases that make a class an `Enum`. */
export const ENUM_BASES: ReadonlySet<string> = new Set([
	'enum.Enum',
	'enum.StrEnum',
	'enum.IntEnum',
	'enum.Flag',
	'enum.IntFlag',
]);

/** Calls that declare a type variable. */
export const TYPEVAR_FACTORIES: ReadonlySet<string> = new Set([
	'typing.TypeVar',
	'typing.ParamSpec',
	'typing.TypeVarTuple',
]);

/** Matches PEP 723 metadata blocks (`# /// script` ... `# ///`), per the reference regex. */
export const PEP723_BLOCK =
	/^# \/\/\/ (?<type>[a-zA-Z0-9-]+)$\n(?<content>(?:^#(?:| .*)$\n)+)^# \/\/\/$/gm;

/** At most this many syntax errors are reported per file. */
export const MAX_SYNTAX_ERRORS = 20;

/** Type aliases are expanded at most this deep, which also stops alias cycles. */
export const MAX_ALIAS_DEPTH = 32;

/** The prefix forward references are re-parsed with, to put them in annotation position. */
export const FORWARD_REF_PREFIX = 'x: ';
