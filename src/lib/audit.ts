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
    // Writes go through a SECURITY DEFINER RPC that enforces admin/vendor role
    // server-side. Clients cannot insert into audit_logs directly.
    await (supabase as any).rpc("log_audit", {
      _action: params.action,
      _entity_type: params.entityType ?? null,
      _entity_id: params.entityId ?? null,
      _metadata: (params.metadata ?? null) as any,
      _actor_role: params.actorRole ?? null,
    });
  } catch (e) {
    // non-fatal
    console.warn("audit log failed", e);
  }
}
