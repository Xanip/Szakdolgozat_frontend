/**
 * Reusable, hand-written runtime validators (no validation library).
 *
 * A `Decoder<T>` takes an `unknown` value and either returns it narrowed to `T`
 * or throws, reporting the JSON path that failed. Decoders compose
 * (`object`, `arrayOf`, `nullable`) so each endpoint validator is a small
 * declaration plus its endpoint-specific structural checks.
 *
 * Only `validateResponse` is meant to be called by endpoint code: it converts
 * low-level failures into a single `ResponseValidationError`.
 */

/** Raised when a backend response does not match the expected contract. */
export class ResponseValidationError extends Error {
  readonly endpoint: string;
  readonly path: string;

  constructor(endpoint: string, path: string, reason: string) {
    super(`Invalid ${endpoint} response at "${path}": ${reason}`);
    this.name = "ResponseValidationError";
    this.endpoint = endpoint;
    this.path = path;
  }
}

/** Internal failure carrying the JSON path; wrapped by `validateResponse`. */
class DecodeIssue extends Error {
  readonly path: string;
  readonly reason: string;

  constructor(path: string, reason: string) {
    super(`${path}: ${reason}`);
    this.path = path;
    this.reason = reason;
  }
}

export type Decoder<T> = (value: unknown, path: string) => T;

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/** Reports a validation failure at `path`. */
export function fail(path: string, reason: string): never {
  throw new DecodeIssue(path, reason);
}

/** Reports a failed structural relationship (e.g. mismatched array lengths). */
export function ensure(condition: boolean, path: string, reason: string): void {
  if (!condition) fail(path, reason);
}

export const string: Decoder<string> = (value, path) =>
  typeof value === "string" ? value : fail(path, "expected a string");

export const number: Decoder<number> = (value, path) =>
  isFiniteNumber(value) ? value : fail(path, "expected a finite number");

export const integer: Decoder<number> = (value, path) =>
  isFiniteNumber(value) && Number.isInteger(value)
    ? value
    : fail(path, "expected an integer");

/** `null` is accepted as a distinct value; `undefined` (missing) is not. */
export function nullable<T>(decoder: Decoder<T>): Decoder<T | null> {
  return (value, path) => (value === null ? null : decoder(value, path));
}

export function arrayOf<T>(decoder: Decoder<T>): Decoder<T[]> {
  return (value, path) => {
    if (!Array.isArray(value)) fail(path, "expected an array");
    const result: T[] = new Array<T>(value.length);
    for (let index = 0; index < value.length; index += 1) {
      result[index] = decoder(value[index], `${path}[${index}]`);
    }
    return result;
  };
}

type DecodedShape<S extends Record<string, Decoder<unknown>>> = {
  [K in keyof S]: ReturnType<S[K]>;
};

/**
 * Validates an object with the given required fields. Every field must be
 * present (a missing field fails even if its decoder is `nullable`). Unknown
 * extra fields are dropped, so the result matches the declared shape exactly.
 */
export function object<S extends Record<string, Decoder<unknown>>>(
  shape: S,
): Decoder<DecodedShape<S>> {
  return (value, path) => {
    if (!isRecord(value)) fail(path, "expected an object");
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(shape)) {
      const fieldPath = `${path}.${key}`;
      if (!Object.hasOwn(value, key)) fail(fieldPath, "missing required field");
      result[key] = shape[key](value[key], fieldPath);
    }
    return result as DecodedShape<S>;
  };
}

/**
 * Runs `decoder` on an untrusted response body. Returns the narrowed value or
 * throws `ResponseValidationError`; never returns partially validated data.
 */
export function validateResponse<T>(
  endpoint: string,
  decoder: Decoder<T>,
  value: unknown,
): T {
  try {
    return decoder(value, "$");
  } catch (error) {
    if (error instanceof DecodeIssue) {
      throw new ResponseValidationError(endpoint, error.path, error.reason);
    }
    throw error;
  }
}
