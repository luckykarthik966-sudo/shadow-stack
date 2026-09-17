import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  Bell,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
  Command,
  Cpu,
  Gauge,
  Gavel,
  Grid2X2,
  Heart,
  Info,
  Layers3,
  LockKeyhole,
  Menu,
  Minus,
  Play,
  Plus,
  Radar,
  Search,
  ShieldCheck,
  Sparkles,
  TimerReset,
  Trophy,
  UserRound,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const palette = {
  ice: "#c7cbea",
  mist: "#9aa0c8",
  lavender: "#737ba5",
  slate: "#515a82",
  navy: "#353d60",
  ink: "#1d243d",
  black: "#0a0e1a",
};

type Auction = {
  id: string;
  title: string;
  category: string;
  subtitle: string;
  current: number;
  next: number;
  bids: number;
  timeLeft: string;
  ending: string;
  image: string;
  color: string;
  featured?: boolean;
  estimate: string;
};

type Bid = {
  id: string;
  bidder: string;
  amount: number;
  time: string;
  state: "accepted" | "leading" | "rejected";
};

const auctions: Auction[] = [
  {
    id: "nocturne-07",
    title: "Nocturne / 07",
    category: "Digital art",
    subtitle: "A generative study in blue hour and memory.",
    current: 2840,
    next: 2950,
    bids: 38,
    timeLeft: "02 : 14 : 09",
    ending: "Ends in 2h 14m",
    estimate: "$2.6k — $4.1k",
    image: "https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&w=1200&q=88",
    color: "#737ba5",
    featured: true,
  },
  {
    id: "studio-arc",
    title: "Studio Arc / 02",
    category: "Collectible design",
    subtitle: "Hand-finished aluminum, one of one.",
    current: 1120,
    next: 1180,
    bids: 19,
    timeLeft: "05 : 41 : 32",
    ending: "Ends in 5h 41m",
    estimate: "$900 — $1.5k",
    image: "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=1200&q=88",
    color: "#9aa0c8",
  },
  {
    id: "mizu-1984",
    title: "Mizu 1984",
    category: "Timepieces",
    subtitle: "A quiet classic with a very loud provenance.",
    current: 3980,
    next: 4100,
    bids: 62,
    timeLeft: "01 : 08 : 44",
    ending: "Ends in 1h 08m",
    estimate: "$3.5k — $5.2k",
    image: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=1200&q=88",
    color: "#515a82",
  },
  {
    id: "field-note-21",
    title: "Field Note / 21",
    category: "Objects & curiosities",
    subtitle: "A tactile artifact for a slower kind of future.",
    current: 760,
    next: 820,
    bids: 12,
    timeLeft: "12 : 26 : 18",
    ending: "Ends in 12h 26m",
    estimate: "$600 — $950",
    image: "https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=1200&q=88",
    color: "#353d60",
  },
];

const seedBids: Bid[] = [
  { id: "b1", bidder: "mira•••92", amount: 2840, time: "just now", state: "leading" },
  { id: "b2", bidder: "arthur•••7", amount: 2730, time: "24 sec ago", state: "accepted" },
  { id: "b3", bidder: "ren•••18", amount: 2620, time: "1 min ago", state: "accepted" },
  { id: "b4", bidder: "sol•••41", amount: 2510, time: "2 min ago", state: "accepted" },
  { id: "b5", bidder: "elena•••08", amount: 2400, time: "3 min ago", state: "accepted" },
];

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3 select-none">
      <div className="relative grid h-9 w-9 place-items-center rounded-xl border border-[#9aa0c8]/35 bg-[#353d60] shadow-[0_0_24px_rgba(154,160,200,.2)]">
        <span className="absolute h-4 w-4 rounded-full border-2 border-[#c7cbea]" />
        <span className="absolute h-1.5 w-1.5 rounded-full bg-[#c7cbea]" />
        <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-[#9aa0c8]" />
      </div>
      {!compact && <span className="text-[15px] font-extrabold tracking-[-.04em] text-[#f6f7fb]">wise<span className="text-[#9aa0c8]">money</span></span>}
    </div>
  );
}

