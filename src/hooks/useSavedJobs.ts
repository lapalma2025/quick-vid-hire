import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export function useSavedJobs() {
  const { user } = useAuth();
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  // Fetch saved jobs on mount
  useEffect(() => {
    if (!user) {
      setSavedJobIds(new Set());
      return;
    }

    const fetchSavedJobs = async () => {
      const { data, error } = await supabase
        .from("saved_jobs")
        .select("job_id")
        .eq("user_id", user.id);

      if (!error && data) {
        setSavedJobIds(new Set(data.map((item) => item.job_id)));
      }
    };

    fetchSavedJobs();
  }, [user]);

  const toggleSaveJob = useCallback(
    async (jobId: string) => {
      if (!user) {
        toast.error("Zaloguj się, aby zapisać ofertę");
        return;
      }

      setIsLoading(true);
      const isSaved = savedJobIds.has(jobId);

      if (isSaved) {
        // Unsave
        const { error } = await supabase
          .from("saved_jobs")
          .delete()
          .eq("user_id", user.id)
          .eq("job_id", jobId);

        if (!error) {
          setSavedJobIds((prev) => {
            const next = new Set(prev);
            next.delete(jobId);
            return next;
          });
          toast.success("Usunięto z zapisanych");
        } else {
          toast.error("Nie udało się usunąć oferty");
        }
      } else {
        // Save
        const { error } = await supabase.from("saved_jobs").insert({
          user_id: user.id,
          job_id: jobId,
        });

        if (!error) {
          setSavedJobIds((prev) => new Set(prev).add(jobId));
          toast.success("Zapisano ofertę");
        } else {
          toast.error("Nie udało się zapisać oferty");
        }
      }

      setIsLoading(false);
    },
    [user, savedJobIds]
  );

  const isJobSaved = useCallback(
    (jobId: string) => savedJobIds.has(jobId),
    [savedJobIds]
  );

  return {
    savedJobIds,
    toggleSaveJob,
    isJobSaved,
    isLoading,
  };
}
