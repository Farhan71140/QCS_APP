const API = 'http://localhost:5000/api';
let token = '', currentUser = null, prevScreen = '';

// ─── UTILITIES ───────────────────────────────────────────────
function toast(msg, dur = 3000) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), dur);
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function goBack() { showScreen(prevScreen || 'loginScreen'); }

function setNavActive(nav, el) {
  nav.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  el.classList.add('active');
}

function closeModal(e) {
  if (e.target === document.getElementById('modalOverlay'))
    document.getElementById('modalOverlay').style.display = 'none';
}

function showModal(html) {
  document.getElementById('modalContent').innerHTML = html;
  document.getElementById('modalOverlay').style.display = 'flex';
}

function closeModalDirect() {
  document.getElementById('modalOverlay').style.display = 'none';
}

async function apiFetch(path, method = 'GET', body = null) {
  try {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (token) opts.headers['Authorization'] = `Bearer ${token}`;
    if (body) opts.body = JSON.stringify(body);
    const r = await fetch(API + path, opts);
    const d = await r.json();
    if (!r.ok) throw new Error(d.message || 'API Error');
    return d;
  } catch (e) {
    console.warn('API:', path, e.message);
    return null;
  }
}

function fmtINR(n) { return '₹' + Number(n || 0).toLocaleString('en-IN'); }
function fmtDate(d) { return d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'; }
function fmtTime(d) { return d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'; }
function today() { return new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); }
function getGreeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Morning' : h < 17 ? 'Afternoon' : 'Evening';
}
function qcStatus(score) {
  if (score >= 90) return { label: 'PASS ✅', cls: 'badge-pass', color: 'var(--green)' };
  if (score >= 70) return { label: 'WARNING ⚠️', cls: 'badge-warn', color: 'var(--gold)' };
  return { label: 'FAIL ❌', cls: 'badge-fail', color: 'var(--red)' };
}

// ─── LOGIN ───────────────────────────────────────────────────
function setRole(r) {
  const creds = {
    admin: { email: 'admin@workforceos.com', pass: 'Admin@123' },
    supervisor: { email: 'priya@workforceos.com', pass: 'Pass@123' },
    teamleader: { email: 'leader@workforceos.com', pass: 'Pass@123' },
    participant: { email: 'anita@workforceos.com', pass: 'Pass@123' }
  };
  document.querySelectorAll('.role-pill').forEach(p => p.classList.remove('active'));
  event.target.classList.add('active');
  document.getElementById('loginEmail').value = creds[r].email;
  document.getElementById('loginPassword').value = creds[r].pass;
}

async function doLogin() {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  if (!email || !password) { toast('⚠️ Enter email and password'); return; }
  const btn = document.querySelector('#loginScreen .btn-primary');
  btn.textContent = 'Signing in…'; btn.disabled = true;
  try {
    const data = await apiFetch('/auth/login', 'POST', { email, password });
    if (data && data.token) {
      token = data.token; currentUser = data.user;
      toast('✅ Welcome back, ' + currentUser.name + '!');
      routeToDashboard(currentUser.role);
    } else {
      simulateLogin(email);
    }
  } catch (e) { simulateLogin(email); }
  btn.textContent = 'Sign In →'; btn.disabled = false;
}

function simulateLogin(email) {
  const roleMap = {
    'admin@workforceos.com': { role: 'admin', name: 'Admin User', id: 'EMP-0001' },
    'priya@workforceos.com': { role: 'supervisor', name: 'Priya Sharma', id: 'EMP-0101' },
    'leader@workforceos.com': { role: 'teamleader', name: 'Ravi Kumar', id: 'EMP-0102' },
    'anita@workforceos.com': { role: 'participant', name: 'Anita Singh', id: 'EMP-1001' }
  };
  const u = roleMap[email] || { role: 'participant', name: 'Worker', id: 'EMP-9999' };
  currentUser = { ...u, email };
  token = 'demo-token';
  toast('✅ Welcome, ' + currentUser.name + '!');
  routeToDashboard(currentUser.role);
}

function routeToDashboard(role) {
  const map = { admin: 'adminScreen', supervisor: 'supervisorScreen', teamleader: 'teamleaderScreen', participant: 'participantScreen' };
  showScreen(map[role] || 'participantScreen');
  if (role === 'admin') loadAdminDashboard();
  else if (role === 'supervisor') loadSupervisorDashboard();
  else if (role === 'teamleader') loadTeamLeaderDashboard();
  else loadParticipantDashboard();
}

