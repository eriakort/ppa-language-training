(function () {
  "use strict";
  var cfg = window.POG_SUPABASE_CONFIG || {};
  if (!cfg.url || !cfg.anonKey || !window.supabase || !window.supabase.createClient) return;
  var client;
  try { client = window.supabase.createClient(cfg.url, cfg.anonKey, { auth: { persistSession: true, autoRefreshToken: true } }); }
  catch (e) { return; }
  var panel = null, selected = "", profiles = [], rows = [], message = "";
  var lang = window.POG.getLang();
  var translations = {
    en: { open:"Therapist history", title:"Shared learner history", intro:"Read-only session trends. This view contains numbers only: activity, each exercise's level and accuracy, speaking measures and speech check-in scores. It never shows personal phrases, exercise labels, recognition transcripts or audio.", signIn:"Sign in to view shared profiles.", none:"No profiles are shared with this account.", choose:"Choose a learner", date:"Date", mode:"Mode", items:"Items", spoken:"Spoken", onset:"Avg onset (s)", wpm:"Avg words/min", pauses:"Avg pauses", longest:"Avg longest pause (s)", export:"Export CSV", progress:"Progress and statistics", progressFailed:"Statistics aren't available on this server yet (the database needs updating).", loading:"Loading…", empty:"No shared session history yet.", close:"Close", failed:"Could not load shared history.", csv:"therapist-session-history" },
    it: { open:"Storico terapista", title:"Storico condiviso", intro:"Andamento delle sessioni in sola lettura. Questa vista contiene solo numeri: attività, livello e precisione di ogni esercizio, misure del parlato e punteggi dei controlli del parlato. Non mostra frasi personali, etichette degli esercizi, trascrizioni o registrazioni audio.", signIn:"Accedi per visualizzare i profili condivisi.", none:"Nessun profilo è condiviso con questo account.", choose:"Scegli una persona", date:"Data", mode:"Modalità", items:"Elementi", spoken:"Parlato", onset:"Avvio medio (s)", wpm:"Parole/min medie", pauses:"Pause medie", longest:"Pausa max media (s)", export:"Esporta CSV", progress:"Andamento e statistiche", progressFailed:"Le statistiche non sono ancora disponibili su questo server (serve l'aggiornamento del database).", loading:"Caricamento…", empty:"Non ci sono ancora sessioni condivise.", close:"Chiudi", failed:"Impossibile caricare lo storico.", csv:"storico-sessioni-terapista" }
  };
  var copy = translations[lang];
  function el(tag, attrs, value) { var n=document.createElement(tag); Object.keys(attrs||{}).forEach(function(k){n.setAttribute(k,attrs[k]);}); if(value!=null)n.textContent=value; return n; }
  function fmt(v, divisor) { return v == null ? "–" : (Number(v)/divisor).toFixed(1).replace(".", lang==="it"?",":"."); }
  function esc(v) { return String(v==null?"":v).replace(/[&<>"']/g,function(c){return({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c];}); }
  function render() {
    if (!panel) return;
    var html='<div class="therapist-cloud-card"><div class="account-head"><h2>'+copy.title+'</h2><button type="button" class="account-close" data-thcloud="close" aria-label="'+copy.close+'">×</button></div><p class="account-note">'+copy.intro+'</p>';
    if(message) html+='<p class="account-error" role="alert">'+esc(message)+'</p>';
    if(profiles.length) {
      html+='<label>'+copy.choose+'<select id="thcloud-profile">'+profiles.map(function(p){return '<option value="'+esc(p.id)+'"'+(p.id===selected?' selected':'')+'>'+esc(p.display_name)+'</option>';}).join("")+'</select></label>';
      html+='<div class="tbl"><table><thead><tr><th>'+copy.date+'</th><th>'+copy.mode+'</th><th>'+copy.items+'</th><th>'+copy.spoken+'</th><th>'+copy.onset+'</th><th>'+copy.wpm+'</th><th>'+copy.pauses+'</th><th>'+copy.longest+'</th></tr></thead><tbody>';
      html+=rows.map(function(r){return '<tr><td>'+esc(new Date(r.started_at).toLocaleDateString(lang==="it"?"it-IT":"en-GB"))+'</td><td>'+esc(r.mode)+'</td><td class="n">'+r.item_count+'</td><td class="n">'+r.spoken_count+'</td><td class="n">'+fmt(r.avg_onset_ms,1000)+'</td><td class="n">'+fmt(r.avg_wpm,1)+'</td><td class="n">'+fmt(r.avg_pauses,1)+'</td><td class="n">'+fmt(r.avg_longest_pause_ms,1000)+'</td></tr>';}).join("");
      html+='</tbody></table></div>';
      if(!rows.length) html+='<p class="account-note">'+copy.empty+'</p>';
      if(rows.length) html+='<button class="secondary account-action" data-thcloud="export">'+copy.export+'</button>';
      if(rows.length) html+='<button class="secondary account-action" data-thcloud="progress">'+copy.progress+'</button>';
    } else if(!message) html+='<p class="account-note">'+copy.none+'</p>';
    html+='</div>'; panel.innerHTML=html;
  }
  async function loadProfiles() {
    message=""; rows=[];
    var auth=await client.auth.getUser(), user=auth.data&&auth.data.user;
    if(auth.error) throw auth.error;
    if(!user) { message=copy.signIn; profiles=[]; render(); return; }
    var memberships=await client.from("profile_members").select("profile_id,role").eq("user_id",user.id).in("role",["therapist","caregiver","owner"]);
    if(memberships.error) throw memberships.error;
    var ids=(memberships.data||[]).map(function(m){return m.profile_id;});
    if(!ids.length){profiles=[];render();return;}
    var names=await client.from("learner_profiles").select("id,display_name").in("id",ids);
    if(names.error) throw names.error;
    profiles=names.data||[];
    if(!profiles.some(function(p){return p.id===selected;})) selected=profiles[0]?profiles[0].id:"";
    await loadRows();
  }
  async function loadRows() {
    rows=[];
    if(!selected){render();return;}
    var result=await client.from("therapist_session_metrics").select("profile_id,started_at,mode,item_count,spoken_count,avg_onset_ms,avg_wpm,avg_pauses,avg_longest_pause_ms").eq("profile_id",selected).order("started_at",{ascending:false}).limit(60);
    if(result.error) throw result.error;
    rows=result.data||[]; render();
  }
  function exportCsv() {
    var cols=["date","mode","item_count","spoken_count","avg_onset_s","avg_words_per_min","avg_pauses","avg_longest_pause_s"];
    var lines=[cols.join(",")].concat(rows.map(function(r){return [r.started_at,r.mode,r.item_count,r.spoken_count,r.avg_onset_ms==null?"":(r.avg_onset_ms/1000).toFixed(2),r.avg_wpm==null?"":r.avg_wpm,r.avg_pauses==null?"":r.avg_pauses,r.avg_longest_pause_ms==null?"":(r.avg_longest_pause_ms/1000).toFixed(2)].map(function(v){v=String(v==null?"":v);return /[",\n;]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v;}).join(",");}));
    var blob=new Blob(["\uFEFF"+lines.join("\n")],{type:"text/csv;charset=utf-8"}),a=document.createElement("a");
    a.href=URL.createObjectURL(blob);a.download=copy.csv+"-"+new Date().toISOString().slice(0,10)+".csv";document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},1000);
  }
  /* Read-only statistics for a shared learner: the same screen as on the learner's device, fed with cloud aggregates. */
  async function fetchAll(build) {
    var out=[], from=0, page=1000;
    for(var i=0;i<10;i++){ var r=await build().range(from,from+page-1); if(r.error) throw r.error; out=out.concat(r.data||[]); if(!r.data||r.data.length<page) break; from+=page; }
    return out;
  }
  async function openProgress() {
    if(!selected||!window.POG.progress||!window.POG.progress.openRemote) return;
    var ses=await fetchAll(function(){return client.from("therapist_session_metrics").select("session_id,started_at,mode,player_mode,avg_onset_ms,avg_wpm").eq("profile_id",selected).eq("mode","session").order("started_at",{ascending:true});});
    var games=await fetchAll(function(){return client.from("therapist_game_metrics").select("session_id,game,level,item_count,accuracy,avg_hints,median_item_ms,median_onset_ms,median_wpm").eq("profile_id",selected).order("session_id",{ascending:true});});
    var cks=await fetchAll(function(){return client.from("therapist_checkin_metrics").select("checkin_id,started_at,player_mode,naming_correct,naming_total,fluency_count,repetition,description_wpm").eq("profile_id",selected).order("started_at",{ascending:true});});
    var num=function(v){return v==null?null:Number(v);};
    var bySession={}, log=ses.map(function(r){var e={id:r.session_id,t:new Date(r.started_at).getTime(),who:r.player_mode==="solo"?"solo":"assist",g:{}};bySession[r.session_id]=e;e._on=num(r.avg_onset_ms);e._wpm=num(r.avg_wpm);return e;});
    games.forEach(function(g){var e=bySession[g.session_id];if(!e)return;e.g[g.game]={lv:g.level,n:g.item_count,s:num(g.accuracy),hints:num(g.avg_hints),ms:num(g.median_item_ms),on:num(g.median_onset_ms),wpm:num(g.median_wpm),msTot:g.item_count*(num(g.median_item_ms)||0)};});
    /* Sessions published before exercise rows existed still give speaking measures. */
    log.forEach(function(e){if(!Object.keys(e.g).length&&(e._on!=null||e._wpm!=null))e.g._all={on:e._on,wpm:e._wpm};delete e._on;delete e._wpm;});
    var checkins=cks.map(function(k){return {id:k.checkin_id,date:k.started_at,who:k.player_mode==="solo"?"solo":"assist",naming:{correct:k.naming_correct,total:k.naming_total},flu:{count:k.fluency_count},rep:{avg:num(k.repetition)},desc:{wpm:num(k.description_wpm)}};});
    var name=(profiles.filter(function(p){return p.id===selected;})[0]||{}).display_name||"";
    message=""; if(panel) panel.hidden=true;
    window.POG.progress.openRemote({name:name,log:log,checkins:checkins});
  }
  function show() {
    if(!panel){panel=el("section",{class:"therapist-cloud-panel",role:"dialog","aria-modal":"true","aria-label":copy.title,hidden:""});document.body.appendChild(panel);
      panel.addEventListener("click",function(ev){var b=ev.target.closest("[data-thcloud]");if(!b)return;if(b.dataset.thcloud==="close"){panel.hidden=true;return;}if(b.dataset.thcloud==="export")exportCsv();if(b.dataset.thcloud==="progress"){message=copy.loading;render();openProgress().catch(function(){message=copy.progressFailed;render();});}});
      panel.addEventListener("change",function(ev){if(ev.target.id==="thcloud-profile"){selected=ev.target.value;loadRows().catch(function(){message=copy.failed;render();});}});
    }
    panel.hidden=false;render();loadProfiles().catch(function(){message=copy.failed;render();});
  }
  window.POG.therapistCloud={show:function(){show();}};
  var launcher=el("button",{type:"button",class:"therapist-cloud-launcher"},copy.open);
  launcher.addEventListener("click",show);document.body.appendChild(launcher);

  // Publish only consented, linked session aggregates. No item labels, phrases,
  // recognised words, recordings, or raw session payloads leave the device.
  function average(values) { var a=values.filter(function(v){return typeof v==="number"&&isFinite(v);}); return a.length?a.reduce(function(x,y){return x+y;},0)/a.length:null; }
  async function publishLocalSessions(profileId) {
    if(!profileId||!localStorage.getItem("pog_cloud_consent_"+profileId))return;
    var cloudId=localStorage.getItem("pog_cloud_profile_"+profileId);if(!cloudId)return;
    var session=await client.auth.getSession();if(!session.data||!session.data.session)return;
    if(!localStorage.getItem("pog_cloud_consent_"+profileId))return;
    var raw=localStorage.getItem("pog_p_"+profileId+"_sessions");if(!raw)return;
    var sessions;try{sessions=JSON.parse(raw);}catch(e){return;}if(!Array.isArray(sessions))return;
    var payload=sessions.slice(-60).filter(function(s){return s&&s.id&&s.date&&Array.isArray(s.items);}).map(function(s){
      var items=s.items, measured=items.map(function(i){return i.meas||{};});
      return {profile_id:cloudId,session_id:String(s.id),started_at:new Date(s.date).toISOString(),mode:s.mode==="place"?"place":"session",player_mode:s.who==="solo"?"solo":"assisted",item_count:items.length,spoken_count:measured.filter(function(m){return m.onsetMs!=null||m.wpm!=null||m.pauses!=null;}).length,avg_onset_ms:average(measured.map(function(m){return m.onsetMs;})),avg_wpm:average(measured.map(function(m){return m.wpm;})),avg_pauses:average(measured.map(function(m){return m.pauses;})),avg_longest_pause_ms:average(measured.map(function(m){return m.longestPauseMs;}))};
    });
    if(payload.length&&localStorage.getItem("pog_cloud_consent_"+profileId)){var saved=await client.rpc("upsert_therapist_session_metrics",{p_metrics:payload});if(saved.error)throw saved.error;}
    await publishProgress(profileId,cloudId,sessions);
  }
  // Per-exercise numbers (level, accuracy, hints, timing) and check-in scores for the statistics view.
  // Still numbers only: no labels, phrases, recognised words, check-in transcripts or audio.
  var PROGRESS_GAMES=["describe","mystery","crossword","name","wordbuild","script","read","echo","seq"];
  var BASE_SCORE={good:1,almost:0.5,choice:0.5,model:0,done:1,skip:0,retry:0};
  function median(values){var a=values.filter(function(v){return typeof v==="number"&&isFinite(v);}).sort(function(x,y){return x-y;});if(!a.length)return null;var m=Math.floor(a.length/2);return a.length%2?a[m]:(a[m-1]+a[m])/2;}
  function clamp(v,lo,hi){return v==null?null:Math.min(hi,Math.max(lo,v));}
  function progressPayload(cloudId,sessions,checkins){
    var games=[];
    sessions.slice(-60).forEach(function(s){
      if(!s||s.mode!=="session"||!/^s[0-9a-z]{1,24}$/.test(String(s.id))||!Array.isArray(s.items))return;
      var by={};s.items.forEach(function(i){if(PROGRESS_GAMES.indexOf(i.game)>=0)(by[i.game]=by[i.game]||[]).push(i);});
      Object.keys(by).forEach(function(g){
        var it=by[g],lv=it[it.length-1].lv;if(!(lv>=1&&lv<=4))return;
        var acc=average(it.map(function(i){return typeof i.score==="number"?i.score:BASE_SCORE[i.result];}));if(acc==null)return;
        var hints=average(it.map(function(i){return i.hints;})),ms=median(it.map(function(i){return i.ms;}));
        var on=median(it.map(function(i){return i.meas&&i.meas.onsetMs;})),wpm=median(it.map(function(i){return i.meas&&i.meas.wpm;}));
        games.push({profile_id:cloudId,session_id:String(s.id),game:g,level:lv,item_count:Math.min(100,it.length),accuracy:clamp(acc,0,1),avg_hints:clamp(hints,0,10),median_item_ms:ms==null?null:Math.round(clamp(ms,0,600000)),median_onset_ms:on==null?null:Math.round(clamp(on,0,600000)),median_wpm:clamp(wpm,0,1000)});
      });
    });
    var cks=(Array.isArray(checkins)?checkins:[]).slice(-50).filter(function(k){return k&&/^k[0-9a-z]{1,24}$/.test(String(k.id))&&k.date;}).map(function(k){
      var n=k.naming||{};return {profile_id:cloudId,checkin_id:String(k.id),started_at:new Date(k.date).toISOString(),player_mode:k.who==="solo"?"solo":"assisted",
        naming_correct:typeof n.correct==="number"?clamp(n.correct,0,10):null,naming_total:typeof n.total==="number"?clamp(n.total,0,10):null,
        fluency_count:k.flu&&typeof k.flu.count==="number"?clamp(k.flu.count,0,300):null,repetition:k.rep&&typeof k.rep.avg==="number"?clamp(k.rep.avg,0,1):null,
        description_wpm:k.desc&&typeof k.desc.wpm==="number"?clamp(k.desc.wpm,0,1000):null};
    });
    return {games:games,checkins:cks};
  }
  async function publishProgress(profileId,cloudId,sessions){
    if(!localStorage.getItem("pog_cloud_consent_"+profileId))return;
    var checkins=[];try{checkins=JSON.parse(localStorage.getItem("pog_p_"+profileId+"_checkins")||"[]");}catch(e){}
    var p=progressPayload(cloudId,sessions||[],checkins);
    if(!p.games.length&&!p.checkins.length)return;
    if(!localStorage.getItem("pog_cloud_consent_"+profileId))return;
    var r=await client.rpc("upsert_therapist_progress_metrics",{p_games:p.games,p_checkins:p.checkins});
    if(r.error)throw r.error;
  }
  function publishActive() { var id=localStorage.getItem("pog_active_profile_id");publishLocalSessions(id).catch(function(){}); }
  window.addEventListener("pog:local-change",function(ev){var id=ev.detail&&ev.detail.profileId;if(id&&(ev.detail.key==="sessions"||ev.detail.key==="checkins"))publishLocalSessions(id).catch(function(){});});
  window.addEventListener("pog:profile-change",publishActive);
  client.auth.onAuthStateChange(function(){publishActive();});
  window.addEventListener("load",publishActive);
  window.addEventListener("pog:languagechange", function (ev) {
    lang = ev.detail && ev.detail.lang === "en" ? "en" : "it";
    copy = translations[lang];
    var launch = document.querySelector(".therapist-cloud-launcher");
    if (launch) launch.textContent = copy.open;
    if (panel) { panel.setAttribute("aria-label", copy.title); if (!panel.hidden) render(); }
  });
  })();
