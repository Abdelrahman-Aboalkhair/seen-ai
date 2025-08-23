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

    const { action, userId, newRole, reason } = await req.json();

    if (!action) {
      throw new Error('نوع العملية مطلوب');
    }

    if (action === 'assign_role') {
      if (!userId || !newRole) {
        throw new Error('معرف المستخدم والدور الجديد مطلوبان');
      }

      const roleCheckQuery = `${supabaseUrl}/rest/v1/user_roles?name=eq.${newRole}&select=level`;
      const roleCheckResponse = await fetch(roleCheckQuery, {
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
          'Accept': 'application/vnd.pgrst.object+json'
        }
      });

      if (!roleCheckResponse.ok) {
        throw new Error('فشل في التحقق من الدور المطلوب');
      }

      const targetRole = await roleCheckResponse.json();
      if (!targetRole) {
        throw new Error('الدور المطلوب غير موجود');
      }

      const targetLevel = targetRole.level;

      if (profile.role === 'super_admin') {
        // المدير العام يمكنه تعيين أي دور
      } else if (profile.role === 'admin') {
        if (targetLevel >= 4) {
          throw new Error('لا يحق لك تعيين هذا الدور');
        }
      } else {
        throw new Error('غير مخول لتعيين الأدوار');
      }

      if (userId === currentUserId) {
        throw new Error('لا يمكنك تعديل دورك الخاص');
      }

      const targetUserResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=role`, {
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
          'Accept': 'application/vnd.pgrst.object+json'
        }
      });

      if (!targetUserResponse.ok) {
        throw new Error('المستخدم المستهدف غير موجود');
      }

      const targetUser = await targetUserResponse.json();
      const oldRole = targetUser.role;

      const logResponse = await fetch(`${supabaseUrl}/rest/v1/role_change_logs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: userId,
          old_role: oldRole,
          new_role: newRole,
          changed_by: currentUserId,
          reason: reason || 'تغيير من لوحة الإدارة',
          approved: true
        })
      });

      const updateResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          role: newRole,
          updated_at: new Date().toISOString()
        })
      });

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        throw new Error(`فشل في تحديث الدور: ${errorText}`);
      }

      const updatedUser = await updateResponse.json();

      return new Response(JSON.stringify({
        success: true,
        data: {
          message: 'تم تحديث الدور بنجاح',
          user: updatedUser[0],
          old_role: oldRole,
          new_role: newRole
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    throw new Error('عملية غير مدعومة');

  } catch (error) {
    console.error('خطأ في وظيفة admin-manage-roles:', error);
    
    const errorResponse = {
      success: false,
      error: {
        code: 'MANAGE_ROLES_ERROR',
        message: error.message || 'خطأ غير متوقع في إدارة الأدوار'
      }
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
