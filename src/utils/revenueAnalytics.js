import { queryEventsChunked, attachTimestamps } from "./eventHistory";
import { formatUSDC, shortenAddress } from "./format";
const DEPLOYMENT_BLOCK = 11453343;
/**
 * Fetches all FundsDistributed events from ProduceMarketplace and enriches
 * each with crop variety + buyer address (from the batch record) so the
 * Revenue dashboard doesn't need a second round of manual joins.
 */
export async function fetchRevenueEvents(marketplace, provider, toBlock) {
  const filter = marketplace.filters.FundsDistributed();
  const rawLogs = await queryEventsChunked(marketplace, filter, DEPLOYMENT_BLOCK, toBlock);
  const withTimestamps = await attachTimestamps(provider, rawLogs);

  const sales = await Promise.all(
    withTimestamps.map(async (log) => {
      const { batchId, farmer, farmerPayout, cooperativeCommission } = log.args;
      const batch = await marketplace.getBatch(batchId);

      return {
        batchId: Number(batchId),
        farmer,
        buyer: batch.buyerAddress,
        cropVariety: batch.cropVariety,
        farmerPayout: BigInt(farmerPayout),
        commission: BigInt(cooperativeCommission),
        price: BigInt(farmerPayout) + BigInt(cooperativeCommission),
        timestamp: log.timestamp,
        txHash: log.transactionHash,
      };
    })
  );

  return sales.sort((a, b) => a.timestamp - b.timestamp);
}

export function computeSummary(sales) {
  const now = Math.floor(Date.now() / 1000);
  const oneWeekAgo = now - 7 * 24 * 60 * 60;
  const oneMonthAgo = now - 30 * 24 * 60 * 60;

  const totalRevenue = sales.reduce((sum, s) => sum + s.commission, 0n);
  const revenueThisWeek = sales
    .filter((s) => s.timestamp >= oneWeekAgo)
    .reduce((sum, s) => sum + s.commission, 0n);
  const revenueThisMonth = sales
    .filter((s) => s.timestamp >= oneMonthAgo)
    .reduce((sum, s) => sum + s.commission, 0n);

  const avgCommission = sales.length > 0 ? totalRevenue / BigInt(sales.length) : 0n;

  return {
    totalRevenue,
    revenueThisWeek,
    revenueThisMonth,
    totalSales: sales.length,
    avgCommission,
  };
}

/**
 * Buckets sales by day/week/month for the time-series chart.
 * period: "day" | "week" | "month"
 */
export function groupByPeriod(sales, period = "day") {
  const buckets = {};

  for (const sale of sales) {
    const date = new Date(sale.timestamp * 1000);
    let key;
    if (period === "day") {
      key = date.toISOString().slice(0, 10);
    } else if (period === "week") {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      key = weekStart.toISOString().slice(0, 10);
    } else {
      key = date.toISOString().slice(0, 7);
    }
    buckets[key] = (buckets[key] || 0n) + sale.commission;
  }

  return Object.entries(buckets)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([label, value]) => ({ label, value }));
}

export function groupByCrop(sales) {
  const buckets = {};
  for (const sale of sales) {
    buckets[sale.cropVariety] = (buckets[sale.cropVariety] || 0n) + sale.commission;
  }
  return Object.entries(buckets)
    .map(([crop, value]) => ({ label: crop, value }))
    .sort((a, b) => (b.value > a.value ? 1 : -1));
}

export function groupByFarmer(sales, topN = 5) {
  const buckets = {};
  for (const sale of sales) {
    buckets[sale.farmer] = (buckets[sale.farmer] || 0n) + sale.commission;
  }
  return Object.entries(buckets)
    .map(([farmer, value]) => ({ label: shortenAddress(farmer), fullAddress: farmer, value }))
    .sort((a, b) => (b.value > a.value ? 1 : -1))
    .slice(0, topN);
}

export function filterByRange(sales, range) {
  if (range === "all") return sales;
  const now = Math.floor(Date.now() / 1000);
  const cutoffs = { "7d": 7, "30d": 30, "90d": 90 };
  const days = cutoffs[range];
  if (!days) return sales;
  const cutoff = now - days * 24 * 60 * 60;
  return sales.filter((s) => s.timestamp >= cutoff);
}