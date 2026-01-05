import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InviteSocioRequest {
  email: string;
  nombre: string;
  apellidos: string;
  telefono?: string;
  tipo_cuota?: string;
  tipo_pago?: string;
  solicitud_id: string;
  dni: string;
  iban?: string;
  titular_cuenta?: string;
  dia_cobro?: number;
}

interface SolicitudData {
  direccion: string | null;
  codigo_postal: string | null;
  ciudad: string | null;
  provincia: string | null;
  tipo_pago: string;
  iban: string | null;
  titular_cuenta: string | null;
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
  // PDF structure constants
  const pageWidth = 595;
  const pageHeight = 842;
  const margin = 50;
  const contentWidth = pageWidth - (margin * 2);
  
  // Helper to escape PDF text
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

  // Format IBAN with spaces
  const formatIBAN = (iban: string) => {
    const clean = iban.replace(/\s/g, '');
    return clean.match(/.{1,4}/g)?.join(' ') || clean;
  };

  // Build content stream with drawing commands
  let y = pageHeight - margin - 30;
  const lineHeight = 18;
  const sectionGap = 25;
  
  let contentStream = '';
  
  // Title
  contentStream += `BT /F1 16 Tf ${margin} ${y} Td (${escapeText('ORDEN DE DOMICILIACION DE ADEUDO DIRECTO SEPA')}) Tj ET\n`;
  y -= lineHeight * 2;
  
  // Subtitle
  contentStream += `BT /F1 10 Tf ${margin} ${y} Td (${escapeText('A rellenar por el ACREEDOR')}) Tj ET\n`;
  y -= lineHeight + 5;
  
  // Box 1 - Acreedor section
  const box1Height = 140;
  contentStream += `q 0.8 0.8 0.8 RG 1 w ${margin} ${y - box1Height} ${contentWidth} ${box1Height} re S Q\n`;
  y -= lineHeight + 5;
  
  contentStream += `BT /F2 10 Tf ${margin + 10} ${y} Td (${escapeText('Referencia de la orden de domiciliacion: ' + data.referencia)}) Tj ET\n`;
  y -= lineHeight;
  contentStream += `BT /F2 10 Tf ${margin + 10} ${y} Td (${escapeText('Identificador del acreedor: G24999484')}) Tj ET\n`;
  y -= lineHeight;
  contentStream += `BT /F2 10 Tf ${margin + 10} ${y} Td (${escapeText('Nombre del acreedor: ASOCIACION AHORA')}) Tj ET\n`;
  y -= lineHeight;
  contentStream += `BT /F2 10 Tf ${margin + 10} ${y} Td (${escapeText('Direccion: Calle Ramon y Cajal 2, Bajo')}) Tj ET\n`;
  y -= lineHeight;
  contentStream += `BT /F2 10 Tf ${margin + 10} ${y} Td (${escapeText('Codigo postal - Poblacion (Provincia): 24002 - Leon (Leon)')}) Tj ET\n`;
  y -= lineHeight;
  contentStream += `BT /F2 10 Tf ${margin + 10} ${y} Td (${escapeText('Pais: ESPANA (ES)')}) Tj ET\n`;
  y -= sectionGap + 20;
  
  // Legal text box
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
  
  // Deudor section title
  contentStream += `BT /F2 10 Tf ${margin} ${y} Td (${escapeText('Nombre del deudor/es')}) Tj ET\n`;
  y -= lineHeight;
  
  // Box 2 - Deudor section
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
  
  // Tipo de pago
  const isRecurrente = data.tipoPago === 'mensual' || data.tipoPago === 'anual';
  const recurrenteCheck = isRecurrente ? 'X' : ' ';
  const unicoCheck = !isRecurrente ? 'X' : ' ';
  
  contentStream += `BT /F2 10 Tf ${margin + 10} ${y} Td (${escapeText('Tipo de pago:')}) Tj ET\n`;
  // Checkbox for recurrente
  contentStream += `q 0.5 0.5 0.5 RG 1 w ${margin + 120} ${y - 3} 12 12 re S Q\n`;
  contentStream += `BT /F1 10 Tf ${margin + 123} ${y} Td (${recurrenteCheck}) Tj ET\n`;
  contentStream += `BT /F1 10 Tf ${margin + 140} ${y} Td (${escapeText('Pago recurrente')}) Tj ET\n`;
  // Checkbox for unico
  contentStream += `q 0.5 0.5 0.5 RG 1 w ${margin + 280} ${y - 3} 12 12 re S Q\n`;
  contentStream += `BT /F1 10 Tf ${margin + 283} ${y} Td (${unicoCheck}) Tj ET\n`;
  contentStream += `BT /F1 10 Tf ${margin + 300} ${y} Td (${escapeText('Pago unico')}) Tj ET\n`;
  y -= lineHeight * 2;
  
