import api from 'kucoin-node-sdk'
import dotenv from 'dotenv'
import sniper from './sniper.js'

import {
  config,
} from './config/keys.js'
import Watchdog from './Watchdog.js'
import settings from './config/settings.js'

dotenv.config()

api.init(config)



api.rest.User.Account.getAccountsList({
  type: 'trade',
  currency: 'USDT'
}).then(data => {
  if (data.data) {
    new Watchdog(data.data[0].available, settings)
    sniper()
  }
})


export default api