import { createClient } from "@/utils/supabase/server";
import Link from "next/link";

type AssignedMember = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: string | null;
  primary_goal: string | null;
};

type AssignmentRow = {
  member_id: string;
  members: AssignedMember | AssignedMember[] | null;
};


export default async function TrainerMembersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <div>Not authenticated</div>;
  }

  const { data: trainer } = await supabase
    .from("trainers")
    .select("id")
    .eq("profile_id", user.id)
    .single();

  if (!trainer) {
    return <div>Trainer profile not found</div>;
  }

  const { data: assignments } = await supabase
    .from("member_trainers")
    .select(`
      member_id,
      members (
        id,
        name,
        email,
        phone,
        status,
        primary_goal
      )
    `)
    .eq("trainer_id", trainer.id);

  const members: AssignedMember[] = ((assignments as AssignmentRow[] | null) ?? []).flatMap((a) => {
    const m = a.members;
    if (!m) return [];
    return Array.isArray(m) ? m : [m];
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-yellow-500">My Assigned Members</h1>
      </div>

      <div className="bg-zinc-900 rounded-lg shadow-xl border border-zinc-800 overflow-hidden">
        <table className="min-w-full divide-y divide-zinc-800">
          <thead className="bg-zinc-950">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Goal</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-zinc-900 divide-y divide-zinc-800">
            {members.map((member) => (
              <tr key={member.id} className="hover:bg-zinc-800/50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-zinc-200">{member.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-zinc-400">{member.email}</div>
                  <div className="text-sm text-zinc-500">{member.phone}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                  {member.primary_goal || 'None'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${member.status === 'active' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                    {member.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <Link href={`/trainer/members/${member.id}`} className="text-yellow-500 hover:text-yellow-400">
                    View Profile
                  </Link>
                </td>
              </tr>
            ))}
            {members.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">No members assigned to you yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
