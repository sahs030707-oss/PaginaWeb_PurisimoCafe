// Si ya tiene sesión, redirigir
if (restoreSession()) {
  window.location.href = 'dashboard.html';
}

const btnLogin   = document.getElementById('btn-login');
const emailInput = document.getElementById('login-email');
const passInput  = document.getElementById('login-pass');
const errorEl    = document.getElementById('login-error');

passInput.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
btnLogin.addEventListener('click', doLogin);

async function doLogin() {
  const email = emailInput.value.trim();
  const pass  = passInput.value;
  errorEl.textContent = '';

  if (!email || !pass) {
    errorEl.textContent = 'Por favor completa todos los campos.';
    return;
  }

  btnLogin.innerHTML = '<span class="spinner"></span> Ingresando...';
  btnLogin.disabled  = true;

  try {
    const res = await LoginService.login(email, pass);

    if (!res.ok) {
      const t = await res.text().catch(() => '');
      throw new Error(t || 'Credenciales inválidas');
    }

    const data = await res.json();

    // La API devuelve PascalCase: { Token, Usuario, Correo, RolId }
    const token   = data.Token   ?? data.token;
    const usuario = data.Usuario ?? data.usuario ?? '';
    const correo  = data.Correo  ?? data.correo  ?? email;
    const rolId   = data.RolId   ?? data.rolId   ?? data.rolID ?? 2;

    if (!token) throw new Error('La API no devolvió token');

    Auth.setToken(token);
    Auth.setSession({ token, usuario, correo, rolId });
    saveSession();

    window.location.href = 'dashboard.html';
  } catch (e) {
    errorEl.textContent = 'Credenciales incorrectas. Intenta de nuevo.';
    passInput.value     = '';
    btnLogin.innerHTML  = 'Iniciar Sesión';
    btnLogin.disabled   = false;
  }
}
