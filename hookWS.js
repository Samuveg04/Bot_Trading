window.POBOT = window.POBOT || {};

POBOT.ws = {
  sockets: [],
  priceSocket: null,
  lastAsset: null,

  init() {
    const OriginalWS = window.WebSocket;

    window.WebSocket = function (url, protocols) {
      const ws = protocols
        ? new OriginalWS(url, protocols)
        : new OriginalWS(url);

      ws.__po_url = url;
      ws.__isPrice = false;

      ws.addEventListener("message", (e) => {
        POBOT.ws.onMessage(ws, e.data);
      });

      ws.addEventListener("open", () => {
        console.log("[POBOT] WS abierto:", url);
      });

      POBOT.ws.sockets.push(ws);
      return ws;
    };
  },

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
      const bytes = new Uint8Array(buffer);
      const text = new TextDecoder().decode(bytes);

      // Ejemplo esperado: [["AUDJPY",1765888620.276,102.778]]
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) return null;

      const [asset, time, price] = parsed[0];
      return {
        asset,
        time,
        price
      };
    } catch (e) {
      return null;
    }
  }
};
