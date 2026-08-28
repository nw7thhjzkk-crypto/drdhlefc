import { SupabaseClient } from "@supabase/supabase-js";

export async function uploadPhoto(
  supabase: SupabaseClient,
  photo: File,
  bucket: string,
  folder: string
) {
  if (photo && photo.size > 0) {
    const fileExt = photo.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, photo);

    if (uploadError) {
      return { error: uploadError.message };
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return { url: data.publicUrl };
  }
  return { url: null };
}
