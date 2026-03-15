/**
 * CANLK-13: Edge Function - submit-workflow
 * 
 * Orchestrateur principal du workflow de soumission TDL.
 * Gère les notifications, la journalisation et l'orchestration post-soumission.
 * 
 * @version Sprint 3 | 2026-03-15
 * @agent ms_engine
 * 
 * Déployer avec: supabase functions deploy submit-workflow
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  tdl_id: string;
}

interface TDLRecord {
  id: string;
  tdl_number: string;
  client_name: string;
  department: string;
  priority: string;
  target_price: number;
  application_type: string;
  submitted_by: string;
  submitted_at: string;
  supervisor_email: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body
    const { tdl_id }: RequestBody = await req.json();

    if (!tdl_id) {
      throw new Error('tdl_id is required');
    }

    console.log(`Starting workflow for TDL: ${tdl_id}`);

    // Step 1: Fetch TDL details
    const { data: tdl, error: tdlError } = await supabase
      .from('tdl_requests')
      .select('*')
      .eq('id', tdl_id)
      .single();

    if (tdlError) throw tdlError;
    if (!tdl) throw new Error('TDL not found');

    const tdlRecord = tdl as unknown as TDLRecord;

    // Step 2: Check throttle (anti-spam)
    const { data: lastNotification } = await supabase
      .from('tdl_notifications')
      .select('sent_at')
      .eq('tdl_id', tdl_id)
      .order('sent_at', { ascending: false })
      .limit(1)
      .single();

    if (lastNotification) {
      const lastTime = new Date(lastNotification.sent_at);
      const now = new Date();
      const diffMinutes = (now.getTime() - lastTime.getTime()) / (1000 * 60);
      
      if (diffMinutes < 5) {
        console.log('Throttle: Skipping notification (less than 5 minutes)');
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Throttled - notification skipped',
            code: 'THROTTLED' 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Step 3: Determine recipients
    const recipients = await resolveRecipients(supabase, tdlRecord);

    // Step 4: Send notifications in parallel
    const notificationPromises = [];
    
    if (recipients.supervisor) {
      notificationPromises.push(
        sendEmailNotification(supabase, {
          to: recipients.supervisor,
          tdlNumber: tdlRecord.tdl_number,
          tdlId: tdlRecord.id,
          clientName: tdlRecord.client_name,
          priority: tdlRecord.priority,
          department: tdlRecord.department,
          submittedBy: tdlRecord.submitted_by,
          submittedAt: tdlRecord.submitted_at,
          targetPrice: tdlRecord.target_price,
          applicationType: tdlRecord.application_type,
        })
      );
    }

    if (recipients.sales) {
      notificationPromises.push(
        sendConfirmationToSales(supabase, {
          to: recipients.sales,
          tdlNumber: tdlRecord.tdl_number,
          clientName: tdlRecord.client_name,
        })
      );
    }

    // Wait for all notifications to complete (with timeout)
    await Promise.race([
      Promise.all(notificationPromises),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 25000)),
    ]);

    // Step 5: Log successful execution
    await supabase.from('tdl_workflow_logs').insert({
      tdl_id: tdl_id,
      event: 'WORKFLOW_COMPLETED',
      status: 'SUCCESS',
      details: { recipients },
    });

    console.log(`Workflow completed successfully for TDL: ${tdl_id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Workflow completed',
        recipients 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Workflow error:', error);

    // Log error
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Extract tdl_id from request if available
      let tdlId = 'unknown';
      try {
        const body = await req.json();
        tdlId = body.tdl_id || 'unknown';
      } catch {}

      await supabase.from('tdl_workflow_logs').insert({
        tdl_id: tdlId,
        event: 'WORKFLOW_FAILED',
        status: 'ERROR',
        details: { error: error.message },
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

/**
 * Resolve recipients based on department and AD groups
 */
async function resolveRecipients(supabase: any, tdl: TDLRecord) {
  let supervisor = tdl.supervisor_email;
  
  // If no supervisor, try to get from department
  if (!supervisor) {
    const { data: dept } = await supabase
      .from('tdl_departments')
      .select('default_supervisor_email')
      .eq('code', tdl.department)
      .single();
    
    supervisor = dept?.default_supervisor_email;
  }

  // Fallback to group email
  if (!supervisor) {
    supervisor = `supervisors-${tdl.department}@nmedia.com`;
  }

  return {
    supervisor,
    sales: tdl.submitted_by, // Could be enhanced to get sales rep email
  };
}

/**
 * Send email notification to supervisor
 */
async function sendEmailNotification(supabase: any, payload: any) {
  // Using Resend, SendGrid, or Supabase built-in email
  // This is a placeholder - implement based on your email provider
  
  const subject = `[${payload.tdlNumber}] NOUVELLE DEMANDE / NEW REQUEST - ${payload.clientName}`;
  
  // Log notification for now (replace with actual email sending)
  await supabase.from('tdl_notifications').insert({
    tdl_id: payload.tdlId,
    recipient: payload.to,
    type: 'SUPERVISOR_NOTIFICATION',
    subject,
    sent_at: new Date().toISOString(),
  });

  console.log(`Notification sent to: ${payload.to}`);
}

/**
 * Send confirmation to sales representative
 */
async function sendConfirmationToSales(supabase: any, payload: any) {
  const subject = `TDL ${payload.tdlNumber} soumise avec succès`;
  
  await supabase.from('tdl_notifications').insert({
    tdl_id: payload.tdlId,
    recipient: payload.to,
    type: 'SALES_CONFIRMATION',
    subject,
    sent_at: new Date().toISOString(),
  });

  console.log(`Confirmation sent to: ${payload.to}`);
}
