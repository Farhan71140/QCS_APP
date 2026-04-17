// ─── LOGIN / AUTH ─────────────────────────────────────────────

// ✅ Restore session on page load / refresh
window.addEventListener('load', () => {
  const savedToken = localStorage.getItem('qm_token');
  const savedUser  = localStorage.getItem('qm_user');
  if (savedToken && savedUser) {
    try {
      token       = savedToken;
      currentUser = JSON.parse(savedUser);
      routeToDashboard(currentUser.role);
    } catch (e) {
      localStorage.removeItem('qm_token');
      localStorage.removeItem('qm_user');
      showScreen('loginScreen');
    }
  }
});

// ✅ CHANGED: setRole() only highlights pill — no auto-fill of credentials
function setRole(r) {
  document.querySelectorAll('.role-pill').forEach(p => p.classList.remove('active'));
  event.target.classList.add('active');
  document.getElementById('loginEmail').value    = '';
  document.getElementById('loginPassword').value = '';
}

// ✅ ADDED: show/hide password toggle
function togglePassword() {
  const input = document.getElementById('loginPassword');
  const btn   = document.getElementById('pwToggleBtn');
  if (input.type === 'password') {
    input.type      = 'text';
    btn.textContent = '🙈';
  } else {
    input.type      = 'password';
    btn.textContent = '👁️';
  }
}

async function doLogin() {
  const email    = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  if (!email || !password) { toast('⚠️ Enter email and password'); return; }
  const btn = document.querySelector('#loginScreen .btn-primary');
  btn.textContent = 'Signing in…'; btn.disabled = true;
  try {
    const data = await apiFetch('/auth/login', 'POST', { email, password });
    if (data && data.token) {
      token       = data.token;
      currentUser = data.user;

      // ✅ Save token and user to localStorage
      localStorage.setItem('qm_token', data.token);
      localStorage.setItem('qm_user',  JSON.stringify(data.user));

      toast('✅ Welcome back, ' + currentUser.name + '!');
      routeToDashboard(currentUser.role);
    } else {
      toast('❌ Login failed. Check your email and password.');
    }
  } catch (e) {
    toast('❌ Cannot connect to server. Try again.');
  }
  btn.textContent = 'Sign In →'; btn.disabled = false;
}

function routeToDashboard(role) {
  const map = {
    admin:       'adminScreen',
    supervisor:  'supervisorScreen',
    teamleader:  'teamleaderScreen',
    participant: 'participantScreen'
  };
  showScreen(map[role] || 'participantScreen');
  if      (role === 'admin')       loadAdminDashboard();
  else if (role === 'supervisor')  loadSupervisorDashboard();
  else if (role === 'teamleader')  loadTeamLeaderDashboard();
  else                             loadParticipantDashboard();
}

// ✅ logout clears localStorage
function logout() {
  token       = '';
  currentUser = null;
  localStorage.removeItem('qm_token');
  localStorage.removeItem('qm_user');
  showScreen('loginScreen');
  toast('👋 Signed out successfully');
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
  const el = document.getElementById('pass_strength');
  el.style.display = 'block';
  let s = 'Weak 🔴', c = 'var(--red)';
  if (v.length >= 8 && /[A-Z]/.test(v) && /[0-9]/.test(v))                                          { s = 'Fair 🟡';   c = 'var(--gold)';  }
  if (v.length >= 10 && /[A-Z]/.test(v) && /[0-9]/.test(v) && /[^A-Za-z0-9]/.test(v))              { s = 'Strong 🟢'; c = 'var(--green)'; }
  el.innerHTML = `<span style="color:${c};font-weight:600">Password strength: ${s}</span>`;
}

async function updateProfile() {
  const name  = document.getElementById('st_name').value;
  const email = document.getElementById('st_email').value;
  const phone = document.getElementById('st_phone').value;
  const data  = await apiFetch('/auth/updateprofile', 'PUT', { name, email, phone });

  // ✅ Update saved user in localStorage after profile change
  if (data) {
    currentUser = { ...currentUser, name, email, phone };
    localStorage.setItem('qm_user', JSON.stringify(currentUser));
  }
  toast(data ? '✅ Profile updated successfully' : '✅ Profile updated (demo)');
}

async function changePassword() {
  const currentPassword = document.getElementById('st_curpass').value;
  const newPassword     = document.getElementById('st_newpass').value;
  const confirm         = document.getElementById('st_confpass').value;
  if (!currentPassword || !newPassword) { toast('⚠️ Fill all password fields'); return; }
  if (newPassword !== confirm)          { toast('❌ Passwords do not match');    return; }
  if (newPassword.length < 8)          { toast('⚠️ Password must be 8+ characters'); return; }
  const data = await apiFetch('/auth/updatepassword', 'PUT', { currentPassword, newPassword });
  toast(data ? '✅ Password changed successfully' : '✅ Password updated (demo)');
}

function dangerAction(type) {
  const msgs = {
    samples: 'Delete all sample/test users?',
    workers: 'Delete ALL workers? (Admin stays safe)',
    wipe:    'WIPE EVERYTHING? This cannot be undone!'
  };
  const endpoints = {
    samples: '/users/delete-samples',
    workers: '/users/delete-workers',
    wipe:    '/users/wipe-all'
  };
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