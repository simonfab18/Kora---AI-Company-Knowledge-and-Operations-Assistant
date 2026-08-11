# <!DOCTYPE html><html lang="en"><head>

# &#x20;   <meta charset="UTF-8">

# &#x20;   <meta name="viewport" content="width=device-width, initial-scale=1.0">

# &#x20;   <title>Synthetix | AI Operations \&amp; Knowledge Assistant</title>

# &#x20;   <script src="https://cdn.tailwindcss.com"></script>

# &#x20;   <script src="https://code.iconify.design/iconify-icon/1.0.7/iconify-icon.min.js"></script>

# &#x20;   <link rel="preconnect" href="https://fonts.googleapis.com">

# &#x20;   <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="">

# &#x20;   <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600\&amp;family=JetBrains+Mono\&amp;family=Outfit:wght@600\&amp;display=swap" rel="stylesheet">

# &#x20;   <style>

# &#x20;       @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600\&family=JetBrains+Mono\&family=Outfit:wght@600\&display=swap');

# 

# &#x20;       :root {

# &#x20;           --cubic: cubic-bezier(.16, 1, .3, 1);

# &#x20;           --glass-bg: linear-gradient(180deg, rgba(255, 255, 255, 0.09) 0%, rgba(255, 255, 255, 0.02) 100%);

# &#x20;           --glass-border: rgba(255, 255, 255, 0.10);

# &#x20;           --glass-highlight: 0 1px 0 rgba(255, 255, 255, 0.14);

# &#x20;       }

# 

# &#x20;       body {

# &#x20;           font-family: 'Inter', sans-serif;

# &#x20;           background-color: #050505;

# &#x20;           color: #FFFFFF;

# &#x20;           overflow-x: hidden;

# &#x20;       }

# 

# &#x20;       .font-outfit {

# &#x20;           font-family: 'Outfit', sans-serif;

# &#x20;           letter-spacing: -0.025em;

# &#x20;       }

# 

# &#x20;       .font-mono {

# &#x20;           font-family: 'JetBrains Mono', monospace;

# &#x20;       }

# 

# &#x20;       .grain-overlay {

# &#x20;           position: fixed;

# &#x20;           inset: 0;

# &#x20;           background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");

# &#x20;           opacity: 0.15;

# &#x20;           pointer-events: none;

# &#x20;           z-index: 50;

# &#x20;       }

# 

# &#x20;       .glass-panel {

# &#x20;           background: var(--glass-bg);

# &#x20;           backdrop-filter: blur(35px) saturate(150%);

# &#x20;           -webkit-backdrop-filter: blur(35px) saturate(150%);

# &#x20;           border: 1px solid var(--glass-border);

# &#x20;           box-shadow: var(--glass-highlight);

# &#x20;           transition: all 0.6s var(--cubic);

# &#x20;       }

# 

# &#x20;       .glass-panel:hover {

# &#x20;           border-color: rgba(255, 255, 255, 0.3);

# &#x20;           background: linear-gradient(180deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%);

# &#x20;           transform: translateY(-4px);

# &#x20;           box-shadow: 0 20px 40px -10px rgba(0,0,0,0.5), var(--glass-highlight);

# &#x20;       }

# 

# &#x20;       .transition-premium {

# &#x20;           transition: all 0.6s var(--cubic);

# &#x20;       }

# 

# &#x20;       .btn-primary {

# &#x20;           background: #FFFFFF;

# &#x20;           color: #050505;

# &#x20;           transition: all 0.3s var(--cubic);

# &#x20;       }

# 

# &#x20;       .btn-primary:hover {

# &#x20;           background: #E5E7EB;

# &#x20;           transform: translateY(-1px);

# &#x20;           box-shadow: 0 10px 20px -5px rgba(255, 255, 255, 0.2);

# &#x20;       }

# 

# &#x20;       .animate-float {

# &#x20;           animation: float 6s ease-in-out infinite;

# &#x20;       }

# 

# &#x20;       @keyframes float {

# &#x20;           0% { transform: translateY(0px); }

# &#x20;           50% { transform: translateY(-10px); }

# &#x20;           100% { transform: translateY(0px); }

# &#x20;       }

# 

# &#x20;       .scroll-reveal {

# &#x20;           opacity: 0;

# &#x20;           transform: translateY(30px);

# &#x20;           transition: all 0.8s var(--cubic);

# &#x20;       }

# 

# &#x20;       .scroll-reveal.reveal-active {

# &#x20;           opacity: 1;

# &#x20;           transform: translateY(0);

# &#x20;       }

# 

# &#x20;       \[data-reveal="slide-left"] {

# &#x20;           opacity: 0;

# &#x20;           transform: translateX(-40px);

# &#x20;           transition: all 0.8s var(--cubic);

# &#x20;       }

# 

# &#x20;       \[data-reveal="slide-right"] {

# &#x20;           opacity: 0;

# &#x20;           transform: translateX(40px);

# &#x20;           transition: all 0.8s var(--cubic);

# &#x20;       }

# 

# &#x20;       .reveal-active {

# &#x20;           opacity: 1 !important;

# &#x20;           transform: translate(0) !important;

# &#x20;       }

# 

# &#x20;       .glow-pulse {

# &#x20;           animation: glow-pulse 4s ease-in-out infinite;

# &#x20;       }

# 

# &#x20;       @keyframes glow-pulse {

# &#x20;           0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.1), var(--glass-highlight); }

# &#x20;           50% { box-shadow: 0 0 40px rgba(59, 130, 246, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.2); }

# &#x20;       }

# 

