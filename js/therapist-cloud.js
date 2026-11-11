(function () {
  "use strict";
  var cfg = window.POG_SUPABASE_CONFIG || {};
  if (!cfg.url || !cfg.anonKey || !window.supabase || !window.supabase.createClient) return;
  var client;
  try { client = window.supabase.createClient(cfg.url, cfg.anonKey, { auth: { persistSession: true, autoRefreshToken: true } }); }
  catch (e) { return; }
  var panel = null, selected = "", profiles = [], rows = [], message = "";
  var lang = localStorage.getItem("pog_lang") === "en" ? "en" : "it";
  var copy = {
    en: { open:"Therapist history", title:"Shared learner history", intro:"Read-only session trends. This view contains aggregate activity and speaking measures only; it never shows personal phrases, exercise labels, recognition transcripts or audio.", signIn:"Sign in to view shared profiles.", none:"No profiles are shared with this account.", choose:"Choose a learner", date:"Date", mode:"Mode", items:"Items", spoken:"Spoken", onset:"Avg onset (s)", wpm:"Avg words/min", pauses:"Avg pauses", longest:"Avg longest pause (s)", export:"Export CSV", empty:"No shared session history yet.", close:"Close", failed:"Could not load shared history.", csv:"therapist-session-history" },
    it: { open:"Storico terapista", title:"Storico condiviso", intro:"Andamento delle sessioni in sola lettura. Questa vista mostra solo attività aggregata e misure del parlato; non mostra frasi personali, etichette degli esercizi, trascrizioni o registrazioni audio.", signIn:"Accedi per visualizzare i profili condivisi.", none:"Nessun profilo è condiviso con questo account.", choose:"Scegli una persona", date:"Data", mode:"Modalità", items:"Elementi", spoken:"Parlato", onset:"Avvio medio (s)", wpm:"Parole/min medie", pauses:"Pause medie", longest:"Pausa max media (s)", export:"Esporta CSV", empty:"Non ci sono ancora sessioni condivise.", close:"Chiudi", failed:"Impossibile caricare lo storico.", csv:"storico-sessioni-terapista" }
  }[lang];
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
    var result=await client.from("therapist_session_metrics").select("session_id,started_at,mode,item_count,spoken_count,avg_onset_ms,avg_wpm,avg_pauses,avg_longest_pause_ms").eq("profile_id",selected).order("started_at",{ascending:false}).limit(60);
    if(result.error) throw result.error;
    rows=result.data||[]; render();
  }
  function exportCsv() {
    var cols=["date","mode","item_count","spoken_count","avg_onset_s","avg_words_per_min","avg_pauses","avg_longest_pause_s"];
    var lines=[cols.join(",")].concat(rows.map(function(r){return [r.started_at,r.mode,r.item_count,r.spoken_count,r.avg_onset_ms==null?"":(r.avg_onset_ms/1000).toFixed(2),r.avg_wpm==null?"":r.avg_wpm,r.avg_pauses==null?"":r.avg_pauses,r.avg_longest_pause_ms==null?"":(r.avg_longest_pause_ms/1000).toFixed(2)].map(function(v){v=String(v==null?"":v);return /[",\n;]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v;}).join(",");}));
    var blob=new Blob(["\uFEFF"+lines.join("\n")],{type:"text/csv;charset=utf-8"}),a=document.createElement("a");
    a.href=URL.createObjectURL(blob);a.download=copy.csv+"-"+new Date().toISOString().slice(0,10)+".csv";document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},1000);
  }
  function show() {
    if(!panel){panel=el("section",{class:"therapist-cloud-panel",role:"dialog","aria-modal":"true","aria-label":copy.title,hidden:""});document.body.appendChild(panel);
      panel.addEventListener("click",function(ev){var b=ev.target.closest("[data-thcloud]");if(!b)return;if(b.dataset.thcloud==="close"){panel.hidden=true;return;}if(b.dataset.thcloud==="export")exportCsv();});
      panel.addEventListener("change",function(ev){if(ev.target.id==="thcloud-profile"){selected=ev.target.value;loadRows().catch(function(){message=copy.failed;render();});}});
    }
    panel.hidden=false;render();loadProfiles().catch(function(){message=copy.failed;render();});
  }
  var launcher=el("button",{type:"button",class:"therapist-cloud-launcher"},copy.open);
  launcher.addEventListener("click",show);document.body.appendChild(launcher);

  // Publish only consented, linked session aggregates. No item labels, phrases,
  // recognised words, recordings, or raw session payloads leave the device.
  function average(values) { var a=values.filter(function(v){return typeof v==="number"&&isFinite(v);}); return a.length?a.reduce(function(x,y){return x+y;},0)/a.length:null; }
  async function publishLocalSessions(profileId) {
    if(!profileId||localStorage.getItem("pog_cloud_consent_"+profileId)!=="1")return;
    var cloudId=localStorage.getItem("pog_cloud_profile_"+profileId);if(!cloudId)return;
    var session=await client.auth.getSession();if(!session.data||!session.data.session)return;
    var raw=localStorage.getItem("pog_p_"+profileId+"_sessions");if(!raw)return;
    var sessions;try{sessions=JSON.parse(raw);}catch(e){return;}if(!Array.isArray(sessions))return;
    var payload=sessions.slice(-60).filter(function(s){return s&&s.id&&s.date&&Array.isArray(s.items);}).map(function(s){
      var items=s.items, measured=items.map(function(i){return i.meas||{};});
      var counts={};items.forEach(function(i){var k=["good","almost","retry","unrated"].indexOf(i.result)>=0?i.result:"other";counts[k]=(counts[k]||0)+1;});
      return {profile_id:cloudId,session_id:String(s.id),started_at:new Date(s.date).toISOString(),mode:s.mode==="place"?"place":"session",player_mode:s.who==="solo"?"solo":"assisted",item_count:items.length,spoken_count:measured.filter(function(m){return m.onsetMs!=null||m.wpm!=null||m.pauses!=null;}).length,result_counts:counts,avg_onset_ms:average(measured.map(function(m){return m.onsetMs;})),avg_wpm:average(measured.map(function(m){return m.wpm;})),avg_pauses:average(measured.map(function(m){return m.pauses;})),avg_longest_pause_ms:average(measured.map(function(m){return m.longestPauseMs;}))};
    });
    if(payload.length){var saved=await client.from("therapist_session_metrics").upsert(payload,{onConflict:"profile_id,session_id"});if(saved.error)throw saved.error;}
  }
  function publishActive() { var id=localStorage.getItem("pog_active_profile_id");publishLocalSessions(id).catch(function(){}); }
  window.addEventListener("pog:local-change",function(ev){var id=ev.detail&&ev.detail.profileId;if(id&&ev.detail.key==="sessions")publishLocalSessions(id).catch(function(){});});
  window.addEventListener("pog:profile-change",publishActive);
  client.auth.onAuthStateChange(function(){publishActive();});
  window.addEventListener("load",publishActive);
})();
