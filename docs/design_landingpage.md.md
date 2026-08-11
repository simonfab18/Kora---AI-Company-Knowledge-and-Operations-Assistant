


<!DOCTYPE html><html lang="en"><head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Synthetix | AI Operations &amp; Knowledge Assistant</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://code.iconify.design/iconify-icon/1.0.7/iconify-icon.min.js"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&amp;family=JetBrains+Mono&amp;family=Outfit:wght@600&amp;display=swap" rel="stylesheet">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono&family=Outfit:wght@600&display=swap');

        :root {
            --cubic: cubic-bezier(.16, 1, .3, 1);
            --glass-bg: linear-gradient(180deg, rgba(255, 255, 255, 0.09) 0%, rgba(255, 255, 255, 0.02) 100%);
            --glass-border: rgba(255, 255, 255, 0.10);
            --glass-highlight: 0 1px 0 rgba(255, 255, 255, 0.14);
        }

        body {
            font-family: 'Inter', sans-serif;
            background-color: #050505;
            color: #FFFFFF;
            overflow-x: hidden;
        }

        .font-outfit {
            font-family: 'Outfit', sans-serif;
            letter-spacing: -0.025em;
        }

        .font-mono {
            font-family: 'JetBrains Mono', monospace;
        }

        .grain-overlay {
            position: fixed;
            inset: 0;
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
            opacity: 0.15;
            pointer-events: none;
            z-index: 50;
        }

        .glass-panel {
            background: var(--glass-bg);
            backdrop-filter: blur(35px) saturate(150%);
            -webkit-backdrop-filter: blur(35px) saturate(150%);
            border: 1px solid var(--glass-border);
            box-shadow: var(--glass-highlight);
            transition: all 0.6s var(--cubic);
        }

        .glass-panel:hover {
            border-color: rgba(255, 255, 255, 0.3);
            background: linear-gradient(180deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%);
            transform: translateY(-4px);
            box-shadow: 0 20px 40px -10px rgba(0,0,0,0.5), var(--glass-highlight);
        }

        .transition-premium {
            transition: all 0.6s var(--cubic);
        }

        .btn-primary {
            background: #FFFFFF;
            color: #050505;
            transition: all 0.3s var(--cubic);
        }

        .btn-primary:hover {
            background: #E5E7EB;
            transform: translateY(-1px);
            box-shadow: 0 10px 20px -5px rgba(255, 255, 255, 0.2);
        }

        .animate-float {
            animation: float 6s ease-in-out infinite;
        }

        @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
            100% { transform: translateY(0px); }
        }

        .scroll-reveal {
            opacity: 0;
            transform: translateY(30px);
            transition: all 0.8s var(--cubic);
        }

        .scroll-reveal.reveal-active {
            opacity: 1;
            transform: translateY(0);
        }

        [data-reveal="slide-left"] {
            opacity: 0;
            transform: translateX(-40px);
            transition: all 0.8s var(--cubic);
        }

        [data-reveal="slide-right"] {
            opacity: 0;
            transform: translateX(40px);
            transition: all 0.8s var(--cubic);
        }

        .reveal-active {
            opacity: 1 !important;
            transform: translate(0) !important;
        }

        .glow-pulse {
            animation: glow-pulse 4s ease-in-out infinite;
        }

        @keyframes glow-pulse {
            0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.1), var(--glass-highlight); }
            50% { box-shadow: 0 0 40px rgba(59, 130, 246, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.2); }
        }

        .nav-link {
            color: #94A3B8;
            transition: color 0.3s var(--cubic);
        }

        .nav-link:hover {
            color: #FFFFFF;
        }

        .accordion-content {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.4s var(--cubic);
        }

        .accordion-item:focus-within .accordion-content {
            max-height: 200px;
        }

        .accordion-item:focus-within .chevron {
            transform: rotate(180deg);
        }
    </style>
