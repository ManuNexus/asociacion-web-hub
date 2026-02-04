import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CertificadoResultadosRequest {
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

    // Check user roles
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const userRoles = roleData?.map(r => r.role) || [];
    const isAdminOrJunta = userRoles.includes("admin") || userRoles.includes("junta");
    const isSocio = userRoles.includes("socio");

    if (!isAdminOrJunta && !isSocio) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { votacion_id }: CertificadoResultadosRequest = await req.json();

    if (!votacion_id) {
      return new Response(JSON.stringify({ error: "votacion_id es requerido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Generating results certificate for votacion ${votacion_id}`);

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

    // Check if votacion is finished (only allow downloading results after it ends)
    const fechaFin = new Date(votacion.fecha_fin);
    if (fechaFin > new Date() && !isAdminOrJunta) {
      return new Response(JSON.stringify({ error: "Los resultados solo están disponibles cuando la votación ha finalizado" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get all options for this votacion
    const { data: opciones, error: opcionesError } = await supabase
      .from("opciones_votacion")
      .select("*")
      .eq("votacion_id", votacion_id);

    if (opcionesError) {
      console.error("Error fetching opciones:", opcionesError);
      return new Response(JSON.stringify({ error: "Error al obtener opciones" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get all votes for this votacion using admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: votos, error: votosError } = await supabaseAdmin
      .from("votos")
      .select("opcion_id")
      .eq("votacion_id", votacion_id);

    if (votosError) {
      console.error("Error fetching votos:", votosError);
      return new Response(JSON.stringify({ error: "Error al obtener votos" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Count votes per option
    const votosCounts: Record<string, number> = {};
    votos?.forEach((v: { opcion_id: string }) => {
      votosCounts[v.opcion_id] = (votosCounts[v.opcion_id] || 0) + 1;
    });

    const totalVotos = votos?.length || 0;

    // Get total eligible voters (socios)
    let totalEligibleVoters = 0;
    if (votacion.solo_junta) {
      // Count only junta members (not admin-only users)
      const { count } = await supabaseAdmin
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("role", "junta");
      totalEligibleVoters = count || 0;
    } else {
      // Count all active socios
      const { count } = await supabaseAdmin
        .from("socios")
        .select("*", { count: "exact", head: true })
        .eq("activo", true);
      totalEligibleVoters = count || 0;
    }

    const participationRate = totalEligibleVoters > 0 
      ? ((totalVotos / totalEligibleVoters) * 100).toFixed(1) 
      : "0";

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

    const fechaEmision = new Date().toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });

    // Generate unique certificate ID
    const certificadoId = `RES-${votacion_id.substring(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

    // Sort options by votes (descending)
    const sortedOpciones = [...(opciones || [])].sort((a, b) => {
      return (votosCounts[b.id] || 0) - (votosCounts[a.id] || 0);
    });

    // Determine the winning option(s)
    const maxVotes = Math.max(...Object.values(votosCounts), 0);
    const winningOptions = sortedOpciones.filter(o => (votosCounts[o.id] || 0) === maxVotes && maxVotes > 0);

    // Build results HTML rows
    const resultsRows = sortedOpciones.map(opcion => {
      const count = votosCounts[opcion.id] || 0;
      const percentage = totalVotos > 0 ? ((count / totalVotos) * 100).toFixed(1) : "0";
      const isWinner = count === maxVotes && maxVotes > 0;
      const barWidth = totalVotos > 0 ? (count / totalVotos) * 100 : 0;
      
      return `
        <div class="result-row ${isWinner ? 'winner' : ''}">
          <div class="result-header">
            <span class="option-text">${opcion.texto}${isWinner ? ' <span class="winner-badge">✓ MAYORÍA</span>' : ''}</span>
            <span class="vote-count">${count} voto${count !== 1 ? 's' : ''} (${percentage}%)</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${barWidth}%"></div>
          </div>
        </div>
      `;
    }).join("");

    // Create HTML certificate
    const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Certificado de Resultados - ${votacion.titulo} - AHORA</title>
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
      font-size: 24px;
      color: #1e3a8a;
      margin: 30px 0 10px;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    .certificate-id {
      font-size: 12px;
      color: #888;
      font-family: monospace;
    }
    .votacion-title {
      font-size: 20px;
      color: #333;
      margin: 20px 0;
      font-style: italic;
    }
    .content {
      line-height: 1.8;
      font-size: 15px;
      color: #333;
      margin: 30px 0;
    }
    .stats-section {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin: 30px 0;
    }
    .stat-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
    }
    .stat-value {
      font-size: 28px;
      font-weight: bold;
      color: #1e3a8a;
    }
    .stat-label {
      font-size: 12px;
      color: #666;
      margin-top: 5px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .results-section {
      background: #f8fafc;
      border-left: 4px solid #fbbf24;
      padding: 25px;
      margin: 30px 0;
    }
    .results-title {
      font-size: 16px;
      font-weight: bold;
      color: #1e3a8a;
      margin-bottom: 20px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .result-row {
      margin-bottom: 15px;
      padding: 10px;
      background: white;
      border-radius: 6px;
    }
    .result-row.winner {
      border: 2px solid #22c55e;
      background: #f0fdf4;
    }
    .result-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .option-text {
      font-weight: 600;
      color: #333;
    }
    .winner-badge {
      background: #22c55e;
      color: white;
      font-size: 10px;
      padding: 2px 8px;
      border-radius: 10px;
      margin-left: 10px;
    }
    .vote-count {
      font-size: 14px;
      color: #666;
    }
    .progress-bar {
      height: 8px;
      background: #e2e8f0;
      border-radius: 4px;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #1e3a8a, #3b82f6);
      border-radius: 4px;
      transition: width 0.3s ease;
    }
    .result-row.winner .progress-fill {
      background: linear-gradient(90deg, #16a34a, #22c55e);
    }
    .dates-section {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin: 30px 0;
      padding: 20px;
      background: #fefce8;
      border-radius: 8px;
    }
    .date-item {
      text-align: center;
    }
    .date-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .date-value {
      font-size: 14px;
      font-weight: bold;
      color: #1e3a8a;
      margin-top: 5px;
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
      font-size: 11px;
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
      line-height: 1.6;
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
      <div class="title">Certificado de Resultados</div>
      <div class="certificate-id">${certificadoId}</div>
    </div>

    <div class="votacion-title">"${votacion.titulo}"</div>

    ${votacion.descripcion ? `<div class="content"><p>${votacion.descripcion}</p></div>` : ''}

    <div class="stats-section">
      <div class="stat-box">
        <div class="stat-value">${totalVotos}</div>
        <div class="stat-label">Votos emitidos</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">${totalEligibleVoters}</div>
        <div class="stat-label">${votacion.solo_junta ? 'Miembros Junta' : 'Socios activos'}</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">${participationRate}%</div>
        <div class="stat-label">Participación</div>
      </div>
    </div>

    <div class="dates-section">
      <div class="date-item">
        <div class="date-label">Inicio de votación</div>
        <div class="date-value">${formatDate(votacion.fecha_inicio)}</div>
      </div>
      <div class="date-item">
        <div class="date-label">Fin de votación</div>
        <div class="date-value">${formatDate(votacion.fecha_fin)}</div>
      </div>
    </div>

    <div class="results-section">
      <div class="results-title">Resultados de la Votación</div>
      ${resultsRows}
    </div>

    <div class="footer">
      <div class="stamp">AHORA<br/>RESULTADOS<br/>OFICIALES</div>
      <p class="emission">Certificado emitido el ${fechaEmision}</p>
    </div>

    <p class="legal">
      Este documento certifica los resultados oficiales de la votación celebrada por la Asociación AHORA. 
      Los resultados reflejan el recuento final de votos emitidos durante el período de votación establecido.
      ${votacion.solo_junta ? 'Esta votación fue exclusiva para miembros de la Junta Directiva.' : ''}
    </p>
  </div>
</body>
</html>
    `;

    console.log("Results certificate generated successfully");

    return new Response(JSON.stringify({ 
      html: htmlContent,
      certificado_id: certificadoId,
      votacion_titulo: votacion.titulo,
      total_votos: totalVotos,
      total_eligible: totalEligibleVoters,
      participation_rate: participationRate
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error generating results certificate:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
