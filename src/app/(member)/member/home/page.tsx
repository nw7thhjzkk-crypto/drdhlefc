import { createClient } from "@/utils/supabase/server";
import ActivityBooking from "./components/ActivityBooking";

export default async function MemberHomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <div>Not authenticated</div>;
  }

  const { data: member } = await supabase
    .from("members")
    .select("*")
    .eq("profile_id", user.id)
    .single();

  if (!member) {
    return <div>Member profile not found</div>;
  }

  const { data: latestAssessment } = await supabase
    .from("assessments")
    .select("weight_kg, bmi, body_fat_pct, recorded_at")
    .eq("member_id", member.id)
    .order("recorded_at", { ascending: false })
    .limit(1)
    .single();

  const { data: membership } = await supabase
    .from("memberships")
    .select("end_date, status, membership_plans(name)")
    .eq("member_id", member.id)
    .eq("status", "active")
    .limit(1)
    .single();

  const now = new Date().toISOString();
  const { data: upcomingActivities } = await supabase
    .from("group_activities")
    .select("*")
    .is("deleted_at", null)
    .gte("start_at", now)
    .order("start_at", { ascending: true })
    .limit(6);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-yellow-500">Welcome back, {member.name}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg shadow-xl text-center">
          <p className="text-sm font-medium text-zinc-400">Latest Weight</p>
          <p className="mt-2 text-4xl font-bold text-zinc-100">
            {latestAssessment ? `${latestAssessment.weight_kg} kg` : "--"}
          </p>
          <p className="text-xs text-zinc-500 mt-2">
            {latestAssessment ? new Date(latestAssessment.recorded_at).toLocaleDateString() : 'No data'}
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg shadow-xl text-center">
          <p className="text-sm font-medium text-zinc-400">Current BMI</p>
          <p className="mt-2 text-4xl font-bold text-zinc-100">
            {latestAssessment?.bmi || "--"}
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg shadow-xl text-center">
          <p className="text-sm font-medium text-zinc-400">Membership</p>
          <p className="mt-2 text-xl font-bold text-zinc-100 mt-4">
            {membership ? membership.membership_plans?.[0]?.name || (membership.membership_plans as unknown as any)?.name : "Inactive"}
          </p>
          <p className="text-xs text-zinc-500 mt-2">
            {membership ? `Valid until ${new Date(membership.end_date).toLocaleDateString()}` : 'Please contact front desk'}
          </p>
        </div>

        <ActivityBooking activities={upcomingActivities || []} member_id={member.id} />

      </div>
    </div>
  );
}
