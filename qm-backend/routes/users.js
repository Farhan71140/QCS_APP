const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { protect, allowRoles, supabase } = require('../middleware/auth');

// GET /api/users
router.get('/', protect, allowRoles('admin', 'supervisor', 'teamleader'), async (req, res) => {
  try {
    let query = supabase
      .from('users')
      .select('id,name,email,role,employee_id,phone,is_active,is_flagged,flag_reason,supervisor_id,created_at')
      .order('created_at', { ascending: false });
    if (req.user.role !== 'admin') query = query.eq('supervisor_id', req.user.id);
    if (req.query.flagged === 'true') query = query.eq('is_flagged', true);
    if (req.query.role) query = query.eq('role', req.query.role);
    const { data, error } = await query;
    if (error) return res.status(400).json({ message: error.message });
    res.json(data);
  } catch(e) { res.status(500).json({ message: e.message }); }
});

// POST /api/users — create user (admin only)
router.post('/', protect, allowRoles('admin'), async (req, res) => {
  try {
    const { name, email, password, role, employeeId, supervisorId, phone } = req.body;
    if (!name || !email || !password || !role)
      return res.status(400).json({ message: 'name, email, password, role required' });
    const hashed = await bcrypt.hash(password, 10);
    const { data, error } = await supabase
      .from('users')
      .insert({ name, email: email.toLowerCase(), password: hashed, role, employee_id: employeeId, supervisor_id: supervisorId, phone })
      .select('id,name,email,role,employee_id')
      .single();
    if (error) return res.status(400).json({ message: error.message });
    res.status(201).json({ message: 'User created', user: data });
  } catch(e) { res.status(500).json({ message: e.message }); }
});

// ✅ NEW: PUT /api/users/:id — edit a single user (admin only)
router.put('/:id', protect, allowRoles('admin'), async (req, res) => {
  try {
    const { name, email, role, phone, isActive } = req.body;
    const updates = {};
    if (name)            updates.name      = name;
    if (email)           updates.email     = email.toLowerCase();
    if (role)            updates.role      = role;
    if (phone)           updates.phone     = phone;
    if (isActive !== undefined) updates.is_active = isActive;
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.params.id)
      .select('id,name,email,role,employee_id,is_active')
      .single();
    if (error) return res.status(400).json({ message: error.message });
    res.json({ message: 'User updated', user: data });
  } catch(e) { res.status(500).json({ message: e.message }); }
});

// ✅ NEW: DELETE /api/users/:id — delete a single user (admin only)
// ⚠️ Must come AFTER named routes like /delete-samples, /delete-workers, /wipe-all
router.delete('/:id', protect, allowRoles('admin'), async (req, res) => {
  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', req.params.id);
    if (error) return res.status(400).json({ message: error.message });
    res.json({ message: 'User deleted successfully' });
  } catch(e) { res.status(500).json({ message: e.message }); }
});

// PUT /api/users/:id/flag — flag or unflag a user
router.put('/:id/flag', protect, allowRoles('admin', 'supervisor', 'teamleader'), async (req, res) => {
  try {
    const { flagged, reason } = req.body;
    const { data, error } = await supabase
      .from('users')
      .update({ is_flagged: flagged, flag_reason: reason || null })
      .eq('id', req.params.id)
      .select('id,name,is_flagged')
      .single();
    if (error) return res.status(400).json({ message: error.message });
    res.json({ message: flagged ? 'Flagged' : 'Unflagged', user: data });
  } catch(e) { res.status(500).json({ message: e.message }); }
});

// DELETE /api/users/delete-samples
router.delete('/delete-samples', protect, allowRoles('admin'), async (req, res) => {
  try {
    await supabase.from('users').delete().in('email', [
      'priya@workforceos.com', 'anita@workforceos.com',
      'ramesh@workforceos.com', 'sunita@workforceos.com', 'ravi@workforceos.com'
    ]);
    res.json({ message: 'Sample users deleted' });
  } catch(e) { res.status(500).json({ message: e.message }); }
});

// DELETE /api/users/delete-workers
router.delete('/delete-workers', protect, allowRoles('admin'), async (req, res) => {
  try {
    await supabase.from('users').delete().in('role', ['participant', 'supervisor', 'teamleader']);
    res.json({ message: 'All workers deleted' });
  } catch(e) { res.status(500).json({ message: e.message }); }
});

// DELETE /api/users/wipe-all
router.delete('/wipe-all', protect, allowRoles('admin'), async (req, res) => {
  try {
    const DUMMY_ID = '00000000-0000-0000-0000-000000000000';
    await supabase.from('payments').delete().neq('id', DUMMY_ID);
    await supabase.from('qc_checks').delete().neq('id', DUMMY_ID);
    await supabase.from('production').delete().neq('id', DUMMY_ID);
    await supabase.from('attendance').delete().neq('id', DUMMY_ID);
    await supabase.from('users').delete().in('role', ['participant', 'supervisor', 'teamleader']);
    res.json({ message: 'Wiped. Admin preserved.' });
  } catch(e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;