// ─── ADMIN DASHBOARD ─────────────────────────────────────────
async function loadAdminDashboard() {
  const el = document.getElementById('adminContent');
  const data = await apiFetch('/dashboard/admin');
  const stats = data || { totalWorkers: 47, qcPassRate: 87, totalPaidOut: 705000, fraudFlags: 3, presentToday: 38, lateToday: 6, absentToday: 3, qcPassed: 142, qcWarning: 18, qcFailed: 7 };
  el.innerHTML = `
  <div class="api-status"><span class="status-dot ${data ? 'dot-green' : 'dot-gold'}"></span>${data ? 'Live API Connected' : 'Demo Mode — API offline'}</div>
  <div class="welcome-banner">
    <h3>Good ${getGreeting()}, Admin 👋</h3>
    <p>${today()}</p>
    <span class="emp-id">QM WorkForce OS v2.0</span>
  </div>
  <div class="stat-grid">
    <div class="stat-card s-purple"><span class="stat-icon">👥</span><div class="stat-val">${stats.totalWorkers || 47}</div><div class="stat-label">Active Workers</div></div>
    <div class="stat-card s-green"><span class="stat-icon">✅</span><div class="stat-val">${stats.qcPassRate || 87}%</div><div class="stat-label">QC Pass Rate</div></div>
    <div class="stat-card s-pink"><span class="stat-icon">💸</span><div class="stat-val">${fmtINR(stats.totalPaidOut || 705000)}</div><div class="stat-label">Total Paid Out</div><div class="stat-sub">This month</div></div>
    <div class="stat-card s-red"><span class="stat-icon">⚠️</span><div class="stat-val">${stats.fraudFlags || 3}</div><div class="stat-label">Fraud Flags</div></div>
  </div>
  <div class="card">
    <div class="card-title">📅 Today's Attendance</div>
    <div class="att-row">
      <div class="att-box s-green" style="border-radius:12px"><div class="att-num">${stats.presentToday || 38}</div><div class="att-label">Present</div></div>
      <div class="att-box s-gold" style="border-radius:12px;background:linear-gradient(135deg,#F59E0B,#EF4444)"><div class="att-num">${stats.lateToday || 6}</div><div class="att-label">Late</div></div>
      <div class="att-box s-red" style="border-radius:12px"><div class="att-num">${stats.absentToday || 3}</div><div class="att-label">Absent</div></div>
    </div>
  </div>
  <div class="card">
    <div class="card-title">📊 QC Overview</div>
    <div style="display:flex;flex-direction:column;gap:10px">
      <div>
        <div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="font-size:13px;color:var(--text2)">✅ Passed</span><span style="font-size:13px;font-weight:700;color:var(--green)">${stats.qcPassed || 142}</span></div>
        <div class="prog-bar"><div class="prog-fill" style="width:${Math.round((stats.qcPassed || 142) / ((stats.qcPassed || 142) + (stats.qcWarning || 18) + (stats.qcFailed || 7)) * 100)}%;background:var(--green)"></div></div>
      </div>
      <div>
        <div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="font-size:13px;color:var(--text2)">⚠️ Warning</span><span style="font-size:13px;font-weight:700;color:var(--gold)">${stats.qcWarning || 18}</span></div>
        <div class="prog-bar"><div class="prog-fill" style="width:${Math.round((stats.qcWarning || 18) / ((stats.qcPassed || 142) + (stats.qcWarning || 18) + (stats.qcFailed || 7)) * 100)}%;background:var(--gold)"></div></div>
      </div>
      <div>
        <div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="font-size:13px;color:var(--text2)">❌ Failed</span><span style="font-size:13px;font-weight:700;color:var(--red)">${stats.qcFailed || 7}</span></div>
        <div class="prog-bar"><div class="prog-fill" style="width:${Math.round((stats.qcFailed || 7) / ((stats.qcPassed || 142) + (stats.qcWarning || 18) + (stats.qcFailed || 7)) * 100)}%;background:var(--red)"></div></div>
      </div>
    </div>
  </div>
  <div class="sec-header"><h3>⚡ Quick Actions</h3></div>
  <div class="action-grid">
    <button class="action-btn ab-purple" onclick="showAddUser()"><span class="a-icon">➕</span><span class="a-label">Add User</span><span class="a-sub">Create account</span></button>
    <button class="action-btn ab-pink" onclick="runPayroll()"><span class="a-icon">💸</span><span class="a-label">Run Payroll</span><span class="a-sub">Monthly batch</span></button>
    <button class="action-btn ab-green" onclick="exportCSV()"><span class="a-icon">📥</span><span class="a-label">Export CSV</span><span class="a-sub">Download data</span></button>
    <button class="action-btn ab-blue" onclick="adminTab('fraud',document.querySelector('#adminNav .nav-item:nth-child(5)'))"><span class="a-icon">🚨</span><span class="a-label">Fraud Log</span><span class="a-sub">Review flags</span></button>
  </div>
  <div class="fraud-card">
    <span class="fraud-icon">🚨</span>
    <div><h4>Ramesh K. — Flagged</h4><p>Hours over-reported • EMP-1023</p></div>
    <button class="unflag-btn" onclick="unflagUser('EMP-1023')">Unflag</button>
  </div>
  <div class="fraud-card">
    <span class="fraud-icon">⚠️</span>
    <div><h4>Sunita R. — Low QC</h4><p>QC Score: 62% • EMP-1031</p></div>
    <button class="unflag-btn" onclick="unflagUser('EMP-1031')">Unflag</button>
  </div>`;
}

async function adminTab(tab, el) {
  const nav = document.getElementById('adminNav');
  setNavActive(nav, el);
  const content = document.getElementById('adminContent');
  if (tab === 'dashboard') { loadAdminDashboard(); return; }
  content.innerHTML = '<div class="loading"><div><div class="spinner"></div>Loading ' + tab + '…</div></div>';
  if (tab === 'users') await loadAdminUsers(content);
  else if (tab === 'attendance') await loadAdminAttendance(content);
  else if (tab === 'payments') await loadAdminPayments(content);
  else if (tab === 'fraud') await loadAdminFraud(content);
}

async function loadAdminUsers(el) {
  const data = await apiFetch('/users');
  const users = data || getDemoUsers();
  el.innerHTML = `
  <div class="api-status"><span class="status-dot ${data ? 'dot-green' : 'dot-gold'}"></span>${data ? 'Live' : 'Demo'} • ${users.length} users</div>
  <div class="search-bar"><span>🔍</span><input placeholder="Search users…" oninput="filterUsers(this.value)"/></div>
  <div id="usersList">${renderUsers(users)}</div>`;
  el._users = users;
}

function getDemoUsers() {
  return [
    { name: 'Priya Sharma', email: 'priya@workforceos.com', role: 'supervisor', employeeId: 'EMP-0101', isActive: true, isFlagged: false },
    { name: 'Anita Singh', email: 'anita@workforceos.com', role: 'participant', employeeId: 'EMP-1001', isActive: true, isFlagged: false },
    { name: 'Ramesh Kumar', email: 'ramesh@workforceos.com', role: 'participant', employeeId: 'EMP-1023', isActive: true, isFlagged: true },
    { name: 'Sunita Rao', email: 'sunita@workforceos.com', role: 'participant', employeeId: 'EMP-1031', isActive: true, isFlagged: true },
    { name: 'Ravi Patel', email: 'ravi@workforceos.com', role: 'teamleader', employeeId: 'EMP-0102', isActive: true, isFlagged: false },
  ];
}

function renderUsers(users) {
  return users.map(u => `
  <div class="list-item">
    <div class="item-avatar" style="background:${roleColor(u.role)}">${u.name[0]}</div>
    <div class="item-info">
      <h4>${u.name} ${u.isFlagged ? '🚩' : ''}</h4>
      <p>${u.employeeId} • <span style="text-transform:capitalize">${u.role}</span></p>
    </div>
    <div class="item-right">
      <span class="${u.isActive ? 'badge-present' : 'badge-absent'}">${u.isActive ? 'Active' : 'Inactive'}</span>
      ${u.isFlagged ? `<div style="margin-top:4px"><button onclick="unflagUser('${u.employeeId}')" style="font-size:11px;padding:3px 8px;border:none;border-radius:6px;background:var(--green-light);color:var(--green);cursor:pointer;font-weight:600">Unflag</button></div>` : ''}
    </div>
  </div>`).join('');
}

function filterUsers(q) {
  const el = document.getElementById('usersList');
  const content = document.getElementById('adminContent');
  const users = content._users || getDemoUsers();
  const filtered = users.filter(u => u.name.toLowerCase().includes(q.toLowerCase()) || u.employeeId.toLowerCase().includes(q.toLowerCase()));
  el.innerHTML = renderUsers(filtered);
}

function roleColor(r) {
  const m = { admin: 'linear-gradient(135deg,#6C63FF,#A855F7)', supervisor: 'linear-gradient(135deg,#3B82F6,#6C63FF)', teamleader: 'linear-gradient(135deg,#F59E0B,#EF4444)', participant: 'linear-gradient(135deg,#10B981,#06B6D4)' };
  return m[r] || m.participant;
}

