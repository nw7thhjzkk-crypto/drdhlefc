"use client";

import { useState } from "react";

type ExerciseOptions = {
  exercise_id: string;
  name: string;
  sets?: number;
  reps?: number;
  notes?: string;
};

type WorkoutExercisePickerProps = {
  exercises: { id: string; name: string }[];
  defaultValue?: ExerciseOptions[];
};

export default function WorkoutExercisePicker({
  exercises,
  defaultValue = [],
}: WorkoutExercisePickerProps) {
  const [selectedExercises, setSelectedExercises] = useState<ExerciseOptions[]>(defaultValue);

  const [exerciseId, setExerciseId] = useState("");
  const [sets, setSets] = useState("");
  const [reps, setReps] = useState("");
  const [notes, setNotes] = useState("");

  const addExercise = () => {
    if (!exerciseId) return;

    const exercise = exercises.find(e => e.id === exerciseId);
    if (!exercise) return;

    const newExercise: ExerciseOptions = {
      exercise_id: exercise.id,
      name: exercise.name,
    };

    if (sets) newExercise.sets = parseInt(sets, 10);
    if (reps) newExercise.reps = parseInt(reps, 10);
    if (notes) newExercise.notes = notes;

    setSelectedExercises([...selectedExercises, newExercise]);

    // Reset form
    setExerciseId("");
    setSets("");
    setReps("");
    setNotes("");
  };

  const removeExercise = (index: number) => {
    setSelectedExercises(selectedExercises.filter((_, i) => i !== index));
  };

  const contentJson = JSON.stringify({ exercises: selectedExercises });

  return (
    <div className="space-y-4">
      <input type="hidden" name="content" value={contentJson} />

      {selectedExercises.length > 0 && (
        <div className="space-y-2 mb-4">
          <label className="block text-xs text-zinc-500 font-medium">Selected Exercises</label>
          {selectedExercises.map((ex, idx) => (
            <div key={idx} className="flex items-center justify-between bg-zinc-900 border border-zinc-700 p-2 rounded">
              <div>
                <div className="text-sm text-zinc-200 font-medium">{ex.name}</div>
                <div className="text-xs text-zinc-400">
                  {ex.sets ? `${ex.sets} sets` : ""}
                  {ex.sets && ex.reps ? " × " : ""}
                  {ex.reps ? `${ex.reps} reps` : ""}
                  {(ex.sets || ex.reps) && ex.notes ? " | " : ""}
                  {ex.notes}
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeExercise(idx)}
                className="text-red-500 text-xs hover:text-red-400"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="bg-zinc-900 border border-zinc-800 p-3 rounded space-y-3">
        <label className="block text-xs text-zinc-500 font-medium">Add Exercise</label>

        <div>
          <select
            value={exerciseId}
            onChange={(e) => setExerciseId(e.target.value)}
            className="block w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-zinc-200 text-sm"
          >
            <option value="">Select an exercise...</option>
            {exercises.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <input
              type="number"
              placeholder="Sets"
              value={sets}
              onChange={(e) => setSets(e.target.value)}
              className="block w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-zinc-200 text-sm"
            />
          </div>
          <div>
            <input
              type="number"
              placeholder="Reps"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              className="block w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-zinc-200 text-sm"
            />
          </div>
        </div>

        <div>
          <input
            type="text"
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="block w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-zinc-200 text-sm"
          />
        </div>

        <button
          type="button"
          onClick={addExercise}
          disabled={!exerciseId}
          className="w-full bg-zinc-800 text-yellow-500 font-bold px-3 py-2 rounded hover:bg-zinc-700 text-xs border border-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add to Plan
        </button>
      </div>
    </div>
  );
}
