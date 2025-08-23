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
        // الحصول على مفاتيح البيئة
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('إعدادات Supabase غير متوفرة');
        }

        // التحقق من المستخدم
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            throw new Error('رأس التفويض مفقود');
        }

        const token = authHeader.replace('Bearer ', '');
        const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'apikey': serviceRoleKey
            }
        });

        if (!userResponse.ok) {
            throw new Error('رمز التفويض غير صالح');
        }

        const userData = await userResponse.json();
        const userId = userData.id;

        // التحقق من وجود كود إحالة موجود
        const existingReferralResponse = await fetch(`${supabaseUrl}/rest/v1/referrals?referrer_id=eq.${userId}&select=referral_code`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        });

        if (!existingReferralResponse.ok) {
            throw new Error('فشل في التحقق من كود الإحالة الموجود');
        }

        const existingReferrals = await existingReferralResponse.json();
        
        // إذا كان لديه كود إحالة بالفعل، أرجعه
        if (existingReferrals && existingReferrals.length > 0) {
            return new Response(JSON.stringify({
                data: {
                    referralCode: existingReferrals[0].referral_code,
                    isNew: false
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // إنشاء كود إحالة جديد
        const generateReferralCode = () => {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            let result = 'SEEN';
            for (let i = 0; i < 6; i++) {
                result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return result;
        };

        let referralCode = generateReferralCode();
        let attempts = 0;
        const maxAttempts = 10;

        // التأكد من أن الكود فريد
        while (attempts < maxAttempts) {
            const checkCodeResponse = await fetch(`${supabaseUrl}/rest/v1/referrals?referral_code=eq.${referralCode}&select=id`, {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            });

            if (!checkCodeResponse.ok) {
                throw new Error('فشل في التحقق من فرادة كود الإحالة');
            }

            const existingCodes = await checkCodeResponse.json();
            if (!existingCodes || existingCodes.length === 0) {
                break; // الكود فريد
            }

            referralCode = generateReferralCode();
            attempts++;
        }

        if (attempts >= maxAttempts) {
            throw new Error('فشل في إنشاء كود إحالة فريد');
        }

        // إنشاء سجل الإحالة
        const createReferralResponse = await fetch(`${supabaseUrl}/rest/v1/referrals`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                referrer_id: userId,
                referral_code: referralCode,
                status: 'pending'
            })
        });

        if (!createReferralResponse.ok) {
            const errorText = await createReferralResponse.text();
            throw new Error(`فشل في إنشاء كود الإحالة: ${errorText}`);
        }

        return new Response(JSON.stringify({
            data: {
                referralCode: referralCode,
                isNew: true
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('خطأ في إنشاء كود الإحالة:', error);

        const errorResponse = {
            error: {
                code: 'REFERRAL_CODE_GENERATION_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});