const sensitiveFields = new Set(['password', 'password_hash', 'token', 'authorization', 'jwt', 'refresh_token']);

function safeAuditData(value) {
  if (Array.isArray(value)) return value.map(safeAuditData);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !sensitiveFields.has(key.toLowerCase()))
    .map(([key, child]) => [key, safeAuditData(child)]));
}

/** Record an audit event. Pass a transaction client when the action is transactional. */
async function logAudit(queryable, req, { action, detail, entityType = null, entityId = null, metadata = {} }) {
  const user = req.user || {};
  const requestData = req.body && Object.keys(req.body).length
    ? safeAuditData(req.body)
    : req.params && Object.keys(req.params).length ? safeAuditData(req.params) : null;
  const auditMetadata = requestData ? { ...metadata, request: requestData } : metadata;
  await queryable.query(
    `INSERT INTO audit_log (actor_id, actor_name, action, detail, entity_type, entity_id, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)`,
    [user.id || null, user.username || 'Sistem', action, detail, entityType, entityId == null ? null : String(entityId), JSON.stringify(auditMetadata)]
  );
}

module.exports = { logAudit };
