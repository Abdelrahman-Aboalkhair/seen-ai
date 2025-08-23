export const getRecommendationColor = (recommendation: string) => {
  switch (recommendation?.toLowerCase()) {
    case "hire":
      return "bg-green-500/20 text-green-400 border-green-500/30";
    case "consider":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    case "reject":
      return "bg-red-500/20 text-red-400 border-red-500/30";
    default:
      return "bg-gray-500/20 text-gray-400 border-gray-500/30";
  }
};

export const getScoreColor = (score: number) => {
  if (score >= 80) return "text-green-400";
  if (score >= 60) return "text-yellow-400";
  return "text-red-400";
};

export const getScoreBgColor = (score: number) => {
  if (score >= 80) return "bg-green-500/20";
  if (score >= 60) return "bg-yellow-500/20";
  return "bg-red-500/20";
};

export const getTestTypeLabel = (testType: string) => {
  switch (testType) {
    case "technical":
      return "الاختبار التقني";
    case "competency":
      return "اختبار المهارات";
    default:
      return testType;
  }
};

export const getRecommendationLabel = (recommendation: string) => {
  switch (recommendation) {
    case "Hire":
      return "يُنصح بالتوظيف";
    case "Consider":
      return "يحتاج مراجعة";
    case "Reject":
      return "يُنصح بالرفض";
    default:
      return recommendation;
  }
};
