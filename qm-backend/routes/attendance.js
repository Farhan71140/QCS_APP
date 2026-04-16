const router = require('express').Router();
const { protect, allowRoles, supabase } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  try {
    let q = supabase
      .from('attendance')
      .select('*, users!attendance_worker_id_fkey(name,employee_id)')
      .order('date', { ascending: false });
    if (req.user.role === 'participant') q = q.eq('worker_id', req.user.id);
    if (req.query.date) q = q.eq('date', req.query.date);
    if (req.query.workerId) q = q.eq('worker_id', req.query.workerId);
    const { data, error } = await q.limit(100);
    if (error) return res.status(400).json({ message: error.message });
    res.json(data);
  } catch(e) { res.status(500).json({ message: e.message }); }
});

router.post('/checkin', protect, allowRoles('participant'), async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const now = new Date();
    const { data: ex } = await supabase
      .from('attendance').select('id,check_in').eq('worker_id', req.user.id).eq('date', today).single();
    if (ex?.check_in) return res.status(400).json({ message: 'Already checked in today' });
    const cutoffH = parseInt(process.env.LATE_CUTOFF_HOUR || 9);
    const cutoffM = parseInt(process.env.LATE_CUTOFF_MINUTE || 30);
    const late = now.getHours() > cutoffH || (now.getHours() === cutoffH && now.getMinutes() > cutoffM);
    const { data, error } = await supabase
      .from('attendance')
      .upsert({ worker_id: req.user.id, date: today, check_in: now.toISOString(), status: late ? 'Late' : 'Present' })
      .select().single();
    if (error) return res.status(400).json({ message: error.message });
    res.json({ message: 'Checked in — ' + (late ? 'Late' : 'Present'), attendance: data });
  } catch(e) { res.status(500).json({ message: e.message }); }
});

router.put('/checkout', protect, allowRoles('participant'), async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const now = new Date();
    const { data: rec } = await supabase
      .from('attendance').select('*').eq('worker_id', req.user.id).eq('date', today).single();
    if (!rec) return res.status(400).json({ message: 'No check-in found' });
    if (rec.check_out) return res.status(400).json({ message: 'Already checked out' });
    const hrs = parseFloat(((now - new Date(rec.check_in)) / 3600000).toFixed(2));
    const { data, error } = await supabase
      .from('attendance')
      .update({ check_out: now.toISOString(), hours_worked: hrs })
      .eq('id', rec.id).select().single();
    if (error) return res.status(400).json({ message: error.message });
    res.json({ message: 'Checked out — ' + hrs + 'h logged', attendance: data });
  } catch(e) { res.status(500).json({ message: e.message }); }
});

router.post('/mark', protect, allowRoles('admin', 'supervisor', 'teamleader'), async (req, res) => {
  try {
    const { workerId, date, status } = req.body;
    if (!workerId || !date || !status)
      return res.status(400).json({ message: 'workerId, date, status required' });
    const { data, error } = await supabase
      .from('attendance')
      .upsert({ worker_id: workerId, date, status, marked_by: req.user.id })
      .select().single();
    if (error) return res.status(400).json({ message: error.message });
    res.json({ message: 'Attendance marked', attendance: data });
  } catch(e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
