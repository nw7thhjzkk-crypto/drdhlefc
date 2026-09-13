import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

/**
 * RLS Policy Verification Tests
 *
 * These tests verify that the database migration files contain the correct
 * RLS policies for each table and role. They parse the SQL migration files
 * to ensure security-critical policies are present and correctly structured.
 *
 * These tests do NOT connect to a live database — they verify the migration
 * files themselves as the source of truth for security policy.
 */

const MIGRATIONS_DIR = join(process.cwd(), "supabase", "migrations");

function readMigration(filename: string): string {
  return readFileSync(join(MIGRATIONS_DIR, filename), "utf-8");
}

const ALL_TABLES = [
  "profiles",
  "trainers",
  "members",
  "member_trainers",
  "membership_plans",
  "memberships",
  "payments",
  "assessments",
  "diet_plans",
  "workout_plans",
  "member_diet_plans",
  "member_workout_plans",
  "exercises",
  "group_activities",
  "activity_bookings",
  "attendance",
  "products",
  "store_sales",
  "store_sale_items",
  "leads",
  "notifications",
  "audit_logs",
  "integration_sources",
];

describe("RLS is enabled on all tables", () => {
  const rlsMigration = readMigration("000002_rls.sql");

  for (const table of ALL_TABLES) {
    it(`enables RLS on ${table}`, () => {
      expect(rlsMigration).toContain(
        `ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`
      );
    });
  }
});

describe("Helper functions exist", () => {
  const rlsMigration = readMigration("000002_rls.sql");

  it("defines auth.role() function", () => {
    expect(rlsMigration).toContain("CREATE OR REPLACE FUNCTION auth.role()");
    expect(rlsMigration).toContain("SECURITY DEFINER");
  });

  it("defines auth.is_owner() function", () => {
    expect(rlsMigration).toContain("CREATE OR REPLACE FUNCTION auth.is_owner()");
  });

  it("defines auth.is_trainer() function", () => {
    expect(rlsMigration).toContain("CREATE OR REPLACE FUNCTION auth.is_trainer()");
  });

  it("defines auth.is_member() function", () => {
    expect(rlsMigration).toContain("CREATE OR REPLACE FUNCTION auth.is_member()");
  });
});

describe("Owner has full access to all tables", () => {
  const rlsMigration = readMigration("000002_rls.sql");

  const ownerAllTables = [
    "profiles",
    "trainers",
    "members",
    "member_trainers",
    "membership_plans",
    "memberships",
    "payments",
    "assessments",
    "diet_plans",
    "workout_plans",
    "member_diet_plans",
    "member_workout_plans",
    "exercises",
    "group_activities",
    "activity_bookings",
    "attendance",
    "products",
    "store_sales",
    "store_sale_items",
    "leads",
    "notifications",
    "integration_sources",
  ];

  for (const table of ownerAllTables) {
    it(`has Owner ALL policy on ${table}`, () => {
      expect(rlsMigration).toContain(`"Owner ALL ${table}" ON ${table}`);
    });
  }
});

describe("Audit logs are append-only (security hardening)", () => {
  const hardeningMigration = readMigration("000008_security_hardening.sql");

  it("drops the Owner ALL policy on audit_logs", () => {
    expect(hardeningMigration).toContain(
      'DROP POLICY IF EXISTS "Owner ALL audit_logs" ON audit_logs'
    );
  });

  it("creates Owner SELECT-only policy on audit_logs", () => {
    expect(hardeningMigration).toContain('"Owner SELECT audit_logs"');
    expect(hardeningMigration).toContain("ON audit_logs FOR SELECT");
  });

  it("creates insert_audit_log SECURITY DEFINER function", () => {
    expect(hardeningMigration).toContain(
      "CREATE OR REPLACE FUNCTION public.insert_audit_log("
    );
    expect(hardeningMigration).toContain("SECURITY DEFINER");
    expect(hardeningMigration).toContain("auth.uid()");
  });

  it("grants execute on insert_audit_log to authenticated", () => {
    expect(hardeningMigration).toContain(
      "GRANT EXECUTE ON FUNCTION public.insert_audit_log"
    );
    expect(hardeningMigration).toContain("TO authenticated");
  });
});

