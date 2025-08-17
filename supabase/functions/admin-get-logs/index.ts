import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'false'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // التحقق من المصادقة
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // التحقق من صلاحيات المستخدم
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, is_suspended')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'Profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // التحقق من الدور الإداري (فقط super_admin و admin يمكنهم عرض السجلات)
    const allowedRoles = ['super_admin', 'admin'];
    if (!allowedRoles.includes(profile.role) || profile.is_suspended) {
      return new Response(
        JSON.stringify({ error: 'Access denied: insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // استخراج معاملات البحث
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
    const action = url.searchParams.get('action');
    const targetType = url.searchParams.get('target_type');
    const adminUserId = url.searchParams.get('admin_user_id');
    const startDate = url.searchParams.get('start_date');
    const endDate = url.searchParams.get('end_date');
    const search = url.searchParams.get('search');

    const offset = (page - 1) * limit;

    // بناء استعلام قاعدة البيانات
    let query = supabaseAdmin
      .from('admin_logs')
      .select(`
        *,
        profiles!admin_logs_admin_user_id_fkey(
          full_name,
          email,
          role
        )
      `);

    // تطبيق المرشحات
    if (action) {
      query = query.eq('action', action);
    }
    if (targetType) {
      query = query.eq('target_type', targetType);
    }
    if (adminUserId) {
      query = query.eq('admin_user_id', adminUserId);
    }
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }
    if (search) {
      query = query.or(`action.ilike.%${search}%,target_type.ilike.%${search}%,target_id.ilike.%${search}%`);
    }

    // تطبيق الترتيب والتقسيم
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: logs, error: logsError } = await query;

    if (logsError) {
      console.error('Error fetching logs:', logsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch logs' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // الحصول على العدد الإجمالي للسجلات
    let countQuery = supabaseAdmin
      .from('admin_logs')
      .select('*', { count: 'exact', head: true });

    if (action) countQuery = countQuery.eq('action', action);
    if (targetType) countQuery = countQuery.eq('target_type', targetType);
    if (adminUserId) countQuery = countQuery.eq('admin_user_id', adminUserId);
    if (startDate) countQuery = countQuery.gte('created_at', startDate);
    if (endDate) countQuery = countQuery.lte('created_at', endDate);
    if (search) {
      countQuery = countQuery.or(`action.ilike.%${search}%,target_type.ilike.%${search}%,target_id.ilike.%${search}%`);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error('Error counting logs:', countError);
    }

    // إحصائيات سريعة
    const { data: todayLogs } = await supabaseAdmin
      .from('admin_logs')
      .select('action, admin_user_id')
      .gte('created_at', new Date().toISOString().split('T')[0]);

    const { data: uniqueAdmins } = await supabaseAdmin
      .from('admin_logs')
      .select('admin_user_id')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    const actionCounts = {};
    todayLogs?.forEach(log => {
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
    });

    const summary = {
      total_today: todayLogs?.length || 0,
      unique_admins_this_week: new Set(uniqueAdmins?.map(u => u.admin_user_id)).size,
      most_common_actions: Object.entries(actionCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([action, count]) => ({ action, count }))
    };

    // تسجيل النشاط (مراقبة المراقبين!)
    await supabaseAdmin
      .from('admin_logs')
      .insert({
        admin_user_id: user.id,
        action: 'view_admin_logs',
        target_type: 'admin_logs',
        details: {
          filters: { action, targetType, adminUserId, startDate, endDate, search },
          page,
          limit,
          results_count: logs?.length || 0
        },
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent') || 'unknown'
      });

    return new Response(
      JSON.stringify({
        logs,
        pagination: {
          page,
          limit,
          total: count || 0,
          total_pages: Math.ceil((count || 0) / limit)
        },
        summary
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});