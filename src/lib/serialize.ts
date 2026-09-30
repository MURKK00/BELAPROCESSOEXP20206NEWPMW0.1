/**
 * Serializes data by recursively converting Prisma Decimal instances
 * into plain JavaScript numbers and preserving Dates and plain objects.
 * This guarantees safe serialization across Next.js React Server Component (RSC) boundaries.
 */
export function serializeDecimals<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  // Check if it's a Prisma Decimal instance (or Decimal.js)
  if (
    typeof data === 'object' &&
    data !== null &&
    (typeof (data as any).toNumber === 'function' || (data as any).isDecimal)
  ) {
    return (data as any).toNumber();
  }

  // Preserve Date instances (supported across Server Components)
  if (data instanceof Date) {
    return data;
  }

  // Arrays
  if (Array.isArray(data)) {
    return data.map((item) => serializeDecimals(item)) as unknown as T;
  }

  // Plain objects
  if (typeof data === 'object') {
    const serialized: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      serialized[key] = serializeDecimals(value);
    }
    return serialized as T;
  }

  return data;
}
