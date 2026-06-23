// authorize.js
const authorize = (roles) => {
  const allowedRoles = roles.map((role) => String(role).toLowerCase());

  return (req, res, next) => {
    const currentRole = String(req.user?.role || "").toLowerCase();

    if (!req.user || !allowedRoles.includes(currentRole)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: this action requires ${allowedRoles.join(" or ")} role`,
        requiredRoles: allowedRoles,
        currentRole: currentRole || null,
      });
    }

    req.user.role = currentRole;
    next();
  };
};

module.exports = authorize;