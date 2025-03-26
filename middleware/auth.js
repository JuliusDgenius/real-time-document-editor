import jwt from 'jsonwebtoken';

// Authentication middleware
export const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach user payload to request
    next()
  } catch (error) {
    res.status(400).json({ error: "Invalid token" });
  }
};

// Role authorization middleware
export const authorizeRole = (role) => {
  return (req, res, next) => {
    if (req.user.role !== role) {
        return res.status(403).json({ error: "Forbidden: Insufficient permissions." });
    }
    next();
  }
};