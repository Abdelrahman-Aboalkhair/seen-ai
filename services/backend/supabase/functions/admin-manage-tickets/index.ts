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
    const allowedRoles = ['super_admin', 'admin', 'support_agent'];
    if (!allowedRoles.includes(profile.role)) {
      throw new Error('غير مخول لإدارة تذاكر الدعم');
    }

    // استخراج بيانات الطلب
    const requestBody = await req.json();
    const { action, ticketId, updateData, responseData, filters = {} } = requestBody;

    if (!action) {
      throw new Error('نوع العملية مطلوب');
    }

    let response;

    switch (action) {
      case 'list': {
        const {
          page = 1,
          limit = 20,
          status = '',
          priority = '',
          assigned_to = '',
          sortBy = 'created_at',
          sortOrder = 'desc'
        } = requestBody;

        // تحديد النطاق للصفحات
        const offset = (page - 1) * limit;
        
        // بناء استعلام قاعدة البيانات مع الربط بجدول المستخدمين
        let queryUrl = `${supabaseUrl}/rest/v1/support_tickets?select=*,user_profile:profiles!user_id(full_name,email),assigned_profile:profiles!assigned_to(full_name,email)&order=${sortBy}.${sortOrder}&offset=${offset}&limit=${limit}`;
        
        // إضافة فلاتر البحث
        const filterParams = [];
        
        if (status.trim()) {
          filterParams.push(`status=eq.${status}`);
        }
        
        if (priority.trim()) {
          filterParams.push(`priority=eq.${priority}`);
        }
        
        if (assigned_to.trim()) {
          filterParams.push(`assigned_to=eq.${assigned_to}`);
        }
        
        if (filterParams.length > 0) {
          queryUrl += '&' + filterParams.join('&');
        }

        // جلب التذاكر
        const ticketsResponse = await fetch(queryUrl, {
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Prefer': 'count=exact'
          }
        });

        if (!ticketsResponse.ok) {
          const errorText = await ticketsResponse.text();
          throw new Error(`فشل في جلب التذاكر: ${errorText}`);
        }

        const tickets = await ticketsResponse.json();
        
        // الحصول على العدد الإجمالي من header
        const contentRange = ticketsResponse.headers.get('content-range');
        let totalCount = tickets.length;
        
        if (contentRange) {
          const match = contentRange.match(/\/(\d+)$/);
          if (match) {
            totalCount = parseInt(match[1]);
          }
        }

        response = {
          success: true,
          data: {
            tickets,
            total: totalCount,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(totalCount / limit)
          }
        };
        break;
      }

      case 'update': {
        if (!ticketId || !updateData) {
          throw new Error('معرف التذكرة وبيانات التحديث مطلوبان');
        }

        // تحضير بيانات التحديث المسموحة
        const allowedFields = ['status', 'priority', 'assigned_to', 'category', 'resolution_notes'];
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
        
        // إضافة تاريخ الحل إذا تم تغيير الحالة إلى محلولة
        if (sanitizedUpdateData.status === 'resolved' || sanitizedUpdateData.status === 'closed') {
          sanitizedUpdateData.resolved_at = new Date().toISOString();
        }

        // تنفيذ عملية التحديث
        const updateResponse = await fetch(`${supabaseUrl}/rest/v1/support_tickets?id=eq.${ticketId}`, {
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
          throw new Error(`فشل في تحديث التذكرة: ${errorText}`);
        }

        const updatedTicket = await updateResponse.json();

        response = {
          success: true,
          data: { ticket: updatedTicket[0] },
          message: 'تم تحديث التذكرة بنجاح'
        };
        break;
      }

      case 'respond': {
        if (!ticketId || !responseData || !responseData.message) {
          throw new Error('معرف التذكرة ورسالة الرد مطلوبان');
        }

        // إضافة رد جديد
        const responseInsert = await fetch(`${supabaseUrl}/rest/v1/support_responses`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            ticket_id: ticketId,
            responder_id: currentUserId,
            message: responseData.message,
            is_internal: responseData.is_internal || false,
            attachments: responseData.attachments || null
          })
        });

        if (!responseInsert.ok) {
          const errorText = await responseInsert.text();
          throw new Error(`فشل في إضافة الرد: ${errorText}`);
        }

        const newResponse = await responseInsert.json();

        // تحديث حالة التذكرة إذا طُلب ذلك
        if (responseData.updateStatus) {
          const ticketUpdate = {
            status: responseData.updateStatus,
            updated_at: new Date().toISOString()
          };

          if (responseData.updateStatus === 'resolved' || responseData.updateStatus === 'closed') {
            ticketUpdate.resolved_at = new Date().toISOString();
          }

          await fetch(`${supabaseUrl}/rest/v1/support_tickets?id=eq.${ticketId}`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${serviceRoleKey}`,
              'apikey': serviceRoleKey,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(ticketUpdate)
          });
        }

        response = {
          success: true,
          data: { response: newResponse[0] },
          message: 'تم إضافة الرد بنجاح'
        };
        break;
      }

      default:
        throw new Error('عملية غير مدعومة');
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
        action: `TICKET_${action.toUpperCase()}`,
        target_type: 'support_ticket',
        target_id: ticketId || null,
        details: {
          action,
          ticketId,
          updateData: updateData || null,
          responseData: responseData || null
        }
      })
    });

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('خطأ في وظيفة admin-manage-tickets:', error);
    
    const errorResponse = {
      success: false,
      error: {
        code: 'TICKETS_MANAGEMENT_ERROR',
        message: error.message || 'خطأ غير متوقع في إدارة تذاكر الدعم'
      }
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
