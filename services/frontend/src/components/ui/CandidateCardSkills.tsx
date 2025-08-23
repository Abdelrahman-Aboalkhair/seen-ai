import React from "react";
import { Code } from "lucide-react";
import { useTranslation } from "../../lib/i18n";

interface CandidateCardSkillsProps {
  skillsMatch: string;
}

export function CandidateCardSkills({ skillsMatch }: CandidateCardSkillsProps) {
  const { isRTL } = useTranslation();

  const parseSkills = (skillsText: string) => {
    if (
      !skillsText ||
      skillsText === "غير محدد" ||
      skillsText === "[object Object]"
    ) {
      return [];
    }

    // Handle the new n8n format with technicalSkills prefix
    if (skillsText.includes("technicalSkills:")) {
      const lines = skillsText.split("\n");
      for (const line of lines) {
        if (line.includes("technicalSkills:")) {
          const skillsPart = line.replace("technicalSkills:", "").trim();
          return skillsPart
            .split(",")
            .map((skill) => skill.trim())
            .filter(Boolean)
            .slice(0, 3); // Only show first 3 skills in card
        }
      }
    }

    // Fallback to comma-separated format
    return skillsText
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean)
      .slice(0, 3); // Only show first 3 skills in card
  };

  const skills = parseSkills(skillsMatch);

  if (skills.length === 0) {
    return null;
  }

  return (
    <div className="mb-4">
      <div
        className={`flex items-center mb-2 ${
          isRTL() ? "flex-row-reverse space-x-reverse space-x-2" : "space-x-2"
        }`}
      >
        <Code className="h-4 w-4 text-cyan-400" />
        <h4 className="text-sm font-semibold text-gray-200">
          المهارات الرئيسية
        </h4>
      </div>

      <div
        className={`flex flex-wrap gap-2 ${isRTL() ? "flex-row-reverse" : ""}`}
      >
        {skills.map((skill, idx) => (
          <span
            key={idx}
            className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 text-xs font-medium px-2 py-1 rounded-full border border-cyan-500/30 backdrop-blur-sm"
          >
            {skill}
          </span>
        ))}
        {skills.length >= 3 && (
          <span className="text-xs text-gray-500 px-2 py-1">+المزيد</span>
        )}
      </div>
    </div>
  );
}
