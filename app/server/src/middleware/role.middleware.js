/**
 * Role-Based Access Control Middleware
 * Restricts access based on user roles
 */

/**
 * Check if user has required role(s)
 * @param {...string} allowedRoles - Roles that are allowed to access the route
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    // Check if user exists (should be attached by authenticate middleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }
    
    // Check if user's role is allowed
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to perform this action.',
        requiredRoles: allowedRoles,
        yourRole: req.user.role
      });
    }
    
    next();
  };
};

/**
 * Check if user is accessing their own resource or is an admin
 * @param {string} paramName - Name of the URL parameter containing the user ID
 */
const authorizeOwnerOrAdmin = (paramName = 'id') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }
    
    const resourceUserId = req.params[paramName];
    const currentUserId = req.user._id.toString();
    
    // Allow if user is accessing their own resource or is an admin/superadmin
    if (resourceUserId === currentUserId || 
        req.user.role === 'admin' || 
        req.user.role === 'superadmin') {
      return next();
    }
    
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only access your own resources.'
    });
  };
};

/**
 * Check if student is approved
 */
const requireApprovedStudent = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.'
    });
  }
  
  // Admins are always allowed
  if (req.user.role === 'admin' || req.user.role === 'superadmin') {
    return next();
  }
  
  // Check if student is approved
  if (req.user.role === 'student' && req.user.status !== 'approved') {
    return res.status(403).json({
      success: false,
      message: 'Your account is pending approval. Please wait for admin verification.',
      status: req.user.status
    });
  }
  
  next();
};

/**
 * Check if user can access specific class content
 */
const authorizeClassAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.'
    });
  }
  
  // Admins can access all classes
  if (req.user.role === 'admin' || req.user.role === 'superadmin') {
    return next();
  }
  
  // Check requested class level
  const requestedClass = parseInt(req.params.classLevel) || parseInt(req.query.classLevel);
  
  if (requestedClass && req.user.assignedClass !== requestedClass) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only access content for your assigned class.',
      yourClass: req.user.assignedClass,
      requestedClass
    });
  }
  
  next();
};

// Predefined role combinations
const roles = {
  admin: authorize('admin', 'superadmin'),
  superAdmin: authorize('superadmin'),
  student: authorize('student'),
  any: authorize('student', 'admin', 'superadmin'),
  adminOrStudent: authorize('admin', 'superadmin', 'student')
};

module.exports = {
  authorize,
  authorizeOwnerOrAdmin,
  requireApprovedStudent,
  authorizeClassAccess,
  roles
};