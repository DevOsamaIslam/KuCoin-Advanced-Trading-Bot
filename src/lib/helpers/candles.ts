import { rest } from 'kucoin-node-sdk'
import { ITimeframe } from 'lib/types/app'
import { ISpan } from 'lib/types/sdk/sdk'
import { asyncHandler } from './async'
import { convertRawHistory } from './conversion'

interface IProps {
  symbol: string
  timeframe: ITimeframe
  lookbackPeriods?: number
}
export const getHistory = async ({ symbol, timeframe, lookbackPeriods = 1500 }: IProps) => {
  const span: ISpan = {
    startAt: Math.floor((Date.now() - timeframe.value * lookbackPeriods) / 1000),
    endAt: Math.floor(Date.now() / 1000),
  }
  const [data] = await asyncHandler<string[][]>(rest.Market.Histories.getMarketCandles(symbol, timeframe.text, span))
  if (data) return convertRawHistory(data.reverse())
}
