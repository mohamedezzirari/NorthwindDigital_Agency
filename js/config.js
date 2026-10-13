/* ============ EDIT THIS BLOCK ============ */
/* Backend base URL. By default the site uses its own origin, which works when
   the Express server in server/ serves this page. Set it to a full URL
   (e.g. "https://api.example.com") to host the API separately, or to "" to
   force pure static mode (content comes from this file only). */
const API_BASE=/^https?:$/.test(location.protocol)?location.origin:"";
const CONFIG={
  name:"Northwind Digital",           // agency name
  email:"hello@example.com",          // contact email
  whatsapp:"212600000000",            // number with country code, digits only
  socials:{Facebook:"https://facebook.com"}
};
/* Team photos live in the assets/ folder. To swap one, point its PHOTO
   value at another image URL or file path. */
const PHOTO1="assets/photo1.jpg",PHOTO2="assets/photo2.jpg",PHOTO3="assets/photo3.jpg",PHOTO4="assets/photo4.jpg",PHOTO5="assets/photo5.jpg",PHOTO6="assets/photo6.jpg";
let TEAM=[
 {group:"Development Team",name:"Ghost",role:"Full-Stack Developer",photo:PHOTO1,bio:"Builds fast, secure websites and web apps from database to interface. Replace with a short bio.",skills:["React","Node.js","APIs"],links:{}},
 {group:"Development Team",name:"Pixel",role:"Full-Stack Developer",photo:PHOTO2,bio:"Builds complete web products, from clean interfaces to the servers behind them. Replace with a short bio.",skills:["JavaScript","React","Databases"],links:{}},
 {group:"Development Team",name:"Bolt",role:"Full-Stack Developer",photo:PHOTO3,bio:"Delivers reliable websites and apps end to end, with performance and security built in. Replace with a short bio.",skills:["Node.js","Security","Integrations"],links:{}},
 {group:"Marketing Team",name:"Kimi",role:"Digital Marketing Specialist",photo:PHOTO4,bio:"Plans campaigns and SEO that bring in qualified leads. Replace with a short bio.",skills:["SEO","Strategy","Analytics"],links:{}},
 {group:"Marketing Team",name:"Tirari",role:"Social Media Manager",photo:PHOTO5,bio:"Grows engaged audiences with consistent content and community care. Replace with a short bio.",skills:["Content","Instagram","Community"],links:{}},
 {group:"Marketing Team",name:"Zak",role:"Ads Specialist",photo:PHOTO6,bio:"Runs Facebook, Instagram and Google campaigns against clear cost targets. Replace with a short bio.",skills:["Meta Ads","Google Ads","CRO"],links:{}}
];
/* Each service is [name, description, iconKey]. The iconKey looks up ICONS below. */
let SERVICES={
 "Development":[
  ["Website Development","Fast, polished business sites that turn visitors into enquiries.","site"],
  ["Frontend Development","Responsive interfaces that feel smooth on every device.","code"],
  ["Backend Development","Reliable servers, databases and APIs that scale with you.","server"],
  ["E-commerce Websites","Online stores built to make buying simple and increase sales.","cart"],
  ["Landing Pages","Focused pages designed to convert campaign traffic.","flag"],
  ["Redesign & Optimization","Refresh outdated sites and cut load times.","gauge"],
  ["Custom Web Applications","Tools and portals built around how your business works.","grid"]],
 "Digital Marketing":[
  ["Social Media Marketing","Content and campaigns that grow an engaged audience.","people"],
  ["Facebook & Instagram Ads","Targeted ads that reach the right people at the right cost.","megaphone"],
  ["Social Media Management","Consistent posting, community replies and monthly reports.","calendar"],
  ["Paid Advertising Campaigns","Search and social campaigns managed against your target cost per lead.","target"],
  ["SEO Optimization","Rank higher for the searches your customers actually make.","search"],
  ["Content Strategy","A clear plan for content that attracts and persuades.","doc"],
  ["Conversion Rate Optimization","Test and improve pages so more visitors take action.","funnel"]]
};
/* Icons for the services grid. Each entry is the inner markup of a 24x24 SVG and
   inherits its colour from .ico via currentColor, so it follows the theme.
   Replace any of these strings with your own markup, or add a new key and point
   a service at it. A service whose key is missing falls back to showing the raw
   text, so a typo never leaves an empty box. */
