export interface InterviewData {
  id?: string;
  jobTitle: string;
  jobDescription: string;
  requiredSkills: string[];
  testLevel: "beginner" | "intermediate" | "advanced";
  selectedTestTypes: TestType[];
  languageProficiency?: string;
  durationMinutes: number;
  totalQuestions: number;
  creditsUsed: number;
  status: "setup" | "questions_ready" | "candidates_added" | "completed";
  expiresAt?: string;
  currentStep: number;
  interviewType?: string;
  interviewMode?: string;
  questions?: Question[];
  candidates?: Candidate[];
}

export interface TestType {
  id: string;
  name: string;
  label: string;
  description: string;
  benefits: string[];
  icon: string;
  color: string;
  durationOptions: DurationOption[];
  questionCount: number;
  creditsPerQuestion: number;
  selectedPlan?: DurationOption;
}

export interface DurationOption {
  duration: number;
  questionCount: number;
  maxTestTypes: number;
  credits: number;
}

export interface Question {
  id?: string;
  questionText: string;
  testType: string;
  modelAnswer: string;
  skillMeasured: string;
  questionDurationSeconds: number;
  questionOrder: number;
  isAiGenerated: boolean;
  category?: string;
  options?: Array<{ id: string; text: string }>;
  correctAnswer?: string;
  questionType?: "text" | "multiple_choice";
}

export interface Candidate {
  id?: string;
  candidateId?: string; // Reference to talent_searches
  name: string;
  email: string;
  resumeUrl?: string;
  status: "pending" | "scheduled" | "completed" | "cancelled";
  scheduledAt?: string;
  sessionToken?: string;
  interviewLink?: string;
  matchScore?: number;
  current_position?: string;
  summary?: string;
  searchId?: string;
  searchCreatedAt?: string;
  skills?: string[];
  experienceYears?: number;
  educationLevel?: string;
  location?: string;
}

export interface InterviewSession {
  id: string;
  interviewId: string;
  candidateId: string;
  sessionToken: string;
  status: "pending" | "started" | "completed" | "expired";
  startedAt?: string;
  completedAt?: string;
  expiresAt: string;
}

export interface InterviewAnswer {
  id?: string;
  sessionId: string;
  questionId: string;
  answerText: string;
  timeTakenSeconds: number;
  answeredAt: string;
}

export interface InterviewAnalysis {
  id?: string;
  sessionId: string;
  testType: string;
  score: number;
  strengths: string[];
  weaknesses: string[];
  analysisData: any;
}

export interface Step {
  id: number;
  title: string;
  description: string;
  icon?: any;
}

export interface QuestionCategory {
  id: string;
  name: string;
  label: string;
  description: string;
  icon: string;
  color: string;
  value: string;
}

export interface QuestionGenerationRequest {
  interviewId?: string;
  questionType: string;
  numQuestions: number;
  jobTitle: string;
  jobDescription?: string;
  interviewType?: string;
}

