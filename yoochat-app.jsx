import { useState, useRef, useMemo, useEffect, createContext, useContext, Fragment } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  AtSign,
  Bell,
  BookOpen,
  Bot,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  CloudOff,
  Copy,
  ExternalLink,
  Eye,
  FileText,
  Filter,
  Fingerprint,
  Globe,
  Hash,
  Headphones,
  Heart,
  History,
  Home,
  Hourglass,
  Image as ImageIcon,
  Inbox,
  Info,
  Layers,
  Link2,
  LogOut,
  Mail,
  MessageCircle,
  MessageSquare,
  Minus,
  Monitor,
  MoreVertical,
  MousePointerClick,
  Music,
  Paperclip,
  Pencil,
  Phone,
  Play,
  Plus,
  RefreshCw,
  Repeat,
  Reply,
  Search,
  Send,
  Share2,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  Tablet,
  Trash2,
  Type,
  Upload,
  User,
  UserCheck,
  UserPlus,
  Users,
  Video,
  WifiOff,
  X,
  Zap,
} from "lucide-react";

const NavCtx = createContext(() => {});

const NetCtx = createContext({ mode: "normal", tick: 0, call: () => Promise.resolve(), refresh: () => {} });
const LOADED = new Set();

function useLoad(key, ms = 800, enabled = true) {
  const net = useContext(NetCtx);
  const [st, setSt] = useState(() => (LOADED.has(key) ? { status: "ready" } : { status: "loading" }));
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!enabled) return undefined;
    if (LOADED.has(key)) {
      setSt({ status: "ready" });
      return undefined;
    }
    let live = true;
    setSt({ status: "loading" });
    net.call(ms).then(
      () => {
        LOADED.add(key);
        if (live) setSt({ status: "ready" });
      },
      (e) => {
        if (live) setSt({ status: "error", err: e });
      }
    );
    return () => {
      live = false;
    };
  }, [key, n, net.tick, enabled]);
  const status = st.status === "ready" && !LOADED.has(key) ? "loading" : st.status;
  return [{ ...st, status }, () => setN((x) => x + 1)];
}

function Skeleton({ h = 16, w = "100%", r = 8, style }) {
  return <span className="sk" aria-hidden="true" style={{ height: h, width: w, borderRadius: r, ...style }} />;
}

function LoadError({ err, onRetry, what }) {
  const off = err && err.kind === "offline";
  return (
    <div className="errcard" role="alert">
      <span className="eico">{off ? <WifiOff size={24} /> : <CloudOff size={24} />}</span>
      <h3>{off ? "You’re offline" : `Couldn’t load ${what}`}</h3>
      <p>{off ? "Check your connection. We’ll try again when you’re back online." : "Something went wrong on our side. Try again in a moment."}</p>
      <button type="button" className="retry" onClick={onRetry}><RefreshCw size={16} /> Try again</button>
    </div>
  );
}

function LoadGate({ k, ms, enabled, skeleton, what, children }) {
  const [st, retry] = useLoad(k, ms, enabled);
  if (st.status === "loading") return <div role="status" aria-busy="true" aria-label={`Loading ${what}`}>{skeleton}</div>;
  if (st.status === "error") return <LoadError err={st.err} onRetry={retry} what={what} />;
  return children;
}

const ChanCtx = createContext({ channels: [], activeId: null, active: null, setActive: () => {}, goAdd: () => {}, goManage: () => {}, goFix: () => {} });

function ChannelAvatar({ ch, lg }) {
  return (
    <span className={"cav" + (lg ? " lg" : "")} style={{ "--h": ch.hue }} aria-hidden="true">
      {ch.name[0]}
      {ch.status !== "ok" && <i className="warn-dot" />}
    </span>
  );
}

function ChannelChip({ ch, onClick, wide }) {
  if (!ch) {
    return (
      <button type="button" className={"chan-chip" + (wide ? " wide" : "")} onClick={onClick}>
        <span className="cname">Add channel</span>
      </button>
    );
  }
  return (
    <button type="button" className={"chan-chip" + (wide ? " wide" : "")} aria-label={`Channel: ${ch.name}. Change channel`} onClick={onClick}>
      <ChannelAvatar ch={ch} />
      <span className="cname">{ch.name}</span>
      <ChevronDown size={16} className="chv" />
    </button>
  );
}

function ChannelSheet({ channels, activeId, onPick, onAdd, onManage, onClose, title }) {
  return (
    <div className="scrim" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label="Choose channel" onClick={(e) => e.stopPropagation()}>
        <div className="grab" />
        <div className="sh-head">
          <h2>{title || "Switch channel"}</h2>
          <button type="button" className="icon-btn sm" aria-label="Close" onClick={onClose}><X size={20} /></button>
        </div>
        {channels.map((c) => (
          <button key={c.id} type="button" className="crow" aria-pressed={c.id === activeId} onClick={() => onPick(c.id)}>
            <ChannelAvatar ch={c} lg />
            <span className="ct">
              <b>{c.name}</b>
              <small className={c.status === "ok" ? "" : "warn"}>{c.status === "ok" ? "Connected" : c.status === "expiring" ? `Expires in ${c.days} days` : "Reconnect needed"}</small>
            </span>
            {c.id === activeId && <Check size={18} strokeWidth={3} className="tick" />}
          </button>
        ))}
        {onAdd && (
          <button type="button" className="crow addc" onClick={onAdd}><Plus size={20} strokeWidth={2.6} /> Add channel</button>
        )}
        {onManage && <button type="button" className="sh-link" onClick={onManage}>Manage channels</button>}
      </div>
    </div>
  );
}

function ChannelBanner({ ch, onFix, inline }) {
  const soon = ch.status === "expiring";
  return (
    <div className={"chan-banner" + (inline ? " inline" : "")}>
      <p>{soon ? `${ch.name}’s connection expires in ${ch.days} days. Sign in again to keep replies running.` : `${ch.name} needs to reconnect. Replies are paused until you do.`}</p>
      <button type="button" onClick={onFix}>{soon ? "Renew" : "Reconnect"}</button>
    </div>
  );
}

const MPV_LINK = /(https?:\/\/[^\s]+)/g;
const mpvBytes = (t) => new TextEncoder().encode(t || "").length;
const mpvChars = (t) => Array.from(t || "").length;
const mpvSize = (b) => (!b ? "" : b >= 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

function MsgPreviewSheet({ m, channel, sample, issues, onClose }) {
  const [device, setDevice] = useState("mobile");
  const [who, setWho] = useState("Sara");
  const [they, setThey] = useState(sample || "Hi!");
  const [log, setLog] = useState([]);
  const [gone, setGone] = useState(false);
  const [snack, setSnack] = useState("");
  const [idx, setIdx] = useState(0);
  const snackT = useRef(null);
  const tid = useRef(0);
  const railRef = useRef(null);
  const chatRef = useRef(null);
  const c = m.content || {};
  const name = who.trim() || "there";
  const fill = (t) => (t || "").replace(/\{first_name\}/g, name).replace(/\{username\}/g, "@" + name.toLowerCase().replace(/\s+/g, "_"));
  const say = (t) => {
    setSnack(t);
    clearTimeout(snackT.current);
    snackT.current = setTimeout(() => setSnack(""), 2200);
  };
  const reset = () => {
    setLog([]);
    setGone(false);
    setSnack("");
    setIdx(0);
    if (railRef.current) railRef.current.scrollLeft = 0;
  };
  const tap = (text, note) => setLog((l) => [...l, { id: ++tid.current, text, note }]);
  const act = (b) => {
    if (b.type === "web_url") say(`Opens ${b.url || "the link"}`);
    else tap(b.title, `Sends tap code “${b.payload || "…"}” to your automation`);
  };
  const acts = (titles, list) => (titles || []).map((t, i) => (list && list[i]) || { title: t, type: "postback", payload: "" });

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [log.length, device]);

  const Rich = ({ text }) =>
    text.split(MPV_LINK).map((part, i) =>
      /^https?:\/\//.test(part) ? (
        <button key={i} type="button" className="mpv-link" onClick={() => say(`Opens ${part}`)}>{part}</button>
      ) : (
        <span key={i}>{part}</span>
      )
    );

  let body = null;
  if (device === "desktop" && (m.type === "generic" || m.type === "quick")) {
    body = <div className="mpv-bub mpv-na">Instagram for desktop can’t show {m.type === "generic" ? "cards" : "quick replies"}. People on desktop won’t see this message.</div>;
  } else if (m.type === "text") {
    body = c.text ? <div className="mpv-bub bot" dir="auto"><Rich text={fill(c.text)} /></div> : <div className="mpv-bub bot mpv-ph">Your message</div>;
  } else if (m.type === "media") {
    const names = c.names || [];
    if (!names.length) body = <div className="mpv-bub bot mpv-ph">Your {c.kind || "media"} appears here</div>;
    else if (c.kind === "image") {
      body = (
        <div className={"mpv-imgs" + (names.length === 1 ? " one" : "")}>
          {(c.urls || []).map((u, i) => <img key={i} src={u} alt="" />)}
        </div>
      );
    } else if (c.kind === "video") {
      body = <div className="mpv-video"><span className="mpv-play"><Play size={22} /></span></div>;
    } else if (c.kind === "audio") {
      body = (
        <div className="mpv-audio">
          <span className="mpv-play" style={{ width: 36, height: 36 }}><Play size={16} /></span>
          <span className="wv">{[8, 14, 20, 12, 18, 9, 16, 22, 11, 15, 7, 13].map((h, i) => <i key={i} style={{ height: h }} />)}</span>
          0:24
        </div>
      );
    } else {
      body = names.map((n, i) => (
        <div className="mpv-file" key={i}>
          <span className="fi"><FileText size={20} /></span>
          <span><b dir="auto">{n}</b><small>{mpvSize((c.sizes || [])[i]) || "PDF"}</small></span>
        </div>
      ));
    }
  } else if (m.type === "button") {
    const bs = acts(c.buttons, c.acts);
    body = (
      <>
        {c.text ? <div className="mpv-bub bot" dir="auto"><Rich text={fill(c.text)} /></div> : <div className="mpv-bub bot mpv-ph">Your message</div>}
        {bs.length > 0 && (
          <div className="mpv-btns">
            {bs.map((b, i) => (
              <button key={i} type="button" className="mpv-btn" onClick={() => act(b)}>
                {b.type === "web_url" && <ExternalLink size={14} />}
                <span dir="auto">{b.title}</span>
              </button>
            ))}
          </div>
        )}
      </>
    );
  } else if (m.type === "generic") {
    const cards = c.cards || [];
    body = (
      <>
        <div
          className="mpv-rail"
          ref={railRef}
          onScroll={(e) => {
            const el = e.currentTarget;
            setIdx(Math.min(cards.length - 1, Math.round(el.scrollLeft / 218)));
          }}
        >
          {cards.map((cd, i) => {
            const bs = acts(cd.buttons, cd.acts);
            return (
              <div className="mpv-card" key={i}>
                {cd.image && <img src={cd.image} alt="" />}
                <button type="button" className="mpv-cb" onClick={() => (cd.action ? say(`Opens ${cd.action}`) : undefined)}>
                  <b dir="auto">{cd.title || "Card title"}</b>
                  {cd.subtitle && <span dir="auto">{cd.subtitle}</span>}
                </button>
                {bs.map((b, j) => <button key={j} type="button" className="mpv-cbtn" onClick={() => act(b)} dir="auto">{b.title}</button>)}
              </div>
            );
          })}
        </div>
        {cards.length > 1 && <div className="mpv-dots" aria-hidden="true">{cards.map((_, i) => <i key={i} className={i === idx ? "on" : ""} />)}</div>}
      </>
    );
  } else if (m.type === "quick") {
    const rs = (c.racts || (c.replies || []).map((t) => ({ title: t, kind: "text" })));
    body = (
      <>
        {c.text ? <div className="mpv-bub bot" dir="auto"><Rich text={fill(c.text)} /></div> : <div className="mpv-bub bot mpv-ph">Your question</div>}
        {!gone && rs.length > 0 && (
          <div className="mpv-q">
            {rs.map((r, i) => (
              <button
                key={i}
                type="button"
                className="mpv-pill"
                onClick={() => {
                  if (r.kind === "phone") tap("+1 555 0100", "Filled in from their Instagram profile");
                  else if (r.kind === "email") tap(`${name.toLowerCase()}@example.com`, "Filled in from their Instagram profile");
                  else tap(r.title, r.payload ? `Sends tap code “${r.payload}” to your automation` : "");
                  setGone(true);
                }}
              >
                {r.kind === "phone" && <Phone size={14} />}
                {r.kind === "email" && <Mail size={14} />}
                <span dir="auto">{r.title}</span>
              </button>
            ))}
          </div>
        )}
      </>
    );
  }

  const limits =
    m.type === "text" ? `${mpvBytes(c.text).toLocaleString("en-US")} of 1,000 bytes`
    : m.type === "button" ? `${mpvChars(c.text).toLocaleString("en-US")} of 640 characters, ${(c.buttons || []).length} of 3 buttons`
    : m.type === "generic" ? `${(c.cards || []).length} of 10 cards`
    : m.type === "quick" ? `${(c.replies || []).length} of 13 replies`
    : `${(c.names || []).length} ${(c.names || []).length === 1 ? "file" : "files"}`;

  return (
    <div className="scrim" onClick={onClose}>
      <div className="sheet tall" role="dialog" aria-modal="true" aria-label="Message preview" onClick={(e) => e.stopPropagation()}>
        <div className="grab" />
        <div className="sh-head" style={{ padding: "0 16px" }}>
          <h2>Preview</h2>
          <button type="button" className="icon-btn sm" aria-label="Close" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="mpv-ctl">
          <div className="mpv-row">
            <div className="mpv-seg" role="group" aria-label="Device">
              <button type="button" aria-pressed={device === "mobile"} onClick={() => setDevice("mobile")}><Smartphone size={16} /> Mobile</button>
              <button type="button" aria-pressed={device === "desktop"} onClick={() => setDevice("desktop")}><Monitor size={16} /> Desktop</button>
            </div>
            <button type="button" className="mpv-iconbtn" aria-label="Replay preview" onClick={reset}><RefreshCw size={18} /></button>
          </div>
          <div className="mpv-row">
            <label className="mpv-in" style={{ flex: 2 }}>They send<input dir="auto" value={they} onChange={(e) => setThey(e.target.value)} /></label>
            <label className="mpv-in">Preview as<input dir="auto" value={who} onChange={(e) => setWho(e.target.value)} /></label>
          </div>
        </div>

        <div className="mpv-ig">
          <div className="mpv-igh">
            {channel ? <ChannelAvatar ch={channel} /> : <span className="cav">Y</span>}
            <div>{channel ? channel.name : "Your account"}<small>Instagram</small></div>
          </div>
          <div className="mpv-chat" ref={chatRef}>
            {they.trim() && <div className="mpv-bub me" dir="auto">{they}</div>}
            <div className="mpv-us">{body}</div>
            {log.map((l) => (
              <Fragment key={l.id}>
                <div className="mpv-bub me" dir="auto">{l.text}</div>
                {l.note && <span className="mpv-note">{l.note}</span>}
              </Fragment>
            ))}
          </div>
          <div className="mpv-composer">Message…</div>
          {snack && <div className="mpv-snack" role="status">{snack}</div>}
        </div>

        <div className="mpv-foot">
          <span className="mpv-lim">{limits}</span>
          {(issues || []).map((t, i) => <div className="mpv-iss" key={i}><AlertTriangle size={16} /><span>{t}</span></div>)}
        </div>
      </div>
    </div>
  );
}

/* ═════════ HomeMod ═════════ */
const HomeMod = (() => {
const CSS = ".sc-home .scr{flex:1;overflow-y:auto;overscroll-behavior:contain}\n.sc-home .hdr{display:flex;align-items:center;justify-content:space-between;padding:14px 20px 8px}\n.sc-home .brand{font-size:22px;font-weight:700;letter-spacing:-.02em}\n.sc-home .icon-btn{width:44px;height:44px;border-radius:14px;background:transparent;border:0;color:var(--text);display:grid;place-items:center;position:relative;cursor:pointer;flex:none}\n.sc-home .icon-btn.sm{width:40px;height:40px;border-radius:12px;color:var(--muted)}\n.sc-home .dot{position:absolute;top:10px;right:11px;width:9px;height:9px;border-radius:50%;background:var(--blue);border:2px solid var(--night)}\n.sc-home .body{padding:8px 16px 20px;display:flex;flex-direction:column;gap:22px}\n.sc-home .card{background:var(--panel);border:1px solid var(--line);border-radius:20px;padding:16px}\n.sc-home .row{display:flex;align-items:center}\n.sc-home .between{justify-content:space-between}\n.sc-home .muted{color:var(--muted)}\n.sc-home .sm{font-size:13px}\n.sc-home .hero-title{margin:0;font-size:15px;font-weight:600}\n.sc-home .seg{display:inline-flex;background:var(--night);border-radius:12px;padding:3px;gap:2px}\n.sc-home .seg.full{display:flex}\n.sc-home .seg.full button{flex:1}\n.sc-home .seg button{border:0;background:transparent;color:var(--muted);font-size:13px;font-weight:600;padding:7px 12px;border-radius:9px;cursor:pointer;min-height:34px}\n.sc-home .seg button[aria-pressed=true]{background:var(--panel2);color:var(--text)}\n.sc-home .big-row{display:flex;align-items:baseline;gap:10px;margin:20px 0 18px;flex-wrap:wrap}\n.sc-home .big{font-size:54px;line-height:1;font-weight:700;letter-spacing:-.03em;font-variant-numeric:tabular-nums}\n.sc-home .delta{display:inline-flex;align-items:center;gap:2px;font-size:13px;font-weight:700;padding:4px 9px 4px 6px;border-radius:999px;align-self:center}\n.sc-home .delta.down{color:var(--red);background:rgba(255,107,107,.12)}\n.sc-home .delta.up{color:var(--mint);background:rgba(79,216,160,.12)}\n.sc-home .vs{font-size:13px;color:var(--muted);align-self:center}\n.sc-home .bar{display:flex;gap:3px;height:12px;margin-bottom:16px}\n.sc-home .bar span{border-radius:4px;min-width:6px;transition:width .35s}\n.sc-home .legend{list-style:none;margin:0 0 16px;padding:0;display:grid;grid-template-columns:1fr 1fr;gap:10px 22px}\n.sc-home .legend li{display:flex;align-items:center;gap:8px;font-size:14px}\n.sc-home .legend i{width:10px;height:10px;border-radius:3px;flex:none}\n.sc-home .legend b{margin-left:auto;font-variant-numeric:tabular-nums;font-weight:600}\n.sc-home .skipped{width:100%;display:flex;align-items:center;gap:10px;background:rgba(255,180,84,.1);border:1px solid rgba(255,180,84,.28);color:var(--text);border-radius:14px;padding:12px;font-size:14px;cursor:pointer;text-align:left;min-height:48px}\n.sc-home .skipped svg:first-child{color:var(--amber);flex:none}\n.sc-home .skipped span{flex:1}\n.sc-home .skipped b{color:var(--amber);font-variant-numeric:tabular-nums}\n.sc-home .sec-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}\n.sc-home .sec-head h2{margin:0;font-size:18px;font-weight:700}\n.sc-home .primary{background:var(--blue);color:#0B1020;border:0;border-radius:14px;font-weight:700;font-size:15px;min-height:50px;padding:0 18px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px}\n.sc-home .primary.sm{min-height:42px;padding:0 14px 0 12px;font-size:14px;border-radius:12px}\n.sc-home .primary:disabled{background:var(--panel2);color:var(--muted);cursor:not-allowed}\n.sc-home .auto{display:flex;flex-direction:column;gap:12px;margin-bottom:12px}\n.sc-home .auto h3{margin:0;font-size:16px;font-weight:600}\n.sc-home .auto p{margin:3px 0 0}\n.sc-home .top{align-items:flex-start;gap:12px}\n.sc-home .trigs{display:flex;flex-wrap:wrap;gap:6px}\n.sc-home .tchip{display:inline-flex;align-items:center;gap:5px;font-size:12.5px;color:#C4CCE0;background:var(--panel2);border-radius:999px;padding:5px 10px 5px 8px}\n.sc-home .cond{display:flex;flex-wrap:wrap;align-items:center;gap:6px;border-left:3px solid var(--amber);background:rgba(255,180,84,.07);border-radius:4px 12px 12px 4px;padding:9px 10px}\n.sc-home .cond-l{font-size:12.5px;font-weight:700;color:var(--amber);margin-right:2px}\n.sc-home .cchip{font-size:12.5px;background:rgba(255,180,84,.14);color:#FFD9A6;border-radius:999px;padding:3px 9px}\n.sc-home .cond.empty{width:100%;border:1px dashed var(--line);border-left:3px solid var(--line);background:transparent;color:var(--muted);font-size:13.5px;text-align:left;cursor:pointer;min-height:44px;justify-content:space-between;flex-wrap:nowrap}\n.sc-home .cond.empty .lnk{color:var(--amber);font-weight:600}\n.sc-home .stats{display:grid;grid-template-columns:repeat(3,1fr);margin:0;padding-top:12px;border-top:1px solid var(--line)}\n.sc-home .stats div{display:flex;flex-direction:column;gap:2px}\n.sc-home .stats dt{order:2;font-size:12.5px;color:var(--muted)}\n.sc-home .stats dd{margin:0;font-size:19px;font-weight:700;font-variant-numeric:tabular-nums}\n.sc-home .auto.off h3,.sc-home .auto.off .stats dd{color:var(--muted)}\n.sc-home .more{width:100%;background:transparent;border:0;color:var(--blue);font-weight:600;font-size:15px;min-height:46px;cursor:pointer}\n.sc-home .sw{width:50px;height:30px;border-radius:999px;border:0;background:#334060;position:relative;cursor:pointer;flex:none;padding:0;transition:background .2s}\n.sc-home .sw::after{content:'';position:absolute;top:3px;left:3px;width:24px;height:24px;border-radius:50%;background:#fff;transition:transform .2s}\n.sc-home .sw[aria-checked=true]{background:var(--mint)}\n.sc-home .sw[aria-checked=true]::after{transform:translateX(20px)}\n.sc-home .nav{display:grid;grid-template-columns:repeat(3,1fr);border-top:1px solid var(--line);background:var(--panel);padding:6px 8px 10px}\n.sc-home .nav button{background:transparent;border:0;color:var(--muted);font-size:12px;font-weight:600;display:flex;flex-direction:column;align-items:center;gap:3px;padding:6px 0;min-height:54px;cursor:pointer;border-radius:12px}\n.sc-home .nav button[aria-current=page]{color:var(--blue)}\n.sc-home /* editor */\n.ed-top{display:flex;align-items:center;gap:4px;padding:10px 12px 6px}\n.sc-home .ed-top h1{margin:0;font-size:19px;font-weight:700}\n.sc-home .ed-scroll{padding:8px 16px 24px}\n.sc-home .field{display:flex;flex-direction:column;gap:6px;margin-bottom:24px;font-size:13px;color:var(--muted)}\n.sc-home .inp{background:var(--panel);border:1px solid var(--line);border-radius:12px;color:var(--text);font:inherit;font-size:15px;padding:12px 14px;min-height:48px;width:100%;color-scheme:dark}\n.sc-home textarea.inp{resize:none;line-height:1.5;min-height:96px}\n.sc-home .flow{list-style:none;margin:0;padding:0 0 0 26px}\n.sc-home .step{position:relative;padding-bottom:28px}\n.sc-home .step:last-child{padding-bottom:4px}\n.sc-home .step::before{content:'';position:absolute;left:-20px;top:20px;bottom:-4px;width:2px;background:var(--line)}\n.sc-home .step:last-child::before{display:none}\n.sc-home .node{position:absolute;left:-27px;top:4px;width:16px;height:16px;border-radius:50%;background:var(--night);border:3px solid var(--c)}\n.sc-home .step.blue{--c:var(--blue)}\n.sc-home .step.amber{--c:var(--amber)}\n.sc-home .step.mint{--c:var(--mint)}\n.sc-home .step-h{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;min-height:32px}\n.sc-home .step-h h3{margin:0;font-size:16px;font-weight:700}\n.sc-home .hint,.sc-home .note{font-size:13.5px;color:var(--muted);margin:0 0 12px;line-height:1.45}\n.sc-home .note{margin:0}\n.sc-home .note.warn{color:var(--amber)}\n.sc-home .tgrid{display:grid;grid-template-columns:1fr 1fr;gap:8px}\n.sc-home .tbtn{display:flex;align-items:center;gap:8px;background:var(--panel);border:1px solid var(--line);color:var(--muted);border-radius:14px;padding:0 12px;min-height:54px;font-size:14px;font-weight:600;cursor:pointer;text-align:left}\n.sc-home .tbtn[aria-pressed=true]{border-color:var(--blue);background:rgba(91,140,255,.12);color:var(--text)}\n.sc-home .tbtn .tick{margin-left:auto;color:var(--blue);flex:none}\n.sc-home .ccard{background:var(--panel);border:1px solid var(--line);border-left:3px solid var(--amber);border-radius:6px 16px 16px 6px;padding:10px 12px 14px}\n.sc-home .ccard.fresh{animation:pop 1s ease-out}\n@keyframes pop{0%{background:rgba(255,180,84,.3)}100%{background:var(--panel)}}\n.sc-home .c-head{display:flex;align-items:center;gap:10px;margin-bottom:10px}\n.sc-home .c-head b{flex:1;font-size:15px;font-weight:600}\n.sc-home .c-ico{width:32px;height:32px;border-radius:10px;background:rgba(255,180,84,.14);color:var(--amber);display:grid;place-items:center;flex:none}\n.sc-home .joiner{display:flex;justify-content:center;margin:8px 0}\n.sc-home .joiner span{font-size:12px;font-weight:700;color:var(--amber);background:rgba(255,180,84,.12);padding:3px 14px;border-radius:999px}\n.sc-home .add-cond{width:100%;min-height:54px;margin-top:12px;border:1.5px dashed rgba(255,180,84,.55);background:rgba(255,180,84,.06);color:var(--amber);border-radius:14px;font-weight:700;font-size:15px;display:flex;align-items:center;justify-content:center;gap:8px;cursor:pointer}\n.sc-home .kw-list{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}\n.sc-home .kw{display:inline-flex;align-items:center;gap:2px;background:var(--panel2);border-radius:999px;padding:3px 3px 3px 12px;font-size:14px}\n.sc-home .kw button{border:0;background:transparent;color:var(--muted);width:30px;height:30px;border-radius:50%;display:grid;place-items:center;cursor:pointer}\n.sc-home .kw-add{display:flex;gap:8px}\n.sc-home .kw-add .inp{min-height:44px;padding:9px 12px;font-size:14px}\n.sc-home .btn2{border:1px solid var(--line);background:var(--panel2);color:var(--text);font-weight:600;font-size:14px;border-radius:12px;padding:0 16px;min-height:44px;cursor:pointer}\n.sc-home .btn2.pill{min-height:38px;border-radius:999px;padding:0 12px 0 10px;font-size:13px;display:inline-flex;align-items:center;gap:4px}\n.sc-home .row-inline{display:flex;align-items:center;gap:10px}\n.sc-home .time-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}\n.sc-home .time-row label{display:flex;flex-direction:column;gap:5px;font-size:12.5px;color:var(--muted)}\n.sc-home .pick7,.sc-home .pick3{display:grid;gap:5px}\n.sc-home .pick7{grid-template-columns:repeat(7,1fr)}\n.sc-home .pick3{grid-template-columns:repeat(3,1fr)}\n.sc-home .pick7 button,.sc-home .pick3 button{min-height:44px;border-radius:10px;border:1px solid var(--line);background:var(--night);color:var(--muted);font-size:12.5px;font-weight:600;cursor:pointer;padding:0 2px}\n.sc-home .pick7 button[aria-pressed=true],.sc-home .pick3 button[aria-pressed=true]{background:rgba(255,180,84,.16);border-color:rgba(255,180,84,.6);color:#FFD9A6}\n.sc-home .vars{display:flex;gap:6px;margin-top:8px;flex-wrap:wrap}\n.sc-home .ed-foot{border-top:1px solid var(--line);background:var(--panel);padding:12px 16px 14px;display:flex;flex-direction:column;gap:10px}\n.sc-home .sum{margin:0;font-size:13.5px;line-height:1.5;color:#C9D1E6;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}\n.sc-home .sum.warn{color:var(--amber)}\n.sc-home .scrim{position:absolute;inset:0;background:rgba(5,8,14,.62);display:flex;align-items:flex-end;z-index:5}\n.sc-home .sheet{width:100%;max-height:86%;overflow-y:auto;background:var(--panel);border-radius:26px 26px 0 0;border-top:1px solid var(--line);padding:8px 16px 22px;animation:up .24s ease-out;box-shadow:0 -16px 40px rgba(0,0,0,.4)}\n@keyframes up{from{transform:translateY(40px);opacity:.4}to{transform:none;opacity:1}}\n.sc-home .grab{width:40px;height:4px;border-radius:2px;background:var(--line);margin:4px auto 6px}\n.sc-home .sh-head{display:flex;align-items:center;justify-content:space-between}\n.sc-home .sh-head h2{margin:0;font-size:19px;font-weight:700}\n.sc-home .gt{font-size:13px;font-weight:600;color:var(--muted);margin:18px 0 4px}\n.sc-home .opt{width:100%;display:flex;align-items:center;gap:12px;background:transparent;border:0;border-radius:14px;padding:8px 6px;min-height:62px;color:var(--text);text-align:left;cursor:pointer}\n.sc-home .opt:hover:not(:disabled){background:var(--panel2)}\n.sc-home .opt:disabled{opacity:.5;cursor:default}\n.sc-home .opt .c-ico{width:40px;height:40px;border-radius:12px}\n.sc-home .opt .t{flex:1;display:flex;flex-direction:column;gap:2px}\n.sc-home .opt b{font-size:15px;font-weight:600}\n.sc-home .opt small{font-size:13px;color:var(--muted)}\n.sc-home .opt .end{color:var(--muted);font-size:13px;display:flex;align-items:center;gap:4px}\n.sc-home .toast-wrap{position:absolute;left:0;right:0;bottom:90px;display:flex;justify-content:center;z-index:9;pointer-events:none}\n.sc-home .toast{background:var(--mint);color:#062015;font-weight:700;font-size:14px;padding:10px 16px;border-radius:999px;display:flex;gap:6px;align-items:center;animation:up .2s ease-out}\n.sc-home .chan-chip{display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:0 10px 0 6px;border-radius:999px;border:1px solid var(--line);background:var(--panel);color:var(--text);font-size:14px;font-weight:600;cursor:pointer;max-width:170px}\n.sc-home .chan-chip .cname{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.sc-home .chan-chip .chv{color:var(--muted);flex:none}\n.sc-home .chan-chip.wide{width:100%;max-width:none;justify-content:flex-start;padding:8px 14px 8px 8px;min-height:58px;border-radius:16px;font-size:15.5px}\n.sc-home .chan-chip.wide .cname{flex:1;text-align:left}\n.sc-home .cav{width:32px;height:32px;border-radius:50%;display:grid;place-items:center;font-weight:700;font-size:14px;background:hsl(var(--h,220) 38% 26%);color:#E6ECFA;flex:none;position:relative}\n.sc-home .cav.lg{width:40px;height:40px;font-size:16px}\n.sc-home .cav .warn-dot{position:absolute;right:-1px;bottom:-1px;width:11px;height:11px;border-radius:50%;background:var(--amber);border:2px solid var(--panel)}\n.sc-home .crow{width:100%;display:flex;align-items:center;gap:12px;text-align:left;background:var(--night);border:1px solid var(--line);color:var(--text);border-radius:14px;padding:10px 14px;min-height:64px;cursor:pointer;margin-top:8px}\n.sc-home .crow[aria-pressed=true]{border-color:var(--blue);background:rgba(91,140,255,.12)}\n.sc-home .crow .ct{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}\n.sc-home .crow b{font-size:15.5px;font-weight:600}\n.sc-home .crow small{font-size:13px;color:var(--muted)}\n.sc-home .crow small.warn{color:var(--amber)}\n.sc-home .crow .tick{color:var(--blue);flex:none}\n.sc-home .crow.addc{border:1.5px dashed #3B486B;background:transparent;color:var(--blue);font-weight:700;justify-content:center;gap:8px}\n.sc-home .sh-link{background:transparent;border:0;color:var(--blue);font-weight:600;font-size:14.5px;min-height:44px;cursor:pointer;padding:0 4px;margin-top:6px}\n.sc-home .chan-banner{display:flex;align-items:center;gap:12px;margin:12px 16px 0;padding:12px 12px 12px 14px;border-left:3px solid var(--amber);background:rgba(255,180,84,.08);border-radius:4px 14px 14px 4px}\n.sc-home .chan-banner.inline{margin:10px 0 0}\n.sc-home .chan-banner p{margin:0;flex:1;font-size:13.5px;line-height:1.45;color:#FFE3BC}\n.sc-home .chan-banner button{flex:none;min-height:40px;border-radius:12px;border:1px solid rgba(255,180,84,.5);background:transparent;color:var(--amber);font-weight:700;font-size:14px;padding:0 14px;cursor:pointer}\n.sc-home .chan-field{margin-bottom:14px}\n.sc-home .lab.first{margin-top:0}\n.sc-home .row-hdr{display:flex;align-items:center;justify-content:space-between;gap:10px}\n.sc-home .hdr-r{display:flex;align-items:center;gap:2px}\n.sc-home .icon-btn.sm{width:40px;height:40px;border-radius:12px;color:var(--muted)}\n.sc-home .scrim{position:absolute;inset:0;background:rgba(5,8,14,.62);display:flex;align-items:flex-end;z-index:5}\n.sc-home .sheet{width:100%;max-height:88%;overflow-y:auto;background:var(--panel);border-radius:26px 26px 0 0;border-top:1px solid var(--line);padding:8px 16px 20px;animation:up .24s ease-out;box-shadow:0 -16px 40px rgba(0,0,0,.4)}\n.sc-home .grab{width:40px;height:4px;border-radius:2px;background:var(--line);margin:4px auto 6px}\n.sc-home .sh-head{display:flex;align-items:center;justify-content:space-between;gap:8px}\n.sc-home .sh-head h2{margin:0;font-size:19px;font-weight:700}\n.sc-home .sk{display:block;background:linear-gradient(90deg,var(--panel2) 0%,#27324C 50%,var(--panel2) 100%);background-size:200% 100%;animation:shimmer 1.4s ease-in-out infinite}\n.sc-home .skcard{background:var(--panel);border:1px solid var(--line);border-radius:20px;padding:16px;display:flex;flex-direction:column;gap:12px}\n.sc-home .skrow{display:flex;align-items:center;gap:12px}\n.sc-home .errcard{display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px;padding:32px 20px;background:var(--panel);border:1px dashed #3B486B;border-radius:20px}\n.sc-home .errcard .eico{width:52px;height:52px;border-radius:50%;background:rgba(255,180,84,.14);color:var(--amber);display:grid;place-items:center;margin-bottom:6px}\n.sc-home .errcard h3{margin:0;font-size:17px}\n.sc-home .errcard p{margin:0 0 10px;font-size:14px;line-height:1.5;color:var(--muted);max-width:280px}\n.sc-home .errcard .retry{min-height:44px;border-radius:12px;border:1px solid var(--line);background:var(--panel2);color:var(--text);font-weight:700;font-size:14.5px;padding:0 18px;cursor:pointer;display:inline-flex;align-items:center;gap:8px}\n.sc-home .bspin{width:18px;height:18px;border-radius:50%;border:2.5px solid rgba(11,16,32,.25);border-top-color:#0B1020;animation:spinr .8s linear infinite;flex:none}\n.sc-home .inline-err{display:flex;align-items:flex-start;gap:8px;font-size:13.5px;line-height:1.45;color:var(--amber);margin:0}\n.sc-home .inline-err svg{flex:none;margin-top:2px}\n.sc-home .ubar{display:block;height:4px;border-radius:2px;background:var(--panel2);overflow:hidden;margin-top:6px}\n.sc-home .ubar i{display:block;height:100%;width:0;background:var(--blue);animation:fillbar linear forwards}\n.sc-home .fitem .rt small.bad{color:var(--amber)}\n.sc-home .retry-link{background:transparent;border:0;color:var(--blue);font-weight:700;font-size:13.5px;min-height:40px;padding:0 8px;cursor:pointer}\n.sc-home .primary .bspin{margin-right:2px}\n.sc-home .metanote{display:flex;gap:8px;align-items:flex-start;font-size:13px;line-height:1.5;color:var(--muted);margin:14px 0 0}\n.sc-home .metanote svg{flex:none;margin-top:2px;color:var(--blue)}\n.sc-home .metanote.warn{color:#FFE3BC}\n.sc-home .metanote.warn svg{color:var(--amber)}\n.sc-home .chipset{display:flex;flex-wrap:wrap;gap:6px}\n.sc-home .chipset button{min-height:40px;padding:0 14px;border-radius:999px;border:1px solid var(--line);background:var(--night);color:var(--muted);font-size:13.5px;font-weight:600;cursor:pointer}\n.sc-home .chipset button[aria-pressed=true]{border-color:var(--blue);background:rgba(91,140,255,.12);color:var(--text)}\n.sc-home .sw:disabled{opacity:.4;cursor:not-allowed}\n.sc-home .stepper{padding-left:14px;padding-right:14px}\n.sc-home .st{width:64px}\n.sc-home .st span{font-size:11.5px}\n.sc-home .card.auto.clickable,.sc-home .card.msg.clickable{cursor:pointer}\n.sc-home .row2{display:flex;align-items:center;justify-content:space-between;gap:8px}\n.sc-home .text-btn{background:transparent;border:0;color:var(--blue);font-weight:600;font-size:14px;min-height:40px;padding:0 6px;cursor:pointer;display:inline-flex;align-items:center;gap:6px}\n.sc-home .big-warn{width:68px;height:68px;border-radius:50%;background:rgba(255,180,84,.14);color:var(--amber);display:grid;place-items:center}\n";
const HOME_EXTRA = ".sc-home .nochan{text-align:center;display:flex;flex-direction:column;align-items:center;gap:8px;padding:26px 20px}.sc-home .nochan h2{margin:0;font-size:17px;color:var(--text)}.sc-home .nochan p{margin:0 0 10px;font-size:14px;line-height:1.5;color:var(--muted)}.sc-home .viewall{width:100%;display:flex;align-items:center;gap:10px;background:var(--night);border:1px solid var(--line);color:var(--text);border-radius:14px;padding:12px;font-size:14px;cursor:pointer;text-align:left;min-height:48px;margin-top:8px}.sc-home .viewall span{flex:1}.sc-home .viewall svg:first-child{color:var(--blue)}.sc-home .rsn{display:flex;gap:14px;padding:14px 0;border-top:1px solid var(--line)}.sc-home .rsn .rn{min-width:48px;font-size:20px;font-variant-numeric:tabular-nums}.sc-home .rsn h3{margin:0;font-size:15px}.sc-home .rsn p{margin:3px 0 0;font-size:13.5px;line-height:1.45;color:var(--muted)}";

const TRIGGERS = [
  { key: "direct", short: "Direct", icon: Send },
  { key: "story", short: "Story reply", icon: Reply },
  { key: "comment", short: "Comment", icon: MessageCircle },
  { key: "share", short: "Media share", icon: Share2 },
];

const RANGES = {
  Day: { total: "238", delta: -25, vs: "vs. yesterday", skipped: { c: 41, w: 6, d: 9, l: 0 }, mix: [60, 30, 7, 3] },
  Week: { total: "1,642", delta: -8, vs: "vs. last week", skipped: { c: 274, w: 38, d: 61, l: 12 }, mix: [57, 33, 7, 3] },
  Month: { total: "6,904", delta: 12, vs: "vs. last month", skipped: { c: 1120, w: 150, d: 240, l: 48 }, mix: [58, 31, 8, 3] },
};

const STATS2 = {
  Day: { total: "96", delta: 12, vs: "vs. yesterday", skipped: { c: 9, w: 2, d: 3, l: 0 }, mix: [48, 40, 8, 4] },
  Week: { total: "612", delta: 5, vs: "vs. last week", skipped: { c: 71, w: 11, d: 18, l: 2 }, mix: [50, 38, 8, 4] },
  Month: { total: "2,310", delta: -3, vs: "vs. last month", skipped: { c: 260, w: 40, d: 66, l: 9 }, mix: [49, 39, 8, 4] },
};
const ZERO = {
  Day: { total: "0", delta: 0, vs: "vs. yesterday", skipped: { c: 0, w: 0, d: 0, l: 0 }, mix: [0, 0, 0, 0] },
  Week: { total: "0", delta: 0, vs: "vs. last week", skipped: { c: 0, w: 0, d: 0, l: 0 }, mix: [0, 0, 0, 0] },
  Month: { total: "0", delta: 0, vs: "vs. last month", skipped: { c: 0, w: 0, d: 0, l: 0 }, mix: [0, 0, 0, 0] },
};
const STATS = { 1: RANGES, 2: STATS2 };

const REASONS = [
  { k: "c", t: "Conditions didn’t match", d: "The message didn’t match your rules. Nothing to fix." },
  { k: "w", t: "24-hour window closed", d: "The person hadn’t messaged in 24 hours. Instagram doesn’t allow an automated reply after that." },
  { k: "d", t: "Already replied to that comment", d: "Instagram allows one private reply per comment." },
  { k: "l", t: "Waiting for Instagram’s limit", d: "Comment replies are limited to 750 per hour per account. Extra ones wait and go out when the limit resets." },
];

const MIX = [
  { label: "Direct", color: "#5B8CFF" },
  { label: "Comment", color: "#6FD3E8" },
  { label: "Story reply", color: "#9B8CFF" },
  { label: "Share", color: "#6B7691" },
];

function Seg({ options, value, onChange, label }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.v} type="button" aria-pressed={value === o.v} onClick={() => onChange(o.v)}>{o.l}</button>
      ))}
    </div>
  );
}

function Switch({ on, onChange, label }) {
  return <button type="button" role="switch" aria-checked={on} aria-label={label} className="sw" onClick={onChange} />;
}

function HomeSkeleton() {
  return (
    <div className="body" role="status" aria-busy="true" aria-label="Loading">
      <div className="skcard">
        <div className="skrow"><Skeleton h={18} w={110} /><span style={{ flex: 1 }} /><Skeleton h={34} w={150} r={12} /></div>
        <Skeleton h={54} w={150} r={10} />
        <Skeleton h={12} r={6} />
        <div className="skrow"><Skeleton h={14} w="46%" /><Skeleton h={14} w="46%" /></div>
        <div className="skrow"><Skeleton h={14} w="46%" /><Skeleton h={14} w="46%" /></div>
        <Skeleton h={48} r={14} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <Skeleton h={22} w={130} style={{ marginBottom: 2 }} />
        {[0, 1].map((i) => (
          <div key={i} className="skcard">
            <div className="skrow"><Skeleton h={18} w="55%" /><span style={{ flex: 1 }} /><Skeleton h={28} w={50} r={14} /></div>
            <div className="skrow"><Skeleton h={26} w={72} r={13} /><Skeleton h={26} w={72} r={13} /></div>
            <div className="skrow"><Skeleton h={22} w={54} /><Skeleton h={22} w={54} /><Skeleton h={22} w={54} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HomeScreen(props) {
  const nav = useContext(NavCtx);
  const chan = useContext(ChanCtx);
  const [ld, retryLoad] = useLoad("home|" + chan.activeId, 800);
  const [range, setRange] = useState("Day");
  const [sheet, setSheet] = useState(false);
  const R = (STATS[chan.activeId] || ZERO)[range];
  const empty = R.total === "0";
  const notSent = R.skipped.c + R.skipped.w + R.skipped.d + R.skipped.l;
  const [reasons, setReasons] = useState(false);
  const shown = props.autos.slice(0, 3);
  const noChannels = chan.channels.length === 0;
  return (
    <div className="sc-home screen">
      <style>{CSS + HOME_EXTRA}</style>
      <header className="hdr row-hdr">
        <span className="brand">YooChat</span>
        <div className="hdr-r">
          <ChannelChip ch={chan.active} onClick={() => (noChannels ? chan.goAdd() : setSheet(true))} />
          <button type="button" className="icon-btn" aria-label={props.unread ? `Notifications, ${props.unread} unread` : "Notifications"} onClick={() => nav("profile", { view: "inbox" })}>
            <Bell size={22} />
            {props.unread > 0 && <i className="dot" />}
          </button>
        </div>
      </header>

      {chan.active && chan.active.status !== "ok" && <ChannelBanner ch={chan.active} onFix={() => chan.goFix(chan.active.id)} />}

      <div className="scr">
        {noChannels ? (
          <div className="body">
            <section className="card nochan">
              <h2>Connect your first channel</h2>
              <p>Link an Instagram account to start replying to messages and comments.</p>
              <button type="button" className="primary" onClick={() => chan.goAdd()}>Add channel</button>
            </section>
          </div>
        ) : ld.status === "loading" ? (
          <HomeSkeleton />
        ) : ld.status === "error" ? (
          <div className="body"><LoadError err={ld.err} onRetry={retryLoad} what="your dashboard" /></div>
        ) : (
        <div className="body">
          <section className="card">
            <div className="row between">
              <h2 className="hero-title">Messages sent</h2>
              <Seg label="Time range" value={range} onChange={setRange} options={Object.keys(RANGES).map((k) => ({ v: k, l: k }))} />
            </div>

            <div className="big-row">
              <span className="big">{R.total}</span>
              {!empty && (
                <span className={"delta " + (R.delta < 0 ? "down" : "up")}>
                  {R.delta < 0 ? <ArrowDown size={14} strokeWidth={3} /> : <ArrowUp size={14} strokeWidth={3} />}
                  {Math.abs(R.delta)}%
                </span>
              )}
              <span className="vs">{empty ? "No replies sent yet" : R.vs}</span>
            </div>

            <div className="bar" role="img" aria-label={MIX.map((m, i) => `${m.label} ${R.mix[i]}%`).join(", ")}>
              {empty ? (
                <span style={{ width: "100%", background: "var(--panel2)" }} />
              ) : (
                MIX.map((m, i) => (
                  <span key={m.label} style={{ width: R.mix[i] + "%", background: m.color }} />
                ))
              )}
            </div>

            <ul className="legend">
              {MIX.map((m, i) => (
                <li key={m.label}>
                  <i style={{ background: m.color }} />
                  {m.label}
                  <b>{R.mix[i]}%</b>
                </li>
              ))}
            </ul>

            <button type="button" className="skipped" onClick={() => setReasons(true)}>
              <Filter size={18} />
              <span><b>{notSent.toLocaleString("en-US")}</b> not sent</span>
              <ChevronRight size={18} className="muted" />
            </button>
            <button type="button" className="viewall" onClick={() => props.onLog({})}>
              <History size={18} />
              <span>View all sent messages</span>
              <ChevronRight size={18} className="muted" />
            </button>
          </section>

          <section>
            <div className="sec-head">
              <h2>Automations</h2>
              <button type="button" className="primary sm" onClick={() => props.onNew()}>
                <Plus size={18} strokeWidth={2.6} /> New
              </button>
            </div>

            {shown.length === 0 && (
              <div className="card nochan">
                <h2>No automations on {chan.active ? chan.active.name : "this channel"} yet</h2>
                <p>Create one to reply to messages and comments automatically.</p>
                <button type="button" className="primary" onClick={() => props.onNew()}>Create automation</button>
              </div>
            )}

            {shown.map((a) => (
              <article key={a.id} className={"card auto clickable" + (a.on ? "" : " off")} onClick={() => props.onOpen(a.id)} tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" && e.target === e.currentTarget) props.onOpen(a.id); }}>
                <div className="row between top">
                  <div>
                    <h3 dir="auto">{a.name}</h3>
                    <p className="muted sm">Updated {a.when}</p>
                  </div>
                  <Switch on={a.on} onChange={(e) => { e.stopPropagation(); props.onToggle(a.id); }} label={`${a.name}: turn ${a.on ? "off" : "on"}`} />
                </div>

                <div className="trigs">
                  {TRIGGERS.filter((t) => a.triggers.includes(t.key)).map((t) => (
                    <span className="tchip" key={t.key}><t.icon size={14} />{t.short}</span>
                  ))}
                </div>

                {a.conds.length ? (
                  <div className="cond">
                    <span className="cond-l">Only if</span>
                    {a.conds.map((c, i) => (
                      <span className="cchip" key={i} dir="auto">{c}</span>
                    ))}
                  </div>
                ) : (
                  <button type="button" className="cond empty" onClick={(e) => { e.stopPropagation(); props.onNew(); }}>
                    Sends to everyone
                    <span className="lnk">Add condition</span>
                  </button>
                )}

                <dl className="stats">
                  <div><dt>Sends</dt><dd>{a.stats[0]}</dd></div>
                  <div><dt>Clicks</dt><dd>{a.stats[1]}</dd></div>
                  <div><dt>Follows</dt><dd>{a.stats[2] == null ? "–" : a.stats[2]}</dd></div>
                </dl>
              </article>
            ))}

            {shown.length > 0 && <button type="button" className="more" onClick={() => props.onAll()}>View all automations</button>}
          </section>
        </div>
        )}
      </div>

      {reasons && (
        <div className="scrim" onClick={() => setReasons(false)}>
          <div className="sheet" role="dialog" aria-modal="true" aria-label="Why messages weren’t sent" onClick={(e) => e.stopPropagation()}>
            <div className="grab" />
            <div className="sh-head">
              <h2>{notSent === 0 ? "Everything was sent" : `Why ${notSent.toLocaleString("en-US")} weren’t sent`}</h2>
              <button type="button" className="icon-btn sm" aria-label="Close" onClick={() => setReasons(false)}><X size={20} /></button>
            </div>
            <div style={{ marginTop: 6 }}>
              {REASONS.map((r) => (
                <div className="rsn" key={r.k}>
                  <b className="rn">{R.skipped[r.k].toLocaleString("en-US")}</b>
                  <div>
                    <h3>{r.t}</h3>
                    <p>{r.d}</p>
                  </div>
                </div>
              ))}
            </div>
            {notSent > 0 && (
              <button type="button" className="primary" style={{ marginTop: 14, width: "100%" }} onClick={() => { setReasons(false); props.onLog({ status: "notsent" }); }}>See these messages</button>
            )}
          </div>
        </div>
      )}

      {sheet && (
        <ChannelSheet
          channels={chan.channels}
          activeId={chan.activeId}
          onClose={() => setSheet(false)}
          onPick={(id) => { chan.setActive(id); setSheet(false); }}
          onAdd={() => { setSheet(false); chan.goAdd(); }}
          onManage={() => { setSheet(false); chan.goManage(); }}
        />
      )}

      <nav className="nav" aria-label="Main">
        <button type="button" aria-current="page"><Home size={22} />Home</button>
        <button type="button" onClick={() => nav("automation")}><Sparkles size={22} />Automation</button>
        <button type="button" onClick={() => nav("profile")}><User size={22} />Profile</button>
      </nav>
    </div>
  );
}

return { Component: HomeScreen };

})();

/* ═════════ AutoMod ═════════ */
const AutoMod = (() => {

/* ───────────── data ───────────── */

const TRIGGERS = [
  { key: "direct", label: "Direct", icon: Send },
  { key: "story", label: "Story", full: "Story reply", icon: Reply },
  { key: "share", label: "Share", full: "Media share", icon: Share2 },
  { key: "comment", label: "Comment", icon: MessageCircle },
];
const TMAP = Object.fromEntries(TRIGGERS.map((t) => [t.key, t]));

const MSG_TYPES = [
  { key: "generic", label: "Generic", icon: Layers },
  { key: "text", label: "Text", icon: Type },
  { key: "media", label: "Media", icon: ImageIcon },
  { key: "button", label: "Button & text", icon: MousePointerClick },
  { key: "quick", label: "Quick reply", icon: Zap },
];
const MMAP = Object.fromEntries(MSG_TYPES.map((t) => [t.key, t]));

const EXTRAS = [
  { key: "follow", label: "Follow" },
  { key: "reminder", label: "Reminder" },
  { key: "limit", label: "Limit" },
  { key: "comment", label: "Reply comment" },
  { key: "like", label: "Like" },
  { key: "notice", label: "Automated notice" },
  { key: "handoff", label: "Human handoff" },
];

let _id = 100;
const uid = () => ++_id;

const SEED_AUTOS = [
  { id: 1, name: "Comment Automation #104", when: "1 hour ago", on: true, triggers: ["comment"], types: ["text"], extras: ["limit"], conds: [], stats: [200, 124, 63] },
  { id: 2, name: "Comment Automation #114", when: "1 hour ago", on: true, triggers: ["direct", "story", "share", "comment"], types: ["generic", "text"], extras: ["follow", "like"], conds: ["Contains “price”"], stats: [200, 124, 63] },
  { id: 3, name: "Comment Automation #124", when: "1 hour ago", on: true, triggers: ["direct", "story", "comment"], types: ["button"], extras: [], conds: [], stats: [200, 124, null] },
  { id: 4, name: "Comment Automation #134", when: "1 hour ago", on: false, triggers: ["story", "share", "comment"], types: ["quick"], extras: ["reminder", "notice"], conds: [], stats: [200, 124, 63] },
  { id: 5, name: "New Follower Reply #83", when: "3 days ago", on: true, triggers: ["direct", "story", "share"], types: ["text"], extras: ["follow", "notice", "handoff"], conds: ["Follows you", "First message"], stats: [1240, 402, 96] },
];

const SEED_MSGS = [
  { id: 1, name: "Price list", type: "text", preview: "Hi {first_name}! Our prices start at $20. Want the full list?", used: 3, content: { text: "Hi {first_name}! Our prices start at $20. Want the full list?" } },
  { id: 2, name: "Summer collection", type: "generic", preview: "3 cards", used: 1, content: { cards: [{ title: "Summer dress", subtitle: "From $20", buttons: ["View", "Buy"] }, { title: "Linen shirt", subtitle: "From $24", buttons: ["View"] }, { title: "Sandals", subtitle: "From $18", buttons: ["View"] }] } },
  { id: 3, name: "Catalog PDF", type: "media", preview: "PDF, 2.4 MB", used: 1, content: { kind: "file", names: ["catalog.pdf"] } },
  { id: 4, name: "Talk to us", type: "button", preview: "What can we help you with?", used: 2, content: { text: "What can we help you with?", buttons: ["View prices", "Talk to us"] } },
  { id: 5, name: "Interested?", type: "quick", preview: "4 replies", used: 1, content: { text: "Are you interested?", replies: ["Yes", "Maybe later", "No", "Call me"] } },
  { id: 6, name: "Welcome", type: "text", preview: "Hi! Thanks for messaging us. We’ll get back to you soon.", used: 0, content: { text: "Hi! Thanks for messaging us. We’ll get back to you soon." } },
];

const SEED_CARDS = [
  { id: 1, title: "Summer collection", sub: "Prices start at $20", buttons: 2, hue: 30 },
  { id: 2, title: "Price list", sub: "See every product", buttons: 1, hue: 215 },
  { id: 3, title: "Free shipping", sub: "On orders over $50", buttons: 0, hue: 160 },
  { id: 4, title: "New arrivals", sub: "Fresh this week", buttons: 3, hue: 280 },
];

const TAB_LABEL = { autos: "New automation", msgs: "New message", cards: "New card" };
const EMPTY_F = { triggers: [], types: [], extras: [] };

/* ───────────── helpers ───────────── */

function matchAuto(a, { status, f, q }) {
  if (status !== "All" && (status === "Active") !== a.on) return false;
  if (f.triggers.length && !f.triggers.some((t) => a.triggers.includes(t))) return false;
  if (f.types.length && !f.types.some((t) => a.types.includes(t))) return false;
  if (f.extras.length && !f.extras.some((t) => a.extras.includes(t))) return false;
  if (q.trim() && !a.name.toLowerCase().includes(q.trim().toLowerCase())) return false;
  return true;
}

/* ───────────── small components ───────────── */

function Switch({ on, onChange, label }) {
  return <button type="button" role="switch" aria-checked={on} aria-label={label} className="sw" onClick={onChange} />;
}

function Sheet({ label, onClose, children }) {
  return (
    <div className="scrim" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={label} onClick={(e) => e.stopPropagation()}>
        <div className="grab" />
        {children}
      </div>
    </div>
  );
}

const SheetHead = ({ title, onClose }) => (
  <div className="sh-head">
    <h2>{title}</h2>
    <button type="button" className="icon-btn sm" aria-label="Close" onClick={onClose}><X size={20} /></button>
  </div>
);

function SearchBox({ value, onChange, placeholder }) {
  return (
    <div className="search">
      <Search size={18} />
      <input className="inp" dir="auto" type="text" value={value} placeholder={placeholder} aria-label={placeholder} onChange={(e) => onChange(e.target.value)} />
      {value && (
        <button type="button" className="clear" aria-label="Clear search" onClick={() => onChange("")}><X size={16} /></button>
      )}
    </div>
  );
}

function Kebab({ label, onClick }) {
  return (
    <button type="button" className="icon-btn sm" aria-label={label} onClick={(e) => { e.stopPropagation(); onClick(e); }}><MoreVertical size={20} /></button>
  );
}

function ChipGroup({ items, value, onToggle, label }) {
  return (
    <div className="chips" role="group" aria-label={label}>
      {items.map((it) => (
        <button key={it.key} type="button" className="chipb" aria-pressed={value.includes(it.key)} onClick={() => onToggle(it.key)}>
          {it.label}
        </button>
      ))}
    </div>
  );
}

/* ───────────── sheets ───────────── */

function FilterSheet({ initial, onApply, onClose, countFor }) {
  const [d, setD] = useState(initial);
  const tog = (k, v) => setD((o) => ({ ...o, [k]: o[k].includes(v) ? o[k].filter((x) => x !== v) : [...o[k], v] }));
  const n = countFor(d);
  return (
    <Sheet label="Filters" onClose={onClose}>
      <SheetHead title="Filters" onClose={onClose} />
      <p className="gt">Trigger</p>
      <ChipGroup label="Trigger" items={TRIGGERS.map((t) => ({ key: t.key, label: t.full || t.label }))} value={d.triggers} onToggle={(v) => tog("triggers", v)} />
      <p className="gt">Message type</p>
      <ChipGroup label="Message type" items={MSG_TYPES} value={d.types} onToggle={(v) => tog("types", v)} />
      <p className="gt">Extras</p>
      <ChipGroup label="Extras" items={EXTRAS} value={d.extras} onToggle={(v) => tog("extras", v)} />
      <div className="btns">
        <button type="button" className="ghost" onClick={() => setD(EMPTY_F)}>Clear</button>
        <button type="button" className="primary" onClick={() => onApply(d)}>
          {n === 0 ? "No results" : `Show ${n} ${n === 1 ? "result" : "results"}`}
        </button>
      </div>
    </Sheet>
  );
}

function MenuSheet({ title, onEdit, onDuplicate, onDelete, onClose }) {
  return (
    <Sheet label={title} onClose={onClose}>
      <SheetHead title={title} onClose={onClose} />
      <div className="mlist">
        <button type="button" className="mrow" onClick={onEdit}><Pencil size={20} /><span>Edit</span></button>
        <button type="button" className="mrow" onClick={onDuplicate}><Copy size={20} /><span>Duplicate</span></button>
        <button type="button" className="mrow del" onClick={onDelete}><Trash2 size={20} /><span>Delete</span></button>
      </div>
    </Sheet>
  );
}

function ConfirmSheet({ cfg, onClose }) {
  return (
    <Sheet label={cfg.title} onClose={onClose}>
      <SheetHead title={cfg.title} onClose={onClose} />
      <p className="note">{cfg.body}</p>
      <div className="stack">
        <button type="button" className="danger solid" onClick={cfg.onConfirm}>{cfg.label}</button>
        <button type="button" className="ghost" onClick={onClose}>Cancel</button>
      </div>
    </Sheet>
  );
}

/* ───────────── lists ───────────── */

function AutoCard({ a, onToggle, onMenu, onOpen }) {
  return (
    <article className={"card auto clickable" + (a.on ? "" : " off")} onClick={onOpen} tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" && e.target === e.currentTarget) onOpen(); }}>
      <div className="top">
        <div className="rt">
          <h3 dir="auto">{a.name}</h3>
        </div>
        <Kebab label={`${a.name}: more actions`} onClick={onMenu} />
      </div>
      <div className="meta-row">
        <p>Updated {a.when}</p>
        <label className="state" onClick={(e) => e.stopPropagation()}>
          {a.on ? "Active" : "Paused"}
          <Switch on={a.on} onChange={onToggle} label={`${a.name}: turn ${a.on ? "off" : "on"}`} />
        </label>
      </div>

      <div className="trigs">
        {a.triggers.length ? (
          a.triggers.map((k) => {
            const t = TMAP[k];
            return (
              <span className="tchip" key={k}><t.icon size={14} />{t.label}</span>
            );
          })
        ) : (
          <span className="tchip none">No triggers yet</span>
        )}
      </div>

      {a.conds.length > 0 && (
        <div className="cond">
          <span className="cond-l">Only if</span>
          {a.conds.map((c) => <span className="cchip" key={c} dir="auto">{c}</span>)}
        </div>
      )}

      <dl className="stats">
        <div><dt>Sends</dt><dd>{a.stats[0].toLocaleString("en-US")}</dd></div>
        <div><dt>Clicks</dt><dd>{a.stats[1].toLocaleString("en-US")}</dd></div>
        <div><dt>Follows</dt><dd className={a.stats[2] == null ? "dash" : ""}>{a.stats[2] == null ? "–" : a.stats[2].toLocaleString("en-US")}</dd></div>
      </dl>
    </article>
  );
}

function MsgCard({ m, onMenu, onOpen }) {
  const T = MMAP[m.type];
  return (
    <article className="card msg clickable" onClick={onOpen} tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" && e.target === e.currentTarget) onOpen(); }}>
      <div className="top">
        <span className="ico"><T.icon size={20} /></span>
        <div className="rt">
          <h3 dir="auto">{m.name}</h3>
          <p>{T.label}</p>
        </div>
        <Kebab label={`${m.name}: more actions`} onClick={onMenu} />
      </div>
      <p className="prev clamp" dir="auto">{m.preview}</p>
      <p className="used">{m.used === 0 ? "Not used yet" : `Used in ${m.used} ${m.used === 1 ? "automation" : "automations"}`}</p>
    </article>
  );
}

function CardTile({ c, onMenu }) {
  return (
    <article className="ctile">
      <div className="cthumb" style={{ "--h": c.hue }}>
        <Layers size={26} />
        <button type="button" className="kb" aria-label={`${c.title}: more actions`} onClick={onMenu}><MoreVertical size={18} /></button>
      </div>
      <div className="cbody">
        <b dir="auto">{c.title}</b>
        <span dir="auto">{c.sub}</span>
        <small>{c.buttons === 0 ? "No buttons" : `${c.buttons} ${c.buttons === 1 ? "button" : "buttons"}`}</small>
      </div>
    </article>
  );
}

function Empty({ title, body, action, onAction }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      <p>{body}</p>
      {action && <button type="button" className="btn2" onClick={onAction}>{action}</button>}
    </div>
  );
}

/* ───────────── main ───────────── */

function AutomationTab(props) {
  const nav = useContext(NavCtx);
  const chan = useContext(ChanCtx);
  const [tab, setTab] = useState(props.initialTab || "autos");
  const [ld, retryLoad] = useLoad("auto|" + tab + "|" + chan.activeId, 700);
  const [qs, setQs] = useState({ autos: "", msgs: "", cards: "" });
  const [status, setStatus] = useState("All");
  const [f, setF] = useState(EMPTY_F);
  const [msgType, setMsgType] = useState("all");
  const { autos, setAutos, msgs, setMsgs, cards, setCards } = props;
  const [sheet, setSheet] = useState(null);
  const [toast, setToast] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const last = useRef(0);

  const q = qs[tab];
  const flash = (m) => {
    setToast(m);
    setTimeout(() => setToast(""), 2200);
  };
  const soon = () => flash("Not part of this mockup");
  const close = () => setSheet(null);
  const setQ = (v) => setQs((o) => ({ ...o, [tab]: v }));

  const onScroll = (e) => {
    const y = e.currentTarget.scrollTop;
    if (y > last.current + 8 && y > 40) setCollapsed(true);
    else if (y < last.current - 8) setCollapsed(false);
    last.current = y;
  };

  const nf = f.triggers.length + f.types.length + f.extras.length;
  const shownAutos = autos.filter((a) => matchAuto(a, { status, f, q: qs.autos }));
  const shownMsgs = msgs.filter((m) => (msgType === "all" || m.type === msgType) && (!qs.msgs.trim() || m.name.toLowerCase().includes(qs.msgs.trim().toLowerCase())));
  const shownCards = cards.filter((c) => !qs.cards.trim() || c.title.toLowerCase().includes(qs.cards.trim().toLowerCase()));

  const filterChips = [
    ...f.triggers.map((k) => ({ g: "triggers", k, l: TMAP[k].full || TMAP[k].label })),
    ...f.types.map((k) => ({ g: "types", k, l: MMAP[k].label })),
    ...f.extras.map((k) => ({ g: "extras", k, l: EXTRAS.find((e) => e.key === k).label })),
  ];

  const list = tab === "autos" ? autos : tab === "msgs" ? msgs : cards;
  const setList = tab === "autos" ? setAutos : tab === "msgs" ? setMsgs : setCards;
  const nameOf = (item) => item.name || item.title;

  const duplicate = (item) => {
    setList((l) => {
      const i = l.findIndex((x) => x.id === item.id);
      const copy = { ...item, id: uid() };
      if (copy.name) copy.name = `${item.name} copy`;
      if (copy.title) copy.title = `${item.title} copy`;
      if ("on" in copy) copy.on = false;
      const out = [...l];
      out.splice(i + 1, 0, copy);
      return out;
    });
    close();
    flash("Duplicated");
  };

  const askDelete = (item) =>
    setSheet({
      type: "confirm",
      cfg: {
        title: `Delete “${nameOf(item)}”?`,
        body: tab === "msgs" && item.used > 0 ? `It is used in ${item.used} ${item.used === 1 ? "automation" : "automations"}. Those will stop sending it.` : "This can’t be undone.",
        label: "Delete",
        onConfirm: () => {
          setList((l) => l.filter((x) => x.id !== item.id));
          close();
          flash("Deleted");
        },
      },
    });

  const menuItem = sheet?.type === "menu" ? list.find((x) => x.id === sheet.id) : null;

  const tabs = [
    { k: "autos", l: "Automations", n: autos.length },
    { k: "msgs", l: "Messages", n: msgs.length },
    { k: "cards", l: "Cards", n: cards.length },
  ];

  return (
    <div className="sc-auto screen">
      <style>{CSS}</style>
        <header className="hdr row-hdr">
          <h1>Automation</h1>
          <div className="hdr-r">
            <button type="button" className="icon-btn" aria-label="Sent messages" onClick={() => props.onLog({})}><History size={22} /></button>
            <ChannelChip ch={chan.active} onClick={() => (chan.channels.length ? setSheet({ type: "channel" }) : chan.goAdd())} />
          </div>
        </header>

        <div className="tabsbar" role="tablist" aria-label="Sections">
          {tabs.map((t) => (
            <button key={t.k} type="button" role="tab" className="tabb" aria-selected={tab === t.k} onClick={() => { setTab(t.k); setCollapsed(false); }}>
              {t.l}
              <span className="tcnt">{t.n}</span>
            </button>
          ))}
        </div>

        <div className="scr" onScroll={onScroll}>
          {chan.active && chan.active.status !== "ok" && <ChannelBanner ch={chan.active} onFix={() => chan.goFix(chan.active.id)} />}
          <div className="toolbar">
            <SearchBox
              value={q}
              onChange={setQ}
              placeholder={tab === "autos" ? "Search automations" : tab === "msgs" ? "Search messages" : "Search cards"}
            />

            {tab === "autos" && (
              <div className="chips scroll" role="group" aria-label="Status and filters">
                {["All", "Active", "Paused"].map((s) => (
                  <button key={s} type="button" className="chipb" aria-pressed={status === s} onClick={() => setStatus(s)}>{s}</button>
                ))}
                <button type="button" className="chipb filter" aria-pressed={nf > 0} onClick={() => setSheet({ type: "filter" })}>
                  <SlidersHorizontal size={16} /> Filters{nf > 0 && <span className="badge">{nf}</span>}
                </button>
              </div>
            )}

            {tab === "msgs" && (
              <div className="chips scroll" role="group" aria-label="Message type">
                <button type="button" className="chipb" aria-pressed={msgType === "all"} onClick={() => setMsgType("all")}>All</button>
                {MSG_TYPES.map((t) => (
                  <button key={t.key} type="button" className="chipb" aria-pressed={msgType === t.key} onClick={() => setMsgType(t.key)}>
                    <t.icon size={15} /> {t.label}
                  </button>
                ))}
              </div>
            )}

            {tab === "autos" && filterChips.length > 0 && (
              <div className="applied">
                {filterChips.map((c) => (
                  <span className="achip" key={c.g + c.k}>
                    {c.l}
                    <button type="button" aria-label={`Remove filter ${c.l}`} onClick={() => setF((o) => ({ ...o, [c.g]: o[c.g].filter((x) => x !== c.k) }))}><X size={14} /></button>
                  </span>
                ))}
                <button type="button" className="text-btn" onClick={() => setF(EMPTY_F)}>Clear all</button>
              </div>
            )}
          </div>

          <div className="list">
            {ld.status === "loading" && <ListSkeleton tab={tab} />}
            {ld.status === "error" && <LoadError err={ld.err} onRetry={retryLoad} what={tab === "autos" ? "automations" : tab === "msgs" ? "messages" : "cards"} />}
            {ld.status === "ready" && (<>
            {tab === "autos" && (
              <>
                {shownAutos.map((a) => (
                  <AutoCard
                    key={a.id}
                    a={a}
                    onOpen={() => props.onOpenDetail(a.id)}
                    onToggle={() => props.onToggle(a.id)}
                    onMenu={() => setSheet({ type: "menu", id: a.id })}
                  />
                ))}
                {shownAutos.length === 0 && (
                  <Empty
                    title={autos.length === 0 ? "No automations yet" : "No automations match"}
                    body={autos.length === 0 ? "Create your first automation to start replying." : "Try other words or clear the filters."}
                    action={autos.length === 0 ? "New automation" : "Clear filters"}
                    onAction={() => {
                      if (autos.length === 0) props.onNew("autos");
                      else {
                        setF(EMPTY_F);
                        setStatus("All");
                        setQs((o) => ({ ...o, autos: "" }));
                      }
                    }}
                  />
                )}
              </>
            )}

            {tab === "msgs" && (
              <>
                {shownMsgs.map((m) => <MsgCard key={m.id} m={m} onOpen={() => setSheet({ type: "preview", id: m.id })} onMenu={() => setSheet({ type: "menu", id: m.id })} />)}
                {shownMsgs.length === 0 && (
                  <Empty title="No messages here" body="Nothing matches. Try another type or create a message." action="New message" onAction={() => props.onNew("msgs")} />
                )}
              </>
            )}

            {tab === "cards" && (
              <>
                <div className="cgrid">
                  {shownCards.map((c) => <CardTile key={c.id} c={c} onMenu={() => setSheet({ type: "menu", id: c.id })} />)}
                </div>
                {shownCards.length === 0 && (
                  <Empty title="No cards found" body="Cards are reusable pieces for Generic messages." action="New card" onAction={() => props.onNew("cards")} />
                )}
              </>
            )}
            </>)}
            <div className="tail" />
          </div>
        </div>

        <button type="button" className={"fab" + (collapsed ? " small" : "")} aria-label={TAB_LABEL[tab]} onClick={() => props.onNew(tab)}>
          <Plus size={24} strokeWidth={2.6} />
          <span>{TAB_LABEL[tab]}</span>
        </button>

        <nav className="nav" aria-label="Main">
          <button type="button" onClick={() => nav("home")}><Home size={22} />Home</button>
          <button type="button" aria-current="page"><Sparkles size={22} />Automation</button>
          <button type="button" onClick={() => nav("profile")}><User size={22} />Profile</button>
        </nav>

        {sheet?.type === "filter" && (
          <FilterSheet
            key="filter"
            initial={f}
            onClose={close}
            countFor={(d) => autos.filter((a) => matchAuto(a, { status, f: d, q: qs.autos })).length}
            onApply={(d) => {
              setF(d);
              close();
            }}
          />
        )}

        {menuItem && (
          <MenuSheet
            title={nameOf(menuItem)}
            onClose={close}
            onEdit={() => { close(); props.onNew(tab, menuItem); }}
            onDuplicate={() => duplicate(menuItem)}
            onDelete={() => askDelete(menuItem)}
          />
        )}

        {sheet?.type === "preview" && (() => {
          const pm = msgs.find((x) => x.id === sheet.id);
          return pm ? <MsgPreviewSheet m={pm} channel={chan.active} onClose={close} /> : null;
        })()}

        {sheet?.type === "channel" && (
          <ChannelSheet channels={chan.channels} activeId={chan.activeId} onClose={close} onPick={(id) => { chan.setActive(id); close(); }} onAdd={() => { close(); chan.goAdd(); }} onManage={() => { close(); chan.goManage(); }} />
        )}

        {sheet?.type === "confirm" && <ConfirmSheet cfg={sheet.cfg} onClose={close} />}

        {toast && (
          <div className="toast-wrap" role="status"><div className="toast">{toast}</div></div>
        )}
    </div>
  );
}

/* ───────────── styles ───────────── */

const CSS = ".sc-auto .scr{flex:1;overflow-y:auto;overscroll-behavior:contain}\n.sc-auto .hdr{padding:14px 20px 6px}\n.sc-auto .hdr h1{margin:0;font-size:22px;font-weight:700;letter-spacing:-.02em}\n.sc-auto .icon-btn{width:44px;height:44px;border-radius:14px;background:transparent;border:0;color:var(--text);display:grid;place-items:center;cursor:pointer;flex:none}\n.sc-auto .icon-btn.sm{width:40px;height:40px;border-radius:12px;color:var(--muted)}\n.sc-auto .tabsbar{display:flex;border-bottom:1px solid var(--line);padding:0 8px}\n.sc-auto .tabb{flex:1;position:relative;background:transparent;border:0;color:var(--muted);font-size:15px;font-weight:600;min-height:50px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px}\n.sc-auto .tabb[aria-selected=true]{color:var(--blue)}\n.sc-auto .tabb[aria-selected=true]::after{content:'';position:absolute;left:14%;right:14%;bottom:-1px;height:3px;border-radius:3px 3px 0 0;background:var(--blue)}\n.sc-auto .tcnt{font-size:12px;font-weight:700;background:var(--panel2);color:var(--muted);border-radius:999px;padding:2px 7px;font-variant-numeric:tabular-nums}\n.sc-auto .tabb[aria-selected=true] .tcnt{background:rgba(91,140,255,.18);color:var(--blue)}\n.sc-auto .toolbar{padding:12px 16px 4px}\n.sc-auto .search{position:relative}\n.sc-auto .search > svg{position:absolute;left:14px;top:50%;transform:translateY(-50%);color:var(--muted);pointer-events:none}\n.sc-auto .inp{background:var(--panel);border:1px solid var(--line);border-radius:14px;color:var(--text);font:inherit;font-size:15px;padding:0 44px 0 42px;min-height:48px;width:100%;color-scheme:dark}\n.sc-auto .clear{position:absolute;right:4px;top:50%;transform:translateY(-50%);width:40px;height:40px;border:0;background:transparent;color:var(--muted);display:grid;place-items:center;cursor:pointer;border-radius:50%}\n.sc-auto .chips{display:flex;flex-wrap:wrap;gap:8px}\n.sc-auto .chips.scroll{flex-wrap:nowrap;overflow-x:auto;margin:10px -16px 0;padding:0 16px 4px}\n.sc-auto .chipb{flex:none;min-height:40px;padding:0 14px;border-radius:999px;border:1px solid var(--line);background:var(--panel);color:var(--muted);font-size:13.5px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:6px;white-space:nowrap}\n.sc-auto .chipb[aria-pressed=true]{border-color:var(--blue);background:rgba(91,140,255,.12);color:var(--text)}\n.sc-auto .chipb.filter{margin-left:auto}\n.sc-auto .chipb.filter[aria-pressed=true]{border-color:var(--amber);background:rgba(255,180,84,.1)}\n.sc-auto .badge{background:var(--amber);color:#2A1B00;border-radius:999px;font-size:12px;font-weight:800;min-width:20px;height:20px;display:grid;place-items:center;padding:0 5px}\n.sc-auto .applied{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-top:8px}\n.sc-auto .achip{display:inline-flex;align-items:center;gap:2px;background:rgba(255,180,84,.12);color:#FFD9A6;border-radius:999px;padding:2px 2px 2px 12px;font-size:13px;font-weight:600}\n.sc-auto .achip button{border:0;background:transparent;color:#FFD9A6;width:30px;height:30px;border-radius:50%;display:grid;place-items:center;cursor:pointer}\n.sc-auto .text-btn{background:transparent;border:0;color:var(--blue);font-weight:600;font-size:14px;min-height:40px;padding:0 8px;cursor:pointer}\n.sc-auto .list{padding:10px 16px 0;display:flex;flex-direction:column;gap:10px}\n.sc-auto .tail{height:92px}\n.sc-auto .card{background:var(--panel);border:1px solid var(--line);border-radius:20px;padding:14px 8px 14px 16px}\n.sc-auto .top{display:flex;align-items:center;gap:8px}\n.sc-auto .rt{flex:1;min-width:0}\n.sc-auto .rt h3{margin:0;font-size:16px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.sc-auto .rt p{margin:2px 0 0;font-size:13px;color:var(--muted)}\n.sc-auto .rt h3,.sc-auto .prev,.sc-auto .cbody b,.sc-auto .cbody span{text-align:left}\n.sc-auto .paused{font-size:12px;font-weight:700;color:var(--muted);background:var(--panel2);border-radius:999px;padding:3px 9px;flex:none}\n.sc-auto .auto .trigs,.sc-auto .auto .cond,.sc-auto .auto .stats{margin-right:8px}\n.sc-auto .meta-row{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:-2px 8px 0 0}\n.sc-auto .meta-row p{margin:0;font-size:13px;color:var(--muted)}\n.sc-auto .state{display:flex;align-items:center;gap:10px;font-size:13px;font-weight:600;color:var(--muted);cursor:pointer;min-height:44px}\n.sc-auto .auto:not(.off) .state{color:var(--mint)}\n.sc-auto .trigs{display:flex;flex-wrap:wrap;gap:6px;margin-top:12px}\n.sc-auto .tchip{display:inline-flex;align-items:center;gap:5px;font-size:12.5px;color:#C4CCE0;background:var(--panel2);border-radius:999px;padding:5px 10px 5px 8px}\n.sc-auto .tchip.none{color:var(--muted);background:transparent;border:1px dashed var(--line);padding-left:10px}\n.sc-auto .cond{display:flex;flex-wrap:wrap;align-items:center;gap:6px;border-left:3px solid var(--amber);background:rgba(255,180,84,.07);border-radius:4px 12px 12px 4px;padding:8px 10px;margin-top:10px}\n.sc-auto .cond-l{font-size:12.5px;font-weight:700;color:var(--amber);margin-right:2px}\n.sc-auto .cchip{font-size:12.5px;background:rgba(255,180,84,.14);color:#FFD9A6;border-radius:999px;padding:3px 9px}\n.sc-auto .stats{display:grid;grid-template-columns:repeat(3,1fr);margin:12px 8px 0 0;padding-top:12px;border-top:1px solid var(--line)}\n.sc-auto .stats div{display:flex;flex-direction:column;gap:2px}\n.sc-auto .stats dt{order:2;font-size:12.5px;color:var(--muted)}\n.sc-auto .stats dd{margin:0;font-size:19px;font-weight:700;font-variant-numeric:tabular-nums}\n.sc-auto .stats dd.dash{color:var(--muted)}\n.sc-auto .auto.off h3,.sc-auto .auto.off .stats dd{color:var(--muted)}\n.sc-auto .auto.off .tchip{opacity:.7}\n.sc-auto .sw{width:50px;height:30px;border-radius:999px;border:0;background:#334060;position:relative;cursor:pointer;flex:none;padding:0;transition:background .2s}\n.sc-auto .sw::after{content:'';position:absolute;top:3px;left:3px;width:24px;height:24px;border-radius:50%;background:#fff;transition:transform .2s}\n.sc-auto .sw[aria-checked=true]{background:var(--mint)}\n.sc-auto .sw[aria-checked=true]::after{transform:translateX(20px)}\n.sc-auto .ico{width:40px;height:40px;border-radius:12px;background:rgba(91,140,255,.14);color:var(--blue);display:grid;place-items:center;flex:none}\n.sc-auto .msg .prev{margin:12px 8px 0 0;font-size:14px;line-height:1.5;color:#C4CCE0}\n.sc-auto .clamp{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}\n.sc-auto .used{margin:8px 8px 0 0;font-size:13px;color:var(--muted)}\n.sc-auto .cgrid{display:grid;grid-template-columns:1fr 1fr;gap:10px}\n.sc-auto .ctile{background:var(--panel);border:1px solid var(--line);border-radius:18px;overflow:hidden}\n.sc-auto .cthumb{position:relative;height:96px;background:hsl(var(--h) 30% 24%);display:grid;place-items:center;color:#DDE3F2}\n.sc-auto .kb{position:absolute;top:4px;right:4px;width:40px;height:40px;border-radius:50%;border:0;background:rgba(10,14,22,.55);color:#fff;display:grid;place-items:center;cursor:pointer}\n.sc-auto .cbody{padding:10px 12px 12px;display:flex;flex-direction:column;gap:2px}\n.sc-auto .cbody b{font-size:14.5px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.sc-auto .cbody span{font-size:13px;color:#B9C3DB;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.sc-auto .cbody small{font-size:12.5px;color:var(--muted);margin-top:4px}\n.sc-auto .empty{text-align:center;padding:36px 12px 10px;display:flex;flex-direction:column;align-items:center}\n.sc-auto .empty h3{margin:0;font-size:17px}\n.sc-auto .empty p{margin:6px 0 16px;font-size:14px;color:var(--muted);line-height:1.5}\n.sc-auto .btn2{border:1px solid var(--line);background:var(--panel2);color:var(--text);font-weight:600;font-size:14px;border-radius:12px;padding:0 16px;min-height:44px;cursor:pointer}\n.sc-auto .fab{position:absolute;right:16px;bottom:86px;height:56px;min-width:56px;border-radius:18px;border:0;background:var(--blue);color:#0B1020;font-weight:700;font-size:15px;display:flex;align-items:center;justify-content:center;gap:8px;padding:0 20px 0 16px;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.45);transition:padding .2s;z-index:3}\n.sc-auto .fab span{max-width:180px;overflow:hidden;white-space:nowrap;transition:max-width .2s,opacity .2s}\n.sc-auto .fab.small{padding:0 16px}\n.sc-auto .fab.small span{max-width:0;opacity:0}\n.sc-auto .nav{display:grid;grid-template-columns:repeat(3,1fr);border-top:1px solid var(--line);background:var(--panel);padding:6px 8px 10px}\n.sc-auto .nav button{background:transparent;border:0;color:var(--muted);font-size:12px;font-weight:600;display:flex;flex-direction:column;align-items:center;gap:3px;padding:6px 0;min-height:54px;cursor:pointer;border-radius:12px}\n.sc-auto .nav button[aria-current=page]{color:var(--blue)}\n.sc-auto .scrim{position:absolute;inset:0;background:rgba(5,8,14,.62);display:flex;align-items:flex-end;z-index:5}\n.sc-auto .sheet{width:100%;max-height:88%;overflow-y:auto;background:var(--panel);border-radius:26px 26px 0 0;border-top:1px solid var(--line);padding:8px 16px 20px;animation:up .24s ease-out;box-shadow:0 -16px 40px rgba(0,0,0,.4)}\n@keyframes up{from{transform:translateY(40px);opacity:.4}to{transform:none;opacity:1}}\n.sc-auto .grab{width:40px;height:4px;border-radius:2px;background:var(--line);margin:4px auto 6px}\n.sc-auto .sh-head{display:flex;align-items:center;justify-content:space-between;gap:8px}\n.sc-auto .sh-head h2{margin:0;font-size:19px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.sc-auto .gt{font-size:13px;font-weight:600;color:var(--muted);margin:18px 0 8px}\n.sc-auto .btns{display:flex;gap:10px;margin-top:22px}\n.sc-auto .primary,.sc-auto .ghost,.sc-auto .danger{min-height:50px;border-radius:14px;font-weight:700;font-size:15px;padding:0 18px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px}\n.sc-auto .primary{flex:1;background:var(--blue);color:#0B1020;border:0}\n.sc-auto .ghost{background:transparent;border:1px solid var(--line);color:var(--text);font-weight:600}\n.sc-auto .danger{background:transparent;border:1px solid rgba(255,107,107,.4);color:var(--red)}\n.sc-auto .danger.solid{background:var(--red);border-color:var(--red);color:#2A0808}\n.sc-auto .stack{display:flex;flex-direction:column;gap:8px;margin-top:18px}\n.sc-auto .note{font-size:14px;color:var(--muted);margin:12px 0 0;line-height:1.5}\n.sc-auto .mlist{display:flex;flex-direction:column;gap:6px;margin-top:12px}\n.sc-auto .mrow{display:flex;align-items:center;gap:12px;text-align:left;background:var(--night);border:1px solid var(--line);color:var(--text);border-radius:14px;padding:12px 14px;min-height:56px;font-size:15.5px;font-weight:600;cursor:pointer}\n.sc-auto .mrow span{flex:1}\n.sc-auto .mrow svg{color:var(--muted)}\n.sc-auto .mrow.del{color:var(--red)}\n.sc-auto .mrow.del svg{color:var(--red)}\n.sc-auto .toast-wrap{position:absolute;left:0;right:0;bottom:150px;display:flex;justify-content:center;z-index:9;pointer-events:none}\n.sc-auto .toast{background:var(--panel2);border:1px solid var(--line);color:var(--text);font-weight:600;font-size:14px;padding:10px 16px;border-radius:999px}\n.sc-auto .chan-chip{display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:0 10px 0 6px;border-radius:999px;border:1px solid var(--line);background:var(--panel);color:var(--text);font-size:14px;font-weight:600;cursor:pointer;max-width:170px}\n.sc-auto .chan-chip .cname{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.sc-auto .chan-chip .chv{color:var(--muted);flex:none}\n.sc-auto .chan-chip.wide{width:100%;max-width:none;justify-content:flex-start;padding:8px 14px 8px 8px;min-height:58px;border-radius:16px;font-size:15.5px}\n.sc-auto .chan-chip.wide .cname{flex:1;text-align:left}\n.sc-auto .cav{width:32px;height:32px;border-radius:50%;display:grid;place-items:center;font-weight:700;font-size:14px;background:hsl(var(--h,220) 38% 26%);color:#E6ECFA;flex:none;position:relative}\n.sc-auto .cav.lg{width:40px;height:40px;font-size:16px}\n.sc-auto .cav .warn-dot{position:absolute;right:-1px;bottom:-1px;width:11px;height:11px;border-radius:50%;background:var(--amber);border:2px solid var(--panel)}\n.sc-auto .crow{width:100%;display:flex;align-items:center;gap:12px;text-align:left;background:var(--night);border:1px solid var(--line);color:var(--text);border-radius:14px;padding:10px 14px;min-height:64px;cursor:pointer;margin-top:8px}\n.sc-auto .crow[aria-pressed=true]{border-color:var(--blue);background:rgba(91,140,255,.12)}\n.sc-auto .crow .ct{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}\n.sc-auto .crow b{font-size:15.5px;font-weight:600}\n.sc-auto .crow small{font-size:13px;color:var(--muted)}\n.sc-auto .crow small.warn{color:var(--amber)}\n.sc-auto .crow .tick{color:var(--blue);flex:none}\n.sc-auto .crow.addc{border:1.5px dashed #3B486B;background:transparent;color:var(--blue);font-weight:700;justify-content:center;gap:8px}\n.sc-auto .sh-link{background:transparent;border:0;color:var(--blue);font-weight:600;font-size:14.5px;min-height:44px;cursor:pointer;padding:0 4px;margin-top:6px}\n.sc-auto .chan-banner{display:flex;align-items:center;gap:12px;margin:12px 16px 0;padding:12px 12px 12px 14px;border-left:3px solid var(--amber);background:rgba(255,180,84,.08);border-radius:4px 14px 14px 4px}\n.sc-auto .chan-banner.inline{margin:10px 0 0}\n.sc-auto .chan-banner p{margin:0;flex:1;font-size:13.5px;line-height:1.45;color:#FFE3BC}\n.sc-auto .chan-banner button{flex:none;min-height:40px;border-radius:12px;border:1px solid rgba(255,180,84,.5);background:transparent;color:var(--amber);font-weight:700;font-size:14px;padding:0 14px;cursor:pointer}\n.sc-auto .chan-field{margin-bottom:14px}\n.sc-auto .lab.first{margin-top:0}\n.sc-auto .row-hdr{display:flex;align-items:center;justify-content:space-between;gap:10px}\n.sc-auto .hdr-r{display:flex;align-items:center;gap:2px}\n.sc-auto .icon-btn.sm{width:40px;height:40px;border-radius:12px;color:var(--muted)}\n.sc-auto .scrim{position:absolute;inset:0;background:rgba(5,8,14,.62);display:flex;align-items:flex-end;z-index:5}\n.sc-auto .sheet{width:100%;max-height:88%;overflow-y:auto;background:var(--panel);border-radius:26px 26px 0 0;border-top:1px solid var(--line);padding:8px 16px 20px;animation:up .24s ease-out;box-shadow:0 -16px 40px rgba(0,0,0,.4)}\n.sc-auto .grab{width:40px;height:4px;border-radius:2px;background:var(--line);margin:4px auto 6px}\n.sc-auto .sh-head{display:flex;align-items:center;justify-content:space-between;gap:8px}\n.sc-auto .sh-head h2{margin:0;font-size:19px;font-weight:700}\n.sc-auto .sk{display:block;background:linear-gradient(90deg,var(--panel2) 0%,#27324C 50%,var(--panel2) 100%);background-size:200% 100%;animation:shimmer 1.4s ease-in-out infinite}\n.sc-auto .skcard{background:var(--panel);border:1px solid var(--line);border-radius:20px;padding:16px;display:flex;flex-direction:column;gap:12px}\n.sc-auto .skrow{display:flex;align-items:center;gap:12px}\n.sc-auto .errcard{display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px;padding:32px 20px;background:var(--panel);border:1px dashed #3B486B;border-radius:20px}\n.sc-auto .errcard .eico{width:52px;height:52px;border-radius:50%;background:rgba(255,180,84,.14);color:var(--amber);display:grid;place-items:center;margin-bottom:6px}\n.sc-auto .errcard h3{margin:0;font-size:17px}\n.sc-auto .errcard p{margin:0 0 10px;font-size:14px;line-height:1.5;color:var(--muted);max-width:280px}\n.sc-auto .errcard .retry{min-height:44px;border-radius:12px;border:1px solid var(--line);background:var(--panel2);color:var(--text);font-weight:700;font-size:14.5px;padding:0 18px;cursor:pointer;display:inline-flex;align-items:center;gap:8px}\n.sc-auto .bspin{width:18px;height:18px;border-radius:50%;border:2.5px solid rgba(11,16,32,.25);border-top-color:#0B1020;animation:spinr .8s linear infinite;flex:none}\n.sc-auto .inline-err{display:flex;align-items:flex-start;gap:8px;font-size:13.5px;line-height:1.45;color:var(--amber);margin:0}\n.sc-auto .inline-err svg{flex:none;margin-top:2px}\n.sc-auto .ubar{display:block;height:4px;border-radius:2px;background:var(--panel2);overflow:hidden;margin-top:6px}\n.sc-auto .ubar i{display:block;height:100%;width:0;background:var(--blue);animation:fillbar linear forwards}\n.sc-auto .fitem .rt small.bad{color:var(--amber)}\n.sc-auto .retry-link{background:transparent;border:0;color:var(--blue);font-weight:700;font-size:13.5px;min-height:40px;padding:0 8px;cursor:pointer}\n.sc-auto .primary .bspin{margin-right:2px}\n.sc-auto .metanote{display:flex;gap:8px;align-items:flex-start;font-size:13px;line-height:1.5;color:var(--muted);margin:14px 0 0}\n.sc-auto .metanote svg{flex:none;margin-top:2px;color:var(--blue)}\n.sc-auto .metanote.warn{color:#FFE3BC}\n.sc-auto .metanote.warn svg{color:var(--amber)}\n.sc-auto .chipset{display:flex;flex-wrap:wrap;gap:6px}\n.sc-auto .chipset button{min-height:40px;padding:0 14px;border-radius:999px;border:1px solid var(--line);background:var(--night);color:var(--muted);font-size:13.5px;font-weight:600;cursor:pointer}\n.sc-auto .chipset button[aria-pressed=true]{border-color:var(--blue);background:rgba(91,140,255,.12);color:var(--text)}\n.sc-auto .sw:disabled{opacity:.4;cursor:not-allowed}\n.sc-auto .stepper{padding-left:14px;padding-right:14px}\n.sc-auto .st{width:64px}\n.sc-auto .st span{font-size:11.5px}\n.sc-auto .card.auto.clickable,.sc-auto .card.msg.clickable{cursor:pointer}\n.sc-auto .row2{display:flex;align-items:center;justify-content:space-between;gap:8px}\n.sc-auto .text-btn{background:transparent;border:0;color:var(--blue);font-weight:600;font-size:14px;min-height:40px;padding:0 6px;cursor:pointer;display:inline-flex;align-items:center;gap:6px}\n.sc-auto .big-warn{width:68px;height:68px;border-radius:50%;background:rgba(255,180,84,.14);color:var(--amber);display:grid;place-items:center}\n.sc-auto .sheet.tall{height:92%;max-height:92%;display:flex;flex-direction:column;padding:8px 0 0;overflow:hidden}\n.sc-auto .mpv-ctl{padding:8px 16px 0;display:flex;flex-direction:column;gap:8px}\n.sc-auto .mpv-row{display:flex;gap:8px;align-items:flex-end}\n.sc-auto .mpv-seg{display:flex;background:var(--night);border-radius:12px;padding:3px;gap:2px;flex:1}\n.sc-auto .mpv-seg button{flex:1;border:0;background:transparent;color:var(--muted);font-size:13px;font-weight:600;padding:7px;border-radius:9px;cursor:pointer;min-height:38px;display:inline-flex;align-items:center;justify-content:center;gap:6px}\n.sc-auto .mpv-seg button[aria-pressed=true]{background:var(--panel2);color:var(--text)}\n.sc-auto .mpv-iconbtn{width:44px;height:44px;border-radius:12px;border:1px solid var(--line);background:var(--panel2);color:var(--text);display:grid;place-items:center;cursor:pointer;flex:none}\n.sc-auto .mpv-in{flex:1;min-width:0;display:flex;flex-direction:column;gap:4px;font-size:12px;color:var(--muted);font-weight:600}\n.sc-auto .mpv-in input{background:var(--night);border:1px solid var(--line);border-radius:10px;color:var(--text);font:inherit;font-size:14px;padding:0 10px;min-height:40px;width:100%;color-scheme:dark}\n.sc-auto .mpv-ig{position:relative;flex:1;min-height:0;margin:10px 16px 0;border:1px solid var(--line);border-radius:22px;background:#0A0E17;display:flex;flex-direction:column;overflow:hidden}\n.sc-auto .mpv-igh{display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid var(--line);font-weight:600;font-size:14.5px}\n.sc-auto .mpv-igh small{display:block;color:var(--muted);font-weight:500;font-size:12px}\n.sc-auto .mpv-chat{flex:1;overflow-y:auto;padding:14px 12px;display:flex;flex-direction:column;gap:8px}\n.sc-auto .mpv-us{display:flex;flex-direction:column;align-items:flex-start;gap:6px;max-width:100%}\n.sc-auto .mpv-bub{max-width:84%;border-radius:20px;padding:10px 14px;font-size:14.5px;line-height:1.45;overflow-wrap:anywhere;white-space:pre-wrap}\n.sc-auto .mpv-bub.bot{background:#262F45}\n.sc-auto .mpv-bub.me{background:var(--blue);color:#0B1020;align-self:flex-end}\n.sc-auto .mpv-bub.mpv-ph{color:var(--muted);font-style:italic}\n.sc-auto .mpv-bub.mpv-na{background:transparent;border:1px dashed #3B486B;color:var(--muted);font-size:13.5px}\n.sc-auto .mpv-note{align-self:flex-end;font-size:11.5px;color:var(--muted);max-width:80%;text-align:right}\n.sc-auto .mpv-link{background:transparent;border:0;padding:0;color:#8FB0FF;text-decoration:underline;font:inherit;cursor:pointer;text-align:left}\n.sc-auto .mpv-btns{display:flex;flex-direction:column;gap:4px;width:min(84%,270px)}\n.sc-auto .mpv-btn{background:#262F45;border:0;border-radius:14px;padding:11px 10px;color:#8FB0FF;font-weight:600;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;font-family:inherit}\n.sc-auto .mpv-q{display:flex;flex-wrap:wrap;gap:6px}\n.sc-auto .mpv-pill{background:transparent;border:1px solid #6E97FF;color:#8FB0FF;border-radius:999px;padding:8px 14px;font-size:13.5px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:5px;font-family:inherit}\n.sc-auto .mpv-rail{display:flex;gap:8px;overflow-x:auto;scroll-snap-type:x mandatory;max-width:100%;padding-bottom:6px}\n.sc-auto .mpv-card{flex:none;width:210px;scroll-snap-align:start;background:#262F45;border-radius:18px;overflow:hidden}\n.sc-auto .mpv-card img{width:100%;height:120px;object-fit:cover;display:block}\n.sc-auto .mpv-cb{padding:10px 12px;display:flex;flex-direction:column;gap:2px;cursor:pointer;background:transparent;border:0;color:inherit;text-align:left;width:100%;font-family:inherit}\n.sc-auto .mpv-cb b{font-size:14.5px}\n.sc-auto .mpv-cb span{font-size:13px;color:#B9C3DB}\n.sc-auto .mpv-cbtn{display:block;width:100%;border:0;border-top:1px solid #34405D;background:transparent;text-align:center;padding:10px 8px;color:#8FB0FF;font-weight:600;font-size:14px;cursor:pointer;font-family:inherit}\n.sc-auto .mpv-dots{display:flex;gap:5px;justify-content:center;width:100%}\n.sc-auto .mpv-dots i{width:6px;height:6px;border-radius:50%;background:#3B486B}\n.sc-auto .mpv-dots i.on{background:#8FB0FF}\n.sc-auto .mpv-imgs{display:grid;grid-template-columns:repeat(2,1fr);gap:4px;width:min(84%,250px)}\n.sc-auto .mpv-imgs.one{grid-template-columns:1fr;width:min(70%,220px)}\n.sc-auto .mpv-imgs img{width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:16px}\n.sc-auto .mpv-imgs.one img{aspect-ratio:auto;max-height:260px}\n.sc-auto .mpv-file{display:flex;align-items:center;gap:10px;background:#262F45;border-radius:16px;padding:10px 14px 10px 10px;max-width:84%}\n.sc-auto .mpv-file .fi{width:40px;height:40px;border-radius:12px;background:rgba(91,140,255,.16);color:var(--blue);display:grid;place-items:center;flex:none}\n.sc-auto .mpv-file b{display:block;font-size:14px;overflow-wrap:anywhere}\n.sc-auto .mpv-file small{color:var(--muted);font-size:12px}\n.sc-auto .mpv-video{position:relative;width:min(84%,230px);aspect-ratio:9/12;background:#1A2233;border-radius:18px;display:grid;place-items:center;color:var(--muted);font-size:12px}\n.sc-auto .mpv-play{width:52px;height:52px;border-radius:50%;background:rgba(0,0,0,.55);color:#fff;display:grid;place-items:center}\n.sc-auto .mpv-audio{display:flex;align-items:center;gap:10px;background:#262F45;border-radius:22px;padding:8px 16px 8px 8px;color:var(--muted);font-size:12px}\n.sc-auto .mpv-audio .wv{display:flex;align-items:center;gap:2px;height:22px}\n.sc-auto .mpv-audio .wv i{width:3px;border-radius:2px;background:#8FB0FF}\n.sc-auto .mpv-composer{margin:8px 12px 12px;border:1px solid var(--line);border-radius:999px;padding:11px 16px;color:#5D6883;font-size:14px}\n.sc-auto .mpv-snack{position:absolute;left:12px;right:12px;bottom:64px;background:#EAEEF8;color:#0F1420;font-weight:600;font-size:13.5px;padding:10px 14px;border-radius:12px;text-align:center}\n.sc-auto .mpv-foot{padding:10px 16px 16px;display:flex;flex-direction:column;gap:6px}\n.sc-auto .mpv-lim{font-size:13px;color:var(--muted)}\n.sc-auto .mpv-iss{display:flex;gap:8px;font-size:13px;line-height:1.45;color:#FFE3BC}\n.sc-auto .mpv-iss svg{flex:none;margin-top:2px;color:var(--amber)}\n";

function ListSkeleton({ tab }) {
  if (tab === "cards") {
    return (
      <div className="cgrid" role="status" aria-busy="true" aria-label="Loading cards">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="ctile">
            <Skeleton h={96} r={0} />
            <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              <Skeleton h={14} w="70%" />
              <Skeleton h={12} w="90%" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <>
      {[0, 1, 2].map((i) => (
        <div key={i} className="skcard" role="status" aria-busy="true" aria-label="Loading">
          <div className="skrow"><Skeleton h={18} w="55%" /><span style={{ flex: 1 }} /><Skeleton h={28} w={56} r={14} /></div>
          <Skeleton h={13} w="38%" />
          <div className="skrow"><Skeleton h={26} w={72} r={13} /><Skeleton h={26} w={72} r={13} /><Skeleton h={26} w={84} r={13} /></div>
          <div className="skrow"><Skeleton h={22} w={54} /><Skeleton h={22} w={54} /><Skeleton h={22} w={54} /></div>
        </div>
      ))}
    </>
  );
}

return { Component: AutomationTab, SEED_AUTOS, SEED_MSGS, SEED_CARDS };

})();

/* ═════════ Step1Mod ═════════ */
const Step1Mod = (() => {

/* ───────────── data ───────────── */

const CH = [
  { key: "direct", label: "Direct", title: "Direct messages", icon: Send, text: true, media: null },
  { key: "story", label: "Story reply", title: "Story replies", icon: History, text: true, media: "story" },
  { key: "share", label: "Post share", title: "Post shares", icon: FileText, text: false, media: "post" },
  { key: "comment", label: "Comment", title: "Comments", icon: MessageSquare, text: true, media: "post" },
];

const OPS = [
  { v: "eq", l: "Equals", p: "equal" },
  { v: "contains", l: "Contains", p: "contain" },
  { v: "starts", l: "Starts with", p: "start with" },
];
const OP = Object.fromEntries(OPS.map((o) => [o.v, o]));

const NOUN = { story: ["story", "stories"], post: ["post", "posts"] };
const META_NOTE = {
  direct: "You can reply for 24 hours after their message.",
  story: "You can reply for 24 hours after their story reply.",
  share: "Instagram sends only a link to the shared post. If you pick specific posts, matching depends on that link, so test with a real share.",
  comment: "Comments get one private reply, within 7 days of the comment. For live videos, only while the broadcast is on. People who don’t follow you get it in Message Requests.",
};
const MEDIA = [
  { id: 1, hue: 210, date: "Sep 16" },
  { id: 2, hue: 160, date: "Sep 14" },
  { id: 3, hue: 30, date: "Sep 12" },
  { id: 4, hue: 280, date: "Sep 9" },
  { id: 5, hue: 340, date: "Sep 5" },
  { id: 6, hue: 120, date: "Aug 30" },
];

let _id = 10;
const uid = () => ++_id;

function joinList(arr, word) {
  if (arr.length <= 1) return arr[0] || "";
  if (arr.length === 2) return `${arr[0]} ${word} ${arr[1]}`;
  return `${arr.slice(0, -1).join(", ")} ${word} ${arr[arr.length - 1]}`;
}

/* ───────────── small components ───────────── */

function Seg({ options, value, onChange, label }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.v} type="button" aria-pressed={value === o.v} onClick={() => onChange(o.v)}>
          {o.l}
        </button>
      ))}
    </div>
  );
}

function RuleBuilder({ rules, onChange, subject, emptyNote }) {
  const [op, setOp] = useState("contains");
  const [v, setV] = useState("");
  const add = () => {
    const t = v.trim();
    if (!t) return;
    if (!rules.some((r) => r.op === op && r.v.toLowerCase() === t.toLowerCase())) {
      onChange([...rules, { id: uid(), op, v: t }]);
    }
    setV("");
  };
  return (
    <>
      <p className="lab">{subject} matches</p>
      <Seg label="Match type" value={op} onChange={setOp} options={OPS.map((o) => ({ v: o.v, l: o.l }))} />
      <div className="kw-add">
        <input
          className="inp"
          dir="auto"
          value={v}
          placeholder="Type a word or phrase"
          aria-label="Rule text"
          onChange={(e) => setV(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <button type="button" className="btn2" onClick={add}>
          <Plus size={16} /> Add
        </button>
      </div>
      {rules.length > 0 ? (
        <div className="kw-list">
          {rules.map((r) => (
            <span className="kw" key={r.id} dir="auto">
              <em>{OP[r.op].l}</em> “{r.v}”
              <button type="button" aria-label={`Remove rule ${r.v}`} onClick={() => onChange(rules.filter((x) => x.id !== r.id))}>
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="note">{emptyNote}</p>
      )}
      {rules.length > 1 && <p className="note">A message needs to match any one of these rules.</p>}
    </>
  );
}

function Scope({ kind, mode, onMode, ids, onOpen, onRemove }) {
  const [one, many] = NOUN[kind];
  return (
    <>
      <p className="lab">Which {many}</p>
      <Seg
        label={`Which ${many}`}
        value={mode}
        onChange={onMode}
        options={[{ v: "any", l: `Any ${one}` }, { v: "selected", l: "Selected" }]}
      />
      {mode === "selected" && (
        <>
          <div className="strip">
            {ids.map((id) => {
              const m = MEDIA.find((x) => x.id === id);
              return (
                <div key={id} className={"thumb " + (kind === "story" ? "tall" : "sq")} style={{ "--h": m.hue }}>
                  {one[0].toUpperCase() + one.slice(1)} {id}
                  <button type="button" className="x" aria-label={`Remove ${one} ${id}`} onClick={() => onRemove(id)}>
                    <X size={14} />
                  </button>
                </div>
              );
            })}
            <button type="button" className={"thumb add " + (kind === "story" ? "tall" : "sq")} aria-label={`Choose ${many}`} onClick={onOpen}>
              <Plus size={24} />
            </button>
          </div>
          {ids.length === 0 && <p className="note warn">Choose at least one {one}.</p>}
        </>
      )}
    </>
  );
}

/* ───────────── main ───────────── */

function CreateReplyStep1(props) {
  const [on, setOn] = useState({ direct: true, story: false, share: false, comment: true });
  const [rules, setRules] = useState({
    direct: [{ id: 1, op: "contains", v: "price" }, { id: 2, op: "contains", v: "cost" }],
    story: [],
    comment: [{ id: 3, op: "eq", v: "link" }],
  });
  const [scope, setScope] = useState({ story: "any", share: "any", comment: "selected" });
  const [picks, setPicks] = useState({ story: [], share: [], comment: [2, 4] });
  const [picker, setPicker] = useState(null);
  const [toast, setToast] = useState("");
  const [chanSheet, setChanSheet] = useState(false);
  const curCh = (props.channels || []).find((c) => c.id === props.channelId) || null;

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const toggle = (k) => setOn((o) => ({ ...o, [k]: !o[k] }));
  const setPick = (k, ids) => setPicks((p) => ({ ...p, [k]: ids }));

  const active = CH.filter((c) => on[c.key]);

  const problem = useMemo(() => {
    if (active.length === 0) return "Turn on at least one trigger.";
    for (const c of active) {
      if (c.media && scope[c.key] === "selected" && picks[c.key].length === 0) {
        return `Choose at least one ${NOUN[c.media][0]} for ${c.title.toLowerCase()}.`;
      }
    }
    return null;
  }, [active, scope, picks]);

  const sentence = useMemo(() => {
    const items = active.map((c) => {
      const rs = c.text ? rules[c.key] : [];
      const rp = rs.length ? ` that ${joinList(rs.map((r) => `${OP[r.op].p} “${r.v}”`), "or")}` : "";
      const n = (picks[c.key] || []).length;
      const sel = c.media && scope[c.key] === "selected";
      const [one, many] = c.media ? NOUN[c.media] : ["", ""];
      switch (c.key) {
        case "direct":
          return `direct messages${rp}`;
        case "story":
          return `story replies${rp}${sel ? ` on ${n} selected ${n === 1 ? one : many}` : ""}`;
        case "share":
          return sel ? `shares of ${n} selected ${n === 1 ? one : many}` : "shares of any post";
        default:
          return `comments${rp}${sel ? ` on ${n} selected ${n === 1 ? one : many}` : ""}`;
      }
    });
    return items.length ? `Reply to ${items.join("; ")}.` : "";
  }, [active, rules, scope, picks]);

  const pk = picker ? CH.find((c) => c.key === picker) : null;
  useEffect(() => {
    if (props.onState) props.onState({ on, rules, scope, picks });
  }, [on, rules, scope, picks]);

  return (
    <div className="sc-step1 screen">
      <style>{CSS}</style>
        <div className="ed-top">
          <button type="button" className="icon-btn" aria-label="Back" onClick={() => props.onBack()}>
            <ChevronLeft size={26} />
          </button>
          <h1>Create reply message</h1>
        </div>

        <div className="stepper" aria-label="Step 1 of 4">
          <div className="st active" aria-current="step"><i>1</i><span>Conditions</span></div>
          <b className="ln" />
          <div className="st"><i>2</i><span>Message</span></div>
          <b className="ln" />
          <div className="st"><i>3</i><span>Extras</span></div>
          <b className="ln" />
          <div className="st"><i>4</i><span>Review</span></div>
        </div>

        <div className="scr">
          <div className="ed-scroll">
            {curCh && (
              <div className="chan-field">
                <p className="lab first">Channel</p>
                <ChannelChip ch={curCh} wide onClick={() => setChanSheet(true)} />
                {curCh.status !== "ok" && (
                  <div className="chan-banner inline"><p>{curCh.status === "expiring" ? `${curCh.name}’s connection expires in ${curCh.days} days. Automations keep working until then.` : `${curCh.name} needs to reconnect. You can save this automation, but it can’t send replies until then.`}</p></div>
                )}
              </div>
            )}
            <p className="intro">Choose where this reply fires. Then narrow it down with rules.</p>

            <div className="tiles">
              {CH.map((c) => (
                <button key={c.key} type="button" className="tile" aria-pressed={on[c.key]} onClick={() => toggle(c.key)}>
                  <c.icon size={20} />
                  <span>{c.label}</span>
                  {on[c.key] ? <Check size={16} strokeWidth={3} className="tick" /> : <span className="off">Off</span>}
                </button>
              ))}
            </div>

            {active.map((c) => (
              <section className="sec" key={c.key} aria-label={c.title}>
                <div className="sec-h">
                  <span className="ico"><c.icon size={18} /></span>
                  <h2>{c.title}</h2>
                  <button type="button" className="icon-btn sm" aria-label={`Turn off ${c.title}`} onClick={() => toggle(c.key)}>
                    <X size={18} />
                  </button>
                </div>

                {c.text && (
                  <RuleBuilder
                    rules={rules[c.key]}
                    onChange={(r) => setRules((x) => ({ ...x, [c.key]: r }))}
                    subject={c.key === "comment" ? "Comment text" : c.key === "story" ? "Reply text" : "Message text"}
                    emptyNote={`No rules. Every ${c.key === "comment" ? "comment" : "message"} gets a reply.`}
                  />
                )}

                {c.media && (
                  <Scope
                    kind={c.media}
                    mode={scope[c.key]}
                    onMode={(m) => setScope((s) => ({ ...s, [c.key]: m }))}
                    ids={picks[c.key]}
                    onOpen={() => setPicker(c.key)}
                    onRemove={(id) => setPick(c.key, picks[c.key].filter((x) => x !== id))}
                  />
                )}
                <p className="metanote"><Info size={16} /><span>{META_NOTE[c.key]}</span></p>
              </section>
            ))}

            {active.length === 0 && (
              <p className="empty">Nothing is switched on yet. Tap a trigger above to start.</p>
            )}
          </div>
        </div>

        <footer className="ed-foot">
          <p className={"sum" + (problem ? " warn" : "")} dir="auto" aria-live="polite">{problem || sentence}</p>
          <button type="button" className="primary" disabled={!!problem} onClick={() => props.onNext()}>
            Next
          </button>
        </footer>

        {pk && (
          <div className="scrim" onClick={() => setPicker(null)}>
            <div className="sheet" role="dialog" aria-modal="true" aria-label={`Choose ${NOUN[pk.media][1]}`} onClick={(e) => e.stopPropagation()}>
              <div className="grab" />
              <div className="sh-head">
                <h2>Choose {NOUN[pk.media][1]}</h2>
                <button type="button" className="icon-btn sm" aria-label="Close" onClick={() => setPicker(null)}><X size={20} /></button>
              </div>
              <p className="note" style={{ marginBottom: 12 }}>The reply is sent only for the ones you select.</p>
              <LoadGate k={"picker|" + pk.key} ms={900} what={NOUN[pk.media][1]} skeleton={<div className="pgrid">{[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} h={pk.media === "story" ? 120 : 100} r={12} />)}</div>}>
              <div className="pgrid">
                {MEDIA.map((m) => {
                  const sel = picks[pk.key].includes(m.id);
                  const one = NOUN[pk.media][0];
                  return (
                    <button
                      key={m.id}
                      type="button"
                      className={"pitem " + (pk.media === "story" ? "tall" : "")}
                      style={{ "--h": m.hue }}
                      aria-pressed={sel}
                      onClick={() => setPick(pk.key, sel ? picks[pk.key].filter((x) => x !== m.id) : [...picks[pk.key], m.id])}
                    >
                      <span>{one[0].toUpperCase() + one.slice(1)} {m.id}</span>
                      <small>{m.date}</small>
                      {sel && <span className="ck"><Check size={14} strokeWidth={3} /></span>}
                    </button>
                  );
                })}
              </div>
              </LoadGate>
              <button type="button" className="primary wide" onClick={() => setPicker(null)}>
                Done{picks[pk.key].length ? ` (${picks[pk.key].length})` : ""}
              </button>
            </div>
          </div>
        )}

        {chanSheet && (
          <ChannelSheet title="Channel" channels={props.channels || []} activeId={props.channelId} onClose={() => setChanSheet(false)} onPick={(id) => { props.onChannel(id); setChanSheet(false); }} />
        )}

        {toast && (
          <div className="toast-wrap" role="status"><div className="toast">{toast}</div></div>
        )}
    </div>
  );
}

/* ───────────── styles ───────────── */

const CSS = ".sc-step1 .scr{flex:1;overflow-y:auto;overscroll-behavior:contain}\n.sc-step1 .icon-btn{width:44px;height:44px;border-radius:14px;background:transparent;border:0;color:var(--text);display:grid;place-items:center;cursor:pointer;flex:none}\n.sc-step1 .icon-btn.sm{width:40px;height:40px;border-radius:12px;color:var(--muted)}\n.sc-step1 .ed-top{display:flex;align-items:center;gap:4px;padding:10px 12px 4px}\n.sc-step1 .ed-top h1{margin:0;font-size:19px;font-weight:700}\n.sc-step1 .stepper{display:flex;align-items:flex-start;padding:6px 20px 14px;border-bottom:1px solid var(--line)}\n.sc-step1 .st{display:flex;flex-direction:column;align-items:center;gap:6px;width:70px}\n.sc-step1 .st i{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;font-style:normal;font-weight:700;font-size:13px;background:var(--panel2);color:var(--muted)}\n.sc-step1 .st span{font-size:12px;color:var(--muted)}\n.sc-step1 .st.active i{background:var(--blue);color:#0B1020}\n.sc-step1 .st.active span{color:var(--text);font-weight:600}\n.sc-step1 .ln{flex:1;height:2px;background:var(--line);margin-top:14px;border:0}\n.sc-step1 .ed-scroll{padding:16px 16px 24px}\n.sc-step1 .intro{margin:0 0 14px;font-size:14.5px;line-height:1.5;color:var(--muted)}\n.sc-step1 .tiles{display:grid;grid-template-columns:1fr 1fr;gap:8px}\n.sc-step1 .tile{display:flex;align-items:center;gap:10px;background:var(--panel);border:1px solid var(--line);color:var(--muted);border-radius:14px;padding:0 12px;min-height:58px;font-size:14px;font-weight:600;cursor:pointer;text-align:left}\n.sc-step1 .tile span:first-of-type{flex:1}\n.sc-step1 .tile .off{font-size:12.5px;font-weight:500;flex:none}\n.sc-step1 .tile .tick{flex:none;color:var(--blue)}\n.sc-step1 .tile[aria-pressed=true]{border-color:var(--blue);background:rgba(91,140,255,.12);color:var(--text)}\n.sc-step1 .tile[aria-pressed=true] > svg:first-child{color:var(--blue)}\n.sc-step1 .sec{background:var(--panel);border:1px solid var(--line);border-radius:20px;padding:14px 16px 18px;margin-top:14px}\n.sc-step1 .sec-h{display:flex;align-items:center;gap:10px;margin-bottom:2px}\n.sc-step1 .sec-h h2{margin:0;font-size:16px;font-weight:700;flex:1}\n.sc-step1 .ico{width:32px;height:32px;border-radius:10px;background:rgba(91,140,255,.14);color:var(--blue);display:grid;place-items:center;flex:none}\n.sc-step1 .lab{font-size:13px;font-weight:600;color:var(--muted);margin:16px 0 8px}\n.sc-step1 .note{font-size:13.5px;color:var(--muted);margin:8px 0 0;line-height:1.45}\n.sc-step1 .note.warn{color:var(--amber)}\n.sc-step1 .empty{text-align:center;color:var(--muted);font-size:14px;margin:28px 0}\n.sc-step1 .seg{display:flex;background:var(--night);border-radius:12px;padding:3px;gap:2px}\n.sc-step1 .seg button{flex:1;border:0;background:transparent;color:var(--muted);font-size:13px;font-weight:600;padding:7px 8px;border-radius:9px;cursor:pointer;min-height:38px}\n.sc-step1 .seg button[aria-pressed=true]{background:var(--panel2);color:var(--text)}\n.sc-step1 .inp{background:var(--night);border:1px solid var(--line);border-radius:12px;color:var(--text);font:inherit;font-size:14px;padding:9px 12px;min-height:46px;width:100%;color-scheme:dark}\n.sc-step1 .kw-add{display:flex;gap:8px;margin-top:8px}\n.sc-step1 .btn2{border:1px solid var(--line);background:var(--panel2);color:var(--text);font-weight:600;font-size:14px;border-radius:12px;padding:0 14px;min-height:46px;cursor:pointer;display:inline-flex;align-items:center;gap:4px;flex:none}\n.sc-step1 .kw-list{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}\n.sc-step1 .kw{display:inline-flex;align-items:center;gap:4px;background:rgba(91,140,255,.14);color:#D5E1FF;border-radius:999px;padding:3px 3px 3px 12px;font-size:14px}\n.sc-step1 .kw em{font-style:normal;color:var(--blue);font-weight:600;font-size:13px}\n.sc-step1 .kw button{border:0;background:transparent;color:var(--muted);width:30px;height:30px;border-radius:50%;display:grid;place-items:center;cursor:pointer}\n.sc-step1 .strip{display:flex;gap:8px;overflow-x:auto;padding:10px 0 4px}\n.sc-step1 .thumb{flex:none;position:relative;border-radius:12px;border:1px solid var(--line);background:hsl(var(--h,220) 30% 24%);display:grid;place-items:center;font-size:12.5px;font-weight:600;color:#DDE3F2}\n.sc-step1 .thumb.tall{width:66px;height:112px}\n.sc-step1 .thumb.sq{width:88px;height:88px}\n.sc-step1 .thumb.add{background:transparent;border:1.5px dashed #3B486B;color:var(--muted);cursor:pointer}\n.sc-step1 .thumb .x{position:absolute;top:3px;right:3px;width:28px;height:28px;border-radius:50%;border:0;background:rgba(10,14,22,.65);color:#fff;display:grid;place-items:center;cursor:pointer}\n.sc-step1 .ed-foot{border-top:1px solid var(--line);background:var(--panel);padding:12px 16px 14px;display:flex;flex-direction:column;gap:10px}\n.sc-step1 .sum{margin:0;font-size:13.5px;line-height:1.5;color:#C9D1E6;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}\n.sc-step1 .sum.warn{color:var(--amber)}\n.sc-step1 .primary{background:var(--blue);color:#0B1020;border:0;border-radius:14px;font-weight:700;font-size:15px;min-height:50px;padding:0 18px;cursor:pointer}\n.sc-step1 .primary:disabled{background:var(--panel2);color:var(--muted);cursor:not-allowed}\n.sc-step1 .primary.wide{width:100%;margin-top:16px}\n.sc-step1 .scrim{position:absolute;inset:0;background:rgba(5,8,14,.62);display:flex;align-items:flex-end;z-index:5}\n.sc-step1 .sheet{width:100%;max-height:88%;overflow-y:auto;background:var(--panel);border-radius:26px 26px 0 0;border-top:1px solid var(--line);padding:8px 16px 20px;animation:up .24s ease-out;box-shadow:0 -16px 40px rgba(0,0,0,.4)}\n@keyframes up{from{transform:translateY(40px);opacity:.4}to{transform:none;opacity:1}}\n.sc-step1 .grab{width:40px;height:4px;border-radius:2px;background:var(--line);margin:4px auto 6px}\n.sc-step1 .sh-head{display:flex;align-items:center;justify-content:space-between}\n.sc-step1 .sh-head h2{margin:0;font-size:19px;font-weight:700}\n.sc-step1 .pgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}\n.sc-step1 .pitem{position:relative;border-radius:12px;border:2px solid transparent;background:hsl(var(--h) 30% 24%);color:#DDE3F2;font-size:13px;font-weight:600;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;aspect-ratio:1/1;padding:0}\n.sc-step1 .pitem.tall{aspect-ratio:9/13}\n.sc-step1 .pitem small{font-size:11.5px;font-weight:500;color:#AEB8D0}\n.sc-step1 .pitem[aria-pressed=true]{border-color:var(--blue)}\n.sc-step1 .pitem .ck{position:absolute;top:6px;right:6px;width:22px;height:22px;border-radius:50%;background:var(--blue);color:#0B1020;display:grid;place-items:center}\n.sc-step1 .toast-wrap{position:absolute;left:0;right:0;bottom:110px;display:flex;justify-content:center;z-index:9;pointer-events:none}\n.sc-step1 .toast{background:var(--panel2);border:1px solid var(--line);color:var(--text);font-weight:600;font-size:14px;padding:10px 16px;border-radius:999px;animation:up .2s ease-out}\n.sc-step1 .chan-chip{display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:0 10px 0 6px;border-radius:999px;border:1px solid var(--line);background:var(--panel);color:var(--text);font-size:14px;font-weight:600;cursor:pointer;max-width:170px}\n.sc-step1 .chan-chip .cname{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.sc-step1 .chan-chip .chv{color:var(--muted);flex:none}\n.sc-step1 .chan-chip.wide{width:100%;max-width:none;justify-content:flex-start;padding:8px 14px 8px 8px;min-height:58px;border-radius:16px;font-size:15.5px}\n.sc-step1 .chan-chip.wide .cname{flex:1;text-align:left}\n.sc-step1 .cav{width:32px;height:32px;border-radius:50%;display:grid;place-items:center;font-weight:700;font-size:14px;background:hsl(var(--h,220) 38% 26%);color:#E6ECFA;flex:none;position:relative}\n.sc-step1 .cav.lg{width:40px;height:40px;font-size:16px}\n.sc-step1 .cav .warn-dot{position:absolute;right:-1px;bottom:-1px;width:11px;height:11px;border-radius:50%;background:var(--amber);border:2px solid var(--panel)}\n.sc-step1 .crow{width:100%;display:flex;align-items:center;gap:12px;text-align:left;background:var(--night);border:1px solid var(--line);color:var(--text);border-radius:14px;padding:10px 14px;min-height:64px;cursor:pointer;margin-top:8px}\n.sc-step1 .crow[aria-pressed=true]{border-color:var(--blue);background:rgba(91,140,255,.12)}\n.sc-step1 .crow .ct{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}\n.sc-step1 .crow b{font-size:15.5px;font-weight:600}\n.sc-step1 .crow small{font-size:13px;color:var(--muted)}\n.sc-step1 .crow small.warn{color:var(--amber)}\n.sc-step1 .crow .tick{color:var(--blue);flex:none}\n.sc-step1 .crow.addc{border:1.5px dashed #3B486B;background:transparent;color:var(--blue);font-weight:700;justify-content:center;gap:8px}\n.sc-step1 .sh-link{background:transparent;border:0;color:var(--blue);font-weight:600;font-size:14.5px;min-height:44px;cursor:pointer;padding:0 4px;margin-top:6px}\n.sc-step1 .chan-banner{display:flex;align-items:center;gap:12px;margin:12px 16px 0;padding:12px 12px 12px 14px;border-left:3px solid var(--amber);background:rgba(255,180,84,.08);border-radius:4px 14px 14px 4px}\n.sc-step1 .chan-banner.inline{margin:10px 0 0}\n.sc-step1 .chan-banner p{margin:0;flex:1;font-size:13.5px;line-height:1.45;color:#FFE3BC}\n.sc-step1 .chan-banner button{flex:none;min-height:40px;border-radius:12px;border:1px solid rgba(255,180,84,.5);background:transparent;color:var(--amber);font-weight:700;font-size:14px;padding:0 14px;cursor:pointer}\n.sc-step1 .chan-field{margin-bottom:14px}\n.sc-step1 .lab.first{margin-top:0}\n.sc-step1 .row-hdr{display:flex;align-items:center;justify-content:space-between;gap:10px}\n.sc-step1 .hdr-r{display:flex;align-items:center;gap:2px}\n.sc-step1 .icon-btn.sm{width:40px;height:40px;border-radius:12px;color:var(--muted)}\n.sc-step1 .scrim{position:absolute;inset:0;background:rgba(5,8,14,.62);display:flex;align-items:flex-end;z-index:5}\n.sc-step1 .sheet{width:100%;max-height:88%;overflow-y:auto;background:var(--panel);border-radius:26px 26px 0 0;border-top:1px solid var(--line);padding:8px 16px 20px;animation:up .24s ease-out;box-shadow:0 -16px 40px rgba(0,0,0,.4)}\n.sc-step1 .grab{width:40px;height:4px;border-radius:2px;background:var(--line);margin:4px auto 6px}\n.sc-step1 .sh-head{display:flex;align-items:center;justify-content:space-between;gap:8px}\n.sc-step1 .sh-head h2{margin:0;font-size:19px;font-weight:700}\n.sc-step1 .sk{display:block;background:linear-gradient(90deg,var(--panel2) 0%,#27324C 50%,var(--panel2) 100%);background-size:200% 100%;animation:shimmer 1.4s ease-in-out infinite}\n.sc-step1 .skcard{background:var(--panel);border:1px solid var(--line);border-radius:20px;padding:16px;display:flex;flex-direction:column;gap:12px}\n.sc-step1 .skrow{display:flex;align-items:center;gap:12px}\n.sc-step1 .errcard{display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px;padding:32px 20px;background:var(--panel);border:1px dashed #3B486B;border-radius:20px}\n.sc-step1 .errcard .eico{width:52px;height:52px;border-radius:50%;background:rgba(255,180,84,.14);color:var(--amber);display:grid;place-items:center;margin-bottom:6px}\n.sc-step1 .errcard h3{margin:0;font-size:17px}\n.sc-step1 .errcard p{margin:0 0 10px;font-size:14px;line-height:1.5;color:var(--muted);max-width:280px}\n.sc-step1 .errcard .retry{min-height:44px;border-radius:12px;border:1px solid var(--line);background:var(--panel2);color:var(--text);font-weight:700;font-size:14.5px;padding:0 18px;cursor:pointer;display:inline-flex;align-items:center;gap:8px}\n.sc-step1 .bspin{width:18px;height:18px;border-radius:50%;border:2.5px solid rgba(11,16,32,.25);border-top-color:#0B1020;animation:spinr .8s linear infinite;flex:none}\n.sc-step1 .inline-err{display:flex;align-items:flex-start;gap:8px;font-size:13.5px;line-height:1.45;color:var(--amber);margin:0}\n.sc-step1 .inline-err svg{flex:none;margin-top:2px}\n.sc-step1 .ubar{display:block;height:4px;border-radius:2px;background:var(--panel2);overflow:hidden;margin-top:6px}\n.sc-step1 .ubar i{display:block;height:100%;width:0;background:var(--blue);animation:fillbar linear forwards}\n.sc-step1 .fitem .rt small.bad{color:var(--amber)}\n.sc-step1 .retry-link{background:transparent;border:0;color:var(--blue);font-weight:700;font-size:13.5px;min-height:40px;padding:0 8px;cursor:pointer}\n.sc-step1 .primary .bspin{margin-right:2px}\n.sc-step1 .metanote{display:flex;gap:8px;align-items:flex-start;font-size:13px;line-height:1.5;color:var(--muted);margin:14px 0 0}\n.sc-step1 .metanote svg{flex:none;margin-top:2px;color:var(--blue)}\n.sc-step1 .metanote.warn{color:#FFE3BC}\n.sc-step1 .metanote.warn svg{color:var(--amber)}\n.sc-step1 .chipset{display:flex;flex-wrap:wrap;gap:6px}\n.sc-step1 .chipset button{min-height:40px;padding:0 14px;border-radius:999px;border:1px solid var(--line);background:var(--night);color:var(--muted);font-size:13.5px;font-weight:600;cursor:pointer}\n.sc-step1 .chipset button[aria-pressed=true]{border-color:var(--blue);background:rgba(91,140,255,.12);color:var(--text)}\n.sc-step1 .sw:disabled{opacity:.4;cursor:not-allowed}\n.sc-step1 .stepper{padding-left:14px;padding-right:14px}\n.sc-step1 .st{width:64px}\n.sc-step1 .st span{font-size:11.5px}\n.sc-step1 .card.auto.clickable,.sc-step1 .card.msg.clickable{cursor:pointer}\n.sc-step1 .row2{display:flex;align-items:center;justify-content:space-between;gap:8px}\n.sc-step1 .text-btn{background:transparent;border:0;color:var(--blue);font-weight:600;font-size:14px;min-height:40px;padding:0 6px;cursor:pointer;display:inline-flex;align-items:center;gap:6px}\n.sc-step1 .big-warn{width:68px;height:68px;border-radius:50%;background:rgba(255,180,84,.14);color:var(--amber);display:grid;place-items:center}\n";

return { Component: CreateReplyStep1 };

})();

/* ═════════ Step2Mod ═════════ */
const Step2Mod = (() => {
const CSS = ".sc-step2 .scr{flex:1;overflow-y:auto;overscroll-behavior:contain}\n.sc-step2 .icon-btn{width:44px;height:44px;border-radius:14px;background:transparent;border:0;color:var(--text);display:grid;place-items:center;cursor:pointer;flex:none}\n.sc-step2 .icon-btn.sm{width:40px;height:40px;border-radius:12px;color:var(--muted)}\n.sc-step2 .ed-top{display:flex;align-items:center;gap:4px;padding:10px 12px 4px}\n.sc-step2 .ed-top h1{margin:0;font-size:19px;font-weight:700}\n.sc-step2 .stepper{display:flex;align-items:flex-start;padding:6px 20px 14px;border-bottom:1px solid var(--line)}\n.sc-step2 .st{display:flex;flex-direction:column;align-items:center;gap:6px;width:70px}\n.sc-step2 .st i{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;font-style:normal;font-weight:700;font-size:13px;background:var(--panel2);color:var(--muted)}\n.sc-step2 .st span{font-size:12px;color:var(--muted)}\n.sc-step2 .st.done i,.sc-step2 .st.active i{background:var(--blue);color:#0B1020}\n.sc-step2 .st.done span{color:#B9C3DB}\n.sc-step2 .st.active span{color:var(--text);font-weight:600}\n.sc-step2 .ln{flex:1;height:2px;background:var(--line);margin-top:14px;border:0}\n.sc-step2 .ln.done{background:var(--blue)}\n.sc-step2 .ed-scroll{padding:16px 16px 24px}\n.sc-step2 .intro{margin:0 0 14px;font-size:14.5px;line-height:1.5;color:var(--muted)}\n.sc-step2 .fc{background:var(--panel);border:1px solid var(--line);border-radius:20px;padding:14px 16px;margin-bottom:10px}\n.sc-step2 .fc.open{border-color:#34426A}\n.sc-step2 .fc-h{display:flex;align-items:center;gap:12px;min-height:44px}\n.sc-step2 .fc-t{flex:1;min-width:0}\n.sc-step2 .fc-t h2{margin:0;font-size:15.5px;font-weight:600}\n.sc-step2 .fc-t p{margin:2px 0 0;font-size:13px;color:var(--muted);line-height:1.35}\n.sc-step2 .ico{width:36px;height:36px;border-radius:11px;background:rgba(91,140,255,.14);color:var(--blue);display:grid;place-items:center;flex:none}\n.sc-step2 .fc-b{margin-top:14px;padding-top:4px;border-top:1px solid var(--line)}\n.sc-step2 .sw{width:50px;height:30px;border-radius:999px;border:0;background:#334060;position:relative;cursor:pointer;flex:none;padding:0;transition:background .2s}\n.sc-step2 .sw::after{content:'';position:absolute;top:3px;left:3px;width:24px;height:24px;border-radius:50%;background:#fff;transition:transform .2s}\n.sc-step2 .sw[aria-checked=true]{background:var(--blue)}\n.sc-step2 .sw[aria-checked=true]::after{transform:translateX(20px)}\n.sc-step2 .field{display:flex;flex-direction:column;gap:6px;margin-top:14px;font-size:13px;font-weight:600;color:var(--muted)}\n.sc-step2 .lab{font-size:13px;font-weight:600;color:var(--muted);margin:14px 0 8px}\n.sc-step2 .note{font-size:13.5px;color:var(--muted);margin:0;line-height:1.45}\n.sc-step2 .inp{background:var(--night);border:1px solid var(--line);border-radius:12px;color:var(--text);font:inherit;font-size:15px;font-weight:400;padding:11px 14px;min-height:48px;width:100%;color-scheme:dark}\n.sc-step2 textarea.inp{resize:none;line-height:1.5}\n.sc-step2 .dm{background:var(--night);border-radius:14px;padding:12px;display:flex;flex-direction:column;align-items:flex-start;gap:8px;margin-top:14px}\n.sc-step2 .bub{background:var(--panel2);border-radius:16px 16px 16px 4px;padding:10px 12px;font-size:14px;line-height:1.45;max-width:90%}\n.sc-step2 .qr{border:1px solid var(--blue);color:var(--blue);border-radius:999px;padding:7px 16px;font-size:13.5px;font-weight:600}\n.sc-step2 .num{display:flex;align-items:center;gap:8px}\n.sc-step2 .num button{width:46px;height:46px;border-radius:12px;border:1px solid var(--line);background:var(--panel2);color:var(--text);display:grid;place-items:center;cursor:pointer;flex:none}\n.sc-step2 .num .inp{width:72px;text-align:center;padding:0 6px;font-weight:600}\n.sc-step2 .slot{border-radius:14px;padding:12px}\n.sc-step2 .slot.empty{border:1.5px dashed #3B486B;display:flex;flex-direction:column;gap:10px}\n.sc-step2 .slot.empty p{margin:0;font-size:14px;color:var(--muted)}\n.sc-step2 .s-btns{display:flex;gap:8px}\n.sc-step2 .s-btns .btn2{flex:1;justify-content:center}\n.sc-step2 .btn2{border:1px solid var(--line);background:var(--panel2);color:var(--text);font-weight:600;font-size:14px;border-radius:12px;padding:0 14px;min-height:46px;cursor:pointer;display:inline-flex;align-items:center;gap:4px}\n.sc-step2 .btn2.blue{background:var(--blue);border-color:var(--blue);color:#0B1020}\n.sc-step2 .slot.filled{background:var(--night);border:1px solid var(--line);display:grid;grid-template-columns:auto 1fr;gap:4px 10px}\n.sc-step2 .slot.filled p{margin:0;font-size:14px;line-height:1.5}\n.sc-step2 .s-ico{color:var(--blue);margin-top:2px}\n.sc-step2 .s-act{grid-column:2;display:flex;gap:4px;margin-top:2px}\n.sc-step2 .s-act button{background:transparent;border:0;color:var(--blue);font-weight:600;font-size:14px;min-height:40px;padding:0 10px 0 0;cursor:pointer}\n.sc-step2 .s-act button:last-child{color:var(--muted)}\n.sc-step2 .clamp{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}\n.sc-step2 .clamp2{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}\n.sc-step2 .ed-foot{border-top:1px solid var(--line);background:var(--panel);padding:12px 16px 14px;display:flex;flex-direction:column;gap:10px}\n.sc-step2 .sum{margin:0;font-size:13.5px;line-height:1.5;color:#C9D1E6;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}\n.sc-step2 .sum.warn{color:var(--amber)}\n.sc-step2 .btns{display:flex;gap:10px}\n.sc-step2 .ghost{background:transparent;border:1px solid var(--line);color:var(--text);border-radius:14px;font-weight:600;font-size:15px;min-height:50px;padding:0 20px;cursor:pointer}\n.sc-step2 .primary{flex:1;background:var(--blue);color:#0B1020;border:0;border-radius:14px;font-weight:700;font-size:15px;min-height:50px;padding:0 18px;cursor:pointer}\n.sc-step2 .primary:disabled{background:var(--panel2);color:var(--muted);cursor:not-allowed}\n.sc-step2 .primary.wide{width:100%;margin-top:16px}\n.sc-step2 .scrim{position:absolute;inset:0;background:rgba(5,8,14,.62);display:flex;align-items:flex-end;z-index:5}\n.sc-step2 .sheet{width:100%;max-height:88%;overflow-y:auto;background:var(--panel);border-radius:26px 26px 0 0;border-top:1px solid var(--line);padding:8px 16px 20px;animation:up .24s ease-out;box-shadow:0 -16px 40px rgba(0,0,0,.4)}\n@keyframes up{from{transform:translateY(40px);opacity:.4}to{transform:none;opacity:1}}\n.sc-step2 .grab{width:40px;height:4px;border-radius:2px;background:var(--line);margin:4px auto 6px}\n.sc-step2 .sh-head{display:flex;align-items:center;justify-content:space-between}\n.sc-step2 .sh-head h2{margin:0;font-size:19px;font-weight:700}\n.sc-step2 .mlist{display:flex;flex-direction:column;gap:6px;margin-top:10px}\n.sc-step2 .mrow{display:flex;align-items:center;gap:10px;text-align:left;background:var(--night);border:1px solid var(--line);color:var(--text);border-radius:14px;padding:12px 14px;min-height:58px;font-size:14px;line-height:1.45;cursor:pointer}\n.sc-step2 .mrow > span{flex:1}\n.sc-step2 .mrow[aria-pressed=true]{border-color:var(--blue);background:rgba(91,140,255,.12)}\n.sc-step2 .mrow .tick{color:var(--blue);flex:none}\n.sc-step2 .add-new{width:100%;min-height:52px;margin-top:12px;border:1.5px dashed #3B486B;background:transparent;color:var(--blue);border-radius:14px;font-weight:700;font-size:15px;display:flex;align-items:center;justify-content:center;gap:8px;cursor:pointer}\n.sc-step2 .toast-wrap{position:absolute;left:0;right:0;bottom:130px;display:flex;justify-content:center;z-index:9;pointer-events:none}\n.sc-step2 .toast{background:var(--panel2);border:1px solid var(--line);color:var(--text);font-weight:600;font-size:14px;padding:10px 16px;border-radius:999px;display:flex;gap:6px;align-items:center;animation:up .2s ease-out}\n.sc-step2 .toast.ok{background:var(--mint);border-color:var(--mint);color:#062015;font-weight:700}\n.sc-step2 .mtxt{display:flex;flex-direction:column;gap:2px;min-width:0}\n.sc-step2 .mtxt b{font-size:15px;font-weight:600}\n.sc-step2 .mtxt small{font-size:13px;color:var(--muted);font-weight:400;line-height:1.4}\n.sc-step2 .chips{display:flex;gap:8px;overflow-x:auto;margin:14px -16px 12px;padding:0 16px 2px}\n.sc-step2 .chipb{flex:none;min-height:40px;padding:0 14px;border-radius:999px;border:1px solid var(--line);background:var(--panel);color:var(--muted);font-size:13.5px;font-weight:600;cursor:pointer;white-space:nowrap;display:inline-flex;align-items:center;gap:6px}\n.sc-step2 .chipb[aria-pressed=true]{border-color:var(--blue);background:rgba(91,140,255,.12);color:var(--text)}\n.sc-step2 .add-new.solid{margin-top:4px;background:rgba(91,140,255,.1);border:1px solid rgba(91,140,255,.35)}\n.sc-step2 .mopt{display:flex;align-items:center;gap:12px;width:100%;text-align:left;background:var(--panel);border:1px solid var(--line);color:var(--text);border-radius:16px;padding:12px 14px;min-height:66px;cursor:pointer;margin-bottom:8px}\n.sc-step2 .mopt[aria-pressed=true]{border-color:var(--blue);background:rgba(91,140,255,.12)}\n.sc-step2 .mopt .mtxt{flex:1}\n.sc-step2 .mopt .tick{color:var(--blue);flex:none}\n.sc-step2 .none2{text-align:center;color:var(--muted);font-size:14px;margin:24px 0}\n.sc-step2 .chan-chip{display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:0 10px 0 6px;border-radius:999px;border:1px solid var(--line);background:var(--panel);color:var(--text);font-size:14px;font-weight:600;cursor:pointer;max-width:170px}\n.sc-step2 .chan-chip .cname{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.sc-step2 .chan-chip .chv{color:var(--muted);flex:none}\n.sc-step2 .chan-chip.wide{width:100%;max-width:none;justify-content:flex-start;padding:8px 14px 8px 8px;min-height:58px;border-radius:16px;font-size:15.5px}\n.sc-step2 .chan-chip.wide .cname{flex:1;text-align:left}\n.sc-step2 .cav{width:32px;height:32px;border-radius:50%;display:grid;place-items:center;font-weight:700;font-size:14px;background:hsl(var(--h,220) 38% 26%);color:#E6ECFA;flex:none;position:relative}\n.sc-step2 .cav.lg{width:40px;height:40px;font-size:16px}\n.sc-step2 .cav .warn-dot{position:absolute;right:-1px;bottom:-1px;width:11px;height:11px;border-radius:50%;background:var(--amber);border:2px solid var(--panel)}\n.sc-step2 .crow{width:100%;display:flex;align-items:center;gap:12px;text-align:left;background:var(--night);border:1px solid var(--line);color:var(--text);border-radius:14px;padding:10px 14px;min-height:64px;cursor:pointer;margin-top:8px}\n.sc-step2 .crow[aria-pressed=true]{border-color:var(--blue);background:rgba(91,140,255,.12)}\n.sc-step2 .crow .ct{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}\n.sc-step2 .crow b{font-size:15.5px;font-weight:600}\n.sc-step2 .crow small{font-size:13px;color:var(--muted)}\n.sc-step2 .crow small.warn{color:var(--amber)}\n.sc-step2 .crow .tick{color:var(--blue);flex:none}\n.sc-step2 .crow.addc{border:1.5px dashed #3B486B;background:transparent;color:var(--blue);font-weight:700;justify-content:center;gap:8px}\n.sc-step2 .sh-link{background:transparent;border:0;color:var(--blue);font-weight:600;font-size:14.5px;min-height:44px;cursor:pointer;padding:0 4px;margin-top:6px}\n.sc-step2 .chan-banner{display:flex;align-items:center;gap:12px;margin:12px 16px 0;padding:12px 12px 12px 14px;border-left:3px solid var(--amber);background:rgba(255,180,84,.08);border-radius:4px 14px 14px 4px}\n.sc-step2 .chan-banner.inline{margin:10px 0 0}\n.sc-step2 .chan-banner p{margin:0;flex:1;font-size:13.5px;line-height:1.45;color:#FFE3BC}\n.sc-step2 .chan-banner button{flex:none;min-height:40px;border-radius:12px;border:1px solid rgba(255,180,84,.5);background:transparent;color:var(--amber);font-weight:700;font-size:14px;padding:0 14px;cursor:pointer}\n.sc-step2 .chan-field{margin-bottom:14px}\n.sc-step2 .lab.first{margin-top:0}\n.sc-step2 .row-hdr{display:flex;align-items:center;justify-content:space-between;gap:10px}\n.sc-step2 .hdr-r{display:flex;align-items:center;gap:2px}\n.sc-step2 .icon-btn.sm{width:40px;height:40px;border-radius:12px;color:var(--muted)}\n.sc-step2 .scrim{position:absolute;inset:0;background:rgba(5,8,14,.62);display:flex;align-items:flex-end;z-index:5}\n.sc-step2 .sheet{width:100%;max-height:88%;overflow-y:auto;background:var(--panel);border-radius:26px 26px 0 0;border-top:1px solid var(--line);padding:8px 16px 20px;animation:up .24s ease-out;box-shadow:0 -16px 40px rgba(0,0,0,.4)}\n.sc-step2 .grab{width:40px;height:4px;border-radius:2px;background:var(--line);margin:4px auto 6px}\n.sc-step2 .sh-head{display:flex;align-items:center;justify-content:space-between;gap:8px}\n.sc-step2 .sh-head h2{margin:0;font-size:19px;font-weight:700}\n.sc-step2 .sk{display:block;background:linear-gradient(90deg,var(--panel2) 0%,#27324C 50%,var(--panel2) 100%);background-size:200% 100%;animation:shimmer 1.4s ease-in-out infinite}\n.sc-step2 .skcard{background:var(--panel);border:1px solid var(--line);border-radius:20px;padding:16px;display:flex;flex-direction:column;gap:12px}\n.sc-step2 .skrow{display:flex;align-items:center;gap:12px}\n.sc-step2 .errcard{display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px;padding:32px 20px;background:var(--panel);border:1px dashed #3B486B;border-radius:20px}\n.sc-step2 .errcard .eico{width:52px;height:52px;border-radius:50%;background:rgba(255,180,84,.14);color:var(--amber);display:grid;place-items:center;margin-bottom:6px}\n.sc-step2 .errcard h3{margin:0;font-size:17px}\n.sc-step2 .errcard p{margin:0 0 10px;font-size:14px;line-height:1.5;color:var(--muted);max-width:280px}\n.sc-step2 .errcard .retry{min-height:44px;border-radius:12px;border:1px solid var(--line);background:var(--panel2);color:var(--text);font-weight:700;font-size:14.5px;padding:0 18px;cursor:pointer;display:inline-flex;align-items:center;gap:8px}\n.sc-step2 .bspin{width:18px;height:18px;border-radius:50%;border:2.5px solid rgba(11,16,32,.25);border-top-color:#0B1020;animation:spinr .8s linear infinite;flex:none}\n.sc-step2 .inline-err{display:flex;align-items:flex-start;gap:8px;font-size:13.5px;line-height:1.45;color:var(--amber);margin:0}\n.sc-step2 .inline-err svg{flex:none;margin-top:2px}\n.sc-step2 .ubar{display:block;height:4px;border-radius:2px;background:var(--panel2);overflow:hidden;margin-top:6px}\n.sc-step2 .ubar i{display:block;height:100%;width:0;background:var(--blue);animation:fillbar linear forwards}\n.sc-step2 .fitem .rt small.bad{color:var(--amber)}\n.sc-step2 .retry-link{background:transparent;border:0;color:var(--blue);font-weight:700;font-size:13.5px;min-height:40px;padding:0 8px;cursor:pointer}\n.sc-step2 .primary .bspin{margin-right:2px}\n.sc-step2 .metanote{display:flex;gap:8px;align-items:flex-start;font-size:13px;line-height:1.5;color:var(--muted);margin:14px 0 0}\n.sc-step2 .metanote svg{flex:none;margin-top:2px;color:var(--blue)}\n.sc-step2 .metanote.warn{color:#FFE3BC}\n.sc-step2 .metanote.warn svg{color:var(--amber)}\n.sc-step2 .chipset{display:flex;flex-wrap:wrap;gap:6px}\n.sc-step2 .chipset button{min-height:40px;padding:0 14px;border-radius:999px;border:1px solid var(--line);background:var(--night);color:var(--muted);font-size:13.5px;font-weight:600;cursor:pointer}\n.sc-step2 .chipset button[aria-pressed=true]{border-color:var(--blue);background:rgba(91,140,255,.12);color:var(--text)}\n.sc-step2 .sw:disabled{opacity:.4;cursor:not-allowed}\n.sc-step2 .stepper{padding-left:14px;padding-right:14px}\n.sc-step2 .st{width:64px}\n.sc-step2 .st span{font-size:11.5px}\n.sc-step2 .card.auto.clickable,.sc-step2 .card.msg.clickable{cursor:pointer}\n.sc-step2 .row2{display:flex;align-items:center;justify-content:space-between;gap:8px}\n.sc-step2 .text-btn{background:transparent;border:0;color:var(--blue);font-weight:600;font-size:14px;min-height:40px;padding:0 6px;cursor:pointer;display:inline-flex;align-items:center;gap:6px}\n.sc-step2 .big-warn{width:68px;height:68px;border-radius:50%;background:rgba(255,180,84,.14);color:var(--amber);display:grid;place-items:center}\n.sc-step2 .sheet.tall{height:92%;max-height:92%;display:flex;flex-direction:column;padding:8px 0 0;overflow:hidden}\n.sc-step2 .mpv-ctl{padding:8px 16px 0;display:flex;flex-direction:column;gap:8px}\n.sc-step2 .mpv-row{display:flex;gap:8px;align-items:flex-end}\n.sc-step2 .mpv-seg{display:flex;background:var(--night);border-radius:12px;padding:3px;gap:2px;flex:1}\n.sc-step2 .mpv-seg button{flex:1;border:0;background:transparent;color:var(--muted);font-size:13px;font-weight:600;padding:7px;border-radius:9px;cursor:pointer;min-height:38px;display:inline-flex;align-items:center;justify-content:center;gap:6px}\n.sc-step2 .mpv-seg button[aria-pressed=true]{background:var(--panel2);color:var(--text)}\n.sc-step2 .mpv-iconbtn{width:44px;height:44px;border-radius:12px;border:1px solid var(--line);background:var(--panel2);color:var(--text);display:grid;place-items:center;cursor:pointer;flex:none}\n.sc-step2 .mpv-in{flex:1;min-width:0;display:flex;flex-direction:column;gap:4px;font-size:12px;color:var(--muted);font-weight:600}\n.sc-step2 .mpv-in input{background:var(--night);border:1px solid var(--line);border-radius:10px;color:var(--text);font:inherit;font-size:14px;padding:0 10px;min-height:40px;width:100%;color-scheme:dark}\n.sc-step2 .mpv-ig{position:relative;flex:1;min-height:0;margin:10px 16px 0;border:1px solid var(--line);border-radius:22px;background:#0A0E17;display:flex;flex-direction:column;overflow:hidden}\n.sc-step2 .mpv-igh{display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid var(--line);font-weight:600;font-size:14.5px}\n.sc-step2 .mpv-igh small{display:block;color:var(--muted);font-weight:500;font-size:12px}\n.sc-step2 .mpv-chat{flex:1;overflow-y:auto;padding:14px 12px;display:flex;flex-direction:column;gap:8px}\n.sc-step2 .mpv-us{display:flex;flex-direction:column;align-items:flex-start;gap:6px;max-width:100%}\n.sc-step2 .mpv-bub{max-width:84%;border-radius:20px;padding:10px 14px;font-size:14.5px;line-height:1.45;overflow-wrap:anywhere;white-space:pre-wrap}\n.sc-step2 .mpv-bub.bot{background:#262F45}\n.sc-step2 .mpv-bub.me{background:var(--blue);color:#0B1020;align-self:flex-end}\n.sc-step2 .mpv-bub.mpv-ph{color:var(--muted);font-style:italic}\n.sc-step2 .mpv-bub.mpv-na{background:transparent;border:1px dashed #3B486B;color:var(--muted);font-size:13.5px}\n.sc-step2 .mpv-note{align-self:flex-end;font-size:11.5px;color:var(--muted);max-width:80%;text-align:right}\n.sc-step2 .mpv-link{background:transparent;border:0;padding:0;color:#8FB0FF;text-decoration:underline;font:inherit;cursor:pointer;text-align:left}\n.sc-step2 .mpv-btns{display:flex;flex-direction:column;gap:4px;width:min(84%,270px)}\n.sc-step2 .mpv-btn{background:#262F45;border:0;border-radius:14px;padding:11px 10px;color:#8FB0FF;font-weight:600;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;font-family:inherit}\n.sc-step2 .mpv-q{display:flex;flex-wrap:wrap;gap:6px}\n.sc-step2 .mpv-pill{background:transparent;border:1px solid #6E97FF;color:#8FB0FF;border-radius:999px;padding:8px 14px;font-size:13.5px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:5px;font-family:inherit}\n.sc-step2 .mpv-rail{display:flex;gap:8px;overflow-x:auto;scroll-snap-type:x mandatory;max-width:100%;padding-bottom:6px}\n.sc-step2 .mpv-card{flex:none;width:210px;scroll-snap-align:start;background:#262F45;border-radius:18px;overflow:hidden}\n.sc-step2 .mpv-card img{width:100%;height:120px;object-fit:cover;display:block}\n.sc-step2 .mpv-cb{padding:10px 12px;display:flex;flex-direction:column;gap:2px;cursor:pointer;background:transparent;border:0;color:inherit;text-align:left;width:100%;font-family:inherit}\n.sc-step2 .mpv-cb b{font-size:14.5px}\n.sc-step2 .mpv-cb span{font-size:13px;color:#B9C3DB}\n.sc-step2 .mpv-cbtn{display:block;width:100%;border:0;border-top:1px solid #34405D;background:transparent;text-align:center;padding:10px 8px;color:#8FB0FF;font-weight:600;font-size:14px;cursor:pointer;font-family:inherit}\n.sc-step2 .mpv-dots{display:flex;gap:5px;justify-content:center;width:100%}\n.sc-step2 .mpv-dots i{width:6px;height:6px;border-radius:50%;background:#3B486B}\n.sc-step2 .mpv-dots i.on{background:#8FB0FF}\n.sc-step2 .mpv-imgs{display:grid;grid-template-columns:repeat(2,1fr);gap:4px;width:min(84%,250px)}\n.sc-step2 .mpv-imgs.one{grid-template-columns:1fr;width:min(70%,220px)}\n.sc-step2 .mpv-imgs img{width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:16px}\n.sc-step2 .mpv-imgs.one img{aspect-ratio:auto;max-height:260px}\n.sc-step2 .mpv-file{display:flex;align-items:center;gap:10px;background:#262F45;border-radius:16px;padding:10px 14px 10px 10px;max-width:84%}\n.sc-step2 .mpv-file .fi{width:40px;height:40px;border-radius:12px;background:rgba(91,140,255,.16);color:var(--blue);display:grid;place-items:center;flex:none}\n.sc-step2 .mpv-file b{display:block;font-size:14px;overflow-wrap:anywhere}\n.sc-step2 .mpv-file small{color:var(--muted);font-size:12px}\n.sc-step2 .mpv-video{position:relative;width:min(84%,230px);aspect-ratio:9/12;background:#1A2233;border-radius:18px;display:grid;place-items:center;color:var(--muted);font-size:12px}\n.sc-step2 .mpv-play{width:52px;height:52px;border-radius:50%;background:rgba(0,0,0,.55);color:#fff;display:grid;place-items:center}\n.sc-step2 .mpv-audio{display:flex;align-items:center;gap:10px;background:#262F45;border-radius:22px;padding:8px 16px 8px 8px;color:var(--muted);font-size:12px}\n.sc-step2 .mpv-audio .wv{display:flex;align-items:center;gap:2px;height:22px}\n.sc-step2 .mpv-audio .wv i{width:3px;border-radius:2px;background:#8FB0FF}\n.sc-step2 .mpv-composer{margin:8px 12px 12px;border:1px solid var(--line);border-radius:999px;padding:11px 16px;color:#5D6883;font-size:14px}\n.sc-step2 .mpv-snack{position:absolute;left:12px;right:12px;bottom:64px;background:#EAEEF8;color:#0F1420;font-weight:600;font-size:13.5px;padding:10px 14px;border-radius:12px;text-align:center}\n.sc-step2 .mpv-foot{padding:10px 16px 16px;display:flex;flex-direction:column;gap:6px}\n.sc-step2 .mpv-lim{font-size:13px;color:var(--muted)}\n.sc-step2 .mpv-iss{display:flex;gap:8px;font-size:13px;line-height:1.45;color:#FFE3BC}\n.sc-step2 .mpv-iss svg{flex:none;margin-top:2px;color:var(--amber)}\n";

const MT = {
  generic: { label: "Generic", icon: Layers },
  text: { label: "Text", icon: Type },
  media: { label: "Media", icon: ImageIcon },
  button: { label: "Button & text", icon: MousePointerClick },
  quick: { label: "Quick reply", icon: Zap },
};

function WizardStep2(props) {
  const { msgs, chosen, setChosen } = props;
  const [ld, retryLoad] = useLoad("msgs", 700, props.active);
  const [type, setType] = useState("all");
  const [pv, setPv] = useState(false);
  const list = msgs.filter((m) => type === "all" || m.type === type);
  const cur = msgs.find((m) => m.id === chosen) || null;
  const hasComment = (props.triggers || []).includes("comment");
  return (
    <div className="sc-step2 screen">
      <style>{CSS}</style>
      <div className="ed-top">
        <button type="button" className="icon-btn" aria-label="Back" onClick={() => props.onBack()}><ChevronLeft size={26} /></button>
        <h1>Create reply message</h1>
      </div>

      <div className="stepper" aria-label="Step 2 of 4">
        <div className="st done"><i><Check size={16} strokeWidth={3} /></i><span>Conditions</span></div>
        <b className="ln done" />
        <div className="st active" aria-current="step"><i>2</i><span>Message</span></div>
        <b className="ln" />
        <div className="st"><i>3</i><span>Extras</span></div>
        <b className="ln" />
        <div className="st"><i>4</i><span>Review</span></div>
      </div>

      <div className="scr">
        <div className="ed-scroll">
          <p className="intro">Choose the message this automation sends, or create a new one.</p>
          {hasComment && (
            <p className="metanote warn"><Info size={16} /><span>Comments get one private message per commenter, within 7 days. Meta’s documentation shows text for this, so check other types on a test account before you rely on them.</span></p>
          )}
          <button type="button" className="add-new solid" onClick={() => props.onCreate()}>
            <Plus size={20} strokeWidth={2.6} /> Create new message
          </button>

          <div className="chips" role="group" aria-label="Message type">
            <button type="button" className="chipb" aria-pressed={type === "all"} onClick={() => setType("all")}>All</button>
            {Object.keys(MT).map((k) => (
              <button key={k} type="button" className="chipb" aria-pressed={type === k} onClick={() => setType(k)}>{MT[k].label}</button>
            ))}
          </div>

          {ld.status === "loading" && [0, 1, 2, 3].map((i) => (
            <div key={i} className="mopt" role="status" aria-busy="true" aria-label="Loading messages">
              <Skeleton h={36} w={36} r={11} />
              <span className="mtxt" style={{ flex: 1 }}><Skeleton h={15} w="50%" /><Skeleton h={12} w="85%" /></span>
            </div>
          ))}
          {ld.status === "error" && <LoadError err={ld.err} onRetry={retryLoad} what="your messages" />}
          {ld.status === "ready" && list.map((m) => {
            const T = MT[m.type];
            const on = chosen === m.id;
            return (
              <button key={m.id} type="button" className="mopt" aria-pressed={on} onClick={() => setChosen(m.id)}>
                <span className="ico"><T.icon size={18} /></span>
                <span className="mtxt">
                  <b dir="auto">{m.name}</b>
                  <small className="clamp2" dir="auto">{T.label}: {m.preview}</small>
                </span>
                {on && <Check size={18} strokeWidth={3} className="tick" />}
              </button>
            );
          })}
          {ld.status === "ready" && list.length === 0 && <p className="none2">No messages of this type yet.</p>}
          {hasComment && cur && cur.type !== "text" && (
            <p className="metanote warn"><Info size={16} /><span>“{cur.name}” is a {MT[cur.type].label.toLowerCase()} message. That type isn’t documented for comment replies.</span></p>
          )}
        </div>
      </div>

      <footer className="ed-foot">
        <div className="row2">
          <p className={"sum" + (cur ? "" : " warn")} aria-live="polite">{cur ? `Sends “${cur.name}”.` : "Choose a message to continue."}</p>
          {cur && <button type="button" className="text-btn" onClick={() => setPv(true)}><Eye size={16} /> Preview</button>}
        </div>
        <div className="btns">
          <button type="button" className="ghost" onClick={() => props.onBack()}>Back</button>
          <button type="button" className="primary" disabled={!cur} onClick={() => props.onNext()}>Next</button>
        </div>
      </footer>

      {pv && cur && <MsgPreviewSheet m={cur} channel={props.channel} onClose={() => setPv(false)} />}
    </div>
  );
}

return { Component: WizardStep2 };

})();

/* ═════════ Step3Mod ═════════ */
const Step3Mod = (() => {

/* ───────────── data ───────────── */

const SEED = [
  { id: 1, text: "Thanks for asking! Our prices start at $20. Want the full list?" },
  { id: 2, text: "Hi! Just checking in. Are you still interested?" },
  { id: 3, text: "Thanks for your comment! I just sent you a DM." },
  { id: 4, text: "You’ve reached the reply limit for now. Message us again tomorrow." },
  { id: 5, text: "ممنون از پیامت! به‌زودی جواب می‌دیم." },
];

const FEATURES = [
  { key: "follow", title: "Follow prompt", desc: "Ask people to follow you first", icon: UserPlus },
  { key: "reminder", title: "Reminder message", desc: "Follow up with a saved message", icon: Bell },
  { key: "limit", title: "Reply limit", desc: "Stop after a set number of replies", icon: Hourglass },
  { key: "comment", title: "Public comment reply", desc: "Answer under the comment", icon: Reply },
  { key: "like", title: "Like their message", desc: "Send a like along with your reply", icon: Heart },
  { key: "notice", title: "Automated notice", desc: "Say this is an automated reply", icon: Bot },
  { key: "handoff", title: "Talk to a human", desc: "Let people ask for a person", icon: Headphones },
];

const SLOT_LABEL = {
  reminder: "Reminder message",
  limit: "Message at the limit",
  comment: "Public reply",
};

let _id = 20;
const uid = () => ++_id;

function joinList(arr, word) {
  if (arr.length <= 1) return arr[0] || "";
  if (arr.length === 2) return `${arr[0]} ${word} ${arr[1]}`;
  return `${arr.slice(0, -1).join(", ")} ${word} ${arr[arr.length - 1]}`;
}

/* ───────────── small components ───────────── */

function Switch({ on, onChange, label, disabled }) {
  return <button type="button" role="switch" aria-checked={on} aria-label={label} className="sw" disabled={disabled} onClick={onChange} />;
}

function Feature({ f, on, onToggle, dis, children }) {
  return (
    <section className={"fc" + (on ? " open" : "")} aria-label={f.title}>
      <div className="fc-h">
        <span className="ico"><f.icon size={20} /></span>
        <div className="fc-t">
          <h2>{f.title}</h2>
          <p>{dis || f.desc}</p>
        </div>
        <Switch on={on} onChange={onToggle} label={f.title} disabled={!!dis} />
      </div>
      {on && f.key !== "like" && <div className="fc-b">{children}</div>}
    </section>
  );
}

function MessageSlot({ label, msg, onSelect, onCreate, onClear }) {
  return (
    <>
      <p className="lab">{label}</p>
      {msg ? (
        <div className="slot filled">
          <MessageSquare size={18} className="s-ico" />
          <p className="clamp" dir="auto"><b>{msg.name}</b>{": "}{msg.preview}</p>
          <div className="s-act">
            <button type="button" onClick={onSelect}>Change</button>
            <button type="button" onClick={onClear}>Remove</button>
          </div>
        </div>
      ) : (
        <div className="slot empty">
          <p>No message chosen yet.</p>
          <div className="s-btns">
            <button type="button" className="btn2" onClick={onSelect}>Select</button>
            <button type="button" className="btn2 blue" onClick={onCreate}><Plus size={16} /> Create new</button>
          </div>
        </div>
      )}
    </>
  );
}

/* ───────────── main ───────────── */

function CreateReplyStep3(props) {
  const [on, setOn] = useState({ follow: true, reminder: false, limit: false, comment: false, like: false, notice: true, handoff: false });
  const [follow, setFollow] = useState({ msg: "Follow us first to get the price list.", btn: "I’ve followed" });
  const [limitN, setLimitN] = useState(3);
  const [reminderH, setReminderH] = useState(3);
  const [notice, setNotice] = useState("This is an automated reply.");
  const [handoffLabel, setHandoffLabel] = useState("Talk to a human");
  const [pauseD, setPauseD] = useState(1);
  const trig = props.triggers || [];
  const commentOnly = trig.length > 0 && trig.every((t) => t === "comment");
  const hasComment = trig.includes("comment");
  const disabledFor = (k) => {
    if (!commentOnly) return null;
    if (k === "reminder") return "Needs a message from the person. Comment-only automations can send one private reply.";
    if (k === "like") return "There is no message from the person to like. Comment-only automations can’t use this.";
    return null;
  };
  const msgs = props.msgs;
  const setMsgs = () => {};
  const net = useContext(NetCtx);
  const [busy, setBusy] = useState(false);
  const [actErr, setActErr] = useState(null);
  const activate = () => {
    setBusy(true);
    setActErr(null);
    net.call(1200).then(
      () => { setBusy(false); props.onActivate(); },
      (e) => { setBusy(false); setActErr(e); }
    );
  };
  const [sel, setSel] = useState({ reminder: null, limit: null, comment: null });
  const [sheet, setSheet] = useState(null); // { kind: 'select' | 'create', target }
  const [draft, setDraft] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const pre = props.preselect;
  useEffect(() => {
    if (pre && pre.n && ["reminder", "limit", "comment"].includes(pre.target)) {
      setSel((s) => ({ ...s, [pre.target]: pre.id }));
      setOn((o) => ({ ...o, [pre.target]: true }));
    }
  }, [pre && pre.n]);
  useEffect(() => {
    if (props.onState) props.onState({ on: { ...on, reminder: on.reminder && !disabledFor("reminder"), like: on.like && !disabledFor("like") }, limitN, reminderH, notice, handoffLabel, pauseD, follow, sel });
  }, [on, limitN, props.triggers, reminderH, notice, handoffLabel, pauseD, follow, sel]);

  const toggle = (k) => setOn((o) => ({ ...o, [k]: !o[k] }));
  const msgOf = (k) => msgs.find((m) => m.id === sel[k]) || null;

  const openSelect = (target) => setSheet({ kind: "select", target });
  const openCreate = (target) => {
    setSheet(null);
    props.onCreate(target);
  };
  const saveDraft = () => {
    const t = draft.trim();
    if (!t || !sheet) return;
    const id = uid();
    setMsgs((m) => [...m, { id, text: t }]);
    setSel((s) => ({ ...s, [sheet.target]: id }));
    setSheet(null);
  };

  const problem = useMemo(() => {
    if (on.follow && (!follow.msg.trim() || !follow.btn.trim())) return "Fill in the follow message and its button text.";
    if (on.reminder && !disabledFor("reminder") && !msgOf("reminder")) return "Choose a reminder message, or turn it off.";
    if (on.limit && limitN < 1) return "Set a reply limit of 1 or more.";
    if (on.limit && !msgOf("limit")) return "Choose the message to send at the limit.";
    if (on.comment && !msgOf("comment")) return "Choose a public comment reply, or turn it off.";
    if (on.notice && !notice.trim()) return "Write the automated notice, or turn it off.";
    if (on.handoff && !handoffLabel.trim()) return "Give the handoff button a label, or turn it off.";
    return null;
  }, [on, follow, limitN, sel, msgs, notice, handoffLabel, props.triggers]);

  const summary = useMemo(() => {
    const items = [];
    if (on.follow) items.push("a follow prompt");
    if (on.reminder && !disabledFor("reminder")) items.push(`a reminder after ${reminderH} ${reminderH === 1 ? "hour" : "hours"}`);
    if (on.limit) items.push(`a limit of ${limitN} ${limitN === 1 ? "reply" : "replies"}`);
    if (on.comment) items.push("a public comment reply");
    if (on.like && !disabledFor("like")) items.push("a like");
    if (on.notice) items.push("an automated notice");
    if (on.handoff) items.push("a human handoff button");
    return items.length ? `Extras: ${joinList(items, "and")}.` : "No extras. Your reply is sent as it is.";
  }, [on, limitN, reminderH, props.triggers]);

  const slotProps = (k) => ({
    label: SLOT_LABEL[k],
    msg: msgOf(k),
    onSelect: () => openSelect(k),
    onCreate: () => openCreate(k),
    onClear: () => setSel((s) => ({ ...s, [k]: null })),
  });

  const soon = () => setToast("Not part of this mockup");

  return (
    <div className="sc-step3 screen">
      <style>{CSS}</style>
        <div className="ed-top">
          <button type="button" className="icon-btn" aria-label="Back" onClick={() => props.onBack()}><ChevronLeft size={26} /></button>
          <h1>Create reply message</h1>
        </div>

        <div className="stepper" aria-label="Step 3 of 4">
          <div className="st done"><i><Check size={16} strokeWidth={3} /></i><span>Conditions</span></div>
          <b className="ln done" />
          <div className="st done"><i><Check size={16} strokeWidth={3} /></i><span>Message</span></div>
          <b className="ln done" />
          <div className="st active" aria-current="step"><i>3</i><span>Extras</span></div>
          <b className="ln" />
          <div className="st"><i>4</i><span>Review</span></div>
        </div>

        <div className="scr">
          <div className="ed-scroll">
            <p className="intro">Optional extras. Switch on only what you need.</p>
            {hasComment && (
              <p className="metanote warn"><Info size={16} /><span>Comments get one private reply per commenter, within 7 days. If Follow prompt is on, it is that one reply, and your main message goes out after they tap.</span></p>
            )}

            {FEATURES.map((f) => {
              const dis = disabledFor(f.key);
              return (
              <Feature key={f.key} f={f} dis={dis} on={on[f.key] && !dis} onToggle={() => { if (!dis) toggle(f.key); }}>
                {f.key === "follow" && (
                  <>
                    <label className="field">
                      Message
                      <textarea
                        className="inp"
                        dir="auto"
                        rows={2}
                        value={follow.msg}
                        placeholder="Ask them to follow you"
                        onChange={(e) => setFollow({ ...follow, msg: e.target.value })}
                      />
                    </label>
                    <label className="field">
                      Button text
                      <input
                        className="inp"
                        dir="auto"
                        value={follow.btn}
                        placeholder="What the button says"
                        onChange={(e) => setFollow({ ...follow, btn: e.target.value })}
                      />
                    </label>
                    <p className="metanote"><Info size={16} /><span>We check whether they follow you after they tap the button. Instagram shares this only once the person has messaged you.</span></p>
                    {(follow.msg.trim() || follow.btn.trim()) && (
                      <div className="dm" aria-label="Preview of the follow prompt">
                        {follow.msg.trim() && <div className="bub" dir="auto">{follow.msg}</div>}
                        {follow.btn.trim() && <div className="qr" dir="auto">{follow.btn}</div>}
                      </div>
                    )}
                  </>
                )}

                {f.key === "reminder" && (
                  <>
                    <p className="lab" style={{ marginTop: 0 }}>Send after</p>
                    <div className="chipset" role="group" aria-label="Reminder delay">
                      {[1, 3, 6, 12, 23].map((h) => (
                        <button key={h} type="button" aria-pressed={reminderH === h} onClick={() => setReminderH(h)}>{h} {h === 1 ? "hour" : "hours"}</button>
                      ))}
                    </div>
                    <p className="metanote"><Info size={16} /><span>Sent only if they haven’t replied. Instagram allows messages for 24 hours after someone’s last message, so 23 hours is the longest delay.</span></p>
                    <MessageSlot {...slotProps("reminder")} />
                  </>
                )}

                {f.key === "limit" && (
                  <>
                    <p className="lab" style={{ marginTop: 0 }}>Stop after</p>
                    <div className="num">
                      <button type="button" aria-label="One fewer" onClick={() => setLimitN(Math.max(1, limitN - 1))}><Minus size={18} /></button>
                      <input
                        className="inp"
                        type="number"
                        min="1"
                        inputMode="numeric"
                        aria-label="Reply limit"
                        value={limitN}
                        onChange={(e) => setLimitN(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      />
                      <button type="button" aria-label="One more" onClick={() => setLimitN(limitN + 1)}><Plus size={18} /></button>
                      <span className="note">replies</span>
                    </div>
                    <MessageSlot {...slotProps("limit")} />
                  </>
                )}

                {f.key === "comment" && <MessageSlot {...slotProps("comment")} />}

                {f.key === "notice" && (
                  <>
                    <label className="field">
                      Notice text
                      <input className="inp" dir="auto" value={notice} placeholder="This is an automated reply." onChange={(e) => setNotice(e.target.value)} />
                    </label>
                    <p className="metanote"><Info size={16} /><span>Added at the start of a conversation. Some places, such as California and Germany, require you to say people are talking to an automated service.</span></p>
                  </>
                )}

                {f.key === "handoff" && (
                  <>
                    <label className="field">
                      Button text
                      <input className="inp" dir="auto" value={handoffLabel} onChange={(e) => setHandoffLabel(e.target.value)} />
                    </label>
                    <p className="lab">Pause automations for that person</p>
                    <div className="chipset" role="group" aria-label="Pause length">
                      {[1, 3, 7].map((d) => (
                        <button key={d} type="button" aria-pressed={pauseD === d} onClick={() => setPauseD(d)}>{d} {d === 1 ? "day" : "days"}</button>
                      ))}
                    </div>
                    <p className="metanote"><Info size={16} /><span>You’ll get a notification. Replying more than 24 hours after their last message needs Meta’s Human Agent approval.</span></p>
                  </>
                )}
              </Feature>
              );
            })}
          </div>
        </div>

        <footer className="ed-foot">
          {actErr ? (
            <p className="inline-err" role="alert"><AlertTriangle size={16} /><span>{actErr.kind === "offline" ? "You’re offline. Your settings are kept. Try again when you’re back online." : "Couldn’t activate the automation. Your settings are kept."}</span></p>
          ) : (
            <p className={"sum" + (problem ? " warn" : "")} aria-live="polite">{problem || summary}</p>
          )}
          <div className="btns">
            <button type="button" className="ghost" onClick={() => props.onBack()}>Back</button>
            <button type="button" className="primary" disabled={!!problem} onClick={() => props.onNext()}>
              Review
            </button>
          </div>
        </footer>

        {sheet && (
          <div className="scrim" onClick={() => setSheet(null)}>
            <div className="sheet" role="dialog" aria-modal="true" aria-label={sheet.kind === "select" ? "Choose a message" : "New message"} onClick={(e) => e.stopPropagation()}>
              <div className="grab" />
              <div className="sh-head">
                <h2>{sheet.kind === "select" ? "Choose a message" : "New message"}</h2>
                <button type="button" className="icon-btn sm" aria-label="Close" onClick={() => setSheet(null)}><X size={20} /></button>
              </div>

              {sheet.kind === "select" ? (
                <>
                  <div className="mlist">
                    {msgs.map((m) => {
                      const chosen = sel[sheet.target] === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          className="mrow"
                          aria-pressed={chosen}
                          onClick={() => {
                            setSel((s) => ({ ...s, [sheet.target]: m.id }));
                            setSheet(null);
                          }}
                        >
                          <span className="mtxt"><b dir="auto">{m.name}</b><small className="clamp2" dir="auto">{m.preview}</small></span>
                          {chosen && <Check size={18} strokeWidth={3} className="tick" />}
                        </button>
                      );
                    })}
                  </div>
                  <button type="button" className="add-new" onClick={() => openCreate(sheet.target)}>
                    <Plus size={20} strokeWidth={2.6} /> Create new message
                  </button>
                </>
              ) : (
                <>
                  <label className="field" style={{ marginTop: 14 }}>
                    Message text
                    <textarea
                      className="inp"
                      dir="auto"
                      rows={4}
                      autoFocus
                      value={draft}
                      placeholder="Write the message people will receive"
                      onChange={(e) => setDraft(e.target.value)}
                    />
                  </label>
                  <button type="button" className="primary wide" disabled={!draft.trim()} onClick={saveDraft}>
                    Save and use
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {toast && (
          <div className="toast-wrap" role="status">
            <div className={"toast" + (toast === "Automation activated" ? " ok" : "")}>
              {toast === "Automation activated" && <Check size={16} strokeWidth={3} />}
              {toast}
            </div>
          </div>
        )}
    </div>
  );
}

/* ───────────── styles ───────────── */

const CSS = ".sc-step3 .scr{flex:1;overflow-y:auto;overscroll-behavior:contain}\n.sc-step3 .icon-btn{width:44px;height:44px;border-radius:14px;background:transparent;border:0;color:var(--text);display:grid;place-items:center;cursor:pointer;flex:none}\n.sc-step3 .icon-btn.sm{width:40px;height:40px;border-radius:12px;color:var(--muted)}\n.sc-step3 .ed-top{display:flex;align-items:center;gap:4px;padding:10px 12px 4px}\n.sc-step3 .ed-top h1{margin:0;font-size:19px;font-weight:700}\n.sc-step3 .stepper{display:flex;align-items:flex-start;padding:6px 20px 14px;border-bottom:1px solid var(--line)}\n.sc-step3 .st{display:flex;flex-direction:column;align-items:center;gap:6px;width:70px}\n.sc-step3 .st i{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;font-style:normal;font-weight:700;font-size:13px;background:var(--panel2);color:var(--muted)}\n.sc-step3 .st span{font-size:12px;color:var(--muted)}\n.sc-step3 .st.done i,.sc-step3 .st.active i{background:var(--blue);color:#0B1020}\n.sc-step3 .st.done span{color:#B9C3DB}\n.sc-step3 .st.active span{color:var(--text);font-weight:600}\n.sc-step3 .ln{flex:1;height:2px;background:var(--line);margin-top:14px;border:0}\n.sc-step3 .ln.done{background:var(--blue)}\n.sc-step3 .ed-scroll{padding:16px 16px 24px}\n.sc-step3 .intro{margin:0 0 14px;font-size:14.5px;line-height:1.5;color:var(--muted)}\n.sc-step3 .fc{background:var(--panel);border:1px solid var(--line);border-radius:20px;padding:14px 16px;margin-bottom:10px}\n.sc-step3 .fc.open{border-color:#34426A}\n.sc-step3 .fc-h{display:flex;align-items:center;gap:12px;min-height:44px}\n.sc-step3 .fc-t{flex:1;min-width:0}\n.sc-step3 .fc-t h2{margin:0;font-size:15.5px;font-weight:600}\n.sc-step3 .fc-t p{margin:2px 0 0;font-size:13px;color:var(--muted);line-height:1.35}\n.sc-step3 .ico{width:36px;height:36px;border-radius:11px;background:rgba(91,140,255,.14);color:var(--blue);display:grid;place-items:center;flex:none}\n.sc-step3 .fc-b{margin-top:14px;padding-top:4px;border-top:1px solid var(--line)}\n.sc-step3 .sw{width:50px;height:30px;border-radius:999px;border:0;background:#334060;position:relative;cursor:pointer;flex:none;padding:0;transition:background .2s}\n.sc-step3 .sw::after{content:'';position:absolute;top:3px;left:3px;width:24px;height:24px;border-radius:50%;background:#fff;transition:transform .2s}\n.sc-step3 .sw[aria-checked=true]{background:var(--blue)}\n.sc-step3 .sw[aria-checked=true]::after{transform:translateX(20px)}\n.sc-step3 .field{display:flex;flex-direction:column;gap:6px;margin-top:14px;font-size:13px;font-weight:600;color:var(--muted)}\n.sc-step3 .lab{font-size:13px;font-weight:600;color:var(--muted);margin:14px 0 8px}\n.sc-step3 .note{font-size:13.5px;color:var(--muted);margin:0;line-height:1.45}\n.sc-step3 .inp{background:var(--night);border:1px solid var(--line);border-radius:12px;color:var(--text);font:inherit;font-size:15px;font-weight:400;padding:11px 14px;min-height:48px;width:100%;color-scheme:dark}\n.sc-step3 textarea.inp{resize:none;line-height:1.5}\n.sc-step3 .dm{background:var(--night);border-radius:14px;padding:12px;display:flex;flex-direction:column;align-items:flex-start;gap:8px;margin-top:14px}\n.sc-step3 .bub{background:var(--panel2);border-radius:16px 16px 16px 4px;padding:10px 12px;font-size:14px;line-height:1.45;max-width:90%}\n.sc-step3 .qr{border:1px solid var(--blue);color:var(--blue);border-radius:999px;padding:7px 16px;font-size:13.5px;font-weight:600}\n.sc-step3 .num{display:flex;align-items:center;gap:8px}\n.sc-step3 .num button{width:46px;height:46px;border-radius:12px;border:1px solid var(--line);background:var(--panel2);color:var(--text);display:grid;place-items:center;cursor:pointer;flex:none}\n.sc-step3 .num .inp{width:72px;text-align:center;padding:0 6px;font-weight:600}\n.sc-step3 .slot{border-radius:14px;padding:12px}\n.sc-step3 .slot.empty{border:1.5px dashed #3B486B;display:flex;flex-direction:column;gap:10px}\n.sc-step3 .slot.empty p{margin:0;font-size:14px;color:var(--muted)}\n.sc-step3 .s-btns{display:flex;gap:8px}\n.sc-step3 .s-btns .btn2{flex:1;justify-content:center}\n.sc-step3 .btn2{border:1px solid var(--line);background:var(--panel2);color:var(--text);font-weight:600;font-size:14px;border-radius:12px;padding:0 14px;min-height:46px;cursor:pointer;display:inline-flex;align-items:center;gap:4px}\n.sc-step3 .btn2.blue{background:var(--blue);border-color:var(--blue);color:#0B1020}\n.sc-step3 .slot.filled{background:var(--night);border:1px solid var(--line);display:grid;grid-template-columns:auto 1fr;gap:4px 10px}\n.sc-step3 .slot.filled p{margin:0;font-size:14px;line-height:1.5}\n.sc-step3 .s-ico{color:var(--blue);margin-top:2px}\n.sc-step3 .s-act{grid-column:2;display:flex;gap:4px;margin-top:2px}\n.sc-step3 .s-act button{background:transparent;border:0;color:var(--blue);font-weight:600;font-size:14px;min-height:40px;padding:0 10px 0 0;cursor:pointer}\n.sc-step3 .s-act button:last-child{color:var(--muted)}\n.sc-step3 .clamp{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}\n.sc-step3 .clamp2{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}\n.sc-step3 .ed-foot{border-top:1px solid var(--line);background:var(--panel);padding:12px 16px 14px;display:flex;flex-direction:column;gap:10px}\n.sc-step3 .sum{margin:0;font-size:13.5px;line-height:1.5;color:#C9D1E6;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}\n.sc-step3 .sum.warn{color:var(--amber)}\n.sc-step3 .btns{display:flex;gap:10px}\n.sc-step3 .ghost{background:transparent;border:1px solid var(--line);color:var(--text);border-radius:14px;font-weight:600;font-size:15px;min-height:50px;padding:0 20px;cursor:pointer}\n.sc-step3 .primary{flex:1;background:var(--blue);color:#0B1020;border:0;border-radius:14px;font-weight:700;font-size:15px;min-height:50px;padding:0 18px;cursor:pointer}\n.sc-step3 .primary:disabled{background:var(--panel2);color:var(--muted);cursor:not-allowed}\n.sc-step3 .primary.wide{width:100%;margin-top:16px}\n.sc-step3 .scrim{position:absolute;inset:0;background:rgba(5,8,14,.62);display:flex;align-items:flex-end;z-index:5}\n.sc-step3 .sheet{width:100%;max-height:88%;overflow-y:auto;background:var(--panel);border-radius:26px 26px 0 0;border-top:1px solid var(--line);padding:8px 16px 20px;animation:up .24s ease-out;box-shadow:0 -16px 40px rgba(0,0,0,.4)}\n@keyframes up{from{transform:translateY(40px);opacity:.4}to{transform:none;opacity:1}}\n.sc-step3 .grab{width:40px;height:4px;border-radius:2px;background:var(--line);margin:4px auto 6px}\n.sc-step3 .sh-head{display:flex;align-items:center;justify-content:space-between}\n.sc-step3 .sh-head h2{margin:0;font-size:19px;font-weight:700}\n.sc-step3 .mlist{display:flex;flex-direction:column;gap:6px;margin-top:10px}\n.sc-step3 .mrow{display:flex;align-items:center;gap:10px;text-align:left;background:var(--night);border:1px solid var(--line);color:var(--text);border-radius:14px;padding:12px 14px;min-height:58px;font-size:14px;line-height:1.45;cursor:pointer}\n.sc-step3 .mrow > span{flex:1}\n.sc-step3 .mrow[aria-pressed=true]{border-color:var(--blue);background:rgba(91,140,255,.12)}\n.sc-step3 .mrow .tick{color:var(--blue);flex:none}\n.sc-step3 .add-new{width:100%;min-height:52px;margin-top:12px;border:1.5px dashed #3B486B;background:transparent;color:var(--blue);border-radius:14px;font-weight:700;font-size:15px;display:flex;align-items:center;justify-content:center;gap:8px;cursor:pointer}\n.sc-step3 .toast-wrap{position:absolute;left:0;right:0;bottom:130px;display:flex;justify-content:center;z-index:9;pointer-events:none}\n.sc-step3 .toast{background:var(--panel2);border:1px solid var(--line);color:var(--text);font-weight:600;font-size:14px;padding:10px 16px;border-radius:999px;display:flex;gap:6px;align-items:center;animation:up .2s ease-out}\n.sc-step3 .toast.ok{background:var(--mint);border-color:var(--mint);color:#062015;font-weight:700}\n.sc-step3 .mtxt{display:flex;flex-direction:column;gap:2px;min-width:0}\n.sc-step3 .mtxt b{font-size:15px;font-weight:600}\n.sc-step3 .mtxt small{font-size:13px;color:var(--muted);font-weight:400;line-height:1.4}\n.sc-step3 .chan-chip{display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:0 10px 0 6px;border-radius:999px;border:1px solid var(--line);background:var(--panel);color:var(--text);font-size:14px;font-weight:600;cursor:pointer;max-width:170px}\n.sc-step3 .chan-chip .cname{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.sc-step3 .chan-chip .chv{color:var(--muted);flex:none}\n.sc-step3 .chan-chip.wide{width:100%;max-width:none;justify-content:flex-start;padding:8px 14px 8px 8px;min-height:58px;border-radius:16px;font-size:15.5px}\n.sc-step3 .chan-chip.wide .cname{flex:1;text-align:left}\n.sc-step3 .cav{width:32px;height:32px;border-radius:50%;display:grid;place-items:center;font-weight:700;font-size:14px;background:hsl(var(--h,220) 38% 26%);color:#E6ECFA;flex:none;position:relative}\n.sc-step3 .cav.lg{width:40px;height:40px;font-size:16px}\n.sc-step3 .cav .warn-dot{position:absolute;right:-1px;bottom:-1px;width:11px;height:11px;border-radius:50%;background:var(--amber);border:2px solid var(--panel)}\n.sc-step3 .crow{width:100%;display:flex;align-items:center;gap:12px;text-align:left;background:var(--night);border:1px solid var(--line);color:var(--text);border-radius:14px;padding:10px 14px;min-height:64px;cursor:pointer;margin-top:8px}\n.sc-step3 .crow[aria-pressed=true]{border-color:var(--blue);background:rgba(91,140,255,.12)}\n.sc-step3 .crow .ct{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}\n.sc-step3 .crow b{font-size:15.5px;font-weight:600}\n.sc-step3 .crow small{font-size:13px;color:var(--muted)}\n.sc-step3 .crow small.warn{color:var(--amber)}\n.sc-step3 .crow .tick{color:var(--blue);flex:none}\n.sc-step3 .crow.addc{border:1.5px dashed #3B486B;background:transparent;color:var(--blue);font-weight:700;justify-content:center;gap:8px}\n.sc-step3 .sh-link{background:transparent;border:0;color:var(--blue);font-weight:600;font-size:14.5px;min-height:44px;cursor:pointer;padding:0 4px;margin-top:6px}\n.sc-step3 .chan-banner{display:flex;align-items:center;gap:12px;margin:12px 16px 0;padding:12px 12px 12px 14px;border-left:3px solid var(--amber);background:rgba(255,180,84,.08);border-radius:4px 14px 14px 4px}\n.sc-step3 .chan-banner.inline{margin:10px 0 0}\n.sc-step3 .chan-banner p{margin:0;flex:1;font-size:13.5px;line-height:1.45;color:#FFE3BC}\n.sc-step3 .chan-banner button{flex:none;min-height:40px;border-radius:12px;border:1px solid rgba(255,180,84,.5);background:transparent;color:var(--amber);font-weight:700;font-size:14px;padding:0 14px;cursor:pointer}\n.sc-step3 .chan-field{margin-bottom:14px}\n.sc-step3 .lab.first{margin-top:0}\n.sc-step3 .row-hdr{display:flex;align-items:center;justify-content:space-between;gap:10px}\n.sc-step3 .hdr-r{display:flex;align-items:center;gap:2px}\n.sc-step3 .icon-btn.sm{width:40px;height:40px;border-radius:12px;color:var(--muted)}\n.sc-step3 .scrim{position:absolute;inset:0;background:rgba(5,8,14,.62);display:flex;align-items:flex-end;z-index:5}\n.sc-step3 .sheet{width:100%;max-height:88%;overflow-y:auto;background:var(--panel);border-radius:26px 26px 0 0;border-top:1px solid var(--line);padding:8px 16px 20px;animation:up .24s ease-out;box-shadow:0 -16px 40px rgba(0,0,0,.4)}\n.sc-step3 .grab{width:40px;height:4px;border-radius:2px;background:var(--line);margin:4px auto 6px}\n.sc-step3 .sh-head{display:flex;align-items:center;justify-content:space-between;gap:8px}\n.sc-step3 .sh-head h2{margin:0;font-size:19px;font-weight:700}\n.sc-step3 .sk{display:block;background:linear-gradient(90deg,var(--panel2) 0%,#27324C 50%,var(--panel2) 100%);background-size:200% 100%;animation:shimmer 1.4s ease-in-out infinite}\n.sc-step3 .skcard{background:var(--panel);border:1px solid var(--line);border-radius:20px;padding:16px;display:flex;flex-direction:column;gap:12px}\n.sc-step3 .skrow{display:flex;align-items:center;gap:12px}\n.sc-step3 .errcard{display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px;padding:32px 20px;background:var(--panel);border:1px dashed #3B486B;border-radius:20px}\n.sc-step3 .errcard .eico{width:52px;height:52px;border-radius:50%;background:rgba(255,180,84,.14);color:var(--amber);display:grid;place-items:center;margin-bottom:6px}\n.sc-step3 .errcard h3{margin:0;font-size:17px}\n.sc-step3 .errcard p{margin:0 0 10px;font-size:14px;line-height:1.5;color:var(--muted);max-width:280px}\n.sc-step3 .errcard .retry{min-height:44px;border-radius:12px;border:1px solid var(--line);background:var(--panel2);color:var(--text);font-weight:700;font-size:14.5px;padding:0 18px;cursor:pointer;display:inline-flex;align-items:center;gap:8px}\n.sc-step3 .bspin{width:18px;height:18px;border-radius:50%;border:2.5px solid rgba(11,16,32,.25);border-top-color:#0B1020;animation:spinr .8s linear infinite;flex:none}\n.sc-step3 .inline-err{display:flex;align-items:flex-start;gap:8px;font-size:13.5px;line-height:1.45;color:var(--amber);margin:0}\n.sc-step3 .inline-err svg{flex:none;margin-top:2px}\n.sc-step3 .ubar{display:block;height:4px;border-radius:2px;background:var(--panel2);overflow:hidden;margin-top:6px}\n.sc-step3 .ubar i{display:block;height:100%;width:0;background:var(--blue);animation:fillbar linear forwards}\n.sc-step3 .fitem .rt small.bad{color:var(--amber)}\n.sc-step3 .retry-link{background:transparent;border:0;color:var(--blue);font-weight:700;font-size:13.5px;min-height:40px;padding:0 8px;cursor:pointer}\n.sc-step3 .primary .bspin{margin-right:2px}\n.sc-step3 .metanote{display:flex;gap:8px;align-items:flex-start;font-size:13px;line-height:1.5;color:var(--muted);margin:14px 0 0}\n.sc-step3 .metanote svg{flex:none;margin-top:2px;color:var(--blue)}\n.sc-step3 .metanote.warn{color:#FFE3BC}\n.sc-step3 .metanote.warn svg{color:var(--amber)}\n.sc-step3 .chipset{display:flex;flex-wrap:wrap;gap:6px}\n.sc-step3 .chipset button{min-height:40px;padding:0 14px;border-radius:999px;border:1px solid var(--line);background:var(--night);color:var(--muted);font-size:13.5px;font-weight:600;cursor:pointer}\n.sc-step3 .chipset button[aria-pressed=true]{border-color:var(--blue);background:rgba(91,140,255,.12);color:var(--text)}\n.sc-step3 .sw:disabled{opacity:.4;cursor:not-allowed}\n.sc-step3 .stepper{padding-left:14px;padding-right:14px}\n.sc-step3 .st{width:64px}\n.sc-step3 .st span{font-size:11.5px}\n.sc-step3 .card.auto.clickable,.sc-step3 .card.msg.clickable{cursor:pointer}\n.sc-step3 .row2{display:flex;align-items:center;justify-content:space-between;gap:8px}\n.sc-step3 .text-btn{background:transparent;border:0;color:var(--blue);font-weight:600;font-size:14px;min-height:40px;padding:0 6px;cursor:pointer;display:inline-flex;align-items:center;gap:6px}\n.sc-step3 .big-warn{width:68px;height:68px;border-radius:50%;background:rgba(255,180,84,.14);color:var(--amber);display:grid;place-items:center}\n";

return { Component: CreateReplyStep3 };

})();

/* ═════════ MsgMod ═════════ */
const MsgMod = (() => {

/* ───────────── limits from Meta's Instagram messaging docs ─────────────
   Text: UTF-8, 1,000 bytes max
   Image: png/jpeg/gif, 8 MB, up to 10 per message
   Video (mp4, ogg, avi, mov, webm), Audio (aac, m4a, wav, mp4), File (pdf): 25 MB, one per message
   File names with non-ASCII characters are not supported for uploads
   Generic template: up to 10 cards; title 80, subtitle 80; up to 3 buttons (web_url or postback)
   Button template: text up to 640 characters; 1 to 3 buttons (web_url or postback)
   Button titles: keep under 20 characters
   Quick replies: up to 13; title up to 20 characters; phone / email quick replies allowed
──────────────────────────────────────────────────────────────────── */

const TYPES = [
  { key: "generic", label: "Generic", icon: Layers },
  { key: "text", label: "Text", icon: Type },
  { key: "media", label: "Media", icon: ImageIcon },
  { key: "button", label: "Button & text", icon: MousePointerClick },
  { key: "quick", label: "Quick reply", icon: Zap },
];

const INTRO = {
  generic: { t: "Cards", d: "A scrollable set of cards. Each card can have an image, a title, a subtitle and buttons.", chips: ["Up to 10 cards", "3 buttons per card", "Mobile only"] },
  text: { t: "Text message", d: "A plain message. Emojis and links work.", chips: ["1,000 bytes"] },
  media: { t: "Media message", d: "Send images, a video, an audio clip or a PDF.", chips: [] },
  button: { t: "Text with buttons", d: "A message with buttons under it. A button opens a link or sends a reply back.", chips: ["1 to 3 buttons"] },
  quick: { t: "Quick replies", d: "A message with tap-to-answer options. The options disappear once one is tapped.", chips: ["Up to 13 replies", "Mobile only"] },
};

const MEDIA_KINDS = [
  { k: "image", l: "Image", icon: ImageIcon },
  { k: "video", l: "Video", icon: Video },
  { k: "audio", l: "Audio", icon: Music },
  { k: "file", l: "File", icon: FileText },
];

const MEDIA_RULES = {
  image: { exts: ["png", "jpg", "jpeg", "gif"], mb: 8, max: 10, accept: "image/png,image/jpeg,image/gif", hint: "PNG, JPEG or GIF, up to 8 MB each. Up to 10 images." },
  video: { exts: ["mp4", "ogg", "avi", "mov", "webm"], mb: 25, max: 1, accept: "video/*", hint: "MP4, OGG, AVI, MOV or WebM, up to 25 MB." },
  audio: { exts: ["aac", "m4a", "wav", "mp4"], mb: 25, max: 1, accept: "audio/*,.aac,.m4a,.wav,.mp4", hint: "AAC, M4A, WAV or MP4, up to 25 MB." },
  file: { exts: ["pdf"], mb: 25, max: 1, accept: "application/pdf,.pdf", hint: "PDF, up to 25 MB." },
};
const CARD_IMAGE_RULE = { ...MEDIA_RULES.image, max: 1, hint: "PNG, JPEG or GIF, up to 8 MB." };

let _id = 100;
const uid = () => ++_id;

const bytes = (s) => new TextEncoder().encode(s).length;
const chars = (s) => Array.from(s).length;
const fmtSize = (b) => (b >= 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);
const urlOk = (u) => /^https?:\/\/[^\s/$.?#]+\.[^\s]{2,}$/i.test(u.trim());
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

const newButton = (n) => ({ id: uid(), type: "web_url", title: "", url: "", payload: `reply_${n}` });
const newCard = () => ({ id: uid(), title: "", subtitle: "", image: null, actionUrl: "", buttons: [] });

const initialState = () => ({
  text: { text: "Hi {first_name}! Thanks for your message. How can we help?" },
  media: { kind: "image", files: { image: [], video: [], audio: [], file: [] } },
  generic: { active: 0, cards: [newCard()] },
  button: { text: "", buttons: [newButton(1)] },
  quick: { text: "", replies: [{ id: uid(), kind: "text", title: "", payload: "" }] },
});

/* ───────────── validation ───────────── */

function btnProblem(b) {
  if (!b.title.trim()) return "give every button a label.";
  if (b.type === "web_url" && !urlOk(b.url)) return `check the link on “${b.title}”.`;
  if (b.type === "postback" && !b.payload.trim()) return `add a tap code to “${b.title}”.`;
  return null;
}

function problemFor(type, s, name) {
  if (!name.trim()) return "Give this message a name.";
  switch (type) {
    case "text": {
      if (!s.text.text.trim()) return "Write the message.";
      if (bytes(s.text.text) > 1000) return "The text is over 1,000 bytes. Shorten it.";
      return null;
    }
    case "media": {
      const f = s.media.files[s.media.kind];
      if (!f.length) return s.media.kind === "image" ? "Add at least one image." : `Add ${s.media.kind === "audio" ? "an" : "a"} ${s.media.kind}.`;
      if (f.some((x) => x.status === "uploading")) return "Wait for the upload to finish.";
      if (f.some((x) => x.status === "failed")) return "Retry or remove the failed upload.";
      return null;
    }
    case "generic": {
      const { cards } = s.generic;
      for (let i = 0; i < cards.length; i++) {
        const c = cards[i];
        const m = (t) => (cards.length > 1 ? `Card ${i + 1}: ${t}` : cap(t));
        if (!c.title.trim()) return m("add a title.");
        if (c.image && c.image.status === "uploading") return m("wait for the image to finish uploading.");
        if (c.image && c.image.status === "failed") return m("retry or remove the failed image.");
        if (!(c.subtitle.trim() || c.image || c.buttons.length || c.actionUrl.trim())) return m("add a subtitle, image or button.");
        if (c.actionUrl.trim() && !urlOk(c.actionUrl)) return m("check the tap link.");
        const bp = c.buttons.map(btnProblem).find(Boolean);
        if (bp) return m(bp);
      }
      return null;
    }
    case "button": {
      const b = s.button;
      if (!b.text.trim()) return "Write the message above the buttons.";
      if (chars(b.text) > 640) return "The text is over 640 characters.";
      if (b.buttons.length < 1) return "Add at least one button.";
      const bp = b.buttons.map(btnProblem).find(Boolean);
      return bp ? cap(bp) : null;
    }
    case "quick": {
      const q = s.quick;
      if (!q.text.trim()) return "Write the message above the replies.";
      if (bytes(q.text) > 1000) return "The message is over 1,000 bytes.";
      if (q.replies.length < 1) return "Add at least one reply.";
      if (q.replies.some((r) => r.kind === "text" && !r.title.trim())) return "Give every reply a label.";
      return null;
    }
    default:
      return null;
  }
}

/* ───────────── file picking ───────────── */

function pickFiles(fileList, rule, existing) {
  const ok = [];
  const errs = [];
  for (const f of Array.from(fileList)) {
    const ext = (f.name.split(".").pop() || "").toLowerCase();
    if (!rule.exts.includes(ext)) {
      errs.push(`${f.name}: .${ext} files aren’t supported.`);
      continue;
    }
    if (/[^\x00-\x7F]/.test(f.name)) {
      errs.push(`${f.name}: rename the file using English letters, numbers or dashes.`);
      continue;
    }
    if (f.size > rule.mb * 1048576) {
      errs.push(`${f.name}: ${fmtSize(f.size)} is over the ${rule.mb} MB limit.`);
      continue;
    }
    if (existing + ok.length >= rule.max) {
      errs.push(`You can add up to ${rule.max} here.`);
      break;
    }
    ok.push({ id: uid(), name: f.name, size: f.size, status: "uploading", ms: Math.min(4000, 900 + Math.round(f.size / 200000) * 50), url: rule.exts.includes("png") ? URL.createObjectURL(f) : null });
  }
  return { ok, errs };
}

/* ───────────── small components ───────────── */

function Seg({ options, value, onChange, label }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.v} type="button" aria-pressed={value === o.v} onClick={() => onChange(o.v)}>
          {o.l}
        </button>
      ))}
    </div>
  );
}

function Counter({ n, max, unit = "" }) {
  const cls = n > max ? "over" : n > max * 0.9 ? "near" : "";
  return (
    <span className={"cnt " + cls}>
      {n.toLocaleString("en-US")}/{max.toLocaleString("en-US")}{unit}
    </span>
  );
}

function Field({ label, counter, error, children }) {
  return (
    <label className="field">
      <span className="fl"><span>{label}</span>{counter}</span>
      {children}
      {error && <span className="err">{error}</span>}
    </label>
  );
}

function Note({ children }) {
  return (
    <p className="tip">
      <Info size={16} />
      <span>{children}</span>
    </p>
  );
}

function MediaZone({ rule, files, onChange, label, icon: Icon }) {
  const ref = useRef(null);
  const net = useContext(NetCtx);
  const filesRef = useRef(files);
  filesRef.current = files;
  const [errs, setErrs] = useState([]);
  const full = files.length >= rule.max;
  const setStatus = (id, status) => onChange(filesRef.current.map((x) => (x.id === id ? { ...x, status } : x)));
  const upload = (f) => {
    net.call(f.ms || 900).then(() => setStatus(f.id, "done"), () => setStatus(f.id, "failed"));
  };
  const onPick = (e) => {
    const { ok, errs: er } = pickFiles(e.target.files, rule, files.length);
    e.target.value = "";
    setErrs(er);
    if (ok.length) {
      onChange([...files, ...ok]);
      ok.forEach(upload);
    }
  };
  return (
    <>
      <input ref={ref} type="file" hidden accept={rule.accept} multiple={rule.max > 1} onChange={onPick} />
      {files.length > 0 && (
        <div className="flist">
          {files.map((f) => (
            <div key={f.id} className="fitem">
              {f.url ? <img src={f.url} alt="" /> : <span className="fic"><Icon size={20} /></span>}
              <span className="rt">
                <b>{f.name}</b>
                {f.status === "uploading" ? (
                  <>
                    <small>Uploading…</small>
                    <span className="ubar"><i style={{ animationDuration: (f.ms || 900) * (net.mode === "slow" ? 3.5 : 1) + "ms" }} /></span>
                  </>
                ) : f.status === "failed" ? (
                  <small className="bad">Upload failed</small>
                ) : (
                  <small>{fmtSize(f.size)}</small>
                )}
              </span>
              {f.status === "failed" && (
                <button type="button" className="retry-link" onClick={() => { setStatus(f.id, "uploading"); upload(f); }}>Retry</button>
              )}
              <button
                type="button"
                className="icon-btn sm"
                aria-label={`Remove ${f.name}`}
                onClick={() => {
                  if (f.url) URL.revokeObjectURL(f.url);
                  onChange(files.filter((x) => x.id !== f.id));
                }}
              >
                <X size={18} />
              </button>
            </div>
          ))}
        </div>
      )}
      {!full && (
        <button type="button" className="drop" onClick={() => ref.current && ref.current.click()}>
          <Upload size={22} />
          <b>{files.length ? "Add more" : `Choose ${label}`}</b>
          <small>{rule.hint}</small>
        </button>
      )}
      {errs.map((e) => (
        <p key={e} className="err line">{e}</p>
      ))}
    </>
  );
}

function ButtonsEditor({ buttons, onChange, max = 3, warnSingle }) {
  const upd = (id, p) => onChange(buttons.map((b) => (b.id === id ? { ...b, ...p } : b)));
  return (
    <div>
      {buttons.map((b, i) => (
        <div className="bcard" key={b.id}>
          <div className="bhead">
            <b>Button {i + 1}</b>
            <button type="button" className="icon-btn sm" aria-label={`Remove button ${i + 1}`} onClick={() => onChange(buttons.filter((x) => x.id !== b.id))}>
              <X size={18} />
            </button>
          </div>
          <Seg
            label="Button action"
            value={b.type}
            onChange={(v) => upd(b.id, { type: v })}
            options={[{ v: "web_url", l: "Open a link" }, { v: "postback", l: "Send a reply" }]}
          />
          <Field label="Label" counter={<Counter n={chars(b.title)} max={20} />}>
            <input className="inp" dir="auto" maxLength={20} value={b.title} placeholder="e.g. View prices" onChange={(e) => upd(b.id, { title: e.target.value })} />
          </Field>
          {b.type === "web_url" ? (
            <Field label="Link" error={b.url && !urlOk(b.url) ? "Enter a full link, like https://example.com" : ""}>
              <input className="inp" type="url" inputMode="url" dir="ltr" value={b.url} placeholder="https://" onChange={(e) => upd(b.id, { url: e.target.value })} />
            </Field>
          ) : (
            <Field label="Tap code">
              <input className="inp" dir="ltr" value={b.payload} onChange={(e) => upd(b.id, { payload: e.target.value })} />
            </Field>
          )}
        </div>
      ))}
      {buttons.length < max && (
        <button type="button" className="add-dash" onClick={() => onChange([...buttons, newButton(buttons.length + 1)])}>
          <Plus size={20} strokeWidth={2.6} /> Add button
          <span className="cnt">{buttons.length}/{max}</span>
        </button>
      )}
      {warnSingle && buttons.length === 1 && buttons[0].type === "postback" && (
        <Note>A single reply button looks like part of your text. Add a second button or use a link.</Note>
      )}
    </div>
  );
}

/* ───────────── editors ───────────── */

function TextEditor({ s, setS }) {
  const n = bytes(s.text);
  return (
    <>
      <Field label="Message" counter={<Counter n={n} max={1000} unit=" bytes" />}>
        <textarea className="inp" dir="auto" rows={6} value={s.text} placeholder="Write your message" onChange={(e) => setS({ text: e.target.value })} />
      </Field>
      <div className="vars">
        {[["First name", "{first_name}"], ["Username", "{username}"]].map(([l, v]) => (
          <button key={v} type="button" className="btn2 pill" onClick={() => setS({ text: s.text + (!s.text || s.text.endsWith(" ") ? "" : " ") + v })}>
            <Plus size={14} /> {l}
          </button>
        ))}
      </div>
      <Note>The limit is counted in bytes. Emojis and non-English letters take more bytes than English letters, so they fit fewer characters.</Note>
    </>
  );
}

function MediaEditor({ s, setS }) {
  const rule = MEDIA_RULES[s.kind];
  const kind = MEDIA_KINDS.find((k) => k.k === s.kind);
  return (
    <>
      <p className="lab">Type of media</p>
      <Seg label="Media type" value={s.kind} onChange={(v) => setS({ kind: v })} options={MEDIA_KINDS.map((k) => ({ v: k.k, l: k.l }))} />
      <div style={{ marginTop: 14 }}>
        <MediaZone
          key={s.kind}
          rule={rule}
          files={s.files[s.kind]}
          icon={kind.icon}
          label={s.kind === "image" ? "images" : s.kind}
          onChange={(arr) => setS({ files: { ...s.files, [s.kind]: arr } })}
        />
      </div>
      <Note>File names must use English letters, numbers or dashes. Rename files that have non-English letters in their name before you upload them.</Note>
    </>
  );
}

function GenericEditor({ s, setS }) {
  const card = s.cards[s.active];
  const upd = (p) => setS({ cards: s.cards.map((c, i) => (i === s.active ? { ...c, ...p } : c)) });
  const remove = () => {
    const cards = s.cards.filter((_, i) => i !== s.active);
    setS({ cards, active: Math.max(0, s.active - 1) });
  };
  return (
    <>
      <div className="ctabs" role="group" aria-label="Cards">
        {s.cards.map((c, i) => (
          <button key={c.id} type="button" className="chipb" aria-pressed={s.active === i} onClick={() => setS({ active: i })}>
            Card {i + 1}
          </button>
        ))}
        {s.cards.length < 10 && (
          <button type="button" className="chipb add" aria-label="Add a card" onClick={() => setS({ cards: [...s.cards, newCard()], active: s.cards.length })}>
            <Plus size={16} /> Add
          </button>
        )}
      </div>

      <div className="cardbox" key={card.id}>
        <div className="bhead">
          <b>Card {s.active + 1} of {s.cards.length}</b>
          {s.cards.length > 1 && (
            <button type="button" className="text-danger" onClick={remove}>Remove card</button>
          )}
        </div>

        <p className="lab tight">Image (optional)</p>
        <MediaZone
          rule={CARD_IMAGE_RULE}
          files={card.image ? [card.image] : []}
          icon={ImageIcon}
          label="image"
          onChange={(arr) => upd({ image: arr[0] || null })}
        />

        <Field label="Title" counter={<Counter n={chars(card.title)} max={80} />}>
          <input className="inp" dir="auto" maxLength={80} value={card.title} placeholder="Card title" onChange={(e) => upd({ title: e.target.value })} />
        </Field>
        <Field label="Subtitle (optional)" counter={<Counter n={chars(card.subtitle)} max={80} />}>
          <input className="inp" dir="auto" maxLength={80} value={card.subtitle} placeholder="A short line under the title" onChange={(e) => upd({ subtitle: e.target.value })} />
        </Field>
        <Field label="When the card is tapped (optional)" error={card.actionUrl.trim() && !urlOk(card.actionUrl) ? "Enter a full link, like https://example.com" : ""}>
          <input className="inp" type="url" inputMode="url" dir="ltr" value={card.actionUrl} placeholder="https://  (opens this link)" onChange={(e) => upd({ actionUrl: e.target.value })} />
        </Field>

        <p className="lab">Buttons (up to 3)</p>
        <ButtonsEditor buttons={card.buttons} onChange={(b) => upd({ buttons: b })} max={3} />
      </div>
      <Note>Put the cards with an image and a button first. The rest of the cards are sized to match them.</Note>
    </>
  );
}

function ButtonEditor({ s, setS }) {
  return (
    <>
      <Field label="Message" counter={<Counter n={chars(s.text)} max={640} />}>
        <textarea className="inp" dir="auto" rows={4} value={s.text} placeholder="What do you want people to do next?" onChange={(e) => setS({ text: e.target.value })} />
      </Field>
      <p className="lab">Buttons (1 to 3)</p>
      <ButtonsEditor buttons={s.buttons} onChange={(b) => setS({ buttons: b })} max={3} warnSingle />
      <Note>Start each label with a verb and keep it to one to three words.</Note>
    </>
  );
}

function QuickEditor({ s, setS }) {
  const upd = (id, p) => setS({ replies: s.replies.map((r) => (r.id === id ? { ...r, ...p } : r)) });
  const has = (k) => s.replies.some((r) => r.kind === k);
  const add = (kind) => setS({ replies: [...s.replies, { id: uid(), kind, title: "", payload: "" }] });
  return (
    <>
      <Field label="Message" counter={<Counter n={bytes(s.text)} max={1000} unit=" bytes" />}>
        <textarea className="inp" dir="auto" rows={3} value={s.text} placeholder="Ask a question" onChange={(e) => setS({ text: e.target.value })} />
      </Field>

      <p className="lab">Replies ({s.replies.length} of 13)</p>
      {s.replies.map((r, i) => (
        <div className="bcard" key={r.id}>
          <div className="bhead">
            <b>
              {r.kind === "text" ? `Reply ${i + 1}` : r.kind === "phone" ? "Ask for phone number" : "Ask for email"}
            </b>
            <button type="button" className="icon-btn sm" aria-label={`Remove reply ${i + 1}`} onClick={() => setS({ replies: s.replies.filter((x) => x.id !== r.id) })}>
              <X size={18} />
            </button>
          </div>
          {r.kind === "text" ? (
            <>
              <Field label="Label" counter={<Counter n={chars(r.title)} max={20} />}>
                <input className="inp" dir="auto" maxLength={20} value={r.title} placeholder="e.g. Yes, please" onChange={(e) => upd(r.id, { title: e.target.value })} />
              </Field>
              <Field label="Tap code (optional)">
                <input className="inp" dir="ltr" value={r.payload} onChange={(e) => upd(r.id, { payload: e.target.value })} />
              </Field>
            </>
          ) : (
            <p className="note-line">
              The button is filled in from their Instagram profile. If they haven’t added {r.kind === "phone" ? "a phone number" : "an email"}, it isn’t shown.
            </p>
          )}
        </div>
      ))}

      <div className="addrow">
        {s.replies.length < 13 && (
          <button type="button" className="add-dash" onClick={() => add("text")}>
            <Plus size={20} strokeWidth={2.6} /> Add reply
          </button>
        )}
        {s.replies.length < 13 && !has("phone") && (
          <button type="button" className="btn2 wide" onClick={() => add("phone")}><Phone size={16} /> Ask for phone number</button>
        )}
        {s.replies.length < 13 && !has("email") && (
          <button type="button" className="btn2 wide" onClick={() => add("email")}><Mail size={16} /> Ask for email</button>
        )}
      </div>
      <Note>When someone taps a reply, the buttons disappear and its label is posted to the chat as their message.</Note>
    </>
  );
}

/* ───────────── previews ───────────── */

function Bubble({ children, empty }) {
  return <div className={"bub" + (empty ? " empty" : "")} dir="auto">{children}</div>;
}

function Preview({ type, s }) {
  let body = null;

  if (type === "text") {
    body = s.text.text.trim() ? <Bubble>{s.text.text}</Bubble> : <Bubble empty>Your message</Bubble>;
  }

  if (type === "media") {
    const files = s.media.files[s.media.kind];
    if (!files.length) body = <Bubble empty>Your {s.media.kind} will appear here</Bubble>;
    else if (s.media.kind === "image") {
      body = (
        <div className={"pgrid" + (files.length === 1 ? " one" : "")}>
          {files.map((f) => <img key={f.id} src={f.url} alt="" />)}
        </div>
      );
    } else {
      const Icon = MEDIA_KINDS.find((k) => k.k === s.media.kind).icon;
      body = (
        <div className={"mfile " + s.media.kind}>
          <span className="fic"><Icon size={22} /></span>
          <span className="rt"><b>{files[0].name}</b><small>{fmtSize(files[0].size)}</small></span>
        </div>
      );
    }
  }

  if (type === "generic") {
    body = (
      <div className="gscroll">
        {s.generic.cards.map((c, i) => (
          <div className={"gcard" + (i === s.generic.active ? " on" : "")} key={c.id}>
            {c.image && <img className="gimg" src={c.image.url} alt="" />}
            <div className="gbody">
              <b className={c.title ? "" : "ph"} dir="auto">{c.title || "Card title"}</b>
              {c.subtitle && <span dir="auto">{c.subtitle}</span>}
            </div>
            {c.buttons.map((b) => (
              <div className="gb" key={b.id} dir="auto">{b.title || "Button"}</div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (type === "button") {
    const b = s.button;
    body = (
      <div className="tcard">
        <div className={"tbody" + (b.text.trim() ? "" : " ph")} dir="auto">{b.text.trim() || "Your message"}</div>
        {b.buttons.map((x) => (
          <div className="gb" key={x.id} dir="auto">{x.title || "Button"}</div>
        ))}
      </div>
    );
  }

  if (type === "quick") {
    const q = s.quick;
    body = (
      <>
        {q.text.trim() ? <Bubble>{q.text}</Bubble> : <Bubble empty>Your question</Bubble>}
        <div className="qrow">
          {q.replies.map((r) => (
            <span className="qpill" key={r.id} dir="auto">
              {r.kind === "phone" ? <><Phone size={14} /> Phone number</> : r.kind === "email" ? <><Mail size={14} /> Email</> : r.title || "Reply"}
            </span>
          ))}
        </div>
      </>
    );
  }

  return (
    <div className="chat" aria-label="Preview of the message">
      {body}
    </div>
  );
}

/* ───────────── main ───────────── */

const bAct = (b) => ({ title: b.title || "Button", type: b.type, url: b.url, payload: b.payload });

function contentFrom(type, s) {
  if (type === "text") return { text: s.text.text.trim() };
  if (type === "media") {
    const f = s.media.files[s.media.kind];
    return { kind: s.media.kind, names: f.map((x) => x.name), sizes: f.map((x) => x.size), urls: s.media.kind === "image" ? f.map((x) => x.url) : [] };
  }
  if (type === "generic") {
    return {
      cards: s.generic.cards.map((c) => ({ title: c.title, subtitle: c.subtitle, image: c.image ? c.image.url : null, action: c.actionUrl, buttons: c.buttons.map((b) => b.title || "Button"), acts: c.buttons.map(bAct) })),
    };
  }
  if (type === "button") return { text: s.button.text.trim(), buttons: s.button.buttons.map((b) => b.title || "Button"), acts: s.button.buttons.map(bAct) };
  const lab = (r) => (r.kind === "text" ? r.title || "Reply" : r.kind === "phone" ? "Phone number" : "Email");
  return { text: s.quick.text.trim(), replies: s.quick.replies.map(lab), racts: s.quick.replies.map((r) => ({ title: lab(r), kind: r.kind, payload: r.payload })) };
}

function toMsg(name, type, s) {
  let preview = "";
  if (type === "text") preview = s.text.text.trim();
  else if (type === "media") {
    const f = s.media.files[s.media.kind];
    preview = s.media.kind === "image" ? `${f.length} ${f.length === 1 ? "image" : "images"}` : `${s.media.kind.toUpperCase()}, ${fmtSize(f[0].size)}`;
  } else if (type === "generic") preview = `${s.generic.cards.length} ${s.generic.cards.length === 1 ? "card" : "cards"}`;
  else if (type === "button") preview = s.button.text.trim();
  else preview = `${s.quick.replies.length} ${s.quick.replies.length === 1 ? "reply" : "replies"}`;
  return { id: uid(), name, type, preview, used: 0, content: contentFrom(type, s) };
}

function CreateMessage(props) {
  const [type, setType] = useState(props.initialType || "text");
  const net = useContext(NetCtx);
  const chan = useContext(ChanCtx);
  const [showPrev, setShowPrev] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState(null);
  const [name, setName] = useState("");
  const [s, setAll] = useState(initialState);
  const [saved, setSaved] = useState(null);
  const [toast, setToast] = useState("");

  const setPart = (key) => (p) => setAll((o) => ({ ...o, [key]: { ...o[key], ...p } }));
  const problem = problemFor(type, s, name);
  const save = () => {
    setSaving(true);
    setSaveErr(null);
    net.call(900).then(
      () => {
        const msg = toMsg(name.trim(), type, s);
        props.onSave(msg);
        setSaving(false);
        setSaved({ name: name.trim(), type, s, id: msg.id });
      },
      (e) => { setSaving(false); setSaveErr(e); }
    );
  };
  const intro = INTRO[type];

  const flash = (m) => {
    setToast(m);
    setTimeout(() => setToast(""), 2200);
  };

  const reset = () => {
    setAll(initialState());
    setName("");
    setType("text");
    setSaved(null);
  };

  return (
    <div className="sc-msg screen">
      <style>{CSS}</style>
        <div className="ed-top">
          <button type="button" className="icon-btn" aria-label="Back" onClick={() => props.onBack()}>
            <ChevronLeft size={26} />
          </button>
          <h1>New message</h1>
          {!saved && (
            <button type="button" className="text-btn prev-btn" onClick={() => setShowPrev(true)}><Eye size={18} /> Preview</button>
          )}
        </div>

        {saved ? (
          <>
            <div className="scr">
              <div className="pad center">
                <span className="big-check"><Check size={34} strokeWidth={3} /></span>
                <h2 className="c-title">Message saved</h2>
                <p className="note">“{saved.name}” is ready to use in your automation.</p>
                <div className="prev-wrap"><Preview type={saved.type} s={saved.s} /></div>
              </div>
            </div>
            <footer className="ed-foot">
              <button type="button" className="primary" onClick={() => props.onDone(saved.id)}>Done</button>
              <button type="button" className="ghost" onClick={reset}>Create another</button>
            </footer>
          </>
        ) : (
          <>
            <div className="scr">
              <div className="pad">
                <Field label="Name">
                  <input className="inp" dir="auto" value={name} placeholder="e.g. Price list" onChange={(e) => setName(e.target.value)} />
                </Field>

                <p className="lab">Message type</p>
                <div className="types" role="group" aria-label="Message type">
                  {TYPES.map((t) => (
                    <button key={t.key} type="button" className="ty" aria-pressed={type === t.key} onClick={() => setType(t.key)}>
                      <t.icon size={22} />
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>

                <div className="intro">
                  <h2>{intro.t}</h2>
                  <p>{intro.d}</p>
                  {intro.chips.length > 0 && (
                    <div className="meta">
                      {intro.chips.map((c) => (
                        <span className="mchip" key={c}>{c === "Mobile only" && <Smartphone size={12} />}{c}</span>
                      ))}
                    </div>
                  )}
                </div>

                {type === "text" && <TextEditor s={s.text} setS={setPart("text")} />}
                {type === "media" && <MediaEditor s={s.media} setS={setPart("media")} />}
                {type === "generic" && <GenericEditor s={s.generic} setS={setPart("generic")} />}
                {type === "button" && <ButtonEditor s={s.button} setS={setPart("button")} />}
                {type === "quick" && <QuickEditor s={s.quick} setS={setPart("quick")} />}

                <div className="row2" style={{ marginTop: 26 }}>
                  <h2 className="gh" style={{ margin: 0 }}>How it looks in Instagram</h2>
                  <button type="button" className="text-btn" onClick={() => setShowPrev(true)}>Full preview</button>
                </div>
                <Preview type={type} s={s} />
                <p className="src">Limits follow Meta’s Instagram messaging documentation.</p>
              </div>
            </div>

            <footer className="ed-foot">
              {saveErr ? (
                <p className="inline-err" role="alert"><AlertTriangle size={16} /><span>{saveErr.kind === "offline" ? "You’re offline. Nothing is lost. Try again when you’re back online." : "Couldn’t save the message. Nothing is lost. Try again."}</span></p>
              ) : (
                <p className={"sum" + (problem ? " warn" : "")} aria-live="polite">{problem || "Ready to save."}</p>
              )}
              <button
                type="button"
                className="primary"
                disabled={!!problem || saving}
                onClick={save}
              >
                {saving ? (<><span className="bspin" /> Saving…</>) : saveErr ? "Try again" : "Save message"}
              </button>
            </footer>
          </>
        )}

        {showPrev && (
          <MsgPreviewSheet m={{ type, name: name.trim() || "Untitled message", content: contentFrom(type, s) }} channel={chan.active} issues={problem ? [problem] : []} onClose={() => setShowPrev(false)} />
        )}

        {toast && (
          <div className="toast-wrap" role="status"><div className="toast">{toast}</div></div>
        )}
    </div>
  );
}

/* ───────────── styles ───────────── */

const CSS = ".sc-msg .scr{flex:1;overflow-y:auto;overscroll-behavior:contain}\n.sc-msg .pad{padding:4px 16px 28px}\n.sc-msg .pad.center{display:flex;flex-direction:column;align-items:center;text-align:center;padding-top:40px}\n.sc-msg .ed-top{display:flex;align-items:center;gap:4px;padding:10px 12px 6px}\n.sc-msg .ed-top h1{margin:0;font-size:19px;font-weight:700;flex:1}\n.sc-msg .icon-btn{width:44px;height:44px;border-radius:14px;background:transparent;border:0;color:var(--text);display:grid;place-items:center;cursor:pointer;flex:none}\n.sc-msg .icon-btn.sm{width:40px;height:40px;border-radius:12px;color:var(--muted)}\n.sc-msg .field{display:flex;flex-direction:column;gap:6px;margin-top:14px;font-size:13px;font-weight:600;color:var(--muted)}\n.sc-msg .fl{display:flex;justify-content:space-between;align-items:center;gap:8px}\n.sc-msg .cnt{font-size:12.5px;font-weight:600;color:var(--muted);font-variant-numeric:tabular-nums}\n.sc-msg .cnt.near{color:var(--amber)}\n.sc-msg .cnt.over{color:var(--red)}\n.sc-msg .inp{background:var(--panel);border:1px solid var(--line);border-radius:12px;color:var(--text);font:inherit;font-size:15px;font-weight:400;padding:11px 14px;min-height:48px;width:100%;color-scheme:dark}\n.sc-msg textarea.inp{resize:none;line-height:1.5}\n.sc-msg .err{font-size:13px;font-weight:500;color:var(--amber)}\n.sc-msg .err.line{margin:8px 0 0}\n.sc-msg .lab{font-size:13px;font-weight:600;color:var(--muted);margin:18px 0 8px}\n.sc-msg .lab.tight{margin-top:0}\n.sc-msg .gh{margin:0 4px 8px;font-size:13px;font-weight:600;color:var(--muted)}\n.sc-msg .gh.sp{margin-top:26px}\n.sc-msg .note{font-size:14px;color:var(--muted);margin:12px 0 0;line-height:1.5}\n.sc-msg /* type picker */\n.types{display:grid;grid-template-columns:repeat(5,1fr);gap:6px}\n.sc-msg .ty{display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:6px;padding:11px 2px 8px;min-height:78px;border-radius:14px;border:1px solid var(--line);background:var(--panel);color:var(--muted);font-size:11.5px;font-weight:600;line-height:1.2;text-align:center;cursor:pointer}\n.sc-msg .ty[aria-pressed=true]{border-color:var(--blue);background:rgba(91,140,255,.12);color:var(--text)}\n.sc-msg .ty[aria-pressed=true] svg{color:var(--blue)}\n.sc-msg .intro{margin-top:18px}\n.sc-msg .intro h2{margin:0;font-size:18px;font-weight:700}\n.sc-msg .intro p{margin:4px 0 0;font-size:14px;line-height:1.5;color:var(--muted)}\n.sc-msg .meta{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}\n.sc-msg .mchip{display:inline-flex;align-items:center;gap:4px;font-size:12px;font-weight:600;color:#B9C3DB;background:var(--panel2);border-radius:999px;padding:4px 10px}\n.sc-msg .seg{display:flex;background:var(--panel);border-radius:12px;padding:3px;gap:2px}\n.sc-msg .seg button{flex:1;border:0;background:transparent;color:var(--muted);font-size:13px;font-weight:600;padding:7px 6px;border-radius:9px;cursor:pointer;min-height:38px}\n.sc-msg .seg button[aria-pressed=true]{background:var(--panel2);color:var(--text)}\n.sc-msg .vars{display:flex;gap:6px;margin-top:8px;flex-wrap:wrap}\n.sc-msg .btn2{border:1px solid var(--line);background:var(--panel2);color:var(--text);font-weight:600;font-size:14px;border-radius:12px;padding:0 14px;min-height:44px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px}\n.sc-msg .btn2.pill{min-height:38px;border-radius:999px;padding:0 12px 0 10px;font-size:13px}\n.sc-msg .btn2.wide{width:100%}\n.sc-msg .tip{display:flex;gap:8px;align-items:flex-start;font-size:13px;color:var(--muted);margin:14px 0 0;line-height:1.5}\n.sc-msg .tip svg{flex:none;margin-top:2px;color:var(--blue)}\n.sc-msg /* media */\n.drop{width:100%;border:1.5px dashed #3B486B;border-radius:16px;background:transparent;color:var(--text);padding:18px 14px;display:flex;flex-direction:column;align-items:center;gap:4px;cursor:pointer;margin-top:8px}\n.sc-msg .drop svg{color:var(--blue)}\n.sc-msg .drop b{font-size:15px}\n.sc-msg .drop small{color:var(--muted);font-size:12.5px;text-align:center;line-height:1.4}\n.sc-msg .flist{display:flex;flex-direction:column;gap:8px}\n.sc-msg .fitem{display:flex;align-items:center;gap:12px;background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:8px 6px 8px 8px}\n.sc-msg .fitem img{width:48px;height:48px;border-radius:10px;object-fit:cover;flex:none}\n.sc-msg .fic{width:48px;height:48px;border-radius:10px;background:rgba(91,140,255,.14);color:var(--blue);display:grid;place-items:center;flex:none}\n.sc-msg .rt{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}\n.sc-msg .rt b{font-size:14.5px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.sc-msg .rt small{font-size:12.5px;color:var(--muted)}\n.sc-msg /* buttons / cards */\n.bcard{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:10px 12px 14px;margin-top:10px}\n.sc-msg .bhead{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;min-height:40px}\n.sc-msg .bhead b{font-size:14.5px;font-weight:600}\n.sc-msg .bcard .inp{background:var(--night)}\n.sc-msg .bcard .seg{background:var(--night)}\n.sc-msg .bcard .seg button[aria-pressed=true]{background:var(--panel2)}\n.sc-msg .note-line{margin:0;font-size:13.5px;line-height:1.5;color:var(--muted)}\n.sc-msg .add-dash{width:100%;min-height:52px;margin-top:10px;border:1.5px dashed #3B486B;background:transparent;color:var(--blue);border-radius:14px;font-weight:700;font-size:15px;display:flex;align-items:center;justify-content:center;gap:8px;cursor:pointer}\n.sc-msg .add-dash .cnt{margin-left:4px}\n.sc-msg .addrow{display:flex;flex-direction:column;gap:8px;margin-top:2px}\n.sc-msg .addrow .btn2{margin-top:0}\n.sc-msg .ctabs{display:flex;gap:6px;overflow-x:auto;margin:16px 0 12px;padding-bottom:2px}\n.sc-msg .chipb{flex:none;min-height:40px;padding:0 14px;border-radius:999px;border:1px solid var(--line);background:var(--panel);color:var(--muted);font-size:13.5px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:4px}\n.sc-msg .chipb[aria-pressed=true]{border-color:var(--blue);background:rgba(91,140,255,.12);color:var(--text)}\n.sc-msg .chipb.add{color:var(--blue);border-style:dashed}\n.sc-msg .cardbox{background:var(--panel);border:1px solid var(--line);border-radius:20px;padding:6px 14px 16px}\n.sc-msg .cardbox .inp,.sc-msg .cardbox .bcard{background:var(--night)}\n.sc-msg .cardbox .bcard .inp{background:var(--panel)}\n.sc-msg .text-danger{background:transparent;border:0;color:var(--red);font-weight:600;font-size:14px;min-height:40px;padding:0 4px;cursor:pointer}\n.sc-msg /* preview */\n.chat{background:#0A0E17;border:1px solid var(--line);border-radius:20px;padding:14px;display:flex;flex-direction:column;gap:6px;overflow:hidden}\n.sc-msg .bub{align-self:flex-start;max-width:86%;background:#262F45;border-radius:20px;padding:10px 14px;font-size:14.5px;line-height:1.45;white-space:pre-wrap;overflow-wrap:anywhere}\n.sc-msg .bub.empty{color:var(--muted);background:#1A2233;font-style:italic}\n.sc-msg .pgrid{display:grid;grid-template-columns:1fr 1fr;gap:4px;max-width:86%;align-self:flex-start}\n.sc-msg .pgrid.one{grid-template-columns:1fr;max-width:70%}\n.sc-msg .pgrid img{width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:16px;display:block}\n.sc-msg .pgrid.one img{aspect-ratio:auto;max-height:260px}\n.sc-msg .mfile{align-self:flex-start;display:flex;align-items:center;gap:12px;background:#262F45;border-radius:18px;padding:10px 16px 10px 10px;max-width:86%}\n.sc-msg .mfile.video{width:86%;min-height:120px;justify-content:flex-start}\n.sc-msg .gscroll{display:flex;gap:8px;overflow-x:auto;padding-bottom:4px}\n.sc-msg .gcard{flex:none;width:210px;background:#262F45;border-radius:18px;overflow:hidden;border:1px solid transparent}\n.sc-msg .gcard.on{border-color:rgba(91,140,255,.55)}\n.sc-msg .gimg{width:100%;height:120px;object-fit:cover;display:block}\n.sc-msg .gbody{padding:10px 12px;display:flex;flex-direction:column;gap:3px}\n.sc-msg .gbody b{font-size:14.5px;line-height:1.35;overflow-wrap:anywhere}\n.sc-msg .gbody b.ph{color:var(--muted);font-style:italic;font-weight:500}\n.sc-msg .gbody span{font-size:13px;color:#B9C3DB;line-height:1.4;overflow-wrap:anywhere}\n.sc-msg .gb{border-top:1px solid #34405D;text-align:center;padding:11px 8px;color:#7FA4FF;font-weight:600;font-size:14px;overflow-wrap:anywhere}\n.sc-msg .tcard{align-self:flex-start;width:84%;background:#262F45;border-radius:18px;overflow:hidden}\n.sc-msg .tbody{padding:12px 14px;font-size:14.5px;line-height:1.45;white-space:pre-wrap;overflow-wrap:anywhere}\n.sc-msg .tbody.ph{color:var(--muted);font-style:italic}\n.sc-msg .qrow{display:flex;gap:8px;overflow-x:auto;padding-top:8px}\n.sc-msg .qpill{flex:none;display:inline-flex;align-items:center;gap:5px;border:1px solid #6E97FF;color:#8FB0FF;border-radius:999px;padding:8px 14px;font-size:13.5px;font-weight:600}\n.sc-msg .src{margin:10px 4px 0;font-size:12.5px;color:var(--muted)}\n.sc-msg .prev-wrap{width:100%;text-align:left;margin-top:20px}\n.sc-msg /* footer,.sc-msg buttons,.sc-msg saved */\n.ed-foot{border-top:1px solid var(--line);background:var(--panel);padding:12px 16px 14px;display:flex;flex-direction:column;gap:10px}\n.sc-msg .sum{margin:0;font-size:13.5px;line-height:1.5;color:#C9D1E6}\n.sc-msg .sum.warn{color:var(--amber)}\n.sc-msg .primary,.sc-msg .ghost{min-height:50px;border-radius:14px;font-weight:700;font-size:15px;padding:0 18px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px}\n.sc-msg .primary{background:var(--blue);color:#0B1020;border:0}\n.sc-msg .primary:disabled{background:var(--panel2);color:var(--muted);cursor:not-allowed}\n.sc-msg .ghost{background:transparent;border:1px solid var(--line);color:var(--text);font-weight:600}\n.sc-msg .big-check{width:68px;height:68px;border-radius:50%;background:rgba(79,216,160,.16);color:var(--mint);display:grid;place-items:center}\n.sc-msg .c-title{margin:18px 0 0;font-size:21px;font-weight:700}\n.sc-msg .toast-wrap{position:absolute;left:0;right:0;bottom:110px;display:flex;justify-content:center;z-index:9;pointer-events:none}\n.sc-msg .toast{background:var(--panel2);border:1px solid var(--line);color:var(--text);font-weight:600;font-size:14px;padding:10px 16px;border-radius:999px}\n.sc-msg .chan-chip{display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:0 10px 0 6px;border-radius:999px;border:1px solid var(--line);background:var(--panel);color:var(--text);font-size:14px;font-weight:600;cursor:pointer;max-width:170px}\n.sc-msg .chan-chip .cname{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.sc-msg .chan-chip .chv{color:var(--muted);flex:none}\n.sc-msg .chan-chip.wide{width:100%;max-width:none;justify-content:flex-start;padding:8px 14px 8px 8px;min-height:58px;border-radius:16px;font-size:15.5px}\n.sc-msg .chan-chip.wide .cname{flex:1;text-align:left}\n.sc-msg .cav{width:32px;height:32px;border-radius:50%;display:grid;place-items:center;font-weight:700;font-size:14px;background:hsl(var(--h,220) 38% 26%);color:#E6ECFA;flex:none;position:relative}\n.sc-msg .cav.lg{width:40px;height:40px;font-size:16px}\n.sc-msg .cav .warn-dot{position:absolute;right:-1px;bottom:-1px;width:11px;height:11px;border-radius:50%;background:var(--amber);border:2px solid var(--panel)}\n.sc-msg .crow{width:100%;display:flex;align-items:center;gap:12px;text-align:left;background:var(--night);border:1px solid var(--line);color:var(--text);border-radius:14px;padding:10px 14px;min-height:64px;cursor:pointer;margin-top:8px}\n.sc-msg .crow[aria-pressed=true]{border-color:var(--blue);background:rgba(91,140,255,.12)}\n.sc-msg .crow .ct{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}\n.sc-msg .crow b{font-size:15.5px;font-weight:600}\n.sc-msg .crow small{font-size:13px;color:var(--muted)}\n.sc-msg .crow small.warn{color:var(--amber)}\n.sc-msg .crow .tick{color:var(--blue);flex:none}\n.sc-msg .crow.addc{border:1.5px dashed #3B486B;background:transparent;color:var(--blue);font-weight:700;justify-content:center;gap:8px}\n.sc-msg .sh-link{background:transparent;border:0;color:var(--blue);font-weight:600;font-size:14.5px;min-height:44px;cursor:pointer;padding:0 4px;margin-top:6px}\n.sc-msg .chan-banner{display:flex;align-items:center;gap:12px;margin:12px 16px 0;padding:12px 12px 12px 14px;border-left:3px solid var(--amber);background:rgba(255,180,84,.08);border-radius:4px 14px 14px 4px}\n.sc-msg .chan-banner.inline{margin:10px 0 0}\n.sc-msg .chan-banner p{margin:0;flex:1;font-size:13.5px;line-height:1.45;color:#FFE3BC}\n.sc-msg .chan-banner button{flex:none;min-height:40px;border-radius:12px;border:1px solid rgba(255,180,84,.5);background:transparent;color:var(--amber);font-weight:700;font-size:14px;padding:0 14px;cursor:pointer}\n.sc-msg .chan-field{margin-bottom:14px}\n.sc-msg .lab.first{margin-top:0}\n.sc-msg .row-hdr{display:flex;align-items:center;justify-content:space-between;gap:10px}\n.sc-msg .hdr-r{display:flex;align-items:center;gap:2px}\n.sc-msg .icon-btn.sm{width:40px;height:40px;border-radius:12px;color:var(--muted)}\n.sc-msg .scrim{position:absolute;inset:0;background:rgba(5,8,14,.62);display:flex;align-items:flex-end;z-index:5}\n.sc-msg .sheet{width:100%;max-height:88%;overflow-y:auto;background:var(--panel);border-radius:26px 26px 0 0;border-top:1px solid var(--line);padding:8px 16px 20px;animation:up .24s ease-out;box-shadow:0 -16px 40px rgba(0,0,0,.4)}\n.sc-msg .grab{width:40px;height:4px;border-radius:2px;background:var(--line);margin:4px auto 6px}\n.sc-msg .sh-head{display:flex;align-items:center;justify-content:space-between;gap:8px}\n.sc-msg .sh-head h2{margin:0;font-size:19px;font-weight:700}\n.sc-msg .sk{display:block;background:linear-gradient(90deg,var(--panel2) 0%,#27324C 50%,var(--panel2) 100%);background-size:200% 100%;animation:shimmer 1.4s ease-in-out infinite}\n.sc-msg .skcard{background:var(--panel);border:1px solid var(--line);border-radius:20px;padding:16px;display:flex;flex-direction:column;gap:12px}\n.sc-msg .skrow{display:flex;align-items:center;gap:12px}\n.sc-msg .errcard{display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px;padding:32px 20px;background:var(--panel);border:1px dashed #3B486B;border-radius:20px}\n.sc-msg .errcard .eico{width:52px;height:52px;border-radius:50%;background:rgba(255,180,84,.14);color:var(--amber);display:grid;place-items:center;margin-bottom:6px}\n.sc-msg .errcard h3{margin:0;font-size:17px}\n.sc-msg .errcard p{margin:0 0 10px;font-size:14px;line-height:1.5;color:var(--muted);max-width:280px}\n.sc-msg .errcard .retry{min-height:44px;border-radius:12px;border:1px solid var(--line);background:var(--panel2);color:var(--text);font-weight:700;font-size:14.5px;padding:0 18px;cursor:pointer;display:inline-flex;align-items:center;gap:8px}\n.sc-msg .bspin{width:18px;height:18px;border-radius:50%;border:2.5px solid rgba(11,16,32,.25);border-top-color:#0B1020;animation:spinr .8s linear infinite;flex:none}\n.sc-msg .inline-err{display:flex;align-items:flex-start;gap:8px;font-size:13.5px;line-height:1.45;color:var(--amber);margin:0}\n.sc-msg .inline-err svg{flex:none;margin-top:2px}\n.sc-msg .ubar{display:block;height:4px;border-radius:2px;background:var(--panel2);overflow:hidden;margin-top:6px}\n.sc-msg .ubar i{display:block;height:100%;width:0;background:var(--blue);animation:fillbar linear forwards}\n.sc-msg .fitem .rt small.bad{color:var(--amber)}\n.sc-msg .retry-link{background:transparent;border:0;color:var(--blue);font-weight:700;font-size:13.5px;min-height:40px;padding:0 8px;cursor:pointer}\n.sc-msg .primary .bspin{margin-right:2px}\n.sc-msg .metanote{display:flex;gap:8px;align-items:flex-start;font-size:13px;line-height:1.5;color:var(--muted);margin:14px 0 0}\n.sc-msg .metanote svg{flex:none;margin-top:2px;color:var(--blue)}\n.sc-msg .metanote.warn{color:#FFE3BC}\n.sc-msg .metanote.warn svg{color:var(--amber)}\n.sc-msg .chipset{display:flex;flex-wrap:wrap;gap:6px}\n.sc-msg .chipset button{min-height:40px;padding:0 14px;border-radius:999px;border:1px solid var(--line);background:var(--night);color:var(--muted);font-size:13.5px;font-weight:600;cursor:pointer}\n.sc-msg .chipset button[aria-pressed=true]{border-color:var(--blue);background:rgba(91,140,255,.12);color:var(--text)}\n.sc-msg .sw:disabled{opacity:.4;cursor:not-allowed}\n.sc-msg .stepper{padding-left:14px;padding-right:14px}\n.sc-msg .st{width:64px}\n.sc-msg .st span{font-size:11.5px}\n.sc-msg .card.auto.clickable,.sc-msg .card.msg.clickable{cursor:pointer}\n.sc-msg .row2{display:flex;align-items:center;justify-content:space-between;gap:8px}\n.sc-msg .text-btn{background:transparent;border:0;color:var(--blue);font-weight:600;font-size:14px;min-height:40px;padding:0 6px;cursor:pointer;display:inline-flex;align-items:center;gap:6px}\n.sc-msg .big-warn{width:68px;height:68px;border-radius:50%;background:rgba(255,180,84,.14);color:var(--amber);display:grid;place-items:center}\n.sc-msg .sheet.tall{height:92%;max-height:92%;display:flex;flex-direction:column;padding:8px 0 0;overflow:hidden}\n.sc-msg .mpv-ctl{padding:8px 16px 0;display:flex;flex-direction:column;gap:8px}\n.sc-msg .mpv-row{display:flex;gap:8px;align-items:flex-end}\n.sc-msg .mpv-seg{display:flex;background:var(--night);border-radius:12px;padding:3px;gap:2px;flex:1}\n.sc-msg .mpv-seg button{flex:1;border:0;background:transparent;color:var(--muted);font-size:13px;font-weight:600;padding:7px;border-radius:9px;cursor:pointer;min-height:38px;display:inline-flex;align-items:center;justify-content:center;gap:6px}\n.sc-msg .mpv-seg button[aria-pressed=true]{background:var(--panel2);color:var(--text)}\n.sc-msg .mpv-iconbtn{width:44px;height:44px;border-radius:12px;border:1px solid var(--line);background:var(--panel2);color:var(--text);display:grid;place-items:center;cursor:pointer;flex:none}\n.sc-msg .mpv-in{flex:1;min-width:0;display:flex;flex-direction:column;gap:4px;font-size:12px;color:var(--muted);font-weight:600}\n.sc-msg .mpv-in input{background:var(--night);border:1px solid var(--line);border-radius:10px;color:var(--text);font:inherit;font-size:14px;padding:0 10px;min-height:40px;width:100%;color-scheme:dark}\n.sc-msg .mpv-ig{position:relative;flex:1;min-height:0;margin:10px 16px 0;border:1px solid var(--line);border-radius:22px;background:#0A0E17;display:flex;flex-direction:column;overflow:hidden}\n.sc-msg .mpv-igh{display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid var(--line);font-weight:600;font-size:14.5px}\n.sc-msg .mpv-igh small{display:block;color:var(--muted);font-weight:500;font-size:12px}\n.sc-msg .mpv-chat{flex:1;overflow-y:auto;padding:14px 12px;display:flex;flex-direction:column;gap:8px}\n.sc-msg .mpv-us{display:flex;flex-direction:column;align-items:flex-start;gap:6px;max-width:100%}\n.sc-msg .mpv-bub{max-width:84%;border-radius:20px;padding:10px 14px;font-size:14.5px;line-height:1.45;overflow-wrap:anywhere;white-space:pre-wrap}\n.sc-msg .mpv-bub.bot{background:#262F45}\n.sc-msg .mpv-bub.me{background:var(--blue);color:#0B1020;align-self:flex-end}\n.sc-msg .mpv-bub.mpv-ph{color:var(--muted);font-style:italic}\n.sc-msg .mpv-bub.mpv-na{background:transparent;border:1px dashed #3B486B;color:var(--muted);font-size:13.5px}\n.sc-msg .mpv-note{align-self:flex-end;font-size:11.5px;color:var(--muted);max-width:80%;text-align:right}\n.sc-msg .mpv-link{background:transparent;border:0;padding:0;color:#8FB0FF;text-decoration:underline;font:inherit;cursor:pointer;text-align:left}\n.sc-msg .mpv-btns{display:flex;flex-direction:column;gap:4px;width:min(84%,270px)}\n.sc-msg .mpv-btn{background:#262F45;border:0;border-radius:14px;padding:11px 10px;color:#8FB0FF;font-weight:600;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;font-family:inherit}\n.sc-msg .mpv-q{display:flex;flex-wrap:wrap;gap:6px}\n.sc-msg .mpv-pill{background:transparent;border:1px solid #6E97FF;color:#8FB0FF;border-radius:999px;padding:8px 14px;font-size:13.5px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:5px;font-family:inherit}\n.sc-msg .mpv-rail{display:flex;gap:8px;overflow-x:auto;scroll-snap-type:x mandatory;max-width:100%;padding-bottom:6px}\n.sc-msg .mpv-card{flex:none;width:210px;scroll-snap-align:start;background:#262F45;border-radius:18px;overflow:hidden}\n.sc-msg .mpv-card img{width:100%;height:120px;object-fit:cover;display:block}\n.sc-msg .mpv-cb{padding:10px 12px;display:flex;flex-direction:column;gap:2px;cursor:pointer;background:transparent;border:0;color:inherit;text-align:left;width:100%;font-family:inherit}\n.sc-msg .mpv-cb b{font-size:14.5px}\n.sc-msg .mpv-cb span{font-size:13px;color:#B9C3DB}\n.sc-msg .mpv-cbtn{display:block;width:100%;border:0;border-top:1px solid #34405D;background:transparent;text-align:center;padding:10px 8px;color:#8FB0FF;font-weight:600;font-size:14px;cursor:pointer;font-family:inherit}\n.sc-msg .mpv-dots{display:flex;gap:5px;justify-content:center;width:100%}\n.sc-msg .mpv-dots i{width:6px;height:6px;border-radius:50%;background:#3B486B}\n.sc-msg .mpv-dots i.on{background:#8FB0FF}\n.sc-msg .mpv-imgs{display:grid;grid-template-columns:repeat(2,1fr);gap:4px;width:min(84%,250px)}\n.sc-msg .mpv-imgs.one{grid-template-columns:1fr;width:min(70%,220px)}\n.sc-msg .mpv-imgs img{width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:16px}\n.sc-msg .mpv-imgs.one img{aspect-ratio:auto;max-height:260px}\n.sc-msg .mpv-file{display:flex;align-items:center;gap:10px;background:#262F45;border-radius:16px;padding:10px 14px 10px 10px;max-width:84%}\n.sc-msg .mpv-file .fi{width:40px;height:40px;border-radius:12px;background:rgba(91,140,255,.16);color:var(--blue);display:grid;place-items:center;flex:none}\n.sc-msg .mpv-file b{display:block;font-size:14px;overflow-wrap:anywhere}\n.sc-msg .mpv-file small{color:var(--muted);font-size:12px}\n.sc-msg .mpv-video{position:relative;width:min(84%,230px);aspect-ratio:9/12;background:#1A2233;border-radius:18px;display:grid;place-items:center;color:var(--muted);font-size:12px}\n.sc-msg .mpv-play{width:52px;height:52px;border-radius:50%;background:rgba(0,0,0,.55);color:#fff;display:grid;place-items:center}\n.sc-msg .mpv-audio{display:flex;align-items:center;gap:10px;background:#262F45;border-radius:22px;padding:8px 16px 8px 8px;color:var(--muted);font-size:12px}\n.sc-msg .mpv-audio .wv{display:flex;align-items:center;gap:2px;height:22px}\n.sc-msg .mpv-audio .wv i{width:3px;border-radius:2px;background:#8FB0FF}\n.sc-msg .mpv-composer{margin:8px 12px 12px;border:1px solid var(--line);border-radius:999px;padding:11px 16px;color:#5D6883;font-size:14px}\n.sc-msg .mpv-snack{position:absolute;left:12px;right:12px;bottom:64px;background:#EAEEF8;color:#0F1420;font-weight:600;font-size:13.5px;padding:10px 14px;border-radius:12px;text-align:center}\n.sc-msg .mpv-foot{padding:10px 16px 16px;display:flex;flex-direction:column;gap:6px}\n.sc-msg .mpv-lim{font-size:13px;color:var(--muted)}\n.sc-msg .mpv-iss{display:flex;gap:8px;font-size:13px;line-height:1.45;color:#FFE3BC}\n.sc-msg .mpv-iss svg{flex:none;margin-top:2px;color:var(--amber)}\n";

return { Component: CreateMessage };

})();

/* ═════════ ProfileMod ═════════ */
const ProfileMod = (() => {

/* ───────────── data ───────────── */

const SEED_CHANNELS = [
  { id: 1, name: "Kayon.ir", hue: 215, status: "ok", days: 48 },
  { id: 2, name: "Vayra.ir", hue: 165, status: "reconnect", days: 0 },
  { id: 3, name: "Bazaar.ir", hue: 340, status: "expiring", days: 5 },
];
const POOL = ["Newshop.ir", "Studio.ir", "Atlas.ir"];

const SEED_DEVICES = [
  { id: 1, name: "This phone", detail: "Android app", when: "Active now", icon: Smartphone, current: true },
  { id: 2, name: "Chrome on Windows", detail: "Web", when: "2 days ago", icon: Monitor },
  { id: 3, name: "iPad", detail: "iOS app", when: "3 weeks ago", icon: Tablet },
];

const SEED_INBOX = [
  { id: 1, kind: "warn", title: "Vayra.ir needs to reconnect", body: "Instagram asked for a new sign-in. Replies are paused until you reconnect.", time: "1h", unread: true, action: "channel", channel: "Vayra.ir" },
  { id: 4, kind: "warn", title: "Bazaar.ir connection expires soon", body: "We couldn’t renew it automatically. Sign in again within 5 days to keep replies running.", time: "3h", unread: true, action: "channel", channel: "Bazaar.ir" },
  { id: 2, kind: "info", title: "Daily summary", body: "238 replies sent today. 56 weren’t sent. Open Home to see why.", time: "5h", unread: true },
  { id: 3, kind: "info", title: "Welcome to YooChat", body: "Connect a channel and create your first automation.", time: "2d", unread: false },
];

const LANGS = ["English", "Español", "Français"];

const FAQ_CATS = ["All", "Automations", "Conditions", "Channels", "Account"];
const FAQ = [
  { id: 1, cat: "Automations", q: "What is an automation?", a: "An automation replies for you when someone sends a direct message, replies to a story, comments on a post, or shares a post. You choose when it fires and what it sends." },
  { id: 2, cat: "Automations", q: "Why didn’t my automation reply?", a: "Check that it is switched on, that its channel shows Connected, and that the message meets every rule you added. The “skipped by conditions” number on Home shows how many messages were filtered out." },
  { id: 3, cat: "Conditions", q: "How do text rules work?", a: "Equals needs the whole message to match. Contains looks for the words anywhere in the message. Starts with checks the beginning. If you add several rules, a message needs to match any one of them." },
  { id: 4, cat: "Conditions", q: "Can I reply only under certain posts?", a: "Yes. For comments and post shares, choose Selected and pick the posts. For story replies, pick the stories." },
  { id: 5, cat: "Channels", q: "How do I connect an account?", a: "Open Profile, tap Add channel, and sign in with Instagram. Business and Creator accounts are supported." },
  { id: 6, cat: "Channels", q: "Why does a channel say “Reconnect needed”?", a: "Instagram asked for a new sign-in. Open the channel from Profile and tap Reconnect. Replies are paused until you do." },
  { id: 7, cat: "Account", q: "How do I sign out of another device?", a: "Open Profile, then Devices, and tap Sign out next to the device. You can also sign out of all other devices at once." },
  { id: 8, cat: "Account", q: "What is a passkey?", a: "A passkey lets you sign in with your fingerprint, face, or screen lock instead of typing a password." },
  { id: 9, cat: "Automations", q: "Why can’t a reminder go out after 24 hours?", a: "Instagram lets an automated account message someone only for 24 hours after their last message. Reminders can be sent up to 23 hours later." },
  { id: 10, cat: "Automations", q: "Why did a commenter get only one message?", a: "Instagram allows one private reply per comment, within 7 days of the comment. Anything more is sent after the person replies or taps a button." },
];

const POLICY = [
  { h: "What we collect", p: "We collect the account details you give us, such as your name and email, and the information needed to run your automations, such as the messages your connected channels receive." },
  { h: "How we use it", p: "We use this information to send the replies you set up, to keep your account secure, and to improve YooChat. We don’t use your customers’ messages for anything else." },
  { h: "Who we share it with", p: "We share data only with the services that help us run YooChat, and only when they need it to do so. We never sell your data." },
  { h: "Your choices", p: "You can edit your details in Account, disconnect any channel from Profile, and delete your account at any time. Deleting your account removes your channels and automations." },
  { h: "Contact us", p: "If you have questions about this policy, use Ask a question in Profile and we’ll reply by email." },
];

let _id = 50;
const uid = () => ++_id;

const initials = (name) =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";

/* ───────────── shared components ───────────── */

function TopBar({ title, onBack, right }) {
  return (
    <div className="ed-top">
      <button type="button" className="icon-btn" aria-label="Back" onClick={onBack}><ChevronLeft size={26} /></button>
      <h1>{title}</h1>
      {right}
    </div>
  );
}

function Switch({ on, onChange, label }) {
  return <button type="button" role="switch" aria-checked={on} aria-label={label} className="sw" onClick={onChange} />;
}

function Seg({ options, value, onChange, label }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o} type="button" aria-pressed={value === o} onClick={() => onChange(o)}>{o}</button>
      ))}
    </div>
  );
}

function Row({ lead, title, sub, value, onClick, accent }) {
  return (
    <button type="button" className={"row" + (accent ? " accent" : "")} onClick={onClick}>
      {lead}
      <span className="rt">
        <b dir="auto">{title}</b>
        {sub && (typeof sub === "string" ? <small>{sub}</small> : sub)}
      </span>
      {value && <span className="val" dir="auto">{value}</span>}
      {!accent && <ChevronRight size={18} className="chev" />}
    </button>
  );
}

function SwitchRow({ title, sub, on, onChange }) {
  return (
    <div className="row static nolead">
      <span className="rt">
        <b>{title}</b>
        {sub && <small>{sub}</small>}
      </span>
      <Switch on={on} onChange={onChange} label={title} />
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <label className="field">
      {label}
      {children}
      {error && <span className="err">{error}</span>}
    </label>
  );
}

const Status = ({ s, d }) =>
  s === "ok" ? (
    <span className="stat"><i />Connected</span>
  ) : s === "expiring" ? (
    <span className="stat warn"><i />Expires in {d} days</span>
  ) : (
    <span className="stat warn"><i />Reconnect needed</span>
  );

const Avatar = ({ ch, size }) => (
  <span className={"av" + (size === "lg" ? " lg" : "")} style={{ "--h": ch.hue }} aria-hidden="true">
    {ch.name[0]}
  </span>
);

function Sheet({ label, onClose, children }) {
  return (
    <div className="scrim" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={label} onClick={(e) => e.stopPropagation()}>
        <div className="grab" />
        {children}
      </div>
    </div>
  );
}

const SheetHead = ({ title, onClose, lead }) => (
  <div className="sh-head">
    {lead || <h2>{title}</h2>}
    <button type="button" className="icon-btn sm" aria-label="Close" onClick={onClose}><X size={20} /></button>
  </div>
);

function ConfirmSheet({ cfg, onClose }) {
  const [t, setT] = useState("");
  const ok = !cfg.requireText || t.trim() === cfg.requireText;
  return (
    <Sheet label={cfg.title} onClose={onClose}>
      <SheetHead title={cfg.title} onClose={onClose} />
      <p className="note">{cfg.body}</p>
      {cfg.requireText && (
        <Field label={`Type ${cfg.requireText} to confirm`}>
          <input className="inp" value={t} onChange={(e) => setT(e.target.value)} autoCapitalize="characters" />
        </Field>
      )}
      <div className="stack">
        <button type="button" className="danger solid" disabled={!ok} onClick={cfg.onConfirm}>{cfg.label}</button>
        <button type="button" className="ghost" onClick={onClose}>Cancel</button>
      </div>
    </Sheet>
  );
}

/* ───────────── profile home ───────────── */

function ProfileScreen({ me, channels, lang, devicesCount, unread, go, onChannel, onLang, onLogout, soon }) {
  const nav = useContext(NavCtx);
  const chan = useContext(ChanCtx);
  const [ld, retryLoad] = useLoad("channels", 700);
  const settings = [
    { key: "privacy", icon: ShieldCheck, title: "Privacy & security", sub: "Passkeys and sign-in", onClick: () => go("privacy") },
    { key: "notif", icon: Bell, title: "Notifications", sub: "In app, sounds, badges", onClick: () => go("notif") },
    { key: "devices", icon: Smartphone, title: "Devices", sub: "Manage connected devices", value: String(devicesCount), onClick: () => go("devices") },
    { key: "lang", icon: Globe, title: "Language", value: lang, onClick: onLang },
  ];
  const help = [
    { key: "ask", icon: MessageSquare, title: "Ask a question", sub: "Ask or report a problem", onClick: () => go("ask") },
    { key: "faq", icon: BookOpen, title: "YooChat FAQ", sub: "Common questions", onClick: () => go("faq") },
    { key: "policy", icon: FileText, title: "Privacy policy", sub: "Our privacy policy", onClick: () => go("policy") },
  ];
  return (
    <>
      <header className="hdr">
        <h1>Profile</h1>
        <button type="button" className="icon-btn" aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"} onClick={() => go("inbox")}>
          <Bell size={22} />
          {unread > 0 && <i className="dot" />}
        </button>
      </header>

      <div className="scr">
        <div className="body">
          <button type="button" className="me" onClick={() => go("account")}>
            <span className="av xl" aria-hidden="true">{initials(me.name)}</span>
            <span className="rt">
              <b dir="auto">{me.name}</b>
              <small>{me.email}</small>
            </span>
            <ChevronRight size={18} className="chev" />
          </button>

          <section>
            <h2 className="gh">Channels{channels.length ? ` (${channels.length})` : ""}</h2>
            <div className="grp">
              {ld.status === "loading" && [0, 1].map((i) => (
                <div className="row static" key={i} role="status" aria-busy="true" aria-label="Loading channels">
                  <Skeleton h={40} w={40} r={20} />
                  <span className="rt"><Skeleton h={16} w="45%" /><Skeleton h={12} w="30%" /></span>
                </div>
              ))}
              {ld.status === "error" && <div style={{ padding: 8 }}><LoadError err={ld.err} onRetry={retryLoad} what="channels" /></div>}
              {ld.status === "ready" && channels.length === 0 && <p className="empty">No channels yet. Connect an account to start replying.</p>}
              {ld.status === "ready" && channels.map((c) => (
                <Row key={c.id} lead={<Avatar ch={c} />} title={c.name} sub={<Status s={c.status} d={c.days} />} value={c.id === chan.activeId ? "Active" : undefined} onClick={() => onChannel(c.id)} />
              ))}
              <Row accent lead={<span className="ico blue"><Plus size={20} strokeWidth={2.6} /></span>} title="Add channel" onClick={() => go("add")} />
            </div>
          </section>

          <section>
            <h2 className="gh">Settings</h2>
            <div className="grp">
              {settings.map((s) => (
                <Row key={s.key} lead={<span className="ico"><s.icon size={20} /></span>} title={s.title} sub={s.sub} value={s.value} onClick={s.onClick} />
              ))}
            </div>
          </section>

          <section>
            <h2 className="gh">Help</h2>
            <div className="grp">
              {help.map((h) => (
                <Row key={h.key} lead={<span className="ico"><h.icon size={20} /></span>} title={h.title} sub={h.sub} onClick={h.onClick} />
              ))}
            </div>
          </section>

          <button type="button" className="logout" onClick={onLogout}><LogOut size={18} /> Log out</button>
        </div>
      </div>

      <nav className="nav" aria-label="Main">
        <button type="button" onClick={() => nav("home")}><Home size={22} />Home</button>
        <button type="button" onClick={() => nav("automation")}><Sparkles size={22} />Automation</button>
        <button type="button" aria-current="page"><User size={22} />Profile</button>
      </nav>
    </>
  );
}

/* ───────────── account ───────────── */

function AccountScreen({ me, onSave, onBack, onDelete, soon }) {
  const [d, setD] = useState(me);
  const emailOk = /^\S+@\S+\.\S+$/.test(d.email.trim());
  const dirty = JSON.stringify(d) !== JSON.stringify(me);
  const valid = d.name.trim() && emailOk;
  const save = () => {
    const t = { ...d, name: d.name.trim(), email: d.email.trim() };
    setD(t);
    onSave(t);
  };
  return (
    <>
      <TopBar title="Account" onBack={onBack} />
      <div className="scr">
        <div className="pad">
          <div className="ph">
            <span className="av xl big" aria-hidden="true">{initials(d.name)}</span>
            <button type="button" className="btn2" onClick={soon}>Change photo</button>
          </div>

          <Field label="Name">
            <input className="inp" dir="auto" value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} />
          </Field>
          <Field label="Email" error={d.email && !emailOk ? "Enter a valid email address." : ""}>
            <input className="inp" type="email" inputMode="email" value={d.email} onChange={(e) => setD({ ...d, email: e.target.value })} />
          </Field>

          <h2 className="gh sp">More about you</h2>
          <Field label="Phone (optional)">
            <input className="inp" type="tel" inputMode="tel" value={d.phone} onChange={(e) => setD({ ...d, phone: e.target.value })} />
          </Field>
          <Field label="Business or brand (optional)">
            <input className="inp" dir="auto" value={d.company} onChange={(e) => setD({ ...d, company: e.target.value })} />
          </Field>

          <button type="button" className="danger-link" onClick={onDelete}>Delete account</button>
        </div>
      </div>
      <footer className="ed-foot">
        <button type="button" className="primary" disabled={!dirty || !valid} onClick={save}>Save changes</button>
      </footer>
    </>
  );
}

/* ───────────── privacy & security ───────────── */

function PrivacyScreen({ passkeys, setPasskeys, devicesCount, onBack, goDevices, toast }) {
  const add = () => {
    setPasskeys((l) => [...l, { id: uid(), name: `Passkey ${l.length + 1}`, added: "Just now" }]);
    toast("Passkey added");
  };
  return (
    <>
      <TopBar title="Privacy & security" onBack={onBack} />
      <div className="scr">
        <div className="pad">
          <div className="callout">
            <Fingerprint size={22} />
            <p>Passkeys let you sign in with your fingerprint, face, or screen lock. There is no password to type or leak.</p>
          </div>

          <h2 className="gh sp">Passkeys</h2>
          <div className="grp">
            {passkeys.length === 0 && <p className="empty">No passkeys yet.</p>}
            {passkeys.map((p) => (
              <div key={p.id} className="row static">
                <span className="ico"><Fingerprint size={20} /></span>
                <span className="rt">
                  <b>{p.name}</b>
                  <small>Added {p.added}</small>
                </span>
                <button
                  type="button"
                  className="icon-btn sm"
                  aria-label={`Remove ${p.name}`}
                  onClick={() => {
                    setPasskeys((l) => l.filter((x) => x.id !== p.id));
                    toast("Passkey removed");
                  }}
                >
                  <X size={18} />
                </button>
              </div>
            ))}
            <Row accent lead={<span className="ico blue"><Plus size={20} strokeWidth={2.6} /></span>} title="Add a passkey" onClick={add} />
          </div>

          <h2 className="gh sp">Devices</h2>
          <div className="grp">
            <Row lead={<span className="ico"><Smartphone size={20} /></span>} title="Connected devices" sub="See where you’re signed in" value={String(devicesCount)} onClick={goDevices} />
          </div>
        </div>
      </div>
    </>
  );
}

/* ───────────── notifications ───────────── */

function NotifScreen({ n, setN, onBack }) {
  return (
    <>
      <TopBar title="Notifications" onBack={onBack} />
      <div className="scr">
        <div className="pad">
          <h2 className="gh">In app</h2>
          <div className="grp">
            <SwitchRow title="Banners" sub="Show a banner when something needs you" on={n.inApp} onChange={() => setN({ inApp: !n.inApp })} />
          </div>

          <h2 className="gh sp">Sounds</h2>
          <div className="grp">
            <SwitchRow title="Play sounds" sub="A short sound for new activity" on={n.sounds} onChange={() => setN({ sounds: !n.sounds })} />
            {n.sounds && (
              <div className="row static nolead tone">
                <Seg label="Sound" options={["Chime", "Pop", "Soft"]} value={n.tone} onChange={(v) => setN({ tone: v })} />
              </div>
            )}
          </div>

          <h2 className="gh sp">Badges</h2>
          <div className="grp">
            <SwitchRow title="App icon badge" sub="Show an unread count on the app icon" on={n.badges} onChange={() => setN({ badges: !n.badges })} />
          </div>

          <h2 className="gh sp">Notify me about</h2>
          <div className="grp">
            <SwitchRow title="Channel problems" sub="When a channel needs to reconnect" on={n.problems} onChange={() => setN({ problems: !n.problems })} />
            <SwitchRow title="Daily summary" sub="A short recap of replies sent" on={n.summary} onChange={() => setN({ summary: !n.summary })} />
          </div>
        </div>
      </div>
    </>
  );
}

/* ───────────── devices ───────────── */

function DevicesScreen({ devices, onSignOut, onSignOutAll, onBack }) {
  const current = devices.find((d) => d.current);
  const others = devices.filter((d) => !d.current);
  return (
    <>
      <TopBar title="Devices" onBack={onBack} />
      <div className="scr">
        <div className="pad">
          {current && (
            <>
              <h2 className="gh">This device</h2>
              <div className="grp">
                <div className="row static">
                  <span className="ico"><current.icon size={20} /></span>
                  <span className="rt">
                    <b>{current.name}</b>
                    <small>{current.detail}</small>
                  </span>
                  <span className="stat"><i />Active now</span>
                </div>
              </div>
            </>
          )}

          <h2 className="gh sp">Other devices</h2>
          <div className="grp">
            {others.length === 0 && <p className="empty">No other devices are signed in.</p>}
            {others.map((d) => (
              <div key={d.id} className="row static">
                <span className="ico"><d.icon size={20} /></span>
                <span className="rt">
                  <b>{d.name}</b>
                  <small>{d.detail}, {d.when}</small>
                </span>
                <button type="button" className="link-danger" onClick={() => onSignOut(d)}>Sign out</button>
              </div>
            ))}
          </div>

          <button type="button" className="danger wide-btn" disabled={others.length === 0} onClick={onSignOutAll}>
            Sign out of all other devices
          </button>
        </div>
      </div>
    </>
  );
}

/* ───────────── ask a question ───────────── */

function AskScreen({ email, onBack, goFaq }) {
  const [kind, setKind] = useState("Question");
  const [topic, setTopic] = useState("Automations");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [file, setFile] = useState(false);
  const [sent, setSent] = useState(false);
  const valid = subject.trim() && message.trim().length >= 10;

  if (sent) {
    return (
      <>
        <TopBar title="Ask a question" onBack={onBack} />
        <div className="scr">
          <div className="pad center">
            <span className="big-check"><Check size={34} strokeWidth={3} /></span>
            <h2 className="c-title">Message sent</h2>
            <p className="note">We’ll reply to {email}.</p>
          </div>
        </div>
        <footer className="ed-foot">
          <button type="button" className="primary" onClick={onBack}>Back to profile</button>
        </footer>
      </>
    );
  }

  return (
    <>
      <TopBar title="Ask a question" onBack={onBack} />
      <div className="scr">
        <div className="pad">
          <Seg label="Type" options={["Question", "Report a problem"]} value={kind} onChange={setKind} />

          <p className="lab">What is it about?</p>
          <div className="chips">
            {["Automations", "Channels", "Account", "Other"].map((t) => (
              <button key={t} type="button" className="chipb" aria-pressed={topic === t} onClick={() => setTopic(t)}>{t}</button>
            ))}
          </div>

          <Field label="Subject">
            <input className="inp" dir="auto" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </Field>
          <Field label={kind === "Question" ? "Your question" : "What went wrong?"}>
            <textarea
              className="inp"
              dir="auto"
              rows={5}
              value={message}
              placeholder={kind === "Question" ? "Ask anything about YooChat" : "Tell us what you did and what happened"}
              onChange={(e) => setMessage(e.target.value)}
            />
          </Field>

          {file ? (
            <div className="filechip">
              <Paperclip size={16} /> screenshot.png
              <button type="button" aria-label="Remove screenshot" onClick={() => setFile(false)}><X size={14} /></button>
            </div>
          ) : (
            <button type="button" className="btn2 attach" onClick={() => setFile(true)}><Paperclip size={16} /> Attach a screenshot</button>
          )}

          <button type="button" className="text-link" onClick={goFaq}>Check the FAQ first</button>
        </div>
      </div>
      <footer className="ed-foot">
        <p className="sum">We’ll reply to {email}.</p>
        <button type="button" className="primary" disabled={!valid} onClick={() => setSent(true)}>Send</button>
      </footer>
    </>
  );
}

/* ───────────── FAQ ───────────── */

function FaqScreen({ onBack, goAsk }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [open, setOpen] = useState(null);
  const s = q.trim().toLowerCase();
  const list = FAQ.filter((f) => (cat === "All" || f.cat === cat) && (!s || `${f.q} ${f.a}`.toLowerCase().includes(s)));
  return (
    <>
      <TopBar title="YooChat FAQ" onBack={onBack} />
      <div className="scr">
        <div className="pad">
          <div className="search">
            <Search size={18} />
            <input className="inp" dir="auto" type="search" value={q} placeholder="Search questions" aria-label="Search questions" onChange={(e) => setQ(e.target.value)} />
          </div>

          <div className="chips scroll" role="group" aria-label="Category">
            {FAQ_CATS.map((c) => (
              <button key={c} type="button" className="chipb" aria-pressed={cat === c} onClick={() => setCat(c)}>{c}</button>
            ))}
          </div>

          {list.length > 0 ? (
            <div className="acc">
              {list.map((f) => (
                <div className="qa" key={f.id}>
                  <button type="button" className="q" aria-expanded={open === f.id} onClick={() => setOpen(open === f.id ? null : f.id)}>
                    <span>{f.q}</span>
                    <ChevronDown size={18} />
                  </button>
                  {open === f.id && <p className="a">{f.a}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-block">No matches for “{q}”. Try other words, or ask us.</p>
          )}

          <div className="stuck">
            <p>Still stuck?</p>
            <button type="button" className="btn2 blue" onClick={goAsk}>Ask a question</button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ───────────── privacy policy ───────────── */

function PolicyScreen({ onBack }) {
  return (
    <>
      <TopBar title="Privacy policy" onBack={onBack} />
      <div className="scr">
        <div className="pad doc">
          <div className="callout info">
            <Info size={20} />
            <p>Sample text. Replace it with your real policy.</p>
          </div>
          <p className="muted-line">Last updated September 2026</p>
          {POLICY.map((s) => (
            <section key={s.h}>
              <h2>{s.h}</h2>
              <p>{s.p}</p>
            </section>
          ))}
        </div>
      </div>
    </>
  );
}

/* ───────────── add channel ───────────── */

function AddChannelScreen({ existing, onBack, onAdd }) {
  const [phase, setPhase] = useState("intro");
  const name = POOL.find((n) => !existing.includes(n)) || `Channel${existing.length + 1}.ir`;

  const net = useContext(NetCtx);
  const [err, setErr] = useState(null);
  useEffect(() => {
    if (phase !== "loading") return;
    let live = true;
    net.call(1400).then(
      () => live && setPhase("done"),
      (e) => { if (live) { setErr(e); setPhase("error"); } }
    );
    return () => { live = false; };
  }, [phase]);

  const steps = [
    "Sign in to Instagram",
    "Allow YooChat to read and reply to your messages",
    "Pick the account to connect",
  ];

  return (
    <>
      <TopBar title="Add channel" onBack={onBack} />

      {phase === "intro" && (
        <>
          <div className="scr">
            <div className="pad">
              <div className="link-hero" aria-hidden="true">
                <span className="tile-y">Y</span>
                <Link2 size={22} />
                <span className="tile-ig"><AtSign size={26} /></span>
              </div>
              <h2 className="c-title left">Connect your Instagram account</h2>
              <p className="note">YooChat replies to messages, comments and story replies on the account you connect.</p>

              <ol className="steps">
                {steps.map((t, i) => (
                  <li key={t}><i>{i + 1}</i><span>{t}</span></li>
                ))}
              </ol>

              <div className="callout info">
                <Info size={20} />
                <p>Works with Instagram Business and Creator accounts. You can disconnect at any time from Profile.</p>
              </div>
            </div>
          </div>
          <footer className="ed-foot">
            <button type="button" className="primary" onClick={() => setPhase("loading")}>Continue with Instagram</button>
          </footer>
        </>
      )}

      {phase === "loading" && (
        <>
          <div className="scr">
            <div className="pad center">
              <span className="spin" aria-hidden="true" />
              <h2 className="c-title">Connecting…</h2>
              <p className="note">Finish signing in with Instagram.</p>
            </div>
          </div>
          <footer className="ed-foot">
            <button type="button" className="ghost" onClick={() => setPhase("intro")}>Cancel</button>
          </footer>
        </>
      )}

      {phase === "error" && (
        <>
          <div className="scr">
            <div className="pad center">
              <span className="big-warn"><AlertTriangle size={32} /></span>
              <h2 className="c-title">{err && err.kind === "offline" ? "You’re offline" : "Couldn’t connect"}</h2>
              <p className="note">{err && err.kind === "offline" ? "Check your connection, then try again." : "Instagram didn’t respond. Nothing was changed. Try again."}</p>
            </div>
          </div>
          <footer className="ed-foot">
            <button type="button" className="primary" onClick={() => setPhase("loading")}>Try again</button>
            <button type="button" className="ghost" onClick={() => setPhase("intro")}>Back</button>
          </footer>
        </>
      )}

      {phase === "done" && (
        <>
          <div className="scr">
            <div className="pad center">
              <span className="big-check"><Check size={34} strokeWidth={3} /></span>
              <h2 className="c-title">Channel connected</h2>
              <div className="pill-ch">
                <Avatar ch={{ name, hue: 30 }} />
                <b>{name}</b>
                <Status s="ok" />
              </div>
            </div>
          </div>
          <footer className="ed-foot">
            <button type="button" className="primary" onClick={() => onAdd({ id: uid(), name, hue: 30, status: "ok", days: 60 })}>Done</button>
          </footer>
        </>
      )}
    </>
  );
}

/* ───────────── inbox ───────────── */

function InboxScreen({ items, onOpen, onReadAll, onBack }) {
  const unread = items.filter((i) => i.unread).length;
  return (
    <>
      <TopBar
        title="Notifications"
        onBack={onBack}
        right={
          <button type="button" className="text-btn" disabled={!unread} onClick={onReadAll}>Mark all read</button>
        }
      />
      <div className="scr">
        <div className="pad">
          <div className="grp">
            <LoadGate k="inbox" ms={700} what="notifications" skeleton={<div>{[0, 1, 2].map((i) => (<div className="inb" key={i} role="status" aria-busy="true"><Skeleton h={40} w={40} r={12} /><span className="rt"><Skeleton h={15} w="60%" /><Skeleton h={12} w="90%" /></span></div>))}</div>}>
            {items.map((it) => (
              <button key={it.id} type="button" className="inb" onClick={() => onOpen(it)}>
                <span className={"ico" + (it.kind === "warn" ? " warn" : "")}>
                  {it.kind === "warn" ? <AlertTriangle size={20} /> : <Bell size={20} />}
                </span>
                <span className="rt">
                  <b className={it.unread ? "" : "read"}>{it.title}</b>
                  <small>{it.body}</small>
                </span>
                <span className="when">
                  {it.time}
                  {it.unread && <i className="ud" aria-label="Unread" />}
                </span>
              </button>
            ))}
            </LoadGate>
          </div>
        </div>
      </div>
    </>
  );
}

/* ───────────── main ───────────── */

const TABS = [
  ["profile", "Profile"],
  ["account", "Account"],
  ["privacy", "Privacy"],
  ["notif", "Notifications"],
  ["devices", "Devices"],
  ["lang", "Language"],
  ["ask", "Ask"],
  ["faq", "FAQ"],
  ["policy", "Policy"],
  ["add", "Add channel"],
  ["inbox", "Inbox"],
];

function ProfileSection(props) {
  const [view, setView] = useState("profile");
  const [me, setMe] = useState({ name: "Sara Karimi", email: "sara@example.com", phone: "", company: "" });
  const { channels, setChannels } = props;
  const chanCtx = useContext(ChanCtx);
  const [lang, setLang] = useState("English");
  const [passkeys, setPasskeys] = useState([{ id: 1, name: "This phone", added: "Sep 2" }]);
  const [devices, setDevices] = useState(SEED_DEVICES);
  const [notif, setNotif] = useState({ inApp: true, sounds: true, tone: "Chime", badges: true, problems: true, summary: false });
  const [inbox, setInbox] = useState(SEED_INBOX);
  const [sheet, setSheet] = useState(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const soon = () => setToast("Not part of this mockup");
  const back = () => setView("profile");
  const close = () => setSheet(null);
  const unread = inbox.filter((i) => i.unread).length;
  useEffect(() => {
    if (props.onUnread) props.onUnread(unread);
  }, [unread]);
  useEffect(() => {
    if (props.cmd && props.cmd.view) {
      setSheet(null);
      setView(props.cmd.view);
      if (props.cmd.openChannel) setSheet({ type: "channel", id: props.cmd.openChannel, confirm: false });
    }
  }, [props.cmd]);
  const ch = sheet?.type === "channel" ? channels.find((c) => c.id === sheet.id) : null;

  const jump = (k) => {
    setSheet(null);
    if (k === "lang") {
      setView("profile");
      setSheet({ type: "lang" });
    } else {
      setView(k);
    }
  };

  const reconnect = () => {
    setChannels((l) => l.map((c) => (c.id === ch.id ? { ...c, status: "ok", days: 60 } : c)));
    setToast(`${ch.name} reconnected`);
    close();
  };
  const disconnect = () => {
    setChannels((l) => l.filter((c) => c.id !== ch.id));
    if (props.onRemoved) props.onRemoved(ch.id);
    setToast(`${ch.name} disconnected`);
    close();
  };

  const openInboxItem = (it) => {
    setInbox((l) => l.map((x) => (x.id === it.id ? { ...x, unread: false } : x)));
    if (it.action === "channel") {
      const c = channels.find((x) => x.name === (it.channel || "Vayra.ir")) || channels[0];
      if (c) {
        setView("profile");
        setSheet({ type: "channel", id: c.id, confirm: false });
      }
    }
  };

  const confirm = (cfg) => setSheet({ type: "confirm", cfg });

  return (
    <div className="sc-profile screen">
      <style>{CSS}</style>
        {view === "profile" && (
          <ProfileScreen
            me={me}
            channels={channels}
            lang={lang}
            devicesCount={devices.length}
            unread={unread}
            go={setView}
            onChannel={(id) => setSheet({ type: "channel", id, confirm: false })}
            onLang={() => setSheet({ type: "lang" })}
            onLogout={() =>
              confirm({
                title: "Log out?",
                body: "You’ll need to sign in again to use YooChat on this phone. Your automations keep running.",
                label: "Log out",
                onConfirm: () => {
                  close();
                  setToast("Logged out (mockup)");
                },
              })
            }
            soon={soon}
          />
        )}

        {view === "account" && (
          <AccountScreen
            me={me}
            soon={soon}
            onBack={back}
            onSave={(t) => {
              setMe(t);
              setToast("Changes saved");
            }}
            onDelete={() =>
              confirm({
                title: "Delete your account?",
                body: "This removes your channels and automations. It can’t be undone.",
                label: "Delete account",
                requireText: "DELETE",
                onConfirm: () => {
                  close();
                  setToast("Account deleted (mockup)");
                },
              })
            }
          />
        )}

        {view === "privacy" && (
          <PrivacyScreen
            passkeys={passkeys}
            setPasskeys={setPasskeys}
            devicesCount={devices.length}
            onBack={back}
            goDevices={() => setView("devices")}
            toast={setToast}
          />
        )}

        {view === "notif" && <NotifScreen n={notif} setN={(p) => setNotif((o) => ({ ...o, ...p }))} onBack={back} />}

        {view === "devices" && (
          <DevicesScreen
            devices={devices}
            onBack={back}
            onSignOut={(d) => {
              setDevices((l) => l.filter((x) => x.id !== d.id));
              setToast(`Signed out of ${d.name}`);
            }}
            onSignOutAll={() =>
              confirm({
                title: "Sign out of other devices?",
                body: "Every device except this phone will be signed out.",
                label: "Sign out all",
                onConfirm: () => {
                  setDevices((l) => l.filter((x) => x.current));
                  close();
                  setToast("Signed out of other devices");
                },
              })
            }
          />
        )}

        {view === "ask" && <AskScreen email={me.email} onBack={back} goFaq={() => setView("faq")} />}
        {view === "faq" && <FaqScreen onBack={back} goAsk={() => setView("ask")} />}
        {view === "policy" && <PolicyScreen onBack={back} />}

        {view === "add" && (
          <AddChannelScreen
            existing={channels.map((c) => c.name)}
            onBack={back}
            onAdd={(c) => {
              setChannels((l) => [...l, c]);
              if (props.onAdded) props.onAdded(c);
              setToast(`${c.name} connected`);
              setView("profile");
            }}
          />
        )}

        {view === "inbox" && (
          <InboxScreen
            items={inbox}
            onBack={back}
            onOpen={openInboxItem}
            onReadAll={() => setInbox((l) => l.map((x) => ({ ...x, unread: false })))}
          />
        )}

        {/* sheets */}
        {sheet?.type === "lang" && (
          <Sheet label="Choose language" onClose={close}>
            <SheetHead title="Language" onClose={close} />
            <div className="mlist">
              {LANGS.map((l) => (
                <button
                  key={l}
                  type="button"
                  className="mrow"
                  aria-pressed={lang === l}
                  onClick={() => {
                    setLang(l);
                    close();
                  }}
                >
                  <span dir="auto">{l}</span>
                  {lang === l && <Check size={18} strokeWidth={3} className="tick" />}
                </button>
              ))}
            </div>
          </Sheet>
        )}

        {sheet?.type === "confirm" && <ConfirmSheet cfg={sheet.cfg} onClose={close} />}

        {ch && !sheet.confirm && (
          <Sheet label={ch.name} onClose={close}>
            <SheetHead
              onClose={close}
              lead={
                <div className="sh-id">
                  <Avatar ch={ch} size="lg" />
                  <div>
                    <h2>{ch.name}</h2>
                    <Status s={ch.status} d={ch.days} />
                  </div>
                </div>
              }
            />
            {ch.status === "ok" && <p className="note">The connection renews automatically. If renewing fails, we’ll warn you before it expires.</p>}
            {ch.status === "expiring" && (
              <p className="notice">We couldn’t renew this connection automatically. Sign in again within {ch.days} days to keep replies running.</p>
            )}
            {ch.status === "reconnect" && (
              <p className="notice">Sign in again to keep this channel working. Automations can’t send replies until you do.</p>
            )}
            <div className="stack">
              {ch.id !== chanCtx.activeId && (
                <button type="button" className="primary" onClick={() => { chanCtx.setActive(ch.id); close(); }}>Use this channel</button>
              )}
              <button type="button" className={ch.status !== "ok" ? "primary" : "ghost"} onClick={reconnect}>
                <RefreshCw size={18} /> {ch.status === "expiring" ? "Renew connection" : "Reconnect"}
              </button>
              <button type="button" className="danger" onClick={() => setSheet({ ...sheet, confirm: true })}>Disconnect channel</button>
            </div>
          </Sheet>
        )}

        {ch && sheet.confirm && (
          <Sheet label={`Disconnect ${ch.name}`} onClose={close}>
            <SheetHead title={`Disconnect ${ch.name}?`} onClose={close} />
            <p className="note">This channel and its automations will be removed. You can connect it again at any time.</p>
            <div className="stack">
              <button type="button" className="danger solid" onClick={disconnect}>Disconnect</button>
              <button type="button" className="ghost" onClick={() => setSheet({ ...sheet, confirm: false })}>Cancel</button>
            </div>
          </Sheet>
        )}

        {toast && (
          <div className="toast-wrap" role="status"><div className="toast">{toast}</div></div>
        )}
    </div>
  );
}

/* ───────────── styles ───────────── */

const CSS = ".sc-profile .scr{flex:1;overflow-y:auto;overscroll-behavior:contain}\n.sc-profile .pad{padding:8px 16px 28px}\n.sc-profile .pad.center{display:flex;flex-direction:column;align-items:center;text-align:center;padding-top:64px}\n.sc-profile .hdr{display:flex;align-items:center;justify-content:space-between;padding:14px 20px 8px}\n.sc-profile .hdr h1{margin:0;font-size:22px;font-weight:700;letter-spacing:-.02em}\n.sc-profile .ed-top{display:flex;align-items:center;gap:4px;padding:10px 12px 6px}\n.sc-profile .ed-top h1{margin:0;font-size:19px;font-weight:700;flex:1}\n.sc-profile .icon-btn{width:44px;height:44px;border-radius:14px;background:transparent;border:0;color:var(--text);display:grid;place-items:center;position:relative;cursor:pointer;flex:none}\n.sc-profile .icon-btn.sm{width:40px;height:40px;border-radius:12px;color:var(--muted)}\n.sc-profile .dot{position:absolute;top:10px;right:11px;width:9px;height:9px;border-radius:50%;background:var(--blue);border:2px solid var(--night)}\n.sc-profile .text-btn{background:transparent;border:0;color:var(--blue);font-weight:600;font-size:14px;min-height:44px;padding:0 12px;cursor:pointer}\n.sc-profile .text-btn:disabled{color:var(--muted);cursor:default}\n.sc-profile .body{padding:8px 16px 22px;display:flex;flex-direction:column;gap:22px}\n.sc-profile .gh{margin:0 4px 8px;font-size:13px;font-weight:600;color:var(--muted)}\n.sc-profile .gh.sp{margin-top:24px}\n.sc-profile .me{width:100%;display:flex;align-items:center;gap:14px;background:var(--panel);border:1px solid var(--line);border-radius:20px;padding:16px;text-align:left;color:var(--text);cursor:pointer;min-height:88px}\n.sc-profile .me .rt b{font-size:17px}\n.sc-profile .chev{color:var(--muted);flex:none;margin-left:auto}\n.sc-profile .grp{background:var(--panel);border:1px solid var(--line);border-radius:20px;overflow:hidden}\n.sc-profile .row{position:relative;width:100%;display:flex;align-items:center;gap:14px;background:transparent;border:0;color:var(--text);padding:10px 16px;min-height:68px;text-align:left;cursor:pointer}\n.sc-profile .row:hover{background:rgba(255,255,255,.02)}\n.sc-profile .row.static{cursor:default}\n.sc-profile .row.static:hover{background:transparent}\n.sc-profile .row + .row::before{content:'';position:absolute;top:0;left:70px;right:0;height:1px;background:var(--line)}\n.sc-profile .row.nolead::before{left:16px!important}\n.sc-profile .row.tone{min-height:0;padding-top:0;padding-bottom:14px}\n.sc-profile .row.tone::before{display:none}\n.sc-profile .row.tone .seg{flex:1}\n.sc-profile .rt{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px}\n.sc-profile .rt b{font-size:15.5px;font-weight:600}\n.sc-profile .rt small{font-size:13px;color:var(--muted);line-height:1.4}\n.sc-profile .val{font-size:14px;color:var(--muted);margin-left:auto}\n.sc-profile .val + .chev{margin-left:0}\n.sc-profile .row.accent .rt b{color:var(--blue);font-weight:700}\n.sc-profile .ico{width:40px;height:40px;border-radius:12px;background:rgba(91,140,255,.14);color:var(--blue);display:grid;place-items:center;flex:none}\n.sc-profile .ico.blue{background:rgba(91,140,255,.2)}\n.sc-profile .ico.warn{background:rgba(255,180,84,.14);color:var(--amber)}\n.sc-profile .av{width:40px;height:40px;border-radius:50%;display:grid;place-items:center;font-weight:700;font-size:16px;background:hsl(var(--h,220) 38% 26%);color:#E6ECFA;flex:none}\n.sc-profile .av.lg{width:48px;height:48px;font-size:18px}\n.sc-profile .av.xl{width:56px;height:56px;font-size:19px;background:rgba(91,140,255,.18);color:var(--blue)}\n.sc-profile .av.big{width:72px;height:72px;font-size:24px}\n.sc-profile .stat{display:inline-flex;align-items:center;gap:6px;font-size:13px;color:var(--muted);flex:none}\n.sc-profile .stat i{width:8px;height:8px;border-radius:50%;background:var(--mint)}\n.sc-profile .stat.warn{color:var(--amber)}\n.sc-profile .stat.warn i{background:var(--amber)}\n.sc-profile .empty{margin:0;padding:18px 16px;font-size:14px;color:var(--muted);line-height:1.5}\n.sc-profile .empty-block{margin:28px 0 8px;text-align:center;font-size:14px;color:var(--muted);line-height:1.5}\n.sc-profile .logout{width:100%;min-height:52px;border-radius:14px;border:1px solid rgba(255,107,107,.4);background:transparent;color:var(--red);font-weight:700;font-size:15px;display:flex;align-items:center;justify-content:center;gap:8px;cursor:pointer}\n.sc-profile .nav{display:grid;grid-template-columns:repeat(3,1fr);border-top:1px solid var(--line);background:var(--panel);padding:6px 8px 10px}\n.sc-profile .nav button{background:transparent;border:0;color:var(--muted);font-size:12px;font-weight:600;display:flex;flex-direction:column;align-items:center;gap:3px;padding:6px 0;min-height:54px;cursor:pointer;border-radius:12px}\n.sc-profile .nav button[aria-current=page]{color:var(--blue)}\n.sc-profile /* forms */\n.field{display:flex;flex-direction:column;gap:6px;margin-top:14px;font-size:13px;font-weight:600;color:var(--muted)}\n.sc-profile .inp{background:var(--panel);border:1px solid var(--line);border-radius:12px;color:var(--text);font:inherit;font-size:15px;font-weight:400;padding:11px 14px;min-height:48px;width:100%;color-scheme:dark}\n.sc-profile textarea.inp{resize:none;line-height:1.5}\n.sc-profile .err{font-size:13px;font-weight:500;color:var(--amber)}\n.sc-profile .ph{display:flex;flex-direction:column;align-items:center;gap:12px;margin:8px 0 6px}\n.sc-profile .lab{font-size:13px;font-weight:600;color:var(--muted);margin:18px 0 8px}\n.sc-profile .note{font-size:14px;color:var(--muted);margin:12px 0 0;line-height:1.5}\n.sc-profile .danger-link{display:block;width:100%;margin-top:28px;background:transparent;border:0;color:var(--red);font-weight:600;font-size:15px;min-height:48px;cursor:pointer}\n.sc-profile .seg{display:flex;background:var(--night);border-radius:12px;padding:3px;gap:2px}\n.sc-profile .seg button{flex:1;border:0;background:transparent;color:var(--muted);font-size:13px;font-weight:600;padding:7px 8px;border-radius:9px;cursor:pointer;min-height:38px}\n.sc-profile .seg button[aria-pressed=true]{background:var(--panel2);color:var(--text)}\n.sc-profile .pad > .seg{background:var(--panel)}\n.sc-profile .sw{width:50px;height:30px;border-radius:999px;border:0;background:#334060;position:relative;cursor:pointer;flex:none;padding:0;transition:background .2s}\n.sc-profile .sw::after{content:'';position:absolute;top:3px;left:3px;width:24px;height:24px;border-radius:50%;background:#fff;transition:transform .2s}\n.sc-profile .sw[aria-checked=true]{background:var(--blue)}\n.sc-profile .sw[aria-checked=true]::after{transform:translateX(20px)}\n.sc-profile .chips{display:flex;flex-wrap:wrap;gap:8px}\n.sc-profile .chips.scroll{flex-wrap:nowrap;overflow-x:auto;margin:12px 0 14px;padding-bottom:2px}\n.sc-profile .chipb{flex:none;min-height:40px;padding:0 14px;border-radius:999px;border:1px solid var(--line);background:var(--panel);color:var(--muted);font-size:13.5px;font-weight:600;cursor:pointer}\n.sc-profile .chipb[aria-pressed=true]{border-color:var(--blue);background:rgba(91,140,255,.12);color:var(--text)}\n.sc-profile .btn2{border:1px solid var(--line);background:var(--panel2);color:var(--text);font-weight:600;font-size:14px;border-radius:12px;padding:0 16px;min-height:44px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px}\n.sc-profile .btn2.blue{background:var(--blue);border-color:var(--blue);color:#0B1020}\n.sc-profile .btn2.attach{margin-top:14px}\n.sc-profile .filechip{margin-top:14px;display:inline-flex;align-items:center;gap:8px;background:var(--panel2);border-radius:999px;padding:4px 4px 4px 12px;font-size:14px}\n.sc-profile .filechip button{border:0;background:transparent;color:var(--muted);width:32px;height:32px;border-radius:50%;display:grid;place-items:center;cursor:pointer}\n.sc-profile .text-link{display:block;margin-top:14px;background:transparent;border:0;color:var(--blue);font-weight:600;font-size:14.5px;min-height:44px;padding:0;cursor:pointer}\n.sc-profile .callout{display:flex;gap:12px;align-items:flex-start;background:rgba(91,140,255,.1);border-radius:16px;padding:14px;color:var(--blue);margin-top:10px}\n.sc-profile .callout p{margin:0;font-size:14px;line-height:1.5;color:#CBD7F5}\n.sc-profile .callout svg{flex:none;margin-top:1px}\n.sc-profile .callout.info{background:var(--panel);border:1px solid var(--line);color:var(--muted)}\n.sc-profile .link-danger{background:transparent;border:0;color:var(--red);font-weight:600;font-size:14px;min-height:44px;padding:0 4px;cursor:pointer;flex:none}\n.sc-profile .wide-btn{width:100%;margin-top:22px}\n.sc-profile .danger:disabled{opacity:.4;cursor:not-allowed}\n.sc-profile /* faq */\n.search{position:relative;margin-top:6px}\n.sc-profile .search svg{position:absolute;left:14px;top:50%;transform:translateY(-50%);color:var(--muted);pointer-events:none}\n.sc-profile .search .inp{padding-left:42px}\n.sc-profile .acc{background:var(--panel);border:1px solid var(--line);border-radius:20px;overflow:hidden}\n.sc-profile .qa + .qa{border-top:1px solid var(--line)}\n.sc-profile .q{width:100%;display:flex;align-items:center;gap:12px;text-align:left;background:transparent;border:0;color:var(--text);padding:14px 16px;min-height:58px;font-size:15px;font-weight:600;line-height:1.4;cursor:pointer}\n.sc-profile .q span{flex:1}\n.sc-profile .q svg{flex:none;color:var(--muted);transition:transform .2s}\n.sc-profile .q[aria-expanded=true] svg{transform:rotate(180deg)}\n.sc-profile .a{margin:0;padding:0 16px 16px;font-size:14.5px;line-height:1.6;color:#C4CCE0}\n.sc-profile .stuck{margin-top:22px;display:flex;align-items:center;justify-content:space-between;gap:12px;background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:12px 12px 12px 16px}\n.sc-profile .stuck p{margin:0;font-size:15px;font-weight:600}\n.sc-profile /* policy */\n.doc h2{font-size:16px;font-weight:700;margin:24px 0 6px}\n.sc-profile .doc p{margin:0;font-size:14.5px;line-height:1.65;color:#C4CCE0}\n.sc-profile .doc .callout p{font-size:14px;color:var(--muted)}\n.sc-profile .muted-line{margin:16px 0 0!important;font-size:13px!important;color:var(--muted)!important}\n.sc-profile /* add channel */\n.link-hero{display:flex;align-items:center;justify-content:center;gap:14px;margin:18px 0 24px;color:var(--muted)}\n.sc-profile .tile-y,.sc-profile .tile-ig{width:64px;height:64px;border-radius:20px;display:grid;place-items:center}\n.sc-profile .tile-y{background:var(--blue);color:#0B1020;font-weight:800;font-size:28px}\n.sc-profile .tile-ig{background:var(--panel2);border:1px solid var(--line);color:var(--text)}\n.sc-profile .c-title{margin:18px 0 0;font-size:21px;font-weight:700;letter-spacing:-.01em}\n.sc-profile .c-title.left{text-align:left;margin-top:0}\n.sc-profile .steps{list-style:none;margin:20px 0 6px;padding:0;display:flex;flex-direction:column;gap:14px}\n.sc-profile .steps li{display:flex;align-items:center;gap:12px;font-size:15px;line-height:1.4}\n.sc-profile .steps i{width:28px;height:28px;border-radius:50%;background:var(--panel2);color:var(--blue);font-style:normal;font-weight:700;font-size:13px;display:grid;place-items:center;flex:none}\n.sc-profile .spin{width:48px;height:48px;border-radius:50%;border:4px solid var(--line);border-top-color:var(--blue);animation:spin 1s linear infinite}\n@keyframes spin{to{transform:rotate(360deg)}}\n.sc-profile .big-check{width:68px;height:68px;border-radius:50%;background:rgba(79,216,160,.16);color:var(--mint);display:grid;place-items:center}\n.sc-profile .pill-ch{margin-top:20px;display:flex;align-items:center;gap:10px;background:var(--panel);border:1px solid var(--line);border-radius:999px;padding:6px 16px 6px 6px}\n.sc-profile .pill-ch b{font-size:15px}\n.sc-profile /* inbox */\n.inb{width:100%;display:flex;align-items:flex-start;gap:12px;background:transparent;border:0;color:var(--text);padding:14px 16px;text-align:left;cursor:pointer}\n.sc-profile .inb + .inb{border-top:1px solid var(--line)}\n.sc-profile .inb .rt b.read{color:var(--muted);font-weight:500}\n.sc-profile .when{display:flex;align-items:center;gap:6px;font-size:12.5px;color:var(--muted);flex:none;padding-top:2px}\n.sc-profile .ud{width:9px;height:9px;border-radius:50%;background:var(--blue)}\n.sc-profile /* footer + buttons */\n.ed-foot{border-top:1px solid var(--line);background:var(--panel);padding:12px 16px 14px;display:flex;flex-direction:column;gap:10px}\n.sc-profile .sum{margin:0;font-size:13.5px;line-height:1.5;color:#C9D1E6}\n.sc-profile .primary,.sc-profile .ghost,.sc-profile .danger{min-height:50px;border-radius:14px;font-weight:700;font-size:15px;padding:0 18px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px}\n.sc-profile .primary{background:var(--blue);color:#0B1020;border:0}\n.sc-profile .primary:disabled{background:var(--panel2);color:var(--muted);cursor:not-allowed}\n.sc-profile .ghost{background:transparent;border:1px solid var(--line);color:var(--text);font-weight:600}\n.sc-profile .danger{background:transparent;border:1px solid rgba(255,107,107,.4);color:var(--red)}\n.sc-profile .danger.solid{background:var(--red);border-color:var(--red);color:#2A0808}\n.sc-profile /* sheets */\n.scrim{position:absolute;inset:0;background:rgba(5,8,14,.62);display:flex;align-items:flex-end;z-index:5}\n.sc-profile .sheet{width:100%;max-height:88%;overflow-y:auto;background:var(--panel);border-radius:26px 26px 0 0;border-top:1px solid var(--line);padding:8px 16px 20px;animation:up .24s ease-out;box-shadow:0 -16px 40px rgba(0,0,0,.4)}\n@keyframes up{from{transform:translateY(40px);opacity:.4}to{transform:none;opacity:1}}\n.sc-profile .grab{width:40px;height:4px;border-radius:2px;background:var(--line);margin:4px auto 6px}\n.sc-profile .sh-head{display:flex;align-items:center;justify-content:space-between;gap:8px}\n.sc-profile .sh-head h2{margin:0;font-size:19px;font-weight:700}\n.sc-profile .sh-id{display:flex;align-items:center;gap:12px}\n.sc-profile .sh-id h2{margin-bottom:2px}\n.sc-profile .notice{margin:14px 0 0;padding:12px 14px;border-left:3px solid var(--amber);background:rgba(255,180,84,.08);border-radius:4px 12px 12px 4px;font-size:14px;line-height:1.5;color:#FFE3BC}\n.sc-profile .stack{display:flex;flex-direction:column;gap:8px;margin-top:18px}\n.sc-profile .mlist{display:flex;flex-direction:column;gap:6px;margin-top:12px}\n.sc-profile .mrow{display:flex;align-items:center;gap:10px;text-align:left;background:var(--night);border:1px solid var(--line);color:var(--text);border-radius:14px;padding:12px 14px;min-height:56px;font-size:15.5px;font-weight:600;cursor:pointer}\n.sc-profile .mrow > span{flex:1}\n.sc-profile .mrow[aria-pressed=true]{border-color:var(--blue);background:rgba(91,140,255,.12)}\n.sc-profile .mrow .tick{color:var(--blue);flex:none}\n.sc-profile .sheet .field .inp{background:var(--night)}\n.sc-profile .toast-wrap{position:absolute;left:0;right:0;bottom:90px;display:flex;justify-content:center;z-index:9;pointer-events:none}\n.sc-profile .toast{background:var(--panel2);border:1px solid var(--line);color:var(--text);font-weight:600;font-size:14px;padding:10px 16px;border-radius:999px;animation:up .2s ease-out}\n.sc-profile .chan-chip{display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:0 10px 0 6px;border-radius:999px;border:1px solid var(--line);background:var(--panel);color:var(--text);font-size:14px;font-weight:600;cursor:pointer;max-width:170px}\n.sc-profile .chan-chip .cname{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.sc-profile .chan-chip .chv{color:var(--muted);flex:none}\n.sc-profile .chan-chip.wide{width:100%;max-width:none;justify-content:flex-start;padding:8px 14px 8px 8px;min-height:58px;border-radius:16px;font-size:15.5px}\n.sc-profile .chan-chip.wide .cname{flex:1;text-align:left}\n.sc-profile .cav{width:32px;height:32px;border-radius:50%;display:grid;place-items:center;font-weight:700;font-size:14px;background:hsl(var(--h,220) 38% 26%);color:#E6ECFA;flex:none;position:relative}\n.sc-profile .cav.lg{width:40px;height:40px;font-size:16px}\n.sc-profile .cav .warn-dot{position:absolute;right:-1px;bottom:-1px;width:11px;height:11px;border-radius:50%;background:var(--amber);border:2px solid var(--panel)}\n.sc-profile .crow{width:100%;display:flex;align-items:center;gap:12px;text-align:left;background:var(--night);border:1px solid var(--line);color:var(--text);border-radius:14px;padding:10px 14px;min-height:64px;cursor:pointer;margin-top:8px}\n.sc-profile .crow[aria-pressed=true]{border-color:var(--blue);background:rgba(91,140,255,.12)}\n.sc-profile .crow .ct{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}\n.sc-profile .crow b{font-size:15.5px;font-weight:600}\n.sc-profile .crow small{font-size:13px;color:var(--muted)}\n.sc-profile .crow small.warn{color:var(--amber)}\n.sc-profile .crow .tick{color:var(--blue);flex:none}\n.sc-profile .crow.addc{border:1.5px dashed #3B486B;background:transparent;color:var(--blue);font-weight:700;justify-content:center;gap:8px}\n.sc-profile .sh-link{background:transparent;border:0;color:var(--blue);font-weight:600;font-size:14.5px;min-height:44px;cursor:pointer;padding:0 4px;margin-top:6px}\n.sc-profile .chan-banner{display:flex;align-items:center;gap:12px;margin:12px 16px 0;padding:12px 12px 12px 14px;border-left:3px solid var(--amber);background:rgba(255,180,84,.08);border-radius:4px 14px 14px 4px}\n.sc-profile .chan-banner.inline{margin:10px 0 0}\n.sc-profile .chan-banner p{margin:0;flex:1;font-size:13.5px;line-height:1.45;color:#FFE3BC}\n.sc-profile .chan-banner button{flex:none;min-height:40px;border-radius:12px;border:1px solid rgba(255,180,84,.5);background:transparent;color:var(--amber);font-weight:700;font-size:14px;padding:0 14px;cursor:pointer}\n.sc-profile .chan-field{margin-bottom:14px}\n.sc-profile .lab.first{margin-top:0}\n.sc-profile .row-hdr{display:flex;align-items:center;justify-content:space-between;gap:10px}\n.sc-profile .hdr-r{display:flex;align-items:center;gap:2px}\n.sc-profile .icon-btn.sm{width:40px;height:40px;border-radius:12px;color:var(--muted)}\n.sc-profile .scrim{position:absolute;inset:0;background:rgba(5,8,14,.62);display:flex;align-items:flex-end;z-index:5}\n.sc-profile .sheet{width:100%;max-height:88%;overflow-y:auto;background:var(--panel);border-radius:26px 26px 0 0;border-top:1px solid var(--line);padding:8px 16px 20px;animation:up .24s ease-out;box-shadow:0 -16px 40px rgba(0,0,0,.4)}\n.sc-profile .grab{width:40px;height:4px;border-radius:2px;background:var(--line);margin:4px auto 6px}\n.sc-profile .sh-head{display:flex;align-items:center;justify-content:space-between;gap:8px}\n.sc-profile .sh-head h2{margin:0;font-size:19px;font-weight:700}\n.sc-profile .sk{display:block;background:linear-gradient(90deg,var(--panel2) 0%,#27324C 50%,var(--panel2) 100%);background-size:200% 100%;animation:shimmer 1.4s ease-in-out infinite}\n.sc-profile .skcard{background:var(--panel);border:1px solid var(--line);border-radius:20px;padding:16px;display:flex;flex-direction:column;gap:12px}\n.sc-profile .skrow{display:flex;align-items:center;gap:12px}\n.sc-profile .errcard{display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px;padding:32px 20px;background:var(--panel);border:1px dashed #3B486B;border-radius:20px}\n.sc-profile .errcard .eico{width:52px;height:52px;border-radius:50%;background:rgba(255,180,84,.14);color:var(--amber);display:grid;place-items:center;margin-bottom:6px}\n.sc-profile .errcard h3{margin:0;font-size:17px}\n.sc-profile .errcard p{margin:0 0 10px;font-size:14px;line-height:1.5;color:var(--muted);max-width:280px}\n.sc-profile .errcard .retry{min-height:44px;border-radius:12px;border:1px solid var(--line);background:var(--panel2);color:var(--text);font-weight:700;font-size:14.5px;padding:0 18px;cursor:pointer;display:inline-flex;align-items:center;gap:8px}\n.sc-profile .bspin{width:18px;height:18px;border-radius:50%;border:2.5px solid rgba(11,16,32,.25);border-top-color:#0B1020;animation:spinr .8s linear infinite;flex:none}\n.sc-profile .inline-err{display:flex;align-items:flex-start;gap:8px;font-size:13.5px;line-height:1.45;color:var(--amber);margin:0}\n.sc-profile .inline-err svg{flex:none;margin-top:2px}\n.sc-profile .ubar{display:block;height:4px;border-radius:2px;background:var(--panel2);overflow:hidden;margin-top:6px}\n.sc-profile .ubar i{display:block;height:100%;width:0;background:var(--blue);animation:fillbar linear forwards}\n.sc-profile .fitem .rt small.bad{color:var(--amber)}\n.sc-profile .retry-link{background:transparent;border:0;color:var(--blue);font-weight:700;font-size:13.5px;min-height:40px;padding:0 8px;cursor:pointer}\n.sc-profile .primary .bspin{margin-right:2px}\n.sc-profile .metanote{display:flex;gap:8px;align-items:flex-start;font-size:13px;line-height:1.5;color:var(--muted);margin:14px 0 0}\n.sc-profile .metanote svg{flex:none;margin-top:2px;color:var(--blue)}\n.sc-profile .metanote.warn{color:#FFE3BC}\n.sc-profile .metanote.warn svg{color:var(--amber)}\n.sc-profile .chipset{display:flex;flex-wrap:wrap;gap:6px}\n.sc-profile .chipset button{min-height:40px;padding:0 14px;border-radius:999px;border:1px solid var(--line);background:var(--night);color:var(--muted);font-size:13.5px;font-weight:600;cursor:pointer}\n.sc-profile .chipset button[aria-pressed=true]{border-color:var(--blue);background:rgba(91,140,255,.12);color:var(--text)}\n.sc-profile .sw:disabled{opacity:.4;cursor:not-allowed}\n.sc-profile .stepper{padding-left:14px;padding-right:14px}\n.sc-profile .st{width:64px}\n.sc-profile .st span{font-size:11.5px}\n.sc-profile .card.auto.clickable,.sc-profile .card.msg.clickable{cursor:pointer}\n.sc-profile .row2{display:flex;align-items:center;justify-content:space-between;gap:8px}\n.sc-profile .text-btn{background:transparent;border:0;color:var(--blue);font-weight:600;font-size:14px;min-height:40px;padding:0 6px;cursor:pointer;display:inline-flex;align-items:center;gap:6px}\n.sc-profile .big-warn{width:68px;height:68px;border-radius:50%;background:rgba(255,180,84,.14);color:var(--amber);display:grid;place-items:center}\n";

return { Component: ProfileSection, SEED_CHANNELS };

})();

/* ═════════ DetailMod ═════════ */
const DetailMod = (() => {
const CSS = ".sc-detail .scr{flex:1;overflow-y:auto;overscroll-behavior:contain}\n.sc-detail .hdr{display:flex;align-items:center;justify-content:space-between;padding:14px 20px 8px}\n.sc-detail .brand{font-size:22px;font-weight:700;letter-spacing:-.02em}\n.sc-detail .icon-btn{width:44px;height:44px;border-radius:14px;background:transparent;border:0;color:var(--text);display:grid;place-items:center;position:relative;cursor:pointer;flex:none}\n.sc-detail .icon-btn.sm{width:40px;height:40px;border-radius:12px;color:var(--muted)}\n.sc-detail .dot{position:absolute;top:10px;right:11px;width:9px;height:9px;border-radius:50%;background:var(--blue);border:2px solid var(--night)}\n.sc-detail .body{padding:8px 16px 20px;display:flex;flex-direction:column;gap:22px}\n.sc-detail .card{background:var(--panel);border:1px solid var(--line);border-radius:20px;padding:16px}\n.sc-detail .row{display:flex;align-items:center}\n.sc-detail .between{justify-content:space-between}\n.sc-detail .muted{color:var(--muted)}\n.sc-detail .sm{font-size:13px}\n.sc-detail .hero-title{margin:0;font-size:15px;font-weight:600}\n.sc-detail .seg{display:inline-flex;background:var(--night);border-radius:12px;padding:3px;gap:2px}\n.sc-detail .seg.full{display:flex}\n.sc-detail .seg.full button{flex:1}\n.sc-detail .seg button{border:0;background:transparent;color:var(--muted);font-size:13px;font-weight:600;padding:7px 12px;border-radius:9px;cursor:pointer;min-height:34px}\n.sc-detail .seg button[aria-pressed=true]{background:var(--panel2);color:var(--text)}\n.sc-detail .big-row{display:flex;align-items:baseline;gap:10px;margin:20px 0 18px;flex-wrap:wrap}\n.sc-detail .big{font-size:54px;line-height:1;font-weight:700;letter-spacing:-.03em;font-variant-numeric:tabular-nums}\n.sc-detail .delta{display:inline-flex;align-items:center;gap:2px;font-size:13px;font-weight:700;padding:4px 9px 4px 6px;border-radius:999px;align-self:center}\n.sc-detail .delta.down{color:var(--red);background:rgba(255,107,107,.12)}\n.sc-detail .delta.up{color:var(--mint);background:rgba(79,216,160,.12)}\n.sc-detail .vs{font-size:13px;color:var(--muted);align-self:center}\n.sc-detail .bar{display:flex;gap:3px;height:12px;margin-bottom:16px}\n.sc-detail .bar span{border-radius:4px;min-width:6px;transition:width .35s}\n.sc-detail .legend{list-style:none;margin:0 0 16px;padding:0;display:grid;grid-template-columns:1fr 1fr;gap:10px 22px}\n.sc-detail .legend li{display:flex;align-items:center;gap:8px;font-size:14px}\n.sc-detail .legend i{width:10px;height:10px;border-radius:3px;flex:none}\n.sc-detail .legend b{margin-left:auto;font-variant-numeric:tabular-nums;font-weight:600}\n.sc-detail .skipped{width:100%;display:flex;align-items:center;gap:10px;background:rgba(255,180,84,.1);border:1px solid rgba(255,180,84,.28);color:var(--text);border-radius:14px;padding:12px;font-size:14px;cursor:pointer;text-align:left;min-height:48px}\n.sc-detail .skipped svg:first-child{color:var(--amber);flex:none}\n.sc-detail .skipped span{flex:1}\n.sc-detail .skipped b{color:var(--amber);font-variant-numeric:tabular-nums}\n.sc-detail .sec-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}\n.sc-detail .sec-head h2{margin:0;font-size:18px;font-weight:700}\n.sc-detail .primary{background:var(--blue);color:#0B1020;border:0;border-radius:14px;font-weight:700;font-size:15px;min-height:50px;padding:0 18px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px}\n.sc-detail .primary.sm{min-height:42px;padding:0 14px 0 12px;font-size:14px;border-radius:12px}\n.sc-detail .primary:disabled{background:var(--panel2);color:var(--muted);cursor:not-allowed}\n.sc-detail .auto{display:flex;flex-direction:column;gap:12px;margin-bottom:12px}\n.sc-detail .auto h3{margin:0;font-size:16px;font-weight:600}\n.sc-detail .auto p{margin:3px 0 0}\n.sc-detail .top{align-items:flex-start;gap:12px}\n.sc-detail .trigs{display:flex;flex-wrap:wrap;gap:6px}\n.sc-detail .tchip{display:inline-flex;align-items:center;gap:5px;font-size:12.5px;color:#C4CCE0;background:var(--panel2);border-radius:999px;padding:5px 10px 5px 8px}\n.sc-detail .cond{display:flex;flex-wrap:wrap;align-items:center;gap:6px;border-left:3px solid var(--amber);background:rgba(255,180,84,.07);border-radius:4px 12px 12px 4px;padding:9px 10px}\n.sc-detail .cond-l{font-size:12.5px;font-weight:700;color:var(--amber);margin-right:2px}\n.sc-detail .cchip{font-size:12.5px;background:rgba(255,180,84,.14);color:#FFD9A6;border-radius:999px;padding:3px 9px}\n.sc-detail .cond.empty{width:100%;border:1px dashed var(--line);border-left:3px solid var(--line);background:transparent;color:var(--muted);font-size:13.5px;text-align:left;cursor:pointer;min-height:44px;justify-content:space-between;flex-wrap:nowrap}\n.sc-detail .cond.empty .lnk{color:var(--amber);font-weight:600}\n.sc-detail .stats{display:grid;grid-template-columns:repeat(3,1fr);margin:0;padding-top:12px;border-top:1px solid var(--line)}\n.sc-detail .stats div{display:flex;flex-direction:column;gap:2px}\n.sc-detail .stats dt{order:2;font-size:12.5px;color:var(--muted)}\n.sc-detail .stats dd{margin:0;font-size:19px;font-weight:700;font-variant-numeric:tabular-nums}\n.sc-detail .auto.off h3,.sc-detail .auto.off .stats dd{color:var(--muted)}\n.sc-detail .more{width:100%;background:transparent;border:0;color:var(--blue);font-weight:600;font-size:15px;min-height:46px;cursor:pointer}\n.sc-detail .sw{width:50px;height:30px;border-radius:999px;border:0;background:#334060;position:relative;cursor:pointer;flex:none;padding:0;transition:background .2s}\n.sc-detail .sw::after{content:'';position:absolute;top:3px;left:3px;width:24px;height:24px;border-radius:50%;background:#fff;transition:transform .2s}\n.sc-detail .sw[aria-checked=true]{background:var(--mint)}\n.sc-detail .sw[aria-checked=true]::after{transform:translateX(20px)}\n.sc-detail .nav{display:grid;grid-template-columns:repeat(3,1fr);border-top:1px solid var(--line);background:var(--panel);padding:6px 8px 10px}\n.sc-detail .nav button{background:transparent;border:0;color:var(--muted);font-size:12px;font-weight:600;display:flex;flex-direction:column;align-items:center;gap:3px;padding:6px 0;min-height:54px;cursor:pointer;border-radius:12px}\n.sc-detail .nav button[aria-current=page]{color:var(--blue)}\n.sc-detail /* editor */\n.ed-top{display:flex;align-items:center;gap:4px;padding:10px 12px 6px}\n.sc-detail .ed-top h1{margin:0;font-size:19px;font-weight:700}\n.sc-detail .ed-scroll{padding:8px 16px 24px}\n.sc-detail .field{display:flex;flex-direction:column;gap:6px;margin-bottom:24px;font-size:13px;color:var(--muted)}\n.sc-detail .inp{background:var(--panel);border:1px solid var(--line);border-radius:12px;color:var(--text);font:inherit;font-size:15px;padding:12px 14px;min-height:48px;width:100%;color-scheme:dark}\n.sc-detail textarea.inp{resize:none;line-height:1.5;min-height:96px}\n.sc-detail .flow{list-style:none;margin:0;padding:0 0 0 26px}\n.sc-detail .step{position:relative;padding-bottom:28px}\n.sc-detail .step:last-child{padding-bottom:4px}\n.sc-detail .step::before{content:'';position:absolute;left:-20px;top:20px;bottom:-4px;width:2px;background:var(--line)}\n.sc-detail .step:last-child::before{display:none}\n.sc-detail .node{position:absolute;left:-27px;top:4px;width:16px;height:16px;border-radius:50%;background:var(--night);border:3px solid var(--c)}\n.sc-detail .step.blue{--c:var(--blue)}\n.sc-detail .step.amber{--c:var(--amber)}\n.sc-detail .step.mint{--c:var(--mint)}\n.sc-detail .step-h{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;min-height:32px}\n.sc-detail .step-h h3{margin:0;font-size:16px;font-weight:700}\n.sc-detail .hint,.sc-detail .note{font-size:13.5px;color:var(--muted);margin:0 0 12px;line-height:1.45}\n.sc-detail .note{margin:0}\n.sc-detail .note.warn{color:var(--amber)}\n.sc-detail .tgrid{display:grid;grid-template-columns:1fr 1fr;gap:8px}\n.sc-detail .tbtn{display:flex;align-items:center;gap:8px;background:var(--panel);border:1px solid var(--line);color:var(--muted);border-radius:14px;padding:0 12px;min-height:54px;font-size:14px;font-weight:600;cursor:pointer;text-align:left}\n.sc-detail .tbtn[aria-pressed=true]{border-color:var(--blue);background:rgba(91,140,255,.12);color:var(--text)}\n.sc-detail .tbtn .tick{margin-left:auto;color:var(--blue);flex:none}\n.sc-detail .ccard{background:var(--panel);border:1px solid var(--line);border-left:3px solid var(--amber);border-radius:6px 16px 16px 6px;padding:10px 12px 14px}\n.sc-detail .ccard.fresh{animation:pop 1s ease-out}\n@keyframes pop{0%{background:rgba(255,180,84,.3)}100%{background:var(--panel)}}\n.sc-detail .c-head{display:flex;align-items:center;gap:10px;margin-bottom:10px}\n.sc-detail .c-head b{flex:1;font-size:15px;font-weight:600}\n.sc-detail .c-ico{width:32px;height:32px;border-radius:10px;background:rgba(255,180,84,.14);color:var(--amber);display:grid;place-items:center;flex:none}\n.sc-detail .joiner{display:flex;justify-content:center;margin:8px 0}\n.sc-detail .joiner span{font-size:12px;font-weight:700;color:var(--amber);background:rgba(255,180,84,.12);padding:3px 14px;border-radius:999px}\n.sc-detail .add-cond{width:100%;min-height:54px;margin-top:12px;border:1.5px dashed rgba(255,180,84,.55);background:rgba(255,180,84,.06);color:var(--amber);border-radius:14px;font-weight:700;font-size:15px;display:flex;align-items:center;justify-content:center;gap:8px;cursor:pointer}\n.sc-detail .kw-list{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}\n.sc-detail .kw{display:inline-flex;align-items:center;gap:2px;background:var(--panel2);border-radius:999px;padding:3px 3px 3px 12px;font-size:14px}\n.sc-detail .kw button{border:0;background:transparent;color:var(--muted);width:30px;height:30px;border-radius:50%;display:grid;place-items:center;cursor:pointer}\n.sc-detail .kw-add{display:flex;gap:8px}\n.sc-detail .kw-add .inp{min-height:44px;padding:9px 12px;font-size:14px}\n.sc-detail .btn2{border:1px solid var(--line);background:var(--panel2);color:var(--text);font-weight:600;font-size:14px;border-radius:12px;padding:0 16px;min-height:44px;cursor:pointer}\n.sc-detail .btn2.pill{min-height:38px;border-radius:999px;padding:0 12px 0 10px;font-size:13px;display:inline-flex;align-items:center;gap:4px}\n.sc-detail .row-inline{display:flex;align-items:center;gap:10px}\n.sc-detail .time-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}\n.sc-detail .time-row label{display:flex;flex-direction:column;gap:5px;font-size:12.5px;color:var(--muted)}\n.sc-detail .pick7,.sc-detail .pick3{display:grid;gap:5px}\n.sc-detail .pick7{grid-template-columns:repeat(7,1fr)}\n.sc-detail .pick3{grid-template-columns:repeat(3,1fr)}\n.sc-detail .pick7 button,.sc-detail .pick3 button{min-height:44px;border-radius:10px;border:1px solid var(--line);background:var(--night);color:var(--muted);font-size:12.5px;font-weight:600;cursor:pointer;padding:0 2px}\n.sc-detail .pick7 button[aria-pressed=true],.sc-detail .pick3 button[aria-pressed=true]{background:rgba(255,180,84,.16);border-color:rgba(255,180,84,.6);color:#FFD9A6}\n.sc-detail .vars{display:flex;gap:6px;margin-top:8px;flex-wrap:wrap}\n.sc-detail .ed-foot{border-top:1px solid var(--line);background:var(--panel);padding:12px 16px 14px;display:flex;flex-direction:column;gap:10px}\n.sc-detail .sum{margin:0;font-size:13.5px;line-height:1.5;color:#C9D1E6;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}\n.sc-detail .sum.warn{color:var(--amber)}\n.sc-detail .scrim{position:absolute;inset:0;background:rgba(5,8,14,.62);display:flex;align-items:flex-end;z-index:5}\n.sc-detail .sheet{width:100%;max-height:86%;overflow-y:auto;background:var(--panel);border-radius:26px 26px 0 0;border-top:1px solid var(--line);padding:8px 16px 22px;animation:up .24s ease-out;box-shadow:0 -16px 40px rgba(0,0,0,.4)}\n@keyframes up{from{transform:translateY(40px);opacity:.4}to{transform:none;opacity:1}}\n.sc-detail .grab{width:40px;height:4px;border-radius:2px;background:var(--line);margin:4px auto 6px}\n.sc-detail .sh-head{display:flex;align-items:center;justify-content:space-between}\n.sc-detail .sh-head h2{margin:0;font-size:19px;font-weight:700}\n.sc-detail .gt{font-size:13px;font-weight:600;color:var(--muted);margin:18px 0 4px}\n.sc-detail .opt{width:100%;display:flex;align-items:center;gap:12px;background:transparent;border:0;border-radius:14px;padding:8px 6px;min-height:62px;color:var(--text);text-align:left;cursor:pointer}\n.sc-detail .opt:hover:not(:disabled){background:var(--panel2)}\n.sc-detail .opt:disabled{opacity:.5;cursor:default}\n.sc-detail .opt .c-ico{width:40px;height:40px;border-radius:12px}\n.sc-detail .opt .t{flex:1;display:flex;flex-direction:column;gap:2px}\n.sc-detail .opt b{font-size:15px;font-weight:600}\n.sc-detail .opt small{font-size:13px;color:var(--muted)}\n.sc-detail .opt .end{color:var(--muted);font-size:13px;display:flex;align-items:center;gap:4px}\n.sc-detail .toast-wrap{position:absolute;left:0;right:0;bottom:90px;display:flex;justify-content:center;z-index:9;pointer-events:none}\n.sc-detail .toast{background:var(--mint);color:#062015;font-weight:700;font-size:14px;padding:10px 16px;border-radius:999px;display:flex;gap:6px;align-items:center;animation:up .2s ease-out}\n.sc-detail .chan-chip{display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:0 10px 0 6px;border-radius:999px;border:1px solid var(--line);background:var(--panel);color:var(--text);font-size:14px;font-weight:600;cursor:pointer;max-width:170px}\n.sc-detail .chan-chip .cname{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.sc-detail .chan-chip .chv{color:var(--muted);flex:none}\n.sc-detail .chan-chip.wide{width:100%;max-width:none;justify-content:flex-start;padding:8px 14px 8px 8px;min-height:58px;border-radius:16px;font-size:15.5px}\n.sc-detail .chan-chip.wide .cname{flex:1;text-align:left}\n.sc-detail .cav{width:32px;height:32px;border-radius:50%;display:grid;place-items:center;font-weight:700;font-size:14px;background:hsl(var(--h,220) 38% 26%);color:#E6ECFA;flex:none;position:relative}\n.sc-detail .cav.lg{width:40px;height:40px;font-size:16px}\n.sc-detail .cav .warn-dot{position:absolute;right:-1px;bottom:-1px;width:11px;height:11px;border-radius:50%;background:var(--amber);border:2px solid var(--panel)}\n.sc-detail .crow{width:100%;display:flex;align-items:center;gap:12px;text-align:left;background:var(--night);border:1px solid var(--line);color:var(--text);border-radius:14px;padding:10px 14px;min-height:64px;cursor:pointer;margin-top:8px}\n.sc-detail .crow[aria-pressed=true]{border-color:var(--blue);background:rgba(91,140,255,.12)}\n.sc-detail .crow .ct{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}\n.sc-detail .crow b{font-size:15.5px;font-weight:600}\n.sc-detail .crow small{font-size:13px;color:var(--muted)}\n.sc-detail .crow small.warn{color:var(--amber)}\n.sc-detail .crow .tick{color:var(--blue);flex:none}\n.sc-detail .crow.addc{border:1.5px dashed #3B486B;background:transparent;color:var(--blue);font-weight:700;justify-content:center;gap:8px}\n.sc-detail .sh-link{background:transparent;border:0;color:var(--blue);font-weight:600;font-size:14.5px;min-height:44px;cursor:pointer;padding:0 4px;margin-top:6px}\n.sc-detail .chan-banner{display:flex;align-items:center;gap:12px;margin:12px 16px 0;padding:12px 12px 12px 14px;border-left:3px solid var(--amber);background:rgba(255,180,84,.08);border-radius:4px 14px 14px 4px}\n.sc-detail .chan-banner.inline{margin:10px 0 0}\n.sc-detail .chan-banner p{margin:0;flex:1;font-size:13.5px;line-height:1.45;color:#FFE3BC}\n.sc-detail .chan-banner button{flex:none;min-height:40px;border-radius:12px;border:1px solid rgba(255,180,84,.5);background:transparent;color:var(--amber);font-weight:700;font-size:14px;padding:0 14px;cursor:pointer}\n.sc-detail .chan-field{margin-bottom:14px}\n.sc-detail .lab.first{margin-top:0}\n.sc-detail .row-hdr{display:flex;align-items:center;justify-content:space-between;gap:10px}\n.sc-detail .hdr-r{display:flex;align-items:center;gap:2px}\n.sc-detail .icon-btn.sm{width:40px;height:40px;border-radius:12px;color:var(--muted)}\n.sc-detail .scrim{position:absolute;inset:0;background:rgba(5,8,14,.62);display:flex;align-items:flex-end;z-index:5}\n.sc-detail .sheet{width:100%;max-height:88%;overflow-y:auto;background:var(--panel);border-radius:26px 26px 0 0;border-top:1px solid var(--line);padding:8px 16px 20px;animation:up .24s ease-out;box-shadow:0 -16px 40px rgba(0,0,0,.4)}\n.sc-detail .grab{width:40px;height:4px;border-radius:2px;background:var(--line);margin:4px auto 6px}\n.sc-detail .sh-head{display:flex;align-items:center;justify-content:space-between;gap:8px}\n.sc-detail .sh-head h2{margin:0;font-size:19px;font-weight:700}\n.sc-detail .sk{display:block;background:linear-gradient(90deg,var(--panel2) 0%,#27324C 50%,var(--panel2) 100%);background-size:200% 100%;animation:shimmer 1.4s ease-in-out infinite}\n.sc-detail .skcard{background:var(--panel);border:1px solid var(--line);border-radius:20px;padding:16px;display:flex;flex-direction:column;gap:12px}\n.sc-detail .skrow{display:flex;align-items:center;gap:12px}\n.sc-detail .errcard{display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px;padding:32px 20px;background:var(--panel);border:1px dashed #3B486B;border-radius:20px}\n.sc-detail .errcard .eico{width:52px;height:52px;border-radius:50%;background:rgba(255,180,84,.14);color:var(--amber);display:grid;place-items:center;margin-bottom:6px}\n.sc-detail .errcard h3{margin:0;font-size:17px}\n.sc-detail .errcard p{margin:0 0 10px;font-size:14px;line-height:1.5;color:var(--muted);max-width:280px}\n.sc-detail .errcard .retry{min-height:44px;border-radius:12px;border:1px solid var(--line);background:var(--panel2);color:var(--text);font-weight:700;font-size:14.5px;padding:0 18px;cursor:pointer;display:inline-flex;align-items:center;gap:8px}\n.sc-detail .bspin{width:18px;height:18px;border-radius:50%;border:2.5px solid rgba(11,16,32,.25);border-top-color:#0B1020;animation:spinr .8s linear infinite;flex:none}\n.sc-detail .inline-err{display:flex;align-items:flex-start;gap:8px;font-size:13.5px;line-height:1.45;color:var(--amber);margin:0}\n.sc-detail .inline-err svg{flex:none;margin-top:2px}\n.sc-detail .ubar{display:block;height:4px;border-radius:2px;background:var(--panel2);overflow:hidden;margin-top:6px}\n.sc-detail .ubar i{display:block;height:100%;width:0;background:var(--blue);animation:fillbar linear forwards}\n.sc-detail .fitem .rt small.bad{color:var(--amber)}\n.sc-detail .retry-link{background:transparent;border:0;color:var(--blue);font-weight:700;font-size:13.5px;min-height:40px;padding:0 8px;cursor:pointer}\n.sc-detail .primary .bspin{margin-right:2px}\n.sc-detail .metanote{display:flex;gap:8px;align-items:flex-start;font-size:13px;line-height:1.5;color:var(--muted);margin:14px 0 0}\n.sc-detail .metanote svg{flex:none;margin-top:2px;color:var(--blue)}\n.sc-detail .metanote.warn{color:#FFE3BC}\n.sc-detail .metanote.warn svg{color:var(--amber)}\n.sc-detail .chipset{display:flex;flex-wrap:wrap;gap:6px}\n.sc-detail .chipset button{min-height:40px;padding:0 14px;border-radius:999px;border:1px solid var(--line);background:var(--night);color:var(--muted);font-size:13.5px;font-weight:600;cursor:pointer}\n.sc-detail .chipset button[aria-pressed=true]{border-color:var(--blue);background:rgba(91,140,255,.12);color:var(--text)}\n.sc-detail .sw:disabled{opacity:.4;cursor:not-allowed}\n.sc-detail .stepper{padding-left:14px;padding-right:14px}\n.sc-detail .st{width:64px}\n.sc-detail .st span{font-size:11.5px}\n.sc-detail .card.auto.clickable,.sc-detail .card.msg.clickable{cursor:pointer}\n.sc-detail .row2{display:flex;align-items:center;justify-content:space-between;gap:8px}\n.sc-detail .text-btn{background:transparent;border:0;color:var(--blue);font-weight:600;font-size:14px;min-height:40px;padding:0 6px;cursor:pointer;display:inline-flex;align-items:center;gap:6px}\n.sc-detail .big-warn{width:68px;height:68px;border-radius:50%;background:rgba(255,180,84,.14);color:var(--amber);display:grid;place-items:center}\n.sc-detail .dpad{padding:8px 16px 32px;display:flex;flex-direction:column;gap:12px}\n.sc-detail .dtitle{margin:0;flex:1;min-width:0;font-size:18px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.sc-detail .text-btn{background:transparent;border:0;color:var(--blue);font-weight:600;font-size:15px;min-height:44px;padding:0 10px;cursor:pointer}\n.sc-detail .text-danger{background:transparent;border:0;color:var(--red);font-weight:600;font-size:15px;min-height:48px;cursor:pointer}\n.sc-detail .chrow{display:flex;align-items:center;gap:12px;min-width:0}\n.sc-detail .chrow b{display:block;font-size:15.5px;font-weight:600}\n.sc-detail .chrow small{font-size:13px;color:var(--muted)}\n.sc-detail .state{display:flex;align-items:center;gap:10px;font-size:13px;font-weight:600;color:var(--muted);cursor:pointer;min-height:44px}\n.sc-detail .on .state{color:var(--mint)}\n.sc-detail .t3{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:14px}\n.sc-detail .t3 div{background:var(--night);border-radius:14px;padding:12px;min-width:0}\n.sc-detail .t3 b{display:block;font-size:22px;font-variant-numeric:tabular-nums}\n.sc-detail .t3 span{font-size:12.5px;color:var(--muted)}\n.sc-detail .dl{display:inline-block;margin-left:6px;font-size:12px;font-weight:700;padding:2px 7px;border-radius:999px;vertical-align:middle}\n.sc-detail .dl.up{color:var(--mint);background:rgba(79,216,160,.12)}\n.sc-detail .dl.down{color:var(--red);background:rgba(255,107,107,.12)}\n.sc-detail .bars{display:flex;align-items:flex-end;gap:3px;height:96px;margin-top:18px}\n.sc-detail .bars i{flex:1;background:var(--blue);border-radius:4px 4px 0 0;min-height:3px;opacity:.9}\n.sc-detail .blabels{display:flex;justify-content:space-between;font-size:11.5px;color:var(--muted);margin-top:6px}\n.sc-detail .fun{margin:12px 0 0;font-size:13.5px;color:var(--muted);line-height:1.5}\n.sc-detail .none{margin:8px 0 0;font-size:14px;color:var(--muted);line-height:1.5}\n.sc-detail .nsr{display:flex;justify-content:space-between;gap:12px;padding:10px 0;border-top:1px solid var(--line);font-size:14.5px}\n.sc-detail .nsr b{font-variant-numeric:tabular-nums}\n.sc-detail .ico{width:36px;height:36px;border-radius:11px;background:rgba(91,140,255,.14);color:var(--blue);display:grid;place-items:center;flex:none}\n.sc-detail .xrow{display:flex;gap:12px;align-items:flex-start;padding:12px 0;border-top:1px solid var(--line)}\n.sc-detail .xrow b{display:block;font-size:15px;font-weight:600}\n.sc-detail .xrow small{display:block;font-size:13px;color:var(--muted);line-height:1.45;margin-top:2px}\n.sc-detail .tlist{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px}\n.sc-detail .tlist li{display:flex;align-items:center;gap:10px;font-size:14.5px}\n.sc-detail .tlist svg{color:var(--blue);flex:none}\n.sc-detail .cond2{display:flex;flex-wrap:wrap;gap:6px}\n.sc-detail .mblock{display:flex;gap:12px;align-items:flex-start}\n.sc-detail .mblock b{display:block;font-size:15px;font-weight:600}\n.sc-detail .mblock small{display:block;font-size:13px;color:var(--muted);line-height:1.45;margin-top:2px}\n.sc-detail .act{display:flex;gap:12px;align-items:flex-start;padding:12px 0;border-top:1px solid var(--line)}\n.sc-detail .act .who{flex:1;min-width:0}\n.sc-detail .act b{font-size:14.5px;font-weight:600}\n.sc-detail .act small{display:block;font-size:13px;color:var(--muted);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.sc-detail .dchip{flex:none;font-size:12px;font-weight:700;padding:4px 9px;border-radius:999px}\n.sc-detail .dchip.sent{color:var(--mint);background:rgba(79,216,160,.12)}\n.sc-detail .dchip.no{color:var(--amber);background:rgba(255,180,84,.12)}\n.sc-detail .dchip.test{color:var(--blue);background:rgba(91,140,255,.14)}\n.sc-detail .mlist{display:flex;flex-direction:column;gap:6px;margin-top:12px}\n.sc-detail .mrow{display:flex;align-items:center;gap:12px;text-align:left;background:var(--night);border:1px solid var(--line);color:var(--text);border-radius:14px;padding:12px 14px;min-height:56px;font-size:15.5px;font-weight:600;cursor:pointer}\n.sc-detail .mrow span{flex:1}\n.sc-detail .mrow svg{color:var(--muted)}\n.sc-detail .mrow.del,.sc-detail .mrow.del svg{color:var(--red)}\n.sc-detail .stack{display:flex;flex-direction:column;gap:8px;margin-top:18px}\n.sc-detail .ghost,.sc-detail .danger{min-height:50px;border-radius:14px;font-weight:700;font-size:15px;padding:0 18px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px}\n.sc-detail .ghost{background:transparent;border:1px solid var(--line);color:var(--text);font-weight:600}\n.sc-detail .danger{background:transparent;border:1px solid rgba(255,107,107,.4);color:var(--red)}\n.sc-detail .danger.solid{background:var(--red);border-color:var(--red);color:#2A0808}\n.sc-detail .btn2{border:1px solid var(--line);background:var(--panel2);color:var(--text);font-weight:600;font-size:14.5px;border-radius:14px;padding:0 16px;min-height:48px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;width:100%}\n.sc-detail .notep{margin:0;font-size:14px;line-height:1.5;color:var(--muted)}\n.sc-detail .tsteps{list-style:none;margin:14px 0 0;padding:0;display:flex;flex-direction:column;gap:12px}\n.sc-detail .tsteps li{display:flex;gap:12px;align-items:flex-start;font-size:14.5px;line-height:1.5}\n.sc-detail .tsteps i{width:26px;height:26px;border-radius:50%;background:var(--panel2);color:var(--blue);font-style:normal;font-weight:700;font-size:13px;display:grid;place-items:center;flex:none}\n.sc-detail .tcenter{display:flex;flex-direction:column;align-items:center;text-align:center;padding:14px 0 4px}\n.sc-detail .tcenter h3{margin:14px 0 4px;font-size:18px}\n.sc-detail .tcenter p{margin:0 0 10px;font-size:14px;color:var(--muted);line-height:1.5}\n.sc-detail .bigdot{width:56px;height:56px;border-radius:50%;display:grid;place-items:center}\n.sc-detail .bigdot.ok{background:rgba(79,216,160,.16);color:var(--mint)}\n.sc-detail .bigdot.warn{background:rgba(255,180,84,.14);color:var(--amber)}\n.sc-detail .tspin{width:44px;height:44px;border-radius:50%;border:4px solid var(--line);border-top-color:var(--blue);animation:spinr 1s linear infinite}\n.sc-detail .dchip-wrap{display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex:none}\n.sc-detail .tm{font-size:12px;color:var(--muted)}\n.sc-detail .aname{margin:0 0 12px;font-size:20px;font-weight:700;letter-spacing:-.01em;line-height:1.3;overflow-wrap:anywhere}\n.sc-detail .seg{display:flex}\n.sc-detail .seg button{flex:1;white-space:nowrap}\n.sc-detail .card.auto.clickable{cursor:pointer}\n";

const TR = {
  direct: { label: "Direct message", icon: Send },
  story: { label: "Story reply", icon: Reply },
  share: { label: "Media share", icon: Share2 },
  comment: { label: "Comment", icon: MessageCircle },
};
const MT = {
  generic: { label: "Generic", icon: Layers },
  text: { label: "Text", icon: Type },
  media: { label: "Media", icon: ImageIcon },
  button: { label: "Button & text", icon: MousePointerClick },
  quick: { label: "Quick reply", icon: Zap },
};
const XT = {
  follow: { title: "Follow prompt", icon: UserPlus },
  reminder: { title: "Reminder", icon: Bell },
  limit: { title: "Reply limit", icon: Hourglass },
  comment: { title: "Public comment reply", icon: Reply },
  like: { title: "Like their message", icon: Heart },
  notice: { title: "Automated notice", icon: Bot },
  handoff: { title: "Talk to a human", icon: Headphones },
};
const RANGE_OPTS = [{ v: "7", l: "7 days" }, { v: "30", l: "30 days" }, { v: "all", l: "All time" }];
const SCALE = { 7: 0.35, 30: 0.8, all: 1 };
const REASONS = [
  { k: "c", t: "Conditions didn’t match" },
  { k: "w", t: "24-hour window closed" },
  { k: "d", t: "Already replied to that comment" },
  { k: "l", t: "Waiting for Instagram’s limit" },
];
const USERS = [["sara_k", 215], ["nima.design", 165], ["the.shop", 30], ["leila_m", 340], ["arash_r", 280]];
const SNIPPETS = ["price?", "How much is this?", "link please", "Hi!", "Do you ship abroad?"];

function series(id, n, total) {
  let s = (id * 9301 + n * 49297) % 233280;
  const w = Array.from({ length: n }, () => {
    s = (s * 9301 + 49297) % 233280;
    return 0.4 + s / 233280;
  });
  const sum = w.reduce((x, y) => x + y, 0);
  const v = w.map((x) => Math.floor((total * x) / sum));
  v[n - 1] += total - v.reduce((x, y) => x + y, 0);
  return v;
}

function configOf(a, msgs) {
  const c = a.config || {};
  const msg = c.msgId ? msgs.find((m) => m.id === c.msgId) : null;
  const type = msg ? msg.type : a.types[0];
  return {
    scope: c.scope || {},
    picks: c.picks || {},
    msg,
    msgType: type,
    msgName: msg ? msg.name : type ? `${MT[type].label} message` : "",
    msgPreview: msg ? msg.preview : "",
    ex: c.extras || {},
  };
}

function extraLine(k, ex) {
  switch (k) {
    case "follow":
      return ex.follow && ex.follow.btn ? `Asks them to follow first. Button: “${ex.follow.btn}”.` : "Asks them to follow first.";
    case "reminder":
      return `Sent ${ex.reminderH || 3} ${(ex.reminderH || 3) === 1 ? "hour" : "hours"} later if they don’t reply.`;
    case "limit":
      return `Stops after ${ex.limitN || 3} ${(ex.limitN || 3) === 1 ? "reply" : "replies"}.`;
    case "comment":
      return "Also answers publicly under the comment.";
    case "like":
      return "Likes their message.";
    case "notice":
      return `“${ex.notice || "This is an automated reply."}”`;
    case "handoff":
      return `“${ex.handoffLabel || "Talk to a human"}” button. Pauses automations for ${ex.pauseD || 1} ${(ex.pauseD || 1) === 1 ? "day" : "days"}.`;
    default:
      return "";
  }
}

function activityFor(a) {
  if (!a.stats[0]) return [];
  const trig = a.triggers.length ? a.triggers : ["direct"];
  const plan = ["sent", "sent", "w", "sent", trig.includes("comment") ? "d" : "c"];
  const times = ["2m", "14m", "1h", "2h", "5h"];
  return plan.map((st, i) => ({
    id: "s" + i,
    user: USERS[i][0],
    hue: USERS[i][1],
    trig: trig[i % trig.length],
    text: SNIPPETS[i],
    st,
    time: times[i],
  }));
}

function Switch({ on, onChange, label }) {
  return <button type="button" role="switch" aria-checked={on} aria-label={label} className="sw" onClick={onChange} />;
}

function Seg({ options, value, onChange, label }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.v} type="button" aria-pressed={value === o.v} onClick={() => onChange(o.v)}>{o.l}</button>
      ))}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="dpad" role="status" aria-busy="true" aria-label="Loading">
      <div className="skcard"><div className="skrow"><Skeleton h={32} w={32} r={16} /><Skeleton h={16} w="40%" /><span style={{ flex: 1 }} /><Skeleton h={28} w={80} r={14} /></div></div>
      <div className="skcard">
        <div className="skrow"><Skeleton h={18} w={110} /><span style={{ flex: 1 }} /><Skeleton h={34} w={160} r={12} /></div>
        <div className="skrow"><Skeleton h={64} w="31%" r={14} /><Skeleton h={64} w="31%" r={14} /><Skeleton h={64} w="31%" r={14} /></div>
        <Skeleton h={96} r={8} />
      </div>
      <div className="skcard"><Skeleton h={18} w={120} /><Skeleton h={14} w="70%" /><Skeleton h={14} w="55%" /><Skeleton h={14} w="65%" /></div>
    </div>
  );
}

function DetailScreen(props) {
  const { a, channel, msgs } = props;
  const nav = useContext(NavCtx);
  const net = useContext(NetCtx);
  const [ld, retryLoad] = useLoad("detail|" + a.id, 700);
  const [range, setRange] = useState("7");
  const [sheet, setSheet] = useState(null);
  const [test, setTest] = useState({ phase: "idle" });
  const [tests, setTests] = useState([]);
  const tok = useRef(0);

  const cfg = configOf(a, msgs);
  const sc = SCALE[range];
  const sends = Math.round(a.stats[0] * sc);
  const clicks = Math.round(a.stats[1] * sc);
  const follows = a.stats[2] == null ? null : Math.round(a.stats[2] * sc);
  const n = range === "7" ? 7 : range === "30" ? 30 : 12;
  const bars = useMemo(() => series(a.id, n, sends), [a.id, n, sends]);
  const max = Math.max(1, ...bars);
  const delta = sends > 0 ? ((a.id * 7) % 31) - 9 : 0;
  const hasComment = a.triggers.includes("comment");
  const ns = { c: Math.round(sends * 0.17), w: Math.round(sends * 0.03), d: hasComment ? Math.round(sends * 0.04) : 0, l: 0 };
  const nsTotal = ns.c + ns.w + ns.d + ns.l;
  const feed = [...tests, ...activityFor(a)];
  const labels = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toLocaleDateString("en-US", { weekday: "narrow" });
  });
  const ruleHint = a.conds.length ? a.conds[0] : "any message";

  const scopeText = (k) => {
    if (cfg.scope[k] === "selected") {
      const c = (cfg.picks[k] || []).length;
      const noun = k === "story" ? (c === 1 ? "story" : "stories") : c === 1 ? "post" : "posts";
      return ` on ${c} selected ${noun}`;
    }
    return "";
  };

  const startTest = () => {
    const my = ++tok.current;
    setTest({ phase: "listening" });
    net.call(2500).then(
      () => {
        if (tok.current !== my) return;
        setTests((l) => [{ id: "t" + my, user: "you (test)", hue: 215, trig: a.triggers[0] || "direct", text: "Test message", st: "test", time: "now" }, ...l]);
        setTest({ phase: "done" });
      },
      (e) => {
        if (tok.current === my) setTest({ phase: "error", err: e });
      }
    );
  };
  const closeSheet = () => {
    tok.current++;
    setSheet(null);
    setTest({ phase: "idle" });
  };

  return (
    <div className={"sc-detail screen" + (a.on ? " on" : "")}>
      <style>{CSS}</style>

      <div className="ed-top">
        <button type="button" className="icon-btn" aria-label="Back" onClick={props.onBack}><ChevronLeft size={26} /></button>
        <h1 className="dtitle">Automation</h1>
        <button type="button" className="text-btn" onClick={props.onEdit}>Edit</button>
        <button type="button" className="icon-btn sm" aria-label="More actions" onClick={() => setSheet("menu")}><MoreVertical size={20} /></button>
      </div>

      <div className="scr">
        {ld.status === "loading" && <DetailSkeleton />}
        {ld.status === "error" && (
          <div className="dpad"><LoadError err={ld.err} onRetry={retryLoad} what="this automation" /></div>
        )}
        {ld.status === "ready" && (
          <div className="dpad">
            {channel && channel.status !== "ok" && (
              <ChannelBanner ch={channel} inline onFix={() => nav("profile", { view: "profile", openChannel: channel.id })} />
            )}

            <section className="card">
              <h2 className="aname" dir="auto">{a.name}</h2>
              <div className="row between">
                <div className="chrow">
                  {channel && <ChannelAvatar ch={channel} />}
                  <div>
                    <b>{channel ? channel.name : "No channel"}</b>
                    <small>Updated {a.when}</small>
                  </div>
                </div>
                <label className="state">
                  {a.on ? "Active" : "Paused"}
                  <Switch on={a.on} onChange={() => props.onToggle(a.id)} label={`${a.name}: turn ${a.on ? "off" : "on"}`} />
                </label>
              </div>
            </section>

            <section className="card">
              <h2 className="hero-title" style={{ marginBottom: 12 }}>Performance</h2>
              <Seg label="Time range" value={range} onChange={setRange} options={RANGE_OPTS} />
              <div className="t3">
                <div><b>{sends.toLocaleString("en-US")}{sends > 0 && <span className={"dl " + (delta < 0 ? "down" : "up")}>{delta < 0 ? "" : "+"}{delta}%</span>}</b><span>Sends</span></div>
                <div><b>{clicks.toLocaleString("en-US")}</b><span>Clicks</span></div>
                <div><b>{follows == null ? "–" : follows.toLocaleString("en-US")}</b><span>Follows</span></div>
              </div>
              {sends > 0 ? (
                <>
                  <div className="bars" role="img" aria-label="Sends over time">
                    {bars.map((v, i) => <i key={i} style={{ height: Math.max(3, (v / max) * 100) + "%" }} />)}
                  </div>
                  <div className="blabels">
                    {range === "7" ? labels.map((l, i) => <span key={i}>{l}</span>) : [<span key="a">{range === "30" ? "30 days ago" : "12 weeks ago"}</span>, <span key="b">Today</span>]}
                  </div>
                  <p className="fun">
                    {Math.round((clicks / Math.max(1, sends)) * 100)}% of people clicked
                    {follows != null ? `, and ${Math.round((follows / Math.max(1, clicks)) * 100)}% of those followed.` : "."}
                  </p>
                </>
              ) : (
                <p className="none">No activity yet. Send a test to see how it works.</p>
              )}
            </section>

            {nsTotal > 0 && (
              <section className="card">
                <div className="row between">
                  <h2 className="hero-title">Not sent</h2>
                  <b>{nsTotal.toLocaleString("en-US")}</b>
                </div>
                <div style={{ marginTop: 8 }}>
                  {REASONS.filter((r) => ns[r.k] > 0).map((r) => (
                    <div className="nsr" key={r.k}><span>{r.t}</span><b>{ns[r.k].toLocaleString("en-US")}</b></div>
                  ))}
                </div>
              </section>
            )}

            <section className="card">
              <h2 className="hero-title">How it works</h2>
              <ol className="flow" style={{ marginTop: 14 }}>
                <li className="step blue">
                  <span className="node" />
                  <div className="step-h"><h3>When</h3></div>
                  {a.triggers.length ? (
                    <ul className="tlist">
                      {a.triggers.map((k) => {
                        const t = TR[k];
                        return <li key={k}><t.icon size={16} /><span>{t.label}{scopeText(k)}</span></li>;
                      })}
                    </ul>
                  ) : (
                    <p className="none">No triggers yet.</p>
                  )}
                </li>
                <li className="step amber">
                  <span className="node" />
                  <div className="step-h"><h3>Only if</h3></div>
                  {a.conds.length ? (
                    <div className="cond2">{a.conds.map((c, i) => <span className="cchip" key={i} dir="auto">{c}</span>)}</div>
                  ) : (
                    <p className="none">Everyone who triggers it gets a reply.</p>
                  )}
                </li>
                <li className="step mint">
                  <span className="node" />
                  <div className="step-h"><h3>Then send</h3></div>
                  {cfg.msgType ? (
                    <div className="mblock">
                      <span className="ico">{(() => { const T = MT[cfg.msgType]; return <T.icon size={18} />; })()}</span>
                      <div>
                        <b dir="auto">{cfg.msgName}</b>
                        <small dir="auto">{MT[cfg.msgType].label}{cfg.msgPreview ? `: ${cfg.msgPreview}` : ""}</small>
                      </div>
                    </div>
                  ) : (
                    <p className="none">No message chosen.</p>
                  )}
                </li>
              </ol>
            </section>

            {a.extras.filter((k) => XT[k]).length > 0 && (
              <section className="card">
                <h2 className="hero-title">Extras</h2>
                <div style={{ marginTop: 8 }}>
                  {a.extras.filter((k) => XT[k]).map((k) => {
                    const x = XT[k];
                    return (
                      <div className="xrow" key={k}>
                        <span className="ico"><x.icon size={18} /></span>
                        <div><b>{x.title}</b><small dir="auto">{extraLine(k, cfg.ex)}</small></div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {(hasComment || a.triggers.includes("share") || a.extras.includes("reminder")) && (
              <section className="card">
                <h2 className="hero-title">Good to know</h2>
                {hasComment && <p className="metanote" style={{ marginTop: 12 }}><Info size={16} /><span>Comments get one private reply per commenter, within 7 days. For live videos, only while the broadcast is on.</span></p>}
                {a.triggers.includes("share") && <p className="metanote"><Info size={16} /><span>Instagram sends only a link to a shared post, so matching specific posts depends on that link.</span></p>}
                {a.extras.includes("reminder") && <p className="metanote"><Info size={16} /><span>Reminders go out at most 23 hours after the person’s last message.</span></p>}
              </section>
            )}

            <section className="card">
              <div className="row between">
                <h2 className="hero-title">Recent activity</h2>
                {feed.length > 0 && <button type="button" className="text-btn" onClick={() => props.onLog({ autoId: a.id })}>View all</button>}
              </div>
              {feed.length === 0 ? (
                <p className="none">Nothing yet. Activity shows up here after the first reply.</p>
              ) : (
                <div style={{ marginTop: 8 }}>
                  {feed.map((f) => {
                    const t = TR[f.trig];
                    return (
                      <div className="act" key={f.id}>
                        <span className="cav" style={{ "--h": f.hue }} aria-hidden="true">{f.user[0].toUpperCase()}</span>
                        <div className="who">
                          <b dir="auto">@{f.user}</b>
                          <small dir="auto">{t.label}: “{f.text}”</small>
                        </div>
                        <span className="dchip-wrap">
                          <span className={"dchip " + (f.st === "sent" ? "sent" : f.st === "test" ? "test" : "no")}>
                            {f.st === "sent" ? "Sent" : f.st === "test" ? "Test" : f.st === "w" ? "Window closed" : f.st === "d" ? "Already replied" : "No match"}
                          </span>
                          <small className="tm">{f.time}</small>
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <button type="button" className="btn2" onClick={() => setSheet("test")}><Send size={16} /> Send a test</button>
            <button type="button" className="text-danger" onClick={() => setSheet("delete")}>Delete automation</button>
          </div>
        )}
      </div>

      {sheet === "menu" && (
        <div className="scrim" onClick={closeSheet}>
          <div className="sheet" role="dialog" aria-modal="true" aria-label="Actions" onClick={(e) => e.stopPropagation()}>
            <div className="grab" />
            <div className="sh-head"><h2>{a.name}</h2><button type="button" className="icon-btn sm" aria-label="Close" onClick={closeSheet}><X size={20} /></button></div>
            <div className="mlist">
              <button type="button" className="mrow" onClick={() => { closeSheet(); props.onEdit(); }}><Pencil size={20} /><span>Edit</span></button>
              <button type="button" className="mrow" onClick={() => { closeSheet(); props.onDuplicate(); }}><Copy size={20} /><span>Duplicate</span></button>
              <button type="button" className="mrow del" onClick={() => setSheet("delete")}><Trash2 size={20} /><span>Delete</span></button>
            </div>
          </div>
        </div>
      )}

      {sheet === "delete" && (
        <div className="scrim" onClick={closeSheet}>
          <div className="sheet" role="dialog" aria-modal="true" aria-label="Delete automation" onClick={(e) => e.stopPropagation()}>
            <div className="grab" />
            <div className="sh-head"><h2>Delete “{a.name}”?</h2><button type="button" className="icon-btn sm" aria-label="Close" onClick={closeSheet}><X size={20} /></button></div>
            <p className="notep" style={{ marginTop: 12 }}>It stops replying right away. This can’t be undone.</p>
            <div className="stack">
              <button type="button" className="danger solid" onClick={() => { closeSheet(); props.onDelete(); }}>Delete</button>
              <button type="button" className="ghost" onClick={closeSheet}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {sheet === "test" && (
        <div className="scrim" onClick={closeSheet}>
          <div className="sheet" role="dialog" aria-modal="true" aria-label="Send a test" onClick={(e) => e.stopPropagation()}>
            <div className="grab" />
            <div className="sh-head"><h2>Test this automation</h2><button type="button" className="icon-btn sm" aria-label="Close" onClick={closeSheet}><X size={20} /></button></div>

            {test.phase === "idle" && (
              <>
                <ol className="tsteps">
                  <li><i>1</i><span>From another Instagram account, send a message to {channel ? channel.name : "your account"}.</span></li>
                  <li><i>2</i><span dir="auto">Make it match: {ruleHint}.</span></li>
                  <li><i>3</i><span>The reply should arrive within a few seconds.</span></li>
                </ol>
                <p className="metanote"><Info size={16} /><span>Instagram lets us reply only after someone messages you, so we can’t send a test on our own.</span></p>
                <div className="stack"><button type="button" className="primary" onClick={startTest}>Start listening</button></div>
              </>
            )}
            {test.phase === "listening" && (
              <div className="tcenter">
                <span className="tspin" aria-hidden="true" />
                <h3>Waiting for a message…</h3>
                <p>Send it to {channel ? channel.name : "your account"} now.</p>
                <button type="button" className="ghost" style={{ width: "100%" }} onClick={() => { tok.current++; setTest({ phase: "idle" }); }}>Cancel</button>
              </div>
            )}
            {test.phase === "done" && (
              <div className="tcenter">
                <span className="bigdot ok"><Check size={28} strokeWidth={3} /></span>
                <h3>Reply sent</h3>
                <p dir="auto">{cfg.msgName ? `“${cfg.msgName}” went out.` : "The reply went out."} It’s in Recent activity.</p>
                <button type="button" className="primary" style={{ width: "100%" }} onClick={closeSheet}>Done</button>
              </div>
            )}
            {test.phase === "error" && (
              <div className="tcenter">
                <span className="bigdot warn"><AlertTriangle size={28} /></span>
                <h3>{test.err && test.err.kind === "offline" ? "You’re offline" : "Couldn’t run the test"}</h3>
                <p>{test.err && test.err.kind === "offline" ? "Check your connection, then try again." : "Something went wrong. Try again in a moment."}</p>
                <button type="button" className="primary" style={{ width: "100%" }} onClick={startTest}>Try again</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

return { Component: DetailScreen };

})();

/* ═════════ LogMod ═════════ */
const LogMod = (() => {
const CSS = ".sc-log .scr{flex:1;overflow-y:auto;overscroll-behavior:contain}\n.sc-log .hdr{display:flex;align-items:center;justify-content:space-between;padding:14px 20px 8px}\n.sc-log .brand{font-size:22px;font-weight:700;letter-spacing:-.02em}\n.sc-log .icon-btn{width:44px;height:44px;border-radius:14px;background:transparent;border:0;color:var(--text);display:grid;place-items:center;position:relative;cursor:pointer;flex:none}\n.sc-log .icon-btn.sm{width:40px;height:40px;border-radius:12px;color:var(--muted)}\n.sc-log .dot{position:absolute;top:10px;right:11px;width:9px;height:9px;border-radius:50%;background:var(--blue);border:2px solid var(--night)}\n.sc-log .body{padding:8px 16px 20px;display:flex;flex-direction:column;gap:22px}\n.sc-log .card{background:var(--panel);border:1px solid var(--line);border-radius:20px;padding:16px}\n.sc-log .row{display:flex;align-items:center}\n.sc-log .between{justify-content:space-between}\n.sc-log .muted{color:var(--muted)}\n.sc-log .sm{font-size:13px}\n.sc-log .hero-title{margin:0;font-size:15px;font-weight:600}\n.sc-log .seg{display:inline-flex;background:var(--night);border-radius:12px;padding:3px;gap:2px}\n.sc-log .seg.full{display:flex}\n.sc-log .seg.full button{flex:1}\n.sc-log .seg button{border:0;background:transparent;color:var(--muted);font-size:13px;font-weight:600;padding:7px 12px;border-radius:9px;cursor:pointer;min-height:34px}\n.sc-log .seg button[aria-pressed=true]{background:var(--panel2);color:var(--text)}\n.sc-log .big-row{display:flex;align-items:baseline;gap:10px;margin:20px 0 18px;flex-wrap:wrap}\n.sc-log .big{font-size:54px;line-height:1;font-weight:700;letter-spacing:-.03em;font-variant-numeric:tabular-nums}\n.sc-log .delta{display:inline-flex;align-items:center;gap:2px;font-size:13px;font-weight:700;padding:4px 9px 4px 6px;border-radius:999px;align-self:center}\n.sc-log .delta.down{color:var(--red);background:rgba(255,107,107,.12)}\n.sc-log .delta.up{color:var(--mint);background:rgba(79,216,160,.12)}\n.sc-log .vs{font-size:13px;color:var(--muted);align-self:center}\n.sc-log .bar{display:flex;gap:3px;height:12px;margin-bottom:16px}\n.sc-log .bar span{border-radius:4px;min-width:6px;transition:width .35s}\n.sc-log .legend{list-style:none;margin:0 0 16px;padding:0;display:grid;grid-template-columns:1fr 1fr;gap:10px 22px}\n.sc-log .legend li{display:flex;align-items:center;gap:8px;font-size:14px}\n.sc-log .legend i{width:10px;height:10px;border-radius:3px;flex:none}\n.sc-log .legend b{margin-left:auto;font-variant-numeric:tabular-nums;font-weight:600}\n.sc-log .skipped{width:100%;display:flex;align-items:center;gap:10px;background:rgba(255,180,84,.1);border:1px solid rgba(255,180,84,.28);color:var(--text);border-radius:14px;padding:12px;font-size:14px;cursor:pointer;text-align:left;min-height:48px}\n.sc-log .skipped svg:first-child{color:var(--amber);flex:none}\n.sc-log .skipped span{flex:1}\n.sc-log .skipped b{color:var(--amber);font-variant-numeric:tabular-nums}\n.sc-log .sec-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}\n.sc-log .sec-head h2{margin:0;font-size:18px;font-weight:700}\n.sc-log .primary{background:var(--blue);color:#0B1020;border:0;border-radius:14px;font-weight:700;font-size:15px;min-height:50px;padding:0 18px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px}\n.sc-log .primary.sm{min-height:42px;padding:0 14px 0 12px;font-size:14px;border-radius:12px}\n.sc-log .primary:disabled{background:var(--panel2);color:var(--muted);cursor:not-allowed}\n.sc-log .auto{display:flex;flex-direction:column;gap:12px;margin-bottom:12px}\n.sc-log .auto h3{margin:0;font-size:16px;font-weight:600}\n.sc-log .auto p{margin:3px 0 0}\n.sc-log .top{align-items:flex-start;gap:12px}\n.sc-log .trigs{display:flex;flex-wrap:wrap;gap:6px}\n.sc-log .tchip{display:inline-flex;align-items:center;gap:5px;font-size:12.5px;color:#C4CCE0;background:var(--panel2);border-radius:999px;padding:5px 10px 5px 8px}\n.sc-log .cond{display:flex;flex-wrap:wrap;align-items:center;gap:6px;border-left:3px solid var(--amber);background:rgba(255,180,84,.07);border-radius:4px 12px 12px 4px;padding:9px 10px}\n.sc-log .cond-l{font-size:12.5px;font-weight:700;color:var(--amber);margin-right:2px}\n.sc-log .cchip{font-size:12.5px;background:rgba(255,180,84,.14);color:#FFD9A6;border-radius:999px;padding:3px 9px}\n.sc-log .cond.empty{width:100%;border:1px dashed var(--line);border-left:3px solid var(--line);background:transparent;color:var(--muted);font-size:13.5px;text-align:left;cursor:pointer;min-height:44px;justify-content:space-between;flex-wrap:nowrap}\n.sc-log .cond.empty .lnk{color:var(--amber);font-weight:600}\n.sc-log .stats{display:grid;grid-template-columns:repeat(3,1fr);margin:0;padding-top:12px;border-top:1px solid var(--line)}\n.sc-log .stats div{display:flex;flex-direction:column;gap:2px}\n.sc-log .stats dt{order:2;font-size:12.5px;color:var(--muted)}\n.sc-log .stats dd{margin:0;font-size:19px;font-weight:700;font-variant-numeric:tabular-nums}\n.sc-log .auto.off h3,.sc-log .auto.off .stats dd{color:var(--muted)}\n.sc-log .more{width:100%;background:transparent;border:0;color:var(--blue);font-weight:600;font-size:15px;min-height:46px;cursor:pointer}\n.sc-log .sw{width:50px;height:30px;border-radius:999px;border:0;background:#334060;position:relative;cursor:pointer;flex:none;padding:0;transition:background .2s}\n.sc-log .sw::after{content:'';position:absolute;top:3px;left:3px;width:24px;height:24px;border-radius:50%;background:#fff;transition:transform .2s}\n.sc-log .sw[aria-checked=true]{background:var(--mint)}\n.sc-log .sw[aria-checked=true]::after{transform:translateX(20px)}\n.sc-log .nav{display:grid;grid-template-columns:repeat(3,1fr);border-top:1px solid var(--line);background:var(--panel);padding:6px 8px 10px}\n.sc-log .nav button{background:transparent;border:0;color:var(--muted);font-size:12px;font-weight:600;display:flex;flex-direction:column;align-items:center;gap:3px;padding:6px 0;min-height:54px;cursor:pointer;border-radius:12px}\n.sc-log .nav button[aria-current=page]{color:var(--blue)}\n.sc-log /* editor */\n.ed-top{display:flex;align-items:center;gap:4px;padding:10px 12px 6px}\n.sc-log .ed-top h1{margin:0;font-size:19px;font-weight:700}\n.sc-log .ed-scroll{padding:8px 16px 24px}\n.sc-log .field{display:flex;flex-direction:column;gap:6px;margin-bottom:24px;font-size:13px;color:var(--muted)}\n.sc-log .inp{background:var(--panel);border:1px solid var(--line);border-radius:12px;color:var(--text);font:inherit;font-size:15px;padding:12px 14px;min-height:48px;width:100%;color-scheme:dark}\n.sc-log textarea.inp{resize:none;line-height:1.5;min-height:96px}\n.sc-log .flow{list-style:none;margin:0;padding:0 0 0 26px}\n.sc-log .step{position:relative;padding-bottom:28px}\n.sc-log .step:last-child{padding-bottom:4px}\n.sc-log .step::before{content:'';position:absolute;left:-20px;top:20px;bottom:-4px;width:2px;background:var(--line)}\n.sc-log .step:last-child::before{display:none}\n.sc-log .node{position:absolute;left:-27px;top:4px;width:16px;height:16px;border-radius:50%;background:var(--night);border:3px solid var(--c)}\n.sc-log .step.blue{--c:var(--blue)}\n.sc-log .step.amber{--c:var(--amber)}\n.sc-log .step.mint{--c:var(--mint)}\n.sc-log .step-h{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;min-height:32px}\n.sc-log .step-h h3{margin:0;font-size:16px;font-weight:700}\n.sc-log .hint,.sc-log .note{font-size:13.5px;color:var(--muted);margin:0 0 12px;line-height:1.45}\n.sc-log .note{margin:0}\n.sc-log .note.warn{color:var(--amber)}\n.sc-log .tgrid{display:grid;grid-template-columns:1fr 1fr;gap:8px}\n.sc-log .tbtn{display:flex;align-items:center;gap:8px;background:var(--panel);border:1px solid var(--line);color:var(--muted);border-radius:14px;padding:0 12px;min-height:54px;font-size:14px;font-weight:600;cursor:pointer;text-align:left}\n.sc-log .tbtn[aria-pressed=true]{border-color:var(--blue);background:rgba(91,140,255,.12);color:var(--text)}\n.sc-log .tbtn .tick{margin-left:auto;color:var(--blue);flex:none}\n.sc-log .ccard{background:var(--panel);border:1px solid var(--line);border-left:3px solid var(--amber);border-radius:6px 16px 16px 6px;padding:10px 12px 14px}\n.sc-log .ccard.fresh{animation:pop 1s ease-out}\n@keyframes pop{0%{background:rgba(255,180,84,.3)}100%{background:var(--panel)}}\n.sc-log .c-head{display:flex;align-items:center;gap:10px;margin-bottom:10px}\n.sc-log .c-head b{flex:1;font-size:15px;font-weight:600}\n.sc-log .c-ico{width:32px;height:32px;border-radius:10px;background:rgba(255,180,84,.14);color:var(--amber);display:grid;place-items:center;flex:none}\n.sc-log .joiner{display:flex;justify-content:center;margin:8px 0}\n.sc-log .joiner span{font-size:12px;font-weight:700;color:var(--amber);background:rgba(255,180,84,.12);padding:3px 14px;border-radius:999px}\n.sc-log .add-cond{width:100%;min-height:54px;margin-top:12px;border:1.5px dashed rgba(255,180,84,.55);background:rgba(255,180,84,.06);color:var(--amber);border-radius:14px;font-weight:700;font-size:15px;display:flex;align-items:center;justify-content:center;gap:8px;cursor:pointer}\n.sc-log .kw-list{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}\n.sc-log .kw{display:inline-flex;align-items:center;gap:2px;background:var(--panel2);border-radius:999px;padding:3px 3px 3px 12px;font-size:14px}\n.sc-log .kw button{border:0;background:transparent;color:var(--muted);width:30px;height:30px;border-radius:50%;display:grid;place-items:center;cursor:pointer}\n.sc-log .kw-add{display:flex;gap:8px}\n.sc-log .kw-add .inp{min-height:44px;padding:9px 12px;font-size:14px}\n.sc-log .btn2{border:1px solid var(--line);background:var(--panel2);color:var(--text);font-weight:600;font-size:14px;border-radius:12px;padding:0 16px;min-height:44px;cursor:pointer}\n.sc-log .btn2.pill{min-height:38px;border-radius:999px;padding:0 12px 0 10px;font-size:13px;display:inline-flex;align-items:center;gap:4px}\n.sc-log .row-inline{display:flex;align-items:center;gap:10px}\n.sc-log .time-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}\n.sc-log .time-row label{display:flex;flex-direction:column;gap:5px;font-size:12.5px;color:var(--muted)}\n.sc-log .pick7,.sc-log .pick3{display:grid;gap:5px}\n.sc-log .pick7{grid-template-columns:repeat(7,1fr)}\n.sc-log .pick3{grid-template-columns:repeat(3,1fr)}\n.sc-log .pick7 button,.sc-log .pick3 button{min-height:44px;border-radius:10px;border:1px solid var(--line);background:var(--night);color:var(--muted);font-size:12.5px;font-weight:600;cursor:pointer;padding:0 2px}\n.sc-log .pick7 button[aria-pressed=true],.sc-log .pick3 button[aria-pressed=true]{background:rgba(255,180,84,.16);border-color:rgba(255,180,84,.6);color:#FFD9A6}\n.sc-log .vars{display:flex;gap:6px;margin-top:8px;flex-wrap:wrap}\n.sc-log .ed-foot{border-top:1px solid var(--line);background:var(--panel);padding:12px 16px 14px;display:flex;flex-direction:column;gap:10px}\n.sc-log .sum{margin:0;font-size:13.5px;line-height:1.5;color:#C9D1E6;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}\n.sc-log .sum.warn{color:var(--amber)}\n.sc-log .scrim{position:absolute;inset:0;background:rgba(5,8,14,.62);display:flex;align-items:flex-end;z-index:5}\n.sc-log .sheet{width:100%;max-height:86%;overflow-y:auto;background:var(--panel);border-radius:26px 26px 0 0;border-top:1px solid var(--line);padding:8px 16px 22px;animation:up .24s ease-out;box-shadow:0 -16px 40px rgba(0,0,0,.4)}\n@keyframes up{from{transform:translateY(40px);opacity:.4}to{transform:none;opacity:1}}\n.sc-log .grab{width:40px;height:4px;border-radius:2px;background:var(--line);margin:4px auto 6px}\n.sc-log .sh-head{display:flex;align-items:center;justify-content:space-between}\n.sc-log .sh-head h2{margin:0;font-size:19px;font-weight:700}\n.sc-log .gt{font-size:13px;font-weight:600;color:var(--muted);margin:18px 0 4px}\n.sc-log .opt{width:100%;display:flex;align-items:center;gap:12px;background:transparent;border:0;border-radius:14px;padding:8px 6px;min-height:62px;color:var(--text);text-align:left;cursor:pointer}\n.sc-log .opt:hover:not(:disabled){background:var(--panel2)}\n.sc-log .opt:disabled{opacity:.5;cursor:default}\n.sc-log .opt .c-ico{width:40px;height:40px;border-radius:12px}\n.sc-log .opt .t{flex:1;display:flex;flex-direction:column;gap:2px}\n.sc-log .opt b{font-size:15px;font-weight:600}\n.sc-log .opt small{font-size:13px;color:var(--muted)}\n.sc-log .opt .end{color:var(--muted);font-size:13px;display:flex;align-items:center;gap:4px}\n.sc-log .toast-wrap{position:absolute;left:0;right:0;bottom:90px;display:flex;justify-content:center;z-index:9;pointer-events:none}\n.sc-log .toast{background:var(--mint);color:#062015;font-weight:700;font-size:14px;padding:10px 16px;border-radius:999px;display:flex;gap:6px;align-items:center;animation:up .2s ease-out}\n.sc-log .chan-chip{display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:0 10px 0 6px;border-radius:999px;border:1px solid var(--line);background:var(--panel);color:var(--text);font-size:14px;font-weight:600;cursor:pointer;max-width:170px}\n.sc-log .chan-chip .cname{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.sc-log .chan-chip .chv{color:var(--muted);flex:none}\n.sc-log .chan-chip.wide{width:100%;max-width:none;justify-content:flex-start;padding:8px 14px 8px 8px;min-height:58px;border-radius:16px;font-size:15.5px}\n.sc-log .chan-chip.wide .cname{flex:1;text-align:left}\n.sc-log .cav{width:32px;height:32px;border-radius:50%;display:grid;place-items:center;font-weight:700;font-size:14px;background:hsl(var(--h,220) 38% 26%);color:#E6ECFA;flex:none;position:relative}\n.sc-log .cav.lg{width:40px;height:40px;font-size:16px}\n.sc-log .cav .warn-dot{position:absolute;right:-1px;bottom:-1px;width:11px;height:11px;border-radius:50%;background:var(--amber);border:2px solid var(--panel)}\n.sc-log .crow{width:100%;display:flex;align-items:center;gap:12px;text-align:left;background:var(--night);border:1px solid var(--line);color:var(--text);border-radius:14px;padding:10px 14px;min-height:64px;cursor:pointer;margin-top:8px}\n.sc-log .crow[aria-pressed=true]{border-color:var(--blue);background:rgba(91,140,255,.12)}\n.sc-log .crow .ct{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}\n.sc-log .crow b{font-size:15.5px;font-weight:600}\n.sc-log .crow small{font-size:13px;color:var(--muted)}\n.sc-log .crow small.warn{color:var(--amber)}\n.sc-log .crow .tick{color:var(--blue);flex:none}\n.sc-log .crow.addc{border:1.5px dashed #3B486B;background:transparent;color:var(--blue);font-weight:700;justify-content:center;gap:8px}\n.sc-log .sh-link{background:transparent;border:0;color:var(--blue);font-weight:600;font-size:14.5px;min-height:44px;cursor:pointer;padding:0 4px;margin-top:6px}\n.sc-log .chan-banner{display:flex;align-items:center;gap:12px;margin:12px 16px 0;padding:12px 12px 12px 14px;border-left:3px solid var(--amber);background:rgba(255,180,84,.08);border-radius:4px 14px 14px 4px}\n.sc-log .chan-banner.inline{margin:10px 0 0}\n.sc-log .chan-banner p{margin:0;flex:1;font-size:13.5px;line-height:1.45;color:#FFE3BC}\n.sc-log .chan-banner button{flex:none;min-height:40px;border-radius:12px;border:1px solid rgba(255,180,84,.5);background:transparent;color:var(--amber);font-weight:700;font-size:14px;padding:0 14px;cursor:pointer}\n.sc-log .chan-field{margin-bottom:14px}\n.sc-log .lab.first{margin-top:0}\n.sc-log .row-hdr{display:flex;align-items:center;justify-content:space-between;gap:10px}\n.sc-log .hdr-r{display:flex;align-items:center;gap:2px}\n.sc-log .icon-btn.sm{width:40px;height:40px;border-radius:12px;color:var(--muted)}\n.sc-log .scrim{position:absolute;inset:0;background:rgba(5,8,14,.62);display:flex;align-items:flex-end;z-index:5}\n.sc-log .sheet{width:100%;max-height:88%;overflow-y:auto;background:var(--panel);border-radius:26px 26px 0 0;border-top:1px solid var(--line);padding:8px 16px 20px;animation:up .24s ease-out;box-shadow:0 -16px 40px rgba(0,0,0,.4)}\n.sc-log .grab{width:40px;height:4px;border-radius:2px;background:var(--line);margin:4px auto 6px}\n.sc-log .sh-head{display:flex;align-items:center;justify-content:space-between;gap:8px}\n.sc-log .sh-head h2{margin:0;font-size:19px;font-weight:700}\n.sc-log .sk{display:block;background:linear-gradient(90deg,var(--panel2) 0%,#27324C 50%,var(--panel2) 100%);background-size:200% 100%;animation:shimmer 1.4s ease-in-out infinite}\n.sc-log .skcard{background:var(--panel);border:1px solid var(--line);border-radius:20px;padding:16px;display:flex;flex-direction:column;gap:12px}\n.sc-log .skrow{display:flex;align-items:center;gap:12px}\n.sc-log .errcard{display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px;padding:32px 20px;background:var(--panel);border:1px dashed #3B486B;border-radius:20px}\n.sc-log .errcard .eico{width:52px;height:52px;border-radius:50%;background:rgba(255,180,84,.14);color:var(--amber);display:grid;place-items:center;margin-bottom:6px}\n.sc-log .errcard h3{margin:0;font-size:17px}\n.sc-log .errcard p{margin:0 0 10px;font-size:14px;line-height:1.5;color:var(--muted);max-width:280px}\n.sc-log .errcard .retry{min-height:44px;border-radius:12px;border:1px solid var(--line);background:var(--panel2);color:var(--text);font-weight:700;font-size:14.5px;padding:0 18px;cursor:pointer;display:inline-flex;align-items:center;gap:8px}\n.sc-log .bspin{width:18px;height:18px;border-radius:50%;border:2.5px solid rgba(11,16,32,.25);border-top-color:#0B1020;animation:spinr .8s linear infinite;flex:none}\n.sc-log .inline-err{display:flex;align-items:flex-start;gap:8px;font-size:13.5px;line-height:1.45;color:var(--amber);margin:0}\n.sc-log .inline-err svg{flex:none;margin-top:2px}\n.sc-log .ubar{display:block;height:4px;border-radius:2px;background:var(--panel2);overflow:hidden;margin-top:6px}\n.sc-log .ubar i{display:block;height:100%;width:0;background:var(--blue);animation:fillbar linear forwards}\n.sc-log .fitem .rt small.bad{color:var(--amber)}\n.sc-log .retry-link{background:transparent;border:0;color:var(--blue);font-weight:700;font-size:13.5px;min-height:40px;padding:0 8px;cursor:pointer}\n.sc-log .primary .bspin{margin-right:2px}\n.sc-log .metanote{display:flex;gap:8px;align-items:flex-start;font-size:13px;line-height:1.5;color:var(--muted);margin:14px 0 0}\n.sc-log .metanote svg{flex:none;margin-top:2px;color:var(--blue)}\n.sc-log .metanote.warn{color:#FFE3BC}\n.sc-log .metanote.warn svg{color:var(--amber)}\n.sc-log .chipset{display:flex;flex-wrap:wrap;gap:6px}\n.sc-log .chipset button{min-height:40px;padding:0 14px;border-radius:999px;border:1px solid var(--line);background:var(--night);color:var(--muted);font-size:13.5px;font-weight:600;cursor:pointer}\n.sc-log .chipset button[aria-pressed=true]{border-color:var(--blue);background:rgba(91,140,255,.12);color:var(--text)}\n.sc-log .sw:disabled{opacity:.4;cursor:not-allowed}\n.sc-log .stepper{padding-left:14px;padding-right:14px}\n.sc-log .st{width:64px}\n.sc-log .st span{font-size:11.5px}\n.sc-log .card.auto.clickable,.sc-log .card.msg.clickable{cursor:pointer}\n.sc-log .row2{display:flex;align-items:center;justify-content:space-between;gap:8px}\n.sc-log .text-btn{background:transparent;border:0;color:var(--blue);font-weight:600;font-size:14px;min-height:40px;padding:0 6px;cursor:pointer;display:inline-flex;align-items:center;gap:6px}\n.sc-log .big-warn{width:68px;height:68px;border-radius:50%;background:rgba(255,180,84,.14);color:var(--amber);display:grid;place-items:center}\n.sc-log .lpad{padding:6px 16px 32px}\n.sc-log .toolbar{padding:8px 16px 4px}\n.sc-log .srow{display:flex;gap:8px}\n.sc-log .search{position:relative;flex:1;min-width:0}\n.sc-log .fbtn{position:relative;flex:none;width:48px;height:48px;border-radius:14px;border:1px solid var(--line);background:var(--panel);color:var(--muted);display:grid;place-items:center;cursor:pointer}\n.sc-log .fbtn[aria-pressed=true]{border-color:var(--amber);background:rgba(255,180,84,.1);color:var(--amber)}\n.sc-log .fbtn .badge{position:absolute;top:-6px;right:-6px}\n.sc-log .search > svg{position:absolute;left:14px;top:50%;transform:translateY(-50%);color:var(--muted);pointer-events:none}\n.sc-log .search .inp{background:var(--panel);border:1px solid var(--line);border-radius:14px;color:var(--text);font:inherit;font-size:15px;padding:0 44px 0 42px;min-height:48px;width:100%;color-scheme:dark}\n.sc-log .clear{position:absolute;right:4px;top:50%;transform:translateY(-50%);width:40px;height:40px;border:0;background:transparent;color:var(--muted);display:grid;place-items:center;cursor:pointer;border-radius:50%}\n.sc-log .chips{display:flex;gap:8px;overflow-x:auto;margin:10px -16px 0;padding:0 16px 4px}\n.sc-log .chipb{flex:none;min-height:40px;padding:0 14px;border-radius:999px;border:1px solid var(--line);background:var(--panel);color:var(--muted);font-size:13.5px;font-weight:600;cursor:pointer;white-space:nowrap;display:inline-flex;align-items:center;gap:6px}\n.sc-log .chipb[aria-pressed=true]{border-color:var(--blue);background:rgba(91,140,255,.12);color:var(--text)}\n.sc-log .chipb .n{font-size:12px;font-weight:700;color:var(--muted);font-variant-numeric:tabular-nums}\n.sc-log .chipb[aria-pressed=true] .n{color:var(--blue)}\n.sc-log .chipb.filter{margin-left:auto}\n.sc-log .chipb.filter[aria-pressed=true]{border-color:var(--amber);background:rgba(255,180,84,.1)}\n.sc-log .badge{background:var(--amber);color:#2A1B00;border-radius:999px;font-size:12px;font-weight:800;min-width:20px;height:20px;display:grid;place-items:center;padding:0 5px}\n.sc-log .applied{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-top:8px}\n.sc-log .achip{display:inline-flex;align-items:center;gap:2px;background:rgba(255,180,84,.12);color:#FFD9A6;border-radius:999px;padding:2px 2px 2px 12px;font-size:13px;font-weight:600}\n.sc-log .achip button{border:0;background:transparent;color:#FFD9A6;width:30px;height:30px;border-radius:50%;display:grid;place-items:center;cursor:pointer}\n.sc-log .text-btn{background:transparent;border:0;color:var(--blue);font-weight:600;font-size:14px;min-height:40px;padding:0 8px;cursor:pointer}\n.sc-log .sumrow{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:12px 0 4px}\n.sc-log .sumrow div{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:10px 10px 9px;min-width:0}\n.sc-log .sumrow b{display:block;font-size:19px;font-variant-numeric:tabular-nums}\n.sc-log .sumrow span{font-size:12.5px;color:var(--muted)}\n.sc-log .dayh{position:sticky;top:0;z-index:2;background:var(--night);padding:16px 2px 8px;font-size:13px;font-weight:700;color:var(--muted)}\n.sc-log .lrow{width:100%;display:flex;align-items:flex-start;gap:12px;background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:12px;margin-bottom:8px;text-align:left;color:var(--text);cursor:pointer}\n.sc-log .lrow .lm{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px}\n.sc-log .lrow .who{display:flex;align-items:center;gap:6px;font-size:15px;font-weight:600}\n.sc-log .lrow .who svg{color:var(--muted);flex:none}\n.sc-log .lrow .inc{font-size:14px;color:#C4CCE0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.sc-log .lrow .out{font-size:13px;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.sc-log .lrow .rt2{display:flex;flex-direction:column;align-items:flex-end;gap:6px;flex:none}\n.sc-log .lrow .tm{font-size:12px;color:var(--muted)}\n.sc-log .dchip{font-size:12px;font-weight:700;padding:4px 9px;border-radius:999px;white-space:nowrap}\n.sc-log .dchip.sent{color:var(--mint);background:rgba(79,216,160,.12)}\n.sc-log .dchip.seen{color:#8FB0FF;background:rgba(91,140,255,.14)}\n.sc-log .dchip.no{color:var(--amber);background:rgba(255,180,84,.12)}\n.sc-log .dchip.bad{color:var(--red);background:rgba(255,107,107,.12)}\n.sc-log .more{width:100%;min-height:48px;margin-top:6px;border-radius:14px;border:1px solid var(--line);background:var(--panel2);color:var(--text);font-weight:600;font-size:14.5px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px}\n.sc-log .endnote{text-align:center;color:var(--muted);font-size:13px;margin:16px 0 0}\n.sc-log .empty{text-align:center;padding:40px 12px 10px;display:flex;flex-direction:column;align-items:center}\n.sc-log .empty h3{margin:0;font-size:17px}\n.sc-log .empty p{margin:6px 0 16px;font-size:14px;color:var(--muted);line-height:1.5;max-width:280px}\n.sc-log .btn2{border:1px solid var(--line);background:var(--panel2);color:var(--text);font-weight:600;font-size:14.5px;border-radius:12px;padding:0 18px;min-height:46px;cursor:pointer}\n.sc-log .gt{font-size:13px;font-weight:600;color:var(--muted);margin:18px 0 8px}\n.sc-log .chipwrap{display:flex;flex-wrap:wrap;gap:8px}\n.sc-log .btns{display:flex;gap:10px;margin-top:22px}\n.sc-log .primary,.sc-log .ghost{min-height:50px;border-radius:14px;font-weight:700;font-size:15px;padding:0 18px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px}\n.sc-log .primary{flex:1;background:var(--blue);color:#0B1020;border:0}\n.sc-log .primary:disabled{background:var(--panel2);color:var(--muted);cursor:not-allowed}\n.sc-log .ghost{background:transparent;border:1px solid var(--line);color:var(--text);font-weight:600}\n.sc-log .ehead{display:flex;align-items:center;gap:12px;margin-top:6px}\n.sc-log .ehead .cav{width:44px;height:44px;font-size:17px}\n.sc-log .ehead b{display:block;font-size:17px}\n.sc-log .ehead small{font-size:13px;color:var(--muted)}\n.sc-log .convo{background:#0A0E17;border:1px solid var(--line);border-radius:18px;padding:14px;margin-top:14px;display:flex;flex-direction:column;gap:8px}\n.sc-log .bub{max-width:82%;border-radius:18px;padding:10px 14px;font-size:14.5px;line-height:1.45;overflow-wrap:anywhere}\n.sc-log .bub.in{align-self:flex-start;background:#262F45}\n.sc-log .bub.out{align-self:flex-end;background:var(--blue);color:#0B1020}\n.sc-log .bub.out.q{opacity:.75}\n.sc-log .btype{align-self:flex-end;font-size:12px;color:var(--muted)}\n.sc-log .kv{margin-top:14px;border:1px solid var(--line);border-radius:16px;overflow:hidden}\n.sc-log .kv div{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 14px;font-size:14.5px}\n.sc-log .kv div + div{border-top:1px solid var(--line)}\n.sc-log .kv span{color:var(--muted);flex:none}\n.sc-log .kv b{font-weight:600;text-align:right;min-width:0;overflow-wrap:anywhere}\n.sc-log .kv button{background:transparent;border:0;color:var(--blue);font-weight:600;font-size:14.5px;cursor:pointer;padding:0;text-align:right}\n.sc-log .why{margin:14px 0 0;padding:12px 14px;border-left:3px solid var(--amber);background:rgba(255,180,84,.08);border-radius:4px 14px 14px 4px;font-size:14px;line-height:1.5;color:#FFE3BC}\n.sc-log .why.bad{border-left-color:var(--red);background:rgba(255,107,107,.08);color:#FFD0D0}\n.sc-log .inline-err{display:flex;align-items:flex-start;gap:8px;font-size:13.5px;line-height:1.45;color:var(--amber);margin:12px 0 0}\n.sc-log .inline-err svg{flex:none;margin-top:2px}\n.sc-log .outc{display:flex;gap:6px;margin-top:12px;flex-wrap:wrap}\n.sc-log .outc span{font-size:12.5px;font-weight:600;padding:5px 10px;border-radius:999px;background:var(--panel2);color:#C4CCE0}\n";

const TR = {
  direct: { label: "Direct message", short: "Direct", icon: Send },
  story: { label: "Story reply", short: "Story", icon: Reply },
  share: { label: "Media share", short: "Share", icon: Share2 },
  comment: { label: "Comment", short: "Comment", icon: MessageCircle },
};
const MT = {
  generic: { label: "Generic", icon: Layers },
  text: { label: "Text", icon: Type },
  media: { label: "Media", icon: ImageIcon },
  button: { label: "Button & text", icon: MousePointerClick },
  quick: { label: "Quick reply", icon: Zap },
};
const ST = {
  sent: { label: "Sent", cls: "sent", g: "sent" },
  seen: { label: "Seen", cls: "seen", g: "sent" },
  queued: { label: "Waiting", cls: "no", g: "notsent" },
  c: { label: "No match", cls: "no", g: "notsent" },
  w: { label: "Window closed", cls: "no", g: "notsent" },
  d: { label: "Already replied", cls: "no", g: "notsent" },
  failed: { label: "Failed", cls: "bad", g: "failed" },
};
const WHY = {
  c: "The message didn’t match this automation’s rules. Nothing to fix.",
  w: "The person hadn’t messaged in 24 hours, so Instagram doesn’t allow an automated reply.",
  d: "Instagram allows one private reply per comment.",
  queued: "Comment replies are limited to 750 per hour per account. This one goes out when the limit resets.",
  failed: "Instagram couldn’t deliver this message. Retrying can help while the 24-hour window is still open.",
};
const STATUS_TABS = [["all", "All"], ["sent", "Sent"], ["notsent", "Not sent"], ["failed", "Failed"]];
const PERIODS = [["1", "Today"], ["7", "7 days"], ["all", "All time"]];
const USERS = [["sara_k", 215], ["nima.design", 165], ["the.shop", 30], ["leila_m", 340], ["arash_r", 280], ["mina.cafe", 120], ["reza.art", 200], ["sina_b", 15]];
const SNIPPETS = ["price?", "How much is this?", "link please", "Hi!", "Do you ship abroad?", "Is this available?", "Can I order today?", "Size M?", "Thanks!", "Where is your shop?"];

function makeLog(autos, msgs, chId, now) {
  const src = autos.filter((a) => a.stats[0] > 0);
  if (!src.length) return [];
  let s = 11 + chId * 37;
  const rnd = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  const out = [];
  let mins = 2;
  for (let i = 0; i < 64; i++) {
    mins += Math.floor(6 + rnd() * 250);
    const a = src[Math.floor(rnd() * src.length)];
    const trig = a.triggers.length ? a.triggers[Math.floor(rnd() * a.triggers.length)] : "direct";
    const cfgMsg = a.config && a.config.msgId ? msgs.find((m) => m.id === a.config.msgId) : null;
    const msg = cfgMsg || msgs.find((m) => m.type === a.types[0]) || msgs[0] || { name: "Message", type: "text", preview: "" };
    const r = rnd();
    let st = "sent";
    if (r > 0.55) st = "seen";
    if (r > 0.8) st = "c";
    if (r > 0.9) st = "w";
    if (r > 0.94) st = a.triggers.includes("comment") ? "d" : "c";
    if (i % 23 === 7) st = "failed";
    if (i > 0 && i < 6 && i % 5 === 2 && a.triggers.includes("comment")) st = "queued";
    const u = USERS[Math.floor(rnd() * USERS.length)];
    out.push({
      id: "l" + i,
      autoId: a.id,
      autoName: a.name,
      trig,
      user: u[0],
      hue: u[1],
      text: SNIPPETS[Math.floor(rnd() * SNIPPETS.length)],
      msg,
      st,
      rule: a.conds.length ? a.conds[0] : "",
      mins,
      ts: now - mins * 60000,
      clicked: rnd() > 0.7,
      followed: rnd() > 0.85,
    });
  }
  return out;
}

function dayLabel(ts, now) {
  const d = new Date(ts);
  const n = new Date(now);
  const a = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const b = new Date(n.getFullYear(), n.getMonth(), n.getDate()).getTime();
  const diff = Math.round((b - a) / 86400000);
  if (diff <= 0) return "Today";
  if (diff === 1) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
const fill = (t, user) => {
  const first = user.split(/[._]/)[0];
  return t.replace(/\{first_name\}/g, first[0].toUpperCase() + first.slice(1)).replace(/\{username\}/g, "@" + user);
};
const timeLabel = (ts) => new Date(ts).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
const ago = (m) => (m < 60 ? `${m} min ago` : m < 1440 ? `${Math.floor(m / 60)} h ago` : `${Math.floor(m / 1440)} d ago`);

const EMPTY_F = { autoId: null, triggers: [], types: [], period: "all" };

function passes(e, { status, f, q }) {
  if (status !== "all" && ST[e.st].g !== status) return false;
  if (f.autoId && e.autoId !== f.autoId) return false;
  if (f.triggers.length && !f.triggers.includes(e.trig)) return false;
  if (f.types.length && !f.types.includes(e.msg.type)) return false;
  if (f.period === "1" && e.mins > 1440) return false;
  if (f.period === "7" && e.mins > 7 * 1440) return false;
  const s = q.trim().toLowerCase();
  if (s && !(`${e.user} ${e.text} ${e.msg.name} ${e.autoName}`.toLowerCase().includes(s))) return false;
  return true;
}

function LogSkeleton() {
  return (
    <div className="lpad" role="status" aria-busy="true" aria-label="Loading messages">
      <div className="sumrow">{[0, 1, 2, 3].map((i) => <div key={i}><Skeleton h={22} w="60%" /><Skeleton h={12} w="80%" style={{ marginTop: 8 }} /></div>)}</div>
      <Skeleton h={14} w={70} style={{ margin: "18px 0 10px" }} />
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="lrow" style={{ cursor: "default" }}>
          <Skeleton h={32} w={32} r={16} />
          <span className="lm"><Skeleton h={15} w="45%" /><Skeleton h={13} w="75%" /><Skeleton h={12} w="55%" /></span>
          <span className="rt2"><Skeleton h={22} w={56} r={11} /><Skeleton h={12} w={38} /></span>
        </div>
      ))}
    </div>
  );
}

function FilterSheet({ initial, autos, onApply, onClose, countFor }) {
  const [d, setD] = useState(initial);
  const tog = (k, v) => setD((o) => ({ ...o, [k]: o[k].includes(v) ? o[k].filter((x) => x !== v) : [...o[k], v] }));
  const n = countFor(d);
  return (
    <div className="scrim" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label="Filters" onClick={(e) => e.stopPropagation()}>
        <div className="grab" />
        <div className="sh-head"><h2>Filters</h2><button type="button" className="icon-btn sm" aria-label="Close" onClick={onClose}><X size={20} /></button></div>
        <p className="gt">Period</p>
        <div className="chipwrap" role="group" aria-label="Period">
          {PERIODS.map(([v, l]) => (
            <button key={v} type="button" className="chipb" aria-pressed={d.period === v} onClick={() => setD({ ...d, period: v })}>{l}</button>
          ))}
        </div>
        {autos.length > 0 && (
          <>
            <p className="gt">Automation</p>
            <div className="chipwrap" role="group" aria-label="Automation">
              <button type="button" className="chipb" aria-pressed={!d.autoId} onClick={() => setD({ ...d, autoId: null })}>All</button>
              {autos.map((a) => (
                <button key={a.id} type="button" className="chipb" aria-pressed={d.autoId === a.id} onClick={() => setD({ ...d, autoId: a.id })}>{a.name}</button>
              ))}
            </div>
          </>
        )}
        <p className="gt">Trigger</p>
        <div className="chipwrap" role="group" aria-label="Trigger">
          {Object.keys(TR).map((k) => (
            <button key={k} type="button" className="chipb" aria-pressed={d.triggers.includes(k)} onClick={() => tog("triggers", k)}>{TR[k].label}</button>
          ))}
        </div>
        <p className="gt">Message type</p>
        <div className="chipwrap" role="group" aria-label="Message type">
          {Object.keys(MT).map((k) => (
            <button key={k} type="button" className="chipb" aria-pressed={d.types.includes(k)} onClick={() => tog("types", k)}>{MT[k].label}</button>
          ))}
        </div>
        <div className="btns">
          <button type="button" className="ghost" onClick={() => setD(EMPTY_F)}>Clear</button>
          <button type="button" className="primary" onClick={() => onApply(d)}>{n === 0 ? "No results" : `Show ${n} ${n === 1 ? "message" : "messages"}`}</button>
        </div>
      </div>
    </div>
  );
}

function LogScreen(props) {
  const chan = useContext(ChanCtx);
  const net = useContext(NetCtx);
  const init = props.init || {};
  const [ld, retryLoad] = useLoad("log|" + chan.activeId, 800);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState(init.status || "all");
  const [f, setF] = useState({ ...EMPTY_F, autoId: init.autoId || null });
  const [visible, setVisible] = useState(20);
  const [more, setMore] = useState({ loading: false, err: null });
  const [sheet, setSheet] = useState(null);
  const [overrides, setOverrides] = useState({});
  const [retrying, setRetrying] = useState(null);
  const [retryErr, setRetryErr] = useState(null);
  const now = useRef(Date.now()).current;
  const autosKey = props.autos.map((a) => a.id).join(",");
  const base = useMemo(() => makeLog(props.autos, props.msgs, chan.activeId || 0, now), [autosKey, props.msgs.length, chan.activeId]);
  const log = base.map((e) => (overrides[e.id] ? { ...e, st: overrides[e.id] } : e));

  const forCounts = log.filter((e) => passes(e, { status: "all", f, q }));
  const count = (g) => (g === "all" ? forCounts.length : forCounts.filter((e) => ST[e.st].g === g).length);
  const filtered = log.filter((e) => passes(e, { status, f, q }));
  const shown = filtered.slice(0, visible);
  const nf = (f.autoId ? 1 : 0) + f.triggers.length + f.types.length + (f.period !== "all" ? 1 : 0);

  const sentN = filtered.filter((e) => ST[e.st].g === "sent").length;
  const seenN = filtered.filter((e) => e.st === "seen").length;
  const notN = filtered.filter((e) => ST[e.st].g === "notsent").length;
  const failN = filtered.filter((e) => ST[e.st].g === "failed").length;
  const seenRate = sentN ? Math.round((seenN / sentN) * 100) : 0;

  const groups = [];
  shown.forEach((e) => {
    const l = dayLabel(e.ts, now);
    const last = groups[groups.length - 1];
    if (last && last.l === l) last.items.push(e);
    else groups.push({ l, items: [e] });
  });

  const entry = sheet && sheet.type === "entry" ? log.find((e) => e.id === sheet.id) : null;
  const applied = [
    ...(f.period !== "all" ? [{ k: "period", l: PERIODS.find((p) => p[0] === f.period)[1] }] : []),
    ...(f.autoId ? [{ k: "autoId", l: (props.autos.find((a) => a.id === f.autoId) || { name: "Automation" }).name }] : []),
    ...f.triggers.map((t) => ({ k: "trig:" + t, l: TR[t].label })),
    ...f.types.map((t) => ({ k: "type:" + t, l: MT[t].label })),
  ];
  const removeApplied = (k) => {
    if (k === "period") setF({ ...f, period: "all" });
    else if (k === "autoId") setF({ ...f, autoId: null });
    else if (k.startsWith("trig:")) setF({ ...f, triggers: f.triggers.filter((x) => x !== k.slice(5)) });
    else setF({ ...f, types: f.types.filter((x) => x !== k.slice(5)) });
  };
  const clearAll = () => {
    setF(EMPTY_F);
    setStatus("all");
    setQ("");
  };

  const loadMore = () => {
    setMore({ loading: true, err: null });
    net.call(700).then(
      () => {
        setVisible((v) => v + 20);
        setMore({ loading: false, err: null });
      },
      (e) => setMore({ loading: false, err: e })
    );
  };

  const retry = (e) => {
    setRetrying(e.id);
    setRetryErr(null);
    net.call(900).then(
      () => {
        setOverrides((o) => ({ ...o, [e.id]: "sent" }));
        setRetrying(null);
      },
      (err) => {
        setRetrying(null);
        setRetryErr(err);
      }
    );
  };

  const closeSheet = () => {
    setSheet(null);
    setRetryErr(null);
  };

  return (
    <div className="sc-log screen">
      <style>{CSS}</style>
      <div className="ed-top">
        <button type="button" className="icon-btn" aria-label="Back" onClick={props.onBack}><ChevronLeft size={26} /></button>
        <h1>Sent messages</h1>
      </div>

      <div className="scr">
        {ld.status === "loading" && <LogSkeleton />}
        {ld.status === "error" && <div className="lpad"><LoadError err={ld.err} onRetry={retryLoad} what="your messages" /></div>}
        {ld.status === "ready" && (
          <>
            <div className="toolbar">
              <div className="srow">
                <div className="search">
                  <Search size={18} />
                  <input className="inp" dir="auto" type="text" value={q} placeholder="Search by username or text" aria-label="Search messages" onChange={(e) => setQ(e.target.value)} />
                  {q && <button type="button" className="clear" aria-label="Clear search" onClick={() => setQ("")}><X size={16} /></button>}
                </div>
                <button type="button" className="fbtn" aria-pressed={nf > 0} aria-label={nf > 0 ? `Filters, ${nf} active` : "Filters"} onClick={() => setSheet({ type: "filter" })}>
                  <SlidersHorizontal size={20} />
                  {nf > 0 && <span className="badge">{nf}</span>}
                </button>
              </div>
              <div className="chips" role="group" aria-label="Status">
                {STATUS_TABS.map(([k, l]) => (
                  <button key={k} type="button" className="chipb" aria-pressed={status === k} onClick={() => { setStatus(k); setVisible(20); }}>
                    {l}<span className="n">{count(k)}</span>
                  </button>
                ))}
              </div>
              {applied.length > 0 && (
                <div className="applied">
                  {applied.map((c) => (
                    <span className="achip" key={c.k}>{c.l}<button type="button" aria-label={`Remove filter ${c.l}`} onClick={() => removeApplied(c.k)}><X size={14} /></button></span>
                  ))}
                  <button type="button" className="text-btn" onClick={clearAll}>Clear all</button>
                </div>
              )}
            </div>

            <div className="lpad">
              {filtered.length > 0 && (
                <div className="sumrow">
                  <div><b>{sentN.toLocaleString("en-US")}</b><span>Sent</span></div>
                  <div><b>{seenRate}%</b><span>Seen</span></div>
                  <div><b>{notN.toLocaleString("en-US")}</b><span>Not sent</span></div>
                  <div><b style={failN ? { color: "var(--red)" } : undefined}>{failN.toLocaleString("en-US")}</b><span>Failed</span></div>
                </div>
              )}

              {groups.map((g) => (
                <section key={g.l}>
                  <h2 className="dayh">{g.l}</h2>
                  {g.items.map((e) => {
                    const t = TR[e.trig];
                    const s = ST[e.st];
                    return (
                      <button key={e.id} type="button" className="lrow" onClick={() => setSheet({ type: "entry", id: e.id })}>
                        <span className="cav" style={{ "--h": e.hue }} aria-hidden="true">{e.user[0].toUpperCase()}</span>
                        <span className="lm">
                          <span className="who" dir="auto">@{e.user}<t.icon size={14} aria-label={t.label} /></span>
                          <span className="inc" dir="auto">“{e.text}”</span>
                          <span className="out" dir="auto">{s.g === "sent" ? "Replied with" : "Would send"} {e.msg.name}</span>
                        </span>
                        <span className="rt2">
                          <span className={"dchip " + s.cls}>{s.label}</span>
                          <span className="tm">{timeLabel(e.ts)}</span>
                        </span>
                      </button>
                    );
                  })}
                </section>
              ))}

              {filtered.length === 0 && (
                <div className="empty">
                  <h3>{log.length === 0 ? "No messages yet" : "No messages match"}</h3>
                  <p>{log.length === 0 ? "Replies show up here as soon as an automation sends one." : "Try other words, or clear the filters."}</p>
                  {log.length > 0 && <button type="button" className="btn2" onClick={clearAll}>Clear filters</button>}
                </div>
              )}

              {filtered.length > visible && (
                <>
                  <button type="button" className="more" disabled={more.loading} onClick={loadMore}>
                    {more.loading ? "Loading…" : `Load more (${filtered.length - visible} left)`}
                  </button>
                  {more.err && (
                    <p className="inline-err" role="alert"><AlertTriangle size={16} /><span>{more.err.kind === "offline" ? "You’re offline. Try again when you’re back online." : "Couldn’t load more. Try again."}</span></p>
                  )}
                </>
              )}
              {filtered.length > 0 && filtered.length <= visible && <p className="endnote">You’ve reached the end.</p>}
            </div>
          </>
        )}
      </div>

      {sheet && sheet.type === "filter" && (
        <FilterSheet
          key="filter"
          initial={f}
          autos={props.autos}
          onClose={closeSheet}
          countFor={(d) => log.filter((e) => passes(e, { status, f: d, q })).length}
          onApply={(d) => {
            setF(d);
            setVisible(20);
            closeSheet();
          }}
        />
      )}

      {entry && (
        <div className="scrim" onClick={closeSheet}>
          <div className="sheet" role="dialog" aria-modal="true" aria-label={`Message to @${entry.user}`} onClick={(e) => e.stopPropagation()}>
            <div className="grab" />
            <div className="sh-head">
              <div className="ehead">
                <span className="cav" style={{ "--h": entry.hue }} aria-hidden="true">{entry.user[0].toUpperCase()}</span>
                <div><b dir="auto">@{entry.user}</b><small>{timeLabel(entry.ts)}, {dayLabel(entry.ts, now)}</small></div>
              </div>
              <button type="button" className="icon-btn sm" aria-label="Close" onClick={closeSheet}><X size={20} /></button>
            </div>

            <div className="convo">
              <div className="bub in" dir="auto">{entry.text}</div>
              {ST[entry.st].g === "notsent" && entry.st !== "queued" ? (
                <span className="btype">No reply was sent</span>
              ) : (
                <>
                  <div className={"bub out" + (entry.st === "queued" || entry.st === "failed" ? " q" : "")} dir="auto">{fill(entry.msg.preview || entry.msg.name, entry.user)}</div>
                  <span className="btype">{MT[entry.msg.type].label} message{entry.st === "queued" ? ", waiting" : entry.st === "failed" ? ", not delivered" : ""}</span>
                </>
              )}
            </div>

            <div style={{ marginTop: 12 }}>
              <span className={"dchip " + ST[entry.st].cls}>{ST[entry.st].label}</span>
              {(entry.clicked || entry.followed) && ST[entry.st].g === "sent" && (
                <span className="outc" style={{ display: "inline-flex", marginLeft: 8, marginTop: 0 }}>
                  {entry.clicked && <span>Clicked the link</span>}
                  {entry.followed && <span>Followed you</span>}
                </span>
              )}
            </div>

            {WHY[entry.st] && <p className={"why" + (entry.st === "failed" ? " bad" : "")}>{WHY[entry.st]}</p>}
            {entry.st === "failed" && (
              <>
                {entry.mins < 1440 ? (
                  <div className="btns">
                    <button type="button" className="primary" disabled={retrying === entry.id} onClick={() => retry(entry)}>
                      {retrying === entry.id ? (<><span className="bspin" /> Retrying…</>) : (<><RefreshCw size={16} /> Retry</>)}
                    </button>
                  </div>
                ) : (
                  <p className="metanote"><Info size={16} /><span>The 24-hour window has closed, so this can’t be retried.</span></p>
                )}
                {retryErr && (
                  <p className="inline-err" role="alert"><AlertTriangle size={16} /><span>{retryErr.kind === "offline" ? "You’re offline. Try again when you’re back online." : "Couldn’t retry. Try again in a moment."}</span></p>
                )}
              </>
            )}

            <div className="kv">
              <div><span>Automation</span><button type="button" onClick={() => { closeSheet(); props.onOpenAuto(entry.autoId); }}>{entry.autoName}</button></div>
              <div><span>Trigger</span><b>{TR[entry.trig].label}</b></div>
              {entry.rule && <div><span>Rule</span><b dir="auto">{entry.rule}</b></div>}
              <div><span>Message</span><b dir="auto">{entry.msg.name}</b></div>
              <div><span>Received</span><b>{ago(entry.mins)}</b></div>
              <div><span>Channel</span><b>{chan.active ? chan.active.name : ""}</b></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

return { Component: LogScreen };

})();

/* ═════════ ReviewMod ═════════ */
const ReviewMod = (() => {
const CSS = ".sc-review .scr{flex:1;overflow-y:auto;overscroll-behavior:contain}\n.sc-review .icon-btn{width:44px;height:44px;border-radius:14px;background:transparent;border:0;color:var(--text);display:grid;place-items:center;cursor:pointer;flex:none}\n.sc-review .icon-btn.sm{width:40px;height:40px;border-radius:12px;color:var(--muted)}\n.sc-review .ed-top{display:flex;align-items:center;gap:4px;padding:10px 12px 4px}\n.sc-review .ed-top h1{margin:0;font-size:19px;font-weight:700}\n.sc-review .stepper{display:flex;align-items:flex-start;padding:6px 20px 14px;border-bottom:1px solid var(--line)}\n.sc-review .st{display:flex;flex-direction:column;align-items:center;gap:6px;width:70px}\n.sc-review .st i{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;font-style:normal;font-weight:700;font-size:13px;background:var(--panel2);color:var(--muted)}\n.sc-review .st span{font-size:12px;color:var(--muted)}\n.sc-review .st.done i,.sc-review .st.active i{background:var(--blue);color:#0B1020}\n.sc-review .st.done span{color:#B9C3DB}\n.sc-review .st.active span{color:var(--text);font-weight:600}\n.sc-review .ln{flex:1;height:2px;background:var(--line);margin-top:14px;border:0}\n.sc-review .ln.done{background:var(--blue)}\n.sc-review .ed-scroll{padding:16px 16px 24px}\n.sc-review .intro{margin:0 0 14px;font-size:14.5px;line-height:1.5;color:var(--muted)}\n.sc-review .fc{background:var(--panel);border:1px solid var(--line);border-radius:20px;padding:14px 16px;margin-bottom:10px}\n.sc-review .fc.open{border-color:#34426A}\n.sc-review .fc-h{display:flex;align-items:center;gap:12px;min-height:44px}\n.sc-review .fc-t{flex:1;min-width:0}\n.sc-review .fc-t h2{margin:0;font-size:15.5px;font-weight:600}\n.sc-review .fc-t p{margin:2px 0 0;font-size:13px;color:var(--muted);line-height:1.35}\n.sc-review .ico{width:36px;height:36px;border-radius:11px;background:rgba(91,140,255,.14);color:var(--blue);display:grid;place-items:center;flex:none}\n.sc-review .fc-b{margin-top:14px;padding-top:4px;border-top:1px solid var(--line)}\n.sc-review .sw{width:50px;height:30px;border-radius:999px;border:0;background:#334060;position:relative;cursor:pointer;flex:none;padding:0;transition:background .2s}\n.sc-review .sw::after{content:'';position:absolute;top:3px;left:3px;width:24px;height:24px;border-radius:50%;background:#fff;transition:transform .2s}\n.sc-review .sw[aria-checked=true]{background:var(--blue)}\n.sc-review .sw[aria-checked=true]::after{transform:translateX(20px)}\n.sc-review .field{display:flex;flex-direction:column;gap:6px;margin-top:14px;font-size:13px;font-weight:600;color:var(--muted)}\n.sc-review .lab{font-size:13px;font-weight:600;color:var(--muted);margin:14px 0 8px}\n.sc-review .note{font-size:13.5px;color:var(--muted);margin:0;line-height:1.45}\n.sc-review .inp{background:var(--night);border:1px solid var(--line);border-radius:12px;color:var(--text);font:inherit;font-size:15px;font-weight:400;padding:11px 14px;min-height:48px;width:100%;color-scheme:dark}\n.sc-review textarea.inp{resize:none;line-height:1.5}\n.sc-review .dm{background:var(--night);border-radius:14px;padding:12px;display:flex;flex-direction:column;align-items:flex-start;gap:8px;margin-top:14px}\n.sc-review .bub{background:var(--panel2);border-radius:16px 16px 16px 4px;padding:10px 12px;font-size:14px;line-height:1.45;max-width:90%}\n.sc-review .qr{border:1px solid var(--blue);color:var(--blue);border-radius:999px;padding:7px 16px;font-size:13.5px;font-weight:600}\n.sc-review .num{display:flex;align-items:center;gap:8px}\n.sc-review .num button{width:46px;height:46px;border-radius:12px;border:1px solid var(--line);background:var(--panel2);color:var(--text);display:grid;place-items:center;cursor:pointer;flex:none}\n.sc-review .num .inp{width:72px;text-align:center;padding:0 6px;font-weight:600}\n.sc-review .slot{border-radius:14px;padding:12px}\n.sc-review .slot.empty{border:1.5px dashed #3B486B;display:flex;flex-direction:column;gap:10px}\n.sc-review .slot.empty p{margin:0;font-size:14px;color:var(--muted)}\n.sc-review .s-btns{display:flex;gap:8px}\n.sc-review .s-btns .btn2{flex:1;justify-content:center}\n.sc-review .btn2{border:1px solid var(--line);background:var(--panel2);color:var(--text);font-weight:600;font-size:14px;border-radius:12px;padding:0 14px;min-height:46px;cursor:pointer;display:inline-flex;align-items:center;gap:4px}\n.sc-review .btn2.blue{background:var(--blue);border-color:var(--blue);color:#0B1020}\n.sc-review .slot.filled{background:var(--night);border:1px solid var(--line);display:grid;grid-template-columns:auto 1fr;gap:4px 10px}\n.sc-review .slot.filled p{margin:0;font-size:14px;line-height:1.5}\n.sc-review .s-ico{color:var(--blue);margin-top:2px}\n.sc-review .s-act{grid-column:2;display:flex;gap:4px;margin-top:2px}\n.sc-review .s-act button{background:transparent;border:0;color:var(--blue);font-weight:600;font-size:14px;min-height:40px;padding:0 10px 0 0;cursor:pointer}\n.sc-review .s-act button:last-child{color:var(--muted)}\n.sc-review .clamp{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}\n.sc-review .clamp2{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}\n.sc-review .ed-foot{border-top:1px solid var(--line);background:var(--panel);padding:12px 16px 14px;display:flex;flex-direction:column;gap:10px}\n.sc-review .sum{margin:0;font-size:13.5px;line-height:1.5;color:#C9D1E6;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}\n.sc-review .sum.warn{color:var(--amber)}\n.sc-review .btns{display:flex;gap:10px}\n.sc-review .ghost{background:transparent;border:1px solid var(--line);color:var(--text);border-radius:14px;font-weight:600;font-size:15px;min-height:50px;padding:0 20px;cursor:pointer}\n.sc-review .primary{flex:1;background:var(--blue);color:#0B1020;border:0;border-radius:14px;font-weight:700;font-size:15px;min-height:50px;padding:0 18px;cursor:pointer}\n.sc-review .primary:disabled{background:var(--panel2);color:var(--muted);cursor:not-allowed}\n.sc-review .primary.wide{width:100%;margin-top:16px}\n.sc-review .scrim{position:absolute;inset:0;background:rgba(5,8,14,.62);display:flex;align-items:flex-end;z-index:5}\n.sc-review .sheet{width:100%;max-height:88%;overflow-y:auto;background:var(--panel);border-radius:26px 26px 0 0;border-top:1px solid var(--line);padding:8px 16px 20px;animation:up .24s ease-out;box-shadow:0 -16px 40px rgba(0,0,0,.4)}\n@keyframes up{from{transform:translateY(40px);opacity:.4}to{transform:none;opacity:1}}\n.sc-review .grab{width:40px;height:4px;border-radius:2px;background:var(--line);margin:4px auto 6px}\n.sc-review .sh-head{display:flex;align-items:center;justify-content:space-between}\n.sc-review .sh-head h2{margin:0;font-size:19px;font-weight:700}\n.sc-review .mlist{display:flex;flex-direction:column;gap:6px;margin-top:10px}\n.sc-review .mrow{display:flex;align-items:center;gap:10px;text-align:left;background:var(--night);border:1px solid var(--line);color:var(--text);border-radius:14px;padding:12px 14px;min-height:58px;font-size:14px;line-height:1.45;cursor:pointer}\n.sc-review .mrow > span{flex:1}\n.sc-review .mrow[aria-pressed=true]{border-color:var(--blue);background:rgba(91,140,255,.12)}\n.sc-review .mrow .tick{color:var(--blue);flex:none}\n.sc-review .add-new{width:100%;min-height:52px;margin-top:12px;border:1.5px dashed #3B486B;background:transparent;color:var(--blue);border-radius:14px;font-weight:700;font-size:15px;display:flex;align-items:center;justify-content:center;gap:8px;cursor:pointer}\n.sc-review .toast-wrap{position:absolute;left:0;right:0;bottom:130px;display:flex;justify-content:center;z-index:9;pointer-events:none}\n.sc-review .toast{background:var(--panel2);border:1px solid var(--line);color:var(--text);font-weight:600;font-size:14px;padding:10px 16px;border-radius:999px;display:flex;gap:6px;align-items:center;animation:up .2s ease-out}\n.sc-review .toast.ok{background:var(--mint);border-color:var(--mint);color:#062015;font-weight:700}\n.sc-review .mtxt{display:flex;flex-direction:column;gap:2px;min-width:0}\n.sc-review .mtxt b{font-size:15px;font-weight:600}\n.sc-review .mtxt small{font-size:13px;color:var(--muted);font-weight:400;line-height:1.4}\n.sc-review .chips{display:flex;gap:8px;overflow-x:auto;margin:14px -16px 12px;padding:0 16px 2px}\n.sc-review .chipb{flex:none;min-height:40px;padding:0 14px;border-radius:999px;border:1px solid var(--line);background:var(--panel);color:var(--muted);font-size:13.5px;font-weight:600;cursor:pointer;white-space:nowrap;display:inline-flex;align-items:center;gap:6px}\n.sc-review .chipb[aria-pressed=true]{border-color:var(--blue);background:rgba(91,140,255,.12);color:var(--text)}\n.sc-review .add-new.solid{margin-top:4px;background:rgba(91,140,255,.1);border:1px solid rgba(91,140,255,.35)}\n.sc-review .mopt{display:flex;align-items:center;gap:12px;width:100%;text-align:left;background:var(--panel);border:1px solid var(--line);color:var(--text);border-radius:16px;padding:12px 14px;min-height:66px;cursor:pointer;margin-bottom:8px}\n.sc-review .mopt[aria-pressed=true]{border-color:var(--blue);background:rgba(91,140,255,.12)}\n.sc-review .mopt .mtxt{flex:1}\n.sc-review .mopt .tick{color:var(--blue);flex:none}\n.sc-review .none2{text-align:center;color:var(--muted);font-size:14px;margin:24px 0}\n.sc-review .chan-chip{display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:0 10px 0 6px;border-radius:999px;border:1px solid var(--line);background:var(--panel);color:var(--text);font-size:14px;font-weight:600;cursor:pointer;max-width:170px}\n.sc-review .chan-chip .cname{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.sc-review .chan-chip .chv{color:var(--muted);flex:none}\n.sc-review .chan-chip.wide{width:100%;max-width:none;justify-content:flex-start;padding:8px 14px 8px 8px;min-height:58px;border-radius:16px;font-size:15.5px}\n.sc-review .chan-chip.wide .cname{flex:1;text-align:left}\n.sc-review .cav{width:32px;height:32px;border-radius:50%;display:grid;place-items:center;font-weight:700;font-size:14px;background:hsl(var(--h,220) 38% 26%);color:#E6ECFA;flex:none;position:relative}\n.sc-review .cav.lg{width:40px;height:40px;font-size:16px}\n.sc-review .cav .warn-dot{position:absolute;right:-1px;bottom:-1px;width:11px;height:11px;border-radius:50%;background:var(--amber);border:2px solid var(--panel)}\n.sc-review .crow{width:100%;display:flex;align-items:center;gap:12px;text-align:left;background:var(--night);border:1px solid var(--line);color:var(--text);border-radius:14px;padding:10px 14px;min-height:64px;cursor:pointer;margin-top:8px}\n.sc-review .crow[aria-pressed=true]{border-color:var(--blue);background:rgba(91,140,255,.12)}\n.sc-review .crow .ct{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}\n.sc-review .crow b{font-size:15.5px;font-weight:600}\n.sc-review .crow small{font-size:13px;color:var(--muted)}\n.sc-review .crow small.warn{color:var(--amber)}\n.sc-review .crow .tick{color:var(--blue);flex:none}\n.sc-review .crow.addc{border:1.5px dashed #3B486B;background:transparent;color:var(--blue);font-weight:700;justify-content:center;gap:8px}\n.sc-review .sh-link{background:transparent;border:0;color:var(--blue);font-weight:600;font-size:14.5px;min-height:44px;cursor:pointer;padding:0 4px;margin-top:6px}\n.sc-review .chan-banner{display:flex;align-items:center;gap:12px;margin:12px 16px 0;padding:12px 12px 12px 14px;border-left:3px solid var(--amber);background:rgba(255,180,84,.08);border-radius:4px 14px 14px 4px}\n.sc-review .chan-banner.inline{margin:10px 0 0}\n.sc-review .chan-banner p{margin:0;flex:1;font-size:13.5px;line-height:1.45;color:#FFE3BC}\n.sc-review .chan-banner button{flex:none;min-height:40px;border-radius:12px;border:1px solid rgba(255,180,84,.5);background:transparent;color:var(--amber);font-weight:700;font-size:14px;padding:0 14px;cursor:pointer}\n.sc-review .chan-field{margin-bottom:14px}\n.sc-review .lab.first{margin-top:0}\n.sc-review .row-hdr{display:flex;align-items:center;justify-content:space-between;gap:10px}\n.sc-review .hdr-r{display:flex;align-items:center;gap:2px}\n.sc-review .icon-btn.sm{width:40px;height:40px;border-radius:12px;color:var(--muted)}\n.sc-review .scrim{position:absolute;inset:0;background:rgba(5,8,14,.62);display:flex;align-items:flex-end;z-index:5}\n.sc-review .sheet{width:100%;max-height:88%;overflow-y:auto;background:var(--panel);border-radius:26px 26px 0 0;border-top:1px solid var(--line);padding:8px 16px 20px;animation:up .24s ease-out;box-shadow:0 -16px 40px rgba(0,0,0,.4)}\n.sc-review .grab{width:40px;height:4px;border-radius:2px;background:var(--line);margin:4px auto 6px}\n.sc-review .sh-head{display:flex;align-items:center;justify-content:space-between;gap:8px}\n.sc-review .sh-head h2{margin:0;font-size:19px;font-weight:700}\n.sc-review .sk{display:block;background:linear-gradient(90deg,var(--panel2) 0%,#27324C 50%,var(--panel2) 100%);background-size:200% 100%;animation:shimmer 1.4s ease-in-out infinite}\n.sc-review .skcard{background:var(--panel);border:1px solid var(--line);border-radius:20px;padding:16px;display:flex;flex-direction:column;gap:12px}\n.sc-review .skrow{display:flex;align-items:center;gap:12px}\n.sc-review .errcard{display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px;padding:32px 20px;background:var(--panel);border:1px dashed #3B486B;border-radius:20px}\n.sc-review .errcard .eico{width:52px;height:52px;border-radius:50%;background:rgba(255,180,84,.14);color:var(--amber);display:grid;place-items:center;margin-bottom:6px}\n.sc-review .errcard h3{margin:0;font-size:17px}\n.sc-review .errcard p{margin:0 0 10px;font-size:14px;line-height:1.5;color:var(--muted);max-width:280px}\n.sc-review .errcard .retry{min-height:44px;border-radius:12px;border:1px solid var(--line);background:var(--panel2);color:var(--text);font-weight:700;font-size:14.5px;padding:0 18px;cursor:pointer;display:inline-flex;align-items:center;gap:8px}\n.sc-review .bspin{width:18px;height:18px;border-radius:50%;border:2.5px solid rgba(11,16,32,.25);border-top-color:#0B1020;animation:spinr .8s linear infinite;flex:none}\n.sc-review .inline-err{display:flex;align-items:flex-start;gap:8px;font-size:13.5px;line-height:1.45;color:var(--amber);margin:0}\n.sc-review .inline-err svg{flex:none;margin-top:2px}\n.sc-review .ubar{display:block;height:4px;border-radius:2px;background:var(--panel2);overflow:hidden;margin-top:6px}\n.sc-review .ubar i{display:block;height:100%;width:0;background:var(--blue);animation:fillbar linear forwards}\n.sc-review .fitem .rt small.bad{color:var(--amber)}\n.sc-review .retry-link{background:transparent;border:0;color:var(--blue);font-weight:700;font-size:13.5px;min-height:40px;padding:0 8px;cursor:pointer}\n.sc-review .primary .bspin{margin-right:2px}\n.sc-review .metanote{display:flex;gap:8px;align-items:flex-start;font-size:13px;line-height:1.5;color:var(--muted);margin:14px 0 0}\n.sc-review .metanote svg{flex:none;margin-top:2px;color:var(--blue)}\n.sc-review .metanote.warn{color:#FFE3BC}\n.sc-review .metanote.warn svg{color:var(--amber)}\n.sc-review .chipset{display:flex;flex-wrap:wrap;gap:6px}\n.sc-review .chipset button{min-height:40px;padding:0 14px;border-radius:999px;border:1px solid var(--line);background:var(--night);color:var(--muted);font-size:13.5px;font-weight:600;cursor:pointer}\n.sc-review .chipset button[aria-pressed=true]{border-color:var(--blue);background:rgba(91,140,255,.12);color:var(--text)}\n.sc-review .sw:disabled{opacity:.4;cursor:not-allowed}\n.sc-review .stepper{padding-left:14px;padding-right:14px}\n.sc-review .st{width:64px}\n.sc-review .st span{font-size:11.5px}\n.sc-review .card.auto.clickable,.sc-review .card.msg.clickable{cursor:pointer}\n.sc-review .row2{display:flex;align-items:center;justify-content:space-between;gap:8px}\n.sc-review .text-btn{background:transparent;border:0;color:var(--blue);font-weight:600;font-size:14px;min-height:40px;padding:0 6px;cursor:pointer;display:inline-flex;align-items:center;gap:6px}\n.sc-review .big-warn{width:68px;height:68px;border-radius:50%;background:rgba(255,180,84,.14);color:var(--amber);display:grid;place-items:center}\n.sc-review .rpad{padding:12px 16px 28px;display:flex;flex-direction:column;gap:12px}\n.sc-review .rcard{background:var(--panel);border:1px solid var(--line);border-radius:20px;padding:14px 16px}\n.sc-review .rcard h2{margin:0;font-size:15.5px;font-weight:700}\n.sc-review .rhead{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px}\n.sc-review .text-btn{background:transparent;border:0;color:var(--blue);font-weight:600;font-size:14px;min-height:40px;padding:0 4px;cursor:pointer}\n.sc-review .chrow{display:flex;align-items:center;gap:12px;margin-top:12px;min-width:0}\n.sc-review .chrow b{display:block;font-size:15px;font-weight:600}\n.sc-review .chrow small{font-size:13px;color:var(--muted)}\n.sc-review .chrow small.warn{color:var(--amber)}\n.sc-review .chrow .grow{flex:1;min-width:0}\n.sc-review .rtabs{display:flex;gap:6px;overflow-x:auto;margin:8px -2px 12px;padding:0 2px 2px}\n.sc-review .rtabs button{flex:none;min-height:38px;padding:0 12px;border-radius:999px;border:1px solid var(--line);background:var(--night);color:var(--muted);font-size:13px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:6px;white-space:nowrap}\n.sc-review .rtabs button[aria-pressed=true]{border-color:var(--blue);background:rgba(91,140,255,.12);color:var(--text)}\n.sc-review .gate{font-size:13px;line-height:1.45;color:#FFD9A6;background:rgba(255,180,84,.08);border-left:3px solid var(--amber);border-radius:4px 12px 12px 4px;padding:8px 10px;margin-bottom:10px}\n.sc-review .gate.all{color:var(--muted);background:var(--night);border-left-color:var(--line)}\n.sc-review .chatp{background:#0A0E17;border:1px solid var(--line);border-radius:18px;padding:14px;display:flex;flex-direction:column;gap:10px}\n.sc-review .cin{display:flex;flex-direction:column;align-items:flex-end;gap:4px}\n.sc-review .cout{display:flex;flex-direction:column;align-items:flex-start;gap:4px}\n.sc-review .clab{font-size:11.5px;color:var(--muted);font-weight:600}\n.sc-review .bub{max-width:84%;border-radius:18px;padding:10px 14px;font-size:14.5px;line-height:1.45;overflow-wrap:anywhere;white-space:pre-wrap}\n.sc-review .bub.me{background:var(--blue);color:#0B1020}\n.sc-review .bub.bot{background:#262F45}\n.sc-review .bub.ph{color:var(--muted);font-style:italic}\n.sc-review .bub.tap{background:transparent;border:1px solid var(--blue);color:#8FB0FF;font-weight:600;font-size:13.5px}\n.sc-review .react{display:inline-flex;align-items:center;gap:4px;font-size:12px;color:#FF8FA3}\n.sc-review .cmt{display:flex;gap:10px;align-items:flex-start;background:#171E2E;border:1px solid var(--line);border-radius:14px;padding:10px 12px;max-width:92%;align-self:flex-end;width:100%}\n.sc-review .cmt b{font-size:13.5px}\n.sc-review .cmt p{margin:2px 0 0;font-size:14px;line-height:1.4}\n.sc-review .cmt .cav{width:28px;height:28px;font-size:12px}\n.sc-review .pub{margin-left:38px;background:#1E2739;border-radius:12px;padding:8px 10px;font-size:13.5px;line-height:1.4;max-width:88%}\n.sc-review .pub small{display:block;color:var(--muted);font-size:11.5px;margin-bottom:2px;font-weight:600}\n.sc-review .gapl{align-self:center;font-size:11.5px;font-weight:600;color:var(--muted);background:var(--panel2);border-radius:999px;padding:4px 12px;text-align:center}\n.sc-review .mv{display:flex;flex-direction:column;align-items:flex-start;gap:6px;max-width:100%}\n.sc-review .mtag{font-size:11.5px;color:var(--muted)}\n.sc-review .bbtns{display:flex;flex-direction:column;gap:4px;width:min(84%,260px)}\n.sc-review .bbtn{background:#262F45;border-radius:14px;padding:10px;text-align:center;color:#8FB0FF;font-weight:600;font-size:14px}\n.sc-review .qrow{display:flex;flex-wrap:wrap;gap:6px}\n.sc-review .qpill{border:1px solid #6E97FF;color:#8FB0FF;border-radius:999px;padding:7px 13px;font-size:13px;font-weight:600}\n.sc-review .gscroll{display:flex;gap:8px;overflow-x:auto;max-width:100%;padding-bottom:4px}\n.sc-review .gcard{flex:none;width:190px;background:#262F45;border-radius:16px;overflow:hidden}\n.sc-review .gimg{width:100%;height:100px;object-fit:cover;display:block}\n.sc-review .gbody{padding:10px 12px;display:flex;flex-direction:column;gap:2px}\n.sc-review .gbody b{font-size:14px}\n.sc-review .gbody span{font-size:12.5px;color:#B9C3DB}\n.sc-review .gcard .gb{border-top:1px solid #34405D;text-align:center;padding:9px 8px;color:#8FB0FF;font-weight:600;font-size:13.5px}\n.sc-review .mfile{display:flex;align-items:center;gap:10px;background:#262F45;border-radius:14px;padding:10px 14px 10px 10px}\n.sc-review .mfile .fic{width:38px;height:38px;border-radius:10px;background:rgba(91,140,255,.16);color:var(--blue);display:grid;place-items:center}\n.sc-review .mimgs{display:grid;grid-template-columns:repeat(2,1fr);gap:4px;width:min(84%,240px)}\n.sc-review .mimgs img{width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:12px}\n.sc-review .cnote{font-size:12px;color:var(--muted);text-align:center;line-height:1.4;padding:0 10px}\n.sc-review .tsec{padding:12px 0;border-top:1px solid var(--line)}\n.sc-review .tsec:first-of-type{border-top:0}\n.sc-review .th{display:flex;align-items:center;gap:10px;font-size:15px}\n.sc-review .th svg{color:var(--blue);flex:none}\n.sc-review .chipsrow{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}\n.sc-review .cchip{font-size:12.5px;background:rgba(255,180,84,.14);color:#FFD9A6;border-radius:999px;padding:4px 10px}\n.sc-review .pchip{font-size:12.5px;background:var(--panel2);color:#C4CCE0;border-radius:999px;padding:4px 10px}\n.sc-review .none{margin:8px 0 0;font-size:13.5px;color:var(--muted);line-height:1.5}\n.sc-review .scope{margin:10px 0 0;font-size:13.5px;color:var(--muted)}\n.sc-review .scope b{color:var(--text);font-weight:600}\n.sc-review .xrow{display:flex;gap:12px;align-items:flex-start;padding:12px 0;border-top:1px solid var(--line)}\n.sc-review .xrow:first-of-type{border-top:0}\n.sc-review .xrow .ico{width:36px;height:36px;border-radius:11px;background:rgba(91,140,255,.14);color:var(--blue);display:grid;place-items:center;flex:none}\n.sc-review .xrow b{display:block;font-size:15px;font-weight:600}\n.sc-review .xrow small{display:block;font-size:13px;color:var(--muted);line-height:1.45;margin-top:2px}\n.sc-review .xrow small.q{color:#C4CCE0}\n.sc-review .chk{display:flex;gap:10px;align-items:flex-start;padding:10px 0;border-top:1px solid var(--line);font-size:14px;line-height:1.45}\n.sc-review .chk:first-of-type{border-top:0}\n.sc-review .chk svg{flex:none;margin-top:2px}\n.sc-review .chk.ok svg{color:var(--mint)}\n.sc-review .chk.warn svg{color:var(--amber)}\n.sc-review .chk.info svg{color:var(--blue)}\n.sc-review .chk.warn{color:#FFE3BC}\n.sc-review .mcard{display:flex;gap:12px;align-items:flex-start;margin-top:8px}\n.sc-review .mcard b{display:block;font-size:15px}\n.sc-review .mcard small{font-size:13px;color:var(--muted)}\n";

const TRI = {
  direct: { label: "Direct message", icon: Send, noun: "message" },
  story: { label: "Story reply", icon: Reply, noun: "reply" },
  share: { label: "Media share", icon: Share2, noun: "share" },
  comment: { label: "Comment", icon: MessageCircle, noun: "comment" },
};
const OPL = { eq: "Equals", contains: "Contains", starts: "Starts with" };
const MTL = { generic: "Generic", text: "Text", media: "Media", button: "Button & text", quick: "Quick reply" };
const XI = {
  follow: { title: "Follow prompt", icon: UserPlus },
  reminder: { title: "Reminder", icon: Bell },
  limit: { title: "Reply limit", icon: Hourglass },
  comment: { title: "Public comment reply", icon: Reply },
  like: { title: "Like their message", icon: Heart },
  notice: { title: "Automated notice", icon: Bot },
  handoff: { title: "Talk to a human", icon: Headphones },
};
const ORDER = ["follow", "reminder", "limit", "comment", "like", "notice", "handoff"];
const ME = "Sara";
const fillName = (t) => (t || "").replace(/\{first_name\}/g, ME).replace(/\{username\}/g, "@sara_k");
const hrs = (n) => `${n} ${n === 1 ? "hour" : "hours"}`;

function contentOf(m) {
  if (!m) return null;
  if (m.content) return m.content;
  if (m.type === "generic") return { cards: [{ title: m.name, subtitle: m.preview, buttons: [] }] };
  if (m.type === "media") return { kind: "file", names: [m.preview] };
  return { text: m.preview, buttons: [], replies: [] };
}

function MsgView({ m, prefix, addButtons, tag }) {
  const c = contentOf(m);
  if (!m || !c) return <div className="bub bot ph">No message chosen yet</div>;
  const extra = addButtons || [];
  return (
    <div className="mv">
      {tag && <span className="mtag">{tag}</span>}
      {m.type === "generic" ? (
        <>
          {prefix && <div className="bub bot" dir="auto">{prefix}</div>}
          <div className="gscroll">
            {c.cards.map((cd, i) => (
              <div className="gcard" key={i}>
                {cd.image && <img className="gimg" src={cd.image} alt="" />}
                <div className="gbody"><b dir="auto">{cd.title}</b>{cd.subtitle && <span dir="auto">{cd.subtitle}</span>}</div>
                {[...(cd.buttons || []), ...(i === 0 ? extra : [])].slice(0, 3).map((b, j) => <div className="gb" key={j} dir="auto">{b}</div>)}
              </div>
            ))}
          </div>
        </>
      ) : m.type === "media" ? (
        <>
          {prefix && <div className="bub bot" dir="auto">{prefix}</div>}
          {c.kind === "image" && c.urls && c.urls.length > 0 ? (
            <div className="mimgs">{c.urls.map((u, i) => <img key={i} src={u} alt="" />)}</div>
          ) : (
            (c.names || []).map((n, i) => {
              const Ic = c.kind === "video" ? Video : c.kind === "audio" ? Music : FileText;
              return <div className="mfile" key={i}><span className="fic"><Ic size={20} /></span><span dir="auto">{n}</span></div>;
            })
          )}
          {extra.length > 0 && <div className="bbtns">{extra.map((b, i) => <div className="bbtn" key={i} dir="auto">{b}</div>)}</div>}
        </>
      ) : (
        <>
          <div className="bub bot" dir="auto">{(prefix ? prefix + "\n\n" : "") + fillName(c.text)}</div>
          {[...(c.buttons || []), ...extra].length > 0 && (
            <div className="bbtns">{[...(c.buttons || []), ...extra].slice(0, 3).map((b, i) => <div className="bbtn" key={i} dir="auto">{b}</div>)}</div>
          )}
          {(c.replies || []).length > 0 && <div className="qrow">{c.replies.map((r, i) => <span className="qpill" key={i} dir="auto">{r}</span>)}</div>}
        </>
      )}
    </div>
  );
}

function ReviewScreen(props) {
  const { s1, s3, msgs, chosen, channel, triggers } = props;
  const net = useContext(NetCtx);
  const [scn, setScn] = useState(null);
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState(null);
  const ex = s3 ? s3.on : {};
  const sel = (s3 && s3.sel) || {};
  const rules = (s1 && s1.rules) || {};
  const scope = (s1 && s1.scope) || {};
  const picks = (s1 && s1.picks) || {};
  const byId = (id) => msgs.find((m) => m.id === id) || null;
  const main = byId(chosen);
  const active = scn && triggers.includes(scn) ? scn : triggers[0];
  const extrasOn = ORDER.filter((k) => ex[k]);
  const hasComment = triggers.includes("comment");
  const nameOk = props.name.trim().length > 0;

  const gateFor = (t) => {
    const rs = rules[t] || [];
    if (t === "share") return null;
    return rs.length ? rs.map((r) => `${OPL[r.op].toLowerCase()} “${r.v}”`) : null;
  };

  const flowFor = (t) => {
    const out = [];
    const isComment = t === "comment";
    const rs = rules[t] || [];
    const first = rs[0];
    const text = t === "share" ? "Shared a post from your account" : first ? (first.op === "contains" ? `Hi, ${first.v}?` : first.v) : "Hi!";
    const label = t === "direct" ? "They send a direct message" : t === "story" ? "They reply to your story" : t === "comment" ? "They comment on your post" : "They share your post";
    const noticeText = ex.notice && s3 && s3.notice ? s3.notice : "";
    const handoff = ex.handoff && s3 ? [s3.handoffLabel] : [];
    out.push({ k: "in", label, text, comment: isComment, react: !!ex.like && !isComment });
    if (isComment && ex.comment) {
      const pm = byId(sel.comment);
      out.push({ k: "public", text: pm ? fillName(contentOf(pm).text || pm.name) : "Your public reply" });
    }
    if (ex.follow && s3 && s3.follow) {
      out.push({
        k: "out",
        when: isComment ? "Private reply (the one message)" : "Right away",
        m: { type: "button", name: "Follow prompt", content: { text: s3.follow.msg, buttons: [s3.follow.btn] } },
        prefix: noticeText,
      });
      out.push({ k: "tap", text: s3.follow.btn });
      out.push({ k: "out", when: "After they tap, if they follow you", m: main, prefix: "", add: handoff });
    } else {
      out.push({ k: "out", when: isComment ? "Private reply (one message)" : "Right away", m: main, prefix: noticeText, add: handoff });
    }
    if (!isComment && ex.reminder && s3) {
      out.push({ k: "gap", text: `If they don’t reply within ${hrs(s3.reminderH || 3)}` });
      out.push({ k: "out", m: byId(sel.reminder), prefix: "" });
    }
    if (ex.limit && s3) {
      out.push({ k: "gap", text: `After ${s3.limitN || 3} replies to the same person` });
      out.push({ k: "out", m: byId(sel.limit), prefix: "" });
    }
    if (ex.handoff && s3) out.push({ k: "note", text: `Tapping “${s3.handoffLabel}” pauses automations for that person for ${s3.pauseD || 1} ${(s3.pauseD || 1) === 1 ? "day" : "days"} and notifies you.` });
    if (isComment && (ex.reminder || ex.like)) out.push({ k: "note", text: "Reminder and like don’t apply to comments." });
    return out;
  };

  const checks = [];
  if (channel && channel.status === "reconnect") checks.push({ l: "warn", t: `${channel.name} needs to reconnect. The automation can’t send until you do.` });
  if (channel && channel.status === "expiring") checks.push({ l: "warn", t: `${channel.name}’s connection expires in ${channel.days} days. Renew it to keep replies running.` });
  triggers.forEach((t) => {
    if (t !== "share" && !(rules[t] || []).length) checks.push({ l: "info", t: `Every ${TRI[t].noun} on this trigger gets a reply, because there are no text rules.` });
  });
  if (hasComment && main && main.type !== "text") checks.push({ l: "warn", t: "Comments get one private reply. Meta documents text for it, so test this message type on a test account." });
  if (hasComment && ex.notice && main && (main.type === "generic" || main.type === "media")) checks.push({ l: "warn", t: "The automated notice can’t go inside a card or media message, so it needs a separate message. Comments allow only one private reply." });
  if (triggers.includes("share") && (scope.share === "selected")) checks.push({ l: "warn", t: "Instagram sends only a link to a shared post, so matching your selected posts depends on that link. Test with a real share." });
  if (ex.reminder && s3) checks.push({ l: "ok", t: `The reminder goes out ${hrs(s3.reminderH || 3)} after their last message, inside Instagram’s 24-hour window.` });
  if (ex.follow) checks.push({ l: "ok", t: "Follow status is checked after they tap the button, when Instagram allows it." });
  if (ex.notice) checks.push({ l: "ok", t: "The automated notice tells people they’re talking to an automated service." });
  if (ex.handoff) checks.push({ l: "info", t: "Replying by hand more than 24 hours after their last message needs Meta’s Human Agent approval." });
  checks.push({ l: "ok", t: "Replies go out only after someone messages you or comments, as Instagram requires." });

  const go = (paused) => {
    setBusy(paused ? "paused" : "activate");
    setErr(null);
    net.call(1200).then(
      () => {
        setBusy(null);
        props.onFinish(paused);
      },
      (e) => {
        setBusy(null);
        setErr({ ...e, paused });
      }
    );
  };

  const flow = active ? flowFor(active) : [];
  const gate = active ? gateFor(active) : null;
  const scopeText = (t) => {
    if (t === "direct") return null;
    const noun = t === "story" ? ["story", "stories"] : ["post", "posts"];
    if (scope[t] === "selected") {
      const ids = picks[t] || [];
      return { sel: true, label: `${ids.length} selected ${ids.length === 1 ? noun[0] : noun[1]}`, chips: ids.map((i) => `${noun[0][0].toUpperCase() + noun[0].slice(1)} ${i}`) };
    }
    return { sel: false, label: `Any ${noun[0]}`, chips: [] };
  };

  return (
    <div className="sc-review screen">
      <style>{CSS}</style>
      <div className="ed-top">
        <button type="button" className="icon-btn" aria-label="Back" onClick={() => props.onBack()}><ChevronLeft size={26} /></button>
        <h1>Review and activate</h1>
      </div>

      <div className="stepper" aria-label="Step 4 of 4">
        <div className="st done"><i><Check size={16} strokeWidth={3} /></i><span>Conditions</span></div>
        <b className="ln done" />
        <div className="st done"><i><Check size={16} strokeWidth={3} /></i><span>Message</span></div>
        <b className="ln done" />
        <div className="st done"><i><Check size={16} strokeWidth={3} /></i><span>Extras</span></div>
        <b className="ln done" />
        <div className="st active" aria-current="step"><i>4</i><span>Review</span></div>
      </div>

      <div className="scr">
        <div className="rpad">
          <section className="rcard">
            <label className="field" style={{ marginTop: 0 }}>
              Name
              <input className="inp" dir="auto" value={props.name} onChange={(e) => props.setName(e.target.value)} />
            </label>
            {channel && (
              <div className="chrow">
                <ChannelAvatar ch={channel} />
                <div className="grow">
                  <b>{channel.name}</b>
                  <small className={channel.status === "ok" ? "" : "warn"}>{channel.status === "ok" ? "Connected" : channel.status === "expiring" ? `Expires in ${channel.days} days` : "Reconnect needed"}</small>
                </div>
                <button type="button" className="text-btn" onClick={() => props.onEdit(1)}>Change</button>
              </div>
            )}
          </section>

          <section className="rcard">
            <div className="rhead"><h2>Preview</h2></div>
            <p className="none" style={{ margin: "0 0 8px" }}>What {ME} would see. Pick a trigger to see that path.</p>
            {triggers.length > 1 && (
              <div className="rtabs" role="group" aria-label="Preview trigger">
                {triggers.map((t) => {
                  const T = TRI[t];
                  return <button key={t} type="button" aria-pressed={active === t} onClick={() => setScn(t)}><T.icon size={14} />{T.label}</button>;
                })}
              </div>
            )}
            {active && (
              <div className={"gate" + (gate ? "" : " all")}>
                {gate ? `Runs only if the text ${gate.join(" or ")}.` : `Runs for every ${TRI[active].label.toLowerCase()}.`}
              </div>
            )}
            <div className="chatp" aria-label="Preview conversation">
              {flow.map((b, i) => {
                if (b.k === "in") {
                  return (
                    <div className="cin" key={i}>
                      <span className="clab">{b.label}</span>
                      {b.comment ? (
                        <div className="cmt"><span className="cav" style={{ "--h": 215 }} aria-hidden="true">S</span><div><b>sara_k</b><p dir="auto">{b.text}</p></div></div>
                      ) : (
                        <div className="bub me" dir="auto">{b.text}</div>
                      )}
                      {b.react && <span className="react"><Heart size={12} /> Liked by your account</span>}
                    </div>
                  );
                }
                if (b.k === "public") return <div className="pub" key={i}><small>Your public reply</small><span dir="auto">{b.text}</span></div>;
                if (b.k === "tap") return <div className="cin" key={i}><div className="bub tap" dir="auto">Taps “{b.text}”</div></div>;
                if (b.k === "gap") return <span className="gapl" key={i}>{b.text}</span>;
                if (b.k === "note") return <p className="cnote" key={i}>{b.text}</p>;
                return (
                  <div className="cout" key={i}>
                    {b.when && <span className="clab">{b.when}</span>}
                    <MsgView m={b.m} prefix={b.prefix} addButtons={b.add} />
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rcard">
            <div className="rhead"><h2>Triggers and conditions</h2><button type="button" className="text-btn" onClick={() => props.onEdit(1)}>Edit</button></div>
            {triggers.map((t) => {
              const T = TRI[t];
              const rs = rules[t] || [];
              const sc = scopeText(t);
              return (
                <div className="tsec" key={t}>
                  <div className="th"><T.icon size={18} /><b>{T.label}</b></div>
                  {t !== "share" && (rs.length ? (
                    <>
                      <div className="chipsrow">{rs.map((r) => <span className="cchip" key={r.id} dir="auto">{OPL[r.op]} “{r.v}”</span>)}</div>
                      {rs.length > 1 && <p className="none">A {TRI[t].noun} needs to match any one of these rules.</p>}
                    </>
                  ) : (
                    <p className="none">No text rules. Every {TRI[t].noun} gets a reply.</p>
                  ))}
                  {sc && (
                    <>
                      <p className="scope">Which {t === "story" ? "stories" : "posts"}: <b>{sc.label}</b></p>
                      {sc.chips.length > 0 && <div className="chipsrow">{sc.chips.map((c) => <span className="pchip" key={c}>{c}</span>)}</div>}
                    </>
                  )}
                </div>
              );
            })}
          </section>

          <section className="rcard">
            <div className="rhead"><h2>Message</h2><button type="button" className="text-btn" onClick={() => props.onEdit(2)}>Edit</button></div>
            {main ? (
              <>
                <div className="mcard"><div><b dir="auto">{main.name}</b><small>{MTL[main.type]} message</small></div></div>
                <div className="chatp" style={{ marginTop: 10 }}><div className="cout"><MsgView m={main} /></div></div>
              </>
            ) : (
              <p className="none">No message chosen.</p>
            )}
          </section>

          {extrasOn.length > 0 && (
            <section className="rcard">
              <div className="rhead"><h2>Extras</h2><button type="button" className="text-btn" onClick={() => props.onEdit(3)}>Edit</button></div>
              {extrasOn.map((k) => {
                const x = XI[k];
                const lines = [];
                if (k === "follow" && s3 && s3.follow) lines.push([`Message: “${s3.follow.msg}”`, true], [`Button: “${s3.follow.btn}”`, true], ["Checked after they tap.", false]);
                if (k === "reminder" && s3) {
                  const rm = byId(sel.reminder);
                  lines.push([`Sent ${hrs(s3.reminderH || 3)} after their last message if they don’t reply.`, false], [rm ? `Message: ${rm.name}` : "No message chosen", true]);
                }
                if (k === "limit" && s3) {
                  const lm = byId(sel.limit);
                  lines.push([`Stops after ${s3.limitN || 3} ${(s3.limitN || 3) === 1 ? "reply" : "replies"} to the same person.`, false], [lm ? `Message at the limit: ${lm.name}` : "No message chosen", true]);
                }
                if (k === "comment") {
                  const cm = byId(sel.comment);
                  lines.push(["Also answers publicly under the comment.", false], [cm ? `Message: ${cm.name}` : "No message chosen", true]);
                }
                if (k === "like") lines.push(["Likes their message when you reply.", false]);
                if (k === "notice" && s3) lines.push([`“${s3.notice}”`, true], ["Added to the start of the first message.", false]);
                if (k === "handoff" && s3) lines.push([`Button: “${s3.handoffLabel}”`, true], [`Pauses automations for that person for ${s3.pauseD || 1} ${(s3.pauseD || 1) === 1 ? "day" : "days"}. You get a notification.`, false]);
                return (
                  <div className="xrow" key={k}>
                    <span className="ico"><x.icon size={18} /></span>
                    <div>
                      <b>{x.title}</b>
                      {lines.map(([t, q], i) => <small className={q ? "q" : ""} key={i} dir="auto">{t}</small>)}
                    </div>
                  </div>
                );
              })}
            </section>
          )}

          <section className="rcard">
            <div className="rhead"><h2>Checks</h2></div>
            {checks.map((c, i) => (
              <div className={"chk " + c.l} key={i}>
                {c.l === "ok" ? <Check size={16} strokeWidth={3} /> : c.l === "warn" ? <AlertTriangle size={16} /> : <Info size={16} />}
                <span>{c.t}</span>
              </div>
            ))}
          </section>
        </div>
      </div>

      <footer className="ed-foot">
        {err ? (
          <p className="inline-err" role="alert"><AlertTriangle size={16} /><span>{err.kind === "offline" ? "You’re offline. Your automation is kept. Try again when you’re back online." : "Couldn’t save the automation. Everything is kept. Try again."}</span></p>
        ) : (
          <p className={"sum" + (nameOk ? "" : " warn")} aria-live="polite">{nameOk ? (channel && channel.status === "reconnect" ? "It will start replying once the channel is reconnected." : "It starts replying right away.") : "Give the automation a name."}</p>
        )}
        <div className="btns">
          <button type="button" className="ghost" disabled={!!busy} onClick={() => props.onBack()}>Back</button>
          <button type="button" className="primary" disabled={!nameOk || !!busy} onClick={() => go(false)}>
            {busy === "activate" ? (<><span className="bspin" /> Activating…</>) : err && !err.paused ? "Try again" : "Activate"}
          </button>
        </div>
        <button type="button" className="text-btn" style={{ alignSelf: "center" }} disabled={!nameOk || !!busy} onClick={() => go(true)}>
          {busy === "paused" ? "Saving…" : err && err.paused ? "Try saving again" : "Save without activating"}
        </button>
      </footer>
    </div>
  );
}

return { Component: ReviewScreen };

})();

/* ═════════ App shell ═════════ */

const OPL = { eq: "Equals", contains: "Contains", starts: "Starts with" };
let _sid = 1000;
const sid = () => ++_sid;

function buildAutomation(s1, s3, msg, n, channelId, name, paused) {
  const triggers = ["direct", "story", "share", "comment"].filter((k) => s1 && s1.on[k]);
  const chips = [];
  triggers.forEach((k) => {
    ((s1.rules || {})[k] || []).forEach((r) => {
      const c = `${OPL[r.op]} “${r.v}”`;
      if (!chips.includes(c)) chips.push(c);
    });
  });
  const extras = s3 ? Object.keys(s3.on).filter((k) => s3.on[k]) : [];
  return {
    id: sid(),
    channelId,
    name: (name || "").trim() || `Automation #${n}`,
    when: "just now",
    on: !paused,
    triggers,
    types: msg ? [msg.type] : [],
    extras,
    conds: chips.slice(0, 3),
    stats: [0, 0, 0],
    config: {
      rules: s1 ? s1.rules : {},
      scope: s1 ? s1.scope : {},
      picks: s1 ? s1.picks : {},
      msgId: msg ? msg.id : null,
      extras: s3 ? { reminderH: s3.reminderH, limitN: s3.limitN, notice: s3.notice, handoffLabel: s3.handoffLabel, pauseD: s3.pauseD, follow: s3.follow, sel: s3.sel } : {},
    },
  };
}

function Pane({ show, children }) {
  return <div className="pane" style={{ display: show ? "flex" : "none" }}>{children}</div>;
}

function Wizard({ msgs, preselect, onClose, onCreate, onFinish, count, channels, initialChannel }) {
  const [step, setStep] = useState(1);
  const [chId, setChId] = useState(initialChannel);
  const [name, setName] = useState(`Automation #${count + 1}`);
  const [s1, setS1] = useState(null);
  const [s3, setS3] = useState(null);
  const [chosen, setChosen] = useState(null);
  const S1 = Step1Mod.Component;
  const S3 = Step3Mod.Component;
  const S2 = Step2Mod.Component;
  const R4 = ReviewMod.Component;

  useEffect(() => {
    if (preselect && preselect.target === "main") {
      setChosen(preselect.id);
      setStep(2);
    }
  }, [preselect && preselect.n]);

  const msg = msgs.find((m) => m.id === chosen) || null;
  const tkey = ["direct", "story", "share", "comment"].filter((k) => s1 && s1.on[k]).join(",");
  const triggers = useMemo(() => (tkey ? tkey.split(",") : []), [tkey]);

  return (
    <>
      <Pane show={step === 1}>
        <S1 onNext={() => setStep(2)} onBack={onClose} onState={setS1} channels={channels} channelId={chId} onChannel={setChId} />
      </Pane>
      <Pane show={step === 2}>
        <S2 active={step === 2} channel={channels.find((c) => c.id === chId) || null} triggers={triggers} msgs={msgs} chosen={chosen} setChosen={setChosen} onBack={() => setStep(1)} onNext={() => setStep(3)} onCreate={() => onCreate("main")} />
      </Pane>
      <Pane show={step === 3}>
        <S3
          msgs={msgs}
          triggers={triggers}
          preselect={preselect}
          onBack={() => setStep(2)}
          onCreate={onCreate}
          onState={setS3}
          onNext={() => setStep(4)}
        />
      </Pane>
      <Pane show={step === 4}>
        <R4
          triggers={triggers}
          s1={s1}
          s3={s3}
          msgs={msgs}
          chosen={chosen}
          channel={channels.find((c) => c.id === chId) || null}
          name={name}
          setName={setName}
          onBack={() => setStep(3)}
          onEdit={(n) => setStep(n)}
          onFinish={(paused) => onFinish(buildAutomation(s1, s3, msg, count + 1, chId, name, paused))}
        />
      </Pane>
    </>
  );
}

export default function YooChatApp() {
  const [route, setRoute] = useState("home");
  const [channels, setChannels] = useState(ProfileMod.SEED_CHANNELS);
  const [activeId, setActiveId] = useState(1);
  const [autos, setAutos] = useState(() => AutoMod.SEED_AUTOS.map((a) => ({ ...a, channelId: { 1: 1, 2: 1, 3: 1, 4: 2, 5: 2 }[a.id] || 1 })));
  const [msgs, setMsgs] = useState(AutoMod.SEED_MSGS);
  const [cards, setCards] = useState(AutoMod.SEED_CARDS);
  const [autoTab, setAutoTab] = useState("autos");
  const [autoKey, setAutoKey] = useState(0);
  const [wizOpen, setWizOpen] = useState(false);
  const [wizKey, setWizKey] = useState(0);
  const [wizTarget, setWizTarget] = useState("main");
  const [preselect, setPreselect] = useState(null);
  const [msgKey, setMsgKey] = useState(0);
  const [msgType, setMsgType] = useState("text");
  const [returnTo, setReturnTo] = useState("automation");
  const [profileCmd, setProfileCmd] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [logOpen, setLogOpen] = useState(false);
  const [logKey, setLogKey] = useState(0);
  const [logInit, setLogInit] = useState({});
  const [logFrom, setLogFrom] = useState("home");
  const [detailFrom, setDetailFrom] = useState("automation");
  const [unread, setUnread] = useState(2);
  const [toast, setToast] = useState("");
  const origin = useRef("home");
  const [mode, setMode] = useState("normal");
  const [tick, setTick] = useState(0);
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const prevMode = useRef(mode);
  const timer = useRef(null);

  const flash = (m) => {
    setToast(m);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(""), 2200);
  };

  useEffect(() => {
    const prev = prevMode.current;
    prevMode.current = mode;
    if ((prev === "offline" || prev === "error") && (mode === "normal" || mode === "slow")) {
      setTick((t) => t + 1);
      if (prev === "offline") flash("Back online");
    }
  }, [mode]);

  const netValue = useMemo(
    () => ({
      mode,
      tick,
      call: (ms = 700) =>
        new Promise((resolve, reject) => {
          const m = modeRef.current;
          const wait = m === "slow" ? ms * 3.5 : m === "offline" ? Math.min(ms, 500) : ms;
          setTimeout(() => {
            if (modeRef.current === "offline") reject({ kind: "offline" });
            else if (modeRef.current === "error") reject({ kind: "server" });
            else resolve();
          }, wait);
        }),
      refresh: () => {
        LOADED.clear();
        setTick((t) => t + 1);
      },
    }),
    [mode, tick]
  );

  const toggleAuto = (id) => {
    const cur = autos.find((a) => a.id === id);
    if (!cur) return;
    setAutos((l) => l.map((a) => (a.id === id ? { ...a, on: !a.on } : a)));
    netValue.call(500).catch(() => {
      setAutos((l) => l.map((a) => (a.id === id ? { ...a, on: cur.on } : a)));
      flash(`Couldn’t update “${cur.name}”. Try again.`);
    });
  };

  const nav = (name, opts = {}) => {
    if (name === "automation") {
      setAutoTab(opts.tab || "autos");
      setAutoKey((k) => k + 1);
    }
    if (name === "profile") setProfileCmd({ view: opts.view || "profile", openChannel: opts.openChannel, n: Date.now() });
    setRoute(name);
  };

  const startWizard = () => {
    if (channels.length === 0) {
      flash("Connect a channel first");
      nav("profile", { view: "add" });
      return;
    }
    origin.current = route === "wizard" || route === "newmsg" ? origin.current : route;
    setPreselect(null);
    setWizKey((k) => k + 1);
    setWizOpen(true);
    setRoute("wizard");
  };
  const closeWizard = () => {
    setWizOpen(false);
    nav(origin.current || "automation");
  };
  const finishWizard = (a) => {
    setAutos((l) => [a, ...l]);
    setWizOpen(false);
    nav("automation", { tab: "autos" });
    flash(a.on ? "Automation activated" : "Saved as paused");
  };

  const startNewMsg = (rt, type, target) => {
    setReturnTo(rt);
    setWizTarget(target || "main");
    setMsgType(type || "text");
    setMsgKey((k) => k + 1);
    setRoute("newmsg");
  };
  const msgDone = (id) => {
    if (returnTo === "wizard") {
      setPreselect({ target: wizTarget, id, n: Date.now() });
      setRoute("wizard");
    } else {
      nav("automation", { tab: "msgs" });
    }
    flash("Message saved");
  };
  const msgBack = () => {
    if (returnTo === "wizard") setRoute("wizard");
    else nav("automation", { tab: "msgs" });
  };

  const openDetail = (id) => {
    setDetailFrom(route === "detail" ? detailFrom : route);
    setDetailId(id);
    setRoute("detail");
  };
  const closeDetail = () => setRoute(detailFrom || "automation");
  const openLog = (init = {}) => {
    setLogFrom(route === "log" ? logFrom : route);
    setLogInit(init);
    setLogKey((k) => k + 1);
    setLogOpen(true);
    setRoute("log");
  };
  const closeLog = () => {
    setLogOpen(false);
    setRoute(logFrom || "home");
  };
  const deleteAuto = (id) => {
    setAutos((l) => l.filter((x) => x.id !== id));
    closeDetail();
    flash("Automation deleted");
  };
  const duplicateAuto = (id) => {
    const src = autos.find((x) => x.id === id);
    if (!src) return;
    setAutos((l) => {
      const i = l.findIndex((x) => x.id === id);
      const out = [...l];
      out.splice(i + 1, 0, { ...src, id: sid(), name: `${src.name} copy`, on: false, when: "just now" });
      return out;
    });
    flash("Duplicated as a paused copy");
  };

  const onNew = (tab) => {
    if (tab === "msgs") startNewMsg("automation", "text");
    else if (tab === "cards") startNewMsg("automation", "generic");
    else startWizard();
  };

  const active = channels.find((c) => c.id === activeId) || null;
  const scoped = autos.filter((a) => a.channelId === activeId);
  const chanValue = {
    channels,
    activeId,
    active,
    setActive: (id) => {
      const c = channels.find((x) => x.id === id);
      setActiveId(id);
      if (c) flash(`Switched to ${c.name}`);
    },
    goAdd: () => nav("profile", { view: "add" }),
    goManage: () => nav("profile"),
    goFix: (id) => nav("profile", { view: "profile", openChannel: id }),
  };

  const detailAuto = autos.find((a) => a.id === detailId) || null;
  const Detail_ = DetailMod.Component;
  const Log_ = LogMod.Component;
  const Home_ = HomeMod.Component;
  const Auto_ = AutoMod.Component;
  const Msg_ = MsgMod.Component;
  const Profile_ = ProfileMod.Component;

  const jumps = [
    ["home", "Home", route === "home", () => nav("home")],
    ["auto", "Automation", route === "automation" && autoTab === "autos", () => nav("automation", { tab: "autos" })],
    ["msgs", "Messages", route === "automation" && autoTab === "msgs", () => nav("automation", { tab: "msgs" })],
    ["profile", "Profile", route === "profile", () => nav("profile")],
    ["log", "Sent messages", route === "log", () => openLog({})],
    ["detail", "Automation detail", route === "detail", () => { const a = scoped[0] || autos[0]; if (a) openDetail(a.id); }],
    ["wiz", "New automation", route === "wizard", startWizard],
    ["newmsg", "New message", route === "newmsg", () => startNewMsg("automation", "text")],
  ];

  return (
    <div className="yc">
      <style>{SHELL_CSS}</style>

      <div className="sim" role="group" aria-label="Simulate network">
        <span>Network</span>
        {[["normal", "Normal"], ["slow", "Slow"], ["offline", "Offline"], ["error", "Server error"]].map(([k, l]) => (
          <button key={k} type="button" aria-pressed={mode === k} onClick={() => setMode(k)}>{l}</button>
        ))}
        <button type="button" className="reload" onClick={netValue.refresh}>Reload</button>
      </div>

      <div className="jump" role="group" aria-label="Jump to screen">
        {jumps.map(([k, l, on, fn]) => (
          <button key={k} type="button" aria-pressed={on} onClick={fn}>{l}</button>
        ))}
      </div>

      <NavCtx.Provider value={nav}>
        <ChanCtx.Provider value={chanValue}>
        <NetCtx.Provider value={netValue}>
        <div className="phone">
          {mode === "offline" && (
            <div className="offline-bar" role="status"><WifiOff size={16} /> You’re offline. Some things won’t work until you’re back.</div>
          )}
          {route === "home" && (
            <Home_
              autos={scoped}
              unread={unread}
              flash={flash}
              onToggle={toggleAuto}
              onNew={startWizard}
              onOpen={openDetail}
              onLog={openLog}
              onAll={() => nav("automation", { tab: "autos" })}
            />
          )}

          {route === "automation" && (
            <Auto_
              key={autoKey}
              initialTab={autoTab}
              autos={scoped}
              setAutos={setAutos}
              onToggle={toggleAuto}
              msgs={msgs}
              setMsgs={setMsgs}
              cards={cards}
              setCards={setCards}
              onOpenDetail={openDetail}
              onLog={openLog}
              onNew={onNew}
            />
          )}

          {route === "detail" && detailAuto && (
            <Detail_
              key={detailAuto.id}
              a={detailAuto}
              channel={channels.find((c) => c.id === detailAuto.channelId) || null}
              msgs={msgs}
              onBack={closeDetail}
              onToggle={toggleAuto}
              onEdit={startWizard}
              onLog={openLog}
              onDuplicate={() => duplicateAuto(detailAuto.id)}
              onDelete={() => deleteAuto(detailAuto.id)}
            />
          )}

          {logOpen && (
            <Pane show={route === "log"}>
              <Log_ key={logKey} init={logInit} autos={scoped} msgs={msgs} onBack={closeLog} onOpenAuto={openDetail} />
            </Pane>
          )}

          <Pane show={route === "profile"}>
            <Profile_
              cmd={profileCmd}
              onUnread={setUnread}
              channels={channels}
              setChannels={setChannels}
              onAdded={(c) => setActiveId(c.id)}
              onRemoved={(id) => {
                setAutos((l) => l.filter((a) => a.channelId !== id));
                if (id === activeId) {
                  const rest = channels.filter((c) => c.id !== id);
                  setActiveId(rest.length ? rest[0].id : null);
                }
              }}
            />
          </Pane>

          {wizOpen && (
            <Pane show={route === "wizard"}>
              <Wizard
                key={wizKey}
                msgs={msgs}
                preselect={preselect}
                count={autos.length}
                channels={channels}
                initialChannel={activeId}
                onClose={closeWizard}
                onCreate={(target) => startNewMsg("wizard", "text", target)}
                onFinish={finishWizard}
              />
            </Pane>
          )}

          {route === "newmsg" && (
            <Msg_
              key={msgKey}
              initialType={msgType}
              onBack={msgBack}
              onSave={(m) => setMsgs((l) => [m, ...l])}
              onDone={msgDone}
            />
          )}

          {toast && (
            <div className="stoast-wrap" role="status"><div className="stoast">{toast}</div></div>
          )}
        </div>
        </NetCtx.Provider>
        </ChanCtx.Provider>
      </NavCtx.Provider>
    </div>
  );
}

const SHELL_CSS = `
.yc{--night:#0F1420;--panel:#171E2E;--panel2:#1E2739;--line:#2A3450;--text:#EAEEF8;--muted:#8D97AF;--blue:#5B8CFF;--mint:#4FD8A0;--amber:#FFB454;--red:#FF6B6B;
  font-family:system-ui,-apple-system,"Segoe UI",Roboto,"Noto Sans Arabic",sans-serif;color:var(--text);background:#080B12;min-height:100vh;
  display:flex;flex-direction:column;align-items:center;padding:16px 12px;box-sizing:border-box}
.yc *{box-sizing:border-box}
.yc button{font-family:inherit}
.yc :focus-visible{outline:2px solid var(--blue);outline-offset:2px}
.jump{display:flex;gap:6px;margin-bottom:12px;overflow-x:auto;max-width:100%;padding-bottom:4px}
.jump > :first-child{margin-left:auto}
.jump > :last-child{margin-right:auto}
.jump button{flex:none;white-space:nowrap;border:1px solid var(--line);background:transparent;color:var(--muted);border-radius:999px;font-size:13px;font-weight:600;padding:8px 14px;min-height:36px;cursor:pointer}
.jump button[aria-pressed=true]{background:var(--panel2);color:var(--text);border-color:#3A4770}
.phone{position:relative;width:390px;max-width:100%;height:min(844px,calc(100vh - 132px));height:min(844px,calc(100dvh - 132px));
  background:var(--night);border:1px solid var(--line);border-radius:38px;overflow:hidden;display:flex;flex-direction:column}
@media (max-width:430px){
  .yc{padding:8px 0 0}
  .phone{border-radius:0;border:0;width:100%;height:calc(100vh - 108px);height:calc(100dvh - 108px)}
}
.screen{display:flex;flex-direction:column;flex:1;min-height:0}
.pane{flex:1;min-height:0;flex-direction:column}
.stoast-wrap{position:absolute;left:0;right:0;bottom:158px;display:flex;justify-content:center;z-index:30;pointer-events:none}
.stoast{background:var(--panel2);border:1px solid var(--line);color:var(--text);font-weight:600;font-size:14px;line-height:1.4;padding:10px 16px;border-radius:18px;max-width:330px;text-align:center}
.sim{display:flex;align-items:center;gap:6px;margin-bottom:8px;overflow-x:auto;max-width:100%;padding-bottom:2px}
.sim > :first-child{margin-left:auto}
.sim > :last-child{margin-right:auto}
.sim span{font-size:12.5px;color:var(--muted);font-weight:600;flex:none;margin-right:2px}
.sim button{flex:none;white-space:nowrap;border:1px solid var(--line);background:transparent;color:var(--muted);border-radius:999px;font-size:12.5px;font-weight:600;padding:6px 12px;min-height:32px;cursor:pointer}
.sim button[aria-pressed=true]{background:rgba(255,180,84,.14);color:var(--amber);border-color:rgba(255,180,84,.5)}
.sim button.reload{color:var(--blue)}
.offline-bar{flex:none;display:flex;align-items:center;justify-content:center;gap:8px;background:#2A2416;color:#FFD9A6;font-size:13px;font-weight:600;padding:8px 12px;border-bottom:1px solid rgba(255,180,84,.3);text-align:center;line-height:1.35}
@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
@keyframes spinr{to{transform:rotate(360deg)}}
@keyframes fillbar{from{width:4%}to{width:92%}}
@media (prefers-reduced-motion:reduce){.yc *{animation:none!important;transition:none!important}}
`;
