const fs = require('fs');
const path = require('path');
// Mimic what mock-server does
try { require('node:process').loadEnvFile?.(); } catch (e) { console.log('loadEnvFile err:', e.message); }
const k = process.env.GEMINI_API_KEY;
console.log('GEMINI_API_KEY present:', !!k, 'len:', (k||'').length);
console.log('first5:', (k||'').slice(0,5));
// Now test the actual Gemini call like the server does
if (k) {
  fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
    method:'POST',
    headers:{'Content-Type':'application/json', Authorization:'Bearer '+k},
    body: JSON.stringify({model:'gemini-3.6-flash', messages:[{role:'user',content:'Reply JSON only: {"ok":true}'}], temperature:0.2})
  }).then(r=>r.text()).then(t=>console.log('GEMINI RESP:', t.slice(0,200))).catch(e=>console.log('FETCH ERR:', e.message));
}
