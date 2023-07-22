import { IDFAdvancedOrderPayload, IDFOrderPayload } from './datafeed'

export interface ITimeframe {
  text: string
  value: number
}

export interface ILiveOrder {
  [pair: string]: {
    mainOrder: IDFOrderPayload['data']
    SL?: IDFAdvancedOrderPayload['data']
    TP?: IDFAdvancedOrderPayload['data']
  }
}
