// ─── SUPERVISOR DASHBOARD ─────────────────────────────────────
async function loadSupervisorDashboard() {
  const el = document.getElementById('supervisorContent');
  const data = await apiFetch('/dashboard/supervisor');
  // ✅ FIX: use ?? so 0 values stay as 0
  const s = data || { teamSize: 0, presentToday: 0, avgQcScore: 0, flaggedMembers: 0 };
  el.innerHTML = `
  <div class="api-status"><span class="status-dot ${data ? 'dot-green' : 'dot-gold'}"></span>${data ? 'Live API' : 'Demo Mode'}</div>
  <div class="welcome-banner" style="background:linear-gradient(135deg,#3B82F6 0%,#6C63FF 60%,#A855F7 100%)">
    <h3>Hi, ${currentUser?.name || 'Supervisor'} 👋</h3>
    <p>Supervisor • ${today()}</p>
    <span class="emp-id">${currentUser?.employee_id || '—'} • Team</span>
  </div>
  <div class="stat-grid">
    <div class="stat-card s-blue"><span class="stat-icon">👥</span><div class="stat-val">${s.teamSize ?? 0}</div><div class="stat-label">My Team</div></div>
    <div class="stat-card s-green"><span class="stat-icon">📅</span><div class="stat-val">${s.presentToday ?? 0}</div><div class="stat-label">Present Today</div></div>
    <div class="stat-card s-teal"><span class="stat-icon">✅</span><div class="stat-val">${s.avgQcScore ?? 0}%</div><div class="stat-label">Avg QC Score</div></div>
    <div class="stat-card s-red"><span class="stat-icon">⚠️</span><div class="stat-val">${s.flaggedMembers ?? 0}</div><div class="stat-label">Flagged</div></div>
  </div>
  <div class="action-grid">
    <button class="action-btn ab-purple" onclick="supTab('qc',document.querySelector('#supervisorScreen .nav-item:nth-child(2)'))"><span class="a-icon">✅</span><span class="a-label">Submit QC</span><span class="a-sub">Check quality</span></button>
    <button class="action-btn ab-blue" onclick="supTab('attendance',document.querySelector('#supervisorScreen .nav-item:nth-child(3)'))"><span class="a-icon">📅</span><span class="a-label">Mark Attendance</span><span class="a-sub">Manual entry</span></button>
    <button class="action-btn ab-green" onclick="supTab('production',document.querySelector('#supervisorScreen .nav-item:nth-child(4)'))"><span class="a-icon">📋</span><span class="a-label">Review Logs</span><span class="a-sub">Approve work</span></button>
    <button class="action-btn ab-teal" onclick="supTab('team',document.querySelector('#supervisorScreen .nav-item:nth-child(5)'))"><span class="a-icon">👥</span><span class="a-label">My Team</span><span class="a-sub">View members</span></button>
  </div>
  <div class="card">
    <div class="card-title">👥 Recent Team Members</div>
    <div id="supRecentTeam"><div class="loading"><div><div class="spinner"></div></div></div></div>
  </div>`;
  // ✅ FIX: load real team members from API
  loadRecentTeam('supRecentTeam');
}

async function loadRecentTeam(elId) {
  const el = document.getElementById(elId);
  const data = await apiFetch('/users');
  const members = data ? data.filter(u => u.role === 'participant').slice(0, 3) : [];
  if (!members.length) {
    el.innerHTML = '<div style="text-align:center;padding:16px;color:var(--text3);font-size:13px">No team members yet</div>';
    return;
  }
  el.innerHTML = members.map(m => `<div class="list-item">
    <div class="item-avatar" style="background:linear-gradient(135deg,#3B82F6,#6C63FF)">${m.name[0]}</div>
    <div class="item-info"><h4>${m.name}</h4><p>${m.employee_id || '—'} • ${m.is_flagged ? '🚩 Flagged' : '✅ Active'}</p></div>
    <div class="item-right"><span class="${m.is_active ? 'badge-present' : 'badge-absent'}">${m.is_active ? 'Active' : 'Inactive'}</span></div>
  </div>`).join('');
}

