window.POBOT = window.POBOT || {};

POBOT.ws = {
  sockets: [],
  priceSocket: null,

  init() {
    const OriginalWS = window.WebSocket;

    // Hook al constructor WebSocket para captar nuevas conexiones
    window.WebSocket = function(url, protocols) {
      const ws = protocols ? new OriginalWS(url, protocols) : new OriginalWS(url);
      POBOT.ws.attach(ws, url);
      return ws;
    };

    // Copiar propiedades del constructor original
    window.WebSocket.prototype = OriginalWS.prototype;
    window.WebSocket.CONNECTING = OriginalWS.CONNECTING;
    window.WebSocket.OPEN = OriginalWS.OPEN;
    window.WebSocket.CLOSING = OriginalWS.CLOSING;
    window.WebSocket.CLOSED = OriginalWS.CLOSED;

    // Enganchar websockets existentes (buscando en todas las propiedades globales)
    for (const key in window) {
      try {
        const val = window[key];
        if (val instanceof WebSocket && !val.__po_hooked) {
          POBOT.ws.attach(val, val.url || "existing");
          val.__po_hooked = true;
          console.log("[POBOT] Socket existente enganchado (global):", val.url || "unknown");
        }
      } catch (e) {
        // Evitar errores por propiedades inaccesibles
      }
    }

    // Intenta enganchar websockets en window.__wsPool (si existe)
    if (window.__wsPool && Array.isArray(window.__wsPool)) {
      window.__wsPool.forEach(ws => {
        if (!ws.__po_hooked) {
          POBOT.ws.attach(ws, ws.url || "existing");
          ws.__po_hooked = true;
          console.log("[POBOT] Socket existente enganchado (__wsPool):", ws.url || "unknown");
        }
      });
    }

    console.log("[POBOT] WebSocket hook activo");
  },

  attach(ws, url) {
    if (ws.__po_hooked) return; // Evitar enganchar dos veces
    ws.__po_url = url;
    ws.__po_hooked = true;
    ws.__logged = false;

    // Hookear send para debug (opcional)
    const originalSend = ws.send;
    ws.send = function(data) {
      //console.log("[POBOT SEND]", data);
      originalSend.apply(ws, arguments);
    };

    ws.addEventListener("message", (e) => {
      POBOT.ws.onMessage(ws, e.data);
    });

    ws.addEventListener("open", () => {
      console.log("[POBOT] WS abierto:", url);
    });

    ws.addEventListener("close", () => {
      console.log("[POBOT] WS cerrado:", url);
    });

    ws.addEventListener("error", (err) => {
      console.error("[POBOT] WS error:", url, err);
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
