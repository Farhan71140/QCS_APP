const router = require('express').Router();
const { protect, allowRoles, supabase } = require('../middleware/auth');
const MAX_S = parseInt(process.env.MAX_HOURS_SINGLE_SHIFT || 12);
const MAX_D = parseInt(process.env.MAX_HOURS_DAILY || 16);

router.get('/', protect, async (req, res) => {
  try {
    let q = supabase
      .from('production')
      .select('*, users!production_worker_id_fkey(name,employee_id)')
      .order('created_at', { ascending: false });
    if (req.user.role === 'participant') q = q.eq('worker_id', req.user.id);
    if (req.query.status) q = q.eq('status', req.query.status);
    const { data, error } = await q.limit(100);
    if (error) return res.status(400).json({ message: error.message });
    res.json(data);
  } catch(e) { res.status(500).json({ message: e.message }); }
});

router.post('/', protect, allowRoles('participant'), async (req, res) => {
  try {
    const { taskType, hoursWorked, unitsCompleted, notes, date } = req.body;
    if (!taskType || !hoursWorked || !unitsCompleted)
      return res.status(400).json({ message: 'taskType, hoursWorked, unitsCompleted required' });
    const d = date || new Date().toISOString().slice(0, 10);
    let fraud = false, reason = null;
    if (parseFloat(hoursWorked) > MAX_S) {
      fraud = true;
      reason = 'Single entry over ' + MAX_S + 'h';
    }
    const { data: ex } = await supabase
      .from('production').select('hours_worked').eq('worker_id', req.user.id).eq('date', d);
    const total = (ex || []).reduce((s, r) => s + parseFloat(r.hours_worked), 0);
    if (total + parseFloat(hoursWorked) > MAX_D) {
      fraud = true;
      reason = 'Total daily hours over ' + MAX_D + 'h';
    }
    const { data, error } = await supabase
      .from('production')
      .insert({
        worker_id: req.user.id, date: d, task_type: taskType,
        hours_worked: hoursWorked, units_completed: unitsCompleted,
        notes, is_fraud_flagged: fraud, status: 'pending'
      }).select().single();
    if (error) return res.status(400).json({ message: error.message });
    if (fraud) await supabase.from('users').update({ is_flagged: true, flag_reason: reason }).eq('id', req.user.id);
    res.status(201).json({
      message: fraud ? 'Submitted — FRAUD FLAG: ' + reason : 'Submitted — pending approval',
      production: data,
      fraudFlag: fraud
    });
  } catch(e) { res.status(500).json({ message: e.message }); }
});

router.put('/:id', protect, allowRoles('admin', 'supervisor', 'teamleader'), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status))
      return res.status(400).json({ message: 'Status must be approved or rejected' });
    const { data, error } = await supabase
      .from('production')
      .update({ status, reviewed_by: req.user.id })
      .eq('id', req.params.id).select().single();
    if (error) return res.status(400).json({ message: error.message });
    res.json({ message: 'Production log ' + status, production: data });
  } catch(e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
