(function () {
  "use strict";
  var cfg=window.POG_SUPABASE_CONFIG||{}, lang=localStorage.getItem("pog_lang")==="en"?"en":"it";
  var T={
    en:{open:"Deletion & retention",title:"Deletion and retention",intro:"These controls apply to the linked cloud profile. Local data on this device is not deleted.",retention:"Therapist summary retention",retentionNote:"Controls only aggregate therapist dashboard metrics. Older metrics are removed by the scheduled daily maintenance job. Full session history and local recordings are not affected.",save:"Save retention period",days:"days",deletion:"Cloud profile deletion",deletionNote:"A request starts a 30-day grace period. At the end, the cloud profile, cloud backup, session records, therapist metrics and shared memberships are permanently deleted. Local copies on devices are not erased. Only the sole profile owner can request deletion.",request:"Request cloud profile deletion",cancel:"Cancel deletion request",pending:"Deletion requested. Scheduled for",none:"No deletion request is pending.",saved:"Retention period saved. It will be applied by the scheduled maintenance job.",requested:"Deletion request created.",cancelled:"Deletion request cancelled.",confirm:"Request permanent deletion of this cloud profile after the 30-day grace period?",confirmCancel:"Cancel the pending deletion request?",noCloud:"Link this local profile to a cloud profile first.",signedOut:"Sign in to manage deletion and retention.",failed:"Could not complete this operation.",close:"Close",notOwner:"Only the sole profile owner can request cloud profile deletion."},
    it:{open:"Eliminazione e conservazione",title:"Eliminazione e conservazione",intro:"Questi controlli riguardano il profilo cloud collegato. I dati locali su questo dispositivo non vengono eliminati.",retention:"Conservazione dei riepiloghi per il terapista",retentionNote:"Riguarda solo le metriche aggregate del pannello del terapista. Le metriche più vecchie vengono eliminate dalla manutenzione giornaliera programmata. Lo storico completo e le registrazioni locali non sono interessati.",save:"Salva periodo di conservazione",days:"giorni",deletion:"Eliminazione del profilo cloud",deletionNote:"La richiesta avvia un periodo di attesa di 30 giorni. Al termine, il profilo cloud, il backup, le sessioni, le metriche e gli accessi condivisi vengono eliminati definitivamente. Le copie locali sui dispositivi non vengono cancellate. Solo l'unico proprietario del profilo può richiedere l'eliminazione.",request:"Richiedi eliminazione del profilo cloud",cancel:"Annulla richiesta di eliminazione",pending:"Eliminazione richiesta. Programmata per",none:"Nessuna richiesta di eliminazione in sospeso.",saved:"Periodo di conservazione salvato. Sarà applicato dalla manutenzione programmata.",requested:"Richiesta di eliminazione creata.",cancelled:"Richiesta di eliminazione annullata.",confirm:"Richiedere l'eliminazione definitiva di questo profilo cloud dopo 30 giorni?",confirmCancel:"Annullare la richiesta di eliminazione in sospeso?",noCloud:"Collega prima questo profilo locale a un profilo cloud.",signedOut:"Accedi per gestire eliminazione e conservazione.",failed:"Impossibile completare l'operazione.",close:"Chiudi",notOwner:"Solo l'unico proprietario del profilo può richiedere l'eliminazione cloud."}
  }[lang];
  if(!cfg.url||!cfg.anonKey||!window.supabase||!window.supabase.createClient)return;
  var client;try{client=window.supabase.createClient(cfg.url,cfg.anonKey,{auth:{persistSession:true,autoRefreshToken:true}});}catch(e){return;}
  var panel=null,days=365,request=null,message="",error="",busy=false;
  function localId(){return localStorage.getItem("pog_active_profile_id")||"";}
  function cloudId(){var id=localId();return id?localStorage.getItem("pog_cloud_profile_"+id)||"":"";}
  function esc(v){return String(v||"").replace(/[&<>"']/g,function(c){return({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c];});}
  function invoke(action,extra){return client.functions.invoke("profile-access",{body:Object.assign({action:action,profile_id:cloudId()},extra||{})}).then(function(r){if(r.error)throw r.error;if(!r.data||r.data.error)throw new Error(r.data&&r.data.error||T.failed);return r.data;});}
  function render(){
    if(!panel)return;
    var html='<div class="account-card"><div class="account-head"><h2>'+T.title+'</h2><button class="account-close" data-ret="close" aria-label="'+T.close+'">×</button></div><p>'+T.intro+'</p>';
    if(!cloudId())html+='<p class="account-note">'+T.noCloud+'</p>';
    else{
      html+='<h3>'+T.retention+'</h3><p class="account-note">'+T.retentionNote+'</p><label for="retention-days"> '+T.retention+'</label><select id="retention-days">'+[30,90,180,365,730].map(function(n){return '<option value="'+n+'"'+(n===days?' selected':'')+'>'+n+' '+T.days+'</option>';}).join("")+'</select><button class="primary account-action" data-ret="save">'+T.save+'</button><hr><h3>'+T.deletion+'</h3><p class="account-note">'+T.deletionNote+'</p>';
      if(request)html+='<p role="status">'+T.pending+' <strong>'+esc(new Date(request.scheduled_for).toLocaleString(lang==="it"?"it-IT":"en-GB"))+'</strong></p><button class="account-action" data-ret="cancel">'+T.cancel+'</button>';
      else html+='<button class="account-action danger" data-ret="request">'+T.request+'</button><p class="account-note">'+T.none+'</p>';
    }
    if(message)html+='<p class="account-message" role="status">'+esc(message)+'</p>';
    if(error)html+='<p class="account-message" role="alert">'+esc(error)+'</p>';
    html+='</div>';panel.innerHTML=html;
  }
  async function load(){
    var r=await invoke("get_lifecycle");days=Number(r.retention_days)||365;request=r.deletion_request||null;render();
  }
  async function show(){
    if(!panel){panel=document.createElement("section");panel.className="account-panel";panel.setAttribute("role","dialog");panel.setAttribute("aria-modal","true");panel.hidden=true;document.body.appendChild(panel);
      panel.addEventListener("click",function(ev){var b=ev.target.closest("[data-ret]");if(!b||busy)return;var action=b.dataset.ret;if(action==="close"){panel.hidden=true;return;}
        busy=true;error="";message="";
        Promise.resolve().then(async function(){
          if(action==="save"){var s=panel.querySelector("#retention-days");var n=Number(s&&s.value);if(![30,90,180,365,730].includes(n))throw new Error(T.failed);await invoke("set_retention",{retention_days:n});days=n;message=T.saved;}
          if(action==="request"){if(!window.confirm(T.confirm))return;var r=await invoke("request_profile_deletion");request=r.deletion_request;message=T.requested;}
          if(action==="cancel"){if(!window.confirm(T.confirmCancel))return;await invoke("cancel_profile_deletion",{request_id:request.id});request=null;message=T.cancelled;}
          render();
        }).catch(function(e){error=e&&e.message?e.message:T.failed;render();}).finally(function(){busy=false;});
      });
    }
    panel.hidden=false;message="";error="";render();
    if(!cloudId()){render();return;}
    try{await client.auth.getSession().then(function(r){if(!r.data||!r.data.session)throw new Error(T.signedOut);});await load();}
    catch(e){error=e&&e.message?e.message:T.failed;render();}
  }
  var root=document.getElementById("app");if(!root)return;
  if(!root.querySelector(".deletion-retention-launcher")){var launch=document.createElement("button");launch.type="button";launch.className="profile-lifecycle-launcher deletion-retention-launcher";launch.textContent=T.open;launch.setAttribute("aria-haspopup","dialog");launch.addEventListener("click",show);root.appendChild(launch);}
})();
