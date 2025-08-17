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
        const { packageId, customerEmail, returnUrl } = await req.json();

        // Validate input
        if (!packageId) {
            throw new Error('Package ID is required');
        }

        // Get the service role key and URL
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        if (!stripeSecretKey) {
            throw new Error('Stripe configuration missing');
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
        const userEmail = customerEmail || userData.email;

        console.log('Processing payment for user:', { userId, packageId });

        // Get package details
        const packageResponse = await fetch(`${supabaseUrl}/rest/v1/packages?id=eq.${packageId}`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            }
        });

        if (!packageResponse.ok) {
            const errorText = await packageResponse.text();
            throw new Error(`Failed to fetch package: ${errorText}`);
        }

        const packages = await packageResponse.json();
        if (!packages || packages.length === 0) {
            throw new Error('Package not found');
        }

        const packageData = packages[0];
        const amount = packageData.price * 100; // Convert to cents for Stripe
        const credits = packageData.credits;
        const packageName = packageData.name;

        console.log('Package details:', { packageName, amount: amount / 100, credits });

        // Create Stripe Checkout Session
        const checkoutParams = new URLSearchParams();
        checkoutParams.append('success_url', returnUrl || `${req.headers.get('origin')}/dashboard?payment=success`);
        checkoutParams.append('cancel_url', returnUrl || `${req.headers.get('origin')}/pricing?payment=cancelled`);
        checkoutParams.append('payment_method_types[]', 'card');
        checkoutParams.append('mode', 'payment');
        checkoutParams.append('customer_email', userEmail);
        checkoutParams.append('client_reference_id', userId);
        
        // Line items
        checkoutParams.append('line_items[0][price_data][currency]', 'usd');
        checkoutParams.append('line_items[0][price_data][product_data][name]', `${packageName} - ${credits} Credits`);
        checkoutParams.append('line_items[0][price_data][product_data][description]', `${packageName} credit package with ${credits} credits`);
        checkoutParams.append('line_items[0][price_data][unit_amount]', amount.toString());
        checkoutParams.append('line_items[0][quantity]', '1');
        
        // Metadata
        checkoutParams.append('metadata[user_id]', userId);
        checkoutParams.append('metadata[package_id]', packageId.toString());
        checkoutParams.append('metadata[credits]', credits.toString());
        checkoutParams.append('metadata[package_name]', packageName);

        const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${stripeSecretKey}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: checkoutParams.toString()
        });

        console.log('Stripe API response status:', stripeResponse.status);

        if (!stripeResponse.ok) {
            const errorData = await stripeResponse.text();
            console.error('Stripe API error:', errorData);
            throw new Error(`Stripe API error: ${errorData}`);
        }

        const checkoutSession = await stripeResponse.json();
        console.log('Stripe checkout session created:', checkoutSession.id);

        // Create payment record in database
        const paymentData = {
            user_id: userId,
            package_id: packageId,
            stripe_session_id: checkoutSession.id,
            status: 'pending',
            amount: packageData.price,
            credits: credits,
            created_at: new Date().toISOString()
        };

        console.log('Creating payment record in database...');

        const paymentResponse = await fetch(`${supabaseUrl}/rest/v1/payments`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(paymentData)
        });

        // Log warning if payment record creation fails, but don't block the payment flow
        if (!paymentResponse.ok) {
            const errorText = await paymentResponse.text();
            console.warn('Failed to create payment record, proceeding with Stripe:', errorText);
        } else {
            console.log('Payment record created successfully');
        }

        return new Response(JSON.stringify({
            data: {
                checkoutUrl: checkoutSession.url,
                sessionId: checkoutSession.id,
                packageName,
                credits,
                amount: packageData.price
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Process payment error:', error);

        const errorResponse = {
            error: {
                code: 'PAYMENT_PROCESSING_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});