async function supTab(tab, el) {
  const nav = document.querySelector('#supervisorScreen .bottom-nav');
  setNavActive(nav, el);
  const content = document.getElementById('supervisorContent');
  if (tab === 'dashboard') { loadSupervisorDashboard(); return; }
  content.innerHTML = '<div class="loading"><div><div class="spinner"></div>Loading…</div></div>';
  if (tab === 'qc')         renderQCForm(content, 'supervisor');
  else if (tab === 'attendance') renderMarkAttendance(content);
  else if (tab === 'production') await renderProductionReview(content);
  else if (tab === 'team')       await renderTeamList(content);
}

// ─── TEAM LEADER DASHBOARD ───────────────────────────────────
async function loadTeamLeaderDashboard() {
  const el = document.getElementById('teamleaderContent');
  const data = await apiFetch('/dashboard/supervisor');
  // ✅ FIX: use ?? so 0 values stay as 0
  const s = data || { teamSize: 0, presentToday: 0, avgQcScore: 0, flaggedMembers: 0 };
  el.innerHTML = `
  <div class="api-status"><span class="status-dot ${data ? 'dot-green' : 'dot-gold'}"></span>${data ? 'Live' : 'Demo'} • Team Leader View</div>
  <div class="welcome-banner" style="background:linear-gradient(135deg,#F59E0B 0%,#EF4444 60%,#A855F7 100%)">
    <h3>Hi, ${currentUser?.name || 'Team Leader'} 👋</h3>
    <p>Team Leader • ${today()}</p>
    <span class="emp-id">${currentUser?.employee_id || '—'} • Sub-Team</span>
  </div>
  <div class="stat-grid">
    <div class="stat-card s-gold"><span class="stat-icon">👥</span><div class="stat-val">${s.teamSize ?? 0}</div><div class="stat-label">Sub-Team Size</div></div>
    <div class="stat-card s-green"><span class="stat-icon">📅</span><div class="stat-val">${s.presentToday ?? 0}</div><div class="stat-label">Present Today</div></div>
    <div class="stat-card s-teal"><span class="stat-icon">✅</span><div class="stat-val">${s.avgQcScore ?? 0}%</div><div class="stat-label">Avg QC Score</div></div>
    <div class="stat-card s-blue"><span class="stat-icon">📋</span><div class="stat-val">${s.pendingLogs ?? 0}</div><div class="stat-label">Pending Logs</div></div>
  </div>
  <div class="action-grid">
    <button class="action-btn ab-gold" onclick="tlTab('qc',document.querySelector('#teamleaderScreen .nav-item:nth-child(2)'))"><span class="a-icon">✅</span><span class="a-label">Submit QC</span><span class="a-sub">Quality check</span></button>
    <button class="action-btn ab-blue" onclick="tlTab('attendance',document.querySelector('#teamleaderScreen .nav-item:nth-child(3)'))"><span class="a-icon">📅</span><span class="a-label">Mark Attendance</span><span class="a-sub">Manual entry</span></button>
    <button class="action-btn ab-green" onclick="tlTab('production',document.querySelector('#teamleaderScreen .nav-item:nth-child(4)'))"><span class="a-icon">📋</span><span class="a-label">Review Logs</span><span class="a-sub">Approve work</span></button>
    <button class="action-btn ab-teal" onclick="tlTab('team',document.querySelector('#teamleaderScreen .nav-item:nth-child(5)'))"><span class="a-icon">👥</span><span class="a-label">Sub-Team</span><span class="a-sub">View members</span></button>
  </div>
  <div class="card">
    <div class="card-title">📊 Recent QC Results</div>
    <div id="tlRecentQC"><div class="loading"><div><div class="spinner"></div></div></div></div>
  </div>`;
  // ✅ FIX: load real QC records from API
  loadRecentQC('tlRecentQC');
}

