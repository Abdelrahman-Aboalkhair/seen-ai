Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'false'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const signature = req.headers.get('stripe-signature');
        const body = await req.text();
        
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        if (!webhookSecret || !signature) {
            throw new Error('Webhook signature verification failed');
        }

        console.log('Processing Stripe webhook...');

        // Parse the webhook event
        let event;
        try {
            event = JSON.parse(body);
        } catch (err) {
            throw new Error('Invalid JSON payload');
        }

        console.log('Webhook event type:', event.type);

        // Handle the checkout.session.completed event
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            const userId = session.metadata?.user_id;
            const packageId = session.metadata?.package_id;
            const credits = parseInt(session.metadata?.credits || '0');
            const packageName = session.metadata?.package_name;

            console.log('Processing completed payment:', {
                sessionId: session.id,
                userId,
                packageId,
                credits,
                packageName
            });

            if (!userId || !packageId || !credits) {
                throw new Error('Missing required metadata in session');
            }

            // Update payment status in database
            const updatePaymentResponse = await fetch(`${supabaseUrl}/rest/v1/payments?stripe_session_id=eq.${session.id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    status: 'completed',
                    completed_at: new Date().toISOString()
                })
            });

            if (!updatePaymentResponse.ok) {
                console.warn('Failed to update payment status, but proceeding with credit addition');
            }

            // Add credits to user account
            const addCreditsResponse = await fetch(`${supabaseUrl}/functions/v1/add-credits`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    amount: credits,
                    description: `Purchase completed: ${packageName} - ${credits} credits`,
                    transactionType: 'purchase',
                    packageId: parseInt(packageId)
                })
            });

            // We need to manually add credits since we can't use user auth in webhook
            // Get current credits
            const profileResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=credits`, {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                }
            });

            if (!profileResponse.ok) {
                throw new Error('Failed to fetch user profile');
            }

            const profiles = await profileResponse.json();
            if (!profiles || profiles.length === 0) {
                throw new Error('User profile not found');
            }

            const currentCredits = profiles[0].credits || 0;
            const newBalance = currentCredits + credits;

            // Update user credits
            const updateCreditsResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    credits: newBalance,
                    updated_at: new Date().toISOString()
                })
            });

            if (!updateCreditsResponse.ok) {
                throw new Error('Failed to update user credits');
            }

            // Log the transaction
            const transactionData = {
                user_id: userId,
                package_id: parseInt(packageId),
                credits_added: credits,
                transaction_date: new Date().toISOString()
            };

            const transactionResponse = await fetch(`${supabaseUrl}/rest/v1/credit_transactions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(transactionData)
            });

            if (!transactionResponse.ok) {
                console.warn('Failed to log credit transaction, but payment processed successfully');
            }

            console.log('Payment processed successfully:', {
                userId,
                previousBalance: currentCredits,
                addedCredits: credits,
                newBalance
            });

            return new Response(JSON.stringify({ received: true }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // For other event types, just acknowledge receipt
        return new Response(JSON.stringify({ received: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Stripe webhook error:', error);

        const errorResponse = {
            error: {
                code: 'WEBHOOK_PROCESSING_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});