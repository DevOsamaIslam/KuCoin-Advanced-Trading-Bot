import { ICurrency } from 'lib/types/tickers'

export let CURRENCIES: { [ticker: string]: ICurrency } = {}

export const TRUSTED_CURRENCIES = {
  BTCUSDT: 'BTC-USDT',
  ETHUSDT: 'ETH-USDT',
  LTCUSDT: 'LTC-USDT',
  XRPUSDT: 'XRP-USDT',
  XLMUSDT: 'XLM-USDT',
  XMRUSDT: 'XMR-USDT',
  ZECUSDT: 'ZEC-USDT',
  ADAUSDT: 'ADA-USDT',
  DOTUSDT: 'DOT-USDT',
  SOLUSDT: 'SOL-USDT',
}
