Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'false'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // الحصول على متغيرات البيئة
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('إعدادات Supabase غير متوفرة');
    }

    // التحقق من رمز المصادقة
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('مطلوب رمز المصادقة');
    }

    const token = authHeader.replace('Bearer ', '');

    // التحقق من صحة المستخدم
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': serviceRoleKey
      }
    });

    if (!userResponse.ok) {
      throw new Error('رمز مصادقة غير صالح');
    }

    const userData = await userResponse.json();
    const currentUserId = userData.id;

    // التحقق من صلاحيات المستخدم الحالي
    const profileResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${currentUserId}&select=role,permissions,is_suspended`, {
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Accept': 'application/vnd.pgrst.object+json'
      }
    });

    if (!profileResponse.ok) {
      throw new Error('فشل في التحقق من صلاحيات المستخدم');
    }

    const profile = await profileResponse.json();
    
    if (!profile || profile.is_suspended) {
      throw new Error('الحساب معلق أو غير موجود');
    }

    // التحقق من الدور
    const allowedRoles = ['super_admin', 'admin', 'finance_manager', 'analyst'];
    if (!allowedRoles.includes(profile.role)) {
      throw new Error('غير مخول لعرض الإحصائيات');
    }

    // استخراج بيانات الطلب
    const requestBody = await req.json();
    const { type = 'dashboard_summary', timeframe = '30d' } = requestBody;

    // حساب التاريخ المرجعي
    const now = new Date();
    let startDate = new Date();
    
    switch (timeframe) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case 'all':
        startDate = new Date('2020-01-01'); // تاريخ بداية قديم
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    const startDateStr = startDate.toISOString();

    // جلب إحصائيات المستخدمين
    const usersStatsResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?select=role,is_suspended,created_at&created_at=gte.${startDateStr}`, {
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey
      }
    });

    // جلب إحصائيات إجمالية للمستخدمين
    const totalUsersResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?select=role,is_suspended`, {
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey
      }
    });

    // جلب إحصائيات المعاملات
    const transactionsResponse = await fetch(`${supabaseUrl}/rest/v1/credit_transactions?select=credits_amount,transaction_type,created_at&created_at=gte.${startDateStr}`, {
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey
      }
    });

    // جلب إحصائيات عمليات البحث
    const searchesResponse = await fetch(`${supabaseUrl}/rest/v1/talent_searches?select=credits_cost,status,created_at&created_at=gte.${startDateStr}`, {
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey
      }
    });

    // جلب إحصائيات تحليل السير الذاتية
    const analysesResponse = await fetch(`${supabaseUrl}/rest/v1/cv_analyses?select=credits_cost,status,created_at&created_at=gte.${startDateStr}`, {
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey
      }
    });

    // جلب إحصائيات الدعم
    const ticketsResponse = await fetch(`${supabaseUrl}/rest/v1/support_tickets?select=status,priority,created_at&created_at=gte.${startDateStr}`, {
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey
      }
    });

    // معالجة الاستجابات
    const recentUsers = usersStatsResponse.ok ? await usersStatsResponse.json() : [];
    const totalUsers = totalUsersResponse.ok ? await totalUsersResponse.json() : [];
    const transactions = transactionsResponse.ok ? await transactionsResponse.json() : [];
    const searches = searchesResponse.ok ? await searchesResponse.json() : [];
    const analyses = analysesResponse.ok ? await analysesResponse.json() : [];
    const tickets = ticketsResponse.ok ? await ticketsResponse.json() : [];

    // حساب الإحصائيات
    const analytics = {
      users: {
        total: totalUsers.length,
        newUsers: recentUsers.length,
        activeUsers: totalUsers.filter(u => !u.is_suspended).length,
        suspendedUsers: totalUsers.filter(u => u.is_suspended).length,
        roleDistribution: totalUsers.reduce((acc, user) => {
          acc[user.role || 'user'] = (acc[user.role || 'user'] || 0) + 1;
          return acc;
        }, {})
      },
      
      financial: {
        totalTransactions: transactions.length,
        totalRevenue: transactions
          .filter(t => t.transaction_type === 'purchase')
          .reduce((sum, t) => sum + (t.credits_amount || 0), 0),
        adminGrants: transactions
          .filter(t => t.transaction_type === 'admin_grant')
          .reduce((sum, t) => sum + (t.credits_amount || 0), 0),
        adminDeductions: Math.abs(transactions
          .filter(t => t.transaction_type === 'admin_deduct')
          .reduce((sum, t) => sum + (t.credits_amount || 0), 0))
      },
      
      usage: {
        totalSearches: searches.length,
        completedSearches: searches.filter(s => s.status === 'completed').length,
        totalAnalyses: analyses.length,
        completedAnalyses: analyses.filter(a => a.status === 'completed').length,
        creditsSpent: [
          ...searches.filter(s => s.status === 'completed'),
          ...analyses.filter(a => a.status === 'completed')
        ].reduce((sum, item) => sum + (item.credits_cost || 0), 0)
      },
      
      support: {
        totalTickets: tickets.length,
        openTickets: tickets.filter(t => t.status === 'open').length,
        inProgressTickets: tickets.filter(t => t.status === 'in_progress').length,
        resolvedTickets: tickets.filter(t => t.status === 'resolved').length,
        urgentTickets: tickets.filter(t => t.priority === 'urgent').length
      },
      
      timeframe,
      startDate: startDateStr,
      endDate: now.toISOString()
    };

    // إضافة إحصائيات زمنية للمستخدمين الجدد
    if (type === 'dashboard_summary' || type === 'user_growth') {
      const dailyGrowth = {};
      
      recentUsers.forEach(user => {
        const date = new Date(user.created_at).toISOString().split('T')[0];
        dailyGrowth[date] = (dailyGrowth[date] || 0) + 1;
      });
      
      analytics.userGrowth = dailyGrowth;
    }

    // تسجيل العملية في سجل الأنشطة
    await fetch(`${supabaseUrl}/rest/v1/admin_logs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        admin_user_id: currentUserId,
        action: 'GET_ANALYTICS',
        target_type: 'analytics',
        details: {
          type,
          timeframe,
          totalUsers: analytics.users.total,
          newUsers: analytics.users.newUsers,
          totalTransactions: analytics.financial.totalTransactions
        }
      })
    });

    // إعداد استجابة ناجحة
    const response = {
      success: true,
      data: analytics
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('خطأ في وظيفة admin-get-analytics:', error);
    
    const errorResponse = {
      success: false,
      error: {
        code: 'ANALYTICS_ERROR',
        message: error.message || 'خطأ غير متوقع في جلب الإحصائيات'
      }
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
