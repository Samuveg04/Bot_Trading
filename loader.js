(function () {
  // Evitar doble carga
  if (window.POBOT && window.POBOT.loaded) {
    console.log("[POBOT] Ya estaba cargado");
    return;
  }

  // Namespace global
  window.POBOT = window.POBOT || {};
  window.POBOT.loaded = false;

  // Archivos principales del bot
  const files = [
    "hookWS.js"
  ];

  let loadedCount = 0;

  function loadScript(file) {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/gh/Samuveg04/Bot_Trading@main/" + file + "?v=1";
    script.onload = function () {
      loadedCount++;
      console.log("[POBOT] Archivo cargado:", file);

      if (loadedCount === files.length) {
        window.POBOT.loaded = true;
        console.log("[POBOT] Bot cargado completamente");

        // Inicializar WebSocket hook
        if (window.POBOT.ws && typeof window.POBOT.ws.init === "function") {
          window.POBOT.ws.init();
        }
      }
    };

    script.onerror = function () {
      console.error("[POBOT] Error cargando:", file);
    };

    document.documentElement.appendChild(script);
  }

  files.forEach(loadScript);
})();
