import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ResendSepaRequest {
  socio_id: string;
}

// Generate SEPA PDF as base64
function generateSepaPDF(data: {
  referencia: string;
  nombre: string;
  apellidos: string;
  direccion: string;
  codigoPostal: string;
  ciudad: string;
  provincia: string;
  iban: string;
  titularCuenta: string;
  tipoPago: string;
  fecha: string;
}): string {
  const pageWidth = 595;
  const pageHeight = 842;
  const margin = 50;
  const contentWidth = pageWidth - (margin * 2);
  
  const escapeText = (text: string) => {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')
      .replace(/ñ/g, 'n')
      .replace(/Ñ/g, 'N')
      .replace(/á/g, 'a')
      .replace(/é/g, 'e')
      .replace(/í/g, 'i')
      .replace(/ó/g, 'o')
      .replace(/ú/g, 'u')
      .replace(/Á/g, 'A')
      .replace(/É/g, 'E')
      .replace(/Í/g, 'I')
      .replace(/Ó/g, 'O')
      .replace(/Ú/g, 'U')
      .replace(/ü/g, 'u')
      .replace(/Ü/g, 'U');
  };

  const formatIBAN = (iban: string) => {
    const clean = iban.replace(/\s/g, '');
    return clean.match(/.{1,4}/g)?.join(' ') || clean;
  };

  let y = pageHeight - margin - 30;
  const lineHeight = 18;
  const sectionGap = 25;
  
  let contentStream = '';
  
  contentStream += `BT /F1 16 Tf ${margin} ${y} Td (${escapeText('ORDEN DE DOMICILIACION DE ADEUDO DIRECTO SEPA')}) Tj ET\n`;
  y -= lineHeight * 2;
  
  contentStream += `BT /F1 10 Tf ${margin} ${y} Td (${escapeText('A rellenar por el ACREEDOR')}) Tj ET\n`;
  y -= lineHeight + 5;
  
  const box1Height = 140;
  contentStream += `q 0.8 0.8 0.8 RG 1 w ${margin} ${y - box1Height} ${contentWidth} ${box1Height} re S Q\n`;
  y -= lineHeight + 5;
  
  contentStream += `BT /F2 10 Tf ${margin + 10} ${y} Td (${escapeText('Referencia de la orden de domiciliacion: ' + data.referencia)}) Tj ET\n`;
  y -= lineHeight;
  contentStream += `BT /F2 10 Tf ${margin + 10} ${y} Td (${escapeText('Identificador del acreedor: G24999484')}) Tj ET\n`;
  y -= lineHeight;
  contentStream += `BT /F2 10 Tf ${margin + 10} ${y} Td (${escapeText('Nombre del acreedor: ASOCIACION AHORA')}) Tj ET\n`;
  y -= lineHeight;
  contentStream += `BT /F2 10 Tf ${margin + 10} ${y} Td (${escapeText('Direccion: C/ Aragon 458')}) Tj ET\n`;
  y -= lineHeight;
  contentStream += `BT /F2 10 Tf ${margin + 10} ${y} Td (${escapeText('Codigo postal - Poblacion (Provincia): 08013 - Barcelona (Barcelona)')}) Tj ET\n`;
  y -= lineHeight;
  contentStream += `BT /F2 10 Tf ${margin + 10} ${y} Td (${escapeText('Pais: ESPANA (ES)')}) Tj ET\n`;
  y -= sectionGap + 20;
  
  const legalBoxHeight = 80;
  contentStream += `q 0.8 0.8 0.8 RG 1 w ${margin} ${y - legalBoxHeight} ${contentWidth} ${legalBoxHeight} re S Q\n`;
  y -= lineHeight;
  
  const legalText1 = `Mediante la firma de esta orden de domiciliacion, el deudor ${data.apellidos} ${data.nombre} autoriza a`;
  const legalText2 = `al acreedor ASOCIACION AHORA a enviar instrucciones a la entidad del deudor para adeudar su cuenta y`;
  const legalText3 = `a la entidad para efectuar los adeudos en su cuenta siguiendo las instrucciones del acreedor.`;
  const legalText4 = `Como parte de sus derechos, el deudor esta legitimado al reembolso por su entidad en los terminos`;
  const legalText5 = `y condiciones del contrato subscrito con la misma.`;
  
  contentStream += `BT /F1 8 Tf ${margin + 10} ${y} Td (${escapeText(legalText1)}) Tj ET\n`;
  y -= 12;
  contentStream += `BT /F1 8 Tf ${margin + 10} ${y} Td (${escapeText(legalText2)}) Tj ET\n`;
  y -= 12;
  contentStream += `BT /F1 8 Tf ${margin + 10} ${y} Td (${escapeText(legalText3)}) Tj ET\n`;
  y -= 12;
  contentStream += `BT /F1 8 Tf ${margin + 10} ${y} Td (${escapeText(legalText4)}) Tj ET\n`;
  y -= 12;
  contentStream += `BT /F1 8 Tf ${margin + 10} ${y} Td (${escapeText(legalText5)}) Tj ET\n`;
  y -= sectionGap + 20;
  
  contentStream += `BT /F2 10 Tf ${margin} ${y} Td (${escapeText('Nombre del deudor/es')}) Tj ET\n`;
  y -= lineHeight;
  
  const box2Height = 160;
  contentStream += `q 0.8 0.8 0.8 RG 1 w ${margin} ${y - box2Height} ${contentWidth} ${box2Height} re S Q\n`;
  y -= lineHeight;
  
  const titularDisplay = data.titularCuenta || `${data.apellidos} ${data.nombre}`;
  contentStream += `BT /F2 10 Tf ${margin + 10} ${y} Td (${escapeText('(titular/es de la cuenta de cargo): ' + titularDisplay)}) Tj ET\n`;
  y -= lineHeight;
  contentStream += `BT /F2 10 Tf ${margin + 10} ${y} Td (${escapeText('Direccion del deudor: ' + data.direccion)}) Tj ET\n`;
  y -= lineHeight;
  const ubicacion = `${data.codigoPostal} - ${data.ciudad} (${data.provincia})`;
  contentStream += `BT /F2 10 Tf ${margin + 10} ${y} Td (${escapeText('Codigo postal - Poblacion (Provincia): ' + ubicacion)}) Tj ET\n`;
  y -= lineHeight;
  contentStream += `BT /F2 10 Tf ${margin + 10} ${y} Td (${escapeText('Numero de cuenta - IBAN: ' + formatIBAN(data.iban))}) Tj ET\n`;
  y -= lineHeight * 2;
  
  const isRecurrente = data.tipoPago === 'mensual' || data.tipoPago === 'anual';
  const recurrenteCheck = isRecurrente ? 'X' : ' ';
  const unicoCheck = !isRecurrente ? 'X' : ' ';
  
  contentStream += `BT /F2 10 Tf ${margin + 10} ${y} Td (${escapeText('Tipo de pago:')}) Tj ET\n`;
  contentStream += `q 0.5 0.5 0.5 RG 1 w ${margin + 120} ${y - 3} 12 12 re S Q\n`;
  contentStream += `BT /F1 10 Tf ${margin + 123} ${y} Td (${recurrenteCheck}) Tj ET\n`;
  contentStream += `BT /F1 10 Tf ${margin + 140} ${y} Td (${escapeText('Pago recurrente')}) Tj ET\n`;
  contentStream += `q 0.5 0.5 0.5 RG 1 w ${margin + 280} ${y - 3} 12 12 re S Q\n`;
  contentStream += `BT /F1 10 Tf ${margin + 283} ${y} Td (${unicoCheck}) Tj ET\n`;
  contentStream += `BT /F1 10 Tf ${margin + 300} ${y} Td (${escapeText('Pago unico')}) Tj ET\n`;
  y -= lineHeight * 2;
  
  contentStream += `BT /F2 10 Tf ${margin + 10} ${y} Td (${escapeText('Fecha-Localidad: ' + data.fecha + ' - ' + data.ciudad)}) Tj ET\n`;
  y -= lineHeight * 2;
  contentStream += `BT /F2 10 Tf ${margin + 10} ${y} Td (${escapeText('Firma del deudor:')}) Tj ET\n`;
  
  y -= 30;
  contentStream += `q 0.5 0.5 0.5 RG 1 w ${margin + 10} ${y} m ${margin + 200} ${y} l S Q\n`;
  
  y -= sectionGap * 2;
  
  contentStream += `BT /F1 9 Tf ${margin} ${y} Td (${escapeText('UNA VEZ FIRMADA ESTA ORDEN DE DOMICILIACION DEBERA SER ENVIADA AL ACREEDOR PARA SU CUSTODIA.')}) Tj ET\n`;
  y -= lineHeight;
  contentStream += `BT /F1 9 Tf ${margin} ${y} Td (${escapeText('Puede enviarla escaneada a: presidencia@ahoraorg.es')}) Tj ET\n`;

  const objects: string[] = [];
  let objectCount = 0;
  
  const addObject = (content: string): number => {
    objectCount++;
    objects.push(`${objectCount} 0 obj\n${content}\nendobj`);
    return objectCount;
  };
  
  addObject('<< /Type /Catalog /Pages 2 0 R >>');
  addObject('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  addObject(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>`);
  
  const streamBytes = new TextEncoder().encode(contentStream);
  addObject(`<< /Length ${streamBytes.length} >>\nstream\n${contentStream}endstream`);
  
  addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique >>');
  
  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];
  
  for (const obj of objects) {
    offsets.push(pdf.length);
    pdf += obj + '\n';
  }
  
  const xrefOffset = pdf.length;
  pdf += 'xref\n';
  pdf += `0 ${objectCount + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (const offset of offsets) {
    pdf += offset.toString().padStart(10, '0') + ' 00000 n \n';
  }
  
  pdf += 'trailer\n';
  pdf += `<< /Size ${objectCount + 1} /Root 1 0 R >>\n`;
  pdf += 'startxref\n';
  pdf += `${xrefOffset}\n`;
  pdf += '%%EOF';
  
  const bytes = new TextEncoder().encode(pdf);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify user
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      console.error("Auth error:", userError?.message);
      throw new Error("Invalid or expired token");
    }
    
    console.log("Verified admin user ID:", user.id);

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError || !roleData) {
      throw new Error("Only admins can resend SEPA documents");
    }

    const { socio_id }: ResendSepaRequest = await req.json();

    if (!socio_id) {
      throw new Error("socio_id is required");
    }

    console.log(`Resending SEPA to socio: ${socio_id}`);

    // Fetch socio data
    const { data: socio, error: socioError } = await supabaseAdmin
      .from("socios")
      .select("*")
      .eq("id", socio_id)
      .single();

    if (socioError || !socio) {
      throw new Error("Socio not found");
    }

    // Try to find the original solicitud for address info
    const { data: solicitud } = await supabaseAdmin
      .from("solicitudes_socio")
      .select("direccion, codigo_postal, ciudad, provincia")
      .eq("email", socio.email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Generate SEPA PDF
    const today = new Date();
    const fechaFormateada = today.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const referencia = socio_id.substring(0, 8).toUpperCase();
    
    const sepaPdfBase64 = generateSepaPDF({
      referencia,
      nombre: socio.nombre,
      apellidos: socio.apellidos,
      direccion: solicitud?.direccion || 'No indicada',
      codigoPostal: solicitud?.codigo_postal || '',
      ciudad: solicitud?.ciudad || '',
      provincia: solicitud?.provincia || '',
      iban: socio.iban || '',
      titularCuenta: socio.titular_cuenta || `${socio.apellidos} ${socio.nombre}`,
      tipoPago: socio.tipo_pago || 'mensual',
      fecha: fechaFormateada,
    });

    console.log("SEPA PDF generated successfully");

    // Send email with SEPA PDF
    const emailResponse = await resend.emails.send({
      from: "AHORA <socios@ahoraorg.es>",
      to: [socio.email],
      subject: "Recordatorio: Documento SEPA pendiente de firma",
      attachments: [
        {
          filename: `SEPA_AHORA_${socio.apellidos.replace(/\s/g, '_')}_${socio.nombre.replace(/\s/g, '_')}.pdf`,
          content: sepaPdfBase64,
        },
      ],
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #f1c40f; color: #1e3a5f; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            .alert { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .alert-title { color: #856404; font-weight: bold; margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">Recordatorio de AHORA</h1>
            </div>
            <div class="content">
              <p>Hola <strong>${socio.nombre}</strong>,</p>
              <p>Te enviamos este recordatorio porque aún no hemos recibido tu documento SEPA firmado.</p>
              
              <div class="alert">
                <div class="alert-title">📋 Documento pendiente</div>
                <p>Adjunto a este correo encontrarás el <strong>documento de orden de domiciliación SEPA</strong> prerrellenado con tus datos.</p>
                <p>Para completar tu alta como socio/a, necesitamos que:</p>
                <ol>
                  <li>Imprimas el documento adjunto</li>
                  <li>Lo firmes en el espacio indicado</li>
                  <li>Nos lo envíes escaneado a <strong>presidencia@ahoraorg.es</strong></li>
                </ol>
                <p><em>Este documento autoriza el cobro de la cuota de socio mediante domiciliación bancaria.</em></p>
              </div>
              
              <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
              <p>¡Gracias!</p>
              <p><em>El equipo de AHORA</em></p>
            </div>
            <div class="footer">
              <p>AHORA - Actuar en el presente para construir el futuro</p>
              <p>NIF: G24999484</p>
              <p>Este correo fue enviado a ${socio.email}</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully with SEPA attachment:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Documento SEPA reenviado correctamente" 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in resend-sepa function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
