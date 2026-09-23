/* Jasper's Plant Room v4.43.0 — organic KEMURI experience layer. */
(function v443OrganicExperience(){
  'use strict';

  document.documentElement.dataset.experience='organic-kemuri';
  const theme=document.querySelector('meta[name="theme-color"]');
  if(theme)theme.content='#070a08';

  const style=document.createElement('style');
  style.id='v443OrganicExperienceStyles';
  style.textContent=`
:root{
  --kemuri-night:#070a08;--kemuri-deep:#0a100c;--kemuri-glass:rgba(20,29,24,.78);
  --kemuri-glass-deep:rgba(10,14,12,.9);--kemuri-edge:rgba(183,213,194,.14);
  --kemuri-edge-strong:rgba(166,203,179,.25);--kemuri-leaf:#789985;--kemuri-leaf-bright:#9bbba7;
  --kemuri-smoke:#334c3e;--kemuri-shadow:0 18px 48px rgba(0,0,0,.38);
  --kemuri-spring:cubic-bezier(.2,.78,.24,1);--kemuri-soft:cubic-bezier(.22,.61,.36,1)
}
html{background:var(--kemuri-night);scroll-behavior:smooth}
body{position:relative;isolation:isolate;min-height:100vh;background-color:var(--kemuri-night)!important;background-image:
  radial-gradient(75rem 42rem at 8% -6%,rgba(70,105,83,.2),transparent 67%),
  radial-gradient(58rem 38rem at 102% 18%,rgba(43,70,54,.2),transparent 72%),
  radial-gradient(50rem 30rem at 38% 108%,rgba(66,35,39,.11),transparent 72%),
  linear-gradient(155deg,#090d0a 0%,#070a08 42%,#080b09 100%)!important;
  background-attachment:fixed;-webkit-tap-highlight-color:transparent
}
body::after{content:"";position:fixed;z-index:-1;pointer-events:none;inset:-22vh -18vw;opacity:.34;background:
  radial-gradient(ellipse at 18% 35%,rgba(85,126,100,.24),transparent 31%),
  radial-gradient(ellipse at 74% 28%,rgba(57,91,70,.2),transparent 28%),
  radial-gradient(ellipse at 57% 77%,rgba(77,104,88,.13),transparent 34%);
  transform:translate3d(-1.5%,0,0) scale(1.03);animation:kemuri-smoke-drift 32s var(--kemuri-soft) infinite alternate;will-change:transform
}
body.kemuri-motion-paused::after{animation-play-state:paused}
@keyframes kemuri-smoke-drift{0%{transform:translate3d(-1.5%,-.5%,0) scale(1.03)}50%{transform:translate3d(1%,1.2%,0) scale(1.06)}100%{transform:translate3d(2.2%,-1%,0) scale(1.035)}}

.topbar{background:linear-gradient(180deg,rgba(7,10,8,.9),rgba(7,10,8,.74))!important;border-bottom:1px solid rgba(177,207,188,.1)!important;box-shadow:0 10px 36px rgba(0,0,0,.18)}
.brand-mark{background:linear-gradient(145deg,rgba(61,82,69,.72),rgba(22,27,24,.94))!important;border-color:rgba(171,201,182,.23)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.1),0 10px 24px rgba(0,0,0,.3)!important}
.shell{position:relative}
.hero{animation:kemuri-hero-in 680ms var(--kemuri-spring) both}
.hero h1{text-wrap:balance;text-shadow:0 2px 28px rgba(0,0,0,.46)}
.hero p{text-wrap:pretty}
@keyframes kemuri-hero-in{from{opacity:0;transform:translate3d(0,14px,0)}to{opacity:1;transform:none}}

.tabs{position:relative;background:linear-gradient(145deg,rgba(21,29,25,.72),rgba(9,12,10,.82))!important;border-color:var(--kemuri-edge)!important;box-shadow:inset 0 1px rgba(255,255,255,.035),0 12px 34px rgba(0,0,0,.22)!important;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}
.tab{min-height:42px;transition:color 180ms ease,background 220ms ease,box-shadow 220ms ease,transform 180ms var(--kemuri-spring)!important}
.tab.active{background:linear-gradient(145deg,rgba(108,137,118,.25),rgba(44,61,51,.42))!important;border-color:rgba(165,198,177,.2)!important;box-shadow:inset 0 1px rgba(255,255,255,.08),0 8px 20px rgba(0,0,0,.2)!important;color:#f4f6f3!important}

.today-card,.stat,.queue-item,.plant-card,.location-card,.backlog-card,.timeline-item,.growth-card,.add-plant-card,.rule-box{
  position:relative;background:linear-gradient(145deg,var(--kemuri-glass),var(--kemuri-glass-deep))!important;
  border:1px solid var(--kemuri-edge)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.045),inset 0 -1px 0 rgba(0,0,0,.25),var(--kemuri-shadow)!important
}
.today-card::after,.stat::after,.plant-card::after,.location-card::after,.growth-card::after{content:"";position:absolute;pointer-events:none;inset:0;border-radius:inherit;background:linear-gradient(128deg,rgba(255,255,255,.045),transparent 24%,transparent 75%,rgba(116,154,129,.025));opacity:.85}
.plant-card,.location-card,.queue-item,.growth-card,.gallery-tile{transform:translateZ(0);transition:transform 300ms var(--kemuri-spring),border-color 220ms ease,box-shadow 300ms ease!important}
.plant-photo,.location-photo,.queue-thumb,.gallery-tile img,.growth-card img,.gallery-main{transition:transform 520ms var(--kemuri-spring),filter 300ms ease,opacity 240ms ease!important}
.plant-card,.location-card,.queue-item,.gallery-tile,.growth-card{animation:kemuri-card-in 460ms var(--kemuri-spring) both}
.plant-grid>*:nth-child(2),.location-grid>*:nth-child(2),.queue>*:nth-child(2){animation-delay:35ms}
.plant-grid>*:nth-child(3),.location-grid>*:nth-child(3),.queue>*:nth-child(3){animation-delay:70ms}
.plant-grid>*:nth-child(4),.location-grid>*:nth-child(4),.queue>*:nth-child(4){animation-delay:105ms}
.plant-grid>*:nth-child(5),.location-grid>*:nth-child(5),.queue>*:nth-child(5){animation-delay:140ms}
.plant-grid>*:nth-child(n+6),.location-grid>*:nth-child(n+6),.queue>*:nth-child(n+6){animation-delay:175ms}
@keyframes kemuri-card-in{from{opacity:0;transform:translate3d(0,12px,0) scale(.985)}to{opacity:1;transform:translateZ(0) scale(1)}}
@media(hover:hover) and (pointer:fine){
  .plant-card:hover,.location-card:hover,.queue-item:hover,.growth-card:hover,.gallery-tile:hover{transform:translate3d(0,-6px,0) scale(1.006)!important;border-color:var(--kemuri-edge-strong)!important;box-shadow:inset 0 1px rgba(255,255,255,.07),0 25px 58px rgba(0,0,0,.48),0 8px 24px rgba(47,78,59,.1)!important}
  .plant-card:hover .plant-photo,.location-card:hover .location-photo,.gallery-tile:hover img,.growth-card:hover img{transform:scale(1.035);filter:saturate(1.04) contrast(1.025)}
  .ghost:hover,.icon-btn:hover{border-color:var(--kemuri-edge-strong)!important;box-shadow:0 10px 24px rgba(0,0,0,.25)}
}

.plant-photo,.location-photo,.queue-thumb,.gallery-tile,.gallery-main-wrap,.growth-card img{box-shadow:inset 0 0 0 1px rgba(255,255,255,.05),0 9px 24px rgba(0,0,0,.22)}
.gallery-tile{border:1px solid rgba(184,211,193,.1);box-shadow:inset 0 1px rgba(255,255,255,.04),0 14px 30px rgba(0,0,0,.32);background:#090c0a!important}
.gallery-tile.preview-active{outline-color:var(--kemuri-leaf-bright)!important;box-shadow:0 0 0 3px rgba(122,159,135,.14),0 18px 36px rgba(0,0,0,.38)!important}
.thumbs{padding:5px 2px 9px;scroll-snap-type:x proximity}.thumbs img{scroll-snap-align:center;opacity:.56;transform:scale(.94);transition:opacity 180ms ease,transform 240ms var(--kemuri-spring),border-color 180ms ease!important}.thumbs img.active{opacity:1;transform:scale(1);border-color:var(--kemuri-leaf-bright)!important;box-shadow:0 8px 20px rgba(0,0,0,.36)}

.ghost,.primary,.icon-btn,.gallery-controls button,.mobile-nav-item{touch-action:manipulation;transform:translateZ(0)}
.ghost,.primary,.icon-btn,.gallery-controls button{position:relative;overflow:hidden;transition:transform 180ms var(--kemuri-spring),background-color 180ms ease,border-color 180ms ease,box-shadow 220ms ease!important}
.primary{background:linear-gradient(145deg,#8e343c,#6e2028)!important;border:1px solid rgba(220,132,139,.42)!important;box-shadow:inset 0 1px rgba(255,255,255,.12),0 10px 22px rgba(67,8,14,.28)!important}
.ghost,.icon-btn{background:linear-gradient(145deg,rgba(37,47,41,.82),rgba(15,19,17,.9))!important;border-color:rgba(169,199,179,.15)!important}
.kemuri-press,.ghost:active,.primary:active,.icon-btn:active,.mobile-nav-item:active{transform:scale(.965)!important;transition-duration:70ms!important}

.dialog,#v429PatchNotesDialog,#v441ThumbDialog{background:linear-gradient(145deg,rgba(22,29,25,.96),rgba(8,11,9,.985))!important;border-color:rgba(183,211,193,.18)!important;box-shadow:inset 0 1px rgba(255,255,255,.06),0 36px 110px rgba(0,0,0,.7)!important;backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)}
.dialog[open],#v429PatchNotesDialog[open],#v441ThumbDialog[open]{animation:kemuri-dialog-in 420ms var(--kemuri-spring) both}
.dialog[open]::backdrop,#v429PatchNotesDialog[open]::backdrop,#v441ThumbDialog[open]::backdrop{animation:kemuri-backdrop-in 280ms ease both}
@keyframes kemuri-dialog-in{from{opacity:0;transform:translate3d(0,18px,0) scale(.975)}to{opacity:1;transform:none}}
@keyframes kemuri-backdrop-in{from{opacity:0}to{opacity:1}}
.kemuri-view-enter{animation:kemuri-view-in 380ms var(--kemuri-spring) both!important}
@keyframes kemuri-view-in{from{opacity:.25;transform:translate3d(0,9px,0)}to{opacity:1;transform:none}}

#mobileAppNav{background:linear-gradient(145deg,rgba(20,28,23,.96),rgba(8,11,9,.97))!important;border:1px solid rgba(177,207,188,.13)!important;box-shadow:inset 0 1px rgba(255,255,255,.055),0 18px 44px rgba(0,0,0,.58)!important}
#mobileAppNav .mobile-nav-item[data-active="1"]{background:linear-gradient(145deg,rgba(112,145,122,.18),rgba(54,73,61,.24))!important;color:#c7d8cc!important}
#mobileAppNav #mobileNavAdd{box-shadow:inset 0 1px rgba(255,255,255,.18),0 12px 28px rgba(0,0,0,.4)!important}

@media(max-width:700px),(pointer:coarse){
  html{scroll-behavior:auto}body{background-attachment:scroll}body::after{animation:none;opacity:.25;transform:none;inset:-8vh -35vw}
  .tabs,.dialog,#v429PatchNotesDialog,#v441ThumbDialog{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}
  .plant-card,.location-card,.queue-item,.growth-card,.gallery-tile{animation-duration:340ms}
  .plant-card:hover,.location-card:hover,.queue-item:hover,.growth-card:hover,.gallery-tile:hover{transform:none!important}
  .plant-photo,.location-photo,.queue-thumb,.gallery-tile img,.growth-card img{transition-duration:220ms!important}
  .dialog[open],#v429PatchNotesDialog[open],#v441ThumbDialog[open]{animation-name:kemuri-sheet-in;animation-duration:360ms}
  @keyframes kemuri-sheet-in{from{opacity:0;transform:translate3d(0,28px,0) scale(.99)}to{opacity:1;transform:none}}
}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}body::after,.hero,.plant-card,.location-card,.queue-item,.growth-card,.gallery-tile,.dialog[open],#v429PatchNotesDialog[open],#v441ThumbDialog[open],.kemuri-view-enter{animation:none!important}.plant-photo,.location-photo,.gallery-tile img,.growth-card img{transition:none!important}}
`;
  document.head.appendChild(style);

  const tactileSelector='button,.tab,.plant-card,.location-card,.queue-item,.gallery-tile,[data-gallery-preview],.mobile-nav-item';
  const prefersReduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarsePointer=()=>matchMedia('(pointer: coarse)').matches;
  const haptic=target=>{
    if(!coarsePointer()||typeof navigator.vibrate!=='function')return;
    const strong=target.matches('.primary,#mobileNavAdd');
    try{navigator.vibrate(strong?12:7);}catch(_error){}
  };
  const release=target=>target?.classList.remove('kemuri-press');

  document.addEventListener('pointerdown',event=>{
    const target=event.target.closest?.(tactileSelector);
    if(!target||target.matches(':disabled'))return;
    target.classList.add('kemuri-press');
  },{passive:true});
  document.addEventListener('pointerup',event=>{
    const target=event.target.closest?.(tactileSelector);
    if(!target||target.matches(':disabled'))return;
    release(target);haptic(target);
  },{passive:true});
  document.addEventListener('pointercancel',event=>release(event.target.closest?.(tactileSelector)),{passive:true});
  document.addEventListener('pointerleave',event=>release(event.target.closest?.(tactileSelector)),{capture:true,passive:true});

  document.addEventListener('click',event=>{
    if(prefersReduced()||!event.target.closest?.('.tab,[data-view],.mobile-nav-item'))return;
    setTimeout(()=>{
      const view=document.querySelector('.view.active');
      if(!view)return;
      view.classList.remove('kemuri-view-enter');
      void view.offsetWidth;
      view.classList.add('kemuri-view-enter');
    },0);
  });

  document.addEventListener('visibilitychange',()=>document.body.classList.toggle('kemuri-motion-paused',document.hidden));
})();