</head>
<body>
    <div class="relative min-h-screen selection:bg-blue-500/30 selection:text-white" data-sd-id="1">
        <div class="grain-overlay" data-sd-id="2"></div>

        <!-- Decorative Background Gradients -->
        <div class="fixed inset-0 overflow-hidden pointer-events-none z-0" data-sd-id="3">
            <div class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full parallax-bg" data-speed="0.05" data-sd-id="4"></div>
            <div class="absolute bottom-[-5%] right-[-5%] w-[30%] h-[30%] bg-emerald-500/5 blur-[100px] rounded-full parallax-bg" data-speed="-0.03" data-sd-id="5"></div>
        </div>

        <!-- Navigation Bar -->
        <nav class="fixed top-0 left-0 right-0 z-[100] px-6 py-4" data-sd-id="6">
            <div class="max-w-7xl mx-auto flex items-center justify-between" data-sd-id="7">
                <div class="flex items-center gap-2" data-sd-id="8">
                    <div class="w-10 h-10 glass-panel rounded-xl flex items-center justify-center" data-sd-id="9">
                        <iconify-icon icon="lucide:sparkles" class="text-blue-500 text-xl"></iconify-icon>
                    </div>
                    <span class="font-outfit text-2xl font-semibold" data-sd-id="10">Synthetix</span>
                </div>
                
                <div class="hidden md:flex items-center gap-8 glass-panel px-6 py-2.5 rounded-full" data-sd-id="11">
                    <a href="#features" id="nav-features" class="nav-link text-sm font-medium" data-sd-id="12">Features</a>
                    <a href="#use-cases" id="nav-use-cases" class="nav-link text-sm font-medium" data-sd-id="13">Use Cases</a>
                    <a href="#pricing" id="nav-pricing" class="nav-link text-sm font-medium" data-sd-id="14">Enterprise</a>
                    <a href="#faq" id="nav-faq" class="nav-link text-sm font-medium" data-sd-id="15">Support</a>
                </div>

                <div class="flex items-center gap-4" data-sd-id="16">
                    <a href="#" id="nav-login" class="hidden md:block nav-link text-sm font-medium" data-sd-id="17">Login</a>
                    <a href="#" id="nav-cta-btn" class="btn-primary px-5 py-2.5 rounded-full text-sm font-semibold transition-premium" data-sd-id="18">Request Access</a>
                </div>
            </div>
        </nav>

        <!-- Hero Section -->
        <section class="relative pt-40 pb-20 px-6 z-10" data-sd-id="19">
            <div class="max-w-4xl mx-auto text-center" data-sd-id="20">
                <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-panel border-white/5 text-[11px] uppercase tracking-widest font-semibold mb-8 scroll-reveal" data-delay="100" data-sd-id="21">
                    <span class="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" data-sd-id="22"></span>
                    The New Standard for Enterprise Knowledge
                </div>
                <h1 class="font-outfit text-6xl md:text-8xl mb-8 leading-[1.05] scroll-reveal" data-delay="200" data-sd-id="23">
                    Your company knowledge,<br><span class="text-slate-400" data-sd-id="24">instantly accessible.</span>
                </h1>
                <p class="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-12 scroll-reveal" data-delay="300" data-sd-id="25">
                    Synthetix connects to your Notion workspace, learns your SOPs, policies, and product docs to answer any operational question in seconds.
                </p>

                <!-- Hero Mockup/UI -->
                <div class="relative max-w-3xl mx-auto mt-20 scroll-reveal" id="hero-mockup" data-delay="400" data-sd-id="26">
                    <div class="glass-panel rounded-3xl p-6 md:p-8 relative overflow-hidden glow-pulse" data-sd-id="27">
                        <div class="flex items-center gap-2 mb-8 border-b border-white/5 pb-4" data-sd-id="28">
                            <div class="w-3 h-3 rounded-full bg-rose-500/30" data-sd-id="29"></div>
                            <div class="w-3 h-3 rounded-full bg-emerald-500/30" data-sd-id="30"></div>
                            <div class="w-3 h-3 rounded-full bg-blue-500/30" data-sd-id="31"></div>
                            <div class="ml-4 px-4 py-1.5 glass-panel rounded-lg text-xs font-mono text-slate-400" data-sd-id="32">
                                help.notion.company/assistant
                            </div>
                        </div>

                        <div class="space-y-6 text-left" data-sd-id="33">
                            <div class="flex gap-4" data-sd-id="34">
                                <div class="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center shrink-0" data-sd-id="35">
                                    <iconify-icon icon="lucide:user" class="text-sm"></iconify-icon>
                                </div>
                                <div class="glass-panel p-4 rounded-2xl rounded-tl-none" data-sd-id="36">
                                    <p class="text-sm text-white" data-sd-id="37">How do I request leave and who needs to approve it?</p>
                                </div>
                            </div>

                            <div class="flex gap-4" data-sd-id="38">
                                <div class="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0" data-sd-id="39">
                                    <iconify-icon icon="lucide:sparkles" class="text-blue-500 text-sm"></iconify-icon>
                                </div>
                                <div class="space-y-4 flex-1" data-sd-id="40">
                                    <div class="glass-panel p-6 rounded-2xl rounded-tl-none" data-sd-id="41">
                                        <p class="text-sm leading-relaxed text-slate-200 mb-4" data-sd-id="42">
                                            <span id="typewriter-text">According to the <span class="text-blue-400 underline cursor-pointer" data-sd-id="43">Internal HR Policy (p.14)</span>, you can request leave via the BambooHR portal. For requests longer than 3 days, approval from your direct Department Head is required.</span> 
                                        </p>
                                        <div class="flex items-center gap-2 border-t border-white/5 pt-4" data-sd-id="44">
                                            <span class="text-[10px] font-mono text-slate-500 uppercase" data-sd-id="45">Sources:</span>
                                            <div class="flex gap-2" data-sd-id="46">
                                                <span class="flex items-center gap-1 px-2 py-0.5 glass-panel rounded text-[10px] font-mono text-blue-400" data-sd-id="47">
                                                    <iconify-icon icon="simple-icons:notion"></iconify-icon> HR Policies v2
                                                </span>
                                                <span class="flex items-center gap-1 px-2 py-0.5 glass-panel rounded text-[10px] font-mono text-emerald-400" data-sd-id="48">
                                                    <iconify-icon icon="simple-icons:notion"></iconify-icon> Employee Handbook
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Decorative floating elements -->
                    <div class="absolute -top-12 -right-12 w-32 h-32 glass-panel rounded-full blur-2xl opacity-30 bg-blue-400 animate-float" data-sd-id="49"></div>
                    <div class="absolute -bottom-12 -left-12 w-48 h-48 glass-panel rounded-full blur-3xl opacity-20 bg-emerald-400 animate-float" style="animation-delay: -2s" data-sd-id="50"></div>
                </div>
            </div>
        </section>

        <!-- Problem Section -->
        <section class="py-24 px-6 z-10" data-sd-id="51">
            <div class="max-w-7xl mx-auto" data-sd-id="52">
                <div class="grid lg:grid-cols-2 gap-20 items-center" data-sd-id="53">
                    <div data-sd-id="54">
                        <h2 class="font-outfit text-4xl md:text-5xl mb-6" data-sd-id="55">
                            Stop wasting 30% of your day <br><span class="text-slate-500" data-sd-id="56">searching for documentation.</span>
                        </h2>
                        <p class="text-slate-400 text-lg mb-10" data-sd-id="57">
                            Information silos and outdated docs kill velocity. Synthetix brings everything together into a unified conversational layer that understands your company's context.
                        </p>
                        <div class="space-y-4" data-sd-id="58">
                            <div class="flex items-center gap-4" data-sd-id="59">
                                <div class="w-10 h-10 glass-panel rounded-lg flex items-center justify-center shrink-0 text-rose-500" data-sd-id="60">
                                    <iconify-icon icon="lucide:x-circle" class="text-xl"></iconify-icon>
                                </div>
                                <span class="text-slate-300" data-sd-id="61">No more asking "Where is the link to..." in Slack.</span>
                            </div>
                            <div class="flex items-center gap-4" data-sd-id="62">
                                <div class="w-10 h-10 glass-panel rounded-lg flex items-center justify-center shrink-0 text-rose-500" data-sd-id="63">
                                    <iconify-icon icon="lucide:x-circle" class="text-xl"></iconify-icon>
                                </div>
                                <span class="text-slate-300" data-sd-id="64">Say goodbye to onboarding friction and repetitive questions.</span>
                            </div>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-4" data-sd-id="65">
                        <div class="glass-panel p-8 rounded-3xl" data-sd-id="66">
                            <div class="font-mono text-blue-400 text-4xl mb-4" data-sd-id="67">74%</div>
                            <p class="text-sm text-slate-400 leading-relaxed" data-sd-id="68">Reduction in internal support tickets for HR &amp; IT teams.</p>
                        </div>
                        <div class="glass-panel p-8 rounded-3xl mt-8" data-sd-id="69">
                            <div class="font-mono text-emerald-400 text-4xl mb-4" data-sd-id="70">2hr</div>
                            <p class="text-sm text-slate-400 leading-relaxed" data-sd-id="71">Average time saved per employee every week searching for info.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Features Grid -->
        <section id="features" class="py-24 px-6 z-10" data-sd-id="72">
            <div class="max-w-7xl mx-auto" data-sd-id="73">
                <div class="text-center mb-16" data-sd-id="74">
                    <h2 class="font-outfit text-4xl md:text-5xl mb-4" data-sd-id="75">Engineered for Operations</h2>
                    <p class="text-slate-400" data-sd-id="76">Powerful features to scale your company intelligence.</p>
                </div>
                
                <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6" data-sd-id="77">
                    <div class="glass-panel p-8 rounded-3xl scroll-reveal" data-delay="100" data-sd-id="78">
                        <div class="w-12 h-12 glass-panel rounded-2xl flex items-center justify-center mb-6 text-blue-500" data-sd-id="79">
                            <iconify-icon icon="lucide:search" class="text-2xl"></iconify-icon>
                        </div>
                        <h3 class="text-xl font-semibold mb-3" data-sd-id="80">Semantic Search</h3>
                        <p class="text-slate-400 text-sm leading-relaxed" data-sd-id="81">Find answers even when you don't use the exact keywords. Our AI understands intent.</p>
                    </div>
                    
                    <div class="glass-panel p-8 rounded-3xl scroll-reveal" data-delay="200" data-sd-id="82">
                        <div class="w-12 h-12 glass-panel rounded-2xl flex items-center justify-center mb-6 text-emerald-500" data-sd-id="83">
                            <iconify-icon icon="lucide:shield-check" class="text-2xl"></iconify-icon>
                        </div>
                        <h3 class="text-xl font-semibold mb-3" data-sd-id="84">Verifiable Sources</h3>
                        <p class="text-slate-400 text-sm leading-relaxed" data-sd-id="85">Every answer includes deep-links to the original Notion pages for full transparency.</p>
                    </div>

                    <div class="glass-panel p-8 rounded-3xl scroll-reveal" data-delay="300" data-sd-id="86">
                        <div class="w-12 h-12 glass-panel rounded-2xl flex items-center justify-center mb-6 text-rose-500" data-sd-id="87">
                            <iconify-icon icon="lucide:zap" class="text-2xl"></iconify-icon>
                        </div>
                        <h3 class="text-xl font-semibold mb-3" data-sd-id="88">Real-time Sync</h3>
                        <p class="text-slate-400 text-sm leading-relaxed" data-sd-id="89">Update a page in Notion, and Synthetix learns the changes instantly across the board.</p>
                    </div>

                    <div class="glass-panel p-8 rounded-3xl scroll-reveal" data-delay="400" data-sd-id="90">
                        <div class="w-12 h-12 glass-panel rounded-2xl flex items-center justify-center mb-6 text-white" data-sd-id="91">
                            <iconify-icon icon="lucide:lock" class="text-2xl"></iconify-icon>
                        </div>
                        <h3 class="text-xl font-semibold mb-3" data-sd-id="92">Enterprise Privacy</h3>
                        <p class="text-slate-400 text-sm leading-relaxed" data-sd-id="93">SOC2 compliant. Your data is encrypted and never used for training foundation models.</p>
                    </div>
                </div>
            </div>
        </section>

        <!-- Use Cases -->
        <section id="use-cases" class="py-24 px-6 z-10" data-sd-id="94">
            <div class="max-w-7xl mx-auto" data-sd-id="95">
                <div class="glass-panel rounded-[2rem] overflow-hidden" data-sd-id="96">
                    <div class="grid lg:grid-cols-5 h-full" data-sd-id="97">
                        <div class="lg:col-span-2 p-12 lg:border-r border-white/5 bg-white/[0.02]" data-sd-id="98">
                            <h3 class="font-outfit text-4xl mb-6" data-sd-id="99">The Knowledge Hub</h3>
                            <p class="text-slate-400 mb-8" data-sd-id="100">Synthetix acts as the neural network of your company. It doesn't just store info—it applies it.</p>
                            <ul class="space-y-6" data-sd-id="101">
                                <li class="flex gap-4" data-sd-id="102">
                                    <iconify-icon icon="lucide:check-circle-2" class="text-blue-500 text-xl"></iconify-icon>
                                    <div data-sd-id="103">
                                        <p class="font-medium" data-sd-id="104">HR &amp; Policy Assistant</p>
                                        <p class="text-sm text-slate-500" data-sd-id="105">Answers about benefits, payroll, and conduct.</p>
                                    </div>
                                </li>
                                <li class="flex gap-4" data-sd-id="106">
                                    <iconify-icon icon="lucide:check-circle-2" class="text-blue-500 text-xl"></iconify-icon>
                                    <div data-sd-id="107">
                                        <p class="font-medium" data-sd-id="108">Developer Ops</p>
                                        <p class="text-sm text-slate-500" data-sd-id="109">Technical guides, deployment steps, and API docs.</p>
                                    </div>
                                </li>
                                <li class="flex gap-4" data-sd-id="110">
                                    <iconify-icon icon="lucide:check-circle-2" class="text-blue-500 text-xl"></iconify-icon>
                                    <div data-sd-id="111">
                                        <p class="font-medium" data-sd-id="112">Sales &amp; Product Docs</p>
                                        <p class="text-sm text-slate-500" data-sd-id="113">Quick access to specs and pricing during calls.</p>
                                    </div>
                                </li>
                            </ul>
                        </div>
                        <div class="lg:col-span-3 p-12 flex flex-col justify-center items-center bg-[#080808]" data-sd-id="114">
                            <div class="w-full space-y-4" data-sd-id="115">
                                <div class="glass-panel p-4 rounded-xl border-blue-500/20" data-sd-id="116">
                                    <div class="flex items-center gap-3 mb-2" data-sd-id="117">
                                        <div class="w-2 h-2 rounded-full bg-blue-500" data-sd-id="118"></div>
                                        <span class="text-[10px] font-mono text-blue-500 uppercase" data-sd-id="119">Sales Team</span>
                                    </div>
                                    <p class="text-sm italic text-slate-400" data-sd-id="120">"What's our refund process for enterprise clients on annual plans?"</p>
                                </div>
                                <div class="glass-panel p-4 rounded-xl border-emerald-500/20 ml-12" data-sd-id="121">
                                    <div class="flex items-center gap-3 mb-2" data-sd-id="122">
                                        <div class="w-2 h-2 rounded-full bg-emerald-500" data-sd-id="123"></div>
                                        <span class="text-[10px] font-mono text-emerald-500 uppercase" data-sd-id="124">Engineering</span>
                                    </div>
                                    <p class="text-sm italic text-slate-400" data-sd-id="125">"How do I deploy the staging backend using GitHub Actions?"</p>
                                </div>
                                <div class="glass-panel p-4 rounded-xl border-rose-500/20 ml-6" data-sd-id="126">
                                    <div class="flex items-center gap-3 mb-2" data-sd-id="127">
                                        <div class="w-2 h-2 rounded-full bg-rose-500" data-sd-id="128"></div>
                                        <span class="text-[10px] font-mono text-rose-500 uppercase" data-sd-id="129">Product</span>
                                    </div>
                                    <p class="text-sm italic text-slate-400" data-sd-id="130">"Summarize the latest product decisions from the August planning meeting."</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Testimonials -->
        <section class="py-24 px-6 z-10" data-sd-id="131">
            <div class="max-w-7xl mx-auto" data-sd-id="132">
                <div class="grid md:grid-cols-3 gap-8" data-sd-id="133">
                    <div class="glass-panel p-10 rounded-3xl" data-reveal="slide-left" data-sd-id="134">
                        <div class="flex gap-1 text-blue-500 mb-6" data-sd-id="135">
                            <iconify-icon icon="lucide:star"></iconify-icon>
                            <iconify-icon icon="lucide:star"></iconify-icon>
                            <iconify-icon icon="lucide:star"></iconify-icon>
                            <iconify-icon icon="lucide:star"></iconify-icon>
                            <iconify-icon icon="lucide:star"></iconify-icon>
                        </div>
                        <p class="text-slate-300 mb-8 italic text-lg leading-relaxed" data-sd-id="136">"Synthetix changed how our HR team operates. We went from answering 50 emails a day about policy to just 5. It's magic."</p>
                        <div class="flex items-center gap-4" data-sd-id="137">
                            <div class="w-12 h-12 rounded-full bg-slate-800" data-sd-id="138"></div>
                            <div data-sd-id="139">
                                <div class="font-medium" data-sd-id="140">Sarah Jenkins</div>
                                <div class="text-xs text-slate-500" data-sd-id="141">Head of People at Linear</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="glass-panel p-10 rounded-3xl md:translate-y-8" data-sd-id="142">
                        <div class="flex gap-1 text-blue-500 mb-6" data-sd-id="143">
                            <iconify-icon icon="lucide:star"></iconify-icon>
                            <iconify-icon icon="lucide:star"></iconify-icon>
                            <iconify-icon icon="lucide:star"></iconify-icon>
                            <iconify-icon icon="lucide:star"></iconify-icon>
                            <iconify-icon icon="lucide:star"></iconify-icon>
                        </div>
                        <p class="text-slate-300 mb-8 italic text-lg leading-relaxed" data-sd-id="144">"The source references are what sets this apart. We can always trust the output because it literally shows us the Notion page."</p>
                        <div class="flex items-center gap-4" data-sd-id="145">
                            <div class="w-12 h-12 rounded-full bg-slate-800" data-sd-id="146"></div>
                            <div data-sd-id="147">
                                <div class="font-medium" data-sd-id="148">Marcus Chen</div>
                                <div class="text-xs text-slate-500" data-sd-id="149">CTO at Framer</div>
                            </div>
                        </div>
                    </div>

                    <div class="glass-panel p-10 rounded-3xl" data-reveal="slide-right" data-sd-id="150">
                        <div class="flex gap-1 text-blue-500 mb-6" data-sd-id="151">
                            <iconify-icon icon="lucide:star"></iconify-icon>
                            <iconify-icon icon="lucide:star"></iconify-icon>
                            <iconify-icon icon="lucide:star"></iconify-icon>
                            <iconify-icon icon="lucide:star"></iconify-icon>
                            <iconify-icon icon="lucide:star"></iconify-icon>
                        </div>
                        <p class="text-slate-300 mb-8 italic text-lg leading-relaxed" data-sd-id="152">"Onboarding used to take a week of human time. Now we just tell new hires to talk to Synthetix. Best investment this year."</p>
                        <div class="flex items-center gap-4" data-sd-id="153">
                            <div class="w-12 h-12 rounded-full bg-slate-800" data-sd-id="154"></div>
                            <div data-sd-id="155">
                                <div class="font-medium" data-sd-id="156">Elena Rossi</div>
                                <div class="text-xs text-slate-500" data-sd-id="157">Operations Director at Stripe</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- FAQ Section -->
        <section id="faq" class="py-24 px-6 z-10" data-sd-id="158">
            <div class="max-w-3xl mx-auto" data-sd-id="159">
                <h2 class="font-outfit text-4xl text-center mb-16" data-sd-id="160">Frequently Asked Questions</h2>
                <div class="space-y-4" data-sd-id="161">
                    <div class="accordion-item glass-panel rounded-2xl overflow-hidden" tabindex="0" data-sd-id="162">
                        <div class="px-8 py-6 flex justify-between items-center cursor-pointer hover:bg-white/5 transition-premium" data-sd-id="163">
                            <span class="font-medium" data-sd-id="164">How does it connect to Notion?</span>
                            <iconify-icon icon="lucide:chevron-down" class="chevron transition-premium"></iconify-icon>
                        </div>
                        <div class="accordion-content" data-sd-id="165">
                            <div class="px-8 pb-6 text-slate-400 text-sm" data-sd-id="166">
                                We use the official Notion API. You just authorize our integration and select the workspaces or specific pages you want Synthetix to index. It takes less than 2 minutes to set up.
                            </div>
                        </div>
                    </div>
                    <div class="accordion-item glass-panel rounded-2xl overflow-hidden" tabindex="0" data-sd-id="167">
                        <div class="px-8 py-6 flex justify-between items-center cursor-pointer hover:bg-white/5 transition-premium" data-sd-id="168">
                            <span class="font-medium" data-sd-id="169">Does it learn from private pages?</span>
                            <iconify-icon icon="lucide:chevron-down" class="chevron transition-premium"></iconify-icon>
                        </div>
                        <div class="accordion-content" data-sd-id="170">
                            <div class="px-8 pb-6 text-slate-400 text-sm" data-sd-id="171">
                                Synthetix only accesses pages that the authorized integration account has permission to view. We strictly respect Notion's internal permission structure and roles.
                            </div>
                        </div>
                    </div>
                    <div class="accordion-item glass-panel rounded-2xl overflow-hidden" tabindex="0" data-sd-id="172">
                        <div class="px-8 py-6 flex justify-between items-center cursor-pointer hover:bg-white/5 transition-premium" data-sd-id="173">
                            <span class="font-medium" data-sd-id="174">How accurate are the answers?</span>
                            <iconify-icon icon="lucide:chevron-down" class="chevron transition-premium"></iconify-icon>
                        </div>
                        <div class="accordion-content" data-sd-id="175">
                            <div class="px-8 pb-6 text-slate-400 text-sm" data-sd-id="176">
                                Very. We use advanced RAG (Retrieval-Augmented Generation) which forces the AI to base its answers strictly on the provided context. If it doesn't know, it will say so rather than halluncinate.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Final CTA -->
        <section class="py-32 px-6 z-10 text-center" data-sd-id="177">
            <div class="max-w-4xl mx-auto glass-panel p-16 rounded-[3rem] relative overflow-hidden" data-sd-id="178">
                <div class="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full" data-sd-id="179"></div>
                <h2 class="font-outfit text-5xl mb-8 relative z-10" data-sd-id="180">Ready to operationalize <br>your collective intelligence?</h2>
                <p class="text-slate-400 text-lg mb-10 relative z-10" data-sd-id="181">Join 400+ forward-thinking teams using Synthetix to move faster.</p>
                <div class="flex flex-col sm:flex-row gap-4 justify-center relative z-10" data-sd-id="182">
                    <a href="#" id="cta-start-now" class="btn-primary px-8 py-4 rounded-full font-semibold text-lg transition-premium" data-sd-id="183">Get Started for Free</a>
                    <a href="#" id="cta-demo" class="glass-panel px-8 py-4 rounded-full font-semibold text-lg transition-premium hover:bg-white/5" data-sd-id="184">Book a Demo</a>
                </div>
            </div>
        </section>

        <!-- Footer -->
        <footer class="py-20 px-6 border-t border-white/5 z-10" data-sd-id="185">
            <div class="max-w-7xl mx-auto" data-sd-id="186">
                <div class="grid md:grid-cols-4 gap-12 mb-20" data-sd-id="187">
                    <div class="col-span-1 md:col-span-1" data-sd-id="188">
                        <div class="flex items-center gap-2 mb-6" data-sd-id="189">
                            <iconify-icon icon="lucide:sparkles" class="text-blue-500 text-2xl"></iconify-icon>
                            <span class="font-outfit text-xl font-semibold" data-sd-id="190">Synthetix</span>
                        </div>
                        <p class="text-sm text-slate-500 leading-relaxed" data-sd-id="191">
                            Making company knowledge conversational. Built for the modern workspace.
                        </p>
                    </div>
                    <div data-sd-id="192">
                        <h4 class="text-sm font-semibold mb-6" data-sd-id="193">Product</h4>
                        <ul class="space-y-4 text-sm text-slate-500" data-sd-id="194">
                            <li data-sd-id="195"><a href="#" id="footer-link-features" class="hover:text-white transition-colors" data-sd-id="196">Features</a></li>
                            <li data-sd-id="197"><a href="#" id="footer-link-integrations" class="hover:text-white transition-colors" data-sd-id="198">Integrations</a></li>
                            <li data-sd-id="199"><a href="#" id="footer-link-enterprise" class="hover:text-white transition-colors" data-sd-id="200">Enterprise</a></li>
                            <li data-sd-id="201"><a href="#" id="footer-link-roadmap" class="hover:text-white transition-colors" data-sd-id="202">Roadmap</a></li>
                        </ul>
                    </div>
                    <div data-sd-id="203">
                        <h4 class="text-sm font-semibold mb-6" data-sd-id="204">Resources</h4>
                        <ul class="space-y-4 text-sm text-slate-500" data-sd-id="205">
                            <li data-sd-id="206"><a href="#" id="footer-link-docs" class="hover:text-white transition-colors" data-sd-id="207">Documentation</a></li>
                            <li data-sd-id="208"><a href="#" id="footer-link-blog" class="hover:text-white transition-colors" data-sd-id="209">Blog</a></li>
                            <li data-sd-id="210"><a href="#" id="footer-link-guides" class="hover:text-white transition-colors" data-sd-id="211">Best Practices</a></li>
                            <li data-sd-id="212"><a href="#" id="footer-link-support" class="hover:text-white transition-colors" data-sd-id="213">Support Center</a></li>
                        </ul>
                    </div>
                    <div data-sd-id="214">
                        <h4 class="text-sm font-semibold mb-6" data-sd-id="215">Company</h4>
                        <ul class="space-y-4 text-sm text-slate-500" data-sd-id="216">
                            <li data-sd-id="217"><a href="#" id="footer-link-about" class="hover:text-white transition-colors" data-sd-id="218">About Us</a></li>
                            <li data-sd-id="219"><a href="#" id="footer-link-careers" class="hover:text-white transition-colors" data-sd-id="220">Careers</a></li>
                            <li data-sd-id="221"><a href="#" id="footer-link-privacy" class="hover:text-white transition-colors" data-sd-id="222">Privacy Policy</a></li>
                            <li data-sd-id="223"><a href="#" id="footer-link-terms" class="hover:text-white transition-colors" data-sd-id="224">Terms of Service</a></li>
                        </ul>
                    </div>
                </div>
                <div class="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-white/5 gap-4" data-sd-id="225">
                    <div class="text-xs text-slate-600 font-mono" data-sd-id="226">
                        © 2024 SYNTHETIX AI INC. ALL RIGHTS RESERVED.
                    </div>
                    <div class="flex gap-6" data-sd-id="227">
                        <a href="#" id="social-twitter" class="text-slate-600 hover:text-white transition-premium" data-sd-id="228"><iconify-icon icon="simple-icons:x" class="text-lg"></iconify-icon></a>
                        <a href="#" id="social-github" class="text-slate-600 hover:text-white transition-premium" data-sd-id="229"><iconify-icon icon="simple-icons:github" class="text-lg"></iconify-icon></a>
                        <a href="#" id="social-linkedin" class="text-slate-600 hover:text-white transition-premium" data-sd-id="230"><iconify-icon icon="simple-icons:linkedin" class="text-lg"></iconify-icon></a>
                    </div>
                </div>
            </div>
        </footer>
    </div>

