import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { useTranslation } from "../lib/i18n";
import { UploadedFile } from "../components/dashboard/CVUploadForm";
import toast from "react-hot-toast";

export function useCVAnalysis() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);

  const analyzeCVs = async (
    jobTitle: string,
    jobDescription: string,
    skillsRequired: string,
    uploadedFiles: UploadedFile[],
    cvTexts: string[]
  ) => {
    if (!user) {
      toast.error(t("error.unauthorized"));
      return;
    }

    const validTexts = cvTexts.filter((text) => text.trim());
    const hasFiles = uploadedFiles.length > 0;
    const hasTexts = validTexts.length > 0;

    // Debug logging
    console.log("🔍 CV Analysis Debug Info:");
    console.log("- uploadedFiles:", uploadedFiles);
    console.log("- cvTexts:", cvTexts);
    console.log("- validTexts:", validTexts);
    console.log("- hasFiles:", hasFiles);
    console.log("- hasTexts:", hasTexts);
    console.log("- jobTitle:", jobTitle);
    console.log("- skillsRequired:", skillsRequired);

    if (
      !jobTitle.trim() ||
      !skillsRequired.trim() ||
      (!hasFiles && !hasTexts)
    ) {
      console.log("❌ Validation failed:");
      console.log("- jobTitle.trim():", jobTitle.trim());
      console.log("- skillsRequired.trim():", skillsRequired.trim());
      console.log("- (!hasFiles && !hasTexts):", !hasFiles && !hasTexts);
      toast.error(t("error.validation"));
      return;
    }

    setAnalyzing(true);

    try {
      const requestBody: any = {
        jobTitle,
        jobDescription,
        skillsRequired: skillsRequired,
        userId: user?.id,
      };

      // Handle multiple CV files
      if (hasFiles) {
        const cvFiles: string[] = [];

        for (const uploadedFile of uploadedFiles) {
          const base64File = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result as string;
              const base64 = result.split(",")[1];
              resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(uploadedFile.file);
          });
          cvFiles.push(base64File);
        }

        requestBody.cvFiles = cvFiles;
        console.log("📁 Added cvFiles to request:", cvFiles.length, "files");
      }

      // Handle multiple CV texts
      if (hasTexts) {
        requestBody.cvTexts = validTexts;
        console.log("📝 Added cvTexts to request:", validTexts.length, "texts");
      }

      console.log("📤 Final request body:", {
        jobTitle: requestBody.jobTitle,
        jobDescription: requestBody.jobDescription,
        skillsRequired: requestBody.skillsRequired,
        cvFiles: requestBody.cvFiles
          ? `${requestBody.cvFiles.length} files`
          : "none",
        cvTexts: requestBody.cvTexts
          ? `${requestBody.cvTexts.length} texts`
          : "none",
        userId: requestBody.userId,
      });

      // Log the actual request body for debugging
      console.log("📤 Raw request body:", JSON.stringify(requestBody, null, 2));

      // Check request body size
      const requestBodySize = JSON.stringify(requestBody).length;
      console.log("📤 Request body size:", requestBodySize, "characters");

      if (requestBodySize > 1000000) {
        // 1MB limit
        console.warn(
          "⚠️ Request body is very large:",
          requestBodySize,
          "characters"
        );
      }

      // Add a minimum delay to show the loading animation
      const minDelay = new Promise((resolve) => setTimeout(resolve, 3000));

      // Call the Edge Function for CV analysis
      const analysisPromise = supabase.functions.invoke("cv-analysis", {
        body: requestBody,
      });

      // Wait for both the minimum delay and the actual API call
      const [data, error] = await Promise.all([analysisPromise, minDelay]).then(
        ([result]) => [result.data, result.error]
      );

      if (error) {
        throw error;
      }

      // Check for error in response body (since we now return 200 status for errors)
      if (data?.error) {
        throw new Error(data.error.message || "Unknown error occurred");
      }

      if (!data || !data.data || !data.data.cvAnalysis) {
        throw new Error(t("services.cv_analysis.analysis_not_found"));
      }

      setResults(data.data.cvAnalysis);
      setShowResults(true);
      toast.success(
        `${t("services.cv_analysis.analysis_success")}: ${
          data.data.cvAnalysis.length
        } ${t("services.cv_analysis.candidates_found")}!`
      );
    } catch (error: any) {
      console.error("CV Analysis error:", error);
      toast.error(error.message || t("error.generic"));
    } finally {
      setAnalyzing(false);
    }
  };

  const getFilteredAndSortedResults = (
    results: any[],
    filterByScore: string,
    sortBy: string
  ) => {
    let filteredResults = [...results];

    // Filter by vote (CV analysis uses vote instead of match_score)
    if (filterByScore === "high") {
      filteredResults = filteredResults.filter((c) => parseInt(c.vote) >= 8);
    } else if (filterByScore === "medium") {
      filteredResults = filteredResults.filter(
        (c) => parseInt(c.vote) >= 6 && parseInt(c.vote) < 8
      );
    } else if (filterByScore === "low") {
      filteredResults = filteredResults.filter((c) => parseInt(c.vote) < 6);
    }

    // Sort results
    if (sortBy === "vote") {
      filteredResults.sort((a, b) => parseInt(b.vote) - parseInt(a.vote));
    } else if (sortBy === "name") {
      filteredResults.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "ranking") {
      filteredResults.sort((a, b) => a.ranking - b.ranking);
    }

    return filteredResults;
  };

  return {
    analyzing,
    results,
    showResults,
    setShowResults,
    analyzeCVs,
    getFilteredAndSortedResults,
  };
}