# &#x20;       .nav-link {

# &#x20;           color: #94A3B8;

# &#x20;           transition: color 0.3s var(--cubic);

# &#x20;       }

# 

# &#x20;       .nav-link:hover {

# &#x20;           color: #FFFFFF;

# &#x20;       }

# 

# &#x20;       .accordion-content {

# &#x20;           max-height: 0;

# &#x20;           overflow: hidden;

# &#x20;           transition: max-height 0.4s var(--cubic);

# &#x20;       }

# 

# &#x20;       .accordion-item:focus-within .accordion-content {

# &#x20;           max-height: 200px;

# &#x20;       }

# 

# &#x20;       .accordion-item:focus-within .chevron {

# &#x20;           transform: rotate(180deg);

# &#x20;       }

# &#x20;   </style>

# </head>

# <body>

# &#x20;   <div class="relative min-h-screen selection:bg-blue-500/30 selection:text-white" data-sd-id="1">

# &#x20;       <div class="grain-overlay" data-sd-id="2"></div>

# 

# &#x20;       <!-- Decorative Background Gradients -->

# &#x20;       <div class="fixed inset-0 overflow-hidden pointer-events-none z-0" data-sd-id="3">

# &#x20;           <div class="absolute top-\[-10%] left-\[-10%] w-\[40%] h-\[40%] bg-blue-500/10 blur-\[120px] rounded-full parallax-bg" data-speed="0.05" data-sd-id="4"></div>

# &#x20;           <div class="absolute bottom-\[-5%] right-\[-5%] w-\[30%] h-\[30%] bg-emerald-500/5 blur-\[100px] rounded-full parallax-bg" data-speed="-0.03" data-sd-id="5"></div>

# &#x20;       </div>

# 

# &#x20;       <!-- Navigation Bar -->

# &#x20;       <nav class="fixed top-0 left-0 right-0 z-\[100] px-6 py-4" data-sd-id="6">

# &#x20;           <div class="max-w-7xl mx-auto flex items-center justify-between" data-sd-id="7">

# &#x20;               <div class="flex items-center gap-2" data-sd-id="8">

# &#x20;                   <div class="w-10 h-10 glass-panel rounded-xl flex items-center justify-center" data-sd-id="9">

# &#x20;                       <iconify-icon icon="lucide:sparkles" class="text-blue-500 text-xl"></iconify-icon>

# &#x20;                   </div>

# &#x20;                   <span class="font-outfit text-2xl font-semibold" data-sd-id="10">Synthetix</span>

# &#x20;               </div>

# &#x20;               

# &#x20;               <div class="hidden md:flex items-center gap-8 glass-panel px-6 py-2.5 rounded-full" data-sd-id="11">

# &#x20;                   <a href="#features" id="nav-features" class="nav-link text-sm font-medium" data-sd-id="12">Features</a>

# &#x20;                   <a href="#use-cases" id="nav-use-cases" class="nav-link text-sm font-medium" data-sd-id="13">Use Cases</a>

# &#x20;                   <a href="#pricing" id="nav-pricing" class="nav-link text-sm font-medium" data-sd-id="14">Enterprise</a>

# &#x20;                   <a href="#faq" id="nav-faq" class="nav-link text-sm font-medium" data-sd-id="15">Support</a>

# &#x20;               </div>

# 

# &#x20;               <div class="flex items-center gap-4" data-sd-id="16">

# &#x20;                   <a href="#" id="nav-login" class="hidden md:block nav-link text-sm font-medium" data-sd-id="17">Login</a>

# &#x20;                   <a href="#" id="nav-cta-btn" class="btn-primary px-5 py-2.5 rounded-full text-sm font-semibold transition-premium" data-sd-id="18">Request Access</a>

# &#x20;               </div>

# &#x20;           </div>

# &#x20;       </nav>

# 

# &#x20;       <!-- Hero Section -->

# &#x20;       <section class="relative pt-40 pb-20 px-6 z-10" data-sd-id="19">

# &#x20;           <div class="max-w-4xl mx-auto text-center" data-sd-id="20">

# &#x20;               <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-panel border-white/5 text-\[11px] uppercase tracking-widest font-semibold mb-8 scroll-reveal" data-delay="100" data-sd-id="21">

# &#x20;                   <span class="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" data-sd-id="22"></span>

# &#x20;                   The New Standard for Enterprise Knowledge

# &#x20;               </div>

# &#x20;               <h1 class="font-outfit text-6xl md:text-8xl mb-8 leading-\[1.05] scroll-reveal" data-delay="200" data-sd-id="23">

# &#x20;                   Your company knowledge,<br><span class="text-slate-400" data-sd-id="24">instantly accessible.</span>

# &#x20;               </h1>

# &#x20;               <p class="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-12 scroll-reveal" data-delay="300" data-sd-id="25">

# &#x20;                   Synthetix connects to your Notion workspace, learns your SOPs, policies, and product docs to answer any operational question in seconds.

# &#x20;               </p>

# 

# &#x20;               <!-- Hero Mockup/UI -->

# &#x20;               <div class="relative max-w-3xl mx-auto mt-20 scroll-reveal" id="hero-mockup" data-delay="400" data-sd-id="26">

# &#x20;                   <div class="glass-panel rounded-3xl p-6 md:p-8 relative overflow-hidden glow-pulse" data-sd-id="27">

# &#x20;                       <div class="flex items-center gap-2 mb-8 border-b border-white/5 pb-4" data-sd-id="28">

# &#x20;                           <div class="w-3 h-3 rounded-full bg-rose-500/30" data-sd-id="29"></div>

