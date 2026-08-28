import { assignTrainer, unassignTrainer } from "../../actions";

export default function TrainerSummary({
  trainer,
  trainerAssignment,
  id,
  allTrainers,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  trainer: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  trainerAssignment: any;
  id: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  allTrainers: any[];
}) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4 border-b pb-2">Assigned Trainer</h2>
      {trainer ? (
        <div className="flex justify-between items-center">
          <p className="text-sm font-medium text-gray-900">{trainer.name}</p>
          <form
            action={async () => {
              "use server";
              await unassignTrainer(trainerAssignment.id, id);
            }}
          >
            <button type="submit" className="text-xs text-red-600 hover:text-red-800">
              Unassign
            </button>
          </form>
        </div>
      ) : (
        <div>
          <p className="text-gray-500 text-sm mb-4">No assigned trainer.</p>
          <form
            action={async (formData) => {
              "use server";
              await assignTrainer(id, formData.get("trainer_id") as string);
            }}
            className="flex gap-2 text-sm"
          >
            <select name="trainer_id" required className="block w-full border border-gray-300 rounded p-2">
              <option value="">Select Trainer...</option>
              {allTrainers?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="bg-blue-600 text-white px-3 py-2 rounded shadow hover:bg-blue-700 whitespace-nowrap"
            >
              Assign
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
