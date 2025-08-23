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
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('إعدادات Supabase غير متوفرة');
    }

    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('مطلوب رمز المصادقة');
    }

    const token = authHeader.replace('Bearer ', '');

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

    const profileResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${currentUserId}&select=role,is_suspended`, {
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

    const allowedRoles = ['super_admin', 'admin', 'manager'];
    if (!allowedRoles.includes(profile.role)) {
      throw new Error('غير مخول لعرض الأدوار');
    }

    const rolesResponse = await fetch(`${supabaseUrl}/rest/v1/user_roles?select=*&order=level.desc`, {
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey
      }
    });

    if (!rolesResponse.ok) {
      throw new Error('فشل في جلب الأدوار');
    }

    const roles = await rolesResponse.json();

    const rolesWithStats = [];
    for (const role of roles) {
      const countResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?role=eq.${role.name}&select=id`, {
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
          'Prefer': 'count=exact'
        }
      });

      let userCount = 0;
      if (countResponse.ok) {
        const contentRange = countResponse.headers.get('content-range');
        if (contentRange) {
          const match = contentRange.match(/\/(\d+)$/);
          if (match) {
            userCount = parseInt(match[1]);
          }
        }
      }

      rolesWithStats.push({
        ...role,
        user_count: userCount
      });
    }

    let filteredRoles = rolesWithStats;
    if (profile.role === 'admin') {
      filteredRoles = rolesWithStats.filter(role => role.name !== 'super_admin');
    } else if (profile.role === 'manager') {
      filteredRoles = rolesWithStats.filter(role => ['user', 'manager'].includes(role.name));
    }

    return new Response(JSON.stringify({
      success: true,
      data: {
        roles: filteredRoles,
        user_role: profile.role,
        total_roles: filteredRoles.length
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('خطأ في وظيفة admin-get-roles:', error);
    
    const errorResponse = {
      success: false,
      error: {
        code: 'GET_ROLES_ERROR',
        message: error.message || 'خطأ غير متوقع في جلب الأدوار'
      }
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
