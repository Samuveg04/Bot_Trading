window.POBOT = window.POBOT || {};

POBOT.ws = {
  sockets: [],
  priceSocket: null,
  lastAsset: null,

  init() {
  const OriginalWS = window.WebSocket;

  // Hook global
  window.WebSocket = function (url, protocols) {
    const ws = protocols
      ? new OriginalWS(url, protocols)
      : new OriginalWS(url);

    POBOT.ws.attach(ws, url);
    return ws;
  };

  // Hook sockets ya existentes (fallback)
  if (window.__wsPool) {
    window.__wsPool.forEach(ws => {
      POBOT.ws.attach(ws, ws.url || "existing");
    });
  }

  console.log("[POBOT] WebSocket hook activo");
},

attach(ws, url) {
  ws.__po_url = url;
  ws.__isPrice = false;

  ws.addEventListener("message", (e) => {
    POBOT.ws.onMessage(ws, e.data);
  });

  ws.addEventListener("open", () => {
    console.log("[POBOT] WS abierto:", url);
  });

  POBOT.ws.sockets.push(ws);
}

  onMessage(ws, data) {
    // BINARIO = precios
    if (data instanceof ArrayBuffer) {
      ws.__isPrice = true;
      POBOT.ws.priceSocket = ws;

      const tick = POBOT.ws.decodeBinary(data);
      if (tick) {
        console.log("[POBOT TICK]", tick);
      }
      return;
    }

    // TEXTO = eventos
    if (typeof data === "string") {
      try {
        const msg = JSON.parse(data);

        // Detectar activo seleccionado
        if (Array.isArray(msg) && msg[0] === "setActiveAsset") {
          POBOT.ws.lastAsset = msg[1];
          console.log("[POBOT] Activo:", msg[1]);
        }
      } catch (_) {}
    }
  },

  decodeBinary(buffer) {
  try {
    // ArrayBuffer → Uint8
    const bytes = new Uint8Array(buffer);

    // Uint8 → HEX
    let hex = "";
    for (let b of bytes) {
      hex += b.toString(16).padStart(2, "0");
    }

    // HEX → STRING
    let str = "";
    for (let i = 0; i < hex.length; i += 2) {
      str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    }

    // Buscar JSON válido
    const start = str.indexOf("[[");
    const end = str.lastIndexOf("]]");

    if (start === -1 || end === -1) return null;

    const json = str.substring(start, end + 2);
    const parsed = JSON.parse(json);

    const [asset, time, price] = parsed[0];

    return { asset, time, price };
  } catch (e) {
    return null;
  }
}
};


