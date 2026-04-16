// ─── ADMIN DASHBOARD ─────────────────────────────────────────
async function loadAdminDashboard() {
  const el = document.getElementById('adminContent');
  const data = await apiFetch('/dashboard/admin');
  const stats = data || { totalWorkers: 0, qcPassRate: 0, totalPaidOut: 0, fraudFlags: 0, presentToday: 0, lateToday: 0, absentToday: 0, qcPassed: 0, qcWarning: 0, qcFailed: 0 };

  const w  = stats.totalWorkers  ?? 0;
  const qr = stats.qcPassRate    ?? 0;
  const tp = stats.totalPaidOut  ?? 0;
  const ff = stats.fraudFlags    ?? 0;
  const pt = stats.presentToday  ?? 0;
  const lt = stats.lateToday     ?? 0;
  const ab = stats.absentToday   ?? 0;
  const qp = stats.qcPassed      ?? 0;
  const qw = stats.qcWarning     ?? 0;
  const qf = stats.qcFailed      ?? 0;
  const total = qp + qw + qf || 1;

  el.innerHTML = `
  <div class="api-status"><span class="status-dot ${data ? 'dot-green' : 'dot-gold'}"></span>${data ? 'Live API Connected' : 'Demo Mode — API offline'}</div>
  <div class="welcome-banner">
    <h3>Good ${getGreeting()}, Admin 👋</h3>
    <p>${today()}</p>
    <span class="emp-id">QM WorkForce OS v2.0</span>
  </div>
  <div class="stat-grid">
    <div class="stat-card s-purple"><span class="stat-icon">👥</span><div class="stat-val">${w}</div><div class="stat-label">Active Workers</div></div>
    <div class="stat-card s-green"><span class="stat-icon">✅</span><div class="stat-val">${qr}%</div><div class="stat-label">QC Pass Rate</div></div>
    <div class="stat-card s-pink"><span class="stat-icon">💸</span><div class="stat-val">${fmtINR(tp)}</div><div class="stat-label">Total Paid Out</div><div class="stat-sub">This month</div></div>
    <div class="stat-card s-red"><span class="stat-icon">⚠️</span><div class="stat-val">${ff}</div><div class="stat-label">Fraud Flags</div></div>
  </div>
  <div class="card">
    <div class="card-title">📅 Today's Attendance</div>
    <div class="att-row">
      <div class="att-box s-green" style="border-radius:12px"><div class="att-num">${pt}</div><div class="att-label">Present</div></div>
      <div class="att-box" style="border-radius:12px;background:linear-gradient(135deg,#F59E0B,#EF4444)"><div class="att-num">${lt}</div><div class="att-label">Late</div></div>
      <div class="att-box s-red" style="border-radius:12px"><div class="att-num">${ab}</div><div class="att-label">Absent</div></div>
    </div>
  </div>
  <div class="card">
    <div class="card-title">📊 QC Overview</div>
    <div style="display:flex;flex-direction:column;gap:10px">
      <div>
        <div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="font-size:13px;color:var(--text2)">✅ Passed</span><span style="font-size:13px;font-weight:700;color:var(--green)">${qp}</span></div>
        <div class="prog-bar"><div class="prog-fill" style="width:${Math.round(qp/total*100)}%;background:var(--green)"></div></div>
      </div>
      <div>
        <div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="font-size:13px;color:var(--text2)">⚠️ Warning</span><span style="font-size:13px;font-weight:700;color:var(--gold)">${qw}</span></div>
        <div class="prog-bar"><div class="prog-fill" style="width:${Math.round(qw/total*100)}%;background:var(--gold)"></div></div>
      </div>
      <div>
        <div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="font-size:13px;color:var(--text2)">❌ Failed</span><span style="font-size:13px;font-weight:700;color:var(--red)">${qf}</span></div>
        <div class="prog-bar"><div class="prog-fill" style="width:${Math.round(qf/total*100)}%;background:var(--red)"></div></div>
      </div>
    </div>
  </div>
  <div class="sec-header"><h3>⚡ Quick Actions</h3></div>
  <div class="action-grid">
    <button class="action-btn ab-purple" onclick="showAddUser()"><span class="a-icon">➕</span><span class="a-label">Add User</span><span class="a-sub">Create account</span></button>
    <button class="action-btn ab-pink" onclick="runPayroll()"><span class="a-icon">💸</span><span class="a-label">Run Payroll</span><span class="a-sub">All workers</span></button>
    <button class="action-btn ab-green" onclick="exportCSV()"><span class="a-icon">📥</span><span class="a-label">Export CSV</span><span class="a-sub">Download data</span></button>
    <button class="action-btn ab-blue" onclick="adminTab('fraud',document.querySelector('#adminNav .nav-item:nth-child(5)'))"><span class="a-icon">🚨</span><span class="a-label">Fraud Log</span><span class="a-sub">Review flags</span></button>
  </div>`;
}

