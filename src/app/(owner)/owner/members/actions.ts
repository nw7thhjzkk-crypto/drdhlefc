"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

import { type SupabaseClient } from "@supabase/supabase-js";

/**
 * Verify the caller is authenticated and is an owner.
 * Uses getUser() for server-side JWT verification (not a local cookie read).
 * Returns the verified user id, or null if not authorised.
 */
async function verifyOwner(
  supabase: SupabaseClient
): Promise<{ userId: string } | null> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (!user || authError) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "owner") return null;
  return { userId: user.id };
}

// ---------------------------------------------------------------------------
// createMember
// ---------------------------------------------------------------------------
export async function createMember(formData: FormData) {
  const supabase = await createClient();

  const auth = await verifyOwner(supabase);
  if (!auth) return { error: "Unauthorized" };

  const name                    = formData.get("name")                    as string;
  const email                   = formData.get("email")                   as string;
  const phone                   = formData.get("phone")                   as string;
  const dob                     = formData.get("dob")                     as string;
  const gender                  = formData.get("gender")                  as string;
  const address                 = formData.get("address")                 as string;
  const emergency_contact_name  = formData.get("emergency_contact_name")  as string;
  const emergency_contact_phone = formData.get("emergency_contact_phone") as string;
  const primary_goal            = formData.get("primary_goal")            as string;
  const secondary_goal          = formData.get("secondary_goal")          as string;
  const fitness_level           = formData.get("fitness_level")           as string;
  const diet_preference         = formData.get("diet_preference")         as string;
  const training_experience     = formData.get("training_experience")     as string;
  const notes                   = formData.get("notes")                   as string;
  const photo                   = formData.get("photo")                   as File;

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
    const filePath = `members/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("member-photos")
      .upload(filePath, photo);

    if (uploadError) return { error: uploadError.message };

    const { data } = supabase.storage.from("member-photos").getPublicUrl(filePath);
    photo_url = data.publicUrl;
  }

  // Create the auth user via the service-role admin client
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
    app_metadata: { role: "member" },
  });

  if (authError) return { error: authError.message };

  const profile_id   = authData.user.id;
  const member_code  = `DHL-${Math.floor(1000 + Math.random() * 9000)}`;

  const { data: memberData, error: memberError } = await supabase
    .from("members")
    .insert({
      profile_id,
      member_code,
      name,
      email,
      phone,
      dob:                     dob || null,
      gender,
      address,
      emergency_contact_name,
      emergency_contact_phone,
      primary_goal,
      secondary_goal,
      fitness_level,
      diet_preference,
      training_experience,
      notes,
      photo_url,
      status: "active",
    })
    .select("id")
    .single();

  if (memberError) return { error: memberError.message };

  // Audit via SECURITY DEFINER RPC — actor_profile_id = auth.uid() is set
  // inside the function; callers cannot supply a different identity.
  await supabase.rpc("insert_audit_log", {
    p_action:      "CREATE_MEMBER",
    p_entity_type: "member",
    p_entity_id:   memberData.id,
    p_member_id:   memberData.id,
    p_details:     { name, email, member_code },
  });

  revalidatePath("/owner/members");
  return { success: true, memberId: memberData.id };
}

// ---------------------------------------------------------------------------
// updateMember
// ---------------------------------------------------------------------------
export async function updateMember(id: string, formData: FormData) {
  const supabase = await createClient();

  const auth = await verifyOwner(supabase);
  if (!auth) return { error: "Unauthorized" };

  const updates: Record<string, string | null> = {};
  const allowedKeys = new Set([
    "name", "email", "phone", "dob", "gender", "address",
    "emergency_contact_name", "emergency_contact_phone",
    "primary_goal", "secondary_goal", "fitness_level",
    "diet_preference", "training_experience", "notes",
  ]);
  formData.forEach((value, key) => {
    if (allowedKeys.has(key)) {
      updates[key] = value ? (value as string) : null;
    }
  });

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
    const filePath = `members/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("member-photos")
      .upload(filePath, photo);

    if (uploadError) return { error: uploadError.message };

    const { data } = supabase.storage.from("member-photos").getPublicUrl(filePath);
    updates.photo_url = data.publicUrl;
  }

  const { error } = await supabase.from("members").update(updates).eq("id", id);
  if (error) return { error: error.message };

  await supabase.rpc("insert_audit_log", {
    p_action:      "UPDATE_MEMBER",
    p_entity_type: "member",
    p_entity_id:   id,
    p_member_id:   id,
    p_details:     updates,
  });

  revalidatePath(`/owner/members/${id}`);
  revalidatePath("/owner/members");
  return { success: true };
}

