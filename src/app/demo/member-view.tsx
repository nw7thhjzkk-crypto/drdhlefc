import {
  demoMember,
  demoMemberDietPlan,
  demoMemberWorkoutPlan,
  demoMemberAssessments,
  demoMemberPayments,
  demoActivities,
  demoNotifications,
} from "@/lib/demo-data";

export function DemoMemberView() {
  return (
    <div className="demo-role-view">
      <div className="demo-role-header">
        <h2>Welcome, {demoMember.name}</h2>
        <span className="demo-badge demo-badge-member">Member</span>
      </div>

      <div className="demo-member-hero">
        <div className="demo-member-hero-avatar">{demoMember.name.charAt(0)}</div>
        <div>
          <h3>{demoMember.name}</h3>
          <p>{demoMember.memberCode} · {demoMember.email}</p>
          <div className="demo-member-meta">
            <span className="demo-status demo-status-active">{demoMember.status}</span>
            <span>{demoMember.membershipPlan}</span>
            <span>{demoMember.daysRemaining} days remaining</span>
          </div>
        </div>
      </div>

      <div className="demo-kpi-grid demo-kpi-grid-4">
        <div className="demo-kpi">
          <span className="demo-kpi-value">{demoMemberAssessments[0].weight} kg</span>
          <span className="demo-kpi-label">Weight</span>
        </div>
        <div className="demo-kpi">
          <span className="demo-kpi-value">{demoMemberAssessments[0].bmi}</span>
          <span className="demo-kpi-label">BMI</span>
        </div>
        <div className="demo-kpi">
          <span className="demo-kpi-value">{demoMemberAssessments[0].bodyFat}</span>
          <span className="demo-kpi-label">Body Fat</span>
        </div>
        <div className="demo-kpi">
          <span className="demo-kpi-value">{demoMemberAssessments[0].muscleMass}</span>
          <span className="demo-kpi-label">Muscle Mass</span>
        </div>
      </div>

      <div className="demo-two-col">
        <div className="demo-section">
          <h3>My Diet Plan</h3>
          <div className="demo-plan-card">
            <h4>{demoMemberDietPlan.name}</h4>
            <div className="demo-plan-macros">
              <span>{demoMemberDietPlan.calories} kcal</span>
              <span>P: {demoMemberDietPlan.protein}g</span>
              <span>C: {demoMemberDietPlan.carbs}g</span>
              <span>F: {demoMemberDietPlan.fat}g</span>
            </div>
            <div className="demo-plan-meals">
              {demoMemberDietPlan.meals.map((meal, i) => (
                <div key={i} className="demo-meal">
                  <span className="demo-meal-time">{meal.time}</span>
                  <div>
                    <span className="demo-meal-name">{meal.name}</span>
                    <span className="demo-meal-items">{meal.items}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="demo-section">
          <h3>My Workout Plan</h3>
          <div className="demo-plan-card">
            <h4>{demoMemberWorkoutPlan.name}</h4>
            <div className="demo-plan-meta">
              <span>{demoMemberWorkoutPlan.difficulty}</span>
              <span>{demoMemberWorkoutPlan.duration}</span>
            </div>
            <div className="demo-exercise-list">
              {demoMemberWorkoutPlan.exercises.map((ex, i) => (
                <div key={i} className="demo-exercise">
                  <span className="demo-exercise-num">{i + 1}</span>
                  <div>
                    <span className="demo-exercise-name">{ex.name}</span>
                    <span className="demo-exercise-detail">
                      {ex.sets} sets × {ex.reps} · Rest {ex.rest}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="demo-section">
        <h3>Assessment History</h3>
        <div className="demo-table-wrap">
          <table className="demo-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Weight</th>
                <th>BMI</th>
                <th>Body Fat</th>
                <th>Muscle Mass</th>
              </tr>
            </thead>
            <tbody>
              {demoMemberAssessments.map((a, i) => (
                <tr key={i}>
                  <td>{a.date}</td>
                  <td>{a.weight} kg</td>
                  <td>{a.bmi}</td>
                  <td>{a.bodyFat}</td>
                  <td>{a.muscleMass}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="demo-two-col">
        <div className="demo-section">
          <h3>Payment History</h3>
          <div className="demo-table-wrap">
            <table className="demo-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Plan</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {demoMemberPayments.map((p, i) => (
                  <tr key={i}>
                    <td>{p.date}</td>
                    <td>₹{p.amount.toLocaleString("en-IN")}</td>
                    <td>{p.method}</td>
                    <td>{p.plan}</td>
                    <td>
                      <span className="demo-status demo-status-active">{p.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="demo-section">
          <h3>Upcoming Activities</h3>
          <div className="demo-list">
            {demoActivities.slice(0, 3).map((a) => (
              <div key={a.id} className="demo-list-item">
                <div className="demo-list-icon">🏋️</div>
                <div>
                  <span className="demo-list-name">{a.name}</span>
                  <span className="demo-list-detail">{a.time} · {a.trainer} · {a.booked}/{a.capacity}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="demo-section">
        <h3>Notifications</h3>
        <div className="demo-notif-list">
          {demoNotifications.map((n) => (
            <div key={n.id} className={`demo-notif ${n.read ? "demo-notif-read" : ""}`}>
              <div className="demo-notif-title">{n.title}</div>
              <div className="demo-notif-body">{n.body}</div>
              <div className="demo-notif-time">{n.time}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