async function adminTab(tab, el) {
  const nav = document.getElementById('adminNav');
  setNavActive(nav, el);
  const content = document.getElementById('adminContent');
  if (tab === 'dashboard') { loadAdminDashboard(); return; }
  content.innerHTML = '<div class="loading"><div><div class="spinner"></div>Loading ' + tab + '…</div></div>';
  if (tab === 'users')           await loadAdminUsers(content);
  else if (tab === 'attendance') await loadAdminAttendance(content);
  else if (tab === 'payments')   await loadAdminPayments(content);
  else if (tab === 'fraud')      await loadAdminFraud(content);
}

// ─── USERS ────────────────────────────────────────────────────
async function loadAdminUsers(el) {
  const data = await apiFetch('/users');
  const users = data || [];
  el.innerHTML = `
  <div class="api-status"><span class="status-dot ${data ? 'dot-green' : 'dot-gold'}"></span>${data ? 'Live' : 'Demo'} • ${users.length} users</div>
  <div class="search-bar"><span>🔍</span><input placeholder="Search users…" oninput="filterUsers(this.value)"/></div>
  <div id="usersList">${renderUsers(users)}</div>`;
  el._users = users;
}

function renderUsers(users) {
  if (!users.length) return '<div style="text-align:center;padding:30px;color:var(--text3);font-size:14px">No users found</div>';
  return users.map(u => `
  <div class="list-item" style="flex-direction:column;align-items:flex-start;gap:8px">
    <div style="display:flex;align-items:center;gap:12px;width:100%">
      <div class="item-avatar" style="background:${roleColor(u.role)}">${u.name[0]}</div>
      <div class="item-info">
        <h4>${u.name} ${u.is_flagged || u.isFlagged ? '🚩' : ''}</h4>
        <p>${u.employee_id || u.employeeId || '—'} • <span style="text-transform:capitalize">${u.role}</span></p>
      </div>
      <div class="item-right">
        <span class="${(u.is_active ?? u.isActive) ? 'badge-present' : 'badge-absent'}">${(u.is_active ?? u.isActive) ? 'Active' : 'Inactive'}</span>
      </div>
    </div>
    <div style="display:flex;gap:8px;padding-left:54px">
      ${(u.is_flagged || u.isFlagged) ? `<button onclick="unflagUser('${u.id || u.employeeId}')" style="font-size:11px;padding:5px 10px;border:none;border-radius:6px;background:var(--green-light);color:var(--green);cursor:pointer;font-weight:600">✅ Unflag</button>` : ''}
      <button onclick="showEditUser('${u.id}','${u.name}','${u.email}','${u.role}')" style="font-size:11px;padding:5px 10px;border:none;border-radius:6px;background:var(--pri-light);color:var(--pri);cursor:pointer;font-weight:600">✏️ Edit</button>
      <button onclick="confirmDeleteUser('${u.id}','${u.name}')" style="font-size:11px;padding:5px 10px;border:none;border-radius:6px;background:#FEE2E2;color:#DC2626;cursor:pointer;font-weight:600">🗑️ Delete</button>
    </div>
  </div>`).join('');
}

function filterUsers(q) {
  const el = document.getElementById('usersList');
  const content = document.getElementById('adminContent');
  const users = content._users || [];
  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(q.toLowerCase()) ||
    (u.employee_id || u.employeeId || '').toLowerCase().includes(q.toLowerCase())
  );
  el.innerHTML = renderUsers(filtered);
}