# &#x20;                           <div class="w-3 h-3 rounded-full bg-emerald-500/30" data-sd-id="30"></div>

# &#x20;                           <div class="w-3 h-3 rounded-full bg-blue-500/30" data-sd-id="31"></div>

# &#x20;                           <div class="ml-4 px-4 py-1.5 glass-panel rounded-lg text-xs font-mono text-slate-400" data-sd-id="32">

# &#x20;                               help.notion.company/assistant

# &#x20;                           </div>

# &#x20;                       </div>

# 

# &#x20;                       <div class="space-y-6 text-left" data-sd-id="33">

# &#x20;                           <div class="flex gap-4" data-sd-id="34">

# &#x20;                               <div class="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center shrink-0" data-sd-id="35">

# &#x20;                                   <iconify-icon icon="lucide:user" class="text-sm"></iconify-icon>

# &#x20;                               </div>

# &#x20;                               <div class="glass-panel p-4 rounded-2xl rounded-tl-none" data-sd-id="36">

# &#x20;                                   <p class="text-sm text-white" data-sd-id="37">How do I request leave and who needs to approve it?</p>

# &#x20;                               </div>

# &#x20;                           </div>

# 

# &#x20;                           <div class="flex gap-4" data-sd-id="38">

# &#x20;                               <div class="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0" data-sd-id="39">

# &#x20;                                   <iconify-icon icon="lucide:sparkles" class="text-blue-500 text-sm"></iconify-icon>

# &#x20;                               </div>

# &#x20;                               <div class="space-y-4 flex-1" data-sd-id="40">

# &#x20;                                   <div class="glass-panel p-6 rounded-2xl rounded-tl-none" data-sd-id="41">

# &#x20;                                       <p class="text-sm leading-relaxed text-slate-200 mb-4" data-sd-id="42">

# &#x20;                                           <span id="typewriter-text">According to the <span class="text-blue-400 underline cursor-pointer" data-sd-id="43">Internal HR Policy (p.14)</span>, you can request leave via the BambooHR portal. For requests longer than 3 days, approval from your direct Department Head is required.</span> 

# &#x20;                                       </p>

# &#x20;                                       <div class="flex items-center gap-2 border-t border-white/5 pt-4" data-sd-id="44">

# &#x20;                                           <span class="text-\[10px] font-mono text-slate-500 uppercase" data-sd-id="45">Sources:</span>

# &#x20;                                           <div class="flex gap-2" data-sd-id="46">

# &#x20;                                               <span class="flex items-center gap-1 px-2 py-0.5 glass-panel rounded text-\[10px] font-mono text-blue-400" data-sd-id="47">

# &#x20;                                                   <iconify-icon icon="simple-icons:notion"></iconify-icon> HR Policies v2

# &#x20;                                               </span>

# &#x20;                                               <span class="flex items-center gap-1 px-2 py-0.5 glass-panel rounded text-\[10px] font-mono text-emerald-400" data-sd-id="48">

# &#x20;                                                   <iconify-icon icon="simple-icons:notion"></iconify-icon> Employee Handbook

# &#x20;                                               </span>

# &#x20;                                           </div>

# &#x20;                                       </div>

# &#x20;                                   </div>

# &#x20;                               </div>

# &#x20;                           </div>

# &#x20;                       </div>

# &#x20;                   </div>

# &#x20;                   

# &#x20;                   <!-- Decorative floating elements -->

# &#x20;                   <div class="absolute -top-12 -right-12 w-32 h-32 glass-panel rounded-full blur-2xl opacity-30 bg-blue-400 animate-float" data-sd-id="49"></div>

# &#x20;                   <div class="absolute -bottom-12 -left-12 w-48 h-48 glass-panel rounded-full blur-3xl opacity-20 bg-emerald-400 animate-float" style="animation-delay: -2s" data-sd-id="50"></div>

# &#x20;               </div>

# &#x20;           </div>

# &#x20;       </section>

# 

# &#x20;       <!-- Problem Section -->

# &#x20;       <section class="py-24 px-6 z-10" data-sd-id="51">

# &#x20;           <div class="max-w-7xl mx-auto" data-sd-id="52">

# &#x20;               <div class="grid lg:grid-cols-2 gap-20 items-center" data-sd-id="53">

# &#x20;                   <div data-sd-id="54">

# &#x20;                       <h2 class="font-outfit text-4xl md:text-5xl mb-6" data-sd-id="55">

# &#x20;                           Stop wasting 30% of your day <br><span class="text-slate-500" data-sd-id="56">searching for documentation.</span>

# &#x20;                       </h2>

# &#x20;                       <p class="text-slate-400 text-lg mb-10" data-sd-id="57">

# &#x20;                           Information silos and outdated docs kill velocity. Synthetix brings everything together into a unified conversational layer that understands your company's context.

# &#x20;                       </p>

# &#x20;                       <div class="space-y-4" data-sd-id="58">

# &#x20;                           <div class="flex items-center gap-4" data-sd-id="59">

# &#x20;                               <div class="w-10 h-10 glass-panel rounded-lg flex items-center justify-center shrink-0 text-rose-500" data-sd-id="60">

# &#x20;                                   <iconify-icon icon="lucide:x-circle" class="text-xl"></iconify-icon>

# &#x20;                               </div>

# &#x20;                               <span class="text-slate-300" data-sd-id="61">No more asking "Where is the link to..." in Slack.</span>

# &#x20;                           </div>

# &#x20;                           <div class="flex items-center gap-4" data-sd-id="62">

