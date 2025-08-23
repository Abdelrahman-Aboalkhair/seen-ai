Deno.serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE, PATCH",
    "Access-Control-Max-Age": "86400",
    "Access-Control-Allow-Credentials": "false",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // الحصول على متغيرات البيئة
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("إعدادات Supabase غير متوفرة");
    }

    // التحقق من رمز المصادقة
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      throw new Error("مطلوب رمز المصادقة");
    }

    const token = authHeader.replace("Bearer ", "");

    // التحقق من صحة المستخدم
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: serviceRoleKey,
      },
    });

    if (!userResponse.ok) {
      throw new Error("رمز مصادقة غير صالح");
    }

    const userData = await userResponse.json();
    const currentUserId = userData.id;

    // التحقق من صلاحيات المستخدم الحالي
    const profileResponse = await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${currentUserId}&select=role,permissions,is_suspended,full_name`,
      {
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          apikey: serviceRoleKey,
          Accept: "application/vnd.pgrst.object+json",
        },
      }
    );

    if (!profileResponse.ok) {
      throw new Error("فشل في التحقق من صلاحيات المستخدم");
    }

    const profile = await profileResponse.json();

    if (!profile || profile.is_suspended) {
      throw new Error("الحساب معلق أو غير موجود");
    }

    // التحقق من الدور
    const allowedRoles = ["super_admin", "admin", "finance_manager", "analyst"];
    if (!allowedRoles.includes(profile.role)) {
      throw new Error("غير مخول لتوليد التقارير");
    }

    // استخراج بيانات الطلب
    const requestBody = await req.json();
    const {
      reportType,
      startDate = "",
      endDate = "",
      format = "json",
    } = requestBody;

    if (!reportType) {
      throw new Error("نوع التقرير مطلوب");
    }

    const validReportTypes = [
      "users_summary",
      "financial_summary",
      "support_summary",
      "activity_summary",
      "usage_summary",
    ];
    if (!validReportTypes.includes(reportType)) {
      throw new Error("نوع تقرير غير مدعوم");
    }

    // تحديد التواريخ
    const now = new Date();
    const start = startDate
      ? new Date(startDate)
      : new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = endDate ? new Date(endDate) : now;

    const startDateStr = start.toISOString();
    const endDateStr = end.toISOString();

    let reportData;

    switch (reportType) {
      case "users_summary":
        reportData = await generateUsersSummaryReport(
          supabaseUrl,
          serviceRoleKey,
          startDateStr,
          endDateStr
        );
        break;
      case "financial_summary":
        reportData = await generateFinancialSummaryReport(
          supabaseUrl,
          serviceRoleKey,
          startDateStr,
          endDateStr
        );
        break;
      case "support_summary":
        reportData = await generateSupportSummaryReport(
          supabaseUrl,
          serviceRoleKey,
          startDateStr,
          endDateStr
        );
        break;
      case "activity_summary":
        reportData = await generateActivitySummaryReport(
          supabaseUrl,
          serviceRoleKey,
          startDateStr,
          endDateStr
        );
        break;
      case "usage_summary":
        reportData = await generateUsageSummaryReport(
          supabaseUrl,
          serviceRoleKey,
          startDateStr,
          endDateStr
        );
        break;
      default:
        throw new Error("نوع تقرير غير مدعوم");
    }

    // إعداد بيانات التقرير العامة
    const report = {
      title: getReportTitle(reportType),
      type: reportType,
      generatedAt: now.toISOString(),
      generatedBy: {
        id: currentUserId,
        name: profile.full_name,
        role: profile.role,
      },
      period: {
        start: startDateStr,
        end: endDateStr,
        duration: `${Math.ceil(
          (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
        )} يوم`,
      },
      data: reportData,
      format,
    };

    // تسجيل العملية في سجل الأنشطة
    await fetch(`${supabaseUrl}/rest/v1/admin_logs`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        admin_user_id: currentUserId,
        action: "GENERATE_REPORT",
        target_type: "report",
        details: {
          reportType,
          format,
          startDate: startDateStr,
          endDate: endDateStr,
          dataPoints: Object.keys(reportData).length,
        },
      }),
    });

    // إعداد استجابة ناجحة
    let responseData;
    let contentType = "application/json";

    if (format === "csv") {
      responseData = convertToCSV(report);
      contentType = "text/csv;charset=utf-8";
    } else {
      responseData = JSON.stringify({
        success: true,
        data: report,
      });
    }

    return new Response(responseData, {
      headers: {
        ...corsHeaders,
        "Content-Type": contentType,
        "Content-Disposition":
          format === "csv"
            ? `attachment; filename="${reportType}_${
                now.toISOString().split("T")[0]
              }.csv"`
            : undefined,
      },
    });
  } catch (error) {
    console.error("خطأ في وظيفة admin-generate-reports:", error);

    const errorResponse = {
      success: false,
      error: {
        code: "REPORT_GENERATION_ERROR",
        message: error.message || "خطأ غير متوقع في توليد التقرير",
      },
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// وظائف مساعدة لتوليد التقارير

async function generateUsersSummaryReport(
  supabaseUrl: string,
  serviceRoleKey: string,
  startDate: string,
  endDate: string
) {
  // جلب بيانات المستخدمين
  const usersResponse = await fetch(
    `${supabaseUrl}/rest/v1/profiles?select=role,is_suspended,created_at,last_login,login_count,credits`,
    {
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
      },
    }
  );

  const users = usersResponse.ok ? await usersResponse.json() : [];
  const newUsers = users.filter(
    (u) => u.created_at >= startDate && u.created_at <= endDate
  );

  return {
    totalUsers: users.length,
    newUsers: newUsers.length,
    activeUsers: users.filter((u) => !u.is_suspended).length,
    suspendedUsers: users.filter((u) => u.is_suspended).length,
    roleDistribution: users.reduce((acc, user) => {
      acc[user.role || "user"] = (acc[user.role || "user"] || 0) + 1;
      return acc;
    }, {}),
    averageCredits:
      users.length > 0
        ? users.reduce((sum, u) => sum + (u.credits || 0), 0) / users.length
        : 0,
    totalCreditsInSystem: users.reduce((sum, u) => sum + (u.credits || 0), 0),
    loginStats: {
      averageLogins:
        users.length > 0
          ? users.reduce((sum, u) => sum + (u.login_count || 0), 0) /
            users.length
          : 0,
      usersWithRecentLogin: users.filter(
        (u) => u.last_login && new Date(u.last_login) >= new Date(startDate)
      ).length,
    },
  };
}

async function generateFinancialSummaryReport(
  supabaseUrl: string,
  serviceRoleKey: string,
  startDate: string,
  endDate: string
) {
  // جلب بيانات المعاملات
  const transactionsResponse = await fetch(
    `${supabaseUrl}/rest/v1/credit_transactions?created_at=gte.${startDate}&created_at=lte.${endDate}&select=*`,
    {
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
      },
    }
  );

  const transactions = transactionsResponse.ok
    ? await transactionsResponse.json()
    : [];

  return {
    totalTransactions: transactions.length,
    revenue: {
      total: transactions
        .filter((t) => t.transaction_type === "purchase")
        .reduce((sum, t) => sum + Math.abs(t.credits_amount || 0), 0),
      purchases: transactions.filter((t) => t.transaction_type === "purchase")
        .length,
      averageOrderValue:
        transactions.filter((t) => t.transaction_type === "purchase").length > 0
          ? transactions
              .filter((t) => t.transaction_type === "purchase")
              .reduce((sum, t) => sum + Math.abs(t.credits_amount || 0), 0) /
            transactions.filter((t) => t.transaction_type === "purchase").length
          : 0,
    },
    adminActions: {
      grantsTotal: transactions
        .filter((t) => t.transaction_type === "admin_grant")
        .reduce((sum, t) => sum + (t.credits_amount || 0), 0),
      grantsCount: transactions.filter(
        (t) => t.transaction_type === "admin_grant"
      ).length,
      deductsTotal: Math.abs(
        transactions
          .filter((t) => t.transaction_type === "admin_deduct")
          .reduce((sum, t) => sum + (t.credits_amount || 0), 0)
      ),
      deductsCount: transactions.filter(
        (t) => t.transaction_type === "admin_deduct"
      ).length,
    },
    transactionTypes: transactions.reduce((acc, t) => {
      acc[t.transaction_type] = (acc[t.transaction_type] || 0) + 1;
      return acc;
    }, {}),
  };
}

