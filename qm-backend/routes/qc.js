const router = require('express').Router();
const { protect, allowRoles, supabase } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  try {
    let q = supabase
      .from('qc_checks')
      .select('*, participant:users!qc_checks_participant_id_fkey(name,employee_id), submitter:users!qc_checks_submitted_by_fkey(name)')
      .order('created_at', { ascending: false });
    if (req.user.role === 'participant') q = q.eq('participant_id', req.user.id);
    if (req.query.status) q = q.eq('status', req.query.status);
    if (req.query.participantId) q = q.eq('participant_id', req.query.participantId);
    const { data, error } = await q.limit(200);
    if (error) return res.status(400).json({ message: error.message });
    res.json(data);
  } catch(e) { res.status(500).json({ message: e.message }); }
});

router.post('/', protect, allowRoles('admin', 'supervisor', 'teamleader'), async (req, res) => {
  try {
    const { participantId, taskType, samplesChecked, samplesPassed } = req.body;
    if (!participantId || !taskType || !samplesChecked || samplesPassed === undefined)
      return res.status(400).json({ message: 'All QC fields required' });
    if (samplesPassed > samplesChecked)
      return res.status(400).json({ message: 'Passed cannot exceed checked' });
    const score = parseFloat(((samplesPassed / samplesChecked) * 100).toFixed(2));
    const status = score >= 90 ? 'pass' : score >= 70 ? 'warning' : 'fail';
    const { data, error } = await supabase
      .from('qc_checks')
      .insert({
        participant_id: participantId, submitted_by: req.user.id,
        task_type: taskType, samples_checked: samplesChecked,
        samples_passed: samplesPassed, score, status
      }).select().single();
    if (error) return res.status(400).json({ message: error.message });
    if (status === 'fail') {
      await supabase.from('users')
        .update({ is_flagged: true, flag_reason: 'QC score ' + score + '% below 70%' })
        .eq('id', participantId);
    }
    res.status(201).json({
      message: 'QC submitted — ' + score + '% (' + status + ')',
      qc: data,
      autoFlagged: status === 'fail'
    });
  } catch(e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
