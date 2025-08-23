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
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const {
      amount,
      description = "Credits added",
      transactionType = "purchase",
      packageId = null,
    } = await req.json();

    // Validate input
    if (!amount || amount <= 0) {
      throw new Error("Valid credit amount is required");
    }

    // Get the service role key and URL
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");

    if (!serviceRoleKey || !supabaseUrl) {
      throw new Error("Supabase configuration missing");
    }

    // Get user from auth header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");

    // Verify token and get user
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: serviceRoleKey,
      },
    });

    if (!userResponse.ok) {
      throw new Error("Invalid or expired token");
    }

    const userData = await userResponse.json();
    const userId = userData.id;

    console.log("Adding credits for user:", { userId, amount, description });

    // Get current credits
    const profileResponse = await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=credits`,
      {
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          apikey: serviceRoleKey,
          "Content-Type": "application/json",
        },
      }
    );

    if (!profileResponse.ok) {
      const errorText = await profileResponse.text();
      throw new Error(`Failed to fetch current credits: ${errorText}`);
    }

    const profiles = await profileResponse.json();
    if (!profiles || profiles.length === 0) {
      throw new Error("User profile not found");
    }

    const currentCredits = profiles[0].credits || 0;
    const newBalance = currentCredits + amount;

    // Update user credits
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
          credits: newBalance,
          updated_at: new Date().toISOString(),
        }),
      }
    );

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      throw new Error(`Failed to update credits: ${errorText}`);
    }

    // Log the transaction in credit_transactions table
    const transactionData = {
      user_id: userId,
      package_id: packageId,
      credits_added: amount,
      transaction_date: new Date().toISOString(),
    };

    const transactionResponse = await fetch(
      `${supabaseUrl}/rest/v1/credit_transactions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          apikey: serviceRoleKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(transactionData),
      }
    );

    if (!transactionResponse.ok) {
      console.warn(
        "Failed to log credit transaction, but credits were added successfully"
      );
    }

    console.log("Credits added successfully:", {
      userId,
      previousBalance: currentCredits,
      addedAmount: amount,
      newBalance,
    });

    return new Response(
      JSON.stringify({
        data: {
          newBalance,
          addedAmount: amount,
          previousBalance: currentCredits,
          description,
          transactionType,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Add credits error:", error);

    const errorResponse = {
      error: {
        code: "ADD_CREDITS_FAILED",
        message: error.message,
      },
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 200, // Always return 200 to avoid supabase.functions.invoke issue
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
