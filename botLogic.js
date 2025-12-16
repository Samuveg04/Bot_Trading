// loader.js
(function() {
  if (window.POBOT && window.POBOT.loaded) {
    console.log("[POBOT] Ya cargado");
    return;
  }

  window.POBOT = window.POBOT || {};
  window.POBOT.loaded = false;

  const files = [
    "hookWS.js",
    "botLogic.js"
  ];

  let loadedCount = 0;

  function loadScript(file) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `https://cdn.jsdelivr.net/gh/Samuveg04/Bot_Trading@main/${file}`;
      script.onload = () => {
        console.log(`[POBOT] Cargado: ${file}`);
        loadedCount++;
        resolve();
      };
      script.onerror = () => reject(`[POBOT] Error cargando: ${file}`);
      document.head.appendChild(script);
    });
  }

  async function loadAll() {
    try {
      for (const f of files) {
        await loadScript(f);
      }
      window.POBOT.loaded = true;
      if (window.POBOT.ws && window.POBOT.ws.init) window.POBOT.ws.init();
      console.log("[POBOT] Bot cargado y listo");
    } catch (e) {
      console.error(e);
    }
  }

  loadAll();
})();