function showEditUser(id, name, email, role) {
  showModal(`
  <div class="modal-title">✏️ Edit User</div>
  <div class="form-group"><label>Full Name</label><input id="eu_name" value="${name}"/></div>
  <div class="form-group"><label>Email</label><input id="eu_email" type="email" value="${email}"/></div>
  <div class="form-group"><label>Role</label>
    <select id="eu_role">
      <option value="participant" ${role === 'participant' ? 'selected' : ''}>👤 Participant</option>
      <option value="supervisor"  ${role === 'supervisor'  ? 'selected' : ''}>👁️ Supervisor</option>
      <option value="teamleader"  ${role === 'teamleader'  ? 'selected' : ''}>🏆 Team Leader</option>
      <option value="admin"       ${role === 'admin'       ? 'selected' : ''}>🛡️ Admin</option>
    </select>
  </div>
  <button class="btn-submit" onclick="saveEditUser('${id}')">Save Changes ✅</button>
  <button class="btn-outline" onclick="closeModalDirect()">Cancel</button>`);
}

async function saveEditUser(id) {
  const name  = document.getElementById('eu_name').value;
  const email = document.getElementById('eu_email').value;
  const role  = document.getElementById('eu_role').value;
  if (!name || !email) { toast('⚠️ Name and email are required'); return; }
  const data = await apiFetch('/users/' + id, 'PUT', { name, email, role });
  closeModalDirect();
  toast(data ? '✅ User updated successfully' : '✅ User updated (demo)');
  await loadAdminUsers(document.getElementById('adminContent'));
}

function confirmDeleteUser(id, name) {
  showModal(`
  <div class="modal-title" style="color:#DC2626">🗑️ Delete User</div>
  <p style="font-size:14px;color:var(--text2);margin-bottom:10px">Are you sure you want to delete <strong>${name}</strong>?</p>
  <p style="font-size:13px;color:#DC2626;background:#FEF2F2;padding:10px;border-radius:10px;margin-bottom:20px">
    ⚠️ This permanently deletes this user and all their records. This cannot be undone.
  </p>
  <button class="btn-submit" style="background:linear-gradient(135deg,#DC2626,#F97316)" onclick="deleteUser('${id}','${name}')">
    Yes, Delete ${name}
  </button>
  <button class="btn-outline" onclick="closeModalDirect()">Cancel — Go Back</button>`);
}

async function deleteUser(id, name) {
  const data = await apiFetch('/users/' + id, 'DELETE');
  closeModalDirect();
  toast(data ? '🗑️ ' + name + ' deleted successfully' : '🗑️ ' + name + ' deleted (demo)');
  const content = document.getElementById('adminContent');
  if (content._users) {
    content._users = content._users.filter(u => u.id !== id);
    document.getElementById('usersList').innerHTML = renderUsers(content._users);
  }
}

// ─── ATTENDANCE ───────────────────────────────────────────────
async function loadAdminAttendance(el) {
  const data = await apiFetch('/attendance');
  const recs = data || [];
  const present = recs.filter(r => r.status === 'Present').length;
  const absent  = recs.filter(r => r.status === 'Absent').length;
  const late    = recs.filter(r => r.status === 'Late').length;
  el.innerHTML = `
  <div class="api-status"><span class="status-dot ${data ? 'dot-green' : 'dot-gold'}"></span>${data ? 'Live' : 'Demo'} attendance</div>
  <div class="stat-grid">
    <div class="stat-card s-green"><span class="stat-icon">✅</span><div class="stat-val">${present}</div><div class="stat-label">Present Today</div></div>
    <div class="stat-card s-red"><span class="stat-icon">❌</span><div class="stat-val">${absent}</div><div class="stat-label">Absent Today</div></div>
  </div>
  <div class="card"><div class="card-title">📅 Attendance Records</div>
  ${recs.length ? recs.map(r => `<div class="list-item">
    <div class="item-avatar" style="background:${roleColor('participant')}">${(r.users?.name || r.workerName || 'W')[0]}</div>
    <div class="item-info">
      <h4>${r.users?.name || r.workerName || 'Worker'}</h4>
      <p>${r.users?.employee_id || '—'} • ${fmtDate(r.date || r.createdAt)} • In: ${fmtTime(r.check_in || r.checkIn)}</p>
    </div>
    <div class="item-right"><span class="badge-${(r.status || 'present').toLowerCase()}">${r.status || 'Present'}</span></div>
  </div>`).join('') : '<div style="text-align:center;padding:24px;color:var(--text3)">No attendance records yet</div>'}
  </div>`;
}

