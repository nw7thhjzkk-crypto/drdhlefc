"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { uploadPhoto } from "@/utils/upload";
import { createAuthUser } from "@/utils/supabase/admin";

export async function createTrainer(formData: FormData) {
  const supabase = await createClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData?.session?.user?.id;

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const qualification = formData.get("qualification") as string;
  const specialization = formData.get("specialization") as string;
  const joining_date = formData.get("joining_date") as string;
  const salary_basic = parseFloat(formData.get("salary_basic") as string);
  const salary_allowances = parseFloat(formData.get("salary_allowances") as string) || 0;
  const salary_deductions = parseFloat(formData.get("salary_deductions") as string) || 0;
  const notes = formData.get("notes") as string;
  const photo = formData.get("photo") as File;

  const { url, error: uploadError } = await uploadPhoto(supabase, photo, 'member-photos', 'trainers');
  if (uploadError) {
    return { error: uploadError };
  }
  const photo_url = url;

  const { id: profile_id, error: authError } = await createAuthUser(email, name, 'trainer');

  if (authError || !profile_id) {
    return { error: authError || "Failed to create user" };
  }

  const { data: trainerData, error: trainerError } = await supabase
    .from('trainers')
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
      status: 'active',
      notes
    })
    .select('id')
    .single();

  if (trainerError) return { error: trainerError.message };

  if (userId) {
    await supabase.from('audit_logs').insert({
      actor_profile_id: userId,
      action: 'create_trainer',
      entity_type: 'trainer',
      entity_id: trainerData.id,
      details: { name, email }
    });
  }

  revalidatePath("/owner/trainers");
  return { success: true, trainerId: trainerData.id };
}

export async function updateTrainer(id: string, formData: FormData) {
  const supabase = await createClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData?.session?.user?.id;

  const allowedKeys = ["name", "email", "phone", "qualification", "specialization", "joining_date", "notes", "status"];
  const updates: Record<string, string | null> = {};

  formData.forEach((value, key) => {
    if (allowedKeys.includes(key)) {
      updates[key] = value ? (value as string) : null;
    }
  });

  if (formData.has("salary_basic")) updates.salary_basic = formData.get("salary_basic") as string;
  if (formData.has("salary_allowances")) updates.salary_allowances = formData.get("salary_allowances") as string;
  if (formData.has("salary_deductions")) updates.salary_deductions = formData.get("salary_deductions") as string;

  const photo = formData.get("photo") as File;
  const { url, error: uploadError } = await uploadPhoto(supabase, photo, 'member-photos', 'trainers');
  if (uploadError) {
    return { error: uploadError };
  }
  if (url) {
    updates.photo_url = url;
  }

  const { error } = await supabase.from('trainers').update(updates).eq('id', id);

  if (error) return { error: error.message };

  if (userId) {
    await supabase.from('audit_logs').insert({
      actor_profile_id: userId,
      action: 'update_trainer',
      entity_type: 'trainer',
      entity_id: id,
      details: updates
    });
  }

  revalidatePath(`/owner/trainers/${id}`);
  revalidatePath("/owner/trainers");
  return { success: true };
}
