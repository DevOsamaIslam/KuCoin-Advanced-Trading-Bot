import {
  appendFileSync
} from 'fs'
import moment from 'moment'

export default async data => {
  // appendFileSync(`./records/logs/${moment().format('YYYY-MM-DD')}.log`, `${new Date()} ${data}\n`)
}

export const verbose = async data => appendFileSync(`./records/logs/verbose_${moment().format('YYYY-MM-DD')}.log`, `${new Date()} ${data}\n`)

export const err = async data => appendFileSync(`./records/logs/errors_${moment().format('YYYY-MM-DD')}.log`, `${new Date()} ${data}\n`)

export const logStrategy = async options => {
  let {
    strategy,
    pair,
    orderId,
    data,
    fileName
  } = options

  data.forEach(line => appendFileSync(`./records/${strategy.toUpperCase()}/${fileName || moment().format('YYYY-MM-DD')}.log`, `${new Date()} ${pair.symbol} ${line}\n`))

}