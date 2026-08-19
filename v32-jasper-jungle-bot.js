/* Jasper's Plant Room v3.2 — JasperJungleBot direct integration */
(function(){
  let integrationChecked=false;
  let connected=false;

  const style=document.createElement('style');
  style.id='v32JasperJungleBotStyles';
  style.textContent=`
#sharePlantTelegramBtn.bot-connected{border-color:#3d6b59;background:rgba(87,143,118,.12)}
#sharePlantTelegramBtn.bot-working{opacity:.72;pointer-events:none}
`;
  document.head.appendChild(style);

  function botToast(message){
    let el=document.getElementById('jasperJungleToast');
    if(!el){
      el=document.createElement('div');
      el.id='jasperJungleToast';
      Object.assign(el.style,{position:'fixed',left:'50%',bottom:'22px',transform:'translateX(-50%)',zIndex:'2147483647',background:'#172820',color:'#edf4f0',border:'1px solid #365246',borderRadius:'999px',padding:'10px 16px',boxShadow:'0 10px 30px rgba(0,0,0,.35)',fontSize:'13px',maxWidth:'calc(100vw - 30px)',textAlign:'center',opacity:'0',transition:'opacity .18s'});
      document.body.appendChild(el);
    }
    el.textContent=message;el.style.opacity='1';clearTimeout(el._timer);el._timer=setTimeout(()=>el.style.opacity='0',3800);
  }

  async function refreshIntegration(){
    if(!isOwner){connected=false;integrationChecked=true;return false;}
    try{
      const {data,error}=await sb.from('telegram_integrations').select('bot_username,telegram_first_name,connected_at').maybeSingle();
      if(error)throw error;
      connected=!!data;
    }catch(err){
      console.warn('Telegram integration status check failed',err);
      connected=false;
    }
    integrationChecked=true;
    return connected;
  }

  async function invokeBot(body){
    const {data,error}=await sb.functions.invoke('plant_telegram',{body});
    if(error){
      let message=error.message||'Bot request failed';
      try{
        if(error.context){const parsed=await error.context.json();if(parsed?.error)message=parsed.error;}
      }catch(_){ }
      throw new Error(message);
    }
    if(data?.error)throw new Error(data.error);
    return data;
  }

  function buttonForPlant(p){
    const btn=document.getElementById('sharePlantTelegramBtn');
    if(!btn)return;
    btn.classList.toggle('bot-connected',connected);
    btn.textContent=connected?'🌿 Send to JasperJungleBot':'🌿 Connect JasperJungleBot';
    btn.title=connected?'Send this plant record and cloud photos directly to your private bot chat':'Connect the bot to your private Telegram chat';
    btn.onclick=async()=>{
      if(btn.classList.contains('bot-working'))return;
      btn.classList.add('bot-working');
      const old=btn.textContent;
      try{
        if(!connected){
          btn.textContent='Connecting…';
          const result=await invokeBot({action:'connect'});
          connected=!!result?.connected;
          if(connected){
            botToast('JasperJungleBot connected — check Telegram for the confirmation message.');
            buttonForPlant(p);
          }
        }else{
          btn.textContent='Sending…';
          const result=await invokeBot({action:'send_plant',plant_id:p.cloudId});
          botToast(`Sent ${p.name} to JasperJungleBot${result?.gallery_sent||result?.growth_sent?` · ${result.gallery_sent||0} gallery + ${result.growth_sent||0} growth photo${((result.gallery_sent||0)+(result.growth_sent||0))===1?'':'s'}`:''}.`);
        }
      }catch(err){
        console.error(err);
        alert(err instanceof Error?err.message:String(err));
      }finally{
        btn.classList.remove('bot-working');
        if(document.body.contains(btn)){
          btn.textContent=connected?'🌿 Send to JasperJungleBot':old;
          btn.classList.toggle('bot-connected',connected);
        }
      }
    };

    const note=document.querySelector('#plantDialogBody .chatgpt-share-note');
    if(note)note.textContent=connected?'JasperJungleBot sends the live plant record + cloud photos directly to your private bot chat.':'Connect JasperJungleBot once, then plant sharing becomes one tap with no Telegram picker.';
  }

  async function upgradeTelegramButton(p){
    if(!isOwner)return;
    if(!integrationChecked)await refreshIntegration();
    let tries=0;
    const timer=setInterval(()=>{
      tries++;
      const btn=document.getElementById('sharePlantTelegramBtn');
      if(btn){clearInterval(timer);buttonForPlant(p);}
      else if(tries>20)clearInterval(timer);
    },50);
  }

  if(typeof openPlant==='function'){
    const previousOpenPlant=openPlant;
    openPlant=function(cloudId,activeTab='gallery'){
      const result=previousOpenPlant(cloudId,activeTab);
      const p=db.plants.find(x=>String(x.cloudId)===String(cloudId));
      if(p)upgradeTelegramButton(p);
      return result;
    };
  }

  window.refreshJasperJungleBot=async()=>{
    integrationChecked=false;
    await refreshIntegration();
    return connected;
  };
})();
