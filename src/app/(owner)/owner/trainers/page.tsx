import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import Image from "next/image";

export default async function TrainersPage() {
  const supabase = await createClient();

  const { data: trainers } = await supabase
    .from("trainers")
    .select(`
      *,
      member_trainers (count)
    `)
    .order("created_at", { ascending: false });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-zinc-100">Trainers</h1>
        <Link
          href="/owner/trainers/new"
          className="bg-yellow-500 text-zinc-900 font-bold px-4 py-2 rounded hover:bg-yellow-400"
        >
          Add Trainer
        </Link>
      </div>

      {(!trainers || trainers.length === 0) ? (
        <div className="flex flex-col items-center justify-center space-y-4 rounded-lg border border-zinc-800 bg-zinc-950/60 p-10 text-center">
          <h3 className="text-lg font-semibold text-yellow-500">
            No trainers yet
          </h3>
          <p className="max-w-md text-sm text-zinc-500">
            Add your first trainer to start building your team.
          </p>
          <Link
            href="/owner/trainers/new"
            className="bg-zinc-800 text-yellow-500 font-bold px-4 py-2 rounded hover:bg-zinc-700 border border-zinc-700 inline-block"
          >
            Add First Trainer
          </Link>
        </div>
      ) : (
        <div className="bg-zinc-900 rounded-lg shadow-xl border border-zinc-800 overflow-hidden">
          <table className="min-w-full divide-y divide-zinc-800">
            <thead className="bg-zinc-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Trainer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Specialization</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Assigned Members</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-zinc-900 divide-y divide-zinc-800">
              {trainers?.map((trainer) => (
                <tr key={trainer.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 relative bg-zinc-800 rounded-full overflow-hidden">
                        {trainer.photo_url ? (
                          <Image src={trainer.photo_url} alt={trainer.name} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex justify-center items-center text-zinc-500">?</div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-zinc-100">{trainer.name}</div>
                        <div className="text-sm text-zinc-400">{trainer.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-zinc-300">{trainer.specialization || "N/A"}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${trainer.status === 'active' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                      {trainer.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                    {trainer.member_trainers?.[0]?.count || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link href={`/owner/trainers/${trainer.id}`} className="text-yellow-500 hover:text-yellow-400">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