<script>
        document.addEventListener('DOMContentLoaded', () => {
            const observerOptions = {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            };

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const delay = parseInt(entry.target.dataset.delay || 0);
                        setTimeout(() => {
                            entry.target.classList.add('reveal-active');
                            if (entry.target.id === 'hero-mockup') {
                                startTypewriter();
                            }
                        }, delay);
                        observer.unobserve(entry.target);
                    }
                });
            }, observerOptions);

            document.querySelectorAll('.scroll-reveal, [data-reveal]').forEach(el => observer.observe(el));

            function startTypewriter() {
                const target = document.getElementById('typewriter-text');
                if (!target) return;
                const fullText = target.innerHTML;
                target.innerHTML = '';
                target.style.opacity = '1';
                
                let i = 0;
                const type = () => {
                    if (i <= fullText.length) {
                        target.innerHTML = fullText.substring(0, i) + '<span class="animate-pulse">|</span>';
                        i++;
                        setTimeout(type, 15);
                    } else {
                        target.innerHTML = fullText;
                    }
                };
                setTimeout(type, 500);
            }

            window.addEventListener('scroll', () => {
                const scrolled = window.pageYOffset;
                document.querySelectorAll('.parallax-bg').forEach(bg => {
                    const speed = parseFloat(bg.dataset.speed || 0.1);
                    bg.style.transform = `translateY(${scrolled * speed}px)`;
                });
            });
        });
    </script>
</body></html>
```

Please reference this design and implement it into our codebase; Try to understand the structure, which part of our codebase is relevant and implement
