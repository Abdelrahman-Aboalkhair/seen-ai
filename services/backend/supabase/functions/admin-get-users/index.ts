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
    const allowedRoles = ['super_admin', 'admin', 'manager'];
    if (!allowedRoles.includes(profile.role)) {
      throw new Error('غير مخول لإدارة المستخدمين');
    }

    // استخراج معاملات الطلب من URL parameters
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
    const search = url.searchParams.get('search') || '';
    const role = url.searchParams.get('role') || '';
    const status = url.searchParams.get('status') || 'all';
    const sortBy = url.searchParams.get('sortBy') || 'created_at';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';

    // تحديد النطاق للصفحات
    const offset = (page - 1) * limit;
    
    // بناء استعلام قاعدة البيانات
    let queryUrl = `${supabaseUrl}/rest/v1/profiles?select=id,email,full_name,role,permissions,is_suspended,suspension_reason,suspended_at,suspended_by,last_login,login_count,created_at,updated_at&order=${sortBy}.${sortOrder}&offset=${offset}&limit=${limit}`;
    
    // إضافة فلاتر البحث
    const filters = [];
    
    if (search.trim()) {
      filters.push(`or=(full_name.ilike.*${search}*,email.ilike.*${search}*)`);
    }
    
    if (role.trim()) {
      filters.push(`role=eq.${role}`);
    }
    
    if (status === 'active') {
      filters.push('is_suspended=eq.false');
    } else if (status === 'suspended') {
      filters.push('is_suspended=eq.true');
    }
    
    if (filters.length > 0) {
      queryUrl += '&' + filters.join('&');
    }

    // جلب المستخدمين
    const usersResponse = await fetch(queryUrl, {
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Prefer': 'count=exact'
      }
    });

    if (!usersResponse.ok) {
      const errorText = await usersResponse.text();
      throw new Error(`فشل في جلب المستخدمين: ${errorText}`);
    }

    const users = await usersResponse.json();
    
    // الحصول على العدد الإجمالي من header
    const contentRange = usersResponse.headers.get('content-range');
    let totalCount = users.length;
    
    if (contentRange) {
      const match = contentRange.match(/\/(\d+)$/);
      if (match) {
        totalCount = parseInt(match[1]);
      }
    }

    // جلب معلومات الأدوار لإضافة الأسماء المعروضة
    const rolesResponse = await fetch(`${supabaseUrl}/rest/v1/user_roles?select=name,display_name`, {
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey
      }
    });

    const roles = rolesResponse.ok ? await rolesResponse.json() : [];
    const roleMap = {};
    roles.forEach(role => {
      roleMap[role.name] = role.display_name;
    });

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
        action: 'GET_USERS',
        target_type: 'users',
        details: {
          page,
          limit,
          search,
          role,
          status,
          sortBy,
          sortOrder,
          resultsCount: users.length,
          totalCount
        }
      })
    });

    // إعداد استجابة ناجحة
    const response = {
      success: true,
      data: {
        users: users.map(user => ({
          ...user,
          // إضافة اسم الدور المعروض
          role_display_name: roleMap[user.role] || user.role,
          // حماية معلومات حساسة للمستخدمين ذوي الصلاحيات المحدودة
          permissions: profile.role === 'super_admin' ? user.permissions : undefined
        })),
        total: totalCount,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalCount / limit)
      }
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('خطأ في وظيفة admin-get-users:', error);
    
    const errorResponse = {
      success: false,
      error: {
        code: 'GET_USERS_ERROR',
        message: error.message || 'خطأ غير متوقع في جلب المستخدمين'
      }
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