// ---------------------------------------------------------------------------
// archiveMember
// ---------------------------------------------------------------------------
export async function archiveMember(id: string) {
  const supabase = await createClient();

  const auth = await verifyOwner(supabase);
  if (!auth) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("members")
    .update({ status: "inactive" })
    .eq("id", id);

  if (error) return { error: error.message };

  await supabase.rpc("insert_audit_log", {
    p_action:      "ARCHIVE_MEMBER",
    p_entity_type: "member",
    p_entity_id:   id,
    p_member_id:   id,
    p_details:     { status: "inactive" },
  });

  revalidatePath(`/owner/members/${id}`);
  revalidatePath("/owner/members");
  return { success: true };
}

// ---------------------------------------------------------------------------
// addAssessment
// ---------------------------------------------------------------------------
export async function addAssessment(memberId: string, formData: FormData) {
  const supabase = await createClient();

  const auth = await verifyOwner(supabase);
  if (!auth) return { error: "Unauthorized" };

  const height_cm    = parseFloat(formData.get("height_cm")    as string);
  const weight_kg    = parseFloat(formData.get("weight_kg")    as string);
  const body_fat_pct = parseFloat(formData.get("body_fat_pct") as string);
  const notes        = formData.get("notes")                   as string;

  let bmi = null;
  if (height_cm > 0 && weight_kg > 0) {
    const height_m = height_cm / 100;
    bmi = parseFloat((weight_kg / (height_m * height_m)).toFixed(2));
  }

  const { data, error } = await supabase
    .from("assessments")
    .insert({
      member_id:   memberId,
      recorded_by: auth.userId,   // server-derived from getUser(), not FormData
      source:      "manual",
      height_cm,
      weight_kg,
      bmi,
      body_fat_pct,
      notes,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await supabase.rpc("insert_audit_log", {
    p_action:      "ADD_ASSESSMENT",
    p_entity_type: "assessment",
    p_entity_id:   data.id,
    p_member_id:   memberId,
    p_details:     { height_cm, weight_kg, bmi, body_fat_pct },
  });

  revalidatePath(`/owner/members/${memberId}`);
  return { success: true };
}

// ---------------------------------------------------------------------------
// assignMembership
// ---------------------------------------------------------------------------
export async function assignMembership(memberId: string, formData: FormData) {
  const supabase = await createClient();

  const auth = await verifyOwner(supabase);
  if (!auth) return { error: "Unauthorized" };

  const plan_id    = formData.get("plan_id")    as string;
  const start_date = formData.get("start_date") as string;
  // paid_amount comes from FormData but is validated server-side inside the RPC.
  // total_amount is NOT accepted from the client — the RPC derives it from the
  // authoritative membership_plans.price.
  const paid_amount = parseFloat(formData.get("paid_amount") as string) || 0;

  if (!plan_id || !start_date) {
    return { error: "Missing required fields" };
  }
  if (isNaN(paid_amount) || paid_amount < 0) {
    return { error: "paid_amount must be a non-negative number" };
  }

  // Delegate to the SECURITY DEFINER RPC assign_membership():
  // - derives total_amount from authoritative plan price
  // - validates paid_amount <= total_amount
  // - calculates end_date from plan.duration_days
  // - derives status server-side
  // - inserts the membership and writes audit
  const { data: membership_id, error: rpcError } = await supabase.rpc(
    "assign_membership",
    {
      p_member_id:   memberId,
      p_plan_id:     plan_id,
      p_start_date:  start_date,
      p_paid_amount: paid_amount,
    }
  );

  if (rpcError) return { error: rpcError.message };

  revalidatePath(`/owner/members/${memberId}`);
  return { success: true, membership_id };
}

// ---------------------------------------------------------------------------
// assignTrainer
// ---------------------------------------------------------------------------
export async function assignTrainer(memberId: string, trainerId: string) {
  const supabase = await createClient();

  const auth = await verifyOwner(supabase);
  if (!auth) return { error: "Unauthorized" };

  if (!trainerId) return { error: "Trainer ID required" };

  const { error } = await supabase
    .from("member_trainers")
    .insert({ member_id: memberId, trainer_id: trainerId, is_primary: true });

  if (error) return { error: error.message };

  await supabase.rpc("insert_audit_log", {
    p_action:      "ASSIGN_TRAINER",
    p_entity_type: "member_trainer",
    p_entity_id:   null,
    p_member_id:   memberId,
    p_details:     { trainer_id: trainerId },
  });

  revalidatePath(`/owner/members/${memberId}`);
  return { success: true };
}

// ---------------------------------------------------------------------------
// unassignTrainer
// ---------------------------------------------------------------------------
export async function unassignTrainer(assignmentId: string, memberId: string) {
  const supabase = await createClient();

  const auth = await verifyOwner(supabase);
  if (!auth) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("member_trainers")
    .delete()
    .eq("id", assignmentId);

  if (error) return { error: error.message };

  await supabase.rpc("insert_audit_log", {
    p_action:      "UNASSIGN_TRAINER",
    p_entity_type: "member_trainer",
    p_entity_id:   null,
    p_member_id:   memberId,
    p_details:     { assignment_id: assignmentId },
  });

  revalidatePath(`/owner/members/${memberId}`);
  return { success: true };
}
