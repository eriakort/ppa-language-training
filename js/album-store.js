/*
 * Album storage, in this browser only (IndexedDB). Nothing here is uploaded or synced.
 * Items: { id, profileId, kind, name, note, photo (Blob), audio (Blob), audioMime, updatedAt }
 *   kind "person" | "thing" | "place"  an album entry with an optional photo and voice clip
 *   kind "voice"                       a family member's recording of a phrase; name = the phrase
 */
window.POG = window.POG || {};
window.POG.albumStore = (function () {
  "use strict";
  var DB = "pog-album", STORE = "items", dbp = null;
  function open() {
    if (dbp) return dbp;
    dbp = new Promise(function (resolve, reject) {
      if (!window.indexedDB) { reject(new Error("no-indexeddb")); return; }
      var rq;
      try { rq = indexedDB.open(DB, 1); } catch (e) { reject(e); return; }
      rq.onupgradeneeded = function () { rq.result.createObjectStore(STORE, { keyPath: "id" }).createIndex("profileId", "profileId"); };
      rq.onsuccess = function () { resolve(rq.result); };
      rq.onerror = function () { reject(rq.error); };
    });
    dbp.catch(function () { dbp = null; });
    return dbp;
  }
  function run(mode, fn) {
    return open().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(STORE, mode), req = fn(tx.objectStore(STORE));
        tx.oncomplete = function () { resolve(req ? req.result : undefined); };
        tx.onerror = function () { reject(tx.error); };
        tx.onabort = function () { reject(tx.error); };
      });
    });
  }
  return {
    list: function (profileId) {
      return run("readonly", function (s) { return s.getAll(); }).then(function (all) {
        return (all || []).filter(function (x) { return (x.profileId || "") === (profileId || ""); })
          .sort(function (a, b) { return (a.updatedAt || 0) - (b.updatedAt || 0); });
      });
    },
    put: function (item) { item.updatedAt = Date.now(); return run("readwrite", function (s) { return s.put(item); }); },
    remove: function (id) { return run("readwrite", function (s) { return s.delete(id); }); },
    newId: function () { return "a" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  };
})();
