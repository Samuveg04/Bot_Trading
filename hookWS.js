window.POBOT = window.POBOT || {};

POBOT.ws = {
  sockets: [],
  priceSocket: null,

  init() {
    const OriginalWS = window.WebSocket;

    // Sobrescribir WebSocket para capturar nuevas conexiones
    window.WebSocket = function (url, protocols) {
      const ws = protocols ? new OriginalWS(url, protocols) : new OriginalWS(url);
      POBOT.ws.attach(ws, url);
      return ws;
    };

    // Enganchar websockets ya existentes
    if (window.__wsPool && Array.isArray(window.__wsPool)) {
      window.__wsPool.forEach(ws => {
        if (!ws.__po_hooked) {
          POBOT.ws.attach(ws, ws.url || "existing");
          ws.__po_hooked = true;
          console.log("[POBOT] Socket existente enganchado:", ws.url || "unknown");
        }
      });
    } else {
      console.warn("[POBOT] No se encontró pool de websockets activos");
    }

    console.log("[POBOT] WebSocket hook activo");
  },

  attach(ws, url) {
    ws.__po_url = url;
    ws.__logged = false;

    ws.addEventListener("message", (e) => {
      POBOT.ws.onMessage(ws, e.data);
    });

    ws.addEventListener("open", () => {
      console.log("[POBOT] WS abierto:", url);
    });

    POBOT.ws.sockets.push(ws);
  },

  onMessage(ws, data) {
    if (!ws.__logged) {
      console.log("[POBOT RAW TYPE]", typeof data, data);
      ws.__logged = true;
    }

    const tick = POBOT.ws.decodePayload(data);
    if (tick) {
      console.log("[POBOT TICK]", tick);
      POBOT.ws.priceSocket = ws;
    }
  },

  decodePayload(payload) {
    try {
      let text = "";

      if (payload instanceof ArrayBuffer) {
        text = new TextDecoder().decode(new Uint8Array(payload));
      }

      if (typeof payload === "string") {
        text = payload;
      }

      if (!text) return null;

      const start = text.indexOf("[[");
      const end = text.lastIndexOf("]]");
      if (start === -1 || end === -1) return null;

      const json = text.substring(start, end + 2);
      const parsed = JSON.parse(json);

      if (!Array.isArray(parsed)) return null;

      const [asset, time, price] = parsed[0];
      return { asset, time, price };
    } catch (e) {
      return null;
    }
  }
};
