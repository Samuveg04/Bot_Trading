// hookWS.js
window.POBOT = window.POBOT || {};

POBOT.ws = {
  sockets: [],

  init() {
    const OriginalWS = window.WebSocket;

    window.WebSocket = function(url, protocols) {
      const ws = protocols ? new OriginalWS(url, protocols) : new OriginalWS(url);
      POBOT.ws.attach(ws, url);
      return ws;
    };

    console.log("[POBOT] WebSocket hook activo");
  },

  attach(ws, url) {
    ws.__po_url = url;

    ws.addEventListener("open", () => {
      console.log("[POBOT] WS abierto:", url);
    });

    ws.addEventListener("message", (e) => {
      console.log("[POBOT] WS mensaje recibido:", e.data);
      if (window.POBOT.bot && window.POBOT.bot.processMessage) {
        window.POBOT.bot.processMessage(e.data);
      }
    });

    this.sockets.push(ws);
  }
};
