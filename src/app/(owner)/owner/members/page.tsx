import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import Image from "next/image";

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; goal?: string; membership_status?: string; page?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;

  const q = params.q || "";
  const status = params.status || "";
  const goal = params.goal || "";
  const membership_status = params.membership_status || "";
  const page = parseInt(params.page || "1");
  const pageSize = 10;

  let query = supabase
    .from("members")
    .select(`
      *,
      member_trainers(trainer_id, unassigned_at, trainers(name)),
      memberships${membership_status ? "!inner" : ""}(status, end_date)
    `, { count: "exact" });

  if (q) {
    const safeQ = `%${q}%`.replace(/"/g, '""');
    query = query.or(`name.ilike."${safeQ}",phone.ilike."${safeQ}",email.ilike."${safeQ}"`);
  }
  if (status) {
    query = query.eq("status", status);
  }
  if (membership_status) {
    query = query.eq("memberships.status", membership_status);
  }
  if (goal) {
    query = query.eq("primary_goal", goal);
  }

  const { data: members, count } = await query
    .range((page - 1) * pageSize, page * pageSize - 1)
    .order("created_at", { ascending: false });

  const totalPages = Math.ceil((count || 0) / pageSize);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-zinc-100">Members</h1>
        <Link
          href="/owner/members/new"
          className="bg-zinc-800 text-yellow-500 font-bold px-4 py-2 rounded hover:bg-zinc-700 transition-colors border border-zinc-700"
        >
          Add Member
        </Link>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg mb-6 flex gap-4">
        <form className="flex gap-4 w-full" action="/owner/members" method="GET">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search name, phone, email..."
            className="bg-zinc-800 border border-zinc-700 text-zinc-100 p-2 rounded flex-1"
          />
          <select name="status" defaultValue={status} className="bg-zinc-800 border border-zinc-700 text-zinc-100 p-2 rounded">
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select name="goal" defaultValue={goal} className="bg-zinc-800 border border-zinc-700 text-zinc-100 p-2 rounded">
            <option value="">All Goals</option>
            <option value="Weight Loss">Weight Loss</option>
            <option value="Muscle Gain">Muscle Gain</option>
            <option value="Endurance">Endurance</option>
          </select>
          <select name="membership_status" defaultValue={membership_status} className="bg-zinc-800 border border-zinc-700 text-zinc-100 p-2 rounded">
            <option value="">All Memberships</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="expiring soon">Expiring Soon</option>
          </select>
          <button type="submit" className="bg-zinc-800 text-zinc-100 px-4 py-2 rounded border border-zinc-700 hover:bg-zinc-700">Filter</button>
        </form>
      </div>

      {(!members || members.length === 0) ? (
        <div className="py-12 text-center bg-zinc-900 border border-zinc-800 rounded-lg">
          <p className="text-zinc-500 mb-4">No members found.</p>
          <Link
            href="/owner/members/new"
            className="bg-zinc-800 text-yellow-500 font-bold px-4 py-2 rounded hover:bg-zinc-700 transition-colors border border-zinc-700 inline-block"
          >
            Add New Member
          </Link>
        </div>
      ) : (
        <>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-zinc-800">
              <thead className="bg-zinc-900 border-b border-zinc-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Member</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Status & Goal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Trainer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Membership</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-zinc-900 divide-y divide-zinc-800">
                {members.map((member) => (
                  <tr key={member.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 relative bg-zinc-800 rounded-full overflow-hidden">
                          {member.photo_url ? (
                            <Image src={member.photo_url} alt={member.name} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex justify-center items-center text-zinc-400">?</div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-zinc-100">{member.name}</div>
                          <div className="text-sm text-zinc-400">{member.member_code}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-zinc-100">{member.phone}</div>
                      <div className="text-sm text-zinc-400">{member.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${member.status === 'active' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                        {member.status}
                      </span>
                      <div className="text-sm text-zinc-400 mt-1">{member.primary_goal || 'None'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                      {member.member_trainers?.find((t: { unassigned_at: string | null }) => t.unassigned_at === null)?.trainers?.name || "Unassigned"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                      {member.memberships?.[0]?.status || "None"}
                      {member.memberships?.[0]?.end_date && ` (exp: ${member.memberships[0].end_date})`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link href={`/owner/members/${member.id}`} className="text-yellow-500 hover:text-yellow-400">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {page > 1 && <Link href={`/owner/members?page=${page - 1}&q=${q}&status=${status}&goal=${goal}`} className="px-3 py-1 bg-zinc-800 text-zinc-100 border border-zinc-700 rounded hover:bg-zinc-700">Prev</Link>}
              <span className="px-3 py-1 text-zinc-400">Page {page} of {totalPages}</span>
              {page < totalPages && <Link href={`/owner/members?page=${page + 1}&q=${q}&status=${status}&goal=${goal}`} className="px-3 py-1 bg-zinc-800 text-zinc-100 border border-zinc-700 rounded hover:bg-zinc-700">Next</Link>}
            </div>
          )}
        </>
      )}
    </div>
  );
}
