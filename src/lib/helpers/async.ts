export async function asyncHandler<T = any, E = Error>(fn): Promise<[T, E]> {
  try {
    const result = await fn
    if (!result?.data) throw new Error(result.msg)
    return [(result.data as T) || result, null as unknown as E]
  } catch (error) {
    return [null as unknown as T, error as unknown as E]
  }
}
