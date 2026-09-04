"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function createTrainer(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "owner") {
    return { error: "Unauthorized: Only owners can create trainers." };
  }

  const name             = formData.get("name")             as string;
  const email            = formData.get("email")            as string;
  const phone            = formData.get("phone")            as string;
  const qualification    = formData.get("qualification")    as string;
  const specialization   = formData.get("specialization")   as string;
  const joining_date     = formData.get("joining_date")     as string;
  const salary_basic     = parseFloat(formData.get("salary_basic")     as string);
  const salary_allowances = parseFloat(formData.get("salary_allowances") as string) || 0;
  const salary_deductions = parseFloat(formData.get("salary_deductions") as string) || 0;
  const notes            = formData.get("notes")            as string;
  const photo            = formData.get("photo")            as File;

  let photo_url = null;

  if (photo && photo.size > 0) {
    const fileExt = photo.name.split(".").pop()?.toLowerCase();
    const allowedExtensions = ["jpg", "jpeg", "png", "webp", "gif"];
    if (!fileExt || !allowedExtensions.includes(fileExt)) {
      return { error: "Invalid file extension. Only jpg, jpeg, png, webp, and gif are allowed." };
    }
    if (!photo.type.startsWith("image/")) {
      return { error: "Invalid file type. Only images are allowed." };
    }
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `trainers/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("member-photos")
      .upload(filePath, photo);

    if (uploadError) return { error: uploadError.message };
    const { data } = supabase.storage.from("member-photos").getPublicUrl(filePath);
    photo_url = data.publicUrl;
  }

  const { createClient: createSupabaseClient } = await import("@supabase/supabase-js");
  const adminAuthClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: authData, error: authError } = await adminAuthClient.auth.admin.createUser({
    email,
    password: crypto.randomUUID() + "A1!",
    email_confirm: true,
    user_metadata: { full_name: name },
    app_metadata: { role: "trainer" },
  });

  if (authError) return { error: authError.message };

  const profile_id = authData.user.id;

  const { data: trainerData, error: trainerError } = await supabase
    .from("trainers")
    .insert({
      profile_id,
      name,
      email,
      phone,
      photo_url,
      qualification,
      specialization,
      joining_date: joining_date || null,
      salary_basic,
      salary_allowances,
      salary_deductions,
      status: "active",
      notes,
    })
    .select("id")
    .single();

  if (trainerError) return { error: trainerError.message };

  await supabase.rpc("insert_audit_log", {
    p_action: "CREATE_TRAINER",
    p_entity_type: "trainer",
    p_entity_id: trainerData.id,
    p_member_id: null,
    p_details: { name, email },
  });

  revalidatePath("/owner/trainers");
  return { success: true, trainerId: trainerData.id };
}

export async function updateTrainer(id: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "owner") {
    return { error: "Unauthorized: Only owners can update trainers." };
  }

  // Only allow updating specific non-sensitive profile fields via this endpoint.
  // Salary fields are explicitly handled separately (owner-only).
  const allowedKeys = [
    "name", "email", "phone", "qualification",
    "specialization", "joining_date", "notes", "status",
  ];
  const updates: Record<string, string | null> = {};

  formData.forEach((value, key) => {
    if (allowedKeys.includes(key)) {
      updates[key] = value ? (value as string) : null;
    }
  });

  // Salary fields — owner-controlled, explicit opt-in
  if (formData.has("salary_basic"))      updates.salary_basic      = formData.get("salary_basic")      as string;
  if (formData.has("salary_allowances")) updates.salary_allowances = formData.get("salary_allowances") as string;
  if (formData.has("salary_deductions")) updates.salary_deductions = formData.get("salary_deductions") as string;

  const photo = formData.get("photo") as File;
  if (photo && photo.size > 0) {
    const fileExt = photo.name.split(".").pop()?.toLowerCase();
    const allowedExtensions = ["jpg", "jpeg", "png", "webp", "gif"];
    if (!fileExt || !allowedExtensions.includes(fileExt)) {
      return { error: "Invalid file extension. Only jpg, jpeg, png, webp, and gif are allowed." };
    }
    if (!photo.type.startsWith("image/")) {
      return { error: "Invalid file type. Only images are allowed." };
    }
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `trainers/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("member-photos")
      .upload(filePath, photo);

    if (uploadError) return { error: uploadError.message };
    const { data } = supabase.storage.from("member-photos").getPublicUrl(filePath);
    updates.photo_url = data.publicUrl;
  }

  const { error } = await supabase.from("trainers").update(updates).eq("id", id);
  if (error) return { error: error.message };

  await supabase.rpc("insert_audit_log", {
    p_action: "UPDATE_TRAINER",
    p_entity_type: "trainer",
    p_entity_id: id,
    p_member_id: null,
    p_details: { updated_fields: Object.keys(updates) },
  });

  revalidatePath(`/owner/trainers/${id}`);
  revalidatePath("/owner/trainers");
  return { success: true };
}