# &#x20;                               <div class="w-10 h-10 glass-panel rounded-lg flex items-center justify-center shrink-0 text-rose-500" data-sd-id="63">

# &#x20;                                   <iconify-icon icon="lucide:x-circle" class="text-xl"></iconify-icon>

# &#x20;                               </div>

# &#x20;                               <span class="text-slate-300" data-sd-id="64">Say goodbye to onboarding friction and repetitive questions.</span>

# &#x20;                           </div>

# &#x20;                       </div>

# &#x20;                   </div>

# &#x20;                   <div class="grid grid-cols-2 gap-4" data-sd-id="65">

# &#x20;                       <div class="glass-panel p-8 rounded-3xl" data-sd-id="66">

# &#x20;                           <div class="font-mono text-blue-400 text-4xl mb-4" data-sd-id="67">74%</div>

# &#x20;                           <p class="text-sm text-slate-400 leading-relaxed" data-sd-id="68">Reduction in internal support tickets for HR \&amp; IT teams.</p>

# &#x20;                       </div>

# &#x20;                       <div class="glass-panel p-8 rounded-3xl mt-8" data-sd-id="69">

# &#x20;                           <div class="font-mono text-emerald-400 text-4xl mb-4" data-sd-id="70">2hr</div>

# &#x20;                           <p class="text-sm text-slate-400 leading-relaxed" data-sd-id="71">Average time saved per employee every week searching for info.</p>

# &#x20;                       </div>

# &#x20;                   </div>

# &#x20;               </div>

# &#x20;           </div>

# &#x20;       </section>

# 

# &#x20;       <!-- Features Grid -->

# &#x20;       <section id="features" class="py-24 px-6 z-10" data-sd-id="72">

# &#x20;           <div class="max-w-7xl mx-auto" data-sd-id="73">

# &#x20;               <div class="text-center mb-16" data-sd-id="74">

# &#x20;                   <h2 class="font-outfit text-4xl md:text-5xl mb-4" data-sd-id="75">Engineered for Operations</h2>

# &#x20;                   <p class="text-slate-400" data-sd-id="76">Powerful features to scale your company intelligence.</p>

# &#x20;               </div>

# &#x20;               

# &#x20;               <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6" data-sd-id="77">

# &#x20;                   <div class="glass-panel p-8 rounded-3xl scroll-reveal" data-delay="100" data-sd-id="78">

# &#x20;                       <div class="w-12 h-12 glass-panel rounded-2xl flex items-center justify-center mb-6 text-blue-500" data-sd-id="79">

# &#x20;                           <iconify-icon icon="lucide:search" class="text-2xl"></iconify-icon>

# &#x20;                       </div>

# &#x20;                       <h3 class="text-xl font-semibold mb-3" data-sd-id="80">Semantic Search</h3>

# &#x20;                       <p class="text-slate-400 text-sm leading-relaxed" data-sd-id="81">Find answers even when you don't use the exact keywords. Our AI understands intent.</p>

# &#x20;                   </div>

# &#x20;                   

# &#x20;                   <div class="glass-panel p-8 rounded-3xl scroll-reveal" data-delay="200" data-sd-id="82">

# &#x20;                       <div class="w-12 h-12 glass-panel rounded-2xl flex items-center justify-center mb-6 text-emerald-500" data-sd-id="83">

# &#x20;                           <iconify-icon icon="lucide:shield-check" class="text-2xl"></iconify-icon>

# &#x20;                       </div>

# &#x20;                       <h3 class="text-xl font-semibold mb-3" data-sd-id="84">Verifiable Sources</h3>

# &#x20;                       <p class="text-slate-400 text-sm leading-relaxed" data-sd-id="85">Every answer includes deep-links to the original Notion pages for full transparency.</p>

# &#x20;                   </div>

# 

# &#x20;                   <div class="glass-panel p-8 rounded-3xl scroll-reveal" data-delay="300" data-sd-id="86">

# &#x20;                       <div class="w-12 h-12 glass-panel rounded-2xl flex items-center justify-center mb-6 text-rose-500" data-sd-id="87">

# &#x20;                           <iconify-icon icon="lucide:zap" class="text-2xl"></iconify-icon>

# &#x20;                       </div>

# &#x20;                       <h3 class="text-xl font-semibold mb-3" data-sd-id="88">Real-time Sync</h3>

# &#x20;                       <p class="text-slate-400 text-sm leading-relaxed" data-sd-id="89">Update a page in Notion, and Synthetix learns the changes instantly across the board.</p>

# &#x20;                   </div>

# 

# &#x20;                   <div class="glass-panel p-8 rounded-3xl scroll-reveal" data-delay="400" data-sd-id="90">

# &#x20;                       <div class="w-12 h-12 glass-panel rounded-2xl flex items-center justify-center mb-6 text-white" data-sd-id="91">

# &#x20;                           <iconify-icon icon="lucide:lock" class="text-2xl"></iconify-icon>

# &#x20;                       </div>

# &#x20;                       <h3 class="text-xl font-semibold mb-3" data-sd-id="92">Enterprise Privacy</h3>

# &#x20;                       <p class="text-slate-400 text-sm leading-relaxed" data-sd-id="93">SOC2 compliant. Your data is encrypted and never used for training foundation models.</p>

# &#x20;                   </div>

# &#x20;               </div>

# &#x20;           </div>

# &#x20;       </section>

# 

# &#x20;       <!-- Use Cases -->

# &#x20;       <section id="use-cases" class="py-24 px-6 z-10" data-sd-id="94">

# &#x20;           <div class="max-w-7xl mx-auto" data-sd-id="95">

