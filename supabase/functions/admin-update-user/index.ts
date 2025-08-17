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
      throw new Error('غير مخول لتحديث بيانات المستخدمين');
    }

    // استخراج بيانات الطلب
    const requestBody = await req.json();
    const { userId, updateData } = requestBody;

    if (!userId || !updateData) {
      throw new Error('معرف المستخدم وبيانات التحديث مطلوبان');
    }

    // التحقق من وجود المستخدم المراد تحديثه
    const targetUserResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=role,full_name,email`, {
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

    // التحقق من صلاحية تعديل الدور (فقط super_admin يمكنه تغيير الأدوار)
    if (updateData.role && profile.role !== 'super_admin') {
      throw new Error('فقط المشرف العام يمكنه تغيير أدوار المستخدمين');
    }

    // منع تعديل حساب المشرف العام من قبل مستخدمين آخرين
    if (targetUser.role === 'super_admin' && currentUserId !== userId) {
      throw new Error('لا يمكن تعديل حساب المشرف العام');
    }

    // تحضير بيانات التحديث المسموحة
    const allowedFields = ['full_name', 'role', 'permissions'];
    const sanitizedUpdateData: any = {};
    
    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key) && value !== null && value !== undefined) {
        sanitizedUpdateData[key] = value;
      }
    }

    if (Object.keys(sanitizedUpdateData).length === 0) {
      throw new Error('لا توجد بيانات صالحة للتحديث');
    }

    // إضافة تاريخ التحديث
    sanitizedUpdateData.updated_at = new Date().toISOString();

    // تنفيذ عملية التحديث
    const updateResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(sanitizedUpdateData)
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      throw new Error(`فشل في تحديث بيانات المستخدم: ${errorText}`);
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
        action: 'UPDATE_USER',
        target_type: 'user',
        target_id: userId,
        details: {
          updatedFields: Object.keys(sanitizedUpdateData),
          targetUserName: targetUser.full_name,
          targetUserEmail: targetUser.email,
          oldRole: targetUser.role,
          newRole: sanitizedUpdateData.role || targetUser.role
        }
      })
    });

    // إعداد استجابة ناجحة
    const response = {
      success: true,
      data: {
        user: updatedUser[0],
        updatedFields: Object.keys(sanitizedUpdateData)
      },
      message: 'تم تحديث بيانات المستخدم بنجاح'
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('خطأ في وظيفة admin-update-user:', error);
    
    const errorResponse = {
      success: false,
      error: {
        code: 'UPDATE_USER_ERROR',
        message: error.message || 'خطأ غير متوقع في تحديث بيانات المستخدم'
      }
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