async function loadAdminAttendance(el) {
  const data = await apiFetch('/attendance');
  const recs = data || getDemoAttendance();
  el.innerHTML = `
  <div class="api-status"><span class="status-dot ${data ? 'dot-green' : 'dot-gold'}"></span>${data ? 'Live' : 'Demo'} attendance</div>
  <div class="stat-grid">
    <div class="stat-card s-green"><span class="stat-icon">✅</span><div class="stat-val">38</div><div class="stat-label">Present Today</div></div>
    <div class="stat-card s-red"><span class="stat-icon">❌</span><div class="stat-val">3</div><div class="stat-label">Absent Today</div></div>
  </div>
  <div class="card"><div class="card-title">📅 Attendance Records</div>
  ${recs.map(r => `<div class="list-item">
    <div class="item-avatar" style="background:${roleColor('participant')}">${(r.workerName || r.worker || 'W')[0]}</div>
    <div class="item-info"><h4>${r.workerName || r.worker || 'Worker'}</h4><p>${fmtDate(r.date || r.createdAt)} • ${fmtTime(r.checkIn)}</p></div>
    <div class="item-right"><span class="badge-${(r.status || 'present').toLowerCase()}">${r.status || 'Present'}</span></div>
  </div>`).join('')}
  </div>`;
}

function getDemoAttendance() {
  return [
    { workerName: 'Anita Singh', date: new Date(), checkIn: new Date('2026-04-12T09:10'), status: 'Present' },
    { workerName: 'Ramesh Kumar', date: new Date(), checkIn: new Date('2026-04-12T09:45'), status: 'Late' },
    { workerName: 'Sunita Rao', date: new Date(), checkIn: null, status: 'Absent' },
    { workerName: 'Vijay M.', date: new Date(), checkIn: new Date('2026-04-12T09:00'), status: 'Present' },
  ];
}

async function loadAdminPayments(el) {
  const data = await apiFetch('/payments');
  const pays = data || getDemoPayments();
  el.innerHTML = `
  <div class="api-status"><span class="status-dot ${data ? 'dot-green' : 'dot-gold'}"></span>${data ? 'Live' : 'Demo'} payments</div>
  <div class="stat-grid">
    <div class="stat-card s-green"><span class="stat-icon">💰</span><div class="stat-val">₹7.05L</div><div class="stat-label">Total Paid</div><div class="stat-sub">This month</div></div>
    <div class="stat-card s-blue"><span class="stat-icon">👥</span><div class="stat-val">47</div><div class="stat-label">Workers Paid</div></div>
  </div>
  <div class="card"><div class="card-title">💸 Payment Records</div>
  ${pays.map(p => `<div class="list-item">
    <div class="item-avatar" style="background:linear-gradient(135deg,var(--green),#06B6D4)">💸</div>
    <div class="item-info"><h4>${p.workerName || p.worker || 'Worker'}</h4><p>${fmtDate(p.date || p.createdAt)} • ${p.notes || 'Monthly payroll'}</p></div>
    <div class="item-right"><div class="val">${fmtINR(p.amount)}</div><span class="badge-pass" style="font-size:10px">${p.status || 'Paid'}</span></div>
  </div>`).join('')}
  </div>
  <button class="btn-submit" onclick="runPayroll()">💸 Run Payroll Now</button>`;
}

function getDemoPayments() {
  return [
    { workerName: 'Anita Singh', amount: 17000, date: new Date(), status: 'Paid', notes: 'Base + Bonus' },
    { workerName: 'Vijay M.', amount: 17000, date: new Date(), status: 'Paid', notes: 'Base + Bonus' },
    { workerName: 'Ramesh Kumar', amount: 12000, date: new Date(), status: 'Paid', notes: 'Base - Deduction (Flagged)' },
    { workerName: 'Sunita Rao', amount: 12000, date: new Date(), status: 'Paid', notes: 'Base - Deduction (Flagged)' },
  ];
}

async function loadAdminFraud(el) {
  await apiFetch('/users?flagged=true');
  el.innerHTML = `
  <div class="api-status"><span class="status-dot dot-red"></span>3 Active Fraud Flags</div>
  <div class="card" style="border:1.5px solid #FECACA">
    <div class="card-title" style="color:var(--red)">🚨 Flagged Workers</div>
    <div class="list-item">
      <div class="item-avatar" style="background:linear-gradient(135deg,var(--red),#F59E0B)">R</div>
      <div class="item-info"><h4>Ramesh Kumar 🚩</h4><p>Hours over-reported (14h) • EMP-1023</p></div>
      <button onclick="unflagUser('EMP-1023')" style="padding:8px 14px;border:none;border-radius:8px;background:var(--green);color:#fff;font-weight:700;font-size:12px;cursor:pointer">Unflag</button>
    </div>
    <div class="list-item">
      <div class="item-avatar" style="background:linear-gradient(135deg,var(--red),#F59E0B)">S</div>
      <div class="item-info"><h4>Sunita Rao 🚩</h4><p>QC Score 62% — below threshold • EMP-1031</p></div>
      <button onclick="unflagUser('EMP-1031')" style="padding:8px 14px;border:none;border-radius:8px;background:var(--green);color:#fff;font-weight:700;font-size:12px;cursor:pointer">Unflag</button>
    </div>
    <div class="list-item" style="border-bottom:none">
      <div class="item-avatar" style="background:linear-gradient(135deg,var(--red),#F59E0B)">M</div>
      <div class="item-info"><h4>Mohan Das 🚩</h4><p>Excessive daily hours (17h) • EMP-1044</p></div>
      <button onclick="unflagUser('EMP-1044')" style="padding:8px 14px;border:none;border-radius:8px;background:var(--green);color:#fff;font-weight:700;font-size:12px;cursor:pointer">Unflag</button>
    </div>
  </div>`;
}

async function unflagUser(id) {
  const data = await apiFetch('/users/' + id + '/flag', 'PUT', { flagged: false });
  toast(data ? '✅ Worker unflagged successfully' : '✅ Worker unflagged (demo)');
  loadAdminDashboard();
}

async function runPayroll() {
  toast('⏳ Processing payroll…');
  const data = await apiFetch('/payments/batch', 'POST', { month: new Date().getMonth() + 1, year: new Date().getFullYear() });
  setTimeout(() => {
    toast(data ? '✅ Payroll complete! ' + (data.count || 47) + ' payments processed' : '✅ Payroll processed (demo) — 47 payments at ₹15,000 base');
  }, 1200);
}

async function exportCSV() {
  const data = await apiFetch('/users');
  const users = data || getDemoUsers();
  const rows = [['Name', 'Email', 'Role', 'Employee ID', 'Status', 'Flagged'], ...users.map(u => [u.name, u.email, u.role, u.employeeId, u.isActive ? 'Active' : 'Inactive', u.isFlagged ? 'Yes' : 'No'])];
  const csv = rows.map(r => r.join(',')).join('\n');
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = 'QM_Workers_' + new Date().toISOString().slice(0, 10) + '.csv';
  a.click();
  toast('📥 CSV exported successfully');
}

