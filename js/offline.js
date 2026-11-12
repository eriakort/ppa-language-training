/* Registers the offline copy (sw.js) on the website. Not inside the Claude artifact, which can't use it. */
(function () {
  "use strict";
  if (!("serviceWorker" in navigator) || window.POG_NO_SW) return;
  if (window.claude && typeof window.claude.use === "function") return;
  if (location.protocol !== "https:" && location.hostname !== "localhost" && location.hostname !== "127.0.0.1") return;
  window.addEventListener("load", function () { navigator.serviceWorker.register("sw.js").catch(function () {}); });
})();
