import api from 'kucoin-node-sdk'
import dotenv from 'dotenv'

import {
  config,
} from './config/keys.js'
import Watchdog from './Watchdog.js'
import {
  getEquity
} from './config/utils.js'

dotenv.config()

api.init(config)


let watchlist = [
  'BTC-USDT',
  'ETH-USDT',
  'THETA-USDT',
  'MATIC-USDT',
  'LINK-USDT',
  'ADA-USDT',
  'KSM-USDT',
  'QNT-USDT',
  'DOT-USDT',
  'TRX-USDT',
  'ONE-USDT',
  'REN-USDT',
  'AXS-USDT',
  'ENJ-USDT',
  'AAVE-USDT',
  'EOS-USDT',
  'KCS-USDT',
  'FIL-USDT',
  'SOL-USDT',
  'ATOM-USDT',
  'FTM-USDT',
  'AVAX-USDT',
  'ALGO-USDT',
  'LUNA-USDT',
  'XRP-USDT',
  'DOGE-USDT',
  'DOT-USDT',
  'ICP-USDT',
  'VET-USDT',
  'XMR-USDT',
  'AAXS-USDT',
  'AMP-USDT',
  'COMP-USDT',
  'ZEC-USDT',
  'SNX-USDT',
  'BAT-USDT',
  'TEL-USDT',
  'ZEN-USDT',
]

export const timeframes = [{
    value: 1 * 60 * 1000,
    text: '1min'
  },
  {
    value: 3 * 60 * 1000,
    text: '3min'
  },
  {
    value: 5 * 60 * 1000,
    text: '5min'
  },
  {
    value: 15 * 60 * 1000,
    text: '15min'
  },
  {
    value: 30 * 60 * 1000,
    text: '30min'
  },
  {
    value: 60 * 60 * 1000,
    text: '1hour'
  },
  {
    value: 2 * 60 * 60 * 1000,
    text: '2hour'
  },
  {
    value: 4 * 60 * 60 * 1000,
    text: '4hour'
  },
  {
    value: 6 * 60 * 60 * 1000,
    text: '6hour'
  },
  {
    value: 8 * 60 * 60 * 1000,
    text: '8hour'
  },
  {
    value: 12 * 60 * 60 * 1000,
    text: '12hour'
  },
  {
    value: 24 * 60 * 60 * 1000,
    text: '1day'
  },
  {
    value: 7 * 24 * 60 * 60 * 1000,
    text: '1week'
  }
]


api.rest.User.Account.getAccountsList({
  type: 'trade',
  currency: 'USDT'
}).then(data => data.data && new Watchdog(data.data[0].available, watchlist, timeframes[0]))


export default api