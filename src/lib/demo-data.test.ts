import { describe, it, expect } from "vitest";
import {
  DEMO_PASSWORD,
  demoOwner,
  demoTrainer,
  demoMember,
  demoMembers,
  demoTrainers,
  demoMembershipPlans,
  demoPayments,
  demoAttendance,
  demoActivities,
  demoProducts,
  demoLeads,
  demoNotifications,
  demoDashboardKPIs,
  demoMemberDietPlan,
  demoMemberWorkoutPlan,
  demoMemberAssessments,
  demoMemberPayments,
} from "./demo-data";

const MEMBER_CODE_RE = /^DHL-\d{4,6}$/;

describe("DEMO_PASSWORD", () => {
  it("is exported as a non-empty string", () => {
    expect(typeof DEMO_PASSWORD).toBe("string");
    expect(DEMO_PASSWORD.length).toBeGreaterThan(0);
  });
});

describe("demoOwner", () => {
  it("has owner role", () => {
    expect(demoOwner.role).toBe("owner");
  });

  it("has a valid email", () => {
    expect(demoOwner.email).toMatch(/@.*-demo\.com$/);
  });
});

describe("demoTrainer", () => {
  it("has trainer role", () => {
    expect(demoTrainer.role).toBe("trainer");
  });

  it("has specialization and qualification", () => {
    expect(demoTrainer.specialization).toBeTruthy();
    expect(demoTrainer.qualification).toBeTruthy();
  });
});

describe("demoMember", () => {
  it("has member role", () => {
    expect(demoMember.role).toBe("member");
  });

  it("memberCode matches DHL-XXXX pattern", () => {
    expect(demoMember.memberCode).toMatch(MEMBER_CODE_RE);
  });

  it("has active status", () => {
    expect(demoMember.status).toBe("active");
  });

  it("has a valid email", () => {
    expect(demoMember.email).toMatch(/@.*-demo\.com$/);
  });
});

describe("demoMembers", () => {
  it("is a non-empty array", () => {
    expect(Array.isArray(demoMembers)).toBe(true);
    expect(demoMembers.length).toBeGreaterThan(0);
  });

  it("every member has a DHL-XXXX code", () => {
    for (const m of demoMembers) {
      expect(m.code).toMatch(MEMBER_CODE_RE);
    }
  });

  it("every member has active or inactive status", () => {
    for (const m of demoMembers) {
      expect(["active", "inactive"]).toContain(m.status);
    }
  });

  it("every member has a name and goal", () => {
    for (const m of demoMembers) {
      expect(m.name).toBeTruthy();
      expect(m.goal).toBeTruthy();
    }
  });
});