function showAddUser() {
  showModal(`
  <div class="modal-title">➕ Add New User</div>
  <div class="form-group"><label>Full Name</label><input id="nu_name" placeholder="Enter full name"/></div>
  <div class="form-group"><label>Email</label><input id="nu_email" type="email" placeholder="email@company.com"/></div>
  <div class="form-group"><label>Password</label><input id="nu_pass" type="password" placeholder="Min 8 characters"/></div>
  <div class="form-group"><label>Role</label>
    <select id="nu_role">
      <option value="participant">👤 Participant (Worker)</option>
      <option value="supervisor">👁️ Supervisor</option>
      <option value="teamleader">🏆 Team Leader</option>
      <option value="admin">🛡️ Admin</option>
    </select>
  </div>
  <div class="form-group"><label>Employee ID</label><input id="nu_empid" placeholder="EMP-1001"/></div>
  <button class="btn-submit" onclick="createUser()">Create User</button>
  <button class="btn-outline" onclick="closeModalDirect()">Cancel</button>`);
}

async function createUser() {
  const name = document.getElementById('nu_name').value;
  const email = document.getElementById('nu_email').value;
  const password = document.getElementById('nu_pass').value;
  const role = document.getElementById('nu_role').value;
  const employeeId = document.getElementById('nu_empid').value;
  if (!name || !email || !password) { toast('⚠️ Fill all required fields'); return; }
  const data = await apiFetch('/users', 'POST', { name, email, password, role, employeeId });
  closeModalDirect();
  toast(data ? '✅ User created: ' + name : '✅ User created (demo): ' + name);
}

// ─── SUPERVISOR DASHBOARD ─────────────────────────────────────
async function loadSupervisorDashboard() {
  const el = document.getElementById('supervisorContent');
  const data = await apiFetch('/dashboard/supervisor');
  const s = data || { teamSize: 12, presentToday: 9, avgQcScore: 84, flaggedMembers: 1 };
  el.innerHTML = `
  <div class="api-status"><span class="status-dot ${data ? 'dot-green' : 'dot-gold'}"></span>${data ? 'Live API' : 'Demo Mode'}</div>
  <div class="welcome-banner" style="background:linear-gradient(135deg,#3B82F6 0%,#6C63FF 60%,#A855F7 100%)">
    <h3>Hi, Priya 👋</h3>
    <p>Supervisor • ${today()}</p>
    <span class="emp-id">EMP-0101 • Team Alpha</span>
  </div>
  <div class="stat-grid">
    <div class="stat-card s-blue"><span class="stat-icon">👥</span><div class="stat-val">${s.teamSize || 12}</div><div class="stat-label">My Team</div></div>
    <div class="stat-card s-green"><span class="stat-icon">📅</span><div class="stat-val">${s.presentToday || 9}</div><div class="stat-label">Present Today</div></div>
    <div class="stat-card s-teal"><span class="stat-icon">✅</span><div class="stat-val">${s.avgQcScore || 84}%</div><div class="stat-label">Avg QC Score</div></div>
    <div class="stat-card s-red"><span class="stat-icon">⚠️</span><div class="stat-val">${s.flaggedMembers || 1}</div><div class="stat-label">Flagged</div></div>
  </div>
  <div class="action-grid">
    <button class="action-btn ab-purple" onclick="supTab('qc',document.querySelector('#supervisorScreen .nav-item:nth-child(2)'))"><span class="a-icon">✅</span><span class="a-label">Submit QC</span><span class="a-sub">Check quality</span></button>
    <button class="action-btn ab-blue" onclick="supTab('attendance',document.querySelector('#supervisorScreen .nav-item:nth-child(3)'))"><span class="a-icon">📅</span><span class="a-label">Mark Attendance</span><span class="a-sub">Manual entry</span></button>
    <button class="action-btn ab-green" onclick="supTab('production',document.querySelector('#supervisorScreen .nav-item:nth-child(4)'))"><span class="a-icon">📋</span><span class="a-label">Review Logs</span><span class="a-sub">Approve work</span></button>
    <button class="action-btn ab-teal" onclick="supTab('team',document.querySelector('#supervisorScreen .nav-item:nth-child(5)'))"><span class="a-icon">👥</span><span class="a-label">My Team</span><span class="a-sub">View members</span></button>
  </div>
  <div class="card">
    <div class="card-title">👥 Recent Team Members</div>
    ${getDemoTeamMembers().slice(0, 3).map(m => `<div class="list-item">
      <div class="item-avatar" style="background:linear-gradient(135deg,#3B82F6,#6C63FF)">${m.name[0]}</div>
      <div class="item-info"><h4>${m.name}</h4><p>${m.id} • Score: ${m.score}%</p></div>
      <div class="item-right"><span class="${m.status === 'Present' ? 'badge-present' : m.status === 'Late' ? 'badge-late' : 'badge-absent'}">${m.status}</span></div>
    </div>`).join('')}
  </div>`;
}

function getDemoTeamMembers() {
  return [
    { name: 'Anita Singh', id: 'EMP-1001', score: 92, status: 'Present' },
    { name: 'Vijay M.', id: 'EMP-1002', score: 78, status: 'Present' },
    { name: 'Ramesh K.', id: 'EMP-1023', score: 62, status: 'Late' },
    { name: 'Deepa R.', id: 'EMP-1008', score: 95, status: 'Present' },
    { name: 'Suresh L.', id: 'EMP-1012', score: 88, status: 'Absent' },
  ];
}

async function supTab(tab, el) {
  const nav = document.querySelector('#supervisorScreen .bottom-nav');
  setNavActive(nav, el);
  const content = document.getElementById('supervisorContent');
  if (tab === 'dashboard') { loadSupervisorDashboard(); return; }
  content.innerHTML = '<div class="loading"><div><div class="spinner"></div>Loading…</div></div>';
  if (tab === 'qc') renderQCForm(content, 'supervisor');
  else if (tab === 'attendance') renderMarkAttendance(content);
  else if (tab === 'production') await renderProductionReview(content);
  else if (tab === 'team') renderTeamList(content);
}

async function tlTab(tab, el) {
  const nav = document.querySelector('#teamleaderScreen .bottom-nav');
  setNavActive(nav, el);
  const content = document.getElementById('teamleaderContent');
  if (tab === 'dashboard') { loadTeamLeaderDashboard(); return; }
  content.innerHTML = '<div class="loading"><div><div class="spinner"></div>Loading…</div></div>';
  if (tab === 'qc') renderQCForm(content, 'teamleader');
  else if (tab === 'attendance') renderMarkAttendance(content);
  else if (tab === 'production') await renderProductionReview(content);
  else if (tab === 'team') renderTeamList(content, 'sub-team');
}