# &#x20;               <div class="glass-panel rounded-\[2rem] overflow-hidden" data-sd-id="96">

# &#x20;                   <div class="grid lg:grid-cols-5 h-full" data-sd-id="97">

# &#x20;                       <div class="lg:col-span-2 p-12 lg:border-r border-white/5 bg-white/\[0.02]" data-sd-id="98">

# &#x20;                           <h3 class="font-outfit text-4xl mb-6" data-sd-id="99">The Knowledge Hub</h3>

# &#x20;                           <p class="text-slate-400 mb-8" data-sd-id="100">Synthetix acts as the neural network of your company. It doesn't just store info—it applies it.</p>

# &#x20;                           <ul class="space-y-6" data-sd-id="101">

# &#x20;                               <li class="flex gap-4" data-sd-id="102">

# &#x20;                                   <iconify-icon icon="lucide:check-circle-2" class="text-blue-500 text-xl"></iconify-icon>

# &#x20;                                   <div data-sd-id="103">

# &#x20;                                       <p class="font-medium" data-sd-id="104">HR \&amp; Policy Assistant</p>

# &#x20;                                       <p class="text-sm text-slate-500" data-sd-id="105">Answers about benefits, payroll, and conduct.</p>

# &#x20;                                   </div>

# &#x20;                               </li>

# &#x20;                               <li class="flex gap-4" data-sd-id="106">

# &#x20;                                   <iconify-icon icon="lucide:check-circle-2" class="text-blue-500 text-xl"></iconify-icon>

# &#x20;                                   <div data-sd-id="107">

# &#x20;                                       <p class="font-medium" data-sd-id="108">Developer Ops</p>

# &#x20;                                       <p class="text-sm text-slate-500" data-sd-id="109">Technical guides, deployment steps, and API docs.</p>

# &#x20;                                   </div>

# &#x20;                               </li>

# &#x20;                               <li class="flex gap-4" data-sd-id="110">

# &#x20;                                   <iconify-icon icon="lucide:check-circle-2" class="text-blue-500 text-xl"></iconify-icon>

# &#x20;                                   <div data-sd-id="111">

# &#x20;                                       <p class="font-medium" data-sd-id="112">Sales \&amp; Product Docs</p>

# &#x20;                                       <p class="text-sm text-slate-500" data-sd-id="113">Quick access to specs and pricing during calls.</p>

# &#x20;                                   </div>

# &#x20;                               </li>

# &#x20;                           </ul>

# &#x20;                       </div>

# &#x20;                       <div class="lg:col-span-3 p-12 flex flex-col justify-center items-center bg-\[#080808]" data-sd-id="114">

# &#x20;                           <div class="w-full space-y-4" data-sd-id="115">

# &#x20;                               <div class="glass-panel p-4 rounded-xl border-blue-500/20" data-sd-id="116">

# &#x20;                                   <div class="flex items-center gap-3 mb-2" data-sd-id="117">

# &#x20;                                       <div class="w-2 h-2 rounded-full bg-blue-500" data-sd-id="118"></div>

# &#x20;                                       <span class="text-\[10px] font-mono text-blue-500 uppercase" data-sd-id="119">Sales Team</span>

# &#x20;                                   </div>

# &#x20;                                   <p class="text-sm italic text-slate-400" data-sd-id="120">"What's our refund process for enterprise clients on annual plans?"</p>

# &#x20;                               </div>

# &#x20;                               <div class="glass-panel p-4 rounded-xl border-emerald-500/20 ml-12" data-sd-id="121">

# &#x20;                                   <div class="flex items-center gap-3 mb-2" data-sd-id="122">

# &#x20;                                       <div class="w-2 h-2 rounded-full bg-emerald-500" data-sd-id="123"></div>

# &#x20;                                       <span class="text-\[10px] font-mono text-emerald-500 uppercase" data-sd-id="124">Engineering</span>

# &#x20;                                   </div>

# &#x20;                                   <p class="text-sm italic text-slate-400" data-sd-id="125">"How do I deploy the staging backend using GitHub Actions?"</p>

# &#x20;                               </div>

# &#x20;                               <div class="glass-panel p-4 rounded-xl border-rose-500/20 ml-6" data-sd-id="126">

# &#x20;                                   <div class="flex items-center gap-3 mb-2" data-sd-id="127">

# &#x20;                                       <div class="w-2 h-2 rounded-full bg-rose-500" data-sd-id="128"></div>

# &#x20;                                       <span class="text-\[10px] font-mono text-rose-500 uppercase" data-sd-id="129">Product</span>

# &#x20;                                   </div>

# &#x20;                                   <p class="text-sm italic text-slate-400" data-sd-id="130">"Summarize the latest product decisions from the August planning meeting."</p>

# &#x20;                               </div>

# &#x20;                           </div>

# &#x20;                       </div>

# &#x20;                   </div>

# &#x20;               </div>

# &#x20;           </div>

# &#x20;       </section>

# 

# &#x20;       <!-- Testimonials -->

# &#x20;       <section class="py-24 px-6 z-10" data-sd-id="131">

# &#x20;           <div class="max-w-7xl mx-auto" data-sd-id="132">

# &#x20;               <div class="grid md:grid-cols-3 gap-8" data-sd-id="133">

# &#x20;                   <div class="glass-panel p-10 rounded-3xl" data-reveal="slide-left" data-sd-id="134">

# &#x20;                       <div class="flex gap-1 text-blue-500 mb-6" data-sd-id="135">

# &#x20;                           <iconify-icon icon="lucide:star"></iconify-icon>

