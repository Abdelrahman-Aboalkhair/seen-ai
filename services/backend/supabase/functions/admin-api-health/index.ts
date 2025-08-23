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

    // التحقق من الدور الإداري
    const allowedRoles = ['super_admin', 'admin'];
    if (!allowedRoles.includes(profile.role) || profile.is_suspended) {
      return new Response(
        JSON.stringify({ error: 'Access denied: insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // جلب إعدادات API المكونة
    const { data: apiConfigs, error: configError } = await supabaseAdmin
      .from('api_configurations')
      .select('*')
      .eq('is_active', true);

    if (configError) {
      console.error('Error fetching API configurations:', configError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch API configurations' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const healthChecks = [];

    // اختبار قاعدة البيانات
    const dbStartTime = Date.now();
    try {
      await supabaseAdmin.from('profiles').select('id').limit(1);
      healthChecks.push({
        service: 'Supabase Database',
        status: 'healthy',
        response_time: Date.now() - dbStartTime,
        last_checked: new Date().toISOString(),
        details: 'Database connection successful'
      });
    } catch (dbError) {
      healthChecks.push({
        service: 'Supabase Database',
        status: 'unhealthy',
        response_time: Date.now() - dbStartTime,
        last_checked: new Date().toISOString(),
        details: `Database error: ${dbError.message}`
      });
    }

    // اختبار APIs الخارجية المكونة
    for (const config of apiConfigs || []) {
      const startTime = Date.now();
      let status = 'unhealthy';
      let details = '';
      
      try {
        const headers = {};
        
        // إضافة headers مخصصة إذا كانت موجودة
        if (config.headers) {
          Object.assign(headers, config.headers);
        }
        
        // إضافة API key إذا كان موجوداً
        if (config.api_key_encrypted) {
          // في التطبيق الحقيقي، يجب فك تشفير المفتاح هنا
          headers['Authorization'] = `Bearer ${config.api_key_encrypted}`;
        }

        const response = await fetch(config.endpoint_url, {
          method: 'GET',
          headers,
          signal: AbortSignal.timeout(10000) // timeout 10 seconds
        });

        if (response.ok || response.status < 500) {
          status = 'healthy';
          details = `API responded with status ${response.status}`;
        } else {
          details = `API returned error status ${response.status}`;
        }
      } catch (error) {
        details = `Connection failed: ${error.message}`;
      }

      const responseTime = Date.now() - startTime;
      
      healthChecks.push({
        service: config.service_name,
        endpoint: config.endpoint_url,
        status,
        response_time: responseTime,
        last_checked: new Date().toISOString(),
        details
      });

      // تحديث سجل الاختبار في قاعدة البيانات
      await supabaseAdmin
        .from('api_configurations')
        .update({
          last_tested: new Date().toISOString(),
          test_status: status === 'healthy' ? 'success' : 'failure'
        })
        .eq('id', config.id);
    }

    // إحصائيات عامة للنظام
    const systemStats = {};
    
    try {
      // عدد المستخدمين النشطين
      const { count: activeUsers } = await supabaseAdmin
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_suspended', false);
      systemStats.active_users = activeUsers;

      // عدد الجلسات النشطة
      const { count: activeSessions } = await supabaseAdmin
        .from('user_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString());
      systemStats.active_sessions = activeSessions;

      // عدد تذاكر الدعم المفتوحة
      const { count: openTickets } = await supabaseAdmin
        .from('support_tickets')
        .select('*', { count: 'exact', head: true })
        .in('status', ['open', 'in_progress']);
      systemStats.open_support_tickets = openTickets;

      // المعاملات في آخر 24 ساعة
      const { count: recentTransactions } = await supabaseAdmin
        .from('user_transactions')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
      systemStats.transactions_24h = recentTransactions;

    } catch (error) {
      console.error('Error fetching system stats:', error);
      systemStats.error = 'Failed to fetch some statistics';
    }

    // حساب الحالة العامة للنظام
    const healthyServices = healthChecks.filter(check => check.status === 'healthy').length;
    const totalServices = healthChecks.length;
    const overallStatus = healthyServices === totalServices ? 'healthy' : 
                         healthyServices > totalServices / 2 ? 'degraded' : 'unhealthy';

    const result = {
      overall_status: overallStatus,
      summary: {
        healthy_services: healthyServices,
        total_services: totalServices,
        uptime_percentage: totalServices > 0 ? (healthyServices / totalServices * 100) : 100
      },
      services: healthChecks,
      system_stats: systemStats,
      checked_at: new Date().toISOString()
    };

    // تسجيل النشاط
    await supabaseAdmin
      .from('admin_logs')
      .insert({
        admin_user_id: user.id,
        action: 'check_api_health',
        target_type: 'system',
        details: {
          overall_status: overallStatus,
          services_checked: totalServices,
          healthy_services: healthyServices
        },
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent') || 'unknown'
      });

    return new Response(
      JSON.stringify(result),
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