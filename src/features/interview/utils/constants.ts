import { Settings, Users, MessageSquare, Video } from "lucide-react";
import { Step } from "../types";

export const INTERVIEW_STEPS: Step[] = [
  { id: 1, title: "الإعداد", icon: Settings, description: "إعداد المقابلة" },
  { id: 2, title: "المرشحون", icon: Users, description: "اختيار المرشحين" },
  {
    id: 3,
    title: "الأسئلة",
    icon: MessageSquare,
    description: "إدارة الأسئلة",
  },
  { id: 4, title: "المقابلة", icon: Video, description: "إجراء المقابلة" },
];

export const STEP_DESCRIPTIONS = {
  1: "أدخل تفاصيل الوظيفة واختر نمط المقابلة",
  2: "اختر المرشح الذي تريد مقابلته",
  3: "أضف أو اختر الأسئلة للمقابلة",
  4: "ابدأ المقابلة مع المرشح المحدد",
};
