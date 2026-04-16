const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { protect, supabase } = require('../middleware/auth');
const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
    const { data: user } = await supabase.from('users').select('*').eq('email', email.toLowerCase()).single();
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    if (!user.is_active) return res.status(403).json({ message: 'Account deactivated' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });
    const token = signToken(user.id);
    const { password: _, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch(e) { res.status(500).json({ message: e.message }); }
});

router.get('/me', protect, (req, res) => res.json({ user: req.user }));

router.put('/updateprofile', protect, async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (email) updates.email = email.toLowerCase();
    if (phone) updates.phone = phone;
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.user.id)
      .select('id,name,email,phone,role,employee_id')
      .single();
    if (error) return res.status(400).json({ message: error.message });
    res.json({ message: 'Profile updated', user: data });
  } catch(e) { res.status(500).json({ message: e.message }); }
});

router.put('/updatepassword', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ message: 'Both passwords required' });
    if (newPassword.length < 8) return res.status(400).json({ message: 'Min 8 characters' });
    const { data: u } = await supabase.from('users').select('password').eq('id', req.user.id).single();
    const match = await bcrypt.compare(currentPassword, u.password);
    if (!match) return res.status(401).json({ message: 'Current password incorrect' });
    const hashed = await bcrypt.hash(newPassword, 10);
    await supabase.from('users').update({ password: hashed }).eq('id', req.user.id);
    res.json({ message: 'Password updated' });
  } catch(e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
