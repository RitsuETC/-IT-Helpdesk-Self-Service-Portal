function authorizeRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        message: "User tidak terautentikasi",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Anda tidak memiliki izin untuk melakukan tindakan ini",
      });
    }

    next();
  };
}

module.exports = authorizeRole;