// Test Types Configuration
export const TEST_TYPES: TestType[] = [
  {
    id: "biometric",
    name: "biometric",
    label: "اختبار بيومتري",
    description:
      "تحليل السلوك أثناء الإجابات (نبرة الصوت، التوقفات، تعابير الوجه)",
    benefits: ["يكشف الثقة، التوتر، التركيز، والصدق"],
    icon: "🎭",
    color: "purple",
    durationOptions: [
      { duration: 15, questionCount: 5, maxTestTypes: 1, credits: 10 },
      { duration: 30, questionCount: 10, maxTestTypes: 2, credits: 20 },
      { duration: 45, questionCount: 15, maxTestTypes: 3, credits: 30 },
    ],
    questionCount: 5,
    creditsPerQuestion: 2,
  },
  {
    id: "iq",
    name: "iq",
    label: "اختبار الذكاء",
    description: "أسئلة منطقية ورياضية ولفظية متعددة الخيارات",
    benefits: ["يقيس القدرة المعرفية، حل المشاكل، وسرعة المعالجة"],
    icon: "🧠",
    color: "blue",
    durationOptions: [
      { duration: 15, questionCount: 10, maxTestTypes: 1, credits: 20 },
      { duration: 30, questionCount: 20, maxTestTypes: 2, credits: 40 },
      { duration: 45, questionCount: 30, maxTestTypes: 3, credits: 60 },
    ],
    questionCount: 10,
    creditsPerQuestion: 2,
  },
  {
    id: "psychometric",
    name: "psychometric",
    label: "اختبار نفسي",
    description: "استبيان على نمط الشخصية (Big 5, DISC, إلخ)",
    benefits: ["يحدد الملاءمة الثقافية، سمات الشخصية، وأسلوب العمل"],
    icon: "📊",
    color: "green",
    durationOptions: [
      { duration: 15, questionCount: 8, maxTestTypes: 1, credits: 16 },
      { duration: 30, questionCount: 15, maxTestTypes: 2, credits: 30 },
      { duration: 45, questionCount: 25, maxTestTypes: 3, credits: 50 },
    ],
    questionCount: 8,
    creditsPerQuestion: 2,
  },
  {
    id: "competency",
    name: "competency",
    label: "اختبار الكفاءة",
    description:
      "تقييمات المهارات المتعلقة بالوظيفة (المبيعات، التسويق، البرمجة، المحاسبة)",
    benefits: ["يتحقق من المهارات الواقعية وجاهزية الدور"],
    icon: "🎯",
    color: "orange",
    durationOptions: [
      { duration: 15, questionCount: 8, maxTestTypes: 1, credits: 16 },
      { duration: 30, questionCount: 15, maxTestTypes: 2, credits: 30 },
      { duration: 45, questionCount: 25, maxTestTypes: 3, credits: 50 },
    ],
    questionCount: 8,
    creditsPerQuestion: 2,
  },
  {
    id: "eq",
    name: "eq",
    label: "اختبار الذكاء العاطفي",
    description:
      "أسئلة موقفية تقيم التعاطف، التنظيم الذاتي، المهارات الاجتماعية",
    benefits: ["مهم للقيادة، المبيعات، الموارد البشرية، وخدمة العملاء"],
    icon: "❤️",
    color: "pink",
    durationOptions: [
      { duration: 15, questionCount: 8, maxTestTypes: 1, credits: 16 },
      { duration: 30, questionCount: 15, maxTestTypes: 2, credits: 30 },
      { duration: 45, questionCount: 25, maxTestTypes: 3, credits: 50 },
    ],
    questionCount: 8,
    creditsPerQuestion: 2,
  },
  {
    id: "sjt",
    name: "sjt",
    label: "اختبار الحكم الموقفي",
    description: "سيناريوهات واقعية للوظيفة مع خيارات متعددة",
    benefits: ["يظهر نهج اتخاذ القرار وحل المشاكل"],
    icon: "⚖️",
    color: "indigo",
    durationOptions: [
      { duration: 15, questionCount: 8, maxTestTypes: 1, credits: 16 },
      { duration: 30, questionCount: 15, maxTestTypes: 2, credits: 30 },
      { duration: 45, questionCount: 25, maxTestTypes: 3, credits: 50 },
    ],
    questionCount: 8,
    creditsPerQuestion: 2,
  },
  {
    id: "technical",
    name: "technical",
    label: "اختبار المهارات التقنية",
    description:
      "تحديات البرمجة الخاصة بالدور، دراسات الحالة، أو المهام القائمة على الأدوات",
    benefits: ["يضمن الكفاءة التقنية بما يتجاوز النظرية"],
    icon: "💻",
    color: "cyan",
    durationOptions: [
      { duration: 15, questionCount: 8, maxTestTypes: 1, credits: 16 },
      { duration: 30, questionCount: 15, maxTestTypes: 2, credits: 30 },
      { duration: 45, questionCount: 25, maxTestTypes: 3, credits: 50 },
    ],
    questionCount: 8,
    creditsPerQuestion: 2,
  },
  {
    id: "language",
    name: "language",
    label: "اختبار إتقان اللغة",
    description:
      "المفردات، القواعد، الفهم، والتواصل التجاري (اختر اللغة المطلوبة)",
    benefits: ["يتحقق من الطلاقة للوظائف الدولية أو التي تتعامل مع العملاء"],
    icon: "🌍",
    color: "yellow",
    durationOptions: [
      { duration: 15, questionCount: 10, maxTestTypes: 1, credits: 20 },
      { duration: 30, questionCount: 20, maxTestTypes: 2, credits: 40 },
      { duration: 45, questionCount: 30, maxTestTypes: 3, credits: 60 },
    ],
    questionCount: 10,
    creditsPerQuestion: 2,
  },
];

export const TEST_LEVELS = [
  { value: "beginner", label: "مبتدئ" },
  { value: "intermediate", label: "متوسط" },
  { value: "advanced", label: "متقدم" },
] as const;

export const LANGUAGE_OPTIONS = [
  { value: "arabic", label: "العربية" },
  { value: "english", label: "English" },
  { value: "french", label: "Français" },
  { value: "spanish", label: "Español" },
  { value: "german", label: "Deutsch" },
  { value: "chinese", label: "中文" },
  { value: "japanese", label: "日本語" },
  { value: "korean", label: "한국어" },
] as const;

export const DURATION_OPTIONS = [
  { value: 15, label: "15 دقيقة", maxTestTypes: 1, questionCount: 10 },
  { value: 30, label: "30 دقيقة", maxTestTypes: 2, questionCount: 20 },
  { value: 45, label: "45 دقيقة", maxTestTypes: 3, questionCount: 30 },
] as const;

export const INTERVIEW_STEPS: Step[] = [
  {
    id: 1,
    title: "إعداد المقابلة",
    description: "اختر نوع الاختبارات والمدة",
  },
  {
    id: 2,
    title: "اختيار المرشحين",
    description: "اختر المرشحين من قاعدة البيانات",
  },
  {
    id: 3,
    title: "مشاركة الروابط",
    description: "راجع الملخص وشارك الروابط",
  },
];

export const QUESTION_CATEGORIES: QuestionCategory[] = [
  {
    id: "technical",
    name: "technical",
    label: "تقني",
    description: "أسئلة تقنية ومهارات برمجية",
    icon: "💻",
    color: "blue",
    value: "technical",
  },
  {
    id: "behavioral",
    name: "behavioral",
    label: "سلوكي",
    description: "أسئلة سلوكية وقدرات شخصية",
    icon: "🧠",
    color: "green",
    value: "behavioral",
  },
  {
    id: "situational",
    name: "situational",
    label: "موقفي",
    description: "سيناريوهات واقعية",
    icon: "⚖️",
    color: "purple",
    value: "situational",
  },
];

export const QUESTION_COUNT_OPTIONS = [
  { value: 5, label: "5 أسئلة" },
  { value: 10, label: "10 أسئلة" },
  { value: 15, label: "15 سؤال" },
  { value: 20, label: "20 سؤال" },
];

export const INTERVIEW_TYPES = [
  { value: "technical", label: "مقابلة تقنية" },
  { value: "behavioral", label: "مقابلة سلوكية" },
  { value: "mixed", label: "مقابلة مختلطة" },
];

export const INTERVIEW_MODES = [
  { value: "video", label: "فيديو" },
  { value: "audio", label: "صوتي" },
  { value: "text", label: "نصي" },
];
