(function () {
  "use strict";
  var cfg=window.POG_SUPABASE_CONFIG||{},lang=window.POG.getLang();
  var translations={
    en:{open:"Account deletion review",title:"Account deletion review",intro:"Before an account can be deleted, every learner profile and shared access link must be handled safely.",review:"Review my account",loading:"Reviewing account dependencies…",deleting:"Deleting cloud account…",ready:"No profile ownership or pending-transfer blockers were found. This is a preflight only; it does not delete your account.",blocked:"Your account is not ready for deletion yet. Resolve the items below first.",owner:"Owned profile",transfer:"Transfer ownership to an existing caregiver or request profile deletion.",wait:"A profile deletion is already scheduled. Wait until it completes before closing this account.",delete:"Request profile deletion or transfer ownership before account deletion.",member:"Shared membership",memberNote:"This access will need to be revoked as part of account closure; learner data remains with the profile.",outgoing:"Outgoing ownership request",incoming:"Incoming ownership invitation",transferNote:"Resolve this invitation before account closure.",summary:"Account overview",members:"Profile memberships",owned:"Owned profiles",pending:"Pending transfers",close:"Close",signedOut:"Sign in to review account deletion.",failed:"Could not review account dependencies.",deleteFailed:"Could not delete this account. Refresh the review and try again.",privacy:"Local data and audio recordings on devices cannot be remotely erased by account closure. Export anything you need before proceeding.",readOnly:"Read-only review: no data has been changed.",dangerTitle:"Permanently close cloud account",dangerIntro:"All remaining shared memberships will be revoked and your login account will be permanently deleted. This cannot be undone.",ackLabel:"I understand that local practice data, album photos, and audio recordings on devices are not erased remotely.",confirmEmailLabel:"Type your account email to confirm",confirmBtn:"Delete my account permanently",emailMismatch:"Enter the exact signed-in email address to confirm deletion.",deletedDone:"Your cloud account has been permanently deleted and shared memberships have been revoked. Device-local practice data and recordings remain on this device."},
    it:{open:"Verifica eliminazione account",title:"Verifica eliminazione account",intro:"Prima di eliminare un account, ogni profilo e ogni accesso condiviso devono essere gestiti in sicurezza.",review:"Verifica il mio account",loading:"Verifica delle dipendenze dell'account…",deleting:"Eliminazione account cloud in corso…",ready:"Non risultano blocchi relativi alla proprietà dei profili o a trasferimenti in sospeso. Questa è solo una verifica preliminare: non elimina l'account.",blocked:"L'account non è ancora pronto per l'eliminazione. Risolvi prima gli elementi indicati.",owner:"Profilo di cui sei proprietario",transfer:"Trasferisci la proprietà a un caregiver esistente oppure richiedi l'eliminazione del profilo.",wait:"L'eliminazione del profilo è già programmata. Attendi il completamento prima di chiudere l'account.",delete:"Richiedi l'eliminazione del profilo o trasferiscine la proprietà prima di eliminare l'account.",member:"Accesso condiviso",memberNote:"Questo accesso dovrà essere revocato durante la chiusura dell'account; i dati del profilo restano disponibili.",outgoing:"Richiesta di trasferimento inviata",incoming:"Invito a ricevere la proprietà",transferNote:"Risolvi questo invito prima di chiudere l'account.",summary:"Riepilogo account",members:"Accessi ai profili",owned:"Profili di cui sei proprietario",pending:"Trasferimenti in sospeso",close:"Chiudi",signedOut:"Accedi per verificare l'eliminazione dell'account.",failed:"Impossibile verificare le dipendenze dell'account.",deleteFailed:"Impossibile eliminare l'account. Aggiorna la verifica e riprova.",privacy:"I dati locali e le registrazioni audio sui dispositivi non possono essere cancellati da remoto con la chiusura dell'account. Esporta ciò che ti serve prima di procedere.",readOnly:"Verifica in sola lettura: nessun dato è stato modificato.",dangerTitle:"Chiudi definitivamente l'account cloud",dangerIntro:"Tutti gli accessi condivisi residui saranno revocati e il tuo account di accesso verrà eliminato in modo permanente. L'operazione non può essere annullata.",ackLabel:"Ho capito che i dati locali, le foto dell'album e le registrazioni audio sui dispositivi non vengono cancellati da remoto.",confirmEmailLabel:"Scrivi l'email del tuo account per confermare",confirmBtn:"Elimina definitivamente l'account",emailMismatch:"Inserisci esattamente l'indirizzo email collegato per confermare.",deletedDone:"Il tuo account cloud è stato eliminato definitivamente e gli accessi condivisi sono stati revocati. I dati e le registrazioni locali restano sul dispositivo."}
  };
  var T=translations[lang];
  if(!cfg.url||!cfg.anonKey||!window.supabase||!window.supabase.createClient)return;
  var client;try{client=window.supabase.createClient(cfg.url,cfg.anonKey,{auth:{persistSession:true,autoRefreshToken:true}});}catch(e){return;}
  var panel=null,result=null,error="",busy=false,deleting=false,ack=false,confirmEmail="",userEmail="",doneMsg="";
  function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(c){return({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c];});}
  function date(v){return v?new Date(v).toLocaleString(lang==="it"?"it-IT":"en-GB"):"";}
  function canExecute(){
    if(!result||!result.ready||!ack||busy||deleting)return false;
    var expected=(userEmail||"").trim().toLowerCase();
    return !expected||confirmEmail.trim().toLowerCase()===expected;
  }
  function render(){
    if(!panel)return;
    var html='<div class="account-card"><div class="account-head"><h2>'+T.title+'</h2><button class="account-close" data-account-delete="close" aria-label="'+T.close+'">×</button></div>';
    if(doneMsg){
      html+='<p class="account-message" role="status">'+esc(doneMsg)+'</p><p class="account-note">'+T.privacy+'</p></div>';
      panel.innerHTML=html;return;
    }
    html+='<p>'+T.intro+'</p><button class="primary account-action" data-account-delete="review"'+(busy||deleting?' disabled':'')+'>'+T.review+'</button>';
    if(busy)html+='<p role="status">'+T.loading+'</p>';
    if(deleting)html+='<p role="status">'+T.deleting+'</p>';
    if(result){
      html+='<h3>'+T.summary+'</h3><p>'+T.members+': <strong>'+result.membership_count+'</strong> · '+T.owned+': <strong>'+result.owned_profile_count+'</strong> · '+T.pending+': <strong>'+(result.pending_transfers.outgoing+result.pending_transfers.incoming)+'</strong></p>';
      html+='<p role="status">'+(result.ready?T.ready:T.blocked)+'</p>';
      if(result.profiles.length)html+='<ul class="profile-access-list">'+result.profiles.map(function(p){
        var title=p.role==="owner"?T.owner:T.member;
        var detail=p.role==="owner"?(p.account_action==="wait_for_profile_deletion"?T.wait:(p.can_transfer_to_caregiver?T.transfer:T.delete)):T.memberNote;
        return '<li><span><strong>'+esc(p.profile_name)+'</strong><small>'+esc(title)+' · '+esc(detail)+'</small></span></li>';
      }).join("")+'</ul>';
      result.blockers.filter(function(b){return b.type==="outgoing_transfer_pending"||b.type==="incoming_transfer_pending";}).forEach(function(b){
        html+='<p class="account-note"><strong>'+(b.type==="outgoing_transfer_pending"?T.outgoing:T.incoming)+'</strong>: '+T.transferNote+' '+esc(date(b.expires_at))+'</p>';
      });
      html+='<p class="account-note">'+T.readOnly+'</p><p class="account-note">'+T.privacy+'</p>';
      if(result.ready){
        html+='<div class="account-danger-box"><h3>'+T.dangerTitle+'</h3><p class="account-note">'+T.dangerIntro+'</p>'+
          '<label class="check"><input type="checkbox" id="acc-del-ack" data-account-delete="ack"'+(ack?' checked':'')+'>'+esc(T.ackLabel)+'</label>'+
          (userEmail?'<label>'+esc(T.confirmEmailLabel)+' ('+esc(userEmail)+')<input id="acc-del-email" type="email" autocomplete="off" value="'+esc(confirmEmail)+'"></label>':'')+
          '<button type="button" class="account-action account-danger-btn" data-account-delete="execute"'+(canExecute()?'':' disabled')+'>'+esc(T.confirmBtn)+'</button></div>';
      }
    }
    if(error)html+='<p class="account-error" role="alert">'+esc(error)+'</p>';
    html+='</div>';panel.innerHTML=html;
  }
  async function review(){
    busy=true;error="";doneMsg="";ack=false;confirmEmail="";render();
    try{
      var session=await client.auth.getSession();if(!session.data||!session.data.session)throw new Error(T.signedOut);
      userEmail=(session.data.session.user&&session.data.session.user.email)||"";
      var r=await client.functions.invoke("profile-access",{body:{action:"account_deletion_preflight"}});
      if(r.error)throw r.error;if(!r.data||r.data.error)throw new Error(r.data&&r.data.error||T.failed);
      result=r.data;
    }catch(e){error=e&&e.message?e.message:T.failed;}
    finally{busy=false;render();}
  }
  async function executeDeletion(){
    if(!canExecute()){
      if(userEmail&&confirmEmail.trim().toLowerCase()!==userEmail.trim().toLowerCase()){error=T.emailMismatch;render();}
      return;
    }
    deleting=true;error="";render();
    try{
      var session=await client.auth.getSession();if(!session.data||!session.data.session)throw new Error(T.signedOut);
      var r=await client.functions.invoke("profile-access",{body:{action:"execute_account_deletion",confirm:true,confirm_email:confirmEmail.trim()}});
      if(r.error)throw r.error;if(!r.data||!r.data.deleted)throw new Error(r.data&&r.data.error||T.deleteFailed);
      try{await client.auth.signOut();}catch(e){}
      try{localStorage.removeItem("pog_account_had_session");localStorage.setItem("pog_account_signed_out","1");}catch(e){}
      window.dispatchEvent(new CustomEvent("pog:authchange",{detail:{signedIn:false,signedOut:true}}));
      result=null;ack=false;confirmEmail="";doneMsg=T.deletedDone;
    }catch(e){error=e&&e.message?e.message:T.deleteFailed;}
    finally{deleting=false;render();}
  }
  function show(){
    if(!panel){panel=document.createElement("section");panel.className="account-panel";panel.setAttribute("role","dialog");panel.setAttribute("aria-modal","true");panel.hidden=true;document.body.appendChild(panel);
      panel.addEventListener("click",function(ev){var b=ev.target.closest("[data-account-delete]");if(!b)return;if(b.dataset.accountDelete==="close"){panel.hidden=true;return;}if(b.dataset.accountDelete==="review"&&!busy&&!deleting)review();if(b.dataset.accountDelete==="execute")executeDeletion();});
      panel.addEventListener("change",function(ev){if(ev.target.id==="acc-del-ack"){ack=!!ev.target.checked;render();}});
      panel.addEventListener("input",function(ev){if(ev.target.id==="acc-del-email"){confirmEmail=ev.target.value||"";var btn=panel.querySelector('[data-account-delete="execute"]');if(btn)btn.disabled=!canExecute();}});
    }
    result=null;error="";doneMsg="";ack=false;confirmEmail="";panel.hidden=false;render();review();
  }
  var root=document.getElementById("app");if(!root)return;
  if(!root.querySelector(".account-deletion-review-launcher")){var launch=document.createElement("button");launch.type="button";launch.className="profile-lifecycle-launcher account-deletion-review-launcher";launch.textContent=T.open;launch.setAttribute("aria-haspopup","dialog");launch.addEventListener("click",show);root.appendChild(launch);}
  window.POG.accountDeletion={canExecute:function(){return canExecute();}};
  window.addEventListener("pog:languagechange", function (ev) {
    lang = ev.detail && ev.detail.lang === "en" ? "en" : "it";
    T = translations[lang];
    var root = document.getElementById("app"), launch = root && root.querySelector(".account-deletion-review-launcher");
    if (launch) launch.textContent = T.open;
    if (panel && !panel.hidden) render();
  });
  })();