describe("Member role is tightened to SELECT-only on critical tables", () => {
  const hardeningMigration = readMigration("000008_security_hardening.sql");

  const selectOnlyTables = [
    { table: "members", policy: "Member SELECT own member record" },
    { table: "memberships", policy: "Member SELECT own memberships" },
    { table: "payments", policy: "Member SELECT own payments" },
    { table: "attendance", policy: "Member SELECT own attendance" },
  ];

  for (const { table, policy } of selectOnlyTables) {
    it(`tightens member to SELECT-only on ${table}`, () => {
      expect(hardeningMigration).toContain(`"${policy}"`);
      expect(hardeningMigration).toContain(`ON ${table} FOR SELECT`);
    });

    it(`drops the old ALL policy on ${table} for members`, () => {
      expect(hardeningMigration).toContain(
        `DROP POLICY IF EXISTS "Member ALL`
      );
    });
  }
});

describe("Trainer role is tightened to SELECT-only", () => {
  const hardeningMigration = readMigration("000008_security_hardening.sql");

  it("tightens trainer to SELECT-only on trainers", () => {
    expect(hardeningMigration).toContain('"Trainer SELECT own trainer record"');
    expect(hardeningMigration).toContain("ON trainers FOR SELECT");
  });

  it("tightens trainer to SELECT-only on member_trainers", () => {
    expect(hardeningMigration).toContain('"Trainer SELECT own member_trainers"');
    expect(hardeningMigration).toContain("ON member_trainers FOR SELECT");
  });
});

describe("Financial constraints exist", () => {
  const hardeningMigration = readMigration("000008_security_hardening.sql");
  const storeMigration = readMigration("000009_store_atomicity_and_membership_financial.sql");

  it("adds CHECK constraint for positive membership total_amount", () => {
    expect(hardeningMigration).toContain("chk_memberships_total_amount_positive");
    expect(hardeningMigration).toContain("total_amount >= 0");
  });

  it("adds CHECK constraint for positive membership paid_amount", () => {
    expect(hardeningMigration).toContain("chk_memberships_paid_amount_positive");
    expect(hardeningMigration).toContain("paid_amount >= 0");
  });

  it("adds CHECK constraint for positive membership pending_amount", () => {
    expect(hardeningMigration).toContain("chk_memberships_pending_amount_positive");
    expect(hardeningMigration).toContain("pending_amount >= 0");
  });

  it("adds CHECK constraint for positive payment amount", () => {
    expect(hardeningMigration).toContain("chk_payments_amount_positive");
    expect(hardeningMigration).toContain("amount > 0");
  });

  it("adds CHECK constraint for non-negative product stock", () => {
    expect(storeMigration).toContain("chk_products_stock_non_negative");
    expect(storeMigration).toContain("stock_quantity >= 0");
  });

  it("adds CHECK constraint for non-negative selling price", () => {
    expect(storeMigration).toContain("chk_products_selling_price_positive");
    expect(storeMigration).toContain("selling_price >= 0");
  });
});

