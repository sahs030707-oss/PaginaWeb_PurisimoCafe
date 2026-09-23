/* services/LoginService.js — Servicio de Login */

const LoginService = {
  login: (correo, clave) =>
    fetch(API_BASE + '/api/Login/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ Correo: correo, Clave: clave })
    }),
};
