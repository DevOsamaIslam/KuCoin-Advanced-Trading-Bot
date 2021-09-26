import api from 'kucoin-node-sdk'
import dotenv from 'dotenv'
import sniper from './sniper.js'

import {
  config,
} from './config/keys.js'
import Watchdog from './Watchdog.js'
import settings, {
  database
} from './config/settings.js'

import {
  MACD,
  CMF_MACD,
  RTW,
  VWAP
} from './strategies/index.js'

dotenv.config()

api.init(config)

database.connect

api.rest.User.Account.getAccountsList({
  type: 'trade',
  currency: 'USDT'
}).then(data => {
  if (data.data) {
    new Watchdog({
      equity: data.data[0].available,
      strategy: {
        MACD,
        // CMF_MACD
      }
    })
  }
})




export default api