"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function createExercise(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "owner") {
    throw new Error("Unauthorized");
  }

  const name = formData.get("name") as string;
  const category = formData.get("category") as string;
  const instructions = formData.get("instructions") as string;
  const media_url = formData.get("media_url") as string;

  const { data, error } = await supabase
    .from("exercises")
    .insert([{
      name,
      category,
      instructions,
      media_url
    }])
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  try {
    await supabase.rpc("insert_audit_log", {
      p_action: "CREATE_EXERCISE",
      p_entity_type: "exercise",
      p_entity_id: data.id,
      p_member_id: null,
      p_details: { name, category },
    });
  } catch (err) {
    console.error("Audit log failed:", err);
  }

  revalidatePath("/owner/exercises");
}

export async function updateExercise(id: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "owner") {
    throw new Error("Unauthorized");
  }

  const name = formData.get("name") as string;
  const category = formData.get("category") as string;
  const instructions = formData.get("instructions") as string;
  const media_url = formData.get("media_url") as string;

  const { error } = await supabase
    .from("exercises")
    .update({
      name,
      category,
      instructions,
      media_url
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  try {
    await supabase.rpc("insert_audit_log", {
      p_action: "UPDATE_EXERCISE",
      p_entity_type: "exercise",
      p_entity_id: id,
      p_member_id: null,
      p_details: { name, category },
    });
  } catch (err) {
    console.error("Audit log failed:", err);
  }

  revalidatePath("/owner/exercises");
}

export async function seedStarterExercises() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "owner") {
    throw new Error("Unauthorized");
  }

  const starterExercises = [
    { name: "Barbell Squat", category: "Legs", instructions: "Stand with barbell on upper back, feet shoulder-width apart. Squat down until thighs are parallel to the floor, then return to standing." },
    { name: "Bench Press", category: "Chest", instructions: "Lie on bench, grip barbell slightly wider than shoulder-width. Lower bar to chest, then press back up." },
    { name: "Deadlift", category: "Back", instructions: "Stand with feet hip-width apart. Hinge at hips to grip barbell. Keep back straight, lift bar by extending hips and knees." },
    { name: "Overhead Press", category: "Shoulders", instructions: "Stand with barbell at shoulder height. Press bar overhead until arms are fully extended." },
    { name: "Pull-up", category: "Back", instructions: "Grip pull-up bar with overhand grip. Pull body up until chin is above bar, then lower back down." },
  ];

  for (const exercise of starterExercises) {
    // Check if exercise already exists
    const { data: existing } = await supabase
      .from("exercises")
      .select("id")
      .eq("name", exercise.name)
      .maybeSingle();

    if (!existing) {
      const { data, error } = await supabase
        .from("exercises")
        .insert([{
          name: exercise.name,
          category: exercise.category,
          instructions: exercise.instructions,
          media_url: null
        }])
        .select("id")
        .single();

      if (!error && data) {
        try {
          await supabase.rpc("insert_audit_log", {
            p_action: "CREATE_EXERCISE",
            p_entity_type: "exercise",
            p_entity_id: data.id,
            p_member_id: null,
            p_details: { name: exercise.name, category: exercise.category, method: "seed" },
          });
        } catch (err) {
          console.error("Audit log failed for seed:", err);
        }
      }
    }
  }

  revalidatePath("/owner/exercises");
}

export async function deleteExercise(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "owner") {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase
    .from("exercises")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);

  try {
    await supabase.rpc("insert_audit_log", {
      p_action: "DELETE_EXERCISE",
      p_entity_type: "exercise",
      p_entity_id: id,
      p_member_id: null,
      p_details: {},
    });
  } catch (err) {
    console.error("Audit log failed:", err);
  }

  revalidatePath("/owner/exercises");
}
