const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer '))
      return res.status(401).json({ message: 'No token' });
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { data: user, error } = await supabase
      .from('users')
      .select('id,name,email,role,employee_id,is_active,is_flagged,supervisor_id')
      .eq('id', decoded.id)
      .single();
    if (error || !user) return res.status(401).json({ message: 'User not found' });
    if (!user.is_active) return res.status(403).json({ message: 'Account deactivated' });
    req.user = user;
    next();
  } catch(e) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

const allowRoles = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role))
    return res.status(403).json({ message: 'Access denied' });
  next();
};

module.exports = { protect, allowRoles, supabase };
