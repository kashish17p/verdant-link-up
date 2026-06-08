import { supabase } from "@/integrations/supabase/client";

export async function logAudit(params: {
  actorId: string;
  actorRole?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await supabase.from("audit_logs").insert({
      actor_id: params.actorId,
      actor_role: params.actorRole ?? null,
      action: params.action,
      entity_type: params.entityType ?? null,
      entity_id: params.entityId ?? null,
      metadata: params.metadata ?? null,
    });
  } catch (e) {
    // non-fatal
    console.warn("audit log failed", e);
  }
}
