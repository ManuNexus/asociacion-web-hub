import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify the user is admin
    const userClient = createClient(supabaseUrl, supabaseAnonKey);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await userClient.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user is admin
    const { data: adminRole } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!adminRole) {
      return new Response(JSON.stringify({ error: "Not authorized" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get all active socios
    const { data: socios, error: sociosError } = await supabaseAdmin
      .from("socios")
      .select("id, user_id, email, nombre, apellidos")
      .eq("activo", true);

    if (sociosError) {
      throw sociosError;
    }

    const results: { socio: string; oldEmail: string; newEmail: string; status: string }[] = [];

    // For each socio, check if auth email matches
    for (const socio of socios || []) {
      const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.admin.getUserById(socio.user_id);

      if (authError || !authUser) {
        results.push({
          socio: `${socio.nombre} ${socio.apellidos}`,
          oldEmail: "unknown",
          newEmail: socio.email,
          status: `Error: ${authError?.message || "User not found"}`,
        });
        continue;
      }

      if (authUser.email?.toLowerCase() !== socio.email.toLowerCase()) {
        // Update auth email
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(socio.user_id, {
          email: socio.email,
          email_confirm: true, // Auto-confirm since admin is doing this
        });

        if (updateError) {
          results.push({
            socio: `${socio.nombre} ${socio.apellidos}`,
            oldEmail: authUser.email || "unknown",
            newEmail: socio.email,
            status: `Error: ${updateError.message}`,
          });
        } else {
          results.push({
            socio: `${socio.nombre} ${socio.apellidos}`,
            oldEmail: authUser.email || "unknown",
            newEmail: socio.email,
            status: "Sincronizado",
          });
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: results.length === 0 
          ? "Todos los emails ya están sincronizados" 
          : `Se procesaron ${results.length} cambios`,
        results,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error syncing emails:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
