import React, { useState, useEffect } from "react";
import {
  CheckCircle,
  Share2,
  Copy,
  ExternalLink,
  Users,
  Clock,
  FileText,
  Brain,
  Mail,
  Link as LinkIcon,
} from "lucide-react";
import { InterviewData } from "../types";
import toast from "react-hot-toast";
import { supabase } from "../../../lib/supabase";

interface SummaryStepProps {
  interviewData: InterviewData;
  onComplete: () => void;
  onReset: () => void;
  onGenerateLinks?: () => Promise<void>;
}

export const SummaryStep: React.FC<SummaryStepProps> = ({
  interviewData,
  onComplete,
  onReset,
  onGenerateLinks,
}) => {
  const [copied, setCopied] = useState(false);
  const [shareLink, setShareLink] = useState("");

  // Fetch session links when component mounts
  useEffect(() => {
    if (interviewData.id) {
      fetchSessionLinks();
    }
  }, [interviewData.id]);

  // Generate share link
  const generateShareLink = async () => {
    if (!interviewData.id) {
      toast.error("لا يمكن إنشاء رابط المشاركة بدون معرف المقابلة");
      return;
    }

    if (onGenerateLinks) {
      try {
        await onGenerateLinks();
        toast.success("تم إنشاء روابط المقابلة بنجاح");

        // After generating links, fetch the actual session tokens
        await fetchSessionLinks();
      } catch (error) {
        toast.error("فشل في إنشاء روابط المقابلة");
        return;
      }
    }
  };

  // Fetch actual session links from the database
  const fetchSessionLinks = async () => {
    if (!interviewData.id) return;

    try {
      const { data: sessions, error } = await supabase
        .from("interview_sessions")
        .select("session_token, candidate_id")
        .eq("interview_id", interviewData.id);

      if (error) {
        console.error("Error fetching sessions:", error);
        return;
      }

      if (sessions && sessions.length > 0) {
        // Use the first session token for the demo link
        const firstSession = sessions[0];
        const baseUrl = window.location.origin;
        const link = `${baseUrl}/interview/${encodeURIComponent(
          firstSession.session_token
        )}`;
        setShareLink(link);
        return link;
      }
    } catch (error) {
      console.error("Error fetching session links:", error);
    }
  };

  // Copy link to clipboard
  const copyToClipboard = async () => {
    let link = shareLink;
    if (!link) {
      await generateShareLink();
      link = shareLink; // Get the updated shareLink after generation
    }
    if (!link) return;

    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("تم نسخ الرابط بنجاح");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("فشل في نسخ الرابط");
    }
  };

  // Share via email
  const shareViaEmail = async () => {
    let link = shareLink;
    if (!link) {
      await generateShareLink();
      link = shareLink; // Get the updated shareLink after generation
    }
    if (!link) return;

    const subject = encodeURIComponent(`مقابلة: ${interviewData.jobTitle}`);
    const body = encodeURIComponent(
      `مرحباً،\n\nتمت دعوتك للمشاركة في مقابلة للوظيفة: ${interviewData.jobTitle}\n\nرابط المقابلة: ${link}\n\nشكراً لك.`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  // Get interview type label
  const getInterviewTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      technical: "تقنية",
      behavioral: "سلوكية",
      comprehensive: "شاملة",
      cultural: "ثقافية",
    };
    return types[type] || type;
  };

  // Get interview mode label
  const getInterviewModeLabel = (mode: string) => {
    const modes: Record<string, string> = {
      questions_only: "أسئلة فقط",
      biometric_with_questions: "أسئلة مع تحليل حيوي",
      video_interview: "مقابلة فيديو",
    };
    return modes[mode] || mode;
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          تم إنشاء المقابلة بنجاح! 🎉
        </h2>
        <p className="text-gray-400">
          مقابلة {interviewData.jobTitle} جاهزة للمشاركة
        </p>
      </div>

      {/* Interview Summary */}
      <div className="bg-slate-800 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <FileText className="h-5 w-5 mr-2" />
          تفاصيل المقابلة
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-gray-400 text-sm">المسمى الوظيفي</label>
              <p className="text-white font-medium">{interviewData.jobTitle}</p>
            </div>

            <div>
              <label className="text-gray-400 text-sm">نوع المقابلة</label>
              <p className="text-white font-medium">
                {getInterviewTypeLabel(interviewData.interviewType)}
              </p>
            </div>

            <div>
              <label className="text-gray-400 text-sm">مدة المقابلة</label>
              <p className="text-white font-medium flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                {interviewData.durationMinutes} دقيقة
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-gray-400 text-sm">وضع المقابلة</label>
              <p className="text-white font-medium">
                {getInterviewModeLabel(interviewData.interviewMode)}
              </p>
            </div>

            <div>
              <label className="text-gray-400 text-sm">عدد الأسئلة</label>
              <p className="text-white font-medium flex items-center">
                <Brain className="h-4 w-4 mr-2" />
                {interviewData.questions.length} سؤال
              </p>
            </div>

            <div>
              <label className="text-gray-400 text-sm">عدد المرشحين</label>
              <p className="text-white font-medium flex items-center">
                <Users className="h-4 w-4 mr-2" />
                {interviewData.candidates.length} مرشح
              </p>
            </div>
          </div>
        </div>

        {interviewData.jobDescription && (
          <div className="mt-6">
            <label className="text-gray-400 text-sm">وصف الوظيفة</label>
            <p className="text-white mt-1 bg-slate-700 rounded p-3">
              {interviewData.jobDescription}
            </p>
          </div>
        )}
      </div>

      {/* Questions Preview */}
      {interviewData.questions.length > 0 && (
        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Brain className="h-5 w-5 mr-2" />
            الأسئلة ({interviewData.questions.length})
          </h3>

          <div className="space-y-2 max-h-40 overflow-y-auto">
            {interviewData.questions.slice(0, 5).map((question, index) => (
              <div key={question.id || index} className="flex items-start">
                <span className="text-gray-400 text-sm mr-3 mt-1">
                  {index + 1}.
                </span>
                <span className="text-white text-sm">
                  {question.questionText}
                </span>
                {question.isAiGenerated && (
                  <span className="ml-2 text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                    AI
                  </span>
                )}
              </div>
            ))}
            {interviewData.questions.length > 5 && (
              <p className="text-gray-400 text-sm mt-2">
                ... و {interviewData.questions.length - 5} أسئلة أخرى
              </p>
            )}
          </div>
        </div>
      )}

      {/* Candidates Preview */}
      {interviewData.candidates.length > 0 && (
        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Users className="h-5 w-5 mr-2" />
            المرشحون ({interviewData.candidates.length})
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {interviewData.candidates.map((candidate, index) => (
              <div key={index} className="bg-slate-700 rounded p-3">
                <p className="text-white font-medium">{candidate.name}</p>
                <p className="text-gray-400 text-sm">{candidate.email}</p>
                <span
                  className={`text-xs px-2 py-1 rounded mt-2 inline-block ${
                    candidate.status === "completed"
                      ? "bg-green-500/20 text-green-400"
                      : "bg-yellow-500/20 text-yellow-400"
                  }`}
                >
                  {candidate.status === "completed" ? "مكتمل" : "في الانتظار"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sharing Section */}
      <div className="bg-slate-800 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Share2 className="h-5 w-5 mr-2" />
          مشاركة المقابلة
        </h3>

        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={generateShareLink}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center"
            >
              <LinkIcon className="h-4 w-4 mr-2" />
              إنشاء روابط المقابلة وإرسال البريد
            </button>

            <button
              onClick={shareViaEmail}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center"
            >
              <Mail className="h-4 w-4 mr-2" />
              مشاركة عبر البريد
            </button>
          </div>

          {shareLink && (
            <div className="bg-slate-700 rounded p-4">
              <label className="text-gray-400 text-sm mb-2 block">
                رابط المشاركة
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={shareLink}
                  readOnly
                  className="flex-1 px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                />
                <button
                  onClick={copyToClipboard}
                  className={`px-3 py-2 rounded transition-colors flex items-center ${
                    copied
                      ? "bg-green-600 text-white"
                      : "bg-slate-600 hover:bg-slate-500 text-white"
                  }`}
                >
                  <Copy className="h-4 w-4 mr-1" />
                  {copied ? "تم النسخ" : "نسخ"}
                </button>
                <a
                  href={shareLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors flex items-center"
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  فتح
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={onReset}
          className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
        >
          إنشاء مقابلة جديدة
        </button>

        <button
          onClick={onComplete}
          className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center"
        >
          <CheckCircle className="h-5 w-5 mr-2" />
          إكمال
        </button>
      </div>
    </div>
  );
};
