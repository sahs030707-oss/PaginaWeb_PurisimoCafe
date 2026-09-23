/* core/ui.js — Interfaz: toast, modales, nav, auth guard
   PurísimoCafe Sistema de Gestión
*/

/* ─── TOAST ─── */
function toast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = {
    success: 'fa-circle-check',
    error:   'fa-circle-xmark',
    info:    'fa-circle-info',
    warning: 'fa-triangle-exclamation'
  };

  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i><span>${message}</span>`;
  container.appendChild(el);

  setTimeout(() => {
    el.style.opacity   = '0';
    el.style.transform = 'translateX(20px)';
    el.style.transition = 'all .3s ease';
    setTimeout(() => el.remove(), 300);
  }, 3500);
}

/* ─── MODALES ─── */
function openModal(id)  { document.getElementById(id)?.classList.add('open'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }

function initModals() {
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.close));
  });
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.classList.remove('open');
    });
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.open').forEach(o => o.classList.remove('open'));
    }
  });
}

/* ─── TOPBAR FECHA ─── */
function updateTopbarDate() {
  const el = document.getElementById('topbar-date');
  if (!el) return;
  el.textContent = new Date().toLocaleDateString('es-NI', {
    weekday:'long', year:'numeric', month:'long', day:'numeric'
  });
}

/* ─── SIDEBAR MOBILE ─── */
function initSidebarMobile() {
  const hamburger     = document.getElementById('hamburger');
  const sidebar       = document.getElementById('sidebar');
  const overlayMobile = document.getElementById('overlay-mobile');
  if (!hamburger || !sidebar) return;

  hamburger.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    overlayMobile?.classList.toggle('show');
  });
  overlayMobile?.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlayMobile.classList.remove('show');
  });
}

/* ─── NAVEGACIÓN ─── */
function navigate(page) { window.location.href = page; }

function setActiveNav() {
  const current = window.location.pathname.split('/').pop();
  document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    item.classList.toggle('active', item.dataset.page === current);
  });
}

/* ─── SIDEBAR USER ─── */
function loadSidebarUser() {
  const session = Auth.getSession();
  const nombre  = session.usuario || 'Usuario';
  const nameEl   = document.getElementById('user-name');
  const avatarEl = document.getElementById('user-avatar');
  const roleEl   = document.getElementById('user-role');
  if (nameEl)   nameEl.textContent   = nombre;
  if (avatarEl) avatarEl.textContent = nombre.charAt(0).toUpperCase();
  if (roleEl)   roleEl.textContent   = getRolNombre(session.rolId);
}

/* ─── LOGOUT ─── */
function initLogout() {
  document.getElementById('btn-logout')?.addEventListener('click', () => {
    Auth.clear();
    sessionStorage.removeItem('pc_token');
    sessionStorage.removeItem('pc_session');
    window.location.href = 'login.html';
  });
}

/* ─── SESIÓN ─── */
function saveSession() {
  sessionStorage.setItem('pc_token',   Auth.getToken());
  sessionStorage.setItem('pc_session', JSON.stringify(Auth.getSession()));
}

function restoreSession() {
  const token   = sessionStorage.getItem('pc_token');
  const session = sessionStorage.getItem('pc_session');
  if (token && session) {
    Auth.setToken(token);
    Auth.setSession(JSON.parse(session));
    return true;
  }
  return false;
}

function requireAuth() {
  if (!restoreSession()) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

/* ─── GUARD DE ROL ADMINISTRADOR ─── */
function requireAdmin() {
  if (!requireAuth()) return false;
  const session = Auth.getSession();
  if (session.rolId !== 1) {
    // Mostrar overlay de acceso denegado
    const overlay = document.getElementById('access-denied-overlay');
    if (overlay) {
      overlay.style.display = 'flex';
    } else {
      // Crear overlay dinámico
      const div = document.createElement('div');
      div.id = 'access-denied-overlay';
      div.innerHTML = `
        <div class="access-denied-box">
          <div class="access-denied-icon"><i class="fas fa-lock"></i></div>
          <div class="access-denied-title">Acceso Restringido</div>
          <div class="access-denied-msg">Este módulo es exclusivo para <strong>Administradores</strong>.<br>
          Contacta al administrador del sistema si necesitas acceso.</div>
          <button class="btn btn-primary" onclick="navigate('dashboard.html')">
            <i class="fas fa-home"></i> Ir al Dashboard
          </button>
        </div>
      `;
      div.style.cssText = `
        position:fixed;inset:0;background:rgba(26,15,0,.72);z-index:9999;
        display:flex;align-items:center;justify-content:center;padding:16px;
      `;
      document.body.appendChild(div);
    }
    // Bloquear todo el contenido debajo
    document.querySelector('.page-content')?.style.setProperty('filter','blur(4px)');
    return false;
  }
  return true;
}

/* ─── INIT GLOBAL ─── */
function initPage(titleText, { adminOnly = false } = {}) {
  if (!requireAuth()) return false;

  if (adminOnly && !requireAdmin()) return false;

  initModals();
  initSidebarMobile();
  initLogout();
  loadSidebarUser();
  setActiveNav();
  applySidebarRoleFilter();
  updateTopbarDate();
  setInterval(updateTopbarDate, 60000);

  const titleEl = document.getElementById('topbar-title');
  if (titleEl && titleText) titleEl.textContent = titleText;

  return true;
}

/* ─── SIDEBAR: ocultar items de admin para no-admin ─── */
function applySidebarRoleFilter() {
  if (!restoreSession()) return;
  const session = Auth.getSession();
  if (session.rolId !== 1) {
    // Ocultar módulos de admin en el sidebar
    document.querySelectorAll('.nav-item[data-admin-only]').forEach(el => {
      el.style.display = 'none';
    });
  }
}
