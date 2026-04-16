// ─── PARTICIPANT DASHBOARD ────────────────────────────────────
async function loadParticipantDashboard() {
  const el = document.getElementById('participantContent');
  const data = await apiFetch('/dashboard/participant');
  // ✅ FIX: use ?? so real 0 values stay as 0
  const s = data || { hoursThisMonth: 0, avgQcScore: 0, daysPresent: 0, totalPaid: 0 };

  // ✅ FIX: check if already checked in today
  const todayStr = new Date().toISOString().slice(0, 10);
  const attData  = await apiFetch('/attendance?date=' + todayStr);
  const todayAtt = attData && attData.length ? attData[0] : null;
  const checkedIn  = !!todayAtt?.check_in;
  const checkedOut = !!todayAtt?.check_out;

  el.innerHTML = `
  <div class="api-status"><span class="status-dot ${data ? 'dot-green' : 'dot-gold'}"></span>${data ? 'Live' : 'Demo'}</div>
  <div class="welcome-banner" style="background:linear-gradient(135deg,#10B981 0%,#06B6D4 50%,#3B82F6 100%)">
    <h3>Good ${getGreeting()}, ${currentUser?.name || 'Worker'} 👋</h3>
    <p>${today()}</p>
    <span class="emp-id">${currentUser?.employee_id || '—'} • Team</span>
  </div>

  <div class="checkin-bar">
    ${checkedIn && checkedOut
      ? `<div style="flex:1;text-align:center;padding:14px;background:var(--green-light);border-radius:14px;color:var(--green);font-weight:700;font-size:14px">
           ✅ Checked in & out today
         </div>`
      : checkedIn
      ? `<div style="flex:1;text-align:center;padding:14px;background:var(--green-light);border-radius:14px;color:var(--green);font-weight:700;font-size:13px">
           ✅ Checked in at ${fmtTime(todayAtt?.check_in)}
         </div>
         <button class="checkin-btn out" onclick="doCheckOut()">🏁 Check Out</button>`
      : `<button class="checkin-btn in" onclick="doCheckIn()">⏰ Check In</button>
         <button class="checkin-btn out" onclick="doCheckOut()" disabled style="opacity:0.5;cursor:not-allowed">🏁 Check Out</button>`
    }
  </div>

  <div class="stat-grid">
    <div class="stat-card s-teal"><span class="stat-icon">⏱️</span><div class="stat-val">${s.hoursThisMonth ?? 0}h</div><div class="stat-label">Hours This Month</div></div>
    <div class="stat-card s-green"><span class="stat-icon">✅</span><div class="stat-val">${s.avgQcScore ?? 0}%</div><div class="stat-label">Avg QC Score</div></div>
    <div class="stat-card s-blue"><span class="stat-icon">📅</span><div class="stat-val">${s.daysPresent ?? 0}</div><div class="stat-label">Days Present</div></div>
    <div class="stat-card s-pink"><span class="stat-icon">💸</span><div class="stat-val">${fmtINR(s.totalPaid ?? 0)}</div><div class="stat-label">Total Paid</div></div>
  </div>

  <div class="card">
    <div class="card-title">✅ My Recent QC Results</div>
    <div id="myRecentQC"><div class="loading"><div><div class="spinner"></div></div></div></div>
  </div>

  <div class="card">
    <div class="card-title">💰 Recent Payments</div>
    <div id="myRecentPay"><div class="loading"><div><div class="spinner"></div></div></div></div>
  </div>`;

  // ✅ FIX: load real QC and payment data
  loadMyRecentQC();
  loadMyRecentPayments();
}

async function loadMyRecentQC() {
  const el = document.getElementById('myRecentQC');
  if (!el) return;
  const data = await apiFetch('/qc');
  const recs = data ? data.slice(0, 3) : [];
  if (!recs.length) {
    el.innerHTML = '<div style="text-align:center;padding:16px;color:var(--text3);font-size:13px">No QC results yet</div>';
    return;
  }
  el.innerHTML = recs.map(q => {
    const score = parseFloat(q.score);
    const st = qcStatus(score);
    return `<div class="list-item">
      <div style="width:42px;height:42px;border-radius:14px;background:${score >= 90 ? 'linear-gradient(135deg,var(--green),#06B6D4)' : score >= 70 ? 'linear-gradient(135deg,var(--gold),#EF4444)' : 'linear-gradient(135deg,var(--red),#F59E0B)'};display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff;font-size:12px;flex-shrink:0">${score}%</div>
      <div class="item-info"><h4>${q.task_type || q.task || '—'}</h4><p>${q.samples_checked || q.checked || 0} samples</p></div>
      <div class="item-right"><span class="${st.cls}">${st.label}</span></div>
    </div>`;
  }).join('');
}

