"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { error, data: authData } = await supabase.auth.signInWithPassword(data);

  if (error) {
    // In a real app we might return the error string to show in the UI instead of redirecting to an error page
    redirect("/login?error=Invalid credentials");
  }

  // Once signed in, fetch the user's role from the profiles table
  if (authData.user) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", authData.user.id)
      .single();

    if (!profileError && profile?.role) {
      if (profile.role === "owner") {
        redirect("/owner/dashboard");
      } else if (profile.role === "trainer") {
        redirect("/trainer/dashboard");
      } else if (profile.role === "member") {
        redirect("/member/home");
      }
    }
  }

  // Fallback if role is not found
  revalidatePath("/", "layout");
  redirect("/");
}
