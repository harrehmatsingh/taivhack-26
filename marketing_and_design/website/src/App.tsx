import {
  Monitor,
  BarChart3,
  Zap,
  Shield,
  Wrench,
  MapPin,
  TrendingUp,
  Users,
  ArrowRight,
  Check,
  Star,
  Menu,
  X,
  ChevronRight,
  Play,
} from "lucide-react";
import { useState } from "react";

/* ─── Navbar ─── */
function Navbar() {
  const [open, setOpen] = useState(false);
  const links = ["Features", "How It Works", "Pricing", "Testimonials"];

  return (
    <nav className="fixed top-0 z-50 w-full bg-white/80 backdrop-blur-lg border-b border-surface-200/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <a href="#" className="flex items-center gap-2 text-xl font-bold text-surface-900">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-accent-500">
            <Monitor className="h-4.5 w-4.5 text-white" />
          </div>
          ScreenPulse
        </a>

        <div className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a
              key={l}
              href={`#${l.toLowerCase().replace(/ /g, "-")}`}
              className="text-sm font-medium text-surface-700 transition hover:text-brand-600"
            >
              {l}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <a href="#pricing" className="text-sm font-medium text-surface-700 transition hover:text-brand-600">
            Log in
          </a>
          <a
            href="#pricing"
            className="rounded-full bg-gradient-to-r from-brand-600 to-accent-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition hover:shadow-brand-500/40 hover:brightness-110"
          >
            Get Started Free
          </a>
        </div>

        <button className="md:hidden text-surface-700" onClick={() => setOpen(!open)}>
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-surface-200 bg-white px-6 pb-4 md:hidden">
          {links.map((l) => (
            <a
              key={l}
              href={`#${l.toLowerCase().replace(/ /g, "-")}`}
              className="block py-2 text-sm font-medium text-surface-700"
              onClick={() => setOpen(false)}
            >
              {l}
            </a>
          ))}
          <a
            href="#pricing"
            className="mt-2 block rounded-full bg-gradient-to-r from-brand-600 to-accent-600 px-5 py-2.5 text-center text-sm font-semibold text-white"
            onClick={() => setOpen(false)}
          >
            Get Started Free
          </a>
        </div>
      )}
    </nav>
  );
}