  // Fecha y firma
  contentStream += `BT /F2 10 Tf ${margin + 10} ${y} Td (${escapeText('Fecha-Localidad: ' + data.fecha + ' - ' + data.ciudad)}) Tj ET\n`;
  y -= lineHeight * 2;
  contentStream += `BT /F2 10 Tf ${margin + 10} ${y} Td (${escapeText('Firma del deudor:')}) Tj ET\n`;
  
  // Signature line
  y -= 30;
  contentStream += `q 0.5 0.5 0.5 RG 1 w ${margin + 10} ${y} m ${margin + 200} ${y} l S Q\n`;
  
  y -= sectionGap * 2;
  
  // Footer
  contentStream += `BT /F1 9 Tf ${margin} ${y} Td (${escapeText('UNA VEZ FIRMADA ESTA ORDEN DE DOMICILIACION DEBERA SER ENVIADA AL ACREEDOR PARA SU CUSTODIA.')}) Tj ET\n`;
  y -= lineHeight;
  contentStream += `BT /F1 9 Tf ${margin} ${y} Td (${escapeText('Puede enviarla escaneada a: presidencia@ahoraorg.es')}) Tj ET\n`;

  // Build PDF document
  const objects: string[] = [];
  let objectCount = 0;
  
  const addObject = (content: string): number => {
    objectCount++;
    objects.push(`${objectCount} 0 obj\n${content}\nendobj`);
    return objectCount;
  };
  
  // Catalog
  addObject('<< /Type /Catalog /Pages 2 0 R >>');
  