async function loadRecentQC(elId) {
  const el = document.getElementById(elId);
  const data = await apiFetch('/qc');
  const recs = data ? data.slice(0, 3) : [];
  if (!recs.length) {
    el.innerHTML = '<div style="text-align:center;padding:16px;color:var(--text3);font-size:13px">No QC checks submitted yet</div>';
    return;
  }
  el.innerHTML = recs.map(q => {
    const score = parseFloat(q.score);
    const st = qcStatus(score);
    const workerName = q.participant?.name || q.worker || 'Worker';
    return `<div class="list-item">
      <div class="item-avatar" style="background:${score >= 90 ? 'linear-gradient(135deg,var(--green),#06B6D4)' : score >= 70 ? 'linear-gradient(135deg,var(--gold),#EF4444)' : 'linear-gradient(135deg,var(--red),#F59E0B)'}">${workerName[0]}</div>
      <div class="item-info"><h4>${workerName}</h4><p>${q.task_type || q.task}</p></div>
      <div class="item-right"><div class="val">${score}%</div><span class="${st.cls}">${st.label}</span></div>
    </div>`;
  }).join('');
}

async function tlTab(tab, el) {
  const nav = document.querySelector('#teamleaderScreen .bottom-nav');
  setNavActive(nav, el);
  const content = document.getElementById('teamleaderContent');
  if (tab === 'dashboard') { loadTeamLeaderDashboard(); return; }
  content.innerHTML = '<div class="loading"><div><div class="spinner"></div>Loading…</div></div>';
  if (tab === 'qc')              renderQCForm(content, 'teamleader');
  else if (tab === 'attendance') renderMarkAttendance(content);
  else if (tab === 'production') await renderProductionReview(content);
  else if (tab === 'team')       await renderTeamList(content, 'sub-team');
}

// ─── SHARED: QC FORM ─────────────────────────────────────────
function renderQCForm(el, role) {
  el.innerHTML = `
  <div class="api-status"><span class="status-dot dot-green"></span>POST /api/qc</div>
  <div class="card">
    <div class="card-title">✅ Submit QC Check</div>
    <div class="form-group"><label>Participant</label>
      <select id="qc_part">
        <option value="">Loading workers…</option>
      </select>
    </div>
    <div class="form-group"><label>Task Type</label><input id="qc_task" placeholder="e.g. Data Entry, Assembly"/></div>
    <div class="form-group"><label>Samples Checked</label><input id="qc_checked" type="number" placeholder="e.g. 100" oninput="calcQCScore()"/></div>
    <div class="form-group"><label>Samples Passed</label><input id="qc_passed" type="number" placeholder="e.g. 92" oninput="calcQCScore()"/></div>
    <div class="score-preview" id="scorePreview">
      <div style="font-size:13px;color:var(--text2);margin-bottom:4px">Live Score Preview</div>
      <div class="score-big" style="color:var(--text3)">—</div>
      <div class="score-status" style="color:var(--text3)">Enter samples to calculate</div>
    </div>
    <button class="btn-submit" onclick="submitQC()">Submit QC Check ✅</button>
  </div>
  <div class="card">
    <div class="card-title">📋 Recent QC Checks</div>
    <div id="recentQCList"><div class="loading"><div><div class="spinner"></div></div></div></div>
  </div>`;
  // ✅ FIX: load real workers and QC records from API
  loadQCWorkers();
  loadRecentQCList();
}

async function loadQCWorkers() {
  const data = await apiFetch('/users?role=participant');
  const sel = document.getElementById('qc_part');
  if (!sel) return;
  if (!data || !data.length) {
    sel.innerHTML = '<option value="">No workers found</option>';
    return;
  }
  sel.innerHTML = data.map(u =>
    `<option value="${u.id}">${u.name} (${u.employee_id || '—'})</option>`
  ).join('');
}

