export function formatUSDC(rawAmount) {
  const num = Number(rawAmount) / 1_000_000;
  return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 });
}

export function toRawUSDC(humanAmount) {
  return Math.round(Number(humanAmount) * 1_000_000);
}

export function shortenAddress(address) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}