  // Pages
  addObject('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  
  // Page
  addObject(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>`);
  
  // Content stream
  const streamBytes = new TextEncoder().encode(contentStream);
  addObject(`<< /Length ${streamBytes.length} >>\nstream\n${contentStream}endstream`);
  
  // Fonts
  addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique >>');
  
  // Build xref table
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
  
  // Convert to base64
  const bytes = new TextEncoder().encode(pdf);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    // Extract token from Bearer header
    const token = authHeader.replace("Bearer ", "");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Create admin client with service role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify JWT token using service role key for cryptographic verification
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      console.error("Auth error:", userError?.message);
      throw new Error("Invalid or expired token");
    }
    
    const adminUserId = user.id;
    console.log("Verified admin user ID:", adminUserId);

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", adminUserId)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError || !roleData) {
      throw new Error("Only admins can invite socios");
    }

    const { email, nombre, apellidos, telefono, tipo_cuota, tipo_pago, solicitud_id, dni, iban, titular_cuenta, dia_cobro }: InviteSocioRequest = await req.json();

    if (!dni) {
      throw new Error("DNI is required");
    }

    const billingDay = dia_cobro && dia_cobro >= 1 && dia_cobro <= 28 ? dia_cobro : 1;

    console.log(`Inviting socio: ${email} (${nombre} ${apellidos})`);

    // Fetch solicitud data for SEPA document
    const { data: solicitudData, error: solicitudFetchError } = await supabaseAdmin
      .from("solicitudes_socio")
      .select("direccion, codigo_postal, ciudad, provincia, tipo_pago, iban, titular_cuenta")
      .eq("id", solicitud_id)
      .single();

    if (solicitudFetchError) {
      console.error("Error fetching solicitud:", solicitudFetchError);
    }

    const solicitud: SolicitudData = solicitudData || {
      direccion: null,
      codigo_postal: null,
      ciudad: null,
      provincia: null,
      tipo_pago: tipo_pago || 'mensual',
      iban: iban || null,
      titular_cuenta: titular_cuenta || null,
    };

    // Use DNI as the default password (cleaned, uppercase)
    const defaultPassword = dni.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

    let socioUserId: string;

    // Try to create user account with admin API using DNI as password
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: defaultPassword,
      email_confirm: true,
      user_metadata: {
        nombre,
        apellidos,
      },
    });

    if (createError) {
      // If user already exists, get their ID and update their password
      if (createError.message.includes("already been registered")) {
        console.log("User already exists, fetching existing user...");
        
        const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        
        if (listError) {
          throw new Error(`Error listing users: ${listError.message}`);
        }
        
        const existingUser = existingUsers.users.find(u => u.email === email);
        
        if (!existingUser) {
          throw new Error("User exists but could not be found");
        }
        
        socioUserId = existingUser.id;
        
        // Update their password to DNI
        await supabaseAdmin.auth.admin.updateUserById(socioUserId, {
          password: defaultPassword,
          email_confirm: true,
        });
        
        console.log(`Existing user updated with ID: ${socioUserId}`);
      } else {
        console.error("Error creating user:", createError);
        throw new Error(`Error creating user: ${createError.message}`);
      }
    } else {
      socioUserId = newUser.user.id;
      console.log(`User created with ID: ${socioUserId}`);
    }

    // Add socio role (upsert to handle existing)
    const { error: roleInsertError } = await supabaseAdmin
      .from("user_roles")
      .upsert({
        user_id: socioUserId,
        role: "socio",
      }, { onConflict: 'user_id,role' });

    if (roleInsertError) {
      console.error("Error adding socio role:", roleInsertError);
    }

    // Create or update socio record
    const { error: socioError } = await supabaseAdmin
      .from("socios")
      .upsert({
        user_id: socioUserId,
        nombre,
        apellidos,
        email,
        telefono: telefono || null,
        tipo_cuota: tipo_cuota || "normal",
        tipo_pago: tipo_pago || "mensual",
        iban: iban || null,
        titular_cuenta: titular_cuenta || null,
        dia_cobro: billingDay,
        activo: true,
      }, { onConflict: 'user_id' });

    if (socioError) {
      console.error("Error creating socio record:", socioError);
    }

    // Update solicitud status to accepted
    const { error: solicitudError } = await supabaseAdmin
      .from("solicitudes_socio")
      .update({ estado: "aceptado" })
      .eq("id", solicitud_id);

    if (solicitudError) {
      console.error("Error updating solicitud:", solicitudError);
    }

    // Generate SEPA PDF
    const today = new Date();
    const fechaFormateada = today.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    
    // Generate reference number from solicitud_id
    const referencia = solicitud_id.substring(0, 8).toUpperCase();
    
    const sepaPdfBase64 = generateSepaPDF({
      referencia,
      nombre,
      apellidos,
      direccion: solicitud.direccion || 'No indicada',
      codigoPostal: solicitud.codigo_postal || '',
      ciudad: solicitud.ciudad || '',
      provincia: solicitud.provincia || '',
      iban: solicitud.iban || iban || '',
      titularCuenta: solicitud.titular_cuenta || titular_cuenta || `${apellidos} ${nombre}`,
      tipoPago: solicitud.tipo_pago || tipo_pago || 'mensual',
      fecha: fechaFormateada,
    });

    console.log("SEPA PDF generated successfully");

    // Send welcome email with SEPA PDF attachment
    const emailResponse = await resend.emails.send({
      from: "AHORA <socios@ahoraorg.es>",
      to: [email],
      subject: "¡Bienvenido a AHORA! - Documento SEPA para completar tu alta",
      attachments: [
        {
          filename: `SEPA_AHORA_${apellidos.replace(/\s/g, '_')}_${nombre.replace(/\s/g, '_')}.pdf`,
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
            .credentials { background: #fff; border: 1px solid #ddd; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .credentials p { margin: 5px 0; }
            .credentials strong { color: #1e3a5f; }
            .alert { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .alert-title { color: #856404; font-weight: bold; margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">¡Bienvenido/a a AHORA!</h1>
            </div>
            <div class="content">
              <p>Hola <strong>${nombre}</strong>,</p>
              <p>¡Enhorabuena! Tu solicitud de membresía ha sido <strong>aprobada</strong> por la Junta Directiva.</p>
              
              <div class="alert">
                <div class="alert-title">📋 Paso importante para completar tu alta</div>
                <p>Adjunto a este correo encontrarás el <strong>documento de orden de domiciliación SEPA</strong> prerrellenado con tus datos.</p>
                <p>Para formalizar tu alta como socio/a, necesitamos que:</p>
                <ol>
                  <li>Imprimas el documento adjunto</li>
                  <li>Lo firmes en el espacio indicado</li>
                  <li>Nos lo envíes escaneado a <strong>presidencia@ahoraorg.es</strong></li>
                </ol>
                <p><em>Este documento autoriza el cobro de la cuota de socio mediante domiciliación bancaria.</em></p>
              </div>
              
              <div class="credentials">
                <p><strong>Mientras tanto, ya puedes acceder al área de socios:</strong></p>
                <p>📧 Email: <strong>${email}</strong></p>
                <p>🔑 Contraseña: <strong>Tu número de DNI (sin guiones ni espacios)</strong></p>
              </div>

              <p style="text-align: center;">
                <a href="https://ahoraorg.es/socios" class="button">Acceder al área de socios</a>
              </p>
              
              <p>En tu panel de socios encontrarás:</p>
              <ul>
                <li>Directorio de socios</li>
                <li>Votaciones internas</li>
                <li>Eventos exclusivos</li>
                <li>Documentación interna</li>
              </ul>
              
              <p><em>💡 Recomendación: Una vez dentro, puedes cambiar tu contraseña desde la pestaña "Mi cuenta" del panel de socios.</em></p>
              
              <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
              <p>¡Gracias por unirte a nosotros!</p>
              <p><em>El equipo de AHORA</em></p>
            </div>
            <div class="footer">
              <p>AHORA - Actuar en el presente para construir el futuro</p>
              <p>NIF: G24999484</p>
              <p>Este correo fue enviado a ${email}</p>
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
        user_id: socioUserId,
        message: "Socio invitado correctamente con documento SEPA" 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in invite-socio function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
