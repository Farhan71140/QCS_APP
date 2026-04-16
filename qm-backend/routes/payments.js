const router = require('express').Router();
const { protect, allowRoles, supabase } = require('../middleware/auth');
const BASE   = parseFloat(process.env.BASE_SALARY        || 15000);
const BONUS  = parseFloat(process.env.PERFORMANCE_BONUS  || 2000);
const DEDUCT = parseFloat(process.env.FRAUD_DEDUCTION    || 3000);

// GET /api/payments
router.get('/', protect, async (req, res) => {
  try {
    let q = supabase
      .from('payments')
      .select(`
        *,
        users:worker_id (
          name,
          employee_id
        )
      `)
      .order('created_at', { ascending: false });

    if (req.user.role === 'participant') q = q.eq('worker_id', req.user.id);
    if (req.query.workerId) q = q.eq('worker_id', req.query.workerId);

    const { data, error } = await q.limit(200);
    if (error) return res.status(400).json({ message: error.message });
    res.json(data);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// POST /api/payments/batch — run monthly payroll for ALL workers (admin only)
router.post('/batch', protect, allowRoles('admin'), async (req, res) => {
  try {
    const month = req.body.month || new Date().getMonth() + 1;
    const year  = req.body.year  || new Date().getFullYear();

    const { data: workers, error: wErr } = await supabase
      .from('users')
      .select('id, name, employee_id, is_flagged')
      .eq('role', 'participant')
      .eq('is_active', true);

    if (wErr)
      return res.status(400).json({ message: wErr.message });
    if (!workers || workers.length === 0)
      return res.status(400).json({ message: 'No active participants found' });

    const rows = workers.map(w => {
      const bonus     = w.is_flagged ? 0      : BONUS;
      const deduction = w.is_flagged ? DEDUCT : 0;
      return {
        worker_id:    w.id,
        month,
        year,
        base_amount:  BASE,
        bonus,
        deduction,
        total_amount: BASE + bonus - deduction,
        status:       'paid',
        notes:        w.is_flagged
                        ? `Base ₹${BASE} - Deduction ₹${DEDUCT} (Fraud flagged)`
                        : `Base ₹${BASE} + Performance Bonus ₹${BONUS}`,
        processed_by: req.user.id
      };
    });

    // Upsert — skip if already paid this month (no duplicates)
    const { data, error } = await supabase
      .from('payments')
      .upsert(rows, { onConflict: 'worker_id,month,year', ignoreDuplicates: true })
      .select();

    if (error) return res.status(400).json({ message: error.message });

    const totalDisbursed = rows.reduce((s, p) => s + p.total_amount, 0);

    res.json({
      message:      `Payroll complete — ${data.length} payments processed`,
      count:        data.length,
      totalDisbursed,
      month,
      year
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// ✅ NEW: POST /api/payments/single — pay ONE specific worker (admin only)
router.post('/single', protect, allowRoles('admin'), async (req, res) => {
  try {
    const { workerId, month, year } = req.body;
    if (!workerId) return res.status(400).json({ message: 'workerId is required' });

    // Get the worker details
    const { data: worker, error: wErr } = await supabase
      .from('users')
      .select('id, name, employee_id, is_flagged, is_active, role')
      .eq('id', workerId)
      .single();

    if (wErr || !worker)
      return res.status(404).json({ message: 'Worker not found' });
    if (worker.role !== 'participant')
      return res.status(400).json({ message: 'Only participants can receive payments' });
    if (!worker.is_active)
      return res.status(400).json({ message: 'Worker account is inactive' });

    const bonus       = worker.is_flagged ? 0      : BONUS;
    const deduction   = worker.is_flagged ? DEDUCT : 0;
    const totalAmount = BASE + bonus - deduction;

    const { data, error } = await supabase
      .from('payments')
      .upsert({
        worker_id:    workerId,
        month:        month || new Date().getMonth() + 1,
        year:         year  || new Date().getFullYear(),
        base_amount:  BASE,
        bonus,
        deduction,
        total_amount: totalAmount,
        status:       'paid',
        notes:        worker.is_flagged
                        ? `Base ₹${BASE} - Deduction ₹${DEDUCT} (Fraud flagged)`
                        : `Base ₹${BASE} + Performance Bonus ₹${BONUS}`,
        processed_by: req.user.id
      }, { onConflict: 'worker_id,month,year', ignoreDuplicates: true })
      .select()
      .single();

    if (error) return res.status(400).json({ message: error.message });

    res.json({
      message:     `Payment processed for ${worker.name}`,
      totalAmount,
      payment:     data
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// ✅ NEW: DELETE /api/payments/:id — delete one specific payment record (admin only)
router.delete('/:id', protect, allowRoles('admin'), async (req, res) => {
  try {
    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('id', req.params.id);

    if (error) return res.status(400).json({ message: error.message });
    res.json({ message: 'Payment record deleted successfully' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;