describe("demoTrainers", () => {
  it("is a non-empty array", () => {
    expect(Array.isArray(demoTrainers)).toBe(true);
    expect(demoTrainers.length).toBeGreaterThan(0);
  });

  it("every trainer has a specialization", () => {
    for (const t of demoTrainers) {
      expect(t.specialization).toBeTruthy();
    }
  });

  it("assignedMembers counts are non-negative", () => {
    for (const t of demoTrainers) {
      expect(t.assignedMembers).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("demoMembershipPlans", () => {
  it("is a non-empty array with positive prices", () => {
    expect(demoMembershipPlans.length).toBeGreaterThan(0);
    for (const p of demoMembershipPlans) {
      expect(p.price).toBeGreaterThan(0);
    }
  });

  it("every plan has a name and duration", () => {
    for (const p of demoMembershipPlans) {
      expect(p.name).toBeTruthy();
      expect(p.duration).toBeTruthy();
    }
  });
});

describe("demoPayments", () => {
  it("has positive amounts", () => {
    for (const p of demoPayments) {
      expect(p.amount).toBeGreaterThan(0);
    }
  });

  it("every payment has a member, method, and date", () => {
    for (const p of demoPayments) {
      expect(p.member).toBeTruthy();
      expect(p.method).toBeTruthy();
      expect(p.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});

describe("demoAttendance", () => {
  it("every record has member, date, time, method", () => {
    for (const a of demoAttendance) {
      expect(a.member).toBeTruthy();
      expect(a.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(a.time).toBeTruthy();
      expect(a.method).toBeTruthy();
    }
  });
});

describe("demoActivities", () => {
  it("capacity >= booked for all activities", () => {
    for (const a of demoActivities) {
      expect(a.capacity).toBeGreaterThanOrEqual(a.booked);
    }
  });

  it("every activity has name, trainer, time, duration", () => {
    for (const a of demoActivities) {
      expect(a.name).toBeTruthy();
      expect(a.trainer).toBeTruthy();
      expect(a.time).toBeTruthy();
      expect(a.duration).toBeTruthy();
    }
  });
});

describe("demoProducts", () => {
  it("has positive prices and non-negative stock", () => {
    for (const p of demoProducts) {
      expect(p.price).toBeGreaterThan(0);
      expect(p.stock).toBeGreaterThanOrEqual(0);
    }
  });

  it("every product has a name, sku, and category", () => {
    for (const p of demoProducts) {
      expect(p.name).toBeTruthy();
      expect(p.sku).toBeTruthy();
      expect(p.category).toBeTruthy();
    }
  });
});

describe("demoLeads", () => {
  it("has a valid stage for each lead", () => {
    const validStages = ["new", "contacted", "follow-up", "trial", "converted"];
    for (const l of demoLeads) {
      expect(validStages).toContain(l.stage);
    }
  });

  it("every lead has name, phone, source", () => {
    for (const l of demoLeads) {
      expect(l.name).toBeTruthy();
      expect(l.phone).toBeTruthy();
      expect(l.source).toBeTruthy();
    }
  });
});

describe("demoNotifications", () => {
  it("every notification has title and body", () => {
    for (const n of demoNotifications) {
      expect(n.title).toBeTruthy();
      expect(n.body).toBeTruthy();
      expect(typeof n.read).toBe("boolean");
    }
  });
});

describe("demoDashboardKPIs", () => {
  it("active + inactive members equals total members", () => {
    expect(demoDashboardKPIs.activeMembers + demoDashboardKPIs.inactiveMembers).toBe(
      demoDashboardKPIs.totalMembers
    );
  });

  it("collection amounts are non-negative", () => {
    expect(demoDashboardKPIs.todayCollection).toBeGreaterThanOrEqual(0);
    expect(demoDashboardKPIs.weeklyCollection).toBeGreaterThanOrEqual(0);
    expect(demoDashboardKPIs.monthlyCollection).toBeGreaterThanOrEqual(0);
  });

  it("counts are non-negative", () => {
    expect(demoDashboardKPIs.todayAttendance).toBeGreaterThanOrEqual(0);
    expect(demoDashboardKPIs.activeTrainers).toBeGreaterThanOrEqual(0);
    expect(demoDashboardKPIs.openLeads).toBeGreaterThanOrEqual(0);
  });
});

describe("demoMemberDietPlan", () => {
  it("has positive macros", () => {
    expect(demoMemberDietPlan.calories).toBeGreaterThan(0);
    expect(demoMemberDietPlan.protein).toBeGreaterThan(0);
    expect(demoMemberDietPlan.carbs).toBeGreaterThan(0);
    expect(demoMemberDietPlan.fat).toBeGreaterThan(0);
  });

  it("has at least one meal", () => {
    expect(demoMemberDietPlan.meals.length).toBeGreaterThan(0);
    for (const meal of demoMemberDietPlan.meals) {
      expect(meal.time).toBeTruthy();
      expect(meal.name).toBeTruthy();
      expect(meal.items).toBeTruthy();
    }
  });
});

describe("demoMemberWorkoutPlan", () => {
  it("has at least one exercise", () => {
    expect(demoMemberWorkoutPlan.exercises.length).toBeGreaterThan(0);
    for (const ex of demoMemberWorkoutPlan.exercises) {
      expect(ex.name).toBeTruthy();
      expect(ex.sets).toBeGreaterThan(0);
    }
  });
});

describe("demoMemberAssessments", () => {
  it("has positive weights and BMIs", () => {
    for (const a of demoMemberAssessments) {
      expect(a.weight).toBeGreaterThan(0);
      expect(a.bmi).toBeGreaterThan(0);
      expect(a.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});

describe("demoMemberPayments", () => {
  it("has positive amounts", () => {
    for (const p of demoMemberPayments) {
      expect(p.amount).toBeGreaterThan(0);
    }
  });

  it("every payment has method, plan, and status", () => {
    for (const p of demoMemberPayments) {
      expect(p.method).toBeTruthy();
      expect(p.plan).toBeTruthy();
      expect(p.status).toBeTruthy();
      expect(p.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});