const ICONS={
 site:'<rect x="2.5" y="4" width="19" height="16" rx="2"/><path d="M2.5 9h19"/><path d="M6 6.5h.01M8.5 6.5h.01"/>',
 code:'<path d="M9 7l-5 5 5 5"/><path d="M15 7l5 5-5 5"/>',
 server:'<rect x="3" y="4" width="18" height="6" rx="1.6"/><rect x="3" y="14" width="18" height="6" rx="1.6"/><path d="M7 7h.01M7 17h.01"/>',
 cart:'<circle cx="9.5" cy="20" r="1.2"/><circle cx="17.5" cy="20" r="1.2"/><path d="M2.5 3h2.3l2.4 11.6a1.6 1.6 0 0 0 1.6 1.3h8.8a1.6 1.6 0 0 0 1.6-1.3L21 7.5H6.2"/>',
 flag:'<path d="M5.5 21.5V3"/><path d="M5.5 4.5h11.5l-2.2 3.8 2.2 3.8H5.5"/>',
 gauge:'<path d="M3.5 17.5a8.5 8.5 0 1 1 17 0"/><path d="M12 17.5l4-5.2"/><circle cx="12" cy="17.5" r="1.2"/>',
 grid:'<rect x="3" y="3" width="7.6" height="7.6" rx="1.6"/><rect x="13.4" y="3" width="7.6" height="7.6" rx="1.6"/><rect x="3" y="13.4" width="7.6" height="7.6" rx="1.6"/><rect x="13.4" y="13.4" width="7.6" height="7.6" rx="1.6"/>',
 people:'<circle cx="9" cy="8" r="3.2"/><path d="M2.8 20a6.2 6.2 0 0 1 12.4 0"/><path d="M16.4 5.3a3.2 3.2 0 0 1 0 6.1"/><path d="M17.6 14.5a6.2 6.2 0 0 1 3.6 5.5"/>',
 megaphone:'<path d="M4 9.5v5a1.5 1.5 0 0 0 1.5 1.5h2L18 20V4L7.5 8H5.5A1.5 1.5 0 0 0 4 9.5z"/><path d="M18 9.2a4 4 0 0 1 0 5.6"/><path d="M7.5 16v4.5"/>',
 calendar:'<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17"/><path d="M8 3v4M16 3v4"/><path d="M7.5 14h2.5M14 14h2.5M7.5 17.5h2.5M14 17.5h2.5"/>',
 target:'<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.6"/><circle cx="12" cy="12" r="1"/>',
 search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.4 15.4L20.5 20.5"/>',
 doc:'<path d="M6 2.5h7.5L18.5 7.5V21a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1z"/><path d="M13.5 2.5V8h5"/><path d="M8.5 12.5h7M8.5 16h5"/>',
 funnel:'<path d="M3.5 4.5h17l-6.6 7.9v6.1l-3.8 2.3v-8.4z"/>'
};
/* "Selected projects" renders image-only cards. Any field left out is simply
   not drawn, which is why there are no names here. Add alt text for screen
   readers, or put name/desc/tech back on an entry to show them again. */
let PROJECTS=[
 {img:"assets/project-1.webp",alt:"Selected project 1"},
 {img:"assets/project-2.webp",alt:"Selected project 2"},
 {img:"assets/project-3.webp",alt:"Selected project 3"},
 {img:"assets/project-4.webp",alt:"Selected project 4"},
 {img:"assets/project-5.webp",alt:"Selected project 5"},
 {img:"assets/project-6.webp",alt:"Selected project 6"}
];
let WHY=[["Tailored solutions","Nothing off the shelf. Each project is built around your goals."],["One team, two skills","Development and marketing work together under one roof."],["Modern technology","Current tools that keep your site fast and secure."],["Data-driven marketing","Decisions come from numbers, not guesses."],["Clear communication","Regular updates in plain language."],["Measurable results","We agree on targets and report against them."]];
let STEPS=[["Discovery","We learn your business and goals."],["Strategy","We plan the right solution."],["Design","We create the visual experience."],["Development / Execution","We build the site or launch the campaign."],["Testing and Launch","We check everything before delivery."],["Optimization","We improve performance and results."]];
let TESTS=[["Sample testimonial text. Replace with real client feedback about working with your agency.","Client Name, Company"],["Sample testimonial text. Replace with real client feedback about the results you delivered.","Client Name, Company"],["Sample testimonial text. Replace with real client feedback about communication and process.","Client Name, Company"]];
/* Fallback only: the contact form posts to the backend at API_BASE when one is
   configured. Set FORM_ENDPOINT to use a third-party service (Formspree,
   Web3Forms) instead, or leave both empty to fall back to the visitor's email app. */
const FORM_ENDPOINT="";
/* ============ END EDIT BLOCK ============ */
