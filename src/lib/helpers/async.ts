import Logger from 'app/Logger'

const logger = Logger.getInstance()
export async function asyncHandler<T = any, E = Error>(fn): Promise<[T, E]> {
  try {
    const result = await fn

    if (!result?.data) {
      logger.error('api error1', result)
      throw new Error(JSON.stringify(result))
    }
    return [(result.data as T) || result, null as unknown as E]
  } catch (error) {
    logger.error('api error', error)
    return [null as unknown as T, error as unknown as E]
  }
}