async function generateSupportSummaryReport(
  supabaseUrl: string,
  serviceRoleKey: string,
  startDate: string,
  endDate: string
) {
  // جلب بيانات تذاكر الدعم
  const ticketsResponse = await fetch(
    `${supabaseUrl}/rest/v1/support_tickets?created_at=gte.${startDate}&created_at=lte.${endDate}&select=*`,
    {
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
      },
    }
  );

  const tickets = ticketsResponse.ok ? await ticketsResponse.json() : [];

  return {
    totalTickets: tickets.length,
    statusBreakdown: tickets.reduce((acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    }, {}),
    priorityBreakdown: tickets.reduce((acc, t) => {
      acc[t.priority] = (acc[t.priority] || 0) + 1;
      return acc;
    }, {}),
    categoryBreakdown: tickets.reduce((acc, t) => {
      const category = t.category || "غير محدد";
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {}),
    resolutionStats: {
      resolved: tickets.filter(
        (t) => t.status === "resolved" || t.status === "closed"
      ).length,
      pending: tickets.filter(
        (t) => t.status === "open" || t.status === "in_progress"
      ).length,
      averageResolutionTime: calculateAverageResolutionTime(tickets),
    },
  };
}

async function generateActivitySummaryReport(
  supabaseUrl: string,
  serviceRoleKey: string,
  startDate: string,
  endDate: string
) {
  // جلب بيانات سجلات النظام
  const logsResponse = await fetch(
    `${supabaseUrl}/rest/v1/admin_logs?created_at=gte.${startDate}&created_at=lte.${endDate}&select=*,admin_profile:profiles!admin_user_id(full_name,role)`,
    {
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
      },
    }
  );

  const logs = logsResponse.ok ? await logsResponse.json() : [];

  return {
    totalActivities: logs.length,
    actionBreakdown: logs.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {}),
    adminBreakdown: logs.reduce((acc, log) => {
      const adminName = log.admin_profile?.full_name || "غير محدد";
      acc[adminName] = (acc[adminName] || 0) + 1;
      return acc;
    }, {}),
    targetTypeBreakdown: logs.reduce((acc, log) => {
      const targetType = log.target_type || "غير محدد";
      acc[targetType] = (acc[targetType] || 0) + 1;
      return acc;
    }, {}),
    dailyActivity: generateDailyActivityBreakdown(logs, startDate, endDate),
  };
}