function renderQCForm(el, role) {
  el.innerHTML = `
  <div class="api-status"><span class="status-dot dot-green"></span>POST /api/qc</div>
  <div class="card">
    <div class="card-title">✅ Submit QC Check</div>
    <div class="form-group"><label>Participant</label>
      <select id="qc_part">
        <option value="EMP-1001">Anita Singh (EMP-1001)</option>
        <option value="EMP-1002">Vijay M. (EMP-1002)</option>
        <option value="EMP-1023">Ramesh K. (EMP-1023)</option>
        <option value="EMP-1008">Deepa R. (EMP-1008)</option>
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
    ${getDemoQCRecords().map(q => `<div class="list-item">
      <div class="item-avatar" style="background:${q.score >= 90 ? 'linear-gradient(135deg,var(--green),#06B6D4)' : q.score >= 70 ? 'linear-gradient(135deg,var(--gold),#EF4444)' : 'linear-gradient(135deg,var(--red),#F59E0B)'}">✅</div>
      <div class="item-info"><h4>${q.worker}</h4><p>${q.task} • ${q.checked} samples</p></div>
      <div class="item-right"><div class="val">${q.score}%</div><span class="${qcStatus(q.score).cls}">${qcStatus(q.score).label}</span></div>
    </div>`).join('')}
  </div>`;
}

function getDemoQCRecords() {
  return [
    { worker: 'Anita Singh', task: 'Data Entry', checked: 100, score: 92 },
    { worker: 'Vijay M.', task: 'Assembly', checked: 80, score: 76 },
    { worker: 'Ramesh K.', task: 'Data Entry', checked: 50, score: 62 },
    { worker: 'Deepa R.', task: 'Packaging', checked: 120, score: 97 },
  ];
}

function calcQCScore() {
  const c = parseInt(document.getElementById('qc_checked').value) || 0;
  const p = parseInt(document.getElementById('qc_passed').value) || 0;
  const prev = document.getElementById('scorePreview');
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
  const participant = document.getElementById('qc_part').value;
  const task = document.getElementById('qc_task').value;
  const samplesChecked = parseInt(document.getElementById('qc_checked').value);
  const samplesPassed = parseInt(document.getElementById('qc_passed').value);
  if (!task || !samplesChecked || isNaN(samplesPassed)) { toast('⚠️ Fill all QC fields'); return; }
  const score = Math.round((samplesPassed / samplesChecked) * 100);
  const data = await apiFetch('/qc', 'POST', { participant, task, samplesChecked, samplesPassed, score });
  toast(data ? '✅ QC submitted — Score: ' + score + '%' : '✅ QC recorded (demo) — Score: ' + score + '%');
  if (score < 70) toast('🚨 Score below 70% — Worker auto-flagged!');
  document.getElementById('qc_task').value = '';
  document.getElementById('qc_checked').value = '';
  document.getElementById('qc_passed').value = '';
  calcQCScore();
}

function renderMarkAttendance(el) {
  el.innerHTML = `
  <div class="api-status"><span class="status-dot dot-green"></span>POST /api/attendance/mark</div>
  <div class="card">
    <div class="card-title">📅 Mark Attendance</div>
    <div class="form-group"><label>Worker</label>
      <select id="att_worker">
        <option value="EMP-1001">Anita Singh (EMP-1001)</option>
        <option value="EMP-1002">Vijay M. (EMP-1002)</option>
        <option value="EMP-1023">Ramesh K. (EMP-1023)</option>
        <option value="EMP-1008">Deepa R. (EMP-1008)</option>
        <option value="EMP-1012">Suresh L. (EMP-1012)</option>
      </select>
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
    ${getDemoAttendance().map(a => `<div class="list-item">
      <div class="item-avatar" style="background:linear-gradient(135deg,#3B82F6,#6C63FF)">${(a.workerName || 'W')[0]}</div>
      <div class="item-info"><h4>${a.workerName}</h4><p>Check-in: ${fmtTime(a.checkIn)}</p></div>
      <span class="badge-${(a.status || 'present').toLowerCase()}">${a.status}</span>
    </div>`).join('')}
  </div>`;
}

async function markAttendance() {
  const workerId = document.getElementById('att_worker').value;
  const date = document.getElementById('att_date').value;
  const status = document.getElementById('att_status').value;
  const data = await apiFetch('/attendance/mark', 'POST', { workerId, date, status });
  toast(data ? '✅ Attendance marked' : '✅ Attendance marked (demo)');
}

async function renderProductionReview(el) {
  const data = await apiFetch('/production');
  const logs = data || getDemoProdLogs();
  el.innerHTML = `
  <div class="api-status"><span class="status-dot ${data ? 'dot-green' : 'dot-gold'}"></span>${data ? 'Live' : 'Demo'} production logs</div>
  ${logs.map(l => `<div class="card">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
      <div><h4 style="font-size:14px;font-weight:700">${l.workerName || l.worker || 'Worker'}</h4><p style="font-size:12px;color:var(--text2)">${l.taskType || l.task} • ${fmtDate(l.date || l.createdAt)}</p></div>
      <span class="badge-pending">${l.status || 'Pending'}</span>
    </div>
    <div style="display:flex;gap:12px;margin-bottom:12px">
      <div style="text-align:center;flex:1;background:#F8F9FF;border-radius:10px;padding:8px"><div style="font-size:18px;font-weight:800;color:var(--pri)">${l.hoursWorked || 8}h</div><div style="font-size:10px;color:var(--text3)">Hours</div></div>
      <div style="text-align:center;flex:1;background:#F8F9FF;border-radius:10px;padding:8px"><div style="font-size:18px;font-weight:800;color:var(--pri)">${l.unitsCompleted || l.units || 120}</div><div style="font-size:10px;color:var(--text3)">Units</div></div>
    </div>
    ${l.hoursWorked > 12 ? '<div style="background:var(--red-light);border-radius:8px;padding:8px;margin-bottom:10px;font-size:12px;color:var(--red);font-weight:600">⚠️ Hours exceed 12 — Fraud flag triggered</div>' : ''}
    <div style="display:flex;gap:8px">
      <button onclick="reviewProd('${l._id || 'demo'}','approved')" style="flex:1;padding:10px;border:none;border-radius:10px;background:linear-gradient(135deg,var(--green),#06B6D4);color:#fff;font-weight:700;font-size:13px;cursor:pointer">✅ Approve</button>
      <button onclick="reviewProd('${l._id || 'demo'}','rejected')" style="flex:1;padding:10px;border:none;border-radius:10px;background:linear-gradient(135deg,var(--red),#F59E0B);color:#fff;font-weight:700;font-size:13px;cursor:pointer">❌ Reject</button>
    </div>
  </div>`).join('')}`;
}

function getDemoProdLogs() {
  return [
    { workerName: 'Anita Singh', taskType: 'Data Entry', date: new Date(), hoursWorked: 8, unitsCompleted: 145, status: 'Pending' },
    { workerName: 'Vijay M.', taskType: 'Assembly', date: new Date(), hoursWorked: 7.5, unitsCompleted: 98, status: 'Pending' },
    { workerName: 'Ramesh K.', taskType: 'Data Entry', date: new Date(), hoursWorked: 14, unitsCompleted: 200, status: 'Pending' },
  ];
}

