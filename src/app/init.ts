// @ts-ignore
import SDK from 'kucoin-node-sdk'
import { IDatafeedObject } from 'lib/types/datafeed'
import { API_KEY, API_PASSPHRASE, API_SECRET, BASE_URL } from './settings'

let datafeed: IDatafeedObject

export const initialize = () => {
  SDK.init({
    baseUrl: BASE_URL,
    apiAuth: {
      key: API_KEY, // KC-API-KEY
      secret: API_SECRET, // API-Secret
      passphrase: API_PASSPHRASE, // KC-API-PASSPHRASE
    },
    authVersion: 2, // KC-API-KEY-VERSION. Notice: for v2 API-KEY, not required for v1 version.
  })
}

export const getDatafeed = (): IDatafeedObject => {
  if (datafeed) return datafeed

  datafeed = new SDK.websocket.Datafeed()
  datafeed.connectSocket()
  return datafeed
}
