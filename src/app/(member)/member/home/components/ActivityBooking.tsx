"use client";

import { useState, useTransition } from "react";
import { bookActivity } from "../actions";

export default function ActivityBooking({ activities }: { activities: { id: string; name: string; start_at: string; location: string | null; duration_minutes: number | null; }[] }) {
  const [isPending, startTransition] = useTransition();
  const [bookedIds, setBookedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const handleBook = (activity_id: string) => {
    setError(null);
    startTransition(async () => {
      try {
        await bookActivity(activity_id);
        setBookedIds((prev) => new Set(prev).add(activity_id));
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to book activity");
      }
    });
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg shadow-xl col-span-1 md:col-span-3">
        <h2 className="text-lg font-medium text-zinc-100 mb-4 border-b border-zinc-800 pb-2">Upcoming Classes & Activities</h2>
        {error && (
          <div role="alert" className="mb-4 rounded-lg border border-red-800 bg-red-950/60 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activities.map(act => {
                const isBooked = bookedIds.has(act.id);
                return (
                <div key={act.id} className="bg-zinc-950 border border-zinc-800 p-4 rounded-lg flex flex-col justify-between">
                    <div>
                        <h3 className="font-bold text-yellow-500">{act.name}</h3>
                        <p className="text-xs text-zinc-400 mt-1">{new Date(act.start_at).toLocaleString()}</p>
                        <p className="text-xs text-zinc-500">{act.location} • {act.duration_minutes} mins</p>
                    </div>
                    {isBooked ? (
                        <div className="mt-4 text-center text-xs font-bold text-green-400 bg-green-950/40 border border-green-800 rounded px-4 py-2">
                          Booked
                        </div>
                    ) : (
                        <button
                            disabled={isPending}
                            onClick={() => handleBook(act.id)}
                            className="mt-4 bg-yellow-600 text-zinc-950 text-xs font-bold px-4 py-2 rounded hover:bg-yellow-500 w-full"
                        >
                            {isPending ? 'Booking...' : 'Book Spot'}
                        </button>
                    )}
                </div>
                );
            })}
            {activities.length === 0 && (
                <p className="text-zinc-500 text-sm">No upcoming activities found.</p>
            )}
        </div>
    </div>
  );
}
