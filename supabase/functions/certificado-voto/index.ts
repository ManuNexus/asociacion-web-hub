import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CertificadoRequest {
  votacion_id: string;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth token from header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header");
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create Supabase client with user token
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get user from token
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("User error:", userError);
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { votacion_id }: CertificadoRequest = await req.json();

    if (!votacion_id) {
      return new Response(JSON.stringify({ error: "votacion_id es requerido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Generating certificate for user ${user.id}, votacion ${votacion_id}`);

    // Get the vote
    const { data: voto, error: votoError } = await supabase
      .from("votos")
      .select("*, opciones_votacion(texto)")
      .eq("user_id", user.id)
      .eq("votacion_id", votacion_id)
      .maybeSingle();

    if (votoError || !voto) {
      console.error("Vote not found:", votoError);
      return new Response(JSON.stringify({ error: "Voto no encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get the votacion details
    const { data: votacion, error: votacionError } = await supabase
      .from("votaciones")
      .select("*")
      .eq("id", votacion_id)
      .single();

    if (votacionError || !votacion) {
      console.error("Votacion not found:", votacionError);
      return new Response(JSON.stringify({ error: "Votación no encontrada" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get socio details
    const { data: socio, error: socioError } = await supabase
      .from("socios")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (socioError || !socio) {
      console.error("Socio not found:", socioError);
      return new Response(JSON.stringify({ error: "Socio no encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Format dates
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    };

    const opcionTexto = (voto as any).opciones_votacion?.texto || "N/A";
    const fechaVoto = formatDate(voto.created_at);
    const fechaEmision = new Date().toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });

    // Generate unique certificate ID
    const certificadoId = `CERT-${votacion_id.substring(0, 8).toUpperCase()}-${voto.id.substring(0, 8).toUpperCase()}`;

    // Create HTML certificate
    const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Certificado de Voto - AHORA</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Georgia', serif;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      min-height: 100vh;
      padding: 40px;
    }
    .certificate {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border: 3px solid #1e3a8a;
      border-radius: 8px;
      padding: 50px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.1);
      position: relative;
    }
    .certificate::before {
      content: '';
      position: absolute;
      top: 10px;
      left: 10px;
      right: 10px;
      bottom: 10px;
      border: 1px solid #ddd;
      pointer-events: none;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
    }
    .logo {
      font-size: 32px;
      font-weight: bold;
      color: #1e3a8a;
      margin-bottom: 10px;
    }
    .logo-subtitle {
      font-size: 12px;
      color: #666;
      letter-spacing: 2px;
      text-transform: uppercase;
    }
    .title {
      font-size: 28px;
      color: #1e3a8a;
      margin: 30px 0 10px;
      text-transform: uppercase;
      letter-spacing: 3px;
    }
    .certificate-id {
      font-size: 12px;
      color: #888;
      font-family: monospace;
    }
    .content {
      line-height: 2;
      font-size: 16px;
      color: #333;
      margin: 40px 0;
    }
    .highlight {
      background: linear-gradient(180deg, transparent 60%, #fde047 60%);
      padding: 0 4px;
      font-weight: bold;
    }
    .data-section {
      background: #f8fafc;
      border-left: 4px solid #fbbf24;
      padding: 20px 25px;
      margin: 30px 0;
    }
    .data-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px dashed #ddd;
    }
    .data-row:last-child {
      border-bottom: none;
    }
    .data-label {
      color: #666;
      font-size: 14px;
    }
    .data-value {
      font-weight: bold;
      color: #1e3a8a;
    }
    .footer {
      text-align: center;
      margin-top: 50px;
      padding-top: 30px;
      border-top: 2px solid #1e3a8a;
    }
    .stamp {
      display: inline-block;
      border: 2px solid #1e3a8a;
      border-radius: 50%;
      width: 100px;
      height: 100px;
      line-height: 100px;
      text-align: center;
      font-size: 12px;
      color: #1e3a8a;
      margin-bottom: 20px;
      transform: rotate(-15deg);
    }
    .emission {
      font-size: 12px;
      color: #888;
    }
    .legal {
      font-size: 10px;
      color: #999;
      margin-top: 30px;
      text-align: center;
      font-style: italic;
    }
    @media print {
      body { background: white; padding: 0; }
      .certificate { box-shadow: none; border: 2px solid #1e3a8a; }
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="header">
      <div class="logo">AHORA</div>
      <div class="logo-subtitle">Asociación por los Valores Constitucionales</div>
      <div class="title">Certificado de Voto</div>
      <div class="certificate-id">${certificadoId}</div>
    </div>

    <div class="content">
      <p>Por el presente documento se certifica que el/la socio/a <span class="highlight">${socio.nombre} ${socio.apellidos}</span>, 
      con número de socio <span class="highlight">${socio.numero_socio || 'N/A'}</span>, ha ejercido su derecho al voto en la votación celebrada por la asociación AHORA.</p>
    </div>

    <div class="data-section">
      <div class="data-row">
        <span class="data-label">Votación:</span>
        <span class="data-value">${votacion.titulo}</span>
      </div>
      <div class="data-row">
        <span class="data-label">Opción seleccionada:</span>
        <span class="data-value">${opcionTexto}</span>
      </div>
      <div class="data-row">
        <span class="data-label">Fecha y hora del voto:</span>
        <span class="data-value">${fechaVoto}</span>
      </div>
      <div class="data-row">
        <span class="data-label">Período de votación:</span>
        <span class="data-value">${new Date(votacion.fecha_inicio).toLocaleDateString("es-ES")} - ${new Date(votacion.fecha_fin).toLocaleDateString("es-ES")}</span>
      </div>
    </div>

    <div class="footer">
      <div class="stamp">AHORA<br/>VOTO<br/>VERIFICADO</div>
      <p class="emission">Certificado emitido el ${fechaEmision}</p>
    </div>

    <p class="legal">Este documento certifica la participación del socio en el proceso de votación. 
    El voto es secreto y este certificado solo acredita la participación, no revela la opción seleccionada a terceros sin consentimiento del titular.</p>
  </div>
</body>
</html>
    `;

    console.log("Certificate generated successfully");

    return new Response(JSON.stringify({ 
      html: htmlContent,
      certificado_id: certificadoId,
      socio_nombre: `${socio.nombre} ${socio.apellidos}`,
      votacion_titulo: votacion.titulo,
      fecha_voto: fechaVoto,
      opcion: opcionTexto
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error generating certificate:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
