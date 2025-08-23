Deno.serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE, PATCH",
    "Access-Control-Max-Age": "86400",
    "Access-Control-Allow-Credentials": "false",
  };

  if (req.method === "OPTIONS") {
    console.log("=== CORS Preflight Request Handled ===");
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    console.log("=== Admin Grant Credits Function Started ===");
    console.log("Request method:", req.method);
    console.log("Request URL:", req.url);

    // الحصول على متغيرات البيئة
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    console.log("Environment variables loaded:");
    console.log("- supabaseUrl:", supabaseUrl ? "✅ Present" : "❌ Missing");
    console.log(
      "- serviceRoleKey:",
      serviceRoleKey ? "✅ Present" : "❌ Missing"
    );

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("إعدادات Supabase غير متوفرة");
    }

    // التحقق من رمز المصادقة
    const authHeader = req.headers.get("authorization");
    console.log("Auth header present:", !!authHeader);

    if (!authHeader) {
      throw new Error("مطلوب رمز المصادقة");
    }

    const token = authHeader.replace("Bearer ", "");
    console.log("Token extracted, length:", token.length);

    // التحقق من صحة المستخدم
    console.log("Verifying user token...");
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: serviceRoleKey,
      },
    });

    console.log("User verification response status:", userResponse.status);

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      console.error("User verification failed:", errorText);
      throw new Error("رمز مصادقة غير صالح");
    }

    const userData = await userResponse.json();
    const currentUserId = userData.id;
    console.log("Current user ID:", currentUserId);

    // التحقق من صلاحيات المستخدم الحالي
    console.log("Checking user permissions...");
    const profileResponse = await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${currentUserId}&select=role,permissions,is_suspended`,
      {
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          apikey: serviceRoleKey,
          Accept: "application/vnd.pgrst.object+json",
        },
      }
    );

    console.log("Profile response status:", profileResponse.status);

    if (!profileResponse.ok) {
      const errorText = await profileResponse.text();
      console.error("Profile check failed:", errorText);
      throw new Error("فشل في التحقق من صلاحيات المستخدم");
    }

    const profile = await profileResponse.json();
    console.log("User profile:", profile);

    if (!profile || profile.is_suspended) {
      throw new Error("الحساب معلق أو غير موجود");
    }

    // التحقق من الدور
    const allowedRoles = ["super_admin", "admin", "finance_manager"];
    console.log("User role:", profile.role);
    console.log("Allowed roles:", allowedRoles);

    if (!allowedRoles.includes(profile.role)) {
      throw new Error("غير مخول لإدارة أرصدة المستخدمين");
    }

    // استخراج بيانات الطلب
    console.log("Parsing request body...");
    const requestBody = await req.json();
    console.log("Request body:", requestBody);

    const { userId, amount, reason, type = "grant" } = requestBody;

    console.log("Extracted parameters:");
    console.log("- userId:", userId);
    console.log("- amount:", amount);
    console.log("- reason:", reason);
    console.log("- type:", type);

    if (!userId || !amount || !reason) {
      throw new Error("معرف المستخدم، مقدار الكريدت، والسبب مطلوبان");
    }

    if (typeof amount !== "number" || amount <= 0) {
      throw new Error("مقدار الكريدت يجب أن يكون رقماً موجباً");
    }

    if (reason.trim().length < 5) {
      throw new Error("السبب يجب أن يكون على الأقل 5 أحرف");
    }

    if (!["grant", "deduct"].includes(type)) {
      throw new Error("نوع العملية يجب أن يكون grant أو deduct");
    }

    // التحقق من وجود المستخدم المراد عمل عملية كريدت له
    console.log("Checking target user...");
    const targetUserResponse = await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=full_name,email,credits,is_suspended`,
      {
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          apikey: serviceRoleKey,
          Accept: "application/vnd.pgrst.object+json",
        },
      }
    );

    console.log("Target user response status:", targetUserResponse.status);

    if (!targetUserResponse.ok) {
      const errorText = await targetUserResponse.text();
      console.error("Target user check failed:", errorText);
      throw new Error("المستخدم غير موجود");
    }

    const targetUser = await targetUserResponse.json();
    console.log("Target user:", targetUser);

    if (!targetUser) {
      throw new Error("المستخدم غير موجود");
    }

    if (targetUser.is_suspended) {
      throw new Error("لا يمكن إدارة كريدت حساب معلق");
    }

    const currentCredits = targetUser.credits || 0;
    console.log("Current credits:", currentCredits);

    // حساب الرصيد الجديد
    let newCredits;
    if (type === "grant") {
      newCredits = currentCredits + amount;
    } else {
      // deduct
      newCredits = Math.max(0, currentCredits - amount); // عدم السماح برصيد سالب
    }

    console.log("New credits will be:", newCredits);

    // تحديث رصيد المستخدم
    console.log("Updating user credits...");
    const updateResponse = await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          apikey: serviceRoleKey,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          credits: newCredits,
          updated_at: new Date().toISOString(),
        }),
      }
    );

    console.log("Update response status:", updateResponse.status);

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error("Update failed:", errorText);
      throw new Error(`فشل في تحديث رصيد المستخدم: ${errorText}`);
    }

    const updatedUser = await updateResponse.json();
    console.log("Updated user:", updatedUser);

    // إضافة سجل في جدول المعاملات
    console.log("Recording credit transaction...");
    const transactionType = type === "grant" ? "admin_grant" : "admin_deduct";
    const transactionAmount = type === "grant" ? amount : -amount;

    const transactionResponse = await fetch(
      `${supabaseUrl}/rest/v1/credit_transactions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          apikey: serviceRoleKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          transaction_type: transactionType,
          credits_amount: transactionAmount,
          description: `عملية إدارية: ${reason}`,
          order_id: `admin_${Date.now()}_${currentUserId}`,
        }),
      }
    );

    console.log("Transaction response status:", transactionResponse.status);
    if (!transactionResponse.ok) {
      const errorText = await transactionResponse.text();
      console.error("Transaction recording failed:", errorText);
    }

    // تسجيل العملية في سجل الأنشطة
    console.log("Recording admin log...");
    const adminLogResponse = await fetch(`${supabaseUrl}/rest/v1/admin_logs`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        admin_user_id: currentUserId,
        action: type === "grant" ? "GRANT_CREDITS" : "DEDUCT_CREDITS",
        target_type: "user",
        target_id: userId,
        details: {
          targetUserName: targetUser.full_name,
          targetUserEmail: targetUser.email,
          amount,
          reason,
          previousCredits: currentCredits,
          newCredits,
          creditChange: transactionAmount,
        },
      }),
    });

    console.log("Admin log response status:", adminLogResponse.status);
    if (!adminLogResponse.ok) {
      const errorText = await adminLogResponse.text();
      console.error("Admin log recording failed:", errorText);
    }

    // إعداد استجابة ناجحة
    const actionMessage =
      type === "grant"
        ? `تم منح ${amount} كريدت لـ ${targetUser.full_name}`
        : `تم خصم ${amount} كريدت من ${targetUser.full_name}`;

    const response = {
      success: true,
      data: {
        user: updatedUser[0],
        transaction: {
          type: transactionType,
          amount: transactionAmount,
          previousCredits: currentCredits,
          newCredits,
          reason,
        },
      },
      message: actionMessage,
    };

    console.log("=== Admin Grant Credits Function Completed Successfully ===");
    console.log("Response:", response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("=== Admin Grant Credits Function Error ===");
    console.error("Error type:", error.constructor.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);

    const errorResponse = {
      success: false,
      error: {
        code: "CREDIT_OPERATION_ERROR",
        message: error.message || "خطأ غير متوقع في إدارة الكريدت",
      },
    };

    console.log("Error response:", errorResponse);

    return new Response(JSON.stringify(errorResponse), {
      status: 200, // Always return 200 to avoid supabase.functions.invoke issues
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
