(function () {
  "use strict";
  var cfg = window.POG_SUPABASE_CONFIG || {};
  var copy = {
    it: {
      title:"Backup cloud", open:"Backup cloud", intro:"Puoi conservare una copia dei progressi online e ripristinarla su un altro dispositivo.",
      privacy:"La copia può contenere nome o soprannome, anno di nascita se inserito, città e interessi, impostazioni, frasi personali, esercizi svolti, risultati e checkpoint della sessione. Con lo stesso consenso vengono condivise con i terapisti autorizzati anche misure aggregate delle sessioni: data, modalità, numero di elementi e risposte vocali, avvio medio della risposta, parole al minuto e pause. Queste misure non includono etichette degli esercizi, frasi personali o trascrizioni. Le registrazioni audio non vengono mai caricate.",
      local:"I dati restano su questo dispositivo finché non scegli esplicitamente di creare una copia. Dopo la prima copia o il ripristino, le modifiche vengono sincronizzate automaticamente.",
      consent:"Ho letto queste informazioni e acconsento a caricare la copia cloud nel mio account e a condividere le misure aggregate indicate con i terapisti autorizzati che hanno accesso al profilo.",
      enable:"Acconsenti e continua", backup:"Crea / aggiorna copia", restore:"Ripristina da cloud", status:"Stato", signedOut:"Accedi prima al tuo account.",
      unavailable:"Backup online non configurato. L'app continua a funzionare in modalità locale.",
      noProfile:"Crea prima un profilo locale.", create:"Crea profilo cloud e copia i dati", done:"Copia cloud aggiornata.", restored:"Dati ripristinati. La pagina verrà ricaricata.",
      none:"Non esiste ancora una copia cloud.", last:"Ultima copia", warning:"Il ripristino sostituisce sul dispositivo i dati locali inclusi nella copia. I dati cloud non vengono modificati.",
      confirmRestore:"Vuoi sostituire i dati locali di questo profilo con la copia cloud? Questa operazione non può essere annullata.",
      confirmBackup:"Caricare nel tuo account la copia dei dati elencati nell'informativa?",
      revoke:"Disattiva il backup su questo dispositivo", revoked:"Consenso revocato su questo dispositivo. La copia già presente nel cloud non è stata cancellata.",
      account:"Apri account", close:"Chiudi", error:"Operazione non riuscita. Riprova.", noMapping:"Profilo cloud non collegato.",
      linked:"Profilo cloud collegato", consentMissing:"Per continuare devi confermare il consenso.", find:"Trova i profili cloud", link:"Collega profilo selezionato", confirmLink:"Collegare questo profilo locale al profilo cloud selezionato?", noCloudProfiles:"Non ci sono profili cloud accessibili con questo account."
    },
    en: {
      title:"Cloud backup", open:"Cloud backup", intro:"Keep a copy of your progress online and restore it on another device.",
      privacy:"The backup may contain a name or nickname, optional birth year, town and interests, settings, personal phrases, completed exercises, results and the active session checkpoint. The same consent also shares aggregate session measures with authorised therapists who have access to the profile: date, mode, item and spoken-response counts, average response onset, words per minute and pauses. These measures do not include exercise labels, personal phrases or transcripts. Audio recordings are never uploaded.",
      local:"Your data stays on this device until you explicitly create or restore a backup. After that, changes are synchronized automatically.",
      consent:"I have read this information and consent to uploading the cloud backup to my account and sharing the listed aggregate measures with authorised therapists who have access to the profile.",
      enable:"Consent and continue", backup:"Create / update backup", restore:"Restore from cloud", status:"Status", signedOut:"Sign in to your account first.",
      unavailable:"Online backup is not configured. The app continues to work locally.",
      noProfile:"Create a local learner profile first.", create:"Create cloud profile and back up data", done:"Cloud backup updated.",
      restored:"Data restored. The page will reload.", none:"No cloud backup exists yet.", last:"Last backup",
      warning:"Restoring replaces the local data covered by the backup on this device. Cloud data is not changed.",
      confirmRestore:"Replace this profile's local data with the cloud backup? This cannot be undone.",
      confirmBackup:"Upload the data described in the privacy notice to your account?",
      revoke:"Turn off backup on this device", revoked:"Consent revoked on this device. The existing cloud copy has not been deleted.",
      account:"Open account", close:"Close", error:"The operation failed. Please try again.", noMapping:"No cloud profile is linked.",
      linked:"Cloud profile linked", consentMissing:"You must confirm consent to continue.", find:"Find my cloud profiles", link:"Link selected profile", confirmLink:"Link this local profile to the selected cloud profile?", noCloudProfiles:"No cloud profiles are available to this account."
    }
  };
  var lang = window.POG.getLang(), T = copy[lang];
  var client = null, panel = null, launcher = null, message = "", error = "", cloudProfileId = "", lastUpdated = "", isSignedIn = false, availableProfiles = [];
  var KEYS = ["profile","settings","placement","history","sessions","scripts_it","scripts_en","active_session"];
  function configured() { return !!(cfg.url && cfg.anonKey && window.supabase && window.supabase.createClient); }
  if (configured()) {
    try { client = window.supabase.createClient(cfg.url,cfg.anonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}); }
    catch (e) { client = null; }
  }
  function activeId() { return localStorage.getItem("pog_active_profile_id") || ""; }
  function localKey(k) { var id=activeId(); return id ? "pog_p_"+id+"_"+k : "pog_"+k; }
  function mapKey(profileId) { return "pog_cloud_profile_"+(profileId===undefined?activeId():profileId); }
  function consentKey(profileId) { return "pog_cloud_consent_"+(profileId===undefined?activeId():profileId); }
  function hasConsent(profileId) { return !!localStorage.getItem(consentKey(profileId)); }
  function profileName(profileId) {
    var id=profileId===undefined?activeId():profileId;
    try { var p=JSON.parse(localStorage.getItem(id?"pog_p_"+id+"_profile":"pog_profile")||"null"); if(p&&p.name)return p.name; } catch(e) {}
    return "";
  }
  function snapshot(profileId) {
    var data={}, id=profileId||activeId();
    KEYS.forEach(function(k){ var raw=localStorage.getItem(id ? "pog_p_"+id+"_"+k : "pog_"+k); if(raw!==null){ try{data[k]=JSON.parse(raw);}catch(e){} } });
    return {version:1,savedAt:new Date().toISOString(),data:data};
  }
  function el(tag,attrs,value){var n=document.createElement(tag);Object.keys(attrs||{}).forEach(function(k){n.setAttribute(k,attrs[k]);});if(value!=null)n.textContent=value;return n;}
  function escapeHtml(s){return String(s).replace(/[&<>"']/g,function(c){return({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c];});}
  function status() {
    if(!client)return T.unavailable;
    if(!activeId())return T.noProfile;
    if(!isSignedIn)return T.signedOut;
    if(!localStorage.getItem(consentKey()))return T.local;
    return T.linked;
  }
  function render() {
    if(!panel)return;
    var html='<div class="cloud-card"><div class="account-head"><h2 id="cloud-title">'+T.title+'</h2><button type="button" class="account-close" data-cloud="close" aria-label="'+T.close+'">×</button></div>';
    html+='<p>'+T.intro+'</p><p class="account-note">'+T.privacy+'</p><p class="account-note">'+T.local+'</p>';
    html+='<p><strong>'+T.status+':</strong> '+escapeHtml(status())+'</p>';
    if(client&&!isSignedIn)html+='<button class="link" data-cloud="account">'+T.account+'</button>';
    if(lastUpdated)html+='<p class="account-note">'+T.last+': '+escapeHtml(new Date(lastUpdated).toLocaleString(lang==="it"?"it-IT":"en-GB"))+'</p>';
    if(!client)html+='<p class="account-error">'+T.unavailable+'</p>';
    else if(!activeId())html+='<p class="account-error">'+T.noProfile+'</p>';
    else if(!localStorage.getItem(consentKey())) {
      html+='<label class="cloud-consent"><input type="checkbox" id="cloud-consent"> '+T.consent+'</label><button class="primary account-action" data-cloud="consent">'+T.enable+'</button>';
    } else {
      if(!cloudProfileId) {
        html+='<button class="primary account-action" data-cloud="create">'+T.create+'</button><button class="account-action" data-cloud="find">'+T.find+'</button>';
        if(availableProfiles.length) {
          html+='<label>'+T.status+'<select id="cloud-profile-choice">';
          availableProfiles.forEach(function(p){html+='<option value="'+escapeHtml(p.id)+'">'+escapeHtml(p.display_name)+'</option>';});
          html+='</select></label><button class="account-action" data-cloud="link">'+T.link+'</button>';
        }
      } else html+='<p class="account-message">'+T.linked+'</p><button class="primary account-action" data-cloud="backup">'+T.backup+'</button><button class="account-action" data-cloud="restore">'+T.restore+'</button>';
      html+='<button class="link" data-cloud="revoke">'+T.revoke+'</button>';
    }
    if(syncEnabled()) { var syncLabel = syncState === "conflict" ? (lang === "it" ? "Conflitto: scegli Backup o Ripristina." : "Conflict: choose Backup or Restore.") : syncState === "offline" ? (lang === "it" ? "Offline: modifiche in attesa." : "Offline: changes queued.") : syncState === "syncing" ? (lang === "it" ? "Sincronizzazione…" : "Synchronising…") : syncState === "queued" ? (lang === "it" ? "Modifiche in attesa…" : "Changes queued…") : syncState === "error" ? (lang === "it" ? "Sincronizzazione non riuscita; modifiche in attesa." : "Sync failed; changes remain queued.") : (lang === "it" ? "Sincronizzazione automatica attiva" : "Automatic sync is active"); html+='<p class="account-note" role="status">'+escapeHtml(syncLabel)+'</p><button class="account-action" data-cloud="sync">'+(lang === "it" ? "Sincronizza ora" : "Sync now")+'</button>'; }
    if(message)html+='<p class="account-message" role="status">'+escapeHtml(message)+'</p>';
    if(error)html+='<p class="account-error" role="alert">'+escapeHtml(error)+'</p>';
    html+='</div>';panel.innerHTML=html;
  }
  function show() {
    if(!panel){panel=el("section",{class:"cloud-panel",role:"dialog","aria-modal":"true","aria-labelledby":"cloud-title",hidden:""});document.body.appendChild(panel);bind();}
    cloudProfileId=localStorage.getItem(mapKey())||"";message="";error="";availableProfiles=[];
    panel.hidden=false;render();
    if(client)client.auth.getSession().then(function(r){isSignedIn=!!(r.data&&r.data.session);render();if(cloudProfileId&&isSignedIn)refreshCloudStatus();}).catch(fail);
  }
  function hide(){if(panel)panel.hidden=true;}
  function fail(e){error=e&&e.message?e.message:T.error;message="";render();}
  async function signedIn() {
    if(!client)throw new Error(T.unavailable);
    var r=await client.auth.getSession();
    if(r.error)throw r.error;
    if(!r.data.session)throw new Error(T.signedOut);
    return r.data.session;
  }
  async function ensureCloudProfile(profileId) {
    var existing=localStorage.getItem(mapKey(profileId))||"";
    if(!existing&&activeId()===profileId)existing=cloudProfileId;
    if(existing)return existing;
    var name=profileName(profileId); if(!name)throw new Error(T.noProfile);
    var result=await client.functions.invoke("profile-access",{body:{action:"create_profile",display_name:name.slice(0,80)}});
    if(result.error)throw result.error;
    if(!result.data||!result.data.profile||!result.data.profile.id)throw new Error(T.error);
    var id=result.data.profile.id;localStorage.setItem(mapKey(profileId),id);
    if(activeId()===profileId)cloudProfileId=id;
    return id;
  }
  async function refreshCloudStatus() {
    try {
      var r=await client.from("profile_data").select("updated_at").eq("profile_id",cloudProfileId).maybeSingle();
      if(r.error)throw r.error;
      lastUpdated=r.data&&r.data.updated_at?r.data.updated_at:"";
      render();
    }catch(e){fail(e);}
  }
  async function backup() {
    var profileId=activeId();
    await signedIn();
    if(activeId()!==profileId)throw new Error(T.noProfile);
    if(!hasConsent(profileId))throw new Error(T.consentMissing);
    var id=await ensureCloudProfile(profileId);
    if(activeId()!==profileId)throw new Error(T.noProfile);
    if(!hasConsent(profileId))throw new Error(T.consentMissing);
    var data=snapshot(profileId);
    var placement=data.data.placement||{};
    var r=await client.from("profile_data").update({preferences:data,placement:placement,updated_at:new Date().toISOString()}).eq("profile_id",id).select("updated_at,revision").single();
    if(r.error)throw r.error;
    lastUpdated=r.data.updated_at;localStorage.setItem("pog_cloud_sync_"+profileId+"_seen",String(r.data.revision||1));localStorage.setItem("pog_cloud_sync_"+profileId+"_enabled","1");localStorage.removeItem("pog_cloud_sync_"+profileId+"_dirty");syncState="idle";message=T.done;error="";render();
  }
  async function restore() {
    var profileId=activeId(), cloudId=localStorage.getItem(mapKey(profileId))||"";
    await signedIn();
    if(activeId()!==profileId)throw new Error(T.noProfile);
    if(!localStorage.getItem(consentKey(profileId)))throw new Error(T.consentMissing);
    if(!cloudId||localStorage.getItem(mapKey(profileId))!==cloudId)throw new Error(T.noMapping);
    var r=await client.from("profile_data").select("preferences,updated_at,revision").eq("profile_id",cloudId).single();
    if(r.error)throw r.error;
    if(activeId()!==profileId)throw new Error(T.noProfile);
    var saved=r.data.preferences;
    if(!saved||saved.version!==1||!saved.data||typeof saved.data!=="object")throw new Error(T.none);
    KEYS.forEach(function(k){
      var key=profileId?"pog_p_"+profileId+"_"+k:"pog_"+k;
      if(Object.prototype.hasOwnProperty.call(saved.data,k))localStorage.setItem(key,JSON.stringify(saved.data[k]));
      else localStorage.removeItem(key);
    });
    lastUpdated=r.data.updated_at;localStorage.setItem("pog_cloud_sync_"+profileId+"_seen",String(r.data.revision||1));localStorage.setItem("pog_cloud_sync_"+profileId+"_enabled","1");localStorage.removeItem("pog_cloud_sync_"+profileId+"_dirty");syncState="idle";message=T.restored;render();
    setTimeout(function(){window.location.reload();},500);
  }
  function bind() {
    panel.addEventListener("click",function(ev){
      var b=ev.target.closest("[data-cloud]");if(!b)return;
      var a=b.dataset.cloud;message="";error="";
      if(a==="close"){hide();return;}
      if(a==="account"){hide();var accountButton=document.querySelector(".account-launcher");if(accountButton)accountButton.click();return;}
      if(a==="consent"){
        var cb=panel.querySelector("#cloud-consent");
        if(!cb||!cb.checked){error=T.consentMissing;render();return;}
        localStorage.setItem(consentKey(),new Date().toISOString());render();return;
      }
      if(a==="revoke"){
        localStorage.removeItem(consentKey());message=T.revoked;render();return;
      }
      if(a==="find"){
        (async function(){try{
          await signedIn();
          var r=await client.from("learner_profiles").select("id,display_name").order("created_at",{ascending:true});
          if(r.error)throw r.error;
          availableProfiles=r.data||[];
          if(!availableProfiles.length)message=T.noCloudProfiles;
          render();
        }catch(e){fail(e);}})();return;
      }
      if(a==="link"){
        var choice=panel.querySelector("#cloud-profile-choice");
        if(!choice||!choice.value)return;
        if(!window.confirm(T.confirmLink))return;
        cloudProfileId=choice.value;localStorage.setItem(mapKey(),cloudProfileId);availableProfiles=[];
        refreshCloudStatus();return;
      }
      if(a==="create"){
        if(!window.confirm(T.confirmBackup))return;
        (async function(){try{await signedIn();await backup();}catch(e){fail(e);}})();return;
      }
      if(a==="backup"){
        if(!window.confirm(T.confirmBackup))return;
        backup().catch(fail);return;
      }
      if(a==="sync"){cloudProfileId=localStorage.getItem(mapKey())||cloudProfileId;syncNow();return;}
      if(a==="restore"){
        if(!window.confirm(T.warning+" "+T.confirmRestore))return;
        restore().catch(fail);return;
      }
    });
  }
  function mount(){
    var root=document.getElementById("app");
    if(!root||root.querySelector(".cloud-launcher"))return;
    launcher=el("button",{type:"button",class:"cloud-launcher","aria-haspopup":"dialog"},T.open);
    launcher.addEventListener("click",show);root.appendChild(launcher);
  }
  document.addEventListener("keydown",function(e){if(e.key==="Escape")hide();});
  if(client)client.auth.onAuthStateChange(function(event,session){isSignedIn=!!session;if(panel&&!panel.hidden){cloudProfileId=localStorage.getItem(mapKey())||"";render();}if(session){cloudProfileId=localStorage.getItem(mapKey())||"";if(syncEnabled())syncNow();}});
  if(window.MutationObserver){
    var root=document.getElementById("app");
    if(root)new MutationObserver(mount).observe(root,{childList:true});
  }
  mount();

  var syncTimer = null, syncState = "idle", syncing = false;
  function syncKey(s) { return "pog_cloud_sync_" + activeId() + "_" + s; }
  function syncEnabled() { return localStorage.getItem(syncKey("enabled")) === "1" && hasConsent(); }
  function queueSync() {
    cloudProfileId = cloudProfileId || localStorage.getItem(mapKey()) || "";
    if (!syncEnabled() || !localStorage.getItem(consentKey()) || !cloudProfileId) return;
    localStorage.setItem(syncKey("dirty"), "1");
    localStorage.setItem(syncKey("local_version"), String(Number(localStorage.getItem(syncKey("local_version")) || 0) + 1));
    syncState = navigator.onLine ? "queued" : "offline";
    render();
    if (!navigator.onLine) return;
    clearTimeout(syncTimer);
    syncTimer = setTimeout(syncNow, 1200);
  }
  function applyCloudSnapshot(saved, profileId) {
    if (!saved || saved.version !== 1 || !saved.data || typeof saved.data !== "object") throw new Error(T.none);
    var id=profileId||activeId();
    KEYS.forEach(function (k) {
      var storage=id ? "pog_p_"+id+"_"+k : "pog_"+k;
      if (Object.prototype.hasOwnProperty.call(saved.data, k)) localStorage.setItem(storage, JSON.stringify(saved.data[k]));
      else localStorage.removeItem(storage);
    });
  }
  async function syncNow() {
    var profileId=activeId(), cloudId=cloudProfileId;
    var localSyncKey=function(name){return "pog_cloud_sync_"+profileId+"_"+name;};
    if (syncing || !client || !navigator.onLine || !syncEnabled() || !cloudId || !localStorage.getItem("pog_cloud_consent_"+profileId)) return;
    syncing = true; syncState = "syncing"; render();
    try {
      await signedIn();
      if(activeId()!==profileId)return;
      if(!hasConsent(profileId)){syncState="idle";return;}
      var remote = await client.from("profile_data").select("preferences,updated_at,revision").eq("profile_id", cloudId).single();
      if (remote.error) throw remote.error;
      if(activeId()!==profileId)return;
      if(!hasConsent(profileId)){syncState="idle";return;}
      var base = Number(localStorage.getItem(localSyncKey("seen")) || 0);
      var remoteRevision = Number(remote.data.revision || 1);
      var remoteTime = remote.data.updated_at || "";
      var dirty = localStorage.getItem(localSyncKey("dirty")) === "1";
      var localVersion = Number(localStorage.getItem(localSyncKey("local_version")) || 0);
      if (base && remoteRevision !== base) {
        if (dirty) { syncState = "conflict"; return; }
        applyCloudSnapshot(remote.data.preferences,profileId);
        localStorage.setItem(localSyncKey("seen"), String(remoteRevision));
        lastUpdated = remoteTime;
        setTimeout(function () { window.location.reload(); }, 400);
        return;
      }
      if (!dirty) { syncState = "idle"; lastUpdated = remoteTime; return; }
      if (!base) { syncState = "conflict"; return; }
      var data = snapshot(profileId), now = new Date().toISOString();
      var result = await client.from("profile_data")
        .update({ preferences: data, placement: data.data.placement || {}, updated_at: now })
        .eq("profile_id", cloudId).eq("revision", base)
        .select("updated_at,revision").maybeSingle();
      if (result.error) throw result.error;
      if (!result.data) { syncState = "conflict"; return; }
      lastUpdated = result.data.updated_at;
      localStorage.setItem(localSyncKey("seen"), String(result.data.revision || (base + 1)));
      if (Number(localStorage.getItem(localSyncKey("local_version")) || 0) === localVersion) localStorage.removeItem(localSyncKey("dirty"));
      syncState = "idle";
    } catch (e) { syncState = navigator.onLine ? "error" : "offline"; }
    finally {
      syncing = false; render();
      if(activeId()!==profileId){cloudProfileId=localStorage.getItem(mapKey())||"";if(syncEnabled())setTimeout(syncNow,0);}
      else if (syncState === "idle" && localStorage.getItem(localSyncKey("dirty")) === "1") { clearTimeout(syncTimer); syncTimer = setTimeout(syncNow, 1200); }
    }
  }
  window.addEventListener("pog:languagechange", function (ev) {
    lang = ev.detail && ev.detail.lang === "en" ? "en" : "it";
    T = copy[lang];
    if (launcher) launcher.textContent = T.open;
    if (panel && !panel.hidden) render();
  });
  window.addEventListener("pog:local-change", function (event) {
    if (event.detail && event.detail.profileId === activeId()) queueSync();
  });
  window.addEventListener("online", function () {
    if (localStorage.getItem(syncKey("dirty")) === "1") syncNow();
  });
  window.addEventListener("offline", function () {
    if (localStorage.getItem(syncKey("dirty")) === "1") { syncState = "offline"; render(); }
  });
  window.addEventListener("focus", function () {
    cloudProfileId = localStorage.getItem(mapKey()) || "";
    if (syncEnabled()) syncNow();
  });
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden && syncEnabled()) { cloudProfileId = localStorage.getItem(mapKey()) || ""; syncNow(); }
  });
  window.addEventListener("pog:profile-change", function () {
    cloudProfileId = localStorage.getItem(mapKey()) || "";
    syncState = "idle";
    if (syncEnabled()) syncNow();
    render();
  });
  cloudProfileId = localStorage.getItem(mapKey()) || "";
  if (syncEnabled()) {
    if (localStorage.getItem(syncKey("dirty")) === "1") syncState = navigator.onLine ? "queued" : "offline";
    syncNow();
  }

})();
