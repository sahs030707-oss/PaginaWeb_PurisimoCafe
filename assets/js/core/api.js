/* core/api.js — Comunicación con la API REST
   PurísimoCafe Sistema de Gestión
*/

const API_BASE = 'https://localhost:7280';

/* ─── AUTENTICACIÓN EN MEMORIA ─── */
const Auth = {
  _token:   '',
  _session: {},

  setToken(t)  { this._token   = t; },
  getToken()   { return this._token; },
  setSession(s){ this._session = s; },
  getSession() { return this._session; },
  clear()      { this._token = ''; this._session = {}; },
  isLogged()   { return !!this._token; },

  isAdmin()    { return this._session.rolId === 1; }
};

/* ─── FUNCIÓN PRINCIPAL DE FETCH ─── */
async function apiFetch(method, path, body = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (Auth.getToken()) headers['Authorization'] = 'Bearer ' + Auth.getToken();

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(API_BASE + path, options);

  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText);
    throw new Error(text || `Error ${response.status}`);
  }

  const ct = response.headers.get('content-type') || '';
  return ct.includes('application/json') ? response.json() : response.text();
}

/* ─── MÉTODOS RÁPIDOS ─── */
const API = {
  get:    (path)       => apiFetch('GET',    path),
  post:   (path, body) => apiFetch('POST',   path, body),
  put:    (path, body) => apiFetch('PUT',    path, body),
  delete: (path)       => apiFetch('DELETE', path),
};

/* ─── HELPERS GLOBALES ─── */
function fmt(n)         { return 'C$' + Number(n).toFixed(2); }
function fmtDate(d)     { return d ? new Date(d).toLocaleString('es-NI', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—'; }
function fmtDateOnly(d) { return d ? new Date(d).toLocaleDateString('es-NI') : '—'; }
function getRolNombre(id) { return id === 1 ? 'Administrador' : 'Cajero'; }
