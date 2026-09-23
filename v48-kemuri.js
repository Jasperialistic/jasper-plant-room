/* Jasper's Plant Room v4.42.0 — KEMURI foundation. */
(function v442Kemuri(){
  'use strict';
  document.documentElement.dataset.design='kemuri';
  const theme=document.querySelector('meta[name="theme-color"]');if(theme)theme.content='#090a0a';

  const style=document.createElement('style');style.id='v442KemuriStyles';style.textContent=`
:root{
  --bg:#090a0a;--panel:#121414;--panel2:#181a1a;--line:#303334;--text:#f0f0ed;--muted:#9da39f;
  --green:#81968a;--accent:#a54850;--danger:#d2777d;--warn:#ba9b72;--ok:#809e8b;
  --kemuri-bg:#090a0a;--kemuri-ink:#f0f0ed;--kemuri-smoke:#9da39f;--kemuri-line:#303334;
  --kemuri-surface:#121414;--kemuri-surface-raised:#191b1b;--kemuri-oxblood:#7f252d;--kemuri-red:#a54850;
  --kemuri-botanical:#81968a;--kemuri-radius:12px;--kemuri-radius-small:8px;
  --shadow:0 1px 0 rgba(255,255,255,.035) inset,0 12px 30px rgba(0,0,0,.32)
}
html{background:var(--kemuri-bg)}
body{background:
  radial-gradient(900px 420px at 8% -12%,rgba(127,37,45,.14),transparent 64%),
  radial-gradient(720px 440px at 98% 8%,rgba(74,94,83,.1),transparent 68%),
  linear-gradient(180deg,#0a0b0b,#090a0a 46%,#080909);color:var(--kemuri-ink);letter-spacing:.006em}
body::before{content:"";position:fixed;inset:0;z-index:-1;pointer-events:none;opacity:.18;background-image:linear-gradient(rgba(255,255,255,.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.014) 1px,transparent 1px);background-size:48px 48px;mask-image:linear-gradient(to bottom,black,transparent 72%)}
.topbar{height:68px;background:rgba(9,10,10,.9);border-bottom-color:rgba(255,255,255,.085);backdrop-filter:blur(9px);-webkit-backdrop-filter:blur(9px)}
.brand-mark{border-radius:9px;border-color:#51383a;background:linear-gradient(145deg,#2c2022,#151617);color:#d3a2a6;box-shadow:inset 0 1px rgba(255,255,255,.05),0 7px 18px rgba(0,0,0,.28)}
.brand strong,.hero h1,.section-head h2,.modal-head h2,#v429PatchNotesDialog h2{font-family:Georgia,"Times New Roman",serif;letter-spacing:-.018em}
.brand span,.eyebrow{letter-spacing:.13em}.eyebrow{color:#bd7a80}
.cloud-pill{border-color:rgba(129,150,138,.28);background:rgba(129,150,138,.09);color:#a7baaf}
.tabs{border-radius:10px;border-color:var(--kemuri-line);background:rgba(15,17,17,.9);padding:4px}
.tab{border-radius:7px}.tab.active{background:#27292a;box-shadow:inset 0 0 0 1px #3a3d3e;color:#fff}
.today-card,.stat,.queue-item,.plant-card,.location-card,.backlog-card,.timeline-item,.growth-card,.add-plant-card,.rule-box{
  border-color:var(--kemuri-line)!important;border-radius:var(--kemuri-radius)!important;
  background:linear-gradient(145deg,rgba(25,27,27,.98),rgba(15,17,17,.98))!important;
  box-shadow:var(--shadow)
}
.plant-card,.location-card{transition:transform 130ms ease,border-color 160ms ease,box-shadow 160ms ease}
.plant-card:hover,.location-card:hover{transform:translateY(-2px);border-color:#55595a;box-shadow:0 1px 0 rgba(255,255,255,.04) inset,0 18px 36px rgba(0,0,0,.38)}
.plant-card:active,.location-card:active,button:active{transform:translateY(1px)}
.plant-photo,.location-photo,.gallery-tile,.gallery-main-wrap,.growth-card img{border-radius:8px;background:#080909}
.plant-card .plant-photo{border-radius:0}.location-card.has-photo .location-photo{border-radius:0}
.chip,.status{border-radius:6px;background:#202323;border-color:#373b3a;color:#c1c7c3}.status.today{border-color:#655640;color:#d6bf9b}.status.overdue{border-color:#63383d;color:#db9a9f}
.ghost,.primary,.icon-btn,.gallery-controls button{border-radius:8px!important;transition:background-color 140ms ease,border-color 140ms ease,color 140ms ease,transform 90ms ease}
.ghost,.icon-btn{background:#171919;color:#e7e8e5;border-color:#36393a}.ghost:hover,.icon-btn:hover{background:#222425;border-color:#4a4d4e}
.primary,.gallery-controls button.primary-control{background:var(--kemuri-oxblood)!important;border-color:#a34b53!important;color:#fff!important;box-shadow:inset 0 1px rgba(255,255,255,.09),0 7px 16px rgba(69,10,17,.24)}
.primary:hover{background:#92323b!important}
button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible,[role="button"]:focus-visible{outline:2px solid #b85e66!important;outline-offset:2px}
.toolbar input,.toolbar select,label select,label input,label textarea,.auth-card input,.small-dialog input,.small-dialog textarea,.small-dialog select{background:#111313;border-color:#343738;border-radius:8px;color:#f1f1ee}
.dialog,#v429PatchNotesDialog,#v441ThumbDialog{border-color:#3b3e3f!important;border-radius:14px!important;background:#0f1111!important;box-shadow:0 30px 88px rgba(0,0,0,.66)!important}
.dialog::backdrop,#v429PatchNotesDialog::backdrop,#v441ThumbDialog::backdrop{background:rgba(3,4,4,.83);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px)}
.gallery-main,.photo-lightbox-img,#growthViewImg{filter:none!important}.photo-lightbox{background:rgba(3,4,4,.985)}
.profile-tab{border-radius:7px;border-color:#343738}.profile-tab.active{background:#27292a;color:#fff;border-color:#55595a}
.mobile-bottom-nav{background:rgba(10,11,11,.96)!important;border-top-color:#303334!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important}
.mobile-nav-item[data-active="1"]{color:#d58c92!important}.mobile-nav-item[data-active="1"]::before{background:#8d3038!important;box-shadow:none!important}
.v416-version{border-color:#503437!important;color:#c88b90!important;background:rgba(127,37,45,.12)!important}
@media(max-width:700px),(pointer:coarse){
  .topbar,.dialog::backdrop,#v429PatchNotesDialog::backdrop,#v441ThumbDialog::backdrop,.auth-gate{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}
  .topbar{background:#0c0d0d}.plant-card,.location-card,.queue-item,.stat{box-shadow:0 1px 0 rgba(255,255,255,.025) inset,0 7px 18px rgba(0,0,0,.22)}
  body::before{display:none}.plant-card:hover,.location-card:hover{transform:none}
}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{scroll-behavior:auto!important;animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important}}
`;
  document.head.appendChild(style);
})();
