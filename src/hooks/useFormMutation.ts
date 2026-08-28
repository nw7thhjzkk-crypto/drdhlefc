import { useState, useTransition } from "react";

export function useFormMutation<T extends { error?: string; success?: boolean }>(
  mutationFn: (formData: FormData) => Promise<T>,
  onSuccess?: (res: T) => void
) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        const res = await mutationFn(formData);
        if (res.error) {
          setError(res.error);
        } else if (res.success && onSuccess) {
          onSuccess(res);
        }
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unexpected error occurred");
        }
      }
    });
  }

  return { handleSubmit, isPending, error };
}