async function loadRecentQCList() {
  const el = document.getElementById('recentQCList');
  if (!el) return;
  const data = await apiFetch('/qc');
  const recs = data ? data.slice(0, 5) : [];
  if (!recs.length) {
    el.innerHTML = '<div style="text-align:center;padding:16px;color:var(--text3);font-size:13px">No QC checks yet</div>';
    return;
  }
  el.innerHTML = recs.map(q => {
    const score = parseFloat(q.score);
    const st = qcStatus(score);
    const workerName = q.participant?.name || 'Worker';
    return `<div class="list-item">
      <div class="item-avatar" style="background:${score >= 90 ? 'linear-gradient(135deg,var(--green),#06B6D4)' : score >= 70 ? 'linear-gradient(135deg,var(--gold),#EF4444)' : 'linear-gradient(135deg,var(--red),#F59E0B)'}">✅</div>
      <div class="item-info"><h4>${workerName}</h4><p>${q.task_type || q.task} • ${q.samples_checked || q.checked} samples</p></div>
      <div class="item-right"><div class="val">${score}%</div><span class="${st.cls}">${st.label}</span></div>
    </div>`;
  }).join('');
}

function calcQCScore() {
  const c = parseInt(document.getElementById('qc_checked').value) || 0;
  const p = parseInt(document.getElementById('qc_passed').value) || 0;
  const prev = document.getElementById('scorePreview');
  if (!prev) return;
  if (c > 0 && p >= 0) {
    const score = Math.round((p / c) * 100);
    const st = qcStatus(score);
    prev.querySelector('.score-big').textContent = score + '%';
    prev.querySelector('.score-big').style.color = st.color;
    prev.querySelector('.score-status').textContent = st.label;
    prev.querySelector('.score-status').style.color = st.color;
  }
}

async function submitQC() {
  const participantId  = document.getElementById('qc_part').value;
  const taskType       = document.getElementById('qc_task').value;
  const samplesChecked = parseInt(document.getElementById('qc_checked').value);
  const samplesPassed  = parseInt(document.getElementById('qc_passed').value);
  if (!participantId || !taskType || !samplesChecked || isNaN(samplesPassed)) {
    toast('⚠️ Fill all QC fields'); return;
  }
  if (samplesPassed > samplesChecked) {
    toast('⚠️ Passed cannot exceed checked'); return;
  }
  const score = Math.round((samplesPassed / samplesChecked) * 100);
  const data = await apiFetch('/qc', 'POST', { participantId, taskType, samplesChecked, samplesPassed, score });
  toast(data ? '✅ QC submitted — Score: ' + score + '%' : '❌ QC submission failed');
  if (score < 70) setTimeout(() => toast('🚨 Score below 70% — Worker auto-flagged!'), 600);
  // Clear form
  document.getElementById('qc_task').value    = '';
  document.getElementById('qc_checked').value = '';
  document.getElementById('qc_passed').value  = '';
  calcQCScore();
  // Refresh recent list
  loadRecentQCList();
}

// ─── SHARED: ATTENDANCE FORM ─────────────────────────────────
function renderMarkAttendance(el) {
  el.innerHTML = `
  <div class="api-status"><span class="status-dot dot-green"></span>POST /api/attendance/mark</div>
  <div class="card">
    <div class="card-title">📅 Mark Attendance</div>
    <div class="form-group"><label>Worker</label>
      <select id="att_worker"><option value="">Loading workers…</option></select>
    </div>
    <div class="form-group"><label>Date</label><input id="att_date" type="date" value="${new Date().toISOString().slice(0, 10)}"/></div>
    <div class="form-group"><label>Status</label>
      <select id="att_status">
        <option value="Present">✅ Present</option>
        <option value="Late">⏰ Late</option>
        <option value="Absent">❌ Absent</option>
        <option value="Half Day">📋 Half Day</option>
        <option value="On Leave">🌴 On Leave</option>
      </select>
    </div>
    <button class="btn-submit" onclick="markAttendance()">Mark Attendance 📅</button>
  </div>
  <div class="card">
    <div class="card-title">📋 Today's Team Attendance</div>
    <div id="todayAttList"><div class="loading"><div><div class="spinner"></div></div></div></div>
  </div>`;
  // ✅ FIX: load real workers from API for dropdown
  loadAttendanceWorkers();
  loadTodayAttendance();
}

