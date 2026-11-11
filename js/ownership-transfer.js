(function () {
  "use strict";
  var cfg=window.POG_SUPABASE_CONFIG||{},lang=localStorage.getItem("pog_lang")==="en"?"en":"it";
  var T={
    en:{open:"Ownership transfer",title:"Profile ownership",intro:"Transfer ownership to an existing caregiver. The new owner must accept within 7 days; you will remain a caregiver.",members:"Eligible caregivers",load:"Load caregivers",choose:"Choose a caregiver",send:"Send transfer request",incoming:"Ownership invitations",accept:"Accept ownership",cancel:"Cancel request",none:"No incoming ownership invitations.",sent:"Transfer request sent.",accepted:"You are now the profile owner.",cancelled:"Transfer request cancelled.",noCloud:"Link this local profile to a cloud profile first.",signedOut:"Sign in to manage ownership.",failed:"Could not complete this operation.",close:"Close",confirm:"Send this person an ownership transfer request?",expired:"Invitation expires"},
    it:{open:"Trasferimento proprietà",title:"Proprietà del profilo",intro:"Trasferisci la proprietà a un caregiver già presente. Il nuovo proprietario deve accettare entro 7 giorni; tu manterrai il ruolo di caregiver.",members:"Caregiver idonei",load:"Carica caregiver",choose:"Scegli un caregiver",send:"Invia richiesta di trasferimento",incoming:"Inviti alla proprietà",accept:"Accetta la proprietà",cancel:"Annulla richiesta",none:"Nessun invito alla proprietà in arrivo.",sent:"Richiesta di trasferimento inviata.",accepted:"Ora sei il proprietario del profilo.",cancelled:"Richiesta di trasferimento annullata.",noCloud:"Collega prima questo profilo locale a un profilo cloud.",signedOut:"Accedi per gestire la proprietà.",failed:"Impossibile completare l'operazione.",close:"Chiudi",confirm:"Inviare a questa persona una richiesta di trasferimento della proprietà?",expired:"L'invito scade"}
  }[lang];
  if(!cfg.url||!cfg.anonKey||!window.supabase||!window.supabase.createClient)return;
  var client;try{client=window.supabase.createClient(cfg.url,cfg.anonKey,{auth:{persistSession:true,autoRefreshToken:true}});}catch(e){return;}
  var panel=null,members=[],incoming=[],message="",error="",busy=false;
  function localId(){return localStorage.getItem("pog_active_profile_id")||"";}
  function cloudId(){var id=localId();return id?localStorage.getItem("pog_cloud_profile_"+id)||"":"";}
  function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(c){return({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c];});}
  function invoke(action,extra){return client.functions.invoke("profile-access",{body:Object.assign({action:action},extra||{})}).then(function(r){if(r.error)throw r.error;if(!r.data||r.data.error)throw new Error(r.data&&r.data.error||T.failed);return r.data;});}
  function render(){
    if(!panel)return;
    var html='<div class="account-card"><div class="account-head"><h2>'+T.title+'</h2><button class="account-close" data-own="close" aria-label="'+T.close+'">×</button></div><p>'+T.intro+'</p>';
    if(cloudId())html+='<h3>'+T.members+'</h3><button class="account-action" data-own="load">'+T.load+'</button>';
    else html+='<p class="account-note">'+T.noCloud+'</p>';
    if(members.length)html+='<label for="ownership-target">'+T.choose+'</label><select id="ownership-target"><option value="">'+T.choose+'</option>'+members.filter(function(m){return m.role==="caregiver";}).map(function(m){return '<option value="'+esc(m.user_id)+'">'+esc(m.email||m.user_id)+'</option>';}).join("")+'</select><button class="primary account-action" data-own="send">'+T.send+'</button>';
    html+='<hr><h3>'+T.incoming+'</h3>';
    if(incoming.length)html+='<ul class="profile-access-list">'+incoming.map(function(x){return '<li><span><strong>'+esc(x.profile_name)+'</strong><small>'+esc(x.from_email)+' · '+T.expired+' '+esc(new Date(x.expires_at).toLocaleDateString(lang==="it"?"it-IT":"en-GB"))+'</small></span><button class="primary account-action" data-own="accept" data-id="'+esc(x.id)+'">'+T.accept+'</button></li>';}).join("")+'</ul>';
    else html+='<p class="account-note">'+T.none+'</p>';
    if(message)html+='<p class="account-message" role="status">'+esc(message)+'</p>';
    if(error)html+='<p class="account-message" role="alert">'+esc(error)+'</p>';
    panel.innerHTML=html+'</div>';
  }
  async function load(){
    var session=await client.auth.getSession();if(!session.data||!session.data.session)throw new Error(T.signedOut);
    var results=await Promise.all([invoke("list_incoming_transfers"),cloudId()?invoke("list_members",{profile_id:cloudId()}):Promise.resolve({members:[]})]);
    incoming=results[0].transfers||[];members=results[1].members||[];render();
  }
  function show(){
    if(!panel){panel=document.createElement("section");panel.className="account-panel";panel.setAttribute("role","dialog");panel.setAttribute("aria-modal","true");panel.hidden=true;document.body.appendChild(panel);
      panel.addEventListener("click",function(ev){var b=ev.target.closest("[data-own]");if(!b||busy)return;var action=b.dataset.own;if(action==="close"){panel.hidden=true;return;}
        busy=true;message="";error="";
        Promise.resolve().then(async function(){
          if(action==="load"){var r=await invoke("list_members",{profile_id:cloudId()});members=r.members||[];}
          if(action==="send"){var s=panel.querySelector("#ownership-target"),id=s&&s.value;if(!id)throw new Error(T.failed);if(!window.confirm(T.confirm))return;await invoke("request_ownership_transfer",{profile_id:cloudId(),user_id:id});message=T.sent;}
          if(action==="accept"){await invoke("accept_ownership_transfer",{transfer_id:b.dataset.id});message=T.accepted;}
          await load();if(message)render();
        }).catch(function(e){error=e&&e.message?e.message:T.failed;render();}).finally(function(){busy=false;});
      });
    }
    panel.hidden=false;message="";error="";render();load().catch(function(e){error=e&&e.message?e.message:T.failed;render();});
  }
  var root=document.getElementById("app");if(!root)return;
  if(!root.querySelector(".ownership-transfer-launcher")){var launch=document.createElement("button");launch.type="button";launch.className="profile-lifecycle-launcher ownership-transfer-launcher";launch.textContent=T.open;launch.setAttribute("aria-haspopup","dialog");launch.addEventListener("click",show);root.appendChild(launch);}
})();