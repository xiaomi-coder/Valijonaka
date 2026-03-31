const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'agroplast_secret_2025';

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token kerak' });
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token yaroqsiz' });
  }
}

function roleCheck(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({ error: 'Ruxsat yo\'q' });
    }
    next();
  };
}

module.exports = { authMiddleware, roleCheck, SECRET };
