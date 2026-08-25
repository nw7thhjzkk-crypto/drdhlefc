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
      member_trainers(trainer_id, trainers(name)),
      memberships${membership_status ? "!inner" : ""}(status, end_date)
    `, { count: "exact" });

  if (q) {
    query = query.or(`name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%`);
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
        <h1 className="text-2xl font-bold text-gray-900">Members</h1>
        <Link
          href="/owner/members/new"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add Member
        </Link>
      </div>

      <div className="bg-white p-4 rounded-lg shadow mb-6 flex gap-4">
        <form className="flex gap-4 w-full" action="/owner/members" method="GET">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search name, phone, email..."
            className="border p-2 rounded flex-1"
          />
          <select name="status" defaultValue={status} className="border p-2 rounded">
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select name="goal" defaultValue={goal} className="border p-2 rounded">
            <option value="">All Goals</option>
            <option value="Weight Loss">Weight Loss</option>
            <option value="Muscle Gain">Muscle Gain</option>
            <option value="Endurance">Endurance</option>
          </select>
          <select name="membership_status" defaultValue={membership_status} className="border p-2 rounded">
            <option value="">All Memberships</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="expiring soon">Expiring Soon</option>
          </select>
          <button type="submit" className="bg-gray-100 px-4 py-2 rounded border">Filter</button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status & Goal</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trainer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Membership</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {members?.map((member) => (
              <tr key={member.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 relative bg-gray-200 rounded-full overflow-hidden">
                      {member.photo_url ? (
                        <Image src={member.photo_url} alt={member.name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex justify-center items-center text-gray-500">?</div>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{member.name}</div>
                      <div className="text-sm text-gray-500">{member.member_code}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{member.phone}</div>
                  <div className="text-sm text-gray-500">{member.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${member.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {member.status}
                  </span>
                  <div className="text-sm text-gray-500 mt-1">{member.primary_goal || 'None'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {member.member_trainers?.[0]?.trainers?.name || "Unassigned"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {member.memberships?.[0]?.status || "None"}
                  {member.memberships?.[0]?.end_date && ` (exp: ${member.memberships[0].end_date})`}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <Link href={`/owner/members/${member.id}`} className="text-blue-600 hover:text-blue-900">
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
          {page > 1 && <Link href={`/owner/members?page=${page - 1}&q=${q}&status=${status}&goal=${goal}`} className="px-3 py-1 bg-white border rounded">Prev</Link>}
          <span className="px-3 py-1">Page {page} of {totalPages}</span>
          {page < totalPages && <Link href={`/owner/members?page=${page + 1}&q=${q}&status=${status}&goal=${goal}`} className="px-3 py-1 bg-white border rounded">Next</Link>}
        </div>
      )}
    </div>
  );
}