async function reviewProd(id, action) {
  await apiFetch('/production/' + id, 'PUT', { status: action });
  toast(action === 'approved' ? '✅ Production log approved' : '❌ Production log rejected');
}

function renderTeamList(el, label = 'team') {
  const members = getDemoTeamMembers();
  el.innerHTML = `
  <div class="api-status"><span class="status-dot dot-gold"></span>Demo • GET /api/users?team=mine</div>
  <div class="search-bar"><span>🔍</span><input placeholder="Search ${label}…"/></div>
  <div class="card">
    <div class="card-title">👥 ${label === 'sub-team' ? 'My Sub-Team' : 'My Team'} (${members.length})</div>
    ${members.map(m => `<div class="list-item">
      <div class="item-avatar" style="background:linear-gradient(135deg,#3B82F6,#6C63FF)">${m.name[0]}</div>
      <div class="item-info"><h4>${m.name}</h4><p>${m.id} • QC: ${m.score}%</p></div>
      <div class="item-right"><span class="${m.status === 'Present' ? 'badge-present' : m.status === 'Late' ? 'badge-late' : 'badge-absent'}">${m.status}</span>
      <div style="margin-top:4px"><div class="prog-bar" style="width:60px"><div class="prog-fill" style="width:${m.score}%;background:${m.score >= 90 ? 'var(--green)' : m.score >= 70 ? 'var(--gold)' : 'var(--red)'}"></div></div></div></div>
    </div>`).join('')}
  </div>`;
}

// ─── TEAM LEADER DASHBOARD ───────────────────────────────────
async function loadTeamLeaderDashboard() {
  const el = document.getElementById('teamleaderContent');
  const data = await apiFetch('/dashboard/supervisor');
  const s = data || { teamSize: 6, presentToday: 5, avgQcScore: 88, flaggedMembers: 0 };
  el.innerHTML = `
  <div class="api-status"><span class="status-dot ${data ? 'dot-green' : 'dot-gold'}"></span>${data ? 'Live' : 'Demo'} • Team Leader View</div>
  <div class="welcome-banner" style="background:linear-gradient(135deg,#F59E0B 0%,#EF4444 60%,#A855F7 100%)">
    <h3>Hi, Ravi 👋</h3>
    <p>Team Leader • ${today()}</p>
    <span class="emp-id">EMP-0102 • Sub-Team Beta</span>
  </div>
  <div class="stat-grid">
    <div class="stat-card s-gold"><span class="stat-icon">👥</span><div class="stat-val">${s.teamSize || 6}</div><div class="stat-label">Sub-Team Size</div></div>
    <div class="stat-card s-green"><span class="stat-icon">📅</span><div class="stat-val">${s.presentToday || 5}</div><div class="stat-label">Present Today</div></div>
    <div class="stat-card s-teal"><span class="stat-icon">✅</span><div class="stat-val">${s.avgQcScore || 88}%</div><div class="stat-label">Avg QC Score</div></div>
    <div class="stat-card s-blue"><span class="stat-icon">📋</span><div class="stat-val">4</div><div class="stat-label">Pending Logs</div></div>
  </div>
  <div class="action-grid">
    <button class="action-btn ab-gold" onclick="tlTab('qc',document.querySelector('#teamleaderScreen .nav-item:nth-child(2)'))"><span class="a-icon">✅</span><span class="a-label">Submit QC</span><span class="a-sub">Quality check</span></button>
    <button class="action-btn ab-blue" onclick="tlTab('attendance',document.querySelector('#teamleaderScreen .nav-item:nth-child(3)'))"><span class="a-icon">📅</span><span class="a-label">Mark Attendance</span><span class="a-sub">Manual entry</span></button>
    <button class="action-btn ab-green" onclick="tlTab('production',document.querySelector('#teamleaderScreen .nav-item:nth-child(4)'))"><span class="a-icon">📋</span><span class="a-label">Review Logs</span><span class="a-sub">Approve work</span></button>
    <button class="action-btn ab-teal" onclick="tlTab('team',document.querySelector('#teamleaderScreen .nav-item:nth-child(5)'))"><span class="a-icon">👥</span><span class="a-label">Sub-Team</span><span class="a-sub">View members</span></button>
  </div>
  <div class="card">
    <div class="card-title">📊 Recent QC Results</div>
    ${getDemoQCRecords().slice(0, 3).map(q => `<div class="list-item">
      <div class="item-avatar" style="background:${q.score >= 90 ? 'linear-gradient(135deg,var(--green),#06B6D4)' : q.score >= 70 ? 'linear-gradient(135deg,var(--gold),#EF4444)' : 'linear-gradient(135deg,var(--red),#F59E0B)'}">${q.worker[0]}</div>
      <div class="item-info"><h4>${q.worker}</h4><p>${q.task}</p></div>
      <div class="item-right"><div class="val">${q.score}%</div><span class="${qcStatus(q.score).cls}">${qcStatus(q.score).label}</span></div>
    </div>`).join('')}
  </div>`;
}

// ─── PARTICIPANT DASHBOARD ────────────────────────────────────
async function loadParticipantDashboard() {
  const el = document.getElementById('participantContent');
  const data = await apiFetch('/dashboard/participant');
  const s = data || { hoursThisMonth: 142, avgQcScore: 91, daysPresent: 18, totalPaid: 34000 };
  el.innerHTML = `
  <div class="api-status"><span class="status-dot ${data ? 'dot-green' : 'dot-gold'}"></span>${data ? 'Live' : 'Demo'}</div>
  <div class="welcome-banner" style="background:linear-gradient(135deg,#10B981 0%,#06B6D4 50%,#3B82F6 100%)">
    <h3>Good ${getGreeting()}, Anita 👋</h3>
    <p>${today()}</p>
    <span class="emp-id">EMP-1001 • Team Alpha</span>
  </div>
  <div class="checkin-bar">
    <button class="checkin-btn in" onclick="doCheckIn()">⏰ Check In</button>
    <button class="checkin-btn out" onclick="doCheckOut()">🏁 Check Out</button>
  </div>
  <div class="stat-grid">
    <div class="stat-card s-teal"><span class="stat-icon">⏱️</span><div class="stat-val">${s.hoursThisMonth || 142}h</div><div class="stat-label">Hours This Month</div></div>
    <div class="stat-card s-green"><span class="stat-icon">✅</span><div class="stat-val">${s.avgQcScore || 91}%</div><div class="stat-label">Avg QC Score</div></div>
    <div class="stat-card s-blue"><span class="stat-icon">📅</span><div class="stat-val">${s.daysPresent || 18}</div><div class="stat-label">Days Present</div></div>
    <div class="stat-card s-pink"><span class="stat-icon">💸</span><div class="stat-val">${fmtINR(s.totalPaid || 34000)}</div><div class="stat-label">Total Paid</div></div>
  </div>
  <div class="card">
    <div class="card-title">✅ My Recent QC Results</div>
    ${getDemoQCRecords().filter((_, i) => i < 3).map(q => `<div class="list-item">
      <div style="width:42px;height:42px;border-radius:14px;background:${q.score >= 90 ? 'linear-gradient(135deg,var(--green),#06B6D4)' : q.score >= 70 ? 'linear-gradient(135deg,var(--gold),#EF4444)' : 'linear-gradient(135deg,var(--red),#F59E0B)'};display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0">✅</div>
      <div class="item-info"><h4>${q.task}</h4><p>${q.checked} samples</p></div>
      <div class="item-right"><div class="val">${q.score}%</div><span class="${qcStatus(q.score).cls}">${qcStatus(q.score).label}</span></div>
    </div>`).join('')}
  </div>
  <div class="card">
    <div class="card-title">💰 Recent Payments</div>
    <div class="pay-card"><div class="pay-amount">₹17,000</div><div class="pay-label">April 2026 • Base + Performance Bonus</div>
      <div class="pay-detail"><span>📅 Apr 1, 2026</span><span>✅ Paid</span><span>+₹2,000 bonus</span></div></div>
    <div class="pay-card"><div class="pay-amount">₹17,000</div><div class="pay-label">March 2026 • Base + Performance Bonus</div>
      <div class="pay-detail"><span>📅 Mar 1, 2026</span><span>✅ Paid</span><span>+₹2,000 bonus</span></div></div>
  </div>`;
}

