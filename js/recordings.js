/*
 * Voice recordings, kept in this browser only (IndexedDB). Nothing is uploaded.
 * Each record: { id, t (ms timestamp), session, game, lv, label, heard, result, measures, mime, blob }
 */
window.POG = window.POG || {};
window.POG.recordings = (function () {
  "use strict";
  var DB = "pog-audio", STORE = "rec", dbp = null;
  var RETENTION_MS = 30 * 24 * 3600 * 1000;

  function open() {
    if (dbp) return dbp;
    dbp = new Promise(function (resolve, reject) {
      if (!window.indexedDB) { reject(new Error("no-indexeddb")); return; }
      var rq;
      try { rq = indexedDB.open(DB, 1); } catch (e) { reject(e); return; }
      rq.onupgradeneeded = function () { rq.result.createObjectStore(STORE, { keyPath: "id" }).createIndex("t", "t"); };
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
  var api = {
    retentionDays: 30,
    add: function (rec) { return run("readwrite", function (s) { return s.put(rec); }); },
    list: function (profileId) {
      return run("readonly", function (s) { return s.getAll(); }).then(function (all) {
        return (all || []).filter(function (rec) { return !profileId || rec.profileId === profileId; }).sort(function (a, b) { return b.t - a.t; });
      });
    },
    assignLegacy: function (profileId) {
      if (!profileId) return Promise.resolve(0);
      return run("readwrite", function (s) { var req = s.getAll(); req.onsuccess = function () { (req.result || []).filter(function (rec) { return !rec.profileId; }).forEach(function (rec) { rec.profileId = profileId; s.put(rec); }); }; return req; }).then(function (all) { return all ? all.length : 0; });
    },
    remove: function (id) { return run("readwrite", function (s) { return s.delete(id); }); },
    clear: function (profileId) {
      if (!profileId) return run("readwrite", function (s) { return s.clear(); });
      return run("readwrite", function (s) { var req = s.getAll(); req.onsuccess = function () { (req.result || []).filter(function (rec) { return rec.profileId === profileId; }).forEach(function (rec) { s.delete(rec.id); }); }; return req; });
    },
    /* Deletes recordings older than the retention period. Resolves with how many were deleted. */
    purge: function (now) {
      var limit = (now || Date.now()) - RETENTION_MS;
      return api.list().then(function (all) {
        var old = all.filter(function (r) { return r.t < limit; });
        return Promise.all(old.map(function (r) { return api.remove(r.id); })).then(function () { return old.length; });
      });
    },
    count: function () { return run("readonly", function (s) { return s.count(); }); }
  };
  return api;
})();
