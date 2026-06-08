export function getTransactionBalance(transaction: {
  inrAmount: number | null;
  withdrawnAmount: number | null;
  balanceAmount: number | null;
}): number {
  if (transaction.balanceAmount != null) {
    return Math.max(0, transaction.balanceAmount);
  }
  const remaining = (transaction.inrAmount ?? 0) - (transaction.withdrawnAmount ?? 0);
  return Math.max(0, remaining);
}

export function computeAvailableBalance(
  accountInrBalance: number,
  transactions: Array<{
    type: string;
    inrAmount: number | null;
    withdrawnAmount: number | null;
    balanceAmount: number | null;
  }>
): number {
  const orderTotal = transactions
    .filter((t) => t.type === "usdt_sell")
    .reduce((sum, t) => sum + getTransactionBalance(t), 0);
  return accountInrBalance + orderTotal;
}

export function computeTotalWithdrawnFromOrders(
  transactions: Array<{ type: string; withdrawnAmount: number | null }>
): number {
  return transactions
    .filter((t) => t.type === "usdt_sell")
    .reduce((sum, t) => sum + (t.withdrawnAmount ?? 0), 0);
}