async function loadMyRecentPayments() {
  const el = document.getElementById('myRecentPay');
  if (!el) return;
  const data = await apiFetch('/payments');
  const pays = data ? data.slice(0, 2) : [];
  if (!pays.length) {
    el.innerHTML = '<div style="text-align:center;padding:16px;color:var(--text3);font-size:13px">No payments yet</div>';
    return;
  }
  el.innerHTML = pays.map(p => `
    <div class="pay-card">
      <div class="pay-amount">${fmtINR(p.total_amount || p.amount)}</div>
      <div class="pay-label">${getMonthName(p.month)} ${p.year} • ${p.notes || 'Monthly Payroll'}</div>
      <div class="pay-detail">
        <span>📅 ${fmtDate(p.created_at || p.createdAt)}</span>
        <span>✅ ${p.status || 'Paid'}</span>
        <span>Base ${fmtINR(p.base_amount)}</span>
        ${parseFloat(p.bonus) > 0 ? `<span>+${fmtINR(p.bonus)} Bonus</span>` : ''}
        ${parseFloat(p.deduction) > 0 ? `<span>-${fmtINR(p.deduction)} Deduction</span>` : ''}
      </div>
    </div>`).join('');
}

function getMonthName(m) {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return months[(parseInt(m) - 1)] || '—';
}

// ✅ FIX: check-in with proper state update
async function doCheckIn() {
  const data = await apiFetch('/attendance/checkin', 'POST', {});
  if (data) {
    toast('✅ Checked in at ' + fmtTime(new Date()));
    loadParticipantDashboard(); // refresh to show state
  } else {
    toast('⚠️ Already checked in today or API error');
  }
}

// ✅ FIX: check-out with proper state update
async function doCheckOut() {
  const data = await apiFetch('/attendance/checkout', 'PUT', {});
  if (data) {
    toast('🏁 Checked out — ' + (data.attendance?.hours_worked || 0) + 'h logged');
    loadParticipantDashboard(); // refresh to show state
  } else {
    toast('⚠️ Check in first or already checked out');
  }
}

async function partTab(tab, el) {
  const nav = document.querySelector('#participantScreen .bottom-nav');
  setNavActive(nav, el);
  const content = document.getElementById('participantContent');
  if (tab === 'dashboard') { loadParticipantDashboard(); return; }
  content.innerHTML = '<div class="loading"><div><div class="spinner"></div>Loading…</div></div>';
  if (tab === 'production')  renderProductionForm(content);
  else if (tab === 'qcresults')  await renderMyQCResults(content);
  else if (tab === 'payments')   await renderMyPayments(content);
  else if (tab === 'attendance') await renderMyAttendance(content);
}

// ─── PRODUCTION FORM ─────────────────────────────────────────
function renderProductionForm(el) {
  el.innerHTML = `
  <div class="api-status"><span class="status-dot dot-green"></span>POST /api/production</div>
  <div class="card">
    <div class="card-title">📋 Submit Production Entry</div>
    <div class="form-group"><label>Date</label><input id="prod_date" type="date" value="${new Date().toISOString().slice(0, 10)}"/></div>
    <div class="form-group"><label>Task Type</label><input id="prod_task" placeholder="e.g. Data Entry, Assembly, Packaging"/></div>
    <div class="form-group"><label>Hours Worked</label><input id="prod_hours" type="number" step="0.5" max="16" placeholder="e.g. 8" oninput="checkHoursFraud(this.value)"/></div>
    <div id="hours_warn" style="display:none;background:var(--red-light);border-radius:8px;padding:8px;margin-bottom:10px;font-size:12px;color:var(--red);font-weight:600">⚠️ Hours exceed 12 — This will trigger a fraud flag!</div>
    <div class="form-group"><label>Units Completed</label><input id="prod_units" type="number" placeholder="e.g. 120"/></div>
    <div class="form-group"><label>Notes (optional)</label><textarea id="prod_notes" placeholder="Any observations…"></textarea></div>
    <button class="btn-submit" onclick="submitProduction()">Submit Entry 📋</button>
  </div>
  <div class="card">
    <div class="card-title">📊 My Recent Submissions</div>
    <div id="myRecentProd"><div class="loading"><div><div class="spinner"></div></div></div></div>
  </div>`;
  // ✅ FIX: load real production logs from API
  loadMyRecentProduction();
}

