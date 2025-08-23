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
        const { service, amount, description = '' } = await req.json();

        // Validate input
        if (!service || !amount || amount <= 0) {
            throw new Error('Service name and valid amount are required');
        }

        // Get the service role key and URL
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        // Get user from auth header
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            throw new Error('No authorization header provided');
        }

        const token = authHeader.replace('Bearer ', '');

        // Verify token and get user
        const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'apikey': serviceRoleKey
            }
        });

        if (!userResponse.ok) {
            throw new Error('Invalid or expired token');
        }

        const userData = await userResponse.json();
        const userId = userData.id;

        console.log('Logging credit usage for user:', { userId, service, amount });

        // Log the usage in credit_usage_logs table
        const usageData = {
            user_id: userId,
            service_used: service,
            credits_deducted: amount,
            usage_date: new Date().toISOString()
        };

        const usageResponse = await fetch(`${supabaseUrl}/rest/v1/credit_usage_logs`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(usageData)
        });

        if (!usageResponse.ok) {
            const errorText = await usageResponse.text();
            throw new Error(`Failed to log credit usage: ${errorText}`);
        }

        const logEntry = await usageResponse.json();

        console.log('Credit usage logged successfully:', {
            userId,
            service,
            amount,
            logId: logEntry[0]?.id
        });

        return new Response(JSON.stringify({
            data: {
                logId: logEntry[0]?.id,
                userId,
                service,
                amount,
                timestamp: usageData.usage_date,
                description
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Credit usage log error:', error);

        const errorResponse = {
            error: {
                code: 'CREDIT_USAGE_LOG_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});