describe("Atomic RPCs exist for financial operations", () => {
  const hardeningMigration = readMigration("000008_security_hardening.sql");
  const storeMigration = readMigration("000009_store_atomicity_and_membership_financial.sql");

  it("record_payment_atomic is SECURITY DEFINER", () => {
    expect(hardeningMigration).toContain(
      "CREATE OR REPLACE FUNCTION public.record_payment_atomic("
    );
    expect(hardeningMigration).toContain("SECURITY DEFINER");
  });

  it("record_payment_atomic checks owner role", () => {
    expect(hardeningMigration).toContain("Only owners may record payments");
  });

  it("record_payment_atomic validates amount > 0", () => {
    expect(hardeningMigration).toContain("Payment amount must be greater than zero");
  });

  it("record_payment_atomic prevents overpayment", () => {
    expect(hardeningMigration).toContain("would exceed total amount");
  });

  it("checkout_store_sale is SECURITY DEFINER", () => {
    expect(storeMigration).toContain(
      "CREATE OR REPLACE FUNCTION public.checkout_store_sale("
    );
    expect(storeMigration).toContain("SECURITY DEFINER");
  });

  it("checkout_store_sale checks owner role", () => {
    expect(storeMigration).toContain("Only owners may process sales");
  });

  it("checkout_store_sale validates stock availability", () => {
    expect(storeMigration).toContain("Insufficient stock");
  });

  it("checkout_store_sale uses FOR UPDATE locking", () => {
    expect(storeMigration).toContain("FOR UPDATE");
  });

  it("assign_membership is SECURITY DEFINER", () => {
    expect(storeMigration).toContain(
      "CREATE OR REPLACE FUNCTION public.assign_membership("
    );
    expect(storeMigration).toContain("SECURITY DEFINER");
  });

  it("assign_membership checks owner role", () => {
    expect(storeMigration).toContain("Only owners may assign memberships");
  });

  it("assign_membership derives total from plan price", () => {
    expect(storeMigration).toContain("v_plan.price");
  });
});

describe("Activity booking RPCs exist", () => {
  const hardeningMigration = readMigration("000008_security_hardening.sql");

  it("book_activity_for_member is SECURITY DEFINER", () => {
    expect(hardeningMigration).toContain(
      "CREATE OR REPLACE FUNCTION public.book_activity_for_member("
    );
    expect(hardeningMigration).toContain("SECURITY DEFINER");
  });

  it("book_activity_for_member derives member_id from auth.uid()", () => {
    expect(hardeningMigration).toContain("WHERE profile_id = auth.uid()");
  });

  it("book_activity_for_member uses FOR UPDATE locking", () => {
    expect(hardeningMigration).toContain("FOR UPDATE");
  });

  it("book_activity_for_member checks capacity", () => {
    expect(hardeningMigration).toContain("fully booked");
  });

  it("cancel_activity_booking is SECURITY DEFINER", () => {
    expect(hardeningMigration).toContain(
      "CREATE OR REPLACE FUNCTION public.cancel_activity_booking("
    );
    expect(hardeningMigration).toContain("SECURITY DEFINER");
  });

  it("cancel_activity_booking checks authorization", () => {
    expect(hardeningMigration).toContain("Not authorised to cancel this booking");
  });

  it("partial unique index prevents duplicate active bookings", () => {
    expect(hardeningMigration).toContain("uix_activity_bookings_active");
    expect(hardeningMigration).toContain("WHERE status = 'booked'");
  });
});

describe("Schema has proper indexes for RLS performance", () => {
  const schemaMigration = readMigration("000001_initial_schema.sql");

  const criticalIndexes = [
    "idx_members_profile_id",
    "idx_trainers_profile_id",
    "idx_member_trainers_member_id",
    "idx_member_trainers_trainer_id",
    "idx_memberships_member_id",
    "idx_payments_member_id",
    "idx_assessments_member_id",
    "idx_attendance_member_id",
    "idx_activity_bookings_activity_id",
    "idx_activity_bookings_member_id",
    "idx_notifications_recipient_profile_id",
    "idx_audit_logs_actor_profile_id",
    "idx_audit_logs_member_id",
  ];

  for (const idx of criticalIndexes) {
    it(`has index ${idx}`, () => {
      expect(schemaMigration).toContain(idx);
    });
  }
});

describe("Role protection trigger exists", () => {
  const schemaMigration = readMigration("000001_initial_schema.sql");

  it("prevents role updates on profiles", () => {
    expect(schemaMigration).toContain("prevent_role_update");
    expect(schemaMigration).toContain("Cannot update role");
  });
});

describe("Security hardening migrations are present", () => {
  it("migration 000008 exists", () => {
    expect(() => readMigration("000008_security_hardening.sql")).not.toThrow();
  });

  it("migration 000009 exists", () => {
    expect(() =>
      readMigration("000009_store_atomicity_and_membership_financial.sql")
    ).not.toThrow();
  });
});
