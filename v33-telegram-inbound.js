/* Jasper's Plant Room v3.3 — inbound Telegram photo archive setup */
(function(){
  let running=false;
  let ready=false;

  async function setupInbound(){
    if(running||ready||!isOwner)return ready;
    running=true;
    try{
      const {data:integration,error:intErr}=await sb.from('telegram_integrations').select('bot_username,connected_at').maybeSingle();
      if(intErr)throw intErr;
      if(!integration)return false;
      const {data,error}=await sb.functions.invoke('plant_telegram',{body:{action:'setup_webhook'}});
      if(error){
        let message=error.message||'Could not enable Telegram uploads';
        try{if(error.context){const body=await error.context.json();if(body?.error)message=body.error;}}catch(_){ }
        throw new Error(message);
      }
      if(data?.error)throw new Error(data.error);
      ready=!!data?.enabled;
      if(ready){
        document.documentElement.dataset.telegramInbound='ready';
        try{sessionStorage.setItem('jasperJungleInboundReady','1');}catch(_){ }
        console.info('JasperJungleBot inbound photo archive enabled');
      }
      return ready;
    }catch(err){
      console.warn('JasperJungleBot inbound setup failed',err);
      return false;
    }finally{
      running=false;
    }
  }

  window.setupJasperJungleInbound=setupInbound;

  function boot(){
    if(!isOwner)return;
    setTimeout(setupInbound,650);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
