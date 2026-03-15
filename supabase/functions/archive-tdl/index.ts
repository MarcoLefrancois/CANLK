import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Check if TDL is closed
    if (tdl.status !== 'Clôturé' && tdl.status !== 'Closed') {
      return new Response(
        JSON.stringify({ error: 'TDL must be closed before archiving' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if PDF exists
    if (!tdl.pdf_generated) {
      return new Response(
        JSON.stringify({ error: 'PDF must be generated before archiving' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the PDF from storage
    const { data: pdfData } = await supabase.storage
      .from('tdl-reports')
      .list('', { search: `tdl_${tdl.tdl_number}` });

    if (!pdfData || pdfData.length === 0) {
      return new Response(
        JSON.stringify({ error: 'PDF file not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // In a real scenario, this would copy to SharePoint
    // For now, we'll mark as archived in our database
    const archivePath = `sharepoint/archives/tdl_${tdl.tdl_number}_${Date.now()}.pdf`;

    // Record archive
    const { data: archiveRecord, error: archiveError } = await supabase
      .from('tdl_archives')
      .insert({
        tdl_id: tdlId,
        archive_path: archivePath,
        archived_at: new Date().toISOString()
      })
      .select()
      .single();

    if (archiveError) throw archiveError;

    // Update TDL record
    await supabase
      .from('tdl_requests')
      .update({ 
        archived: true,
        closure_date: new Date().toISOString()
      })
      .eq('id', tdlId);

    // SharePoint integration would go here
    // For demo purposes, we'll return success

    return new Response(
      JSON.stringify({
        success: true,
        archivePath,
        archivedAt: archiveRecord?.archived_at
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error archiving TDL:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
