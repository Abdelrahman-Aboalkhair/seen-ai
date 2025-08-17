import { useState, useEffect } from "react";
import { useAuth } from "../lib/auth";
import { supabase } from "../lib/supabase";
import { t } from "../lib/i18n";

export function useCreditBalance() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [totalSearches, setTotalSearches] = useState<number>(0);
  const [totalAnalyses, setTotalAnalyses] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke(
        "check-credit-balance"
      );

      if (error) {
        throw error;
      }

      if (data?.data) {
        setBalance(data.data.credits);
        setTotalSearches(data.data.totalSearches);
        setTotalAnalyses(data.data.totalAnalyses);
      }
    } catch (err: any) {
      console.error("Error fetching credit balance:", err);
      setError(err.message || t("error.generic"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [user]);

  const deductCredits = async (
    amount: number,
    description: string = t("dashboard.credit_usage")
  ) => {
    try {
      const { data, error } = await supabase.functions.invoke(
        "deduct-credits",
        {
          body: { amount, description },
        }
      );

      if (error) {
        throw error;
      }

      if (data?.data) {
        setBalance(data.data.remainingCredits);
        return true;
      }
      return false;
    } catch (err: any) {
      console.error("Error deducting credits:", err);
      throw new Error(err.message || t("error.generic"));
    }
  };

  const addCredits = async (
    amount: number,
    description: string = t("pricing.buy_now")
  ) => {
    try {
      const { data, error } = await supabase.functions.invoke("add-credits", {
        body: { amount, description },
      });

      if (error) {
        throw error;
      }

      // Check for error in response body (since we now return 200 status for errors)
      if (data?.error) {
        throw new Error(data.error.message || "Unknown error occurred");
      }

      if (data?.data) {
        setBalance(data.data.newBalance);
        return true;
      }
      return false;
    } catch (err: any) {
      console.error("Error adding credits:", err);
      throw new Error(err.message || t("error.generic"));
    }
  };

  return {
    balance,
    totalSearches,
    totalAnalyses,
    loading,
    error,
    refetch: fetchBalance,
    deductCredits,
    addCredits,
  };
}
