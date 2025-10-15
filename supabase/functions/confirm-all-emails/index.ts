import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    console.log('Fetching all users...');
    
    // Get all users
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
      console.error('Error listing users:', listError);
      return new Response(
        JSON.stringify({ error: listError.message }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Found ${users.length} users`);

    let confirmedCount = 0;
    let alreadyConfirmedCount = 0;
    const errors = [];

    // Confirm email for each user
    for (const user of users) {
      if (user.email_confirmed_at) {
        alreadyConfirmedCount++;
        console.log(`User ${user.email} already confirmed`);
        continue;
      }

      console.log(`Confirming email for ${user.email}...`);
      
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        { email_confirm: true }
      );

      if (updateError) {
        console.error(`Error confirming ${user.email}:`, updateError);
        errors.push({ email: user.email, error: updateError.message });
      } else {
        confirmedCount++;
        console.log(`Confirmed ${user.email}`);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        total: users.length,
        alreadyConfirmed: alreadyConfirmedCount,
        newlyConfirmed: confirmedCount,
        errors: errors
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in confirm-all-emails function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
