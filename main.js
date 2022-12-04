import api from "kucoin-node-sdk"

import Watchdog from "./Watchdog.js"

import { config } from "./config/keys.js"
api.init(config)

setTimeout(() => {
  dynamicArb()
}, 1000)

import { MACD, CMF_MACD, RTW, VWAP } from "./strategies/index.js"
import dynamicArb from "./tribitrage.js"

// setTimeout(() => {
//   new Watchdog('MACD').execute()
// }, 1000);

// import settings, { database } from "./config/settings.js"

// database.connect

// api.rest.User.Account.getAccountsList({
//   type: 'trade',
//   currency: settings.quote
// }).then(data => {
//   if (data.data) {
//     new Watchdog({
//       equity: data.data[0].available,
//       strategy: {
//         MACD,
//         CMF_MACD,
//         VWAP
//       }
//     })
//   }
// })

export default api
