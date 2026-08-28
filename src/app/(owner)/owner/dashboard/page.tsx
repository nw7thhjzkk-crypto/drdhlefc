import { createClient } from "@/utils/supabase/server";
import { logout } from "@/app/auth/logout/actions";
import Link from "next/link";
import DashboardCharts from "./DashboardCharts"; // Client component for charts

export default async function OwnerDashboard() {
  const supabase = await createClient();

  // 1. KPI Queries
  const { count: totalMembers } = await supabase.from("members").select("*", { count: "exact", head: true });
  const { count: activeMembers } = await supabase.from("members").select("*", { count: "exact", head: true }).eq("status", "active");
  const { count: inactiveMembers } = await supabase.from("members").select("*", { count: "exact", head: true }).eq("status", "inactive");

  // Date calculations
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const thirtyDaysFromNow = new Date(today);
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  const thirtyDaysStr = thirtyDaysFromNow.toISOString().split('T')[0];

  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const firstDayOfYear = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];

  // Revenue Queries
  const { data: todayPayments } = await supabase.from("payments").select("amount").gte("paid_at", todayStr).lt("paid_at", tomorrowStr);
  const todaysCollection = todayPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

  const { data: monthPayments } = await supabase.from("payments").select("amount").gte("paid_at", firstDayOfMonth);
  const monthlyCollection = monthPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

  const { data: yearPayments } = await supabase.from("payments").select("amount").gte("paid_at", firstDayOfYear);
  const yearlyCollection = yearPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

  // Pending Receivables
  const { data: pendingMemberships } = await supabase.from("memberships").select("pending_amount").gt("pending_amount", 0);
  const totalPending = pendingMemberships?.reduce((sum, m) => sum + Number(m.pending_amount), 0) || 0;

  // 2. Chart Data Queries
  const { data: genderData } = await supabase.from("members").select("gender").eq("status", "active");
  const genderCount: Record<string, number> = { Male: 0, Female: 0, Other: 0 };
  genderData?.forEach(m => {
    if (m.gender && genderCount[m.gender] !== undefined) genderCount[m.gender]++;
    else if (m.gender) genderCount["Other"]++;
  });
  const chartGenderData = Object.keys(genderCount).map(k => ({ name: k, value: genderCount[k] }));

  // Basic monthly revenue trend (simplified for scaffolding: grouping all payments into current month for demo)
  const chartRevenueData = [
    { name: "Current Month", revenue: monthlyCollection }
  ];

  // 3. Lists
  // Upcoming Expiries (next 30 days)
  const { data: expiringMemberships } = await supabase
    .from("memberships")
    .select(`
      id, end_date, members(id, name, member_code), membership_plans(name)
    `)
    .eq("status", "active")
    .gte("end_date", todayStr)
    .lte("end_date", thirtyDaysStr)
    .order("end_date", { ascending: true })
    .limit(10);

  // Expired Memberships
  const { count: expiredMemberships } = await supabase
    .from("memberships")
    .select("*", { count: "exact", head: true })
    .eq("status", "expired")
    .lt("end_date", todayStr); // Or simply checking where end_date < today

  // Birthdays this month
  const currentMonthNum = today.getMonth() + 1; // 1-12
  const { data: birthdaysThisMonthData } = await supabase
    .from("members")
    .select("id, name, dob")
    .eq("status", "active")
    .eq("dob_month", currentMonthNum);
  const birthdaysThisMonth = birthdaysThisMonthData || [];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">Owner Dashboard</h1>
          <form action={logout}>
            <button type="submit" className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 text-sm font-medium">
              Logout
            </button>
          </form>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
            <p className="text-sm font-medium text-gray-500 mb-1">Total Members</p>
            <p className="text-3xl font-bold text-gray-900">{totalMembers}</p>
            <p className="text-xs text-green-600 mt-2">{activeMembers} Active / <span className="text-red-500">{inactiveMembers} Inactive</span></p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-green-500">
            <p className="text-sm font-medium text-gray-500 mb-1">Today&apos;s Collection</p>
            <p className="text-3xl font-bold text-gray-900">${todaysCollection.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-2">${monthlyCollection.toFixed(2)} this month / ${yearlyCollection.toFixed(2)} this year</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-yellow-500">
            <p className="text-sm font-medium text-gray-500 mb-1">Upcoming Renewals (30d)</p>
            <p className="text-3xl font-bold text-gray-900">{expiringMemberships?.length || 0}</p>
            <p className="text-xs text-red-500 mt-2">{expiredMemberships} currently expired</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-purple-500">
            <p className="text-sm font-medium text-gray-500 mb-1">Pending Receivables</p>
            <p className="text-3xl font-bold text-gray-900">${totalPending.toFixed(2)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Charts */}
          <div className="lg:col-span-2 space-y-8">
             <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-lg font-semibold mb-4 text-gray-800">Analytics</h2>
                <DashboardCharts genderData={chartGenderData} revenueData={chartRevenueData} />
             </div>
          </div>

          {/* Lists */}
          <div className="space-y-8">

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-lg font-semibold mb-4 text-gray-800">Expiring Memberships (30 days)</h2>
              {expiringMemberships && expiringMemberships.length > 0 ? (
                <ul className="divide-y divide-gray-100">
                  {expiringMemberships.map((membership: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) => (
                    <li key={membership.id} className="py-3">
                      <Link href={`/owner/members/${membership.members?.id}`} className="block hover:bg-gray-50 rounded px-2 -mx-2">
                        <p className="text-sm font-medium text-gray-900">{membership.members?.name}</p>
                        <p className="text-xs text-gray-500">
                          {membership.membership_plans?.name} • Exps: <span className="text-red-600 font-semibold">{membership.end_date}</span>
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No upcoming expirations (next 30 days).</p>
              )}
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-lg font-semibold mb-4 text-gray-800">Birthdays This Month</h2>
              {birthdaysThisMonth.length > 0 ? (
                <ul className="divide-y divide-gray-100">
                  {birthdaysThisMonth.map(member => (
                    <li key={member.id} className="py-2 flex justify-between items-center text-sm">
                      <span className="font-medium text-gray-900">{member.name}</span>
                      <span className="text-gray-500">{new Date(member.dob).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No birthdays this month.</p>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
