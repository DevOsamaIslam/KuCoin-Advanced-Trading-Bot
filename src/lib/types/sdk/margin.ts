export interface IMargin {
  MarginInfo: {
    getMarkPrice: () => Promise<any>
    getMarginConfigurationInfo: () => Promise<any>
    getMarginAccount: () => Promise<any>
    postMarginOrder: () => Promise<any>
  }
  BorrowAndLend: {
    postBorrowOrder: () => Promise<any>
    getBorrowOrder: () => Promise<any>
    getRepayRecord: () => Promise<any>
    getRepaymentRecord: () => Promise<any>
    repayAll: () => Promise<any>
    repaySingle: () => Promise<any>
    postLendOrder: () => Promise<any>
    cancelLendOrder: () => Promise<any>
    setAutoLend: () => Promise<any>
    getActiveOrder: () => Promise<any>
    getLentHistory: () => Promise<any>
    getActiveLendOrdersList: () => Promise<any>
    getSettledLendOrderHistory: () => Promise<any>
    getAccountLendRecord: () => Promise<any>
    getLendingMarketData: () => Promise<any>
    getMarginFillsTradeData: () => Promise<any>
  }
}
