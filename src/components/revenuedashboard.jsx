import { useState, useEffect, useCallback } from "react";
import RevenueChart from "./revenuechart";
import {
  fetchRevenueEvents,
  computeSummary,
  groupByPeriod,
  groupByCrop,
  groupByFarmer,
  filterByRange,
} from "../utils/revenueAnalytics";
import { formatUSDC, shortenAddress } from "../utils/format";

function RevenueDashboard({ marketplace, provider }) {
  const [sales, setSales] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [range, setRange] = useState("30d");
  const [period, setPeriod] = useState("day");
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const toBlock = await provider.getBlockNumber();
      const events = await fetchRevenueEvents(marketplace, provider, toBlock);
      setSales(events);
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
      setError("Failed to load revenue data. Try refreshing.");
    } finally {
      setLoading(false);
    }
  }, [marketplace, provider]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="dashboard">
        <h2>Revenue</h2>
        <p className="hint">Loading on-chain revenue data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <h2>Revenue</h2>
        <p className="status">{error}</p>
        <button onClick={loadData}>Retry</button>
      </div>
    );
  }

  const filteredSales = filterByRange(sales, range);
  const summary = computeSummary(filteredSales);
  const chartData = groupByPeriod(filteredSales, period);
  const cropBreakdown = groupByCrop(filteredSales);
  const topFarmers = groupByFarmer(filteredSales);

  return (
    <div className="dashboard">
      <h2>Revenue</h2>
      <p className="hint">
        Gross commission collected by the cooperative. This does not yet
        reflect expenses — treasury spending tracking is planned separately.
      </p>

      <div className="button-row">
        <select value={range} onChange={(e) => setRange(e.target.value)}>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="all">All time</option>
        </select>
        <select value={period} onChange={(e) => setPeriod(e.target.value)}>
          <option value="day">Daily</option>
          <option value="week">Weekly</option>
          <option value="month">Monthly</option>
        </select>
        <button onClick={loadData}>Refresh</button>
      </div>

      {lastUpdated && (
        <p className="hint">Last updated: {lastUpdated.toLocaleTimeString()}</p>
      )}

      {sales.length === 0 ? (
        <p className="hint">No sales have gone through the marketplace yet.</p>
      ) : (
        <>
          <div className="dashboard-grid">
            <section className="card">
              <h3>Total Revenue</h3>
              <p className="stat">{formatUSDC(summary.totalRevenue)} USDC</p>
            </section>
            <section className="card">
              <h3>This Month</h3>
              <p className="stat">{formatUSDC(summary.revenueThisMonth)} USDC</p>
            </section>
            <section className="card">
              <h3>This Week</h3>
              <p className="stat">{formatUSDC(summary.revenueThisWeek)} USDC</p>
            </section>
            <section className="card">
              <h3>Total Sales</h3>
              <p className="stat">{summary.totalSales}</p>
            </section>
            <section className="card">
              <h3>Avg. Commission / Sale</h3>
              <p className="stat">{formatUSDC(summary.avgCommission)} USDC</p>
            </section>
          </div>

          <section className="card card--full">
            <h3>Revenue Over Time</h3>
            <RevenueChart data={chartData} />
          </section>

          <div className="dashboard-grid">
            <section className="card">
              <h3>Revenue by Crop</h3>
              {cropBreakdown.map((c) => (
                <div key={c.label} className="breakdown-row">
                  <span>{c.label}</span>
                  <span>{formatUSDC(c.value)} USDC</span>
                </div>
              ))}
            </section>

            <section className="card">
              <h3>Top Farmers by Commission Generated</h3>
              {topFarmers.map((f) => (
                <div key={f.fullAddress} className="breakdown-row">
                  <span>{f.label}</span>
                  <span>{formatUSDC(f.value)} USDC</span>
                </div>
              ))}
            </section>
          </div>

          <section className="card card--full">
            <h3>Recent Transactions</h3>
            <table className="revenue-table">
              <thead>
                <tr>
                  <th>Batch</th>
                  <th>Crop</th>
                  <th>Farmer</th>
                  <th>Buyer</th>
                  <th>Commission</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredSales
                  .slice()
                  .reverse()
                  .slice(0, 20)
                  .map((s) => (
                    <tr key={s.txHash}>
                      <td>#{s.batchId}</td>
                      <td>{s.cropVariety}</td>
                      <td>{shortenAddress(s.farmer)}</td>
                      <td>{shortenAddress(s.buyer)}</td>
                      <td>{formatUSDC(s.commission)} USDC</td>
                      <td>{new Date(s.timestamp * 1000).toLocaleDateString()}</td>
                      <td>
                        <a
                          href={`https://sepolia.etherscan.io/tx/${s.txHash}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View
                        </a>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </section>
        </>
      )}
    </div>
  );
}

export default RevenueDashboard;