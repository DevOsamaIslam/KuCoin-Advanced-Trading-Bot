import { IHistory } from '../data'
import { IStrategy } from '../strategy'

export interface IBacktesterParams {
  strategy: IStrategy
  history: IHistory
}
