const $=s=>document.querySelector(s),esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

/* Set when /api/content answered, cleared when it did not. The contact form
   uses this to decide between posting to the backend and falling back to
   FORM_ENDPOINT / the visitor's email app on a purely static host. */
let API_OK=false;

/* ---------- content loader ----------
   Prefers the backend at API_BASE and falls back to the globals defined in
   config.js, so the page still renders when opened as plain static files. */
async function loadContent(){
 if(!API_BASE)return null;
 try{
  const r=await fetch(API_BASE+"/api/content",{headers:{Accept:"application/json"}});
  if(!r.ok){API_OK=false;return null}
  const j=await r.json();
  if(j&&j.content){API_OK=true;return j.content}
  API_OK=false;return null;
 }catch{API_OK=false;return null}
}

/* Map API section names onto the globals the renderer uses. */
function applyContent(c){
 if(!c)return false;
 if(c.config)Object.assign(CONFIG,c.config);
 if(Array.isArray(c.team))TEAM=c.team;
 if(c.services)SERVICES=c.services;
 if(Array.isArray(c.projects))PROJECTS=c.projects;
 if(Array.isArray(c.why))WHY=c.why;
 if(Array.isArray(c.steps))STEPS=c.steps;
 if(Array.isArray(c.testimonials))TESTS=c.testimonials;
 return true;
}

function init(){
document.title=CONFIG.name+" | Web Development & Digital Marketing Agency";
document.querySelectorAll("[data-agency]").forEach(e=>e.textContent=CONFIG.name);
$("#yr").textContent=new Date().getFullYear();
$("#mail").textContent=$("#fmail").textContent=CONFIG.email;$("#mail").href=$("#fmail").href="mailto:"+CONFIG.email;
$("#wa").href="https://wa.me/"+CONFIG.whatsapp+"?text="+encodeURIComponent("Hi, I'd like to discuss a project.");
const socLinks=Object.entries(CONFIG.socials).map(([n,u])=>`<a href="${esc(u)}" target="_blank" rel="noopener">${esc(n)}</a>`).join("");
$("#fsoc").innerHTML=socLinks;
$("#soc").innerHTML=Object.entries(CONFIG.socials).map(([n,u])=>`<a href="${esc(u)}" target="_blank" rel="noopener">${esc(n)}</a>`).join(" &nbsp; ");

/* Service icons are inline SVG so they stay sharp at any size and pick up the
   card's colour through currentColor. An unknown key falls back to its text,
   so a typo in config.js degrades to a letter instead of an empty box. */
const icon=k=>ICONS[k]?`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICONS[k]}</svg>`:esc(k||"");
$("#svc").innerHTML=Object.entries(SERVICES).map(([g,list])=>`<div class="svc-group"><h3>${g}</h3><div class="cols">${list.map(s=>`<article class="card"><div class="ico">${icon(s[2])}</div><h3>${esc(s[0])}</h3><p>${esc(s[1])}</p></article>`).join("")}</div></div>`).join("");
$("#proj").innerHTML=PROJECTS.map(p=>`<article class="card proj"><div class="shot" style="--a:${p.c[0]};background-image:${p.img?`url('${esc(p.img)}')`:`linear-gradient(135deg,${p.c[0]},${p.c[1]})`}">${p.img?"":'<div class="mock"><span><i></i><i></i><i></i></span><b></b><u></u><u></u><s></s></div>'}</div><h3>${esc(p.name)}</h3><div class="meta">${esc(p.industry)} · ${esc(p.services)}</div><p>${esc(p.desc)}</p><div>${p.tech.map(t=>`<span class="tag">${esc(t)}</span>`).join("")}</div>${p.url&&p.url.startsWith("http")?`<a class="vis" href="${esc(p.url)}" target="_blank" rel="noopener">Visit site →</a>`:""}</article>`).join("");

function avatar(m,i){if(m.photo)return m.photo;
 const h=[235,160,330,25,200,280][i%6],ini=m.name.split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase();
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${h},70%,55%)"/><stop offset="1" stop-color="hsl(${h+40},70%,30%)"/></linearGradient></defs><rect width="400" height="500" fill="url(#g)"/><circle cx="200" cy="200" r="72" fill="rgba(255,255,255,.28)"/><path d="M60 500c0-100 60-160 140-160s140 60 140 160z" fill="rgba(255,255,255,.28)"/><text x="200" y="215" font-family="sans-serif" font-size="56" font-weight="700" fill="#fff" text-anchor="middle">${esc(ini)}</text></svg>`;
 return "data:image/svg+xml;utf8,"+encodeURIComponent(svg)}
/* The team is shown as one clustered "group photo": each person gets a
   branded lanyard and ID badge. Names/roles still come from TEAM in config.js. */
const badge=(m,i)=>`<figure class="tp">
<div class="tp-face"><img src="${avatar(m,i).replace(/"/g,"&quot;")}" alt="Portrait of ${esc(m.name)}" loading="lazy"></div>
<div class="tp-strap" aria-hidden="true"></div>
<figcaption class="tp-badge">
<span class="tp-mark" aria-hidden="true">N</span>
<span class="tp-name">${esc(m.name)}</span>
<span class="tp-role">${esc(m.role)}</span>
</figcaption></figure>`;
const groups=[...new Set(TEAM.map(m=>m.group))];
$("#teamgrid").innerHTML=`<div class="team-photo">${TEAM.map(badge).join("")}</div>
<div class="tp-legend">${groups.map(g=>`<span>${esc(g)}</span>`).join("")}</div>`;

$("#why").innerHTML=WHY.map(w=>`<div class="card"><h3>${w[0]}</h3><p>${w[1]}</p></div>`).join("");
$("#steps").innerHTML=STEPS.map(s=>`<li><h3>${s[0]}</h3><p>${s[1]}</p></li>`).join("");
$("#tests").innerHTML=TESTS.map(t=>`<blockquote class="card"><p class="quote">“${t[0]}”</p><div class="who">${t[1]}</div><div class="note">Placeholder, not a real client</div></blockquote>`).join("");
const sel=$("[name=service]");Object.values(SERVICES).flat().forEach(s=>{const o=document.createElement("option");o.textContent=s[0];sel.append(o)});

const track=$("#proj"),step=()=>track.firstElementChild.getBoundingClientRect().width+20;
const go=d=>{const max=track.scrollWidth-track.clientWidth;if(d>0&&track.scrollLeft>=max-4)track.scrollTo({left:0});else if(d<0&&track.scrollLeft<=4)track.scrollTo({left:max});else track.scrollBy({left:d*step()})};
$("#next").onclick=()=>go(1);$("#prev").onclick=()=>go(-1);
let tm;const play=()=>{if(matchMedia("(prefers-reduced-motion:reduce)").matches)return;clearInterval(tm);tm=setInterval(()=>go(1),4500)};
["mouseenter","focusin","touchstart"].forEach(e=>track.parentElement.addEventListener(e,()=>clearInterval(tm),{passive:true}));
["mouseleave","focusout"].forEach(e=>track.parentElement.addEventListener(e,play));play();
const menu=$("#menu"),links=$("#links");
menu.onclick=()=>{const o=links.classList.toggle("open");menu.setAttribute("aria-expanded",o);menu.textContent=o?"✕":"☰"};
links.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>{links.classList.remove("open");menu.setAttribute("aria-expanded","false");menu.textContent="☰"}));

