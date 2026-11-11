(function () {
  "use strict";
  var cfg=window.POG_SUPABASE_CONFIG||{}, client=null, root=null, timer=null, busy=false, conflict=null;
  var KEYS=["profile","settings","placement","history","sessions","scripts_it","scripts_en","active_session"];
  var text={
    it:{idle:"Sincronizzato",pending:"Modifiche in attesa…",offline:"Offline · modifiche in coda",setup:"Backup iniziale richiesto",signed:"Accedi per sincronizzare",consent:"Sincronizzazione disattivata: consenso richiesto",working:"Sincronizzazione…",error:"Sincronizzazione non riuscita",conflict:"Conflitto: scegli quale copia conservare",cloud:"Usa copia cloud",local:"Mantieni questa copia",resolve:"Risolvi",saved:"Modifiche sincronizzate"},
    en:{idle:"Synced",pending:"Changes waiting…",offline:"Offline · changes queued",setup:"Initial backup required",signed:"Sign in to sync",consent:"Sync paused: consent required",working:"Syncing…",error:"Sync failed",conflict:"Conflict: choose which copy to keep",cloud:"Use cloud copy",local:"Keep this device",resolve:"Resolve",saved:"Changes synced"}
  };
  var lang=localStorage.getItem("pog_lang")==="en"?"en":"it", T=text[lang], state="idle";
  function active(){return localStorage.getItem("pog_active_profile_id")||"";}
  function mapping(){return localStorage.getItem("pog_cloud_profile_"+active())||"";}
  function consent(){return !!localStorage.getItem("pog_cloud_consent_"+active());}
  function key(suffix){return "pog_cloud_sync_"+suffix+"_"+active();}
  function setState(s){state=s;render();}
  function ensureClient(){
    if(client)return true;
    if(!(cfg.url&&cfg.anonKey&&window.supabase&&window.supabase.createClient))return false;
    try{client=window.supabase.createClient(cfg.url,cfg.anonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});return true;}catch(e){return false;}
  }
  function snapshot(){
    var data={};
    KEYS.forEach(function(k){var raw=localStorage.getItem("pog_p_"+active()+"_"+k);if(raw!==null){try{data[k]=JSON.parse(raw);}catch(e){}}});
    return {version:1,savedAt:new Date().toISOString(),data:data};
  }
  function apply(saved){
    if(!saved||saved.version!==1||!saved.data||typeof saved.data!=="object")throw new Error("Invalid cloud snapshot");
    KEYS.forEach(function(k){var storage="pog_p_"+active()+"_"+k;if(Object.prototype.hasOwnProperty.call(saved.data,k))localStorage.setItem(storage,JSON.stringify(saved.data[k]));else localStorage.removeItem(storage);});
  }
  function render(){
    if(!root)return;
    var labels={idle:T.idle,pending:T.pending,offline:T.offline,setup:T.setup,signed:T.signed,consent:T.consent,working:T.working,error:T.error,conflict:T.conflict};
    root.innerHTML='<span class="sync-dot sync-'+state+'"></span><span>'+labels[state]+'</span>'+(state==="conflict"?'<div class="sync-actions"><button type="button" data-sync="cloud">'+T.cloud+'</button><button type="button" data-sync="local">'+T.local+'</button></div>':"");
    root.hidden=state==="idle"&&!localStorage.getItem(key("pending"));
  }
  function mount(){
    var app=document.getElementById("app");if(!app)return;
    if(!root){root=document.createElement("aside");root.className="sync-status";root.setAttribute("role","status");root.setAttribute("aria-live","polite");document.body.appendChild(root);root.addEventListener("click",resolveClick);}
    render();
  }
  function resolveClick(e){
    var action=e.target.closest("[data-sync]");if(!action||!conflict)return;
    if(action.dataset.sync==="cloud"){
      if(!window.confirm(lang==="it"?"Sostituire i dati locali con la copia cloud?":"Replace local data with the cloud copy?"))return;
      try{apply(conflict.preferences);localStorage.setItem(key("revision"),String(conflict.revision));localStorage.removeItem(key("pending"));conflict=null;window.location.reload();}catch(err){setState("error");}
    }else if(action.dataset.sync==="local"){
      if(!window.confirm(lang==="it"?"Caricare questa copia locale e sostituire quella cloud?":"Upload this device's copy and replace the cloud copy?"))return;
      conflict.force=true;localStorage.setItem(key("pending"),"1");sync();
    }
  }
  async function session(){
    var r=await client.auth.getSession();if(r.error)throw r.error;return r.data.session;
  }
  async function sync(){
    if(busy)return;
    if(!ensureClient()){setState("setup");return;}
    if(!active()||!mapping()){setState("setup");return;}
    if(!consent()){setState("consent");return;}
    if(!navigator.onLine){setState("offline");return;}
    busy=true;setState("working");
    try{
      if(!(await session())){setState("signed");return;}
      var id=mapping(), base=Number(localStorage.getItem(key("revision"))||0), pending=!!localStorage.getItem(key("pending"));
      if(!base){setState("setup");return;}
      var remote=await client.from("profile_data").select("preferences,placement,revision,updated_at").eq("profile_id",id).single();
      if(remote.error)throw remote.error;
      var rev=Number(remote.data.revision||1);
      if(!pending){
        if(rev>base){
          apply(remote.data.preferences);
          if(remote.data.placement!==undefined)localStorage.setItem("pog_p_"+active()+"_placement",JSON.stringify(remote.data.placement));
          localStorage.setItem(key("revision"),String(rev));
          window.location.reload();return;
        }
        if(rev<base){conflict={preferences:remote.data.preferences,revision:rev};setState("conflict");return;}
        setState("idle");return;
      }
      if(rev!==base&&!conflict?.force){
        conflict={preferences:remote.data.preferences,revision:rev};setState("conflict");return;
      }
      var expected=conflict&&conflict.force?rev:base, data=snapshot();
      var write=await client.from("profile_data").update({preferences:data,placement:data.data.placement||{},revision:expected+1,updated_at:new Date().toISOString()}).eq("profile_id",id).eq("revision",expected).select("revision").maybeSingle();
      if(write.error)throw write.error;
      if(!write.data){
        var latest=await client.from("profile_data").select("preferences,revision").eq("profile_id",id).single();
        if(latest.error)throw latest.error;
        conflict={preferences:latest.data.preferences,revision:Number(latest.data.revision||1)};setState("conflict");return;
      }
      localStorage.setItem(key("revision"),String(write.data.revision));localStorage.removeItem(key("pending"));conflict=null;setState("idle");
    }catch(e){setState(navigator.onLine?"error":"offline");}
    finally{busy=false;}
  }
  function schedule(profileId){
    if(profileId&&profileId!==active())return;
    if(!active()||!mapping()||!consent())return;
    localStorage.setItem(key("pending"),"1");
    setState(navigator.onLine?"pending":"offline");
    clearTimeout(timer);timer=setTimeout(sync,1400);
  }
  window.addEventListener("pog:local-change",function(e){if(e.detail)schedule(e.detail.profileId);});
  window.addEventListener("pog:profile-change",function(){conflict=null;mount();if(localStorage.getItem(key("pending")))sync();else sync();});
  window.addEventListener("storage",function(e){if(e.key&&e.key.indexOf("pog_p_"+active()+"_")===0)schedule(active());});
  window.addEventListener("online",function(){if(localStorage.getItem(key("pending")))sync();else sync();});
  window.addEventListener("focus",function(){if(!document.hidden)sync();});
  document.addEventListener("visibilitychange",function(){if(!document.hidden)sync();});
  if(ensureClient())client.auth.onAuthStateChange(function(){sync();});
  mount();
  if(localStorage.getItem(key("pending")))sync();else sync();
})();