// ─── PAYMENTS ─────────────────────────────────────────────────
async function loadAdminPayments(el) {
  const data  = await apiFetch('/payments');
  const pays  = data || [];
  const totalPaid   = pays.reduce((s, p) => s + parseFloat(p.total_amount || p.amount || 0), 0);
  const workerCount = pays.length;
  const thisMonth   = new Date().getMonth() + 1;
  const thisYear    = new Date().getFullYear();

  // Track which workers are already paid this month
  const paidThisMonth = new Set(
    pays.filter(p => p.month === thisMonth && p.year === thisYear)
        .map(p => p.worker_id)
  );

  // Get all active participants to show individual pay buttons
  const wData   = await apiFetch('/users?role=participant');
  const workers = wData || [];

  el.innerHTML = `
  <div class="api-status"><span class="status-dot ${data ? 'dot-green' : 'dot-gold'}"></span>${data ? 'Live' : 'Demo'} payments</div>
  <div class="stat-grid">
    <div class="stat-card s-green"><span class="stat-icon">💰</span><div class="stat-val">${fmtINR(totalPaid)}</div><div class="stat-label">Total Paid</div><div class="stat-sub">This month</div></div>
    <div class="stat-card s-blue"><span class="stat-icon">👥</span><div class="stat-val">${workerCount}</div><div class="stat-label">Payments Made</div></div>
  </div>

  <div class="card">
    <div class="card-title">👥 Pay Individual Worker</div>
    ${workers.length ? workers.map(w => `
    <div class="list-item">
      <div class="item-avatar" style="background:${roleColor('participant')}">${w.name[0]}</div>
      <div class="item-info">
        <h4>${w.name}</h4>
        <p>${w.employee_id || '—'} • ${w.is_flagged ? '🚩 Flagged' : '✅ Good standing'}</p>
      </div>
      <div class="item-right">
        ${paidThisMonth.has(w.id)
          ? `<span class="badge-pass">✅ Paid</span>`
          : `<button onclick="paySingleWorker('${w.id}','${w.name}')"
               style="padding:7px 14px;border:none;border-radius:8px;background:linear-gradient(135deg,var(--green),#06B6D4);color:#fff;font-weight:700;font-size:12px;cursor:pointer">
               💸 Pay Now
             </button>`
        }
      </div>
    </div>`).join('') : '<div style="text-align:center;padding:16px;color:var(--text3)">No workers found</div>'}
  </div>

  <div class="card"><div class="card-title">💸 Payment Records</div>
  ${pays.length ? pays.map(p => `
  <div class="list-item">
    <div class="item-avatar" style="background:linear-gradient(135deg,var(--green),#06B6D4)">${(p.users?.name || 'W')[0]}</div>
    <div class="item-info">
      <h4>${p.users?.name || p.workerName || 'Worker'}</h4>
      <p>${p.users?.employee_id || '—'} • ${p.notes || 'Monthly payroll'} • ${p.month}/${p.year}</p>
    </div>
    <div class="item-right" style="display:flex;flex-direction:column;align-items:flex-end;gap:5px">
      <div class="val">${fmtINR(p.total_amount || p.amount)}</div>
      <span class="badge-pass" style="font-size:10px">${p.status || 'Paid'}</span>
      <button onclick="confirmDeletePayment('${p.id}','${p.users?.name || 'Worker'}')"
        style="font-size:10px;padding:3px 8px;border:none;border-radius:6px;background:#FEE2E2;color:#DC2626;cursor:pointer;font-weight:600">
        🗑️ Delete
      </button>
    </div>
  </div>`).join('') : '<div style="text-align:center;padding:24px;color:var(--text3)">No payments yet — run payroll first</div>'}
  </div>
  <button class="btn-submit" onclick="runPayroll()">💸 Run Payroll for All Workers</button>`;
}

// ✅ NEW: pay one specific worker
async function paySingleWorker(workerId, workerName) {
  toast('⏳ Processing payment for ' + workerName + '…');
  const month = new Date().getMonth() + 1;
  const year  = new Date().getFullYear();
  const data  = await apiFetch('/payments/single', 'POST', { workerId, month, year });
  setTimeout(() => {
    toast(data ? '✅ ' + workerName + ' paid — ' + fmtINR(data.totalAmount) : '❌ Payment failed — check API');
    loadAdminPayments(document.getElementById('adminContent'));
  }, 1000);
}