# &#x20;                           <iconify-icon icon="lucide:star"></iconify-icon>

# &#x20;                           <iconify-icon icon="lucide:star"></iconify-icon>

# &#x20;                           <iconify-icon icon="lucide:star"></iconify-icon>

# &#x20;                           <iconify-icon icon="lucide:star"></iconify-icon>

# &#x20;                       </div>

# &#x20;                       <p class="text-slate-300 mb-8 italic text-lg leading-relaxed" data-sd-id="136">"Synthetix changed how our HR team operates. We went from answering 50 emails a day about policy to just 5. It's magic."</p>

# &#x20;                       <div class="flex items-center gap-4" data-sd-id="137">

# &#x20;                           <div class="w-12 h-12 rounded-full bg-slate-800" data-sd-id="138"></div>

# &#x20;                           <div data-sd-id="139">

# &#x20;                               <div class="font-medium" data-sd-id="140">Sarah Jenkins</div>

# &#x20;                               <div class="text-xs text-slate-500" data-sd-id="141">Head of People at Linear</div>

# &#x20;                           </div>

# &#x20;                       </div>

# &#x20;                   </div>

# &#x20;                   

# &#x20;                   <div class="glass-panel p-10 rounded-3xl md:translate-y-8" data-sd-id="142">

# &#x20;                       <div class="flex gap-1 text-blue-500 mb-6" data-sd-id="143">

# &#x20;                           <iconify-icon icon="lucide:star"></iconify-icon>

# &#x20;                           <iconify-icon icon="lucide:star"></iconify-icon>

# &#x20;                           <iconify-icon icon="lucide:star"></iconify-icon>

# &#x20;                           <iconify-icon icon="lucide:star"></iconify-icon>

# &#x20;                           <iconify-icon icon="lucide:star"></iconify-icon>

# &#x20;                       </div>

# &#x20;                       <p class="text-slate-300 mb-8 italic text-lg leading-relaxed" data-sd-id="144">"The source references are what sets this apart. We can always trust the output because it literally shows us the Notion page."</p>

# &#x20;                       <div class="flex items-center gap-4" data-sd-id="145">

# &#x20;                           <div class="w-12 h-12 rounded-full bg-slate-800" data-sd-id="146"></div>

# &#x20;                           <div data-sd-id="147">

# &#x20;                               <div class="font-medium" data-sd-id="148">Marcus Chen</div>

# &#x20;                               <div class="text-xs text-slate-500" data-sd-id="149">CTO at Framer</div>

# &#x20;                           </div>

# &#x20;                       </div>

# &#x20;                   </div>

# 

# &#x20;                   <div class="glass-panel p-10 rounded-3xl" data-reveal="slide-right" data-sd-id="150">

# &#x20;                       <div class="flex gap-1 text-blue-500 mb-6" data-sd-id="151">

# &#x20;                           <iconify-icon icon="lucide:star"></iconify-icon>

# &#x20;                           <iconify-icon icon="lucide:star"></iconify-icon>

# &#x20;                           <iconify-icon icon="lucide:star"></iconify-icon>

# &#x20;                           <iconify-icon icon="lucide:star"></iconify-icon>

# &#x20;                           <iconify-icon icon="lucide:star"></iconify-icon>

# &#x20;                       </div>

# &#x20;                       <p class="text-slate-300 mb-8 italic text-lg leading-relaxed" data-sd-id="152">"Onboarding used to take a week of human time. Now we just tell new hires to talk to Synthetix. Best investment this year."</p>

# &#x20;                       <div class="flex items-center gap-4" data-sd-id="153">

# &#x20;                           <div class="w-12 h-12 rounded-full bg-slate-800" data-sd-id="154"></div>

# &#x20;                           <div data-sd-id="155">

# &#x20;                               <div class="font-medium" data-sd-id="156">Elena Rossi</div>

# &#x20;                               <div class="text-xs text-slate-500" data-sd-id="157">Operations Director at Stripe</div>

# &#x20;                           </div>

# &#x20;                       </div>

# &#x20;                   </div>

# &#x20;               </div>

# &#x20;           </div>

# &#x20;       </section>

# 

# &#x20;       <!-- FAQ Section -->

# &#x20;       <section id="faq" class="py-24 px-6 z-10" data-sd-id="158">

# &#x20;           <div class="max-w-3xl mx-auto" data-sd-id="159">

# &#x20;               <h2 class="font-outfit text-4xl text-center mb-16" data-sd-id="160">Frequently Asked Questions</h2>

# &#x20;               <div class="space-y-4" data-sd-id="161">

# &#x20;                   <div class="accordion-item glass-panel rounded-2xl overflow-hidden" tabindex="0" data-sd-id="162">

# &#x20;                       <div class="px-8 py-6 flex justify-between items-center cursor-pointer hover:bg-white/5 transition-premium" data-sd-id="163">

# &#x20;                           <span class="font-medium" data-sd-id="164">How does it connect to Notion?</span>

# &#x20;                           <iconify-icon icon="lucide:chevron-down" class="chevron transition-premium"></iconify-icon>

# &#x20;                       </div>

# &#x20;                       <div class="accordion-content" data-sd-id="165">

# &#x20;                           <div class="px-8 pb-6 text-slate-400 text-sm" data-sd-id="166">

# &#x20;                               We use the official Notion API. You just authorize our integration and select the workspaces or specific pages you want Synthetix to index. It takes less than 2 minutes to set up.

# &#x20;                           </div>

# &#x20;                       </div>

# &#x20;                   </div>

# &#x20;                   <div class="accordion-item glass-panel rounded-2xl overflow-hidden" tabindex="0" data-sd-id="167">

