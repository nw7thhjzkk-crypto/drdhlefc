import { createClient } from "@/utils/supabase/server";
import { archiveMember } from "../actions";
import Link from "next/link";
import { redirect } from "next/navigation";
import MemberDetailsForm from "./_components/MemberDetailsForm";
import MembershipSummary from "./_components/MembershipSummary";
import TrainerSummary from "./_components/TrainerSummary";
import AssessmentSummary from "./_components/AssessmentSummary";

export default async function MemberProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { id } = await params;

  const { data: member, error } = await supabase
    .from("members")
    .select(`
      *,
      member_trainers(id, trainer_id, trainers(name)),
      memberships(id, start_date, end_date, total_amount, paid_amount, pending_amount, status, payments(amount, method, paid_at), membership_plans(id, name, price)),
      assessments(*)
    `)
    .eq("id", id)
    .single();

  if (error || !member) {
    redirect("/owner/members");
  }

  // Fetch available plans and trainers for assignment
  const { data: plans } = await supabase.from("membership_plans").select("*").eq("status", "active");
  const { data: allTrainers } = await supabase.from("trainers").select("id, name").eq("status", "active");

  const trainerAssignment = member.member_trainers?.[0];
  const trainer = trainerAssignment?.trainers;

  const membership = member.memberships?.[0];
  const assessments = member.assessments || [];
  const latestAssessment = assessments.sort((a: {recorded_at: string}, b: {recorded_at: string}) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime())[0];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/owner/members" className="text-gray-500 hover:text-gray-900">&larr; Back</Link>
          <h1 className="text-2xl font-bold text-gray-900">Member Profile: {member.member_code}</h1>
        </div>
        {member.status === 'active' && (
          <form action={async () => {
            "use server";
            await archiveMember(id);
          }}>
            <button type="submit" className="bg-red-100 text-red-700 px-4 py-2 rounded hover:bg-red-200">
              Archive Member
            </button>
          </form>
        )}
        {member.status === 'inactive' && (
          <span className="bg-red-100 text-red-800 px-4 py-2 rounded font-semibold">Archived (Inactive)</span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column: Form */}
        <MemberDetailsForm member={member} id={id} />

        {/* Right Column: Summaries & Assessments */}
        <div className="space-y-6">

          {/* Membership Summary */}
          <MembershipSummary membership={membership} id={id} plans={plans || []} />

          {/* Trainer Summary */}
          <TrainerSummary trainer={trainer} trainerAssignment={trainerAssignment} id={id} allTrainers={allTrainers || []} />

          {/* Assessments */}
          <AssessmentSummary latestAssessment={latestAssessment} id={id} />

        </div>
      </div>
    </div>
  );
}