async function loadAttendanceWorkers() {
  const data = await apiFetch('/users?role=participant');
  const sel = document.getElementById('att_worker');
  if (!sel) return;
  if (!data || !data.length) {
    sel.innerHTML = '<option value="">No workers found</option>';
    return;
  }
  sel.innerHTML = data.map(u =>
    `<option value="${u.id}">${u.name} (${u.employee_id || '—'})</option>`
  ).join('');
}

async function loadTodayAttendance() {
  const el = document.getElementById('todayAttList');
  if (!el) return;
  const today = new Date().toISOString().slice(0, 10);
  const data  = await apiFetch('/attendance?date=' + today);
  const recs  = data || [];
  if (!recs.length) {
    el.innerHTML = '<div style="text-align:center;padding:16px;color:var(--text3);font-size:13px">No attendance records for today yet</div>';
    return;
  }
  el.innerHTML = recs.map(a => {
    const name = a.users?.name || a.workerName || 'Worker';
    return `<div class="list-item">
      <div class="item-avatar" style="background:linear-gradient(135deg,#3B82F6,#6C63FF)">${name[0]}</div>
      <div class="item-info"><h4>${name}</h4><p>Check-in: ${fmtTime(a.check_in || a.checkIn)}</p></div>
      <span class="badge-${(a.status || 'present').toLowerCase()}">${a.status || 'Present'}</span>
    </div>`;
  }).join('');
}

async function markAttendance() {
  const workerId = document.getElementById('att_worker').value;
  const date     = document.getElementById('att_date').value;
  const status   = document.getElementById('att_status').value;
  if (!workerId) { toast('⚠️ Select a worker'); return; }
  const data = await apiFetch('/attendance/mark', 'POST', { workerId, date, status });
  toast(data ? '✅ Attendance marked' : '❌ Failed to mark attendance');
  loadTodayAttendance();
}

// ─── SHARED: PRODUCTION REVIEW ───────────────────────────────
async function renderProductionReview(el) {
  const data = await apiFetch('/production');
  const logs = data || [];
  el.innerHTML = `
  <div class="api-status"><span class="status-dot ${data ? 'dot-green' : 'dot-gold'}"></span>${data ? 'Live' : 'Demo'} production logs</div>
  ${logs.length ? logs.map(l => {
    const workerName = l.users?.name || l.workerName || l.worker || 'Worker';
    const hours      = parseFloat(l.hours_worked || l.hoursWorked || 0);
    const units      = l.units_completed || l.unitsCompleted || 0;
    const taskType   = l.task_type || l.taskType || l.task || '—';
    const logId      = l.id || l._id || 'demo';
    return `<div class="card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
        <div><h4 style="font-size:14px;font-weight:700">${workerName}</h4>
        <p style="font-size:12px;color:var(--text2)">${taskType} • ${fmtDate(l.date || l.createdAt)}</p></div>
        <span class="badge-pending">${l.status || 'Pending'}</span>
      </div>
      <div style="display:flex;gap:12px;margin-bottom:12px">
        <div style="text-align:center;flex:1;background:#F8F9FF;border-radius:10px;padding:8px">
          <div style="font-size:18px;font-weight:800;color:var(--pri)">${hours}h</div>
          <div style="font-size:10px;color:var(--text3)">Hours</div>
        </div>
        <div style="text-align:center;flex:1;background:#F8F9FF;border-radius:10px;padding:8px">
          <div style="font-size:18px;font-weight:800;color:var(--pri)">${units}</div>
          <div style="font-size:10px;color:var(--text3)">Units</div>
        </div>
      </div>
      ${hours > 12 ? '<div style="background:var(--red-light);border-radius:8px;padding:8px;margin-bottom:10px;font-size:12px;color:var(--red);font-weight:600">⚠️ Hours exceed 12 — Fraud flag triggered</div>' : ''}
      ${l.status === 'approved' || l.status === 'rejected' ? `
        <div style="text-align:center;padding:8px;font-size:13px;font-weight:600;color:${l.status === 'approved' ? 'var(--green)' : 'var(--red)'}">
          ${l.status === 'approved' ? '✅ Already Approved' : '❌ Already Rejected'}
        </div>` : `
        <div style="display:flex;gap:8px">
          <button onclick="reviewProd('${logId}','approved')" style="flex:1;padding:10px;border:none;border-radius:10px;background:linear-gradient(135deg,var(--green),#06B6D4);color:#fff;font-weight:700;font-size:13px;cursor:pointer">✅ Approve</button>
          <button onclick="reviewProd('${logId}','rejected')" style="flex:1;padding:10px;border:none;border-radius:10px;background:linear-gradient(135deg,var(--red),#F59E0B);color:#fff;font-weight:700;font-size:13px;cursor:pointer">❌ Reject</button>
        </div>`}
    </div>`;
  }).join('') : '<div style="text-align:center;padding:32px;color:var(--text3)">No pending production logs</div>'}`;
}