// ✅ NEW: confirm before deleting a payment
function confirmDeletePayment(id, name) {
  showModal(`
  <div class="modal-title" style="color:#DC2626">🗑️ Delete Payment</div>
  <p style="font-size:14px;color:var(--text2);margin-bottom:10px">Delete payment record for <strong>${name}</strong>?</p>
  <p style="font-size:13px;color:#DC2626;background:#FEF2F2;padding:10px;border-radius:10px;margin-bottom:20px">
    ⚠️ This removes the payment record only. The worker account stays safe.
  </p>
  <button class="btn-submit" style="background:linear-gradient(135deg,#DC2626,#F97316)" onclick="deletePayment('${id}','${name}')">
    Yes, Delete Payment
  </button>
  <button class="btn-outline" onclick="closeModalDirect()">Cancel</button>`);
}

// ✅ NEW: delete a specific payment record
async function deletePayment(id, name) {
  const data = await apiFetch('/payments/' + id, 'DELETE');
  closeModalDirect();
  toast(data ? '🗑️ Payment for ' + name + ' deleted' : '❌ Delete failed — check API');
  loadAdminPayments(document.getElementById('adminContent'));
}

// ─── FRAUD ────────────────────────────────────────────────────
async function loadAdminFraud(el) {
  const data    = await apiFetch('/users?flagged=true');
  const flagged = data || [];
  el.innerHTML = `
  <div class="api-status"><span class="status-dot ${flagged.length ? 'dot-red' : 'dot-green'}"></span>${flagged.length} Active Fraud Flag${flagged.length !== 1 ? 's' : ''}</div>
  <div class="card" style="border:1.5px solid #FECACA">
    <div class="card-title" style="color:var(--red)">🚨 Flagged Workers</div>
    ${flagged.length ? flagged.map(u => `
    <div class="list-item">
      <div class="item-avatar" style="background:linear-gradient(135deg,var(--red),#F59E0B)">${u.name[0]}</div>
      <div class="item-info">
        <h4>${u.name} 🚩</h4>
        <p>${u.flag_reason || 'Suspicious activity'} • ${u.employee_id || '—'}</p>
      </div>
      <button onclick="unflagUser('${u.id}')" style="padding:8px 14px;border:none;border-radius:8px;background:var(--green);color:#fff;font-weight:700;font-size:12px;cursor:pointer">Unflag</button>
    </div>`).join('') : '<div style="text-align:center;padding:24px;color:var(--text3)">No fraud flags — all clear ✅</div>'}
  </div>`;
}

// ─── SHARED ACTIONS ───────────────────────────────────────────
async function unflagUser(id) {
  const data = await apiFetch('/users/' + id + '/flag', 'PUT', { flagged: false });
  toast(data ? '✅ Worker unflagged successfully' : '✅ Worker unflagged (demo)');
  loadAdminDashboard();
}

async function runPayroll() {
  toast('⏳ Processing payroll for all workers…');
  const data = await apiFetch('/payments/batch', 'POST', { month: new Date().getMonth() + 1, year: new Date().getFullYear() });
  setTimeout(() => {
    toast(data ? '✅ Payroll complete! ' + (data.count || 0) + ' payments processed' : '❌ Payroll failed — check API connection');
    loadAdminPayments(document.getElementById('adminContent'));
  }, 1200);
}

async function exportCSV() {
  const data = await apiFetch('/users');
  const users = data || [];
  if (!users.length) { toast('⚠️ No users to export'); return; }
  const rows = [
    ['Name', 'Email', 'Role', 'Employee ID', 'Status', 'Flagged'],
    ...users.map(u => [
      u.name, u.email, u.role,
      u.employee_id || u.employeeId || '—',
      (u.is_active ?? u.isActive) ? 'Active' : 'Inactive',
      (u.is_flagged || u.isFlagged) ? 'Yes' : 'No'
    ])
  ];
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
  const name       = document.getElementById('nu_name').value;
  const email      = document.getElementById('nu_email').value;
  const password   = document.getElementById('nu_pass').value;
  const role       = document.getElementById('nu_role').value;
  const employeeId = document.getElementById('nu_empid').value;
  if (!name || !email || !password) { toast('⚠️ Fill all required fields'); return; }
  const data = await apiFetch('/users', 'POST', { name, email, password, role, employeeId });
  closeModalDirect();
  toast(data ? '✅ User created: ' + name : '❌ Failed to create user — check API');
  const content = document.getElementById('adminContent');
  if (content._users) await loadAdminUsers(content);
}