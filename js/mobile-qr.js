document.addEventListener('DOMContentLoaded', async () => {
  const img = document.getElementById('mobile-qr-img');
  const urlEl = document.getElementById('mobile-url');
  const copyBtn = document.getElementById('mobile-copy-btn');
  const tipsEl = document.getElementById('mobile-tips');
  if (!img || !urlEl) return;

  const apiBase = window.location.protocol === 'file:' ? 'http://localhost:3001/api' : '/api';

  try {
    const data = await fetch(`${apiBase}/mobile-url`).then(r => r.json());
    img.src = data.qr;
    img.alt = `QR para ${data.url}`;
    urlEl.innerHTML = `<a href="${data.url}" target="_blank" rel="noopener">${data.url}</a>`;

    if (tipsEl) {
      const iface = data.interface ? ` (${data.interface})` : '';
      let tips = `<strong>Usa esta dirección en tu celular${iface}:</strong> ${data.url}`;
      tips += '<br><small>Si no carga: conecta el teléfono a la misma WiFi y permite el puerto 3001 en el firewall de Windows.</small>';
      if (data.allUrls?.length > 1) {
        tips += '<br><small>Otras IPs detectadas: ' +
          data.allUrls.slice(1).map(u => u.url).join(', ') + '</small>';
      }
      tipsEl.innerHTML = tips;
    }

    copyBtn?.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(data.url);
        copyBtn.textContent = '¡Copiado!';
        setTimeout(() => { copyBtn.textContent = 'Copiar enlace'; }, 2000);
      } catch {
        copyBtn.textContent = 'No se pudo copiar';
      }
    });
  } catch {
    const fallback = window.location.origin;
    urlEl.textContent = fallback;
    img.src = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(fallback)}`;
  }
});
