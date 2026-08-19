/* Jasper's Plant Room v3.1 — direct Telegram sharing */
(function(){
  const style=document.createElement('style');
  style.id='v31TelegramShareStyles';
  style.textContent=`
.telegram-share-btn{display:inline-flex;align-items:center;justify-content:center;gap:7px}
@media(max-width:650px){.chatgpt-share-row .telegram-share-btn{width:100%}}
`;
  document.head.appendChild(style);

  function v(v){return v===null||v===undefined||v===''?'—':String(v);}
  function d(vv){try{return vv?fmt(vv):'—';}catch(_){return v(vv);}}

  function telegramVisuals(p){
    let gallery=[];
    try{gallery=galleryPhotos(p)||[];}catch(_){gallery=[];}
    return gallery
      .filter(x=>x && typeof x.url==='string' && /^https?:\/\//i.test(x.url))
      .sort((a,b)=>(b.is_thumbnail?1:0)-(a.is_thumbnail?1:0));
  }

  function telegramPacket(p){
    const photos=telegramVisuals(p);
    const lines=[
      `🌿 ${v(p.name)}`,
      `Plant ID: ${v(p.cloudId)}`,
      `Group: ${v(p.group)}`,
      `Zone: ${v(p.location)}`,
      `Medium: ${v(p.medium)}`,
      `Watering: ${v(p.mode)}`,
      `Last care: ${d(p.lastCare)}${p.lastAction?' — '+p.lastAction:''}`,
      `Next check: ${d(p.nextCheck)}`,
      `Check rule: ${v(p.rule)}`
    ];
    if(p.notes)lines.push(`Notes: ${p.notes}`);
    if(photos.length>1)lines.push(`Cloud gallery: ${photos.length} photos`);
    lines.push('Source: Jasper’s Plant Room');
    return lines.join('\n');
  }

  function telegramShareUrl(p){
    const photos=telegramVisuals(p);
    const shareUrl=photos[0]?.url || location.href;
    const text=telegramPacket(p);
    return `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`;
  }

  function sharePlantToTelegram(p){
    const url=telegramShareUrl(p);
    const w=window.open(url,'_blank','noopener,noreferrer');
    if(!w)location.href=url;
  }
  window.sharePlantToTelegram=sharePlantToTelegram;
  window.telegramPlantPacket=telegramPacket;

  function injectTelegramButton(p){
    if(!isOwner)return;
    const row=document.querySelector('#plantDialogBody .chatgpt-share-row');
    if(!row || document.getElementById('sharePlantTelegramBtn'))return;
    const btn=document.createElement('button');
    btn.type='button';
    btn.id='sharePlantTelegramBtn';
    btn.className='ghost small telegram-share-btn';
    btn.textContent='✈ Share to Telegram';
    btn.title='Open Telegram directly with this plant reference';
    const note=row.querySelector('.chatgpt-share-note');
    if(note)row.insertBefore(btn,note);else row.appendChild(btn);
    btn.onclick=()=>sharePlantToTelegram(p);
    if(note)note.textContent='ChatGPT shares files when supported · Telegram opens directly without relying on the phone share list.';
  }

  if(typeof openPlant==='function'){
    const previousOpenPlant=openPlant;
    openPlant=function(cloudId,activeTab='gallery'){
      const result=previousOpenPlant(cloudId,activeTab);
      const p=db.plants.find(x=>String(x.cloudId)===String(cloudId));
      if(p)requestAnimationFrame(()=>requestAnimationFrame(()=>injectTelegramButton(p)));
      return result;
    };
  }
})();
