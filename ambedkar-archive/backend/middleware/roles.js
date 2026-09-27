/**
 * roles.js — Robust Institutional Role-Based Access Control (RBAC) Middleware
 * Enforces least-privilege authorization across Public/Visitor, User, Researcher,
 * Content Editor, Archivist, Admin, and Super Admin roles.
 */

const ROLE_LEVELS = {
  super_admin: 100,
  admin: 80,
  archivist: 60,
  editor: 50,
  content_editor: 50,
  researcher: 40,
  user: 20,
  visitor: 10,
  public: 10
};

const ROLE_PERMISSIONS = {
  super_admin: [
    'browse_public',
    'access_workspace',
    'save_bookmarks',
    'export_citations',
    'edit_content',
    'edit_metadata',
    'upload_records',
    'publish_records',
    'verify_ocr',
    'manage_preservation',
    'delete_records',
    'manage_users',
    'manage_roles',
    'manage_system'
  ],
  admin: [
    'browse_public',
    'access_workspace',
    'save_bookmarks',
    'export_citations',
    'edit_content',
    'edit_metadata',
    'upload_records',
    'publish_records',
    'verify_ocr',
    'manage_preservation',
    'delete_records',
    'manage_users',
    'manage_roles',
    'manage_system'
  ],
  archivist: [
    'browse_public',
    'access_workspace',
    'save_bookmarks',
    'export_citations',
    'edit_content',
    'edit_metadata',
    'upload_records',
    'publish_records',
    'verify_ocr',
    'manage_preservation'
  ],
  content_editor: [
    'browse_public',
    'access_workspace',
    'save_bookmarks',
    'export_citations',
    'edit_content',
    'edit_metadata'
  ],
  researcher: [
    'browse_public',
    'access_workspace',
    'save_bookmarks',
    'export_citations',
    'advanced_search'
  ],
  user: [
    'browse_public',
    'access_workspace',
    'save_bookmarks'
  ],
  visitor: [
    'browse_public'
  ],
  public: [
    'browse_public'
  ]
};

function normalizeRole(role) {
  if (!role) return 'visitor';
  const r = String(role).toLowerCase().trim();
  if (r === 'public') return 'visitor';
  if (r === 'editor') return 'content_editor';
  return r;
}

const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }
    const currentRole = normalizeRole(req.user.role);
    const effectiveRoles = [currentRole];
    if (currentRole === 'super_admin') effectiveRoles.push('admin');
    if (currentRole === 'content_editor') effectiveRoles.push('editor');

    const normalizedAllowed = allowedRoles.map(r => normalizeRole(r));
    const hasAccess = normalizedAllowed.some(r => effectiveRoles.includes(r));
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Operation requires one of: [${allowedRoles.join(', ')}].`,
        requiredRoles: allowedRoles,
        currentRole: currentRole,
      });
    }
    next();
  };
};

const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }
    const currentRole = normalizeRole(req.user.role);
    const permissions = ROLE_PERMISSIONS[currentRole] || ROLE_PERMISSIONS.visitor;

    if (!permissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role "${currentRole}" lacks required permission: "${permission}".`,
        requiredPermission: permission,
        currentRole: currentRole,
      });
    }
    next();
  };
};

function canManageRole(actorRole, targetUserCurrentRole, targetNewRole) {
  const actorNorm = normalizeRole(actorRole);
  const targetNorm = normalizeRole(targetUserCurrentRole);
  const newNorm = normalizeRole(targetNewRole);

  const actorLevel = ROLE_LEVELS[actorNorm] || 0;
  const targetLevel = ROLE_LEVELS[targetNorm] || 0;
  const newLevel = ROLE_LEVELS[newNorm] || 0;

  // Super admin can manage anyone
  if (actorNorm === 'super_admin') return true;

  // Admin can manage anyone below admin level, but cannot modify another admin or super_admin, and cannot promote to admin or super_admin
  if (actorLevel > targetLevel && actorLevel > newLevel) {
    return true;
  }
  return false;
}

module.exports = { requireRole, requirePermission, ROLE_PERMISSIONS, ROLE_LEVELS, canManageRole, normalizeRole };

