import { IMargin } from './margin'
import { IMarket } from './market'
import { ITrade } from './trade'
import { IUser } from './user'

export interface IAuth {
  baseUrl: string
  apiAuth: {
    key: string // KC-API-KEY
    secret: string // API-Secret
    passphrase: string // KC-API-PASSPHRASE
  }
  authVersion: number // KC-API-KEY-VERSION. Notice: for v2 API-KEY, not required for v1 version.
}

export type $accountType = 'trade' | 'main'

export interface IRest {
  User: IUser
  Trade: ITrade
  Market: IMarket
  Margin: IMargin
  Others: {
    getTimestamp: () => Promise<any>
    getStatus: () => Promise<any>
  }
}

export interface IWebSocket {
  Datafeed: (isPublic: boolean) => void
}

export interface ISpan {
  startAt: number
  endAt: number
}
