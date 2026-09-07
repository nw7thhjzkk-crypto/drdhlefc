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