async function generateUsageSummaryReport(
  supabaseUrl: string,
  serviceRoleKey: string,
  startDate: string,
  endDate: string
) {
  // جلب بيانات عمليات البحث والتحليل
  const searchesResponse = await fetch(
    `${supabaseUrl}/rest/v1/talent_searches?created_at=gte.${startDate}&created_at=lte.${endDate}&select=*`,
    {
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
      },
    }
  );

  const analysesResponse = await fetch(
    `${supabaseUrl}/rest/v1/cv_analyses?created_at=gte.${startDate}&created_at=lte.${endDate}&select=*`,
    {
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
      },
    }
  );

  const searches = searchesResponse.ok ? await searchesResponse.json() : [];
  const analyses = analysesResponse.ok ? await analysesResponse.json() : [];

  return {
    searches: {
      total: searches.length,
      completed: searches.filter((s) => s.status === "completed").length,
      failed: searches.filter((s) => s.status === "failed").length,
      pending: searches.filter(
        (s) => s.status === "pending" || s.status === "processing"
      ).length,
      totalCreditsSpent: searches
        .filter((s) => s.status === "completed")
        .reduce((sum, s) => sum + (s.credits_cost || 0), 0),
    },
    analyses: {
      total: analyses.length,
      completed: analyses.filter((a) => a.status === "completed").length,
      failed: analyses.filter((a) => a.status === "failed").length,
      pending: analyses.filter(
        (a) => a.status === "pending" || a.status === "processing"
      ).length,
      totalCreditsSpent: analyses
        .filter((a) => a.status === "completed")
        .reduce((sum, a) => sum + (a.credits_cost || 0), 0),
    },
    overall: {
      totalOperations: searches.length + analyses.length,
      totalCreditsSpent:
        searches
          .filter((s) => s.status === "completed")
          .reduce((sum, s) => sum + (s.credits_cost || 0), 0) +
        analyses
          .filter((a) => a.status === "completed")
          .reduce((sum, a) => sum + (a.credits_cost || 0), 0),
      successRate:
        ((searches.filter((s) => s.status === "completed").length +
          analyses.filter((a) => a.status === "completed").length) /
          (searches.length + analyses.length)) *
          100 || 0,
    },
  };
}

