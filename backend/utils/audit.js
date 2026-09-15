/** Record an audit event. Pass a transaction client when the action is transactional. */
async function logAudit(queryable, req, { action, detail, entityType = null, entityId = null, metadata = {} }) {
  const user = req.user || {};
  await queryable.query(
    `INSERT INTO audit_log (actor_id, actor_name, action, detail, entity_type, entity_id, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)`,
    [user.id || null, user.username || 'Sistem', action, detail, entityType, entityId == null ? null : String(entityId), JSON.stringify(metadata)]
  );
}

module.exports = { logAudit };
