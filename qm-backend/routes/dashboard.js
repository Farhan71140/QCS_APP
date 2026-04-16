const router = require('express').Router();
const { protect, allowRoles, supabase } = require('../middleware/auth');

router.get('/admin', protect, allowRoles('admin'), async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const m = new Date().getMonth() + 1;
    const y = new Date().getFullYear();
    const [w, a, q, p, f] = await Promise.all([
      supabase.from('users').select('id,is_flagged').eq('is_active', true).eq('role', 'participant'),
      supabase.from('attendance').select('status').eq('date', today),
      supabase.from('qc_checks').select('status,score'),
      supabase.from('payments').select('total_amount').eq('month', m).eq('year', y),
      supabase.from('users').select('id').eq('is_flagged', true).eq('is_active', true)
    ]);
    const att = a.data || [], qc = q.data || [], pay = p.data || [];
    const avgQC = qc.length
      ? Math.round(qc.reduce((s, q) => s + parseFloat(q.score), 0) / qc.length)
      : 0;
    res.json({
      totalWorkers:  w.data?.length || 0,
      fraudFlags:    f.data?.length || 0,
      qcPassRate:    avgQC,
      totalPaidOut:  pay.reduce((s, p) => s + parseFloat(p.total_amount), 0),
      presentToday:  att.filter(a => a.status === 'Present').length,
      lateToday:     att.filter(a => a.status === 'Late').length,
      absentToday:   att.filter(a => a.status === 'Absent').length,
      qcPassed:      qc.filter(q => q.status === 'pass').length,
      qcWarning:     qc.filter(q => q.status === 'warning').length,
      qcFailed:      qc.filter(q => q.status === 'fail').length
    });
  } catch(e) { res.status(500).json({ message: e.message }); }
});

router.get('/supervisor', protect, allowRoles('admin', 'supervisor', 'teamleader'), async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const { data: team } = await supabase
      .from('users').select('id,is_flagged').eq('supervisor_id', req.user.id).eq('is_active', true);
    const ids = (team || []).map(t => t.id);
    if (!ids.length) return res.json({ teamSize: 0, presentToday: 0, avgQcScore: 0, flaggedMembers: 0 });
    const [att, qc] = await Promise.all([
      supabase.from('attendance').select('status').eq('date', today).in('worker_id', ids),
      supabase.from('qc_checks').select('score').in('participant_id', ids).limit(50)
    ]);
    const scores = (qc.data || []).map(q => parseFloat(q.score));
    const avgQC = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    res.json({
      teamSize:       team.length,
      presentToday:   (att.data || []).filter(a => a.status === 'Present').length,
      lateToday:      (att.data || []).filter(a => a.status === 'Late').length,
      avgQcScore:     avgQC,
      flaggedMembers: team.filter(t => t.is_flagged).length
    });
  } catch(e) { res.status(500).json({ message: e.message }); }
});

router.get('/participant', protect, allowRoles('participant'), async (req, res) => {
  try {
    const ms = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
    const [att, qc, pay] = await Promise.all([
      supabase.from('attendance').select('status,hours_worked').eq('worker_id', req.user.id).gte('date', ms),
      supabase.from('qc_checks').select('score').eq('participant_id', req.user.id).order('created_at', { ascending: false }).limit(10),
      supabase.from('payments').select('total_amount').eq('worker_id', req.user.id)
    ]);
    const ad = att.data || [], qd = qc.data || [], pd = pay.data || [];
    const hrs = ad.reduce((s, a) => s + parseFloat(a.hours_worked || 0), 0);
    const avg = qd.length ? Math.round(qd.reduce((s, q) => s + parseFloat(q.score), 0) / qd.length) : 0;
    res.json({
      hoursThisMonth: parseFloat(hrs.toFixed(1)),
      avgQcScore:     avg,
      daysPresent:    ad.filter(a => ['Present', 'Late'].includes(a.status)).length,
      totalPaid:      pd.reduce((s, p) => s + parseFloat(p.total_amount), 0)
    });
  } catch(e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