# &#x20;                       <div class="px-8 py-6 flex justify-between items-center cursor-pointer hover:bg-white/5 transition-premium" data-sd-id="168">

# &#x20;                           <span class="font-medium" data-sd-id="169">Does it learn from private pages?</span>

# &#x20;                           <iconify-icon icon="lucide:chevron-down" class="chevron transition-premium"></iconify-icon>

# &#x20;                       </div>

# &#x20;                       <div class="accordion-content" data-sd-id="170">

# &#x20;                           <div class="px-8 pb-6 text-slate-400 text-sm" data-sd-id="171">

# &#x20;                               Synthetix only accesses pages that the authorized integration account has permission to view. We strictly respect Notion's internal permission structure and roles.

# &#x20;                           </div>

# &#x20;                       </div>

# &#x20;                   </div>

# &#x20;                   <div class="accordion-item glass-panel rounded-2xl overflow-hidden" tabindex="0" data-sd-id="172">

# &#x20;                       <div class="px-8 py-6 flex justify-between items-center cursor-pointer hover:bg-white/5 transition-premium" data-sd-id="173">

# &#x20;                           <span class="font-medium" data-sd-id="174">How accurate are the answers?</span>

# &#x20;                           <iconify-icon icon="lucide:chevron-down" class="chevron transition-premium"></iconify-icon>

# &#x20;                       </div>

# &#x20;                       <div class="accordion-content" data-sd-id="175">

# &#x20;                           <div class="px-8 pb-6 text-slate-400 text-sm" data-sd-id="176">

# &#x20;                               Very. We use advanced RAG (Retrieval-Augmented Generation) which forces the AI to base its answers strictly on the provided context. If it doesn't know, it will say so rather than halluncinate.

# &#x20;                           </div>

# &#x20;                       </div>

# &#x20;                   </div>

# &#x20;               </div>

# &#x20;           </div>

# &#x20;       </section>

# 

# &#x20;       <!-- Final CTA -->

# &#x20;       <section class="py-32 px-6 z-10 text-center" data-sd-id="177">

# &#x20;           <div class="max-w-4xl mx-auto glass-panel p-16 rounded-\[3rem] relative overflow-hidden" data-sd-id="178">

# &#x20;               <div class="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-\[100px] rounded-full" data-sd-id="179"></div>

# &#x20;               <h2 class="font-outfit text-5xl mb-8 relative z-10" data-sd-id="180">Ready to operationalize <br>your collective intelligence?</h2>

# &#x20;               <p class="text-slate-400 text-lg mb-10 relative z-10" data-sd-id="181">Join 400+ forward-thinking teams using Synthetix to move faster.</p>

# &#x20;               <div class="flex flex-col sm:flex-row gap-4 justify-center relative z-10" data-sd-id="182">

# &#x20;                   <a href="#" id="cta-start-now" class="btn-primary px-8 py-4 rounded-full font-semibold text-lg transition-premium" data-sd-id="183">Get Started for Free</a>

# &#x20;                   <a href="#" id="cta-demo" class="glass-panel px-8 py-4 rounded-full font-semibold text-lg transition-premium hover:bg-white/5" data-sd-id="184">Book a Demo</a>

# &#x20;               </div>

# &#x20;           </div>

# &#x20;       </section>

# 

# &#x20;       <!-- Footer -->

# &#x20;       <footer class="py-20 px-6 border-t border-white/5 z-10" data-sd-id="185">

# &#x20;           <div class="max-w-7xl mx-auto" data-sd-id="186">

# &#x20;               <div class="grid md:grid-cols-4 gap-12 mb-20" data-sd-id="187">

# &#x20;                   <div class="col-span-1 md:col-span-1" data-sd-id="188">

# &#x20;                       <div class="flex items-center gap-2 mb-6" data-sd-id="189">

# &#x20;                           <iconify-icon icon="lucide:sparkles" class="text-blue-500 text-2xl"></iconify-icon>

# &#x20;                           <span class="font-outfit text-xl font-semibold" data-sd-id="190">Synthetix</span>

# &#x20;                       </div>

# &#x20;                       <p class="text-sm text-slate-500 leading-relaxed" data-sd-id="191">

# &#x20;                           Making company knowledge conversational. Built for the modern workspace.

# &#x20;                       </p>

# &#x20;                   </div>

# &#x20;                   <div data-sd-id="192">

# &#x20;                       <h4 class="text-sm font-semibold mb-6" data-sd-id="193">Product</h4>

# &#x20;                       <ul class="space-y-4 text-sm text-slate-500" data-sd-id="194">

# &#x20;                           <li data-sd-id="195"><a href="#" id="footer-link-features" class="hover:text-white transition-colors" data-sd-id="196">Features</a></li>

# &#x20;                           <li data-sd-id="197"><a href="#" id="footer-link-integrations" class="hover:text-white transition-colors" data-sd-id="198">Integrations</a></li>

# &#x20;                           <li data-sd-id="199"><a href="#" id="footer-link-enterprise" class="hover:text-white transition-colors" data-sd-id="200">Enterprise</a></li>

# &#x20;                           <li data-sd-id="201"><a href="#" id="footer-link-roadmap" class="hover:text-white transition-colors" data-sd-id="202">Roadmap</a></li>

# &#x20;                       </ul>

# &#x20;                   </div>

# &#x20;                   <div data-sd-id="203">

# &#x20;                       <h4 class="text-sm font-semibold mb-6" data-sd-id="204">Resources</h4>

