window.POBOT = window.POBOT || {};

POBOT.ws = {
  sockets: [],
  priceSocket: null,

  init() {
    const OriginalWS = window.WebSocket;

    window.WebSocket = function (url, protocols) {
      const ws = protocols
        ? new OriginalWS(url, protocols)
        : new OriginalWS(url);

      POBOT.ws.attach(ws, url);
      return ws;
    };

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
    // Debug inicial (solo una vez por socket)
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

      // ArrayBuffer
      if (payload instanceof ArrayBuffer) {
        text = new TextDecoder().decode(new Uint8Array(payload));
      }

      // String
      if (typeof payload === "string") {
        text = payload;
      }

      if (!text) return null;

      // Limpiar prefijos Socket.IO
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
