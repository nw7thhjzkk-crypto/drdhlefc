import {
  demoTrainer,
  demoMembers,
  demoMemberAssessments,
  demoActivities,
  demoMemberDietPlan,
  demoMemberWorkoutPlan,
} from "@/lib/demo-data";

export function DemoTrainerView() {
  const assignedMembers = demoMembers.filter((m) => m.trainer === demoTrainer.name);

  return (
    <div className="demo-role-view">
      <div className="demo-role-header">
        <h2>Trainer: {demoTrainer.name}</h2>
        <span className="demo-badge demo-badge-trainer">Trainer</span>
      </div>

      <div className="demo-trainer-info">
        <div className="demo-card">
          <div className="demo-card-avatar">{demoTrainer.name.charAt(0)}</div>
          <div className="demo-card-body">
            <h4>{demoTrainer.name}</h4>
            <p>{demoTrainer.specialization}</p>
            <span className="demo-card-meta">{demoTrainer.qualification}</span>
          </div>
        </div>
      </div>

      <div className="demo-kpi-grid">
        <div className="demo-kpi">
          <span className="demo-kpi-value">{assignedMembers.length}</span>
          <span className="demo-kpi-label">Assigned Members</span>
        </div>
        <div className="demo-kpi">
          <span className="demo-kpi-value">3</span>
          <span className="demo-kpi-label">Today&apos;s Check-ins</span>
        </div>
        <div className="demo-kpi">
          <span className="demo-kpi-value">2</span>
          <span className="demo-kpi-label">Pending Recommendations</span>
        </div>
      </div>

      <div className="demo-section">
        <h3>Assigned Members</h3>
        <div className="demo-card-grid">
          {assignedMembers.map((m) => (
            <div key={m.id} className="demo-card">
              <div className="demo-card-avatar">{m.name.charAt(0)}</div>
              <div className="demo-card-body">
                <h4>{m.name}</h4>
                <p>{m.goal}</p>
                <span className="demo-card-meta">{m.membership}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="demo-section">
        <h3>Diet Plan — {demoMemberDietPlan.name}</h3>
        <div className="demo-macro-grid">
          <div className="demo-macro">
            <span className="demo-macro-value">{demoMemberDietPlan.calories}</span>
            <span className="demo-macro-label">Calories</span>
          </div>
          <div className="demo-macro">
            <span className="demo-macro-value">{demoMemberDietPlan.protein}g</span>
            <span className="demo-macro-label">Protein</span>
          </div>
          <div className="demo-macro">
            <span className="demo-macro-value">{demoMemberDietPlan.carbs}g</span>
            <span className="demo-macro-label">Carbs</span>
          </div>
          <div className="demo-macro">
            <span className="demo-macro-value">{demoMemberDietPlan.fat}g</span>
            <span className="demo-macro-label">Fat</span>
          </div>
        </div>
        <div className="demo-meal-list">
          {demoMemberDietPlan.meals.map((meal, i) => (
            <div key={i} className="demo-meal">
              <span className="demo-meal-time">{meal.time}</span>
              <span className="demo-meal-name">{meal.name}</span>
              <span className="demo-meal-items">{meal.items}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="demo-section">
        <h3>Workout Plan — {demoMemberWorkoutPlan.name}</h3>
        <div className="demo-table-wrap">
          <table className="demo-table">
            <thead>
              <tr>
                <th>Exercise</th>
                <th>Sets</th>
                <th>Reps</th>
                <th>Rest</th>
              </tr>
            </thead>
            <tbody>
              {demoMemberWorkoutPlan.exercises.map((ex, i) => (
                <tr key={i}>
                  <td className="demo-cell-name">{ex.name}</td>
                  <td>{ex.sets}</td>
                  <td>{ex.reps}</td>
                  <td>{ex.rest}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="demo-section">
        <h3>Recent Assessments</h3>
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

      <div className="demo-section">
        <h3>Today&apos;s Activities</h3>
        <div className="demo-list">
          {demoActivities.map((a) => (
            <div key={a.id} className="demo-list-item">
              <div className="demo-list-icon">🏋️</div>
              <div>
                <span className="demo-list-name">{a.name}</span>
                <span className="demo-list-detail">{a.time} · {a.trainer} · {a.booked}/{a.capacity} booked</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