# &#x20;                       <ul class="space-y-4 text-sm text-slate-500" data-sd-id="205">

# &#x20;                           <li data-sd-id="206"><a href="#" id="footer-link-docs" class="hover:text-white transition-colors" data-sd-id="207">Documentation</a></li>

# &#x20;                           <li data-sd-id="208"><a href="#" id="footer-link-blog" class="hover:text-white transition-colors" data-sd-id="209">Blog</a></li>

# &#x20;                           <li data-sd-id="210"><a href="#" id="footer-link-guides" class="hover:text-white transition-colors" data-sd-id="211">Best Practices</a></li>

# &#x20;                           <li data-sd-id="212"><a href="#" id="footer-link-support" class="hover:text-white transition-colors" data-sd-id="213">Support Center</a></li>

# &#x20;                       </ul>

# &#x20;                   </div>

# &#x20;                   <div data-sd-id="214">

# &#x20;                       <h4 class="text-sm font-semibold mb-6" data-sd-id="215">Company</h4>

# &#x20;                       <ul class="space-y-4 text-sm text-slate-500" data-sd-id="216">

# &#x20;                           <li data-sd-id="217"><a href="#" id="footer-link-about" class="hover:text-white transition-colors" data-sd-id="218">About Us</a></li>

# &#x20;                           <li data-sd-id="219"><a href="#" id="footer-link-careers" class="hover:text-white transition-colors" data-sd-id="220">Careers</a></li>

# &#x20;                           <li data-sd-id="221"><a href="#" id="footer-link-privacy" class="hover:text-white transition-colors" data-sd-id="222">Privacy Policy</a></li>

# &#x20;                           <li data-sd-id="223"><a href="#" id="footer-link-terms" class="hover:text-white transition-colors" data-sd-id="224">Terms of Service</a></li>

# &#x20;                       </ul>

# &#x20;                   </div>

# &#x20;               </div>

# &#x20;               <div class="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-white/5 gap-4" data-sd-id="225">

# &#x20;                   <div class="text-xs text-slate-600 font-mono" data-sd-id="226">

# &#x20;                       © 2024 SYNTHETIX AI INC. ALL RIGHTS RESERVED.

# &#x20;                   </div>

# &#x20;                   <div class="flex gap-6" data-sd-id="227">

# &#x20;                       <a href="#" id="social-twitter" class="text-slate-600 hover:text-white transition-premium" data-sd-id="228"><iconify-icon icon="simple-icons:x" class="text-lg"></iconify-icon></a>

# &#x20;                       <a href="#" id="social-github" class="text-slate-600 hover:text-white transition-premium" data-sd-id="229"><iconify-icon icon="simple-icons:github" class="text-lg"></iconify-icon></a>

# &#x20;                       <a href="#" id="social-linkedin" class="text-slate-600 hover:text-white transition-premium" data-sd-id="230"><iconify-icon icon="simple-icons:linkedin" class="text-lg"></iconify-icon></a>

# &#x20;                   </div>

# &#x20;               </div>

# &#x20;           </div>

# &#x20;       </footer>

# &#x20;   </div>

# 

# <script>

# &#x20;       document.addEventListener('DOMContentLoaded', () => {

# &#x20;           const observerOptions = {

# &#x20;               threshold: 0.1,

# &#x20;               rootMargin: '0px 0px -50px 0px'

# &#x20;           };

# 

# &#x20;           const observer = new IntersectionObserver((entries) => {

# &#x20;               entries.forEach(entry => {

# &#x20;                   if (entry.isIntersecting) {

# &#x20;                       const delay = parseInt(entry.target.dataset.delay || 0);

# &#x20;                       setTimeout(() => {

# &#x20;                           entry.target.classList.add('reveal-active');

# &#x20;                           if (entry.target.id === 'hero-mockup') {

# &#x20;                               startTypewriter();

# &#x20;                           }

# &#x20;                       }, delay);

# &#x20;                       observer.unobserve(entry.target);

# &#x20;                   }

# &#x20;               });

# &#x20;           }, observerOptions);

# 

# &#x20;           document.querySelectorAll('.scroll-reveal, \[data-reveal]').forEach(el => observer.observe(el));

# 

# &#x20;           function startTypewriter() {

# &#x20;               const target = document.getElementById('typewriter-text');

# &#x20;               if (!target) return;

# &#x20;               const fullText = target.innerHTML;

# &#x20;               target.innerHTML = '';

# &#x20;               target.style.opacity = '1';

# &#x20;               

# &#x20;               let i = 0;

# &#x20;               const type = () => {

# &#x20;                   if (i <= fullText.length) {

# &#x20;                       target.innerHTML = fullText.substring(0, i) + '<span class="animate-pulse">|</span>';

# &#x20;                       i++;

# &#x20;                       setTimeout(type, 15);

# &#x20;                   } else {

# &#x20;                       target.innerHTML = fullText;

# &#x20;                   }

# &#x20;               };

# &#x20;               setTimeout(type, 500);

# &#x20;           }

# 

# &#x20;           window.addEventListener('scroll', () => {

# &#x20;               const scrolled = window.pageYOffset;

# &#x20;               document.querySelectorAll('.parallax-bg').forEach(bg => {

# &#x20;                   const speed = parseFloat(bg.dataset.speed || 0.1);

# &#x20;                   bg.style.transform = `translateY(${scrolled \* speed}px)`;

# &#x20;               });

# &#x20;           });

# &#x20;       });

# &#x20;   </script>

# </body></html>

# ```

# 

# Please reference this design and implement it into our codebase; Try to understand the structure, which part of our codebase is relevant and implement