async function doCheckIn() {
  const data = await apiFetch('/attendance/checkin', 'POST', {});
  const now = new Date();
  const late = now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 30);
  toast(data ? '✅ Checked in at ' + fmtTime(now) : (late ? '⏰ Checked in (Late) at ' + fmtTime(now) : '✅ Checked in at ' + fmtTime(now)));
}

async function doCheckOut() {
  const data = await apiFetch('/attendance/checkout', 'PUT', {});
  toast(data ? '🏁 Checked out — hours calculated' : '🏁 Checked out (demo) — hours logged');
}

async function partTab(tab, el) {
  const nav = document.querySelector('#participantScreen .bottom-nav');
  setNavActive(nav, el);
  const content = document.getElementById('participantContent');
  if (tab === 'dashboard') { loadParticipantDashboard(); return; }
  content.innerHTML = '<div class="loading"><div><div class="spinner"></div>Loading…</div></div>';
  if (tab === 'production') renderProductionForm(content);
  else if (tab === 'qcresults') await renderMyQCResults(content);
  else if (tab === 'payments') await renderMyPayments(content);
  else if (tab === 'attendance') await renderMyAttendance(content);
}

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
    ${getDemoProdLogs().slice(0, 2).map(l => `<div class="list-item">
      <div class="item-avatar" style="background:linear-gradient(135deg,#10B981,#06B6D4)">📋</div>
      <div class="item-info"><h4>${l.taskType}</h4><p>${l.hoursWorked}h • ${l.unitsCompleted} units</p></div>
      <span class="badge-pending">${l.status}</span>
    </div>`).join('')}
  </div>`;
}

function checkHoursFraud(v) {
  const w = document.getElementById('hours_warn');
  w.style.display = parseFloat(v) > 12 ? 'block' : 'none';
}

async function submitProduction() {
  const taskType = document.getElementById('prod_task').value;
  const hoursWorked = parseFloat(document.getElementById('prod_hours').value);
  const unitsCompleted = parseInt(document.getElementById('prod_units').value);
  const notes = document.getElementById('prod_notes').value;
  const date = document.getElementById('prod_date').value;
  if (!taskType || !hoursWorked || !unitsCompleted) { toast('⚠️ Fill all required fields'); return; }
  const data = await apiFetch('/production', 'POST', { taskType, hoursWorked, unitsCompleted, notes, date });
  toast(data ? '✅ Production entry submitted' : '✅ Submitted (demo) — awaiting supervisor approval');
  if (hoursWorked > 12) toast('🚨 Fraud flag triggered for excess hours!');
}

async function renderMyQCResults(el) {
  const data = await apiFetch('/qc');
  const recs = data || getDemoQCRecords();
  el.innerHTML = `
  <div class="api-status"><span class="status-dot ${data ? 'dot-green' : 'dot-gold'}"></span>GET /api/qc</div>
  <div class="stat-grid">
    <div class="stat-card s-green"><span class="stat-icon">✅</span><div class="stat-val">91%</div><div class="stat-label">Avg Score</div></div>
    <div class="stat-card s-blue"><span class="stat-icon">📊</span><div class="stat-val">${recs.length}</div><div class="stat-label">Total Checks</div></div>
  </div>
  <div class="card">
    <div class="card-title">✅ My QC Results</div>
    ${recs.map(q => `<div class="list-item">
      <div class="item-avatar" style="background:${q.score >= 90 ? 'linear-gradient(135deg,var(--green),#06B6D4)' : q.score >= 70 ? 'linear-gradient(135deg,var(--gold),#EF4444)' : 'linear-gradient(135deg,var(--red),#F59E0B)'}">${q.score}%</div>
      <div class="item-info"><h4>${q.task}</h4><p>${q.checked} samples checked</p></div>
      <span class="${qcStatus(q.score).cls}">${qcStatus(q.score).label}</span>
    </div>`).join('')}
  </div>`;
}

async function renderMyPayments(el) {
  const data = await apiFetch('/payments');
  el.innerHTML = `
  <div class="api-status"><span class="status-dot ${data ? 'dot-green' : 'dot-gold'}"></span>GET /api/payments</div>
  <div class="stat-grid">
    <div class="stat-card s-green"><span class="stat-icon">💰</span><div class="stat-val">₹34,000</div><div class="stat-label">Total Received</div></div>
    <div class="stat-card s-blue"><span class="stat-icon">📅</span><div class="stat-val">2</div><div class="stat-label">Payments</div></div>
  </div>
  <div class="pay-card"><div class="pay-amount">₹17,000</div><div class="pay-label">April 2026 • Monthly Payroll</div><div class="pay-detail"><span>✅ Paid</span><span>Base ₹15K</span><span>+₹2K Bonus</span></div></div>
  <div class="pay-card"><div class="pay-amount">₹17,000</div><div class="pay-label">March 2026 • Monthly Payroll</div><div class="pay-detail"><span>✅ Paid</span><span>Base ₹15K</span><span>+₹2K Bonus</span></div></div>`;
}

async function renderMyAttendance(el) {
  const data = await apiFetch('/attendance');
  el.innerHTML = `
  <div class="api-status"><span class="status-dot ${data ? 'dot-green' : 'dot-gold'}"></span>GET /api/attendance</div>
  <div class="att-row">
    <div class="att-box s-green" style="border-radius:12px"><div class="att-num">18</div><div class="att-label">Present</div></div>
    <div class="att-box s-gold" style="border-radius:12px;background:linear-gradient(135deg,#F59E0B,#EF4444)"><div class="att-num">2</div><div class="att-label">Late</div></div>
    <div class="att-box s-red" style="border-radius:12px"><div class="att-num">1</div><div class="att-label">Absent</div></div>
  </div>
  <div class="card">
    <div class="card-title">📅 My Attendance — April 2026</div>
    ${getDemoAttendance().map(a => `<div class="list-item">
      <div class="item-avatar" style="background:linear-gradient(135deg,#10B981,#06B6D4)">📅</div>
      <div class="item-info"><h4>${fmtDate(a.date || new Date())}</h4><p>In: ${fmtTime(a.checkIn)} • ${a.status}</p></div>
      <span class="badge-${(a.status || 'present').toLowerCase()}">${a.status}</span>
    </div>`).join('')}
  </div>`;
}

// ─── SETTINGS ────────────────────────────────────────────────
function showSettings() {
  prevScreen = document.querySelector('.screen.active').id;
  showScreen('settingsScreen');
  const isAdmin = currentUser && currentUser.role === 'admin';
  document.getElementById('settingsContent').innerHTML = `
  <div class="api-status"><span class="status-dot dot-green"></span>PUT /api/auth/updateprofile</div>
  <div class="card">
    <div class="card-title">👤 Update Profile</div>
    <div style="text-align:center;margin-bottom:16px">
      <div style="width:72px;height:72px;border-radius:22px;background:linear-gradient(135deg,var(--pri),#A855F7);margin:0 auto;display:flex;align-items:center;justify-content:center;color:#fff;font-size:28px;font-weight:700">${(currentUser?.name || 'U')[0]}</div>
      <div style="font-size:16px;font-weight:700;margin-top:8px">${currentUser?.name || 'User'}</div>
      <div style="font-size:12px;color:var(--text3)">${currentUser?.id || 'EMP-0000'} • <span style="text-transform:capitalize">${currentUser?.role || 'participant'}</span></div>
    </div>
    <div class="form-group"><label>Full Name</label><input id="st_name" value="${currentUser?.name || ''}"/></div>
    <div class="form-group"><label>Email</label><input id="st_email" type="email" value="${currentUser?.email || ''}"/></div>
    <div class="form-group"><label>Phone</label><input id="st_phone" placeholder="+91 9999999999"/></div>
    <button class="btn-submit" onclick="updateProfile()">Save Changes</button>
  </div>
  <div class="card">
    <div class="card-title">🔐 Change Password</div>
    <div class="form-group"><label>Current Password</label><input id="st_curpass" type="password" placeholder="••••••••"/></div>
    <div class="form-group"><label>New Password</label><input id="st_newpass" type="password" placeholder="Min 8 chars" oninput="checkPassStrength(this.value)"/></div>
    <div id="pass_strength" style="font-size:12px;margin-bottom:10px;display:none"></div>
    <div class="form-group"><label>Confirm Password</label><input id="st_confpass" type="password" placeholder="Repeat new password"/></div>
    <button class="btn-submit" onclick="changePassword()">Update Password 🔐</button>
  </div>
  ${isAdmin ? `<div class="card" style="border:1.5px solid #FECACA">
    <div class="card-title" style="color:var(--red)">⚠️ Danger Zone</div>
    <p style="font-size:13px;color:var(--text2);margin-bottom:12px">These actions are irreversible. Proceed with caution.</p>
    <button class="btn-danger" onclick="dangerAction('samples')">🗑️ Delete Sample Users</button>
    <button class="btn-danger" onclick="dangerAction('workers')" style="margin-top:8px">⚠️ Delete All Workers</button>
    <button class="btn-danger" onclick="dangerAction('wipe')" style="margin-top:8px;background:linear-gradient(135deg,#1E1B4B,var(--red))">💀 Wipe Everything</button>
  </div>` : ''}
  <button class="btn-outline" style="margin-top:8px" onclick="logout()">Sign Out</button>`;
}

function checkPassStrength(v) {
  const el = document.getElementById('pass_strength'); el.style.display = 'block';
  let s = 'Weak 🔴', c = 'var(--red)';
  if (v.length >= 8 && /[A-Z]/.test(v) && /[0-9]/.test(v)) { s = 'Fair 🟡'; c = 'var(--gold)'; }
  if (v.length >= 10 && /[A-Z]/.test(v) && /[0-9]/.test(v) && /[^A-Za-z0-9]/.test(v)) { s = 'Strong 🟢'; c = 'var(--green)'; }
  el.innerHTML = `<span style="color:${c};font-weight:600">Password strength: ${s}</span>`;
}

async function updateProfile() {
  const name = document.getElementById('st_name').value;
  const email = document.getElementById('st_email').value;
  const phone = document.getElementById('st_phone').value;
  const data = await apiFetch('/auth/updateprofile', 'PUT', { name, email, phone });
  toast(data ? '✅ Profile updated successfully' : '✅ Profile updated (demo)');
}

async function changePassword() {
  const currentPassword = document.getElementById('st_curpass').value;
  const newPassword = document.getElementById('st_newpass').value;
  const confirm = document.getElementById('st_confpass').value;
  if (!currentPassword || !newPassword) { toast('⚠️ Fill all password fields'); return; }
  if (newPassword !== confirm) { toast('❌ Passwords do not match'); return; }
  if (newPassword.length < 8) { toast('⚠️ Password must be 8+ characters'); return; }
  const data = await apiFetch('/auth/updatepassword', 'PUT', { currentPassword, newPassword });
  toast(data ? '✅ Password changed successfully' : '✅ Password updated (demo)');
}

function dangerAction(type) {
  const msgs = { samples: 'Delete all sample/test users?', workers: 'Delete ALL workers? (Admin stays safe)', wipe: 'WIPE EVERYTHING? This cannot be undone!' };
  const endpoints = { samples: '/users/delete-samples', workers: '/users/delete-workers', wipe: '/users/wipe-all' };
  showModal(`
  <div class="modal-title" style="color:var(--red)">⚠️ Confirm Action</div>
  <p style="font-size:14px;color:var(--text2);margin-bottom:20px">${msgs[type]}</p>
  <button class="btn-danger" onclick="confirmDanger('${endpoints[type]}')">Yes, proceed</button>
  <button class="btn-outline" onclick="closeModalDirect()" style="margin-top:8px">Cancel</button>`);
}

async function confirmDanger(endpoint) {
  const data = await apiFetch(endpoint, 'DELETE');
  closeModalDirect();
  toast(data ? '✅ Action completed' : '✅ Action completed (demo)');
}

function logout() {
  token = ''; currentUser = null;
  showScreen('loginScreen');
  toast('👋 Signed out successfully');
}