/* ─── Hero ─── */
function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
      {/* background blobs */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-brand-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -top-20 right-0 h-[500px] w-[500px] rounded-full bg-accent-400/15 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6 text-center">
        <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-700">
          <Zap className="h-4 w-4" />
          Now with AI-powered ad optimization
        </div>

        <h1 className="mx-auto max-w-4xl text-5xl font-extrabold leading-tight tracking-tight text-surface-950 md:text-7xl md:leading-[1.08]">
          Turn every screen into a{" "}
          <span className="bg-gradient-to-r from-brand-600 to-accent-500 bg-clip-text text-transparent">
            revenue engine
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-surface-700 md:text-xl">
          ScreenPulse is the all-in-one platform for managing digital signage across bars,
          restaurants, and venues. Smart scheduling, real-time fleet management, and automated
          technician dispatch — all from a single dashboard.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href="#pricing"
            className="group flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-600 to-accent-600 px-8 py-3.5 text-base font-semibold text-white shadow-xl shadow-brand-500/25 transition hover:shadow-brand-500/40 hover:brightness-110"
          >
            Start Free Trial
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </a>
          <a
            href="#how-it-works"
            className="flex items-center gap-2 rounded-full border border-surface-200 bg-white px-8 py-3.5 text-base font-semibold text-surface-800 shadow-sm transition hover:border-surface-300 hover:shadow-md"
          >
            <Play className="h-4 w-4 text-brand-600" />
            See how it works
          </a>
        </div>

        {/* Dashboard mockup */}
        <div className="mx-auto mt-16 max-w-5xl">
          <div className="rounded-2xl border border-surface-200 bg-white p-2 shadow-2xl shadow-surface-900/10">
            <div className="rounded-xl bg-gradient-to-br from-surface-900 to-surface-800 p-6 md:p-10">
              <div className="grid gap-4 md:grid-cols-3">
                <DashboardCard
                  label="Revenue Today"
                  value="$12,847"
                  change="+23%"
                  icon={<TrendingUp className="h-5 w-5 text-emerald-400" />}
                />
                <DashboardCard
                  label="Active Screens"
                  value="1,284"
                  change="99.2% uptime"
                  icon={<Monitor className="h-5 w-5 text-brand-400" />}
                />
                <DashboardCard
                  label="Ads Scheduled"
                  value="3,491"
                  change="Today"
                  icon={<BarChart3 className="h-5 w-5 text-accent-400" />}
                />
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-4">
                {["Main Hall", "Bar Area", "Patio", "VIP Lounge"].map((area, i) => (
                  <div key={area} className="rounded-lg bg-white/5 p-4 text-left">
                    <p className="text-xs text-surface-200/60 uppercase tracking-wider">{area}</p>
                    <div className="mt-2 flex items-end gap-1">
                      {[40, 65, 80, 55, 90, 70, 85].map((h, j) => (
                        <div
                          key={j}
                          className="w-full rounded-sm"
                          style={{
                            height: `${h * 0.5}px`,
                            background: `linear-gradient(to top, ${i % 2 === 0 ? "#3b82f6" : "#8b5cf6"}, ${i % 2 === 0 ? "#60a5fa" : "#a78bfa"})`,
                            opacity: 0.6 + j * 0.05,
                          }}
                        />
                      ))}
                    </div>
                    <p className="mt-2 text-sm font-semibold text-white">
                      ${(2400 + i * 800).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Social proof strip */}
        <div className="mt-16">
          <p className="text-sm font-medium uppercase tracking-wider text-surface-700/50">
            Trusted by 500+ venues across North America
          </p>
          <div className="mx-auto mt-6 flex flex-wrap items-center justify-center gap-x-12 gap-y-4 opacity-40">
            {["The Tipsy Crow", "BrewDog", "Dave & Buster's", "TopGolf", "Main Event", "Lucky Strike"].map(
              (name) => (
                <span key={name} className="text-lg font-bold text-surface-900 whitespace-nowrap">
                  {name}
                </span>
              )
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function DashboardCard({
  label,
  value,
  change,
  icon,
}: {
  label: string;
  value: string;
  change: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-lg bg-white/5 p-4 text-left backdrop-blur">
      <div className="flex items-center justify-between">
        <span className="text-xs text-surface-200/60 uppercase tracking-wider">{label}</span>
        {icon}
      </div>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
      <p className="mt-1 text-sm text-emerald-400">{change}</p>
    </div>
  );
}

/* ─── Features ─── */
const features = [
  {
    icon: <BarChart3 className="h-6 w-6" />,
    title: "Smart Ad Scheduling",
    desc: "AI-powered scheduling across every screen in your venue — main hall, bar, patio. Maximize ad revenue with intelligent time-slot optimization and decay-aware pricing.",
  },
  {
    icon: <Monitor className="h-6 w-6" />,
    title: "Fleet Management",
    desc: "Monitor every screen in real-time. Track device status, firmware versions, and geographic locations. Geo-fenced alerts ensure you never miss a downtime event.",
  },
  {
    icon: <Wrench className="h-6 w-6" />,
    title: "Auto Technician Dispatch",
    desc: "When a screen goes down, our system automatically routes the nearest technician with the shortest path — minimizing downtime and maximizing uptime.",
  },
  {
    icon: <TrendingUp className="h-6 w-6" />,
    title: "Revenue Optimization",
    desc: "Sophisticated decay models, area multipliers, and advertiser diversity scoring ensure every time-slot generates peak revenue for your venue.",
  },
  {
    icon: <Shield className="h-6 w-6" />,
    title: "Placement Controls",
    desc: "Granular placement rules let advertisers and venues control exactly where ads appear. Ban certain locations, set exclusivity zones, and respect brand safety.",
  },
  {
    icon: <MapPin className="h-6 w-6" />,
    title: "Location Intelligence",
    desc: "Haversine-based geospatial queries find devices in any radius. Cluster screens by proximity, plan service routes, and optimize coverage across your network.",
  },
];

function Features() {
  return (
    <section id="features" className="py-24 bg-surface-50">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">Features</p>
          <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-surface-950 md:text-5xl">
            Everything you need to run
            <br className="hidden md:block" /> your screen network
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-surface-700">
            From scheduling ads to dispatching repair crews, ScreenPulse handles the full lifecycle
            of venue-based digital signage.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-surface-200 bg-white p-8 transition hover:border-brand-200 hover:shadow-lg hover:shadow-brand-500/5"
            >
              <div className="inline-flex rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 p-3 text-white shadow-lg shadow-brand-500/25">
                {f.icon}
              </div>
              <h3 className="mt-5 text-xl font-bold text-surface-900">{f.title}</h3>
              <p className="mt-2 leading-relaxed text-surface-700">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── How It Works ─── */
const steps = [
  {
    step: "01",
    title: "Connect Your Screens",
    desc: "Register your venue's screens in under 5 minutes. Our fleet manager auto-detects device type, firmware, and location.",
    icon: <Monitor className="h-8 w-8" />,
  },
  {
    step: "02",
    title: "Schedule & Optimize",
    desc: "Upload your ad inventory and let our scheduling engine build the revenue-maximizing schedule — factoring in decay, multipliers, and placement rules.",
    icon: <BarChart3 className="h-8 w-8" />,
  },
  {
    step: "03",
    title: "Sit Back & Earn",
    desc: "Revenue flows in while our platform handles uptime monitoring, automatic technician dispatch, and real-time analytics. You focus on your venue.",
    icon: <TrendingUp className="h-8 w-8" />,
  },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">How It Works</p>
          <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-surface-950 md:text-5xl">
            Up and running in minutes
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-surface-700">
            Three simple steps to transform your venue screens into a revenue powerhouse.
          </p>
        </div>

        <div className="mt-16 grid gap-12 md:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.step} className="relative text-center">
              {i < steps.length - 1 && (
                <div className="absolute top-12 left-1/2 hidden w-full md:block">
                  <ChevronRight className="mx-auto h-6 w-6 translate-x-24 text-surface-200" />
                </div>
              )}
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 text-white shadow-xl shadow-brand-500/20">
                {s.icon}
              </div>
              <p className="mt-6 text-sm font-bold uppercase tracking-wider text-brand-500">
                Step {s.step}
              </p>
              <h3 className="mt-2 text-2xl font-bold text-surface-900">{s.title}</h3>
              <p className="mt-3 leading-relaxed text-surface-700">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Stats ─── */
const stats = [
  { value: "500+", label: "Venues Served" },
  { value: "12K+", label: "Screens Managed" },
  { value: "99.7%", label: "Uptime SLA" },
  { value: "$48M+", label: "Ad Revenue Generated" },
];

function Stats() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-brand-600 to-accent-600 py-20">
      <div className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA4KSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgZmlsbD0idXJsKCNnKSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIvPjwvc3ZnPg==')] opacity-50" />
      <div className="relative mx-auto grid max-w-7xl gap-8 px-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <p className="text-5xl font-extrabold text-white">{s.value}</p>
            <p className="mt-2 text-lg font-medium text-white/70">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── Testimonials ─── */
const testimonials = [
  {
    quote:
      "ScreenPulse tripled our screen ad revenue within the first quarter. The scheduling optimizer is insanely smart — we went from manually placing ads to full autopilot.",
    name: "Sarah Chen",
    role: "GM, The Rustic Tap",
    stars: 5,
  },
  {
    quote:
      "We manage 200+ screens across 15 locations. Before ScreenPulse, a broken screen meant lost revenue for days. Now a tech is dispatched automatically within the hour.",
    name: "Marcus Williams",
    role: "VP Operations, BrewHaus Group",
    stars: 5,
  },
  {
    quote:
      "The advertiser diversity scoring is genius. Our sponsors love that their ads aren't competing with each other in the same time slot. Higher satisfaction, longer contracts.",
    name: "Jamie Rodriguez",
    role: "Ad Sales Director, VenueNet",
    stars: 5,
  },
];

function Testimonials() {
  return (
    <section id="testimonials" className="bg-surface-50 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">Testimonials</p>
          <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-surface-950 md:text-5xl">
            Loved by venue operators
          </h2>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="flex flex-col rounded-2xl border border-surface-200 bg-white p-8 shadow-sm"
            >
              <div className="flex gap-0.5">
                {Array.from({ length: t.stars }).map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <blockquote className="mt-4 flex-1 leading-relaxed text-surface-700">
                "{t.quote}"
              </blockquote>
              <div className="mt-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-accent-500 text-sm font-bold text-white">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-surface-900">{t.name}</p>
                  <p className="text-sm text-surface-700">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Pricing ─── */
const plans = [
  {
    name: "Starter",
    price: "$99",
    period: "/mo",
    desc: "Perfect for single-location venues getting started with digital signage.",
    features: [
      "Up to 10 screens",
      "Basic ad scheduling",
      "Fleet monitoring dashboard",
      "Email support",
      "Monthly reports",
    ],
    cta: "Start Free Trial",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$299",
    period: "/mo",
    desc: "For growing venues that want to maximize ad revenue and uptime.",
    features: [
      "Up to 100 screens",
      "AI-powered schedule optimization",
      "Auto technician dispatch",
      "Revenue decay modeling",
      "Real-time analytics",
      "Priority support",
    ],
    cta: "Start Free Trial",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    desc: "Multi-location chains and franchise networks with advanced needs.",
    features: [
      "Unlimited screens",
      "Multi-venue management",
      "Custom placement rules",
      "Dedicated account manager",
      "API access & integrations",
      "SLA guarantee",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
];

function Pricing() {
  return (
    <section id="pricing" className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">Pricing</p>
          <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-surface-950 md:text-5xl">
            Plans that scale with you
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-surface-700">
            Start free, upgrade when you're ready. No hidden fees, no long-term contracts.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative flex flex-col rounded-2xl border p-8 ${
                p.highlighted
                  ? "border-brand-500 bg-white shadow-xl shadow-brand-500/10 ring-1 ring-brand-500"
                  : "border-surface-200 bg-white"
              }`}
            >
              {p.highlighted && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-brand-600 to-accent-600 px-4 py-1 text-xs font-bold uppercase tracking-wider text-white">
                  Most Popular
                </div>
              )}
              <h3 className="text-xl font-bold text-surface-900">{p.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-5xl font-extrabold text-surface-950">{p.price}</span>
                {p.period && <span className="text-lg text-surface-700">{p.period}</span>}
              </div>
              <p className="mt-3 text-surface-700">{p.desc}</p>
              <ul className="mt-8 flex-1 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-surface-700">
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-brand-500" />
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="#"
                className={`mt-8 block rounded-full py-3 text-center text-sm font-semibold transition ${
                  p.highlighted
                    ? "bg-gradient-to-r from-brand-600 to-accent-600 text-white shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 hover:brightness-110"
                    : "border border-surface-200 bg-white text-surface-800 hover:border-surface-300 hover:shadow-md"
                }`}
              >
                {p.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── CTA ─── */
function CTA() {
  return (
    <section className="relative overflow-hidden bg-surface-950 py-24">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-brand-500/20 blur-3xl" />
      <div className="relative mx-auto max-w-3xl px-6 text-center">
        <h2 className="text-4xl font-extrabold tracking-tight text-white md:text-5xl">
          Ready to maximize your venue revenue?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-surface-200/70">
          Join 500+ venues already using ScreenPulse to turn idle screens into revenue generators.
          Start your free trial today — no credit card required.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href="#pricing"
            className="group flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-accent-500 px-8 py-3.5 text-base font-semibold text-white shadow-xl shadow-brand-500/30 transition hover:shadow-brand-500/50 hover:brightness-110"
          >
            Get Started Free
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </a>
          <a
            href="#"
            className="flex items-center gap-2 rounded-full border border-white/20 px-8 py-3.5 text-base font-semibold text-white transition hover:bg-white/10"
          >
            <Users className="h-4 w-4" />
            Talk to Sales
          </a>
        </div>
      </div>
    </section>
  );
}

/* ─── Footer ─── */
function Footer() {
  return (
    <footer className="border-t border-surface-200 bg-white py-12">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <a href="#" className="flex items-center gap-2 text-lg font-bold text-surface-900">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-accent-500">
                <Monitor className="h-3.5 w-3.5 text-white" />
              </div>
              ScreenPulse
            </a>
            <p className="mt-3 text-sm leading-relaxed text-surface-700">
              The all-in-one platform for venue digital signage management, ad scheduling, and
              revenue optimization.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-surface-900">Product</h4>
            <ul className="mt-4 space-y-2 text-sm text-surface-700">
              <li><a href="#features" className="transition hover:text-brand-600">Features</a></li>
              <li><a href="#pricing" className="transition hover:text-brand-600">Pricing</a></li>
              <li><a href="#" className="transition hover:text-brand-600">API Docs</a></li>
              <li><a href="#" className="transition hover:text-brand-600">Changelog</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-surface-900">Company</h4>
            <ul className="mt-4 space-y-2 text-sm text-surface-700">
              <li><a href="#" className="transition hover:text-brand-600">About</a></li>
              <li><a href="#" className="transition hover:text-brand-600">Blog</a></li>
              <li><a href="#" className="transition hover:text-brand-600">Careers</a></li>
              <li><a href="#" className="transition hover:text-brand-600">Contact</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-surface-900">Legal</h4>
            <ul className="mt-4 space-y-2 text-sm text-surface-700">
              <li><a href="#" className="transition hover:text-brand-600">Privacy Policy</a></li>
              <li><a href="#" className="transition hover:text-brand-600">Terms of Service</a></li>
              <li><a href="#" className="transition hover:text-brand-600">Cookie Policy</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-surface-200 pt-8 text-center text-sm text-surface-700">
          &copy; {new Date().getFullYear()} ScreenPulse Inc. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

/* ─── App ─── */
export default function App() {
  return (
    <div className="min-h-screen bg-white text-surface-800 font-sans antialiased">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Stats />
      <Testimonials />
      <Pricing />
      <CTA />
      <Footer />
    </div>
  );
}