async function loadMyRecentProduction() {
  const el = document.getElementById('myRecentProd');
  if (!el) return;
  const data = await apiFetch('/production');
  const logs = data ? data.slice(0, 3) : [];
  if (!logs.length) {
    el.innerHTML = '<div style="text-align:center;padding:16px;color:var(--text3);font-size:13px">No submissions yet</div>';
    return;
  }
  el.innerHTML = logs.map(l => `<div class="list-item">
    <div class="item-avatar" style="background:linear-gradient(135deg,#10B981,#06B6D4)">📋</div>
    <div class="item-info">
      <h4>${l.task_type || l.taskType || '—'}</h4>
      <p>${l.hours_worked || l.hoursWorked || 0}h • ${l.units_completed || l.unitsCompleted || 0} units • ${fmtDate(l.date || l.createdAt)}</p>
    </div>
    <span class="badge-${(l.status || 'pending').toLowerCase()}">${l.status || 'Pending'}</span>
  </div>`).join('');
}

function checkHoursFraud(v) {
  const w = document.getElementById('hours_warn');
  if (w) w.style.display = parseFloat(v) > 12 ? 'block' : 'none';
}

async function submitProduction() {
  const taskType       = document.getElementById('prod_task').value;
  const hoursWorked    = parseFloat(document.getElementById('prod_hours').value);
  const unitsCompleted = parseInt(document.getElementById('prod_units').value);
  const notes          = document.getElementById('prod_notes').value;
  const date           = document.getElementById('prod_date').value;
  if (!taskType || !hoursWorked || !unitsCompleted) { toast('⚠️ Fill all required fields'); return; }
  const data = await apiFetch('/production', 'POST', { taskType, hoursWorked, unitsCompleted, notes, date });
  if (data) {
    toast('✅ Production entry submitted — awaiting approval');
    if (hoursWorked > 12) setTimeout(() => toast('🚨 Fraud flag triggered — hours exceed 12!'), 600);
    // Clear form
    document.getElementById('prod_task').value  = '';
    document.getElementById('prod_hours').value = '';
    document.getElementById('prod_units').value = '';
    document.getElementById('prod_notes').value = '';
    // Refresh recent list
    loadMyRecentProduction();
  } else {
    toast('❌ Submission failed — check API connection');
  }
}

// ─── MY QC RESULTS ───────────────────────────────────────────
async function renderMyQCResults(el) {
  const data = await apiFetch('/qc');
  const recs = data || [];
  // ✅ FIX: calculate real avg from API data
  const avg = recs.length
    ? Math.round(recs.reduce((s, q) => s + parseFloat(q.score), 0) / recs.length)
    : 0;
  el.innerHTML = `
  <div class="api-status"><span class="status-dot ${data ? 'dot-green' : 'dot-gold'}"></span>GET /api/qc</div>
  <div class="stat-grid">
    <div class="stat-card s-green"><span class="stat-icon">✅</span><div class="stat-val">${avg}%</div><div class="stat-label">Avg Score</div></div>
    <div class="stat-card s-blue"><span class="stat-icon">📊</span><div class="stat-val">${recs.length}</div><div class="stat-label">Total Checks</div></div>
  </div>
  <div class="card">
    <div class="card-title">✅ My QC Results</div>
    ${recs.length ? recs.map(q => {
      const score = parseFloat(q.score);
      const st = qcStatus(score);
      return `<div class="list-item">
        <div class="item-avatar" style="background:${score >= 90 ? 'linear-gradient(135deg,var(--green),#06B6D4)' : score >= 70 ? 'linear-gradient(135deg,var(--gold),#EF4444)' : 'linear-gradient(135deg,var(--red),#F59E0B)'};font-size:12px;font-weight:700;color:#fff">${score}%</div>
        <div class="item-info"><h4>${q.task_type || q.task || '—'}</h4><p>${q.samples_checked || q.checked || 0} samples • ${fmtDate(q.created_at || q.createdAt)}</p></div>
        <span class="${st.cls}">${st.label}</span>
      </div>`;
    }).join('') : '<div style="text-align:center;padding:24px;color:var(--text3)">No QC results yet</div>'}
  </div>`;
}

