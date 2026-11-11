(function () {
  "use strict";
  var cfg=window.POG_SUPABASE_CONFIG||{}, lang=localStorage.getItem("pog_lang")==="en"?"en":"it";
  var translations={
    en:{open:"Profile privacy",title:"Profile data and shared access",intro:"Export a portable copy of this device's learner profile or manage who can access its linked cloud profile.",export:"Export local profile data",exportNote:"The JSON export includes profile details, settings, progress, session history, personal phrases and the active checkpoint. Device-only audio recordings are not included.",members:"Shared cloud access",load:"Load members",none:"No cloud profile is linked to this local profile.",signedOut:"Sign in to manage shared access.",remove:"Remove access",confirm:"Remove this person's access to the cloud profile?",done:"Access removed.",exported:"Profile export prepared.",failed:"The operation could not be completed.",close:"Close",owner:"Owner",caregiver:"Caregiver",therapist:"Therapist",learner:"Learner",self:"You"},
    it:{open:"Privacy profilo",title:"Dati e accessi al profilo",intro:"Esporta una copia portatile del profilo locale o gestisci chi può accedere al profilo cloud collegato.",export:"Esporta i dati del profilo locale",exportNote:"Il file JSON include dettagli del profilo, impostazioni, progressi, storico, frasi personali e checkpoint attivo. Le registrazioni audio conservate solo sul dispositivo non sono incluse.",members:"Accessi condivisi al cloud",load:"Carica membri",none:"Nessun profilo cloud è collegato a questo profilo locale.",signedOut:"Accedi per gestire gli accessi condivisi.",remove:"Revoca accesso",confirm:"Revocare a questa persona l'accesso al profilo cloud?",done:"Accesso revocato.",exported:"Esportazione del profilo preparata.",failed:"Impossibile completare l'operazione.",close:"Chiudi",owner:"Proprietario",caregiver:"Caregiver",therapist:"Terapista",learner:"Persona che si esercita",self:"Tu"}
  };
  var T=translations[lang];
  if(!cfg.url||!cfg.anonKey||!window.supabase||!window.supabase.createClient)return;
  var client;try{client=window.supabase.createClient(cfg.url,cfg.anonKey,{auth:{persistSession:true,autoRefreshToken:true}});}catch(e){return;}
  var panel=null,rows=[],message="",busy=false;
  var KEYS=["profile","settings","placement","history","sessions","scripts_it","scripts_en","active_session"];
  function activeId(){return localStorage.getItem("pog_active_profile_id")||"";}
  function cloudId(){var id=activeId();return id?localStorage.getItem("pog_cloud_profile_"+id)||"":"";}
  function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c];});}
  function render(){
    if(!panel)return;
    var html='<div class="account-card"><div class="account-head"><h2>'+T.title+'</h2><button class="account-close" data-life="close" aria-label="'+T.close+'">×</button></div><p>'+T.intro+'</p><button class="primary account-action" data-life="export">'+T.export+'</button><p class="account-note">'+T.exportNote+'</p><hr><h3>'+T.members+'</h3>';
    if(!cloudId())html+='<p class="account-note">'+T.none+'</p>';
    else html+='<button class="account-action" data-life="load">'+T.load+'</button>';
    if(rows.length){html+='<ul class="profile-access-list">'+rows.map(function(r){return '<li><span><strong>'+esc(r.email||r.user_id)+'</strong><small>'+esc(T[r.role]||r.role)+(r.is_self?" · "+T.self:"")+'</small></span>'+(r.can_remove?'<button class="link" data-life="remove" data-user="'+esc(r.user_id)+'">'+T.remove+'</button>':'')+'</li>';}).join("")+'</ul>';}
    if(message)html+='<p class="account-message" role="status">'+esc(message)+'</p>';
    html+='</div>';panel.innerHTML=html;
  }
  function exportLocal(){
    var id=activeId();if(!id)throw new Error(T.failed);
    var data={version:1,exportedAt:new Date().toISOString(),profileId:id,data:{}};
    KEYS.forEach(function(k){var raw=localStorage.getItem("pog_p_"+id+"_"+k);if(raw!==null){try{data.data[k]=JSON.parse(raw);}catch(e){data.data[k]=raw;}}});
    var blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json;charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");
    a.href=url;a.download="ppa-profile-"+id+"-"+new Date().toISOString().slice(0,10)+".json";document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(url);a.remove();},1000);
    message=T.exported;render();
  }
  async function invoke(action,extra){
    var result=await client.functions.invoke("profile-access",{body:Object.assign({action:action,profile_id:cloudId()},extra||{})});
    if(result.error)throw result.error;
    if(!result.data||result.data.error)throw new Error(result.data&&result.data.error||T.failed);
    return result.data;
  }
  async function loadMembers(){
    if(!cloudId())return;
    var result=await invoke("list_members");rows=result.members||[];render();
  }
  async function removeMember(userId){
    if(!window.confirm(T.confirm))return;
    await invoke("remove_member",{user_id:userId});message=T.done;await loadMembers();render();
  }
  function show(){
    if(!panel){panel=document.createElement("section");panel.className="account-panel";panel.setAttribute("role","dialog");panel.setAttribute("aria-modal","true");panel.hidden=true;document.body.appendChild(panel);
      panel.addEventListener("click",function(ev){var b=ev.target.closest("[data-life]");if(!b||busy)return;var a=b.dataset.life;
        if(a==="close"){panel.hidden=true;return;}
        busy=true;Promise.resolve().then(function(){if(a==="export")exportLocal();else if(a==="load")return loadMembers();else if(a==="remove")return removeMember(b.dataset.user);}).catch(function(){message=T.failed;render();}).finally(function(){busy=false;});
      });
    }
    rows=[];message="";panel.hidden=false;render();
    if(cloudId())client.auth.getSession().then(function(r){if(!r.data||!r.data.session)message=T.signedOut;render();}).catch(function(){message=T.failed;render();});
  }
  var root=document.getElementById("app");if(!root)return;
  if(!root.querySelector(".profile-lifecycle-launcher")){var launch=document.createElement("button");launch.type="button";launch.className="profile-lifecycle-launcher";launch.textContent=T.open;launch.setAttribute("aria-haspopup","dialog");launch.addEventListener("click",show);root.appendChild(launch);}
  window.addEventListener("pog:languagechange", function (ev) {
    lang = ev.detail && ev.detail.lang === "en" ? "en" : "it";
    T = translations[lang];
    var root = document.getElementById("app"), launch = root && root.querySelector(".profile-lifecycle-launcher");
    if (launch) launch.textContent = T.open;
    if (panel && !panel.hidden) render();
  });
  })();