const f=$("#f"),st=$("#status");
f.addEventListener("submit",async e=>{e.preventDefault();let ok=true;
 const rules={name:v=>v.trim().length>1||"Enter your name.",email:v=>/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)||"Enter a valid email, like name@company.com.",service:v=>!!v||"Choose a service.",budget:v=>!!v||"Choose a budget range.",msg:v=>v.trim().length>=20||"Describe your project in at least 20 characters."};
 for(const k in rules){const el=f.elements[k],r=rules[k](el.value),msg=r===true?"":r;el.parentElement.querySelector(".err").textContent=msg;el.setAttribute("aria-invalid",!!msg);if(msg)ok=false}
 if(!ok){st.className="bad";st.textContent="Please fix the highlighted fields and send again.";return}
 const d=Object.fromEntries(new FormData(f));
 const btn=f.querySelector('button[type=submit]'),label=btn.textContent;
 btn.disabled=true;btn.textContent="Sending…";
 try{
  /* Preferred path: post to the backend, which validates, stores and can
     email the enquiry. When the site is hosted without the backend, fall back
     to FORM_ENDPOINT (Formspree, Web3Forms) and finally to the email app. */
  const endpoint=API_OK?API_BASE+"/api/leads":FORM_ENDPOINT;
  if(endpoint){
   const r=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(d)});
   const j=await r.json().catch(()=>null);
   if(!r.ok)throw new Error((j&&j.errors)?Object.values(j.errors)[0]:"The message could not be sent.");
   st.className="ok";st.textContent=(j&&j.message)||("Thanks, "+d.name+". We received your project details and will reply soon.");f.reset();
  }else{
   const body=`Name: ${d.name}\nEmail: ${d.email}\nService: ${d.service}\nBudget: ${d.budget}\n\n${d.msg}`;
   location.href=`mailto:${CONFIG.email}?subject=${encodeURIComponent("Project enquiry: "+d.service)}&body=${encodeURIComponent(body)}`;
   st.className="ok";st.textContent="Your email app should open with the details filled in. Press send to finish. If nothing opens, email "+CONFIG.email+" directly."}
 }catch(err){st.className="bad";st.textContent=(err&&err.message)||("The message could not be sent. Email us at "+CONFIG.email+" or use WhatsApp.")}
 finally{btn.disabled=false;btn.textContent=label}
});
}

/* Kick off: try the API first, then render either way. */
loadContent().then(c=>applyContent(c)).catch(()=>{}).finally(init);