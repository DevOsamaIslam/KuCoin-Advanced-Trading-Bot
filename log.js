import {
  appendFileSync,
  writeFile
} from 'fs'
import moment from 'moment'

export default async data => {
  // let file = `./records/logs/${moment().format('YYYY-MM-DD')}.log`
  // let line = `${new Date()} ${data}\n`
  // try {
  //   appendFileSync(file, line)
  // } catch (error) {
  //   writeFile(file, line, { flag: 'w+' }, () => {})
  // }
  console.log(data);
}

export const verbose = async data => appendFileSync(`./records/logs/verbose_${moment().format('YYYY-MM-DD')}.log`, `${new Date()} ${data}\n`)

export const err = async data => {
  // appendFileSync(`./records/logs/errors_${moment().format('YYYY-MM-DD')}.log`, `${new Date()} ${data}\n`)
  console.log(data)
}

export const logStrategy = async options => {
  // let {
  //   strategy,
  //   pair,
  //   orderId,
  //   data,
  //   fileName
  // } = options

  // data.forEach(line => appendFileSync(`./records/${strategy.toUpperCase()}/${fileName || moment().format('YYYY-MM-DD')}.log`, `${new Date()} ${pair.symbol} ${line}\n`))
  console.log(options.data);

}