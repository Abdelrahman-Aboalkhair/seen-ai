Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  // Get Supabase environment variables
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(
      JSON.stringify({
        error: 'Missing environment variables for Supabase connection',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    // 1. First find and delete the existing users if they exist
    const listUsersResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      }
    });
    
    if (!listUsersResponse.ok) {
      throw new Error(`Error listing users: ${listUsersResponse.statusText}`);
    }
    
    const userData = await listUsersResponse.json();
    
    // Find existing users by email
    const existingUser = userData.users?.find((user: any) => user.email === 'user@test.com');
    const existingAdmin = userData.users?.find((user: any) => user.email === 'admin@seenai.com');
    
    // Delete existing user if found
    if (existingUser) {
      const deleteUserResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users/${existingUser.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey
        }
      });
      
      if (!deleteUserResponse.ok) {
        throw new Error(`Error deleting existing user: ${deleteUserResponse.statusText}`);
      }
    }
    
    // Delete existing admin if found
    if (existingAdmin) {
      const deleteAdminResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users/${existingAdmin.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey
        }
      });
      
      if (!deleteAdminResponse.ok) {
        throw new Error(`Error deleting existing admin: ${deleteAdminResponse.statusText}`);
      }
    }

    // Create new regular user
    const createUserResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'user@test.com',
        password: 'Test123!',
        email_confirm: true,
        user_metadata: { full_name: 'Test User' }
      })
    });

    if (!createUserResponse.ok) {
      const errorText = await createUserResponse.text();
      throw new Error(`Error creating user: ${errorText}`);
    }

    const newUserData = await createUserResponse.json();
    const userId = newUserData.user.id;

    // Create or update profile for user
    const upsertProfileResponse = await fetch(`${supabaseUrl}/rest/v1/profiles`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({
        id: userId,
        email: 'user@test.com',
        full_name: 'Test User',
        credits: 500,
        total_searches: 0,
        total_analyses: 0,
        is_admin: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    });

    if (!upsertProfileResponse.ok) {
      const errorText = await upsertProfileResponse.text();
      throw new Error(`Error upserting user profile: ${errorText}`);
    }

    // Create new admin user
    const createAdminResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@seenai.com',
        password: 'Admin123!',
        email_confirm: true,
        user_metadata: { full_name: 'Admin User' }
      })
    });

    if (!createAdminResponse.ok) {
      const errorText = await createAdminResponse.text();
      throw new Error(`Error creating admin: ${errorText}`);
    }

    const newAdminData = await createAdminResponse.json();
    const adminId = newAdminData.user.id;

    // Create or update profile for admin
    const upsertAdminProfileResponse = await fetch(`${supabaseUrl}/rest/v1/profiles`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({
        id: adminId,
        email: 'admin@seenai.com',
        full_name: 'Admin User',
        credits: 1000,
        total_searches: 0,
        total_analyses: 0,
        is_admin: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    });

    if (!upsertAdminProfileResponse.ok) {
      const errorText = await upsertAdminProfileResponse.text();
      throw new Error(`Error upserting admin profile: ${errorText}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Test users created successfully',
        data: {
          regularUser: { id: userId, email: 'user@test.com' },
          adminUser: { id: adminId, email: 'admin@seenai.com' }
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});