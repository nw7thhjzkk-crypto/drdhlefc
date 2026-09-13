import {
  demoDashboardKPIs,
  demoMembers,
  demoPayments,
  demoActivities,
  demoProducts,
  demoLeads,
  demoNotifications,
  demoMembershipPlans,
} from "@/lib/demo-data";

function fmtINR(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function DemoOwnerView() {
  const kpis = demoDashboardKPIs;

  return (
    <div className="demo-role-panel">
      <div className="demo-role-header">
        <h2>Owner Dashboard</h2>
        <span className="badge badge-gold">DEMO</span>
      </div>

      {/* KPI Grid */}
      <div className="demo-kpi-grid">
        <div className="stat-card">
          <div className="stat-card-label">Active Members</div>
          <div className="stat-card-value">{kpis.activeMembers}</div>
          <div className="stat-card-sub">{kpis.totalMembers} total · {kpis.inactiveMembers} inactive</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Today&apos;s Collection</div>
          <div className="stat-card-value">{fmtINR(kpis.todayCollection)}</div>
          <div className="stat-card-sub">This week: {fmtINR(kpis.weeklyCollection)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Outstanding Dues</div>
          <div className="stat-card-value">{fmtINR(kpis.outstandingDues)}</div>
          <div className="stat-card-sub">{kpis.openLeads} open leads</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Today&apos;s Attendance</div>
          <div className="stat-card-value">{kpis.todayAttendance}</div>
          <div className="stat-card-sub">{kpis.todayActivities} activities scheduled</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Active Trainers</div>
          <div className="stat-card-value">{kpis.activeTrainers}</div>
          <div className="stat-card-sub">{kpis.expiringMemberships} expiring soon</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Store Sales</div>
          <div className="stat-card-value">{fmtINR(kpis.storeSalesToday)}</div>
          <div className="stat-card-sub">{kpis.lowStockItems} low stock alert</div>
        </div>
      </div>

      {/* Members Table */}
      <section className="demo-section">
        <h3>Members</h3>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Code</th>
                <th>Status</th>
                <th>Goal</th>
                <th>Trainer</th>
                <th>Plan</th>
              </tr>
            </thead>
            <tbody>
              {demoMembers.map((m) => (
                <tr key={m.id}>
                  <td><strong>{m.name}</strong></td>
                  <td>{m.code}</td>
                  <td>
                    <span className={`badge ${m.status === "active" ? "badge-success" : "badge-danger"}`}>
                      {m.status}
                    </span>
                  </td>
                  <td>{m.goal}</td>
                  <td>{m.trainer || "—"}</td>
                  <td>{m.membership}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Recent Payments */}
      <section className="demo-section">
        <h3>Recent Payments</h3>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Date</th>
                <th>Plan</th>
              </tr>
            </thead>
            <tbody>
              {demoPayments.map((p) => (
                <tr key={p.id}>
                  <td><strong>{p.member}</strong></td>
                  <td>{fmtINR(p.amount)}</td>
                  <td>{p.method}</td>
                  <td>{p.date}</td>
                  <td>{p.plan}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Membership Plans */}
      <section className="demo-section">
        <h3>Membership Plans</h3>
        <div className="demo-plan-grid">
          {demoMembershipPlans.map((plan) => (
            <div key={plan.id} className="stat-card">
              <div className="stat-card-label">{plan.type.toUpperCase()}</div>
              <div className="stat-card-value">{fmtINR(plan.price)}</div>
              <div className="stat-card-sub">{plan.name} · {plan.duration}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Activities */}
      <section className="demo-section">
        <h3>Today&apos;s Activities</h3>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Activity</th>
                <th>Trainer</th>
                <th>Time</th>
                <th>Duration</th>
                <th>Capacity</th>
              </tr>
            </thead>
            <tbody>
              {demoActivities.map((a) => (
                <tr key={a.id}>
                  <td><strong>{a.name}</strong></td>
                  <td>{a.trainer}</td>
                  <td>{a.time}</td>
                  <td>{a.duration}</td>
                  <td>{a.booked}/{a.capacity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Store Products */}
      <section className="demo-section">
        <h3>Store Products</h3>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Category</th>
              </tr>
            </thead>
            <tbody>
              {demoProducts.map((p) => (
                <tr key={p.id}>
                  <td><strong>{p.name}</strong></td>
                  <td>{p.sku}</td>
                  <td>{fmtINR(p.price)}</td>
                  <td>
                    <span className={`badge ${p.stock < 10 ? "badge-danger" : "badge-success"}`}>
                      {p.stock}
                    </span>
                  </td>
                  <td>{p.category}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* CRM Leads */}
      <section className="demo-section">
        <h3>CRM Leads</h3>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Source</th>
                <th>Stage</th>
                <th>Follow-up</th>
              </tr>
            </thead>
            <tbody>
              {demoLeads.map((l) => (
                <tr key={l.id}>
                  <td><strong>{l.name}</strong></td>
                  <td>{l.phone}</td>
                  <td>{l.source}</td>
                  <td>
                    <span className={`badge ${l.stage === "trial" ? "badge-success" : l.stage === "new" ? "badge-info" : "badge-warning"}`}>
                      {l.stage}
                    </span>
                  </td>
                  <td>{l.followUp || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Notifications */}
      <section className="demo-section">
        <h3>Recent Notifications</h3>
        <div className="demo-notif-list">
          {demoNotifications.map((n) => (
            <div key={n.id} className={`demo-notif ${n.read ? "read" : "unread"}`}>
              <div className="demo-notif-title">{n.title}</div>
              <div className="demo-notif-body">{n.body}</div>
              <div className="demo-notif-time">{n.time}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
