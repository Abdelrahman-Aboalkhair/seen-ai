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
    const allowedRoles = ['super_admin', 'admin'];
    if (!allowedRoles.includes(profile.role)) {
      throw new Error('غير مخول لإيقاف/تفعيل المستخدمين');
    }

    // استخراج بيانات الطلب
    const requestBody = await req.json();
    const { userId, suspend, reason } = requestBody;

    if (!userId || typeof suspend !== 'boolean') {
      throw new Error('معرف المستخدم وحالة الإيقاف مطلوبان');
    }

    if (suspend && (!reason || reason.trim().length < 5)) {
      throw new Error('سبب الإيقاف مطلوب ويجب أن يكون على الأقل 5 أحرف');
    }

    // التحقق من وجود المستخدم المراد إيقافه/تفعيله
    const targetUserResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=role,full_name,email,is_suspended`, {
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Accept': 'application/vnd.pgrst.object+json'
      }
    });

    if (!targetUserResponse.ok) {
      throw new Error('المستخدم غير موجود');
    }

    const targetUser = await targetUserResponse.json();
    
    if (!targetUser) {
      throw new Error('المستخدم غير موجود');
    }

    // منع إيقاف حساب المشرف العام
    if (targetUser.role === 'super_admin') {
      throw new Error('لا يمكن إيقاف حساب المشرف العام');
    }

    // منع إيقاف الحساب الشخصي
    if (currentUserId === userId) {
      throw new Error('لا يمكنك إيقاف حسابك الشخصي');
    }

    // التحقق من الحالة الحالية
    if (targetUser.is_suspended === suspend) {
      const statusMessage = suspend ? 'الحساب معلق بالفعل' : 'الحساب مفعل بالفعل';
      throw new Error(statusMessage);
    }

    // تحضير بيانات التحديث
    const updateData: any = {
      is_suspended: suspend,
      updated_at: new Date().toISOString()
    };

    if (suspend) {
      updateData.suspension_reason = reason;
      updateData.suspended_at = new Date().toISOString();
      updateData.suspended_by = currentUserId;
    } else {
      // إزالة بيانات الإيقاف عند التفعيل
      updateData.suspension_reason = null;
      updateData.suspended_at = null;
      updateData.suspended_by = null;
    }

    // تنفيذ عملية التحديث
    const updateResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(updateData)
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      throw new Error(`فشل في تعديل حالة المستخدم: ${errorText}`);
    }

    const updatedUser = await updateResponse.json();

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
        action: suspend ? 'SUSPEND_USER' : 'ACTIVATE_USER',
        target_type: 'user',
        target_id: userId,
        details: {
          targetUserName: targetUser.full_name,
          targetUserEmail: targetUser.email,
          reason: suspend ? reason : 'تفعيل الحساب',
          previousStatus: targetUser.is_suspended ? 'معلق' : 'مفعل',
          newStatus: suspend ? 'معلق' : 'مفعل'
        }
      })
    });

    // إعداد استجابة ناجحة
    const statusMessage = suspend 
      ? `تم إيقاف حساب ${targetUser.full_name} بنجاح`
      : `تم تفعيل حساب ${targetUser.full_name} بنجاح`;

    const response = {
      success: true,
      data: {
        user: updatedUser[0],
        action: suspend ? 'suspended' : 'activated'
      },
      message: statusMessage
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('خطأ في وظيفة admin-suspend-user:', error);
    
    const errorResponse = {
      success: false,
      error: {
        code: 'SUSPEND_USER_ERROR',
        message: error.message || 'خطأ غير متوقع في تعديل حالة المستخدم'
      }
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
