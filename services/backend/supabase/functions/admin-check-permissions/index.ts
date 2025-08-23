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

    const { permissions: requestedPermissions, resource, action } = await req.json();

    const permissionsResponse = await fetch(`${supabaseUrl}/rest/v1/role_permissions?role_name=eq.${profile.role}&select=*`, {
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey
      }
    });

    if (!permissionsResponse.ok) {
      throw new Error('فشل في جلب الصلاحيات');
    }

    const userPermissions = await permissionsResponse.json();

    const checkSinglePermission = (permissionName, targetResource, targetAction) => {
      const fullAccess = userPermissions.find(p => 
        p.permission_name === 'full_system_access' && 
        p.resource === 'all' && 
        p.action === 'all' && 
        p.allowed === true
      );
      
      if (fullAccess) {
        return true;
      }

      const specificPermission = userPermissions.find(p => 
        p.permission_name === permissionName && 
        (p.resource === targetResource || p.resource === 'all') && 
        (p.action === targetAction || p.action === 'all') && 
        p.allowed === true
      );

      return !!specificPermission;
    };

    let result = {};

    if (resource && action) {
      const permissionName = requestedPermissions || `${action}_${resource}`;
      const hasPermission = checkSinglePermission(permissionName, resource, action);
      
      result = {
        has_permission: hasPermission,
        permission: permissionName,
        resource: resource,
        action: action
      };
    }
    else if (requestedPermissions && Array.isArray(requestedPermissions)) {
      const permissionResults = {};
      
      for (const permission of requestedPermissions) {
        const { name, resource: res, action: act } = permission;
        permissionResults[name] = checkSinglePermission(name, res, act);
      }
      
      result = {
        permissions: permissionResults,
        all_granted: Object.values(permissionResults).every(granted => granted === true)
      };
    }
    else {
      result = {
        user_role: profile.role,
        all_permissions: userPermissions.map(p => ({
          name: p.permission_name,
          resource: p.resource,
          action: p.action,
          allowed: p.allowed
        }))
      };
    }

    return new Response(JSON.stringify({
      success: true,
      data: result
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('خطأ في وظيفة admin-check-permissions:', error);
    
    const errorResponse = {
      success: false,
      error: {
        code: 'CHECK_PERMISSIONS_ERROR',
        message: error.message || 'خطأ غير متوقع في التحقق من الصلاحيات'
      }
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