function Header({ user, onNavigate }: { user?: string; onNavigate: (path: string) => void }) {
  return (
    <header className="sticky top-0 z-40 border-b border-[#353d60]/60 bg-[#0a0e1a]/80 backdrop-blur-xl">
      <div className="container flex h-[76px] items-center justify-between gap-6">
        <button onClick={() => onNavigate("/")} aria-label="Go home"><Logo /></button>
        <nav className="hidden items-center gap-7 text-[12px] font-semibold text-[#aeb5d5] md:flex">
          <button className="transition-colors hover:text-[#f6f7fb]" onClick={() => onNavigate("/market")}>Explore</button>
          <button className="transition-colors hover:text-[#f6f7fb]" onClick={() => onNavigate("/lab")}>Concurrency lab</button>
          <button className="transition-colors hover:text-[#f6f7fb]" onClick={() => onNavigate("/account")}>How it works</button>
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-[#353d60] bg-[#11182a]/70 px-3 py-2 text-[11px] text-[#aeb5d5] lg:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-[#c7cbea] shadow-[0_0_10px_#c7cbea]" /> Live system
          </div>
          <button className="hidden rounded-full p-2 text-[#aeb5d5] transition-colors hover:bg-[#1d243d] hover:text-white sm:block" aria-label="Notifications"><Bell size={17} /></button>
          <button onClick={() => onNavigate(user ? "/account" : "/register")} className="group flex items-center gap-2 rounded-full border border-[#737ba5]/60 bg-[#c7cbea] px-3 py-2 text-[11px] font-extrabold text-[#0a0e1a] transition-all hover:bg-white active:scale-[.97] sm:px-4">
            <UserRound size={14} /> <span className="hidden sm:inline">{user ? user : "Join Wise Money"}</span>
          </button>
          <button className="rounded-full p-2 text-[#aeb5d5] md:hidden" aria-label="Menu"><Menu size={18} /></button>
        </div>
      </div>
    </header>
  );
}

function CookieBar({ onAccept }: { onAccept: () => void }) {
  return (
    <div className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-[680px] -translate-x-1/2 rounded-2xl border border-[#515a82]/70 bg-[#11182a]/95 p-3 shadow-2xl backdrop-blur-xl sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#353d60]"><ShieldCheck size={16} className="text-[#c7cbea]" /></div>
          <p className="m-0 max-w-[410px] text-[11px] leading-5 text-[#aeb5d5]">We use essential cookies to keep bids secure and remember your preferences. No third-party tracking.</p>
        </div>
        <div className="flex shrink-0 items-center gap-2 pl-11 sm:pl-0">
          <button className="rounded-full border border-[#515a82] px-3 py-2 text-[10px] font-bold text-[#aeb5d5] hover:text-white">Preferences</button>
          <button onClick={onAccept} className="rounded-full bg-[#c7cbea] px-4 py-2 text-[10px] font-extrabold text-[#0a0e1a] hover:bg-white active:scale-[.97]">Accept cookies</button>
        </div>
      </div>
    </div>
  );
}

function AgeGate({ onConfirm }: { onConfirm: () => void }) {
  const [age, setAge] = useState(false);
  const [terms, setTerms] = useState(false);
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-[#060913]/85 p-4 backdrop-blur-md">
      <div className="noise glow w-full max-w-[470px] rounded-[28px] border border-[#737ba5]/55 bg-[#11182a] p-6 sm:p-8">
        <div className="mb-8 flex items-center justify-between"><Logo compact /><span className="font-mono text-[10px] uppercase tracking-[.22em] text-[#737ba5]">access protocol 01</span></div>
        <div className="mb-6 grid h-16 w-16 place-items-center rounded-2xl bg-[#353d60] text-[#c7cbea]"><LockKeyhole size={27} /></div>
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[.22em] text-[#9aa0c8]">Before you enter</p>
        <h2 className="mb-3 text-3xl font-extrabold tracking-[-.05em] text-white">Wise money is a <span className="gradient-text">21+ floor.</span></h2>
        <p className="mb-7 text-sm leading-6 text-[#aeb5d5]">Auctions on Wise Money are intended for adults 21 and over. Confirm your age and agree to our responsible participation guidelines to continue.</p>
        <label className="mb-3 flex cursor-pointer items-center gap-3 rounded-xl border border-[#353d60] bg-[#0a0e1a]/60 p-3.5 text-xs text-[#e2e4f3] transition-colors hover:border-[#737ba5]">
          <input type="checkbox" checked={age} onChange={(e) => setAge(e.target.checked)} className="h-4 w-4 accent-[#c7cbea]" /> I confirm I am 21 years or older.
        </label>
        <label className="mb-7 flex cursor-pointer items-center gap-3 rounded-xl border border-[#353d60] bg-[#0a0e1a]/60 p-3.5 text-xs text-[#e2e4f3] transition-colors hover:border-[#737ba5]">
          <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} className="h-4 w-4 accent-[#c7cbea]" /> I agree to the Wise Money participation rules.
        </label>
        <button disabled={!age || !terms} onClick={onConfirm} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#c7cbea] py-3.5 text-xs font-extrabold text-[#0a0e1a] transition-all hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 active:scale-[.98]">Enter Wise Money <ChevronRight size={16} /></button>
        <p className="mt-4 text-center text-[10px] text-[#737ba5]">This gate is a demo control for the experience.</p>
      </div>
    </div>
  );
}

function LandingPage({ onNavigate, user }: { onNavigate: (path: string) => void; user?: string }) {
  return (
    <div className="min-h-screen overflow-hidden bg-[#0a0e1a] text-[#f6f7fb]">
      <Header user={user} onNavigate={onNavigate} />
      <main>
        <section className="relative isolate min-h-[650px] overflow-hidden border-b border-[#353d60]/50">
          <div className="hero-grid absolute inset-0 -z-10 opacity-60" />
          <div className="absolute -right-[12%] top-[12%] -z-10 h-[480px] w-[480px] rounded-full bg-[#515a82]/20 blur-[100px]" />
          <div className="container grid min-h-[650px] items-center gap-12 py-16 lg:grid-cols-[1fr_520px] lg:py-20">
            <div className="max-w-[660px]">
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#515a82] bg-[#11182a]/65 px-3 py-2 font-mono text-[10px] uppercase tracking-[.16em] text-[#c7cbea]"><span className="pulse-ring h-2 w-2 rounded-full bg-[#c7cbea]" /> Live auctions, smarter</div>
              <h1 className="mb-7 text-[clamp(3.5rem,8vw,7.5rem)] font-extrabold leading-[.86] tracking-[-.09em]">Bid with<br /><span className="gradient-text">conviction.</span></h1>
              <p className="mb-9 max-w-[490px] text-base leading-7 text-[#aeb5d5] sm:text-lg">The considered auction floor for objects with a point of view. Transparent by design. Fast by nature. <span className="text-[#f6f7fb]">Every bid, exactly where it belongs.</span></p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <button onClick={() => onNavigate("/market")} className="group flex items-center justify-center gap-3 rounded-xl bg-[#c7cbea] px-5 py-3.5 text-xs font-extrabold text-[#0a0e1a] shadow-[0_10px_35px_rgba(199,203,234,.16)] transition-all hover:bg-white active:scale-[.98]">Explore the floor <ArrowUpRight size={16} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></button>
                <button onClick={() => onNavigate("/lab")} className="flex items-center justify-center gap-2 rounded-xl border border-[#515a82] px-5 py-3.5 text-xs font-bold text-[#e2e4f3] transition-colors hover:border-[#9aa0c8] hover:bg-[#1d243d]"><Play size={14} className="fill-current text-[#c7cbea]" /> See the concurrency lab</button>
              </div>
              <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-[#353d60]/70 pt-5 font-mono text-[10px] uppercase tracking-[.12em] text-[#737ba5]"><span><strong className="text-[#c7cbea]">01</strong> Verified sellers</span><span><strong className="text-[#c7cbea]">04</strong> live lots</span><span><strong className="text-[#c7cbea]">99.9%</strong> settlement integrity</span></div>
            </div>
            <div className="relative hidden lg:block">
              <div className="absolute -inset-10 rounded-full bg-[#737ba5]/15 blur-[90px]" />
              <div className="relative overflow-hidden rounded-[30px] border border-[#737ba5]/60 bg-[#11182a] p-3 shadow-[0_30px_90px_rgba(0,0,0,.35)] float-slow">
                <div className="relative h-[500px] overflow-hidden rounded-[22px]">
                  <img src={auctions[0].image} alt="Abstract blue artwork in the Nocturne auction" className="h-full w-full object-cover grayscale-[.1]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e1a] via-transparent to-[#0a0e1a]/10" />
                  <div className="absolute left-5 right-5 top-5 flex items-center justify-between"><span className="rounded-full border border-[#c7cbea]/50 bg-[#0a0e1a]/60 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[.16em] text-[#f6f7fb]">featured / 01</span><span className="rounded-full bg-[#c7cbea] px-3 py-1.5 font-mono text-[9px] uppercase tracking-[.16em] text-[#0a0e1a]">live</span></div>
                  <div className="absolute bottom-5 left-5 right-5"><div className="mb-1 font-mono text-[10px] uppercase tracking-[.16em] text-[#c7cbea]">digital art</div><div className="flex items-end justify-between gap-4"><div><h3 className="text-2xl font-extrabold tracking-[-.06em]">Nocturne / 07</h3><p className="mt-1 text-xs text-[#c7cbea]/80">by S. Kuroda</p></div><div className="text-right"><div className="font-mono text-[10px] uppercase text-[#aeb5d5]">current bid</div><div className="text-xl font-extrabold text-[#c7cbea]">$2,840</div></div></div></div>
                </div>
              </div>
              <div className="absolute -bottom-5 -left-9 flex items-center gap-3 rounded-2xl border border-[#515a82] bg-[#11182a]/95 px-4 py-3 shadow-xl backdrop-blur"><div className="grid h-9 w-9 place-items-center rounded-xl bg-[#353d60] text-[#c7cbea]"><Zap size={16} /></div><div><div className="font-mono text-[9px] uppercase tracking-[.12em] text-[#737ba5]">serialization</div><div className="text-xs font-bold text-[#f6f7fb]">Bid accepted · 4ms</div></div></div>
            </div>
          </div>
        </section>

        <section className="container border-b border-[#353d60]/60 py-14">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mb-2 font-mono text-[10px] uppercase tracking-[.2em] text-[#737ba5]">The current floor</p><h2 className="text-3xl font-extrabold tracking-[-.06em] sm:text-4xl">Objects worth <span className="text-[#9aa0c8]">leaning in for.</span></h2></div><button onClick={() => onNavigate("/market")} className="flex items-center gap-2 self-start text-xs font-bold text-[#c7cbea] hover:text-white sm:self-auto">View all lots <ArrowUpRight size={15} /></button></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">{auctions.map((item, index) => <AuctionCard key={item.id} item={item} onOpen={() => onNavigate(`/auction/${item.id}`)} featured={index === 0} />)}</div>
        </section>

        <section className="container grid gap-4 py-16 md:grid-cols-3">
          {[{ icon: LockKeyhole, title: "Proof over promises", body: "Every bid is serialized, timestamped, and visible. No ghosts. No gaps. No guesswork." }, { icon: Radar, title: "Signal in real time", body: "Price changes move through the room in milliseconds, without refreshing or polling." }, { icon: Trophy, title: "Win the right way", body: "A clear floor, a fair close, and one considered object finding its next home." }].map((feature) => <div key={feature.title} className="rounded-2xl border border-[#353d60] bg-[#11182a]/55 p-6 transition-colors hover:border-[#737ba5]"><feature.icon className="mb-8 text-[#9aa0c8]" size={21} /><h3 className="mb-2 text-base font-extrabold tracking-[-.03em]">{feature.title}</h3><p className="text-sm leading-6 text-[#8f97bc]">{feature.body}</p></div>)}
        </section>
      </main>
      <Footer onNavigate={onNavigate} />
    </div>
  );
}

function AuctionCard({ item, onOpen, featured = false }: { item: Auction; onOpen: () => void; featured?: boolean }) {
  return (
    <button onClick={onOpen} className={cn("group text-left", featured && "md:col-span-2 lg:col-span-1")}>
      <div className="overflow-hidden rounded-2xl border border-[#353d60] bg-[#11182a] transition-all duration-200 group-hover:-translate-y-1 group-hover:border-[#737ba5] group-hover:shadow-[0_18px_50px_rgba(0,0,0,.22)]">
        <div className="relative aspect-[1.08] overflow-hidden"><img src={item.image} alt={item.title} className="h-full w-full object-cover grayscale-[.18] transition-transform duration-500 group-hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-t from-[#0a0e1a]/70 to-transparent" /><span className="absolute left-3 top-3 rounded-full border border-white/25 bg-[#0a0e1a]/50 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[.12em] text-[#f6f7fb]">{item.category}</span><span className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-[#0a0e1a]/70 px-2.5 py-1 font-mono text-[9px] text-[#c7cbea]"><Clock3 size={11} /> {item.timeLeft}</span></div>
        <div className="p-4"><div className="flex items-start justify-between gap-4"><div><h3 className="font-extrabold tracking-[-.03em] text-[#f6f7fb]">{item.title}</h3><p className="mt-1 text-[11px] text-[#8f97bc]">{item.subtitle}</p></div><ChevronRight size={16} className="mt-1 shrink-0 text-[#737ba5] transition-transform group-hover:translate-x-1" /></div><div className="mt-5 flex items-end justify-between border-t border-[#353d60]/70 pt-3"><div><div className="font-mono text-[9px] uppercase tracking-[.12em] text-[#737ba5]">Current bid</div><div className="mt-0.5 text-lg font-extrabold text-[#c7cbea]">{money(item.current)}</div></div><div className="text-right font-mono text-[9px] uppercase tracking-[.1em] text-[#737ba5]">{item.bids} bids</div></div></div>
      </div>
    </button>
  );
}

function MarketPage({ onNavigate, user }: { onNavigate: (path: string) => void; user?: string }) {
  const [filter, setFilter] = useState("All lots");
  const filters = ["All lots", "Digital art", "Timepieces", "Collectible design", "Objects & curiosities"];
  const visible = filter === "All lots" ? auctions : auctions.filter((a) => a.category === filter);
  return <div className="min-h-screen bg-[#0a0e1a] text-[#f6f7fb]"><Header user={user} onNavigate={onNavigate} /><main className="container py-12 sm:py-16"><div className="mb-12 flex flex-col justify-between gap-8 lg:flex-row lg:items-end"><div><div className="mb-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.22em] text-[#9aa0c8]"><span className="h-2 w-2 rounded-full bg-[#c7cbea]" /> Live floor / 04 active lots</div><h1 className="max-w-[700px] text-5xl font-extrabold tracking-[-.08em] sm:text-7xl">Find your next<br /><span className="gradient-text">strong opinion.</span></h1><p className="mt-5 max-w-[510px] text-sm leading-6 text-[#8f97bc]">A rotating selection of art, design, and objects with a story worth carrying forward.</p></div><div className="flex w-full max-w-[300px] items-center gap-2 rounded-xl border border-[#353d60] bg-[#11182a] px-3 py-2.5 text-[#737ba5]"><Search size={16} /><input placeholder="Search the floor" className="w-full bg-transparent text-xs text-white outline-none placeholder:text-[#737ba5]" /></div></div><div className="mb-8 flex gap-2 overflow-x-auto pb-1">{filters.map((f) => <button key={f} onClick={() => setFilter(f)} className={cn("whitespace-nowrap rounded-full border px-3.5 py-2 text-[11px] font-bold transition-colors", filter === f ? "border-[#c7cbea] bg-[#c7cbea] text-[#0a0e1a]" : "border-[#353d60] text-[#aeb5d5] hover:border-[#737ba5] hover:text-white")}>{f}</button>)}</div><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{visible.map((item) => <AuctionCard key={item.id} item={item} onOpen={() => onNavigate(`/auction/${item.id}`)} />)}</div><div className="mt-16 grid gap-4 rounded-[28px] border border-[#353d60] bg-[#11182a] p-6 sm:p-8 lg:grid-cols-[1.1fr_.9fr] lg:items-center"><div><div className="mb-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.2em] text-[#737ba5]"><Gauge size={14} /> Under the hood</div><h2 className="max-w-[560px] text-3xl font-extrabold tracking-[-.06em]">The auction floor is built to stay calm when the room gets loud.</h2><p className="mt-3 max-w-[520px] text-sm leading-6 text-[#8f97bc]">See how we keep every concurrent bid in order with a serialized write path and instant event broadcast.</p></div><button onClick={() => onNavigate("/lab")} className="flex items-center justify-between rounded-xl border border-[#515a82] bg-[#1d243d] p-4 text-left transition-colors hover:border-[#9aa0c8]"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-lg bg-[#353d60] text-[#c7cbea]"><Cpu size={19} /></div><div><div className="text-xs font-extrabold">Open the concurrency lab</div><div className="mt-1 font-mono text-[9px] uppercase tracking-[.12em] text-[#737ba5]">live stress simulator</div></div></div><ArrowUpRight size={17} className="text-[#c7cbea]" /></button></div></main></div>;
}

function Countdown({ value }: { value: string }) {
  const [seconds, setSeconds] = useState(() => value.split(":").reduce((acc, part) => acc * 60 + Number(part.trim()), 0));
  useEffect(() => { const id = window.setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000); return () => window.clearInterval(id); }, []);
  const hours = Math.floor(seconds / 3600).toString().padStart(2, "0");
  const minutes = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  return <span className="font-mono tabular-nums">{hours} : {minutes} : {secs}</span>;
}

function AuctionPage({ id, onNavigate, user }: { id: string; onNavigate: (path: string) => void; user?: string }) {
  const item = auctions.find((a) => a.id === id) ?? auctions[0];
  const [current, setCurrent] = useState(item.current);
  const [amount, setAmount] = useState(item.next);
  const [bids, setBids] = useState<Bid[]>(seedBids);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [favorite, setFavorite] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const quickSteps = [0, 110, 220, 440];

  const placeBid = () => {
    if (amount <= current) {
      toast.error("Your bid needs to be higher than the current bid.");
      return;
    }
    setIsSubmitting(true);
    window.setTimeout(() => {
      const nextBid: Bid = { id: `b-${Date.now()}`, bidder: "you•••now", amount, time: "just now", state: "leading" };
      setBids((prev) => [nextBid, ...prev.map((bid) => ({ ...bid, state: bid.state === "leading" ? "accepted" : bid.state }))]);
      setCurrent(amount);
      setAmount(amount + 110);
      setLastAction(`Bid ${money(amount)} accepted · serialized in 4ms`);
      setIsSubmitting(false);
      toast.success("Your bid is leading.");
    }, 380);
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-[#f6f7fb]">
      <Header user={user} onNavigate={onNavigate} />
      <main className="container py-8 sm:py-12">
        <button onClick={() => onNavigate("/market")} className="mb-8 flex items-center gap-2 text-[11px] font-bold text-[#8f97bc] hover:text-white"><ArrowLeft size={15} /> Back to the floor</button>
        <div className="grid gap-6 lg:grid-cols-[1.08fr_.92fr]">
          <div>
            <div className="relative overflow-hidden rounded-[28px] border border-[#515a82] bg-[#11182a] p-3 shadow-[0_20px_80px_rgba(0,0,0,.25)]">
              <div className="relative aspect-[1.1] overflow-hidden rounded-[20px] sm:aspect-[1.2]">
                <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e1a]/65 to-transparent" />
                <div className="absolute left-4 right-4 top-4 flex items-center justify-between">
                  <span className="rounded-full border border-white/25 bg-[#0a0e1a]/55 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[.16em]">{item.category}</span>
                  <button onClick={() => setFavorite(!favorite)} className={cn("grid h-9 w-9 place-items-center rounded-full border bg-[#0a0e1a]/55 transition-colors", favorite ? "border-[#c7cbea] text-[#c7cbea]" : "border-white/25 text-white")} aria-label="Save auction"><Heart size={15} fill={favorite ? "currentColor" : "none"} /></button>
                </div>
                <div className="absolute bottom-5 left-5 right-5">
                  <div className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.18em] text-[#c7cbea]"><span className="h-2 w-2 rounded-full bg-[#c7cbea] shadow-[0_0_12px_#c7cbea]" /> Live now</div>
                  <h1 className="text-4xl font-extrabold tracking-[-.08em] sm:text-6xl">{item.title}</h1>
                </div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-[#353d60] bg-[#11182a] p-3"><div className="font-mono text-[9px] uppercase tracking-[.12em] text-[#737ba5]">Estimate</div><div className="mt-2 text-sm font-bold">{item.estimate}</div></div>
              <div className="rounded-xl border border-[#353d60] bg-[#11182a] p-3"><div className="font-mono text-[9px] uppercase tracking-[.12em] text-[#737ba5]">Bids</div><div className="mt-2 text-sm font-bold">{bids.length + item.bids - seedBids.length}</div></div>
              <div className="rounded-xl border border-[#353d60] bg-[#11182a] p-3"><div className="font-mono text-[9px] uppercase tracking-[.12em] text-[#737ba5]">Closes</div><div className="mt-2 text-sm font-bold"><Countdown value={item.timeLeft} /></div></div>
            </div>
          </div>
          <div className="rounded-[28px] border border-[#353d60] bg-[#11182a] p-5 sm:p-7">
            <div className="mb-7 flex items-start justify-between"><div><p className="mb-2 font-mono text-[10px] uppercase tracking-[.2em] text-[#737ba5]">Live auction / {item.id}</p><h2 className="text-2xl font-extrabold tracking-[-.05em]">Place your bid.</h2></div><div className="rounded-full border border-[#353d60] px-3 py-1.5 font-mono text-[10px] text-[#9aa0c8]"><Clock3 size={11} className="mr-1 inline" /> <Countdown value={item.timeLeft} /></div></div>
            <div className="mb-6 rounded-2xl border border-[#515a82] bg-[#0a0e1a]/55 p-4"><div className="flex items-end justify-between"><div><div className="font-mono text-[9px] uppercase tracking-[.15em] text-[#737ba5]">Current leading bid</div><div className="mt-1 text-4xl font-extrabold tracking-[-.07em] text-[#c7cbea]">{money(current)}</div></div><div className="flex items-center gap-1 text-right font-mono text-[10px] text-[#9aa0c8]"><ArrowUpRight size={14} className="text-[#c7cbea]" /> +{(bids.length * 2.4).toFixed(1)}% today</div></div></div>
            <div className="mb-3 flex items-center justify-between"><label htmlFor="bid" className="text-[11px] font-bold text-[#e2e4f3]">Your maximum bid</label><span className="font-mono text-[10px] text-[#737ba5]">min. {money(current + 110)}</span></div>
            <div className="relative mb-3"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[#737ba5]">$</span><input id="bid" type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="w-full rounded-xl border border-[#515a82] bg-[#0a0e1a] py-4 pl-8 pr-4 text-xl font-extrabold text-white outline-none transition-colors focus:border-[#c7cbea]" /></div>
            <div className="mb-5 flex gap-2">{quickSteps.map((step) => <button key={step} onClick={() => setAmount(current + 110 + step)} className="flex-1 rounded-lg border border-[#353d60] py-2 text-[10px] font-bold text-[#aeb5d5] transition-colors hover:border-[#9aa0c8] hover:text-white">{step === 0 ? "Min" : `+$${step}`}</button>)}</div>
            <button onClick={placeBid} disabled={isSubmitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#c7cbea] py-4 text-xs font-extrabold text-[#0a0e1a] transition-all hover:bg-white disabled:opacity-60 active:scale-[.98]">{isSubmitting ? <><TimerReset size={15} className="animate-spin" /> Serializing bid…</> : <><Gavel size={15} /> Place bid at {money(amount)}</>}</button>
            {lastAction && <div className="mt-3 flex items-center gap-2 rounded-lg border border-[#737ba5]/50 bg-[#353d60]/30 px-3 py-2 text-[10px] text-[#c7cbea]"><Check size={13} /> {lastAction}</div>}
            <div className="mt-7 border-t border-[#353d60] pt-5"><div className="mb-4 flex items-center justify-between"><h3 className="text-sm font-extrabold">Bid history</h3><span className="font-mono text-[9px] uppercase tracking-[.14em] text-[#737ba5]">newest first</span></div><div className="space-y-1">{bids.slice(0, 6).map((bid, index) => <div key={bid.id} className="flex items-center justify-between rounded-lg px-2 py-2.5 transition-colors hover:bg-[#1d243d]"><div className="flex items-center gap-2.5"><div className={cn("grid h-7 w-7 place-items-center rounded-full text-[9px] font-extrabold", index === 0 ? "bg-[#c7cbea] text-[#0a0e1a]" : "bg-[#353d60] text-[#9aa0c8]")}>{index === 0 ? "YOU" : bid.bidder.slice(0, 2).toUpperCase()}</div><div><div className="text-xs font-bold">{bid.bidder}</div><div className="font-mono text-[9px] text-[#737ba5]">{bid.time}</div></div></div><div className="flex items-center gap-2"><span className="text-sm font-extrabold">{money(bid.amount)}</span><span className={cn("rounded-full px-2 py-1 font-mono text-[8px] uppercase tracking-[.1em]", bid.state === "leading" ? "bg-[#c7cbea] text-[#0a0e1a]" : bid.state === "rejected" ? "bg-[#fa6b7e]/15 text-[#fa6b7e]" : "bg-[#353d60] text-[#9aa0c8]")}>{bid.state}</span></div></div>)}</div></div>
          </div>
        </div>
        <div className="mt-6 grid gap-4 rounded-[24px] border border-[#353d60] bg-[#11182a] p-5 sm:grid-cols-3"><div className="flex gap-3"><div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#353d60] text-[#c7cbea]"><LockKeyhole size={15} /></div><div><div className="text-xs font-extrabold">Atomic bids</div><p className="mt-1 text-[10px] leading-4 text-[#737ba5]">One writer at a time. Always.</p></div></div><div className="flex gap-3"><div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#353d60] text-[#c7cbea]"><Zap size={15} /></div><div><div className="text-xs font-extrabold">Instant updates</div><p className="mt-1 text-[10px] leading-4 text-[#737ba5]">No refresh. No stale prices.</p></div></div><div className="flex gap-3"><div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#353d60] text-[#c7cbea]"><ShieldCheck size={15} /></div><div><div className="text-xs font-extrabold">Safe settlement</div><p className="mt-1 text-[10px] leading-4 text-[#737ba5]">Verified from bid to win.</p></div></div></div>
      </main>
    </div>
  );
}

function RegisterPage({ onNavigate, onRegister }: { onNavigate: (path: string) => void; onRegister: (name: string) => void }) {
  const [step, setStep] = useState(1);
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState(false);
  const [rules, setRules] = useState(false);
  const canContinue = step === 1 ? Boolean(first.trim() && last.trim() && email.includes("@")) : age && rules;
  return <div className="min-h-screen bg-[#0a0e1a] text-[#f6f7fb]"><div className="container flex min-h-screen max-w-[1280px] items-center justify-center py-10"><div className="grid w-full overflow-hidden rounded-[30px] border border-[#515a82] bg-[#11182a] shadow-[0_30px_100px_rgba(0,0,0,.35)] lg:grid-cols-[.88fr_1.12fr]"><div className="relative hidden overflow-hidden p-10 lg:block"><img src={auctions[2].image} alt="Watch detail" className="absolute inset-0 h-full w-full object-cover opacity-60" /><div className="absolute inset-0 bg-gradient-to-br from-[#0a0e1a]/90 via-[#353d60]/70 to-[#0a0e1a]/85" /><div className="relative flex h-full flex-col justify-between"><button onClick={() => onNavigate("/")}><Logo /></button><div><p className="mb-4 font-mono text-[10px] uppercase tracking-[.2em] text-[#c7cbea]">Not just an auction.</p><h1 className="max-w-[390px] text-5xl font-extrabold leading-[.95] tracking-[-.08em]">A better way to <span className="gradient-text">want things.</span></h1><p className="mt-5 max-w-[350px] text-sm leading-6 text-[#c7cbea]/75">Join a more considered marketplace for objects, ideas, and the people who get them.</p></div><div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[.16em] text-[#9aa0c8]"><ShieldCheck size={14} /> identity-first / 21+ community</div></div></div><div className="p-6 sm:p-10 lg:p-14"><div className="mb-10 flex items-center justify-between"><button onClick={() => onNavigate("/")} className="lg:hidden"><Logo /></button><div className="hidden lg:block" /><div className="font-mono text-[10px] uppercase tracking-[.18em] text-[#737ba5]">{step} / 2</div></div><div className="mb-10 flex gap-2"><div className={cn("h-1 flex-1 rounded-full", step >= 1 ? "bg-[#c7cbea]" : "bg-[#353d60]")} /><div className={cn("h-1 flex-1 rounded-full", step >= 2 ? "bg-[#c7cbea]" : "bg-[#353d60]")} /></div>{step === 1 ? <><p className="mb-3 font-mono text-[10px] uppercase tracking-[.2em] text-[#9aa0c8]">Welcome to the floor</p><h2 className="text-4xl font-extrabold tracking-[-.07em]">Make a wise entrance.</h2><p className="mt-3 max-w-[400px] text-sm leading-6 text-[#8f97bc]">Create your profile so sellers know who is on the other side of the bid.</p><div className="mt-9 grid gap-4 sm:grid-cols-2"><label className="text-xs font-bold text-[#e2e4f3]">First name<input value={first} onChange={(e) => setFirst(e.target.value)} placeholder="Mira" className="mt-2 w-full rounded-xl border border-[#515a82] bg-[#0a0e1a] px-4 py-3 text-sm font-medium text-white outline-none focus:border-[#c7cbea]" /></label><label className="text-xs font-bold text-[#e2e4f3]">Last name<input value={last} onChange={(e) => setLast(e.target.value)} placeholder="Liu" className="mt-2 w-full rounded-xl border border-[#515a82] bg-[#0a0e1a] px-4 py-3 text-sm font-medium text-white outline-none focus:border-[#c7cbea]" /></label></div><label className="mt-4 block text-xs font-bold text-[#e2e4f3]">Email address<input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@example.com" className="mt-2 w-full rounded-xl border border-[#515a82] bg-[#0a0e1a] px-4 py-3 text-sm font-medium text-white outline-none focus:border-[#c7cbea]" /></label><button disabled={!canContinue} onClick={() => setStep(2)} className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-[#c7cbea] py-4 text-xs font-extrabold text-[#0a0e1a] transition-all hover:bg-white disabled:opacity-40">Continue <ChevronRight size={15} /></button><p className="mt-5 text-center text-[10px] text-[#737ba5]">Already have an account? <button onClick={() => onNavigate("/market")} className="font-bold text-[#c7cbea] hover:text-white">Browse as guest</button></p></> : <><p className="mb-3 font-mono text-[10px] uppercase tracking-[.2em] text-[#9aa0c8]">One important thing</p><h2 className="text-4xl font-extrabold tracking-[-.07em]">Keep it considered.</h2><p className="mt-3 max-w-[400px] text-sm leading-6 text-[#8f97bc]">Wise Money is built for adults who want to collect with intention. Two quick checks and you are in.</p><div className="mt-9 space-y-3"><label className="flex cursor-pointer gap-3 rounded-2xl border border-[#353d60] bg-[#0a0e1a]/55 p-4 transition-colors hover:border-[#737ba5]"><input type="checkbox" checked={age} onChange={(e) => setAge(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-[#c7cbea]" /><span><span className="block text-sm font-bold">I am 21 years or older.</span><span className="mt-1 block text-[11px] leading-5 text-[#737ba5]">You must be of legal age to participate in live auctions.</span></span></label><label className="flex cursor-pointer gap-3 rounded-2xl border border-[#353d60] bg-[#0a0e1a]/55 p-4 transition-colors hover:border-[#737ba5]"><input type="checkbox" checked={rules} onChange={(e) => setRules(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-[#c7cbea]" /><span><span className="block text-sm font-bold">I agree to the Wise Money rules.</span><span className="mt-1 block text-[11px] leading-5 text-[#737ba5]">No shill bidding, no ghost accounts, respect the close.</span></span></label></div><button disabled={!canContinue} onClick={() => onRegister(`${first} ${last}`)} className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-[#c7cbea] py-4 text-xs font-extrabold text-[#0a0e1a] transition-all hover:bg-white disabled:opacity-40">Enter the floor <ArrowUpRight size={15} /></button><button onClick={() => setStep(1)} className="mt-4 flex w-full items-center justify-center gap-2 text-[11px] font-bold text-[#737ba5] hover:text-white"><ArrowLeft size={13} /> Back</button></>}</div></div></div></div>;
}

function LabPage({ onNavigate, user }: { onNavigate: (path: string) => void; user?: string }) {
  const [running, setRunning] = useState(false);
  const [complete, setComplete] = useState(false);
  const [processed, setProcessed] = useState(0);
  const [accepted, setAccepted] = useState(0);
  const [rejected, setRejected] = useState(0);
  const [events, setEvents] = useState<string[]>(["ready  /  waiting for a burst", "lock  /  auction: nocturne-07", "stream  /  broadcast channel healthy"]);
  const progress = processed / 100;
  const runTest = () => {
    if (running) return;
    setRunning(true); setComplete(false); setProcessed(0); setAccepted(0); setRejected(0); setEvents(["burst  /  100 concurrent bids queued", "lock  /  acquiring serializable writer"]);
    let tick = 0;
    const id = window.setInterval(() => {
      tick += 1;
      const acceptedNow = Math.max(1, Math.round(tick * .31));
      const rejectedNow = tick - acceptedNow;
      setProcessed(tick); setAccepted(acceptedNow); setRejected(rejectedNow);
      if (tick % 8 === 0) setEvents((prev) => [`bid_${String(tick).padStart(3, "0")}  /  ${acceptedNow > rejectedNow ? "accepted → broadcast" : "rejected → stale price"}`, ...prev].slice(0, 5));
      if (tick >= 100) { window.clearInterval(id); setRunning(false); setComplete(true); setEvents((prev) => ["complete / 100 bids reconciled with zero double-allocation", "stream  /  31 accepted, 69 rejected safely", ...prev].slice(0, 5)); }
    }, 42);
  };
  useEffect(() => () => undefined, []);
  return <div className="min-h-screen bg-[#0a0e1a] text-[#f6f7fb]"><Header user={user} onNavigate={onNavigate} /><main className="container py-10 sm:py-16"><div className="mb-12 max-w-[760px]"><button onClick={() => onNavigate("/market")} className="mb-7 flex items-center gap-2 text-[11px] font-bold text-[#8f97bc] hover:text-white"><ArrowLeft size={15} /> Back to the floor</button><div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#515a82] px-3 py-2 font-mono text-[10px] uppercase tracking-[.16em] text-[#c7cbea]"><Radar size={13} /> Systems / concurrency lab</div><h1 className="text-5xl font-extrabold leading-[.92] tracking-[-.08em] sm:text-7xl">When the room gets loud,<br /><span className="gradient-text">the ledger stays calm.</span></h1><p className="mt-6 max-w-[610px] text-base leading-7 text-[#8f97bc]">A live visual stress demo of the Wise Money write path. Fire 100 bids at the same auction in a single spike and watch the serializer keep the winning price honest.</p></div><div className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]"><div className="rounded-[28px] border border-[#515a82] bg-[#11182a] p-5 sm:p-7"><div className="mb-8 flex items-center justify-between"><div><div className="font-mono text-[10px] uppercase tracking-[.18em] text-[#737ba5]">Live stress demo</div><h2 className="mt-2 text-2xl font-extrabold tracking-[-.05em]">Bid serialization</h2></div><div className={cn("flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[9px] uppercase tracking-[.12em]", running ? "border-[#c7cbea] text-[#c7cbea]" : "border-[#353d60] text-[#737ba5]")}><span className={cn("h-1.5 w-1.5 rounded-full", running ? "animate-pulse bg-[#c7cbea]" : "bg-[#737ba5]")} /> {running ? "processing" : complete ? "complete" : "standby"}</div></div><div className="mb-3 flex items-end justify-between"><div className="font-mono text-[10px] uppercase tracking-[.15em] text-[#737ba5]">concurrent submission spike</div><div className="font-mono text-sm text-[#c7cbea]">{processed} / 100</div></div><div className="mb-8 h-3 overflow-hidden rounded-full bg-[#0a0e1a]"><div className="h-full rounded-full bg-gradient-to-r from-[#515a82] via-[#9aa0c8] to-[#c7cbea] transition-[width] duration-75" style={{ width: `${progress * 100}%` }} /></div><div className="mb-8 grid grid-cols-3 gap-3"><div className="rounded-xl border border-[#353d60] bg-[#0a0e1a]/50 p-4"><div className="font-mono text-[9px] uppercase tracking-[.12em] text-[#737ba5]">accepted</div><div className="mt-2 text-3xl font-extrabold text-[#c7cbea]">{accepted}</div><div className="mt-1 text-[10px] text-[#737ba5]">winner advances</div></div><div className="rounded-xl border border-[#353d60] bg-[#0a0e1a]/50 p-4"><div className="font-mono text-[9px] uppercase tracking-[.12em] text-[#737ba5]">rejected</div><div className="mt-2 text-3xl font-extrabold text-[#9aa0c8]">{rejected}</div><div className="mt-1 text-[10px] text-[#737ba5]">stale / lower bid</div></div><div className="rounded-xl border border-[#353d60] bg-[#0a0e1a]/50 p-4"><div className="font-mono text-[9px] uppercase tracking-[.12em] text-[#737ba5]">collisions</div><div className="mt-2 text-3xl font-extrabold text-[#c7cbea]">0</div><div className="mt-1 text-[10px] text-[#737ba5]">double allocation</div></div></div><div className="mb-8 grid gap-2">{events.map((event, index) => <div key={`${event}-${index}`} className="flex items-center gap-3 rounded-lg bg-[#0a0e1a]/50 px-3 py-2.5 font-mono text-[10px] text-[#aeb5d5]"><span className="text-[#737ba5]">{String(index + 1).padStart(2, "0")}</span><span className={cn(index === 0 && (running || complete) ? "text-[#c7cbea]" : "")}>{event}</span></div>)}</div><button onClick={runTest} disabled={running} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#c7cbea] py-4 text-xs font-extrabold text-[#0a0e1a] transition-all hover:bg-white disabled:opacity-50 active:scale-[.98]"><Play size={15} className="fill-current" /> {running ? "Running the burst…" : complete ? "Run it again" : "Fire 100 concurrent bids"}</button></div><div className="space-y-4"><div className="rounded-[28px] border border-[#353d60] bg-[#11182a] p-5 sm:p-7"><div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl bg-[#353d60] text-[#c7cbea]"><Layers3 size={20} /></div><h2 className="text-xl font-extrabold tracking-[-.04em]">The three-step guardrail.</h2><div className="mt-6 space-y-5">{[{n:"01", t:"Lock the lot", d:"A single serializable writer owns the current price."}, {n:"02", t:"Check the bid", d:"Lower or out-of-order bids are rejected before commit."}, {n:"03", t:"Broadcast the truth", d:"The accepted price streams to every connected client."}].map((step) => <div key={step.n} className="flex gap-3"><div className="font-mono text-[10px] text-[#c7cbea]">{step.n}</div><div><div className="text-sm font-extrabold">{step.t}</div><p className="mt-1 text-[11px] leading-5 text-[#737ba5]">{step.d}</p></div></div>)}</div></div><div className="rounded-[28px] border border-[#353d60] bg-gradient-to-br from-[#353d60] to-[#1d243d] p-5 sm:p-7"><div className="mb-5 flex items-center justify-between"><div className="font-mono text-[10px] uppercase tracking-[.16em] text-[#c7cbea]">System health</div><div className="h-2 w-2 rounded-full bg-[#c7cbea] shadow-[0_0_10px_#c7cbea]" /></div><div className="grid grid-cols-2 gap-5"><div><div className="text-3xl font-extrabold">4ms</div><div className="mt-1 text-[10px] text-[#aeb5d5]">median commit</div></div><div><div className="text-3xl font-extrabold">99.9%</div><div className="mt-1 text-[10px] text-[#aeb5d5]">broadcast health</div></div></div></div></div></div></main></div>;
}

function AccountPage({ onNavigate, user }: { onNavigate: (path: string) => void; user?: string }) {
  return <div className="min-h-screen bg-[#0a0e1a] text-[#f6f7fb]"><Header user={user} onNavigate={onNavigate} /><main className="container py-12 sm:py-16"><div className="mb-10 flex items-end justify-between"><div><p className="mb-3 font-mono text-[10px] uppercase tracking-[.2em] text-[#737ba5]">Your Wise Money / account</p><h1 className="text-5xl font-extrabold tracking-[-.08em]">Keep your eye<br /><span className="gradient-text">on the good stuff.</span></h1></div><button onClick={() => onNavigate("/market")} className="hidden items-center gap-2 rounded-xl border border-[#515a82] px-4 py-3 text-xs font-bold text-[#c7cbea] hover:border-[#9aa0c8] sm:flex">Back to floor <ArrowUpRight size={14} /></button></div><div className="grid gap-5 lg:grid-cols-[.8fr_1.2fr]"><div className="rounded-[28px] border border-[#515a82] bg-[#11182a] p-6 sm:p-8"><div className="flex items-center gap-4"><div className="grid h-16 w-16 place-items-center rounded-2xl bg-[#c7cbea] text-lg font-extrabold text-[#0a0e1a]">{user ? user.split(" ").map((n) => n[0]).join("").slice(0, 2) : "WM"}</div><div><h2 className="text-xl font-extrabold">{user || "Wise Money member"}</h2><p className="mt-1 text-xs text-[#737ba5]">Verified bidder · member since today</p></div></div><div className="mt-8 grid grid-cols-2 gap-3"><div className="rounded-xl bg-[#0a0e1a]/60 p-4"><div className="font-mono text-[9px] uppercase tracking-[.12em] text-[#737ba5]">Watching</div><div className="mt-2 text-2xl font-extrabold">03</div></div><div className="rounded-xl bg-[#0a0e1a]/60 p-4"><div className="font-mono text-[9px] uppercase tracking-[.12em] text-[#737ba5]">Won</div><div className="mt-2 text-2xl font-extrabold">00</div></div></div><button onClick={() => toast.info("Wallet setup is ready for the next demo phase.")} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-[#515a82] py-3 text-xs font-bold text-[#c7cbea] hover:border-[#c7cbea]"><Wallet size={15} /> Connect wallet</button></div><div className="rounded-[28px] border border-[#353d60] bg-[#11182a] p-6 sm:p-8"><div className="mb-7 flex items-center justify-between"><div><p className="mb-2 font-mono text-[10px] uppercase tracking-[.18em] text-[#737ba5]">Your activity</p><h2 className="text-2xl font-extrabold tracking-[-.05em]">Signals worth keeping.</h2></div><BarChart3 size={19} className="text-[#9aa0c8]" /></div><div className="space-y-3"><div className="flex items-center justify-between rounded-xl border border-[#353d60] bg-[#0a0e1a]/45 p-4"><div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-lg bg-[#353d60] text-[#c7cbea]"><Heart size={16} /></div><div><div className="text-sm font-extrabold">Nocturne / 07</div><div className="mt-1 text-[10px] text-[#737ba5]">Watching · 38 live bids</div></div></div><ChevronRight size={15} className="text-[#737ba5]" /></div><div className="flex items-center justify-between rounded-xl border border-[#353d60] bg-[#0a0e1a]/45 p-4"><div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-lg bg-[#353d60] text-[#c7cbea]"><Bell size={16} /></div><div><div className="text-sm font-extrabold">Price alert active</div><div className="mt-1 text-[10px] text-[#737ba5]">Mizu 1984 · notify at $4,100</div></div></div><div className="h-2 w-2 rounded-full bg-[#c7cbea] shadow-[0_0_10px_#c7cbea]" /></div><div className="flex items-center justify-between rounded-xl border border-[#353d60] bg-[#0a0e1a]/45 p-4"><div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-lg bg-[#353d60] text-[#c7cbea]"><CircleHelp size={16} /></div><div><div className="text-sm font-extrabold">Need a hand?</div><div className="mt-1 text-[10px] text-[#737ba5]">Read our considered bidding guide</div></div></div><ArrowUpRight size={15} className="text-[#737ba5]" /></div></div></div></div></main></div>;
}

function Footer({ onNavigate }: { onNavigate: (path: string) => void }) {
  return <footer className="border-t border-[#353d60]/60 bg-[#0a0e1a] py-8"><div className="container flex flex-col justify-between gap-5 text-[10px] text-[#737ba5] sm:flex-row sm:items-center"><div className="flex items-center gap-3"><Logo compact /><span>© 2026 Wise Money / built for the considered bid.</span></div><div className="flex items-center gap-5"><button onClick={() => onNavigate("/lab")} className="hover:text-[#c7cbea]">System status</button><button onClick={() => toast.info("Participation rules are clear, transparent, and 21+.")} className="hover:text-[#c7cbea]">Participation rules</button><span className="flex items-center gap-1.5 text-[#9aa0c8]"><span className="h-1.5 w-1.5 rounded-full bg-[#c7cbea]" /> All systems operational</span></div></div></footer>;
}

export default function Home() {
  const [location, setLocation] = useLocation();
  const [user, setUser] = useState<string | undefined>();
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [cookies, setCookies] = useState(false);

  const onRegister = (name: string) => { setUser(name); setLocation("/market"); toast.success("Welcome to the floor."); };
  const content = useMemo(() => {
    if (location === "/register") return <RegisterPage onNavigate={setLocation} onRegister={onRegister} />;
    if (location === "/lab") return <LabPage onNavigate={setLocation} user={user} />;
    if (location === "/account") return <AccountPage onNavigate={setLocation} user={user} />;
    if (location.startsWith("/auction/")) return <AuctionPage id={location.split("/")[2]} onNavigate={setLocation} user={user} />;
    if (location === "/market") return <MarketPage onNavigate={setLocation} user={user} />;
    return <LandingPage onNavigate={setLocation} user={user} />;
  }, [location, user, setLocation]);

  return <>{content}{!ageConfirmed && <AgeGate onConfirm={() => setAgeConfirmed(true)} />}{ageConfirmed && !cookies && <CookieBar onAccept={() => setCookies(true)} />}</>;
}
