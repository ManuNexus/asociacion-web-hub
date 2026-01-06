import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    
    console.log("Verified user ID:", user.id);

    // Get socio data for this user
    const { data: socio, error: socioError } = await supabaseAdmin
      .from("socios")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (socioError || !socio) {
      throw new Error("Socio not found for this user");
    }

    console.log(`Sending SEPA update to socio: ${socio.id}`);

    // Generate SEPA PDF using socio's address data
    const today = new Date();
    const fechaFormateada = today.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const referencia = socio.id.substring(0, 8).toUpperCase();
    
    const sepaPdfBase64 = generateSepaPDF({
      referencia,
      nombre: socio.nombre,
      apellidos: socio.apellidos,
      direccion: socio.direccion || 'No indicada',
      codigoPostal: socio.codigo_postal || '',
      ciudad: socio.ciudad || '',
      provincia: socio.provincia || '',
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
      subject: "Nuevo documento SEPA - Cambio de cuenta bancaria",
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
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            .alert { background: #d4edda; border: 1px solid #28a745; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .alert-title { color: #155724; font-weight: bold; margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">Cambio de Cuenta Bancaria</h1>
            </div>
            <div class="content">
              <p>Hola <strong>${socio.nombre}</strong>,</p>
              <p>Hemos registrado tu solicitud de cambio de cuenta bancaria para la domiciliación de cuotas.</p>
              
              <div class="alert">
                <div class="alert-title">📋 Nuevo documento SEPA requerido</div>
                <p>Al cambiar tu cuenta bancaria, es necesario que firmes un nuevo documento de autorización de domiciliación SEPA.</p>
                <p>Adjunto a este correo encontrarás el documento prerrellenado con tus nuevos datos bancarios.</p>
                <p><strong>Por favor:</strong></p>
                <ol>
                  <li>Imprime el documento adjunto</li>
                  <li>Fírmalo en el espacio indicado (también puedes usar firma digital)</li>
                  <li>Envíalo escaneado a <strong>presidencia@ahoraorg.es</strong></li>
                </ol>
              </div>
              
              <p><strong>Importante:</strong> Hasta que no recibamos el documento firmado, los cobros seguirán realizándose en la cuenta bancaria anterior.</p>
              
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

    // Mask IBAN for admin notification (show only last 4 digits)
    const maskedIban = socio.iban 
      ? "•••• •••• •••• •••• " + socio.iban.slice(-4)
      : "No configurado";

    // Send notification to presidencia about the IBAN change
    await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting delay
    
    const adminNotification = await resend.emails.send({
      from: "AHORA <socios@ahoraorg.es>",
      to: ["presidencia@ahoraorg.es"],
      subject: `Cambio de cuenta bancaria - ${socio.nombre} ${socio.apellidos}`,
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
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            .info-box { background: #fff; border: 1px solid #ddd; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .info-box p { margin: 8px 0; }
            .label { color: #666; font-size: 12px; text-transform: uppercase; }
            .value { font-weight: bold; color: #1e3a5f; }
            .alert { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">⚠️ Cambio de Domiciliación</h1>
            </div>
            <div class="content">
              <p>Un socio ha modificado sus datos bancarios y necesita actualizar la domiciliación:</p>
              
              <div class="info-box">
                <p><span class="label">Socio:</span><br><span class="value">${socio.nombre} ${socio.apellidos}</span></p>
                <p><span class="label">Nº Socio:</span><br><span class="value">${socio.numero_socio || 'Sin asignar'}</span></p>
                <p><span class="label">Email:</span><br><span class="value">${socio.email}</span></p>
                <p><span class="label">Nuevo IBAN:</span><br><span class="value" style="font-family: monospace;">${maskedIban}</span></p>
                <p><span class="label">Titular cuenta:</span><br><span class="value">${socio.titular_cuenta || socio.nombre + ' ' + socio.apellidos}</span></p>
              </div>
              
              <div class="alert">
                <strong>Acción requerida:</strong>
                <p>Se ha enviado al socio un nuevo documento SEPA para firmar. Una vez lo recibas firmado, deberás actualizar la domiciliación bancaria.</p>
              </div>
              
              <p>Fecha de la modificación: ${fechaFormateada}</p>
            </div>
            <div class="footer">
              <p>AHORA - Sistema de gestión de socios</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Admin notification sent:", adminNotification);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Documento SEPA enviado correctamente" 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-sepa-update function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