// ─── MY PAYMENTS ─────────────────────────────────────────────
async function renderMyPayments(el) {
  const data = await apiFetch('/payments');
  const pays = data || [];
  const total = pays.reduce((s, p) => s + parseFloat(p.total_amount || p.amount || 0), 0);
  el.innerHTML = `
  <div class="api-status"><span class="status-dot ${data ? 'dot-green' : 'dot-gold'}"></span>GET /api/payments</div>
  <div class="stat-grid">
    <div class="stat-card s-green"><span class="stat-icon">💰</span><div class="stat-val">${fmtINR(total)}</div><div class="stat-label">Total Received</div></div>
    <div class="stat-card s-blue"><span class="stat-icon">📅</span><div class="stat-val">${pays.length}</div><div class="stat-label">Payments</div></div>
  </div>
  ${pays.length ? pays.map(p => `
    <div class="pay-card">
      <div class="pay-amount">${fmtINR(p.total_amount || p.amount)}</div>
      <div class="pay-label">${getMonthName(p.month)} ${p.year} • ${p.notes || 'Monthly Payroll'}</div>
      <div class="pay-detail">
        <span>✅ ${p.status || 'Paid'}</span>
        <span>Base ${fmtINR(p.base_amount)}</span>
        ${parseFloat(p.bonus) > 0 ? `<span>+${fmtINR(p.bonus)} Bonus</span>` : ''}
        ${parseFloat(p.deduction) > 0 ? `<span>-${fmtINR(p.deduction)} Deduction</span>` : ''}
      </div>
    </div>`).join('') : '<div style="text-align:center;padding:32px;color:var(--text3)">No payments yet</div>'}`;
}

// ─── MY ATTENDANCE ───────────────────────────────────────────
async function renderMyAttendance(el) {
  const data = await apiFetch('/attendance');
  const recs = data || [];
  // ✅ FIX: real counts from actual API data
  const present = recs.filter(r => r.status === 'Present').length;
  const late    = recs.filter(r => r.status === 'Late').length;
  const absent  = recs.filter(r => r.status === 'Absent').length;
  el.innerHTML = `
  <div class="api-status"><span class="status-dot ${data ? 'dot-green' : 'dot-gold'}"></span>GET /api/attendance</div>
  <div class="att-row">
    <div class="att-box s-green" style="border-radius:12px"><div class="att-num">${present}</div><div class="att-label">Present</div></div>
    <div class="att-box" style="border-radius:12px;background:linear-gradient(135deg,#F59E0B,#EF4444)"><div class="att-num">${late}</div><div class="att-label">Late</div></div>
    <div class="att-box s-red" style="border-radius:12px"><div class="att-num">${absent}</div><div class="att-label">Absent</div></div>
  </div>
  <div class="card">
    <div class="card-title">📅 My Attendance Records</div>
    ${recs.length ? recs.map(a => `<div class="list-item">
      <div class="item-avatar" style="background:linear-gradient(135deg,#10B981,#06B6D4)">📅</div>
      <div class="item-info">
        <h4>${fmtDate(a.date || a.createdAt)}</h4>
        <p>In: ${fmtTime(a.check_in || a.checkIn)} • Out: ${fmtTime(a.check_out || a.checkOut)}</p>
      </div>
      <span class="badge-${(a.status || 'present').toLowerCase()}">${a.status || 'Present'}</span>
    </div>`).join('') : '<div style="text-align:center;padding:24px;color:var(--text3)">No attendance records yet</div>'}
  </div>`;
}