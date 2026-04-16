// ─── UTILITIES ───────────────────────────────────────────────
const API = 'https://qcs-app.onrender.com/api';
let token = '', currentUser = null, prevScreen = '';

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

function qcStatus(score) {
  if (score >= 90) return { label: 'PASS ✅', cls: 'badge-pass', color: 'var(--green)' };
  if (score >= 70) return { label: 'WARNING ⚠️', cls: 'badge-warn', color: 'var(--gold)' };
  return { label: 'FAIL ❌', cls: 'badge-fail', color: 'var(--red)' };
}

function getGreeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Morning' : h < 17 ? 'Afternoon' : 'Evening';
}

function roleColor(r) {
  const m = {
    admin:      'linear-gradient(135deg,#6C63FF,#A855F7)',
    supervisor: 'linear-gradient(135deg,#3B82F6,#6C63FF)',
    teamleader: 'linear-gradient(135deg,#F59E0B,#EF4444)',
    participant:'linear-gradient(135deg,#10B981,#06B6D4)'
  };
  return m[r] || m.participant;
}

// ─── FALLBACK DATA (shown only when API is offline) ──────────
// All returned as empty arrays — no fake/sample data shown
// Real data comes from your Supabase database via the API

function getDemoUsers()       { return []; }
function getDemoAttendance()  { return []; }
function getDemoPayments()    { return []; }
function getDemoQCRecords()   { return []; }
function getDemoTeamMembers() { return []; }
function getDemoProdLogs()    { return []; }