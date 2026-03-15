import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { PDFDocument, rgb, StandardFonts } from 'https://esm.sh/pdf-lib@1.17.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TDLData {
  id: string;
  tdl_number: string;
  client_name: string;
  project_name: string;
  priority: string;
  status: string;
  created_at: string;
  completion_date?: string;
  technical_specs?: any;
  financial_data?: any;
  test_results?: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { tdlId } = await req.json();

    if (!tdlId) {
      return new Response(
        JSON.stringify({ error: 'tdlId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch TDL data
    const { data: tdl, error: tdlError } = await supabase
      .from('tdl_requests')
      .select('*')
      .eq('id', tdlId)
      .single();

    if (tdlError || !tdl) {
      return new Response(
        JSON.stringify({ error: 'TDL not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch related data
    const [
      { data: client },
      { data: financial },
      { data: technical },
      { data: results }
    ] = await Promise.all([
      supabase.from('clients').select('*').eq('id', tdl.client_id).single(),
      supabase.from('tdl_financial').select('*').eq('tdl_id', tdlId).single(),
      supabase.from('tdl_technical_specs').select('*').eq('tdl_id', tdlId).single(),
      supabase.from('tdl_test_results').select('*').eq('tdl_id', tdlId).single()
    ]);

    // Generate PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let y = 800;

    // Header
    page.drawText('RAPPORT DE TRAVAUX DE LABORATOIRE', {
      x: 50,
      y,
      size: 18,
      font: boldFont,
      color: rgb(0, 0.35, 0.6),
    });
    y -= 30;

    page.drawText('LABORATORY WORK ORDER REPORT', {
      x: 50,
      y,
      size: 14,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });
    y -= 40;

    // TDL Info
    page.drawText(`TDL #${tdl.tdl_number}`, {
      x: 50,
      y,
      size: 12,
      font: boldFont,
    });
    y -= 20;

    // Bilingual sections
    const sections = [
      { fr: 'Client', en: 'Client', value: client?.name || tdl.client_name || 'N/A' },
      { fr: 'Projet', en: 'Project', value: tdl.project_name || 'N/A' },
      { fr: 'Statut', en: 'Status', value: tdl.status || 'N/A' },
      { fr: 'Priorité', en: 'Priority', value: tdl.priority || 'N/A' },
      { fr: 'Date de création', en: 'Creation Date', value: new Date(tdl.created_at).toLocaleDateString('fr-CA') },
    ];

    for (const section of sections) {
      page.drawText(`${section.fr} / ${section.en}: ${section.value}`, {
        x: 50,
        y,
        size: 10,
        font,
        color: rgb(0, 0, 0),
      });
      y -= 18;
    }

    y -= 20;

    // Technical Specs Section
    if (technical) {
      page.drawText('SPÉCIFICATIONS TECHNIQUES / TECHNICAL SPECIFICATIONS', {
        x: 50,
        y,
        size: 11,
        font: boldFont,
      });
      y -= 20;

      const techFields = [
        { fr: 'Domaine', en: 'Domain', key: 'domain' },
        { fr: 'Sous-domaine', en: 'Sub-domain', key: 'sub_domain' },
        { fr: 'Type d\'analyse', en: 'Analysis Type', key: 'analysis_type' },
      ];

      for (const field of techFields) {
        const value = technical[field.key] || 'N/A';
        page.drawText(`${field.fr} / ${field.en}: ${value}`, {
          x: 50,
          y,
          size: 10,
          font,
        });
        y -= 15;
      }
      y -= 15;
    }

    // Financial Section
    if (financial) {
      page.drawText('INFORMATIONS FINANCIÈRES / FINANCIAL INFORMATION', {
        x: 50,
        y,
        size: 11,
        font: boldFont,
      });
      y -= 20;

      page.drawText(`Prix / Price: ${financial.total_price || 0} $`, {
        x: 50,
        y,
        size: 10,
        font,
      });
      y -= 15;
      y -= 15;
    }

    // Test Results Section
    if (results) {
      page.drawText('RÉSULTATS D\'ANALYSE / ANALYSIS RESULTS', {
        x: 50,
        y,
        size: 11,
        font: boldFont,
      });
      y -= 20;

      page.drawText(`Conclusion: ${results.conclusion || 'N/A'}`, {
        x: 50,
        y,
        size: 10,
        font,
      });
    }

    // Footer
    const footerY = 50;
    page.drawText(`Generated / Généré le: ${new Date().toLocaleString('fr-CA')}`, {
      x: 50,
      y: footerY,
      size: 8,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });

    // Serialize PDF
    const pdfBytes = await pdfDoc.save();

    // Store PDF in storage bucket
    const fileName = `tdl_${tdl.tdl_number}_${Date.now()}.pdf`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('tdl-reports')
      .upload(fileName, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
    }

    // Update TDL record
    await supabase
      .from('tdl_requests')
      .update({ pdf_generated: true })
      .eq('id', tdlId);

    // Record PDF generation in tracking table
    await supabase.from('tdl_pdf_reports').insert({
      tdl_id: tdlId,
      version: 1,
      file_path: uploadData?.path || fileName,
      generated_at: new Date().toISOString()
    });

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('tdl-reports')
      .getPublicUrl(fileName);

    return new Response(
      JSON.stringify({
        success: true,
        fileName,
        url: urlData.publicUrl
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating PDF:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
