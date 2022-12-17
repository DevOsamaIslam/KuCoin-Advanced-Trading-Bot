declare module 'kucoin-node-sdk' {
  export function init(options: import('./sdk').IAuth): void
  export const rest: import('./sdk').IRest
  const websocket: import('./sdk').IWebSocket
}
