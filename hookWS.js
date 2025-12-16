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

    // Añadido: loguear nueva conexión
    console.log("[POBOT] Nuevo WS creado:", url);

    ws.addEventListener("message", (e) => {
      // Añadido: loguear recepción de mensaje
      console.log("[POBOT] WS mensaje recibido de:", url);
      POBOT.ws.onMessage(ws, e.data);
    });

    ws.addEventListener("open", () => {
      console.log("[POBOT] WS abierto:", url);
    });

    POBOT.ws.sockets.push(ws);
  },

  onMessage(ws, data) {
    // Añadido: loguear cada mensaje recibido
    console.log("[POBOT onMessage] Data recibida:", data);

    try {
      let text = data instanceof ArrayBuffer
        ? new TextDecoder().decode(new Uint8Array(data))
        : data;

      // Añadido: mostrar texto decodificado
      console.log("[POBOT] Payload texto:", text);

      const start = text.indexOf("[[");
      const end = text.lastIndexOf("]]");
      if (start === -1 || end === -1) return;

      const json = text.substring(start, end + 2);
      const parsed = JSON.parse(json);

      if (!Array.isArray(parsed)) return;

      const [asset, time, price] = parsed[0];
      console.log("[POBOT TICK]", { asset, time, price });

      POBOT.ws.priceSocket = ws;

    } catch (e) {
      console.error("[POBOT] Error decodificando payload:", e);
    }
  }
};