function getReportTitle(reportType: string): string {
  const titles = {
    users_summary: "تقرير ملخص المستخدمين",
    financial_summary: "تقرير ملخص المعاملات المالية",
    support_summary: "تقرير ملخص الدعم الفني",
    activity_summary: "تقرير ملخص أنشطة النظام",
    usage_summary: "تقرير ملخص استخدام النظام",
  };
  return titles[reportType] || "تقرير غير محدد";
}

function calculateAverageResolutionTime(tickets: any[]): number {
  const resolvedTickets = tickets.filter((t) => t.resolved_at && t.created_at);
  if (resolvedTickets.length === 0) return 0;

  const totalTime = resolvedTickets.reduce((sum, ticket) => {
    const created = new Date(ticket.created_at).getTime();
    const resolved = new Date(ticket.resolved_at).getTime();
    return sum + (resolved - created);
  }, 0);

  return Math.round(totalTime / resolvedTickets.length / (1000 * 60 * 60)); // في ساعات
}

function generateDailyActivityBreakdown(
  logs: any[],
  startDate: string,
  endDate: string
) {
  const dailyBreakdown = {};
  const start = new Date(startDate);
  const end = new Date(endDate);

  // إعداد جميع الأيام بقيمة 0
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateKey = d.toISOString().split("T")[0];
    dailyBreakdown[dateKey] = 0;
  }

  // حساب الأنشطة لكل يوم
  logs.forEach((log) => {
    const dateKey = new Date(log.created_at).toISOString().split("T")[0];
    if (Object.prototype.hasOwnProperty.call(dailyBreakdown, dateKey)) {
      dailyBreakdown[dateKey]++;
    }
  });

  return dailyBreakdown;
}

function convertToCSV(report: any): string {
  // تحويل بسيط لـ CSV - يمكن تحسينه حسب الحاجة
  let csv = `تقرير,${report.title}\n`;
  csv += `تاريخ التوليد,${report.generatedAt}\n`;
  csv += `المولد,${report.generatedBy.name}\n`;
  csv += `فترة التقرير,${report.period.start} - ${report.period.end}\n\n`;

  // إضافة بيانات التقرير
  for (const [key, value] of Object.entries(report.data)) {
    csv += `${key},${
      typeof value === "object" ? JSON.stringify(value) : value
    }\n`;
  }

  // Add UTF-8 BOM to ensure proper encoding for Arabic text
  const BOM = "\uFEFF";
  return BOM + csv;
}
