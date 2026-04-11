import { useQuery } from "@tanstack/react-query";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { apiGet } from "../api/client";

interface StatsResponse {
  total: number;
  recentTotal: number;
  successRate: number;
  avgLatency: number;
  endpointCount: number;
  byMinute: Record<string, { total: number; success: number; error: number }>;
  byEndpoint: Record<string, { total: number; success: number; avgLatency: number }>;
}

interface StateLog {
  id: number;
  endpoint: string;
  method: string;
  path: string;
  returnedStatusCode: number;
  durationMs?: number;
  note: string;
  timestamp: string;
}

interface StateResponse {
  logs: StateLog[];
}

function formatAge(isoTs: string): string {
  const diffMs = Date.now() - new Date(isoTs).getTime();
  const sec = Math.max(0, Math.floor(diffMs / 1000));
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  return `${hr}h ago`;
}

export function Dashboard() {
  const statsQuery = useQuery({
    queryKey: ["stats"],
    queryFn: () => apiGet<StatsResponse>("/api/stats"),
    refetchInterval: 5000
  });

  const stateQuery = useQuery({
    queryKey: ["state"],
    queryFn: () => apiGet<StateResponse>("/api/state"),
    refetchInterval: 3000
  });

  if (statsQuery.isLoading) {
    return (
      <section className="page-card">
        <h1>Dashboard</h1>
        <p>Loading live dashboard...</p>
      </section>
    );
  }

  if (statsQuery.isError || !statsQuery.data) {
    return (
      <section className="page-card">
        <h1>Dashboard</h1>
        <p>Unable to load stats right now.</p>
      </section>
    );
  }

  const stats = statsQuery.data;
  const chartData = Object.entries(stats.byMinute)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-30)
    .map(([minute, value]) => ({
      minute: minute.slice(11),
      total: value.total,
      success: value.success,
      error: value.error
    }));

  const endpointRows = Object.entries(stats.byEndpoint)
    .map(([endpoint, value]) => ({
      endpoint,
      total: value.total,
      successRate: value.total ? (value.success / value.total) * 100 : 100,
      avgLatency: value.avgLatency
    }))
    .sort((a, b) => b.total - a.total);

  const liveLogs = (stateQuery.data?.logs || []).slice(0, 10);

  return (
    <section className="dashboard-grid">
      <article className="page-card metric-row">
        <div>
          <h1>Total Requests</h1>
          <p className="metric-value">{stats.total}</p>
          <p>+{stats.recentTotal} in last hour</p>
        </div>
        <div>
          <h1>Success Rate</h1>
          <p className="metric-value">{stats.successRate.toFixed(1)}%</p>
          <p>last hour</p>
        </div>
        <div>
          <h1>Avg Latency</h1>
          <p className="metric-value">{Math.round(stats.avgLatency)}ms</p>
          <p>last hour</p>
        </div>
        <div>
          <h1>Endpoints</h1>
          <p className="metric-value">{stats.endpointCount}</p>
          <p>configured routes</p>
        </div>
      </article>

      <article className="page-card chart-card">
        <h1>Requests per Minute (30m)</h1>
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#4a3d73" />
              <XAxis dataKey="minute" stroke="#a79fbe" />
              <YAxis stroke="#a79fbe" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="total" stroke="#8f7cff" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="success" stroke="#c2ef4e" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="error" stroke="#ff6f91" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </article>

      <article className="page-card">
        <h1>Endpoint Health</h1>
        <ul className="simple-list">
          {endpointRows.map((row) => (
            <li key={row.endpoint}>
              <strong>{row.endpoint}</strong>{" "}
              <span>{row.successRate.toFixed(1)}% success</span>{" "}
              <span>({Math.round(row.avgLatency)}ms avg)</span>
            </li>
          ))}
          {endpointRows.length === 0 && <li>No endpoint activity yet.</li>}
        </ul>
      </article>

      <article className="page-card">
        <h1>Live Feed (last 10)</h1>
        <ul className="simple-list">
          {liveLogs.map((log) => (
            <li key={log.id}>
              <strong>
                {log.method} {log.path}
              </strong>{" "}
              <span>{log.returnedStatusCode}</span>{" "}
              <span>{typeof log.durationMs === "number" ? `${log.durationMs}ms` : "-"}</span>{" "}
              <span>{formatAge(log.timestamp)}</span>
            </li>
          ))}
          {liveLogs.length === 0 && <li>No requests yet.</li>}
        </ul>
      </article>
    </section>
  );
}
