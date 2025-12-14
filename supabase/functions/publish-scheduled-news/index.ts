import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Get current time in Madrid timezone
function getMadridNow(): Date {
  const now = new Date();
  // Create a date string in Madrid timezone and parse it
  const madridString = now.toLocaleString("en-US", { timeZone: "Europe/Madrid" });
  return new Date(madridString);
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Checking for scheduled news to publish...");

    // Current time in UTC for comparison (database stores UTC)
    const now = new Date().toISOString();
    
    const { data: scheduledNews, error: fetchError } = await supabase
      .from("noticias")
      .select("id, titulo, fecha_publicacion_programada")
      .eq("publicada", false)
      .not("fecha_publicacion_programada", "is", null)
      .lte("fecha_publicacion_programada", now);

    if (fetchError) {
      console.error("Error fetching scheduled news:", fetchError);
      throw fetchError;
    }

    if (!scheduledNews || scheduledNews.length === 0) {
      console.log("No scheduled news to publish");
      return new Response(
        JSON.stringify({ message: "No scheduled news to publish", count: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${scheduledNews.length} scheduled news to publish`);

    // Update each news article
    const publishedIds: string[] = [];
    for (const news of scheduledNews) {
      const { error: updateError } = await supabase
        .from("noticias")
        .update({
          publicada: true,
          fecha_publicacion: news.fecha_publicacion_programada,
        })
        .eq("id", news.id);

      if (updateError) {
        console.error(`Error publishing news ${news.id}:`, updateError);
      } else {
        console.log(`Published news: ${news.titulo}`);
        publishedIds.push(news.id);
      }
    }

    return new Response(
      JSON.stringify({ 
        message: `Published ${publishedIds.length} scheduled news articles`,
        count: publishedIds.length,
        publishedIds 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in publish-scheduled-news:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
