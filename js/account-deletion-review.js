(function () {
  "use strict";
  var cfg=window.POG_SUPABASE_CONFIG||{},lang=localStorage.getItem("pog_lang")==="en"?"en":"it";
  var T={
    en:{open:"Account deletion review",title:"Account deletion review",intro:"Before an account can be deleted, every learner profile and shared access link must be handled safely.",review:"Review my account",loading:"Reviewing account dependencies…",ready:"No profile ownership or pending-transfer blockers were found. This is a preflight only; it does not delete your account.",blocked:"Your account is not ready for deletion yet. Resolve the items below first.",owner:"Owned profile",transfer:"Transfer ownership to an existing caregiver or request profile deletion.",wait:"A profile deletion is already scheduled. Wait until it completes before closing this account.",delete:"Request profile deletion or transfer ownership before account deletion.",member:"Shared membership",memberNote:"This access will need to be revoked as part of account closure; learner data remains with the profile.",outgoing:"Outgoing ownership request",incoming:"Incoming ownership invitation",transferNote:"Resolve this invitation before account closure.",summary:"Account overview",members:"Profile memberships",owned:"Owned profiles",pending:"Pending transfers",close:"Close",signedOut:"Sign in to review account deletion.",failed:"Could not review account dependencies.",privacy:"Local data and audio recordings on devices cannot be remotely erased by account closure. Export anything you need before proceeding.",readOnly:"Read-only review: no data has been changed."},
    it:{open:"Verifica eliminazione account",title:"Verifica eliminazione account",intro:"Prima di eliminare un account, ogni profilo e ogni accesso condiviso devono essere gestiti in sicurezza.",review:"Verifica il mio account",loading:"Verifica delle dipendenze dell'account…",ready:"Non risultano blocchi relativi alla proprietà dei profili o a trasferimenti in sospeso. Questa è solo una verifica preliminare: non elimina l'account.",blocked:"L'account non è ancora pronto per l'eliminazione. Risolvi prima gli elementi indicati.",owner:"Profilo di cui sei proprietario",transfer:"Trasferisci la proprietà a un caregiver esistente oppure richiedi l'eliminazione del profilo.",wait:"L'eliminazione del profilo è già programmata. Attendi il completamento prima di chiudere l'account.",delete:"Richiedi l'eliminazione del profilo o trasferiscine la proprietà prima di eliminare l'account.",member:"Accesso condiviso",memberNote:"Questo accesso dovrà essere revocato durante la chiusura dell'account; i dati del profilo restano disponibili.",outgoing:"Richiesta di trasferimento inviata",incoming:"Invito a ricevere la proprietà",transferNote:"Risolvi questo invito prima di chiudere l'account.",summary:"Riepilogo account",members:"Accessi ai profili",owned:"Profili di cui sei proprietario",pending:"Trasferimenti in sospeso",close:"Chiudi",signedOut:"Accedi per verificare l'eliminazione dell'account.",failed:"Impossibile verificare le dipendenze dell'account.",privacy:"I dati locali e le registrazioni audio sui dispositivi non possono essere cancellati da remoto con la chiusura dell'account. Esporta ciò che ti serve prima di procedere.",readOnly:"Verifica in sola lettura: nessun dato è stato modificato."}
  }[lang];
  if(!cfg.url||!cfg.anonKey||!window.supabase||!window.supabase.createClient)return;
  var client;try{client=window.supabase.createClient(cfg.url,cfg.anonKey,{auth:{persistSession:true,autoRefreshToken:true}});}catch(e){return;}
  var panel=null,result=null,error="",busy=false;
  function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(c){return({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c];});}
  function date(v){return v?new Date(v).toLocaleString(lang==="it"?"it-IT":"en-GB"):"";}
  function render(){
    if(!panel)return;
    var html='<div class="account-card"><div class="account-head"><h2>'+T.title+'</h2><button class="account-close" data-account-delete="close" aria-label="'+T.close+'">×</button></div><p>'+T.intro+'</p><button class="primary account-action" data-account-delete="review"'+(busy?' disabled':'')+'>'+T.review+'</button>';
    if(busy)html+='<p role="status">'+T.loading+'</p>';
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
    }
    if(error)html+='<p class="account-message" role="alert">'+esc(error)+'</p>';
    html+='</div>';panel.innerHTML=html;
  }
  async function review(){
    busy=true;error="";render();
    try{
      var session=await client.auth.getSession();if(!session.data||!session.data.session)throw new Error(T.signedOut);
      var r=await client.functions.invoke("profile-access",{body:{action:"account_deletion_preflight"}});
      if(r.error)throw r.error;if(!r.data||r.data.error)throw new Error(r.data&&r.data.error||T.failed);
      result=r.data;
    }catch(e){error=e&&e.message?e.message:T.failed;}
    finally{busy=false;render();}
  }
  function show(){
    if(!panel){panel=document.createElement("section");panel.className="account-panel";panel.setAttribute("role","dialog");panel.setAttribute("aria-modal","true");panel.hidden=true;document.body.appendChild(panel);
      panel.addEventListener("click",function(ev){var b=ev.target.closest("[data-account-delete]");if(!b)return;if(b.dataset.accountDelete==="close"){panel.hidden=true;return;}if(b.dataset.accountDelete==="review"&&!busy)review();});
    }
    result=null;error="";panel.hidden=false;render();review();
  }
  var root=document.getElementById("app");if(!root)return;
  if(!root.querySelector(".account-deletion-review-launcher")){var launch=document.createElement("button");launch.type="button";launch.className="profile-lifecycle-launcher account-deletion-review-launcher";launch.textContent=T.open;launch.setAttribute("aria-haspopup","dialog");launch.addEventListener("click",show);root.appendChild(launch);}
})();