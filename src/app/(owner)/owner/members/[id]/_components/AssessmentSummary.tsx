import { addAssessment } from "../../actions";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function AssessmentSummary({ latestAssessment, id }: { latestAssessment: any; id: string }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4 border-b pb-2">Latest Assessment</h2>
      {latestAssessment ? (
        <div className="space-y-2 text-sm mb-6">
          <p>
            <span className="font-medium text-gray-500">Date:</span>{" "}
            {new Date(latestAssessment.recorded_at).toLocaleDateString()}
          </p>
          <p>
            <span className="font-medium text-gray-500">Height:</span> {latestAssessment.height_cm} cm
          </p>
          <p>
            <span className="font-medium text-gray-500">Weight:</span> {latestAssessment.weight_kg} kg
          </p>
          {latestAssessment.bmi && (
            <p>
              <span className="font-medium text-gray-500">BMI:</span> {latestAssessment.bmi}
            </p>
          )}
          {latestAssessment.body_fat_pct && (
            <p>
              <span className="font-medium text-gray-500">Body Fat:</span> {latestAssessment.body_fat_pct}%
            </p>
          )}
          {latestAssessment.notes && (
            <p>
              <span className="font-medium text-gray-500">Notes:</span> {latestAssessment.notes}
            </p>
          )}
        </div>
      ) : (
        <p className="text-gray-500 text-sm mb-6">No assessments recorded.</p>
      )}

      <details className="group">
        <summary className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-800 list-none">
          + Add Manual Assessment
        </summary>
        <form
          action={async (formData) => {
            "use server";
            await addAssessment(id, formData);
          }}
          className="mt-4 space-y-4 text-sm border-t pt-4"
        >
          <div>
            <label className="block text-gray-700">Height (cm)</label>
            <input
              name="height_cm"
              type="number"
              step="0.1"
              required
              className="mt-1 block w-full border border-gray-300 rounded p-2"
            />
          </div>
          <div>
            <label className="block text-gray-700">Weight (kg)</label>
            <input
              name="weight_kg"
              type="number"
              step="0.1"
              required
              className="mt-1 block w-full border border-gray-300 rounded p-2"
            />
          </div>
          <div>
            <label className="block text-gray-700">Body Fat (%)</label>
            <input
              name="body_fat_pct"
              type="number"
              step="0.1"
              className="mt-1 block w-full border border-gray-300 rounded p-2"
            />
          </div>
          <div>
            <label className="block text-gray-700">Notes</label>
            <textarea
              name="notes"
              rows={2}
              className="mt-1 block w-full border border-gray-300 rounded p-2"
            ></textarea>
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700">
            Save Assessment
          </button>
        </form>
      </details>
    </div>
  );
}