async function reviewProd(id, action) {
  const data = await apiFetch('/production/' + id, 'PUT', { status: action });
  toast(data ? (action === 'approved' ? '✅ Production log approved' : '❌ Production log rejected') : '❌ Action failed — check API');
  // Refresh list
  const content = document.getElementById('supervisorContent') || document.getElementById('teamleaderContent');
  if (content) await renderProductionReview(content);
}

// ─── SHARED: TEAM LIST ───────────────────────────────────────
async function renderTeamList(el, label = 'team') {
  el.innerHTML = `
  <div class="api-status"><span class="status-dot dot-green"></span>GET /api/users</div>
  <div class="search-bar"><span>🔍</span><input placeholder="Search ${label}…" oninput="filterTeam(this.value)"/></div>
  <div id="teamMembersList"><div class="loading"><div><div class="spinner"></div>Loading team…</div></div></div>`;
  // ✅ FIX: load real team from API instead of demo data
  await loadTeamMembers(label);
}

async function loadTeamMembers(label) {
  const el = document.getElementById('teamMembersList');
  if (!el) return;
  const data = await apiFetch('/users?role=participant');
  const members = data || [];
  el._members = members;
  if (!members.length) {
    el.innerHTML = `<div style="text-align:center;padding:32px;color:var(--text3)">No ${label} members yet</div>`;
    return;
  }
  el.innerHTML = renderTeamRows(members);
}

function renderTeamRows(members) {
  return `<div class="card">
    <div class="card-title">👥 Team Members (${members.length})</div>
    ${members.map(m => `<div class="list-item">
      <div class="item-avatar" style="background:linear-gradient(135deg,#3B82F6,#6C63FF)">${m.name[0]}</div>
      <div class="item-info">
        <h4>${m.name} ${m.is_flagged ? '🚩' : ''}</h4>
        <p>${m.employee_id || '—'} • ${m.is_flagged ? 'Flagged' : 'Good standing'}</p>
      </div>
      <div class="item-right">
        <span class="${m.is_active ? 'badge-present' : 'badge-absent'}">${m.is_active ? 'Active' : 'Inactive'}</span>
      </div>
    </div>`).join('')}
  </div>`;
}

function filterTeam(q) {
  const el = document.getElementById('teamMembersList');
  if (!el || !el._members) return;
  const filtered = el._members.filter(m =>
    m.name.toLowerCase().includes(q.toLowerCase()) ||
    (m.employee_id || '').toLowerCase().includes(q.toLowerCase())
  );
  el.innerHTML = renderTeamRows(filtered);
}