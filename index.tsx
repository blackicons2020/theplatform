import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Menu, Search, Bell, User, ChevronRight, MessageSquare, Share2, 
  Bookmark, X, Camera, Send, CheckCircle, AlertCircle, 
  TrendingUp, Shield, FileText, Users, DollarSign, 
  LayoutGrid, PenTool, Image as ImageIcon, Sun, Moon,
  CreditCard, Trash2, Lock, Globe, Facebook, Twitter, Instagram, Linkedin, Youtube,
  Link as LinkIcon, ExternalLink, ArrowRight, RefreshCw, Upload, MapPin, Mail, Download, Edit2
} from 'lucide-react';

// --- Configuration ---
// ✅ LIVE BACKEND URL
const API_URL = "https://theplatformserver.vercel.app/api";
// ✅ LIVE FRONTEND URL (For sharing links)
const APP_URL = window.location.origin; 

// ✅ CENTRAL CATEGORIES LIST
const CATEGORIES = [
  'Politics', 'Metro', 'Business', 'Technology', 'Sports', 
  'Entertainment', 'Education', 'Leadership', 'Editorials', 'International'
];

// --- Error Boundary ---
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError(_: Error) { return { hasError: true }; }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) { console.error("Error:", error, errorInfo); }
  render() {
    if (this.state.hasError) return <div className="min-h-screen flex flex-col items-center justify-center text-center p-4"><h1 className="text-xl font-bold">Something went wrong.</h1><button onClick={() => window.location.reload()} className="mt-4 bg-black text-white px-4 py-2 rounded">Reload Page</button></div>;
    return this.props.children;
  }
}

// --- Types ---
interface Article { id: string; title: string; subHeadline?: string; category: string; author: string; date: string; image: string; excerpt: string; content: string; views: string; isBreaking?: boolean; status?: string; }
interface Advertisement { id: string; clientName: string; email: string; plan: string; amount: number; status: string; receiptImage: string; adImage?: string; adContent?: string; adContentFile?: string; adHeadline?: string; }
interface Comment { id: string; author: string; email: string; content: string; date: string; }
interface SupportMsg { id: string; name: string; email: string; subject: string; message: string; date: string; reply?: string; replyDate?: string; }

// --- Utils ---
const mapArticleFromDB = (dbArticle: any): Article => ({
  ...dbArticle,
  id: dbArticle.id || dbArticle._id?.toString(),
  subHeadline: dbArticle.subHeadline || dbArticle.sub_headline || '',
  isBreaking: dbArticle.isBreaking ?? dbArticle.is_breaking ?? false,
  date: dbArticle.date ? new Date(dbArticle.date).toLocaleDateString() : 'Just now'
});

const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Compress image via canvas before upload (max 1200px, JPEG 0.6 quality)
const compressImage = (file: File, maxWidth = 1200, quality = 0.6): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
};

// In-memory thumbnail cache (survives re-renders within the session)
const thumbCache: Record<string, string> = {};

// URL slug helper
const toSlug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 80);

const handleSocialShare = (platform: string, title: string, articleId?: string) => {
    const articleUrl = articleId ? `${APP_URL}/article/${articleId}/${toSlug(title)}` : APP_URL;
    const text = encodeURIComponent(`Read this on The People's Platform: ${title}`);
    const url = encodeURIComponent(articleUrl);
    let link = '';
    if(platform === 'facebook') link = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
    if(platform === 'twitter') link = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
    if(platform === 'whatsapp') link = `https://wa.me/?text=${text}%20${url}`;
    if(platform === 'linkedin') link = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
    if(platform === 'copy') { navigator.clipboard.writeText(articleUrl).catch(() => {}); return; }
    if(link) window.open(link, '_blank');
};

// --- Components ---

// Lazy image that only loads when visible in viewport, uses batch cache
function LazyImage({ articleId, className, fallbackClass }: { articleId: string; className: string; fallbackClass?: string }) {
  const [src, setSrc] = useState(thumbCache[articleId] || '');
  const [visible, setVisible] = useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { rootMargin: '200px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || src) return;
    // Check cache first (may have been filled by batch load)
    if (thumbCache[articleId]) { setSrc(thumbCache[articleId]); return; }
    let cancelled = false;
    fetch(`${API_URL}/articles/${articleId}/image`)
      .then(r => r.json())
      .then(data => { if (!cancelled && data.image) { thumbCache[articleId] = data.image; setSrc(data.image); } })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [visible, articleId, src]);

  return (
    <div ref={ref} className={fallbackClass || ''}>
      {src ? <img src={src} className={className} /> : (
        visible ? <div className={`${fallbackClass || ''} flex items-center justify-center`}><Globe className="w-10 h-10 text-gray-400 dark:text-gray-500 animate-pulse" /></div>
                : <div className={`${fallbackClass || ''} bg-gray-200 dark:bg-gray-700`} />
      )}
    </div>
  );
}

function Header({ onNavigate, toggleTheme, isDark }: any) {
  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('home')}>
          <div className="w-8 h-8 bg-naija rounded-full flex items-center justify-center text-white font-bold"><Globe className="w-5 h-5"/></div>
          <h1 className="font-sans text-lg font-bold text-gray-900 dark:text-white">The People's Platform</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
            {isDark ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-600" />}
          </button>
          <button onClick={() => onNavigate('submit')} className="hidden md:flex items-center gap-1 bg-naija text-white px-3 py-1.5 rounded-full text-xs font-medium">
            <PenTool className="w-3 h-3" /> Submit News
          </button>
          <button onClick={() => onNavigate('advertise')} className="hidden md:flex items-center gap-1 border border-naija text-naija px-3 py-1.5 rounded-full text-xs font-medium">Advertise</button>
        </div>
      </div>
    </header>
  );
}

function ArticleCard({ article, onClick }: any) {
  return (
    <div onClick={onClick} className="group bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer border border-gray-100 dark:border-gray-700 flex flex-col h-full">
      <div className="relative h-48 w-full overflow-hidden shrink-0 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600">
        <LazyImage articleId={article.id} className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500" fallbackClass="w-full h-full flex items-center justify-center" />
        {article.isBreaking && <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Breaking</span>}
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <div className="mb-2 flex items-center justify-between">
          <span className="bg-naija text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">{article.category}</span>
          <span className="text-[10px] text-gray-500">{article.date}</span>
        </div>
        <h3 className="font-serif text-lg font-bold text-gray-900 dark:text-white mb-2 leading-tight group-hover:text-naija transition-colors line-clamp-2">{article.title}</h3>
        <p className="text-gray-600 dark:text-gray-300 text-xs leading-relaxed line-clamp-3 mb-3 flex-grow">{article.excerpt}</p>
        <div className="mt-auto pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs text-naija font-semibold">
          <span>Read Article</span> <ChevronRight className="w-3 h-3" />
        </div>
      </div>
    </div>
  );
}

function SponsoredArticleCard({ ad }: { ad: Advertisement }) {
  return (
    <div className="group bg-green-50 dark:bg-green-900/20 rounded-xl overflow-hidden shadow-sm border border-green-100 flex flex-col h-full">
      <div className="relative h-48 w-full overflow-hidden shrink-0">
        <img src={ad.adImage || 'https://via.placeholder.com/400'} className="w-full h-full object-cover object-center" />
        <span className="absolute top-2 left-2 bg-yellow-500 text-black text-[10px] font-bold px-2 py-0.5 rounded">Sponsored</span>
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2 line-clamp-2">{ad.adHeadline}</h3>
        <p className="text-gray-600 dark:text-gray-300 text-xs line-clamp-3 flex-grow">{ad.adContent}</p>
      </div>
    </div>
  );
}

function Footer({ onNavigate, onCategorySelect }: any) {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white pt-10 pb-6 border-t border-gray-200 dark:border-gray-700 mt-auto">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 border-b border-gray-100 dark:border-gray-700 pb-8">
          <div className="col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-naija rounded-full flex items-center justify-center text-white font-bold"><Globe className="w-5 h-5"/></div>
              <h2 className="font-bold text-lg">The People's Platform</h2>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Empowering voices through unbiased reporting.</p>
          </div>
          <div>
            <h3 className="font-bold mb-4 text-sm uppercase">News</h3>
            <ul className="space-y-2 text-xs text-gray-500 dark:text-gray-400">
              {CATEGORIES.map(c=><li key={c} className="hover:text-naija cursor-pointer" onClick={()=>{onNavigate('home'); onCategorySelect(c); window.scrollTo(0,0);}}>{c}</li>)}
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-4 text-sm uppercase">Company</h3>
            <ul className="space-y-2 text-xs text-gray-500 dark:text-gray-400">
              <li className="hover:text-naija cursor-pointer" onClick={()=>onNavigate('home')}>Home</li>
              <li className="hover:text-naija cursor-pointer" onClick={()=>onNavigate('advertise')}>Advertise</li>
              <li className="hover:text-naija cursor-pointer" onClick={()=>onNavigate('support')}>Support & Contact</li>
              <li className="text-gray-300 hover:text-gray-400 cursor-pointer mt-2 pt-2 text-[10px]" onClick={()=>{ onNavigate('login'); window.scrollTo(0,0); }}>Staff Access</li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-4 text-sm uppercase">Connect</h3>
            <div className="flex gap-2 mb-4">
              {[Facebook, Twitter, Instagram, Linkedin, Youtube].map((Icon,i)=>(<button key={i} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-naija hover:text-white transition-colors"><Icon className="w-4 h-4"/></button>))}
            </div>
          </div>
        </div>
        <div className="text-center text-xs text-gray-400">&copy; {currentYear} The People's Platform. All rights reserved.</div>
      </div>
    </footer>
  );
}

function SupportPage({ onBack }: any) {
    const [form, setForm] = useState({name:'', email:'', subject:'General Inquiry', message:''});
    const [status, setStatus] = useState('');

    useEffect(() => { window.scrollTo(0,0); }, []);

    const submit = async (e:React.FormEvent) => {
        e.preventDefault();
        setStatus('sending');
        const res = await fetch(`${API_URL}/support`, {
            method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(form)
        });
        if(res.ok) { setStatus('success'); setForm({name:'', email:'', subject:'General Inquiry', message:''}); }
        else setStatus('error');
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-12">
            <button onClick={onBack} className="flex items-center gap-1 text-gray-500 mb-8 text-sm hover:text-naija"><ChevronRight className="w-4 h-4 rotate-180"/> Back to Home</button>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">Support & Contact</h2>
            <div className="max-w-lg mx-auto">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Send Message</h3>
                    <form onSubmit={submit} className="space-y-4">
                        <input required placeholder="Full Name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} className="w-full p-3 rounded-lg border dark:bg-gray-900 dark:text-white outline-none" />
                        <input required type="email" placeholder="Email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} className="w-full p-3 rounded-lg border dark:bg-gray-900 dark:text-white outline-none" />
                        <select value={form.subject} onChange={e=>setForm({...form, subject:e.target.value})} className="w-full p-3 rounded-lg border dark:bg-gray-900 dark:text-white outline-none">
                            <option>General Inquiry</option><option>News Tip</option><option>Advertising</option>
                        </select>
                        <textarea required rows={4} placeholder="Message" value={form.message} onChange={e=>setForm({...form, message:e.target.value})} className="w-full p-3 rounded-lg border dark:bg-gray-900 dark:text-white outline-none resize-none"></textarea>
                        <button disabled={status==='sending'} className="w-full bg-black text-white font-bold py-4 rounded-lg flex items-center justify-center gap-2">
                            {status==='sending' ? 'Sending...' : 'Send Message'} <Send className="w-4 h-4" />
                        </button>
                        {status==='success' && <p className="text-green-600 text-center text-sm">Message sent successfully! We'll respond soon.</p>}
                    </form>
                </div>
            </div>
        </div>
    );
}

function SupportMsgCard({ msg, onReplied }: { msg: SupportMsg; onReplied: (m: any) => void }) {
  const [reply, setReply] = useState((msg as any).reply || '');
  const [sending, setSending] = useState(false);
  const hasReply = !!(msg as any).reply;

  const send = async () => {
    if (!reply.trim()) return;
    setSending(true);
    const res = await fetch(`${API_URL}/admin/support/${msg.id}/reply`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply })
    });
    if (res.ok) { const updated = await res.json(); onReplied({ ...updated, id: updated.id || updated._id }); }
    setSending(false);
  };

  return (
    <div className={`bg-white dark:bg-gray-800 p-4 rounded shadow border-l-4 ${hasReply ? 'border-green-500' : 'border-blue-500'}`}>
      <div className="flex justify-between mb-2">
        <h4 className="font-bold text-sm dark:text-white">{msg.subject}</h4>
        <span className="text-xs text-gray-500">{new Date(msg.date).toLocaleDateString()}</span>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{msg.message}</p>
      <p className="text-xs font-bold text-blue-600 mb-3">From: {msg.name} ({msg.email})</p>
      {hasReply ? (
        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded border border-green-100 dark:border-green-800">
          <p className="text-xs font-bold text-green-600 mb-1">Your Reply:</p>
          <p className="text-sm text-gray-700 dark:text-gray-300">{(msg as any).reply}</p>
        </div>
      ) : (
        <div className="space-y-2">
          <textarea value={reply} onChange={e => setReply(e.target.value)} placeholder="Type your reply..." className="w-full p-2 border rounded text-sm dark:bg-gray-900 dark:text-white dark:border-gray-700 resize-none h-20 outline-none" />
          <button onClick={send} disabled={sending || !reply.trim()} className="bg-naija text-white px-4 py-2 rounded text-xs font-bold disabled:opacity-50">{sending ? 'Sending...' : 'Send Reply'}</button>
        </div>
      )}
    </div>
  );
}

function AdminDashboard({ articles, pendingArticles, ads, onPublish, onUpdate, onDelete, onApproveSubmission, onRejectSubmission, onApproveAd, onRejectAd, onDeleteAd, onUpdateAd, onPostAd, onLogout }: any) {
  const [tab, setTab] = useState('live');
  const [editId, setEditId] = useState<string|null>(null);
  const [form, setForm] = useState({ title: '', subHeadline: '', category: 'Politics', author: 'Staff Reporter', content: '', image: '' });
  const [supportMsgs, setSupportMsgs] = useState<SupportMsg[]>([]);
  const [showAuthor, setShowAuthor] = useState(true);
  const [breaking, setBreaking] = useState(false);
  const [editingAd, setEditingAd] = useState<any>(null);
  const [adForm, setAdForm] = useState({ clientName: '', email: '', plan: '', amount: '', adHeadline: '', adContent: '', adUrl: '', status: '' });
  const [showPostAd, setShowPostAd] = useState(false);
  const [postAdForm, setPostAdForm] = useState({ clientName: '', email: '', plan: 'Homepage Banner', amount: '', adHeadline: '', adContent: '', adUrl: '', adImage: '' });
  const [postAdPosting, setPostAdPosting] = useState(false);

  useEffect(() => {
      if(tab === 'support') {
          fetch(`${API_URL}/admin/support`).then(r=>r.json()).then(data => {
              if(Array.isArray(data)) setSupportMsgs(data);
          });
      }
  }, [tab]);

  const handleEdit = (a: Article) => {
    setEditId(a.id);
    setForm({ title: a.title, subHeadline: a.subHeadline||'', category: a.category, author: a.author, content: a.content, image: a.image });
    setBreaking(a.isBreaking||false);
    setTab('compose');
  };

  const submit = (e: any) => {
    e.preventDefault();
    const payload: any = { ...form, isBreaking: breaking, status: 'published' };
    if(!showAuthor) payload.author = "The People's Platform";
    if(editId) { onUpdate(editId, payload); alert('Updated!'); setEditId(null); }
    else { onPublish(payload); alert('Published!'); }
    setForm({ title: '', subHeadline: '', category: 'Politics', author: 'Staff Reporter', content: '', image: '' });
    setTab('live');
  };

  const handleFile = async (e: any) => {
    if(e.target.files?.[0]) {
      const file = e.target.files[0];
      const compressed = file.type.startsWith('image/') ? await compressImage(file) : await readFileAsDataURL(file);
      setForm({...form, image: compressed});
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 p-4 shadow flex justify-between items-center sticky top-0 z-20">
        <span className="font-bold flex items-center gap-2 dark:text-white"><Shield className="w-5 h-5"/> Editorial</span>
        <button onClick={onLogout} className="text-red-500 text-sm font-bold">Logout</button>
      </div>
      
      <div className="p-4 max-w-5xl mx-auto">
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {['live','pending','ads','payments','support','compose'].map(t => (
                <button key={t} onClick={()=>setTab(t)} className={`px-4 py-2 rounded-full text-xs font-bold uppercase ${tab===t ? 'bg-black text-white' : 'bg-white text-gray-600 border'}`}>
                    {t} {t==='pending' && `(${pendingArticles.length})`} {t==='ads' && `(${ads.filter((a:any)=>a.status==='pending').length})`}
                </button>
            ))}
        </div>

        {tab === 'live' && (
            <div className="space-y-3">
                {articles.map((a:any) => (
                    <div key={a.id} className="bg-white dark:bg-gray-800 p-3 rounded shadow flex justify-between items-center">
                        <div className="flex gap-3 items-center">
                            <div className="w-10 h-10 rounded overflow-hidden bg-gray-100 shrink-0"><LazyImage articleId={a.id} className="w-full h-full object-cover" /></div>
                            <div><h4 className="font-bold text-sm dark:text-white line-clamp-1">{a.title}</h4><span className="text-xs text-gray-500">{a.date}</span></div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={()=>handleEdit(a)} className="text-blue-500 text-xs font-bold border px-2 py-1 rounded">Edit</button>
                            <button onClick={()=>{if(confirm('Delete?')) onDelete(a.id)}} className="text-red-500 text-xs font-bold border px-2 py-1 rounded">Delete</button>
                        </div>
                    </div>
                ))}
            </div>
        )}

        {tab === 'pending' && (
            <div className="space-y-3">
                {pendingArticles.length === 0 && <p className="text-gray-500">No pending submissions.</p>}
                {pendingArticles.map((a:any) => (
                    <div key={a.id} className="bg-white dark:bg-gray-800 p-4 rounded shadow border-l-4 border-yellow-500">
                        <div className="flex gap-3 items-start">
                            {a.image && <img src={a.image} className="w-16 h-16 rounded object-cover flex-shrink-0" />}
                            <div className="flex-1">
                                <h4 className="font-bold text-sm dark:text-white">{a.title}</h4>
                                <p className="text-xs text-gray-500 mt-1">By {a.author} | {a.category} | {new Date(a.date).toLocaleDateString()}</p>
                                {a.excerpt && <p className="text-xs text-gray-600 mt-2 line-clamp-2">{a.excerpt}</p>}
                            </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                            <button onClick={()=>onApproveSubmission(a)} className="bg-green-500 text-white px-3 py-2 rounded text-xs flex-1 font-bold">Approve & Publish</button>
                            <button onClick={()=>onRejectSubmission(a.id)} className="bg-red-500 text-white px-3 py-2 rounded text-xs flex-1 font-bold">Reject</button>
                        </div>
                    </div>
                ))}
            </div>
        )}

        {tab === 'support' && (
            <div className="space-y-3">
                {supportMsgs.length === 0 && <p className="text-gray-500">No messages yet.</p>}
                {supportMsgs.map(msg => (
                    <SupportMsgCard key={msg.id} msg={msg} onReplied={(updated: SupportMsg) => setSupportMsgs(supportMsgs.map(m => m.id === updated.id ? updated : m))} />
                ))}
            </div>
        )}

        {tab === 'ads' && (
          <div className="space-y-4">
            {/* Post Ad Button */}
            <div className="flex justify-between items-center">
              <p className="text-sm font-bold text-gray-600 dark:text-gray-300">{ads.length} advert(s) total</p>
              <button onClick={()=>setShowPostAd(true)} className="bg-naija text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2"><PenTool className="w-3 h-3"/> Post Ad Directly</button>
            </div>

            {ads.length === 0 && <p className="text-gray-500 text-sm">No adverts yet.</p>}
            {ads.map((a:any) => (
              <div key={a.id} className="bg-white dark:bg-gray-800 p-4 rounded shadow border-l-4 border-yellow-400">
                <div className="flex justify-between mb-2">
                  <div>
                    <h4 className="font-bold text-sm dark:text-white">{a.plan}</h4>
                    <p className="text-xs text-gray-500">Client: {a.clientName} ({a.email})</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600 font-mono font-bold text-sm">₦{a.amount?.toLocaleString() || '0'}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${a.status === 'active' ? 'bg-green-100 text-green-700' : a.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{a.status}</span>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded text-xs mb-3 border dark:border-gray-700">
                  <p className="dark:text-gray-300"><strong>Headline:</strong> {a.adHeadline || 'N/A'}</p>
                  <p className="mt-1 dark:text-gray-300"><strong>Content:</strong> {a.adContent || 'N/A'}</p>
                  {a.adUrl && <p className="mt-1 dark:text-gray-300"><strong>URL:</strong> {a.adUrl}</p>}
                  {a.adContentFile && (
                    <a href={a.adContentFile} download className="mt-2 inline-flex items-center gap-1 text-blue-600 underline">
                      <Download className="w-3 h-3"/> Download Attached Material
                    </a>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div><p className="text-[10px] font-bold dark:text-gray-300">Ad Creative</p>{a.adImage && <img src={a.adImage} className="h-24 object-cover border w-full rounded" />}</div>
                  {a.paymentReference && <div><p className="text-[10px] font-bold dark:text-gray-300">Payment Ref</p><p className="text-xs text-green-600 font-mono break-all mt-1">{a.paymentReference}</p></div>}
                </div>

                <div className="flex flex-wrap gap-2">
                  {a.status === 'pending' && (
                    <>
                      <button onClick={()=>onApproveAd(a.id)} className="bg-green-500 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Approve</button>
                      <button onClick={()=>onRejectAd(a.id)} className="bg-red-500 text-white px-3 py-1.5 rounded text-xs font-bold">Reject</button>
                    </>
                  )}
                  {a.status === 'active' && <span className="text-green-600 font-bold text-xs flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Active</span>}
                  <button onClick={()=>{ setEditingAd(a); setAdForm({ clientName: a.clientName||'', email: a.email||'', plan: a.plan||'', amount: a.amount||'', adHeadline: a.adHeadline||'', adContent: a.adContent||'', adUrl: a.adUrl||'', status: a.status||'pending' }); }} className="ml-auto bg-blue-500 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1"><Edit2 className="w-3 h-3"/> Edit</button>
                  <button onClick={()=>{ if(confirm('Delete this ad?')) onDeleteAd(a.id); }} className="bg-red-600 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1"><Trash2 className="w-3 h-3"/> Delete</button>
                </div>
              </div>
            ))}

            {/* Edit Ad Modal */}
            {editingAd && (
              <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={()=>setEditingAd(null)}>
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg dark:text-white">Edit Advert</h3>
                    <button onClick={()=>setEditingAd(null)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="text-xs font-bold text-gray-500">Client Name</label><input value={adForm.clientName} onChange={e=>setAdForm({...adForm, clientName:e.target.value})} className="w-full border rounded p-2 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white mt-1" /></div>
                      <div><label className="text-xs font-bold text-gray-500">Email</label><input value={adForm.email} onChange={e=>setAdForm({...adForm, email:e.target.value})} className="w-full border rounded p-2 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white mt-1" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="text-xs font-bold text-gray-500">Plan</label>
                        <select value={adForm.plan} onChange={e=>setAdForm({...adForm, plan:e.target.value})} className="w-full border rounded p-2 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white mt-1">
                          {['Homepage Banner','Article Page Ad','Sponsored Article','Header Leaderboard','Sidebar Banner'].map(p=><option key={p}>{p}</option>)}
                        </select>
                      </div>
                      <div><label className="text-xs font-bold text-gray-500">Status</label>
                        <select value={adForm.status} onChange={e=>setAdForm({...adForm, status:e.target.value})} className="w-full border rounded p-2 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white mt-1">
                          {['pending','active','rejected'].map(s=><option key={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                    <div><label className="text-xs font-bold text-gray-500">Amount (₦)</label><input type="number" value={adForm.amount} onChange={e=>setAdForm({...adForm, amount:e.target.value})} className="w-full border rounded p-2 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white mt-1" /></div>
                    <div><label className="text-xs font-bold text-gray-500">Ad Headline</label><input value={adForm.adHeadline} onChange={e=>setAdForm({...adForm, adHeadline:e.target.value})} className="w-full border rounded p-2 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white mt-1" /></div>
                    <div><label className="text-xs font-bold text-gray-500">Ad Content / Message</label><textarea value={adForm.adContent} onChange={e=>setAdForm({...adForm, adContent:e.target.value})} rows={3} className="w-full border rounded p-2 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white mt-1 resize-none" /></div>
                    <div><label className="text-xs font-bold text-gray-500">Destination URL</label><input value={adForm.adUrl} onChange={e=>setAdForm({...adForm, adUrl:e.target.value})} className="w-full border rounded p-2 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white mt-1" /></div>
                  </div>
                  <div className="flex gap-3 mt-5">
                    <button onClick={()=>setEditingAd(null)} className="flex-1 border dark:border-gray-700 py-2 rounded text-sm dark:text-white">Cancel</button>
                    <button onClick={async ()=>{ await onUpdateAd(editingAd.id, {...adForm, amount: Number(adForm.amount)}); setEditingAd(null); }} className="flex-1 bg-naija text-white py-2 rounded text-sm font-bold">Save Changes</button>
                  </div>
                </div>
              </div>
            )}

            {/* Post Ad Directly Modal */}
            {showPostAd && (
              <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={()=>setShowPostAd(false)}>
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="font-bold text-lg dark:text-white">Post Ad Directly</h3>
                      <p className="text-xs text-gray-400 mt-0.5">Ad goes live immediately — no payment required</p>
                    </div>
                    <button onClick={()=>setShowPostAd(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="text-xs font-bold text-gray-500">Client / Brand Name</label><input value={postAdForm.clientName} onChange={e=>setPostAdForm({...postAdForm, clientName:e.target.value})} placeholder="e.g. Dangote Group" className="w-full border rounded p-2 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white mt-1" /></div>
                      <div><label className="text-xs font-bold text-gray-500">Email (optional)</label><input type="email" value={postAdForm.email} onChange={e=>setPostAdForm({...postAdForm, email:e.target.value})} placeholder="client@email.com" className="w-full border rounded p-2 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white mt-1" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="text-xs font-bold text-gray-500">Ad Placement *</label>
                        <select value={postAdForm.plan} onChange={e=>setPostAdForm({...postAdForm, plan:e.target.value})} className="w-full border rounded p-2 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white mt-1">
                          {['Homepage Banner','Article Page Ad','Sponsored Article'].map(p=><option key={p}>{p}</option>)}
                        </select>
                      </div>
                      <div><label className="text-xs font-bold text-gray-500">Value (₦, optional)</label><input type="number" value={postAdForm.amount} onChange={e=>setPostAdForm({...postAdForm, amount:e.target.value})} placeholder="0" className="w-full border rounded p-2 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white mt-1" /></div>
                    </div>
                    <div><label className="text-xs font-bold text-gray-500">Ad Headline *</label><input required value={postAdForm.adHeadline} onChange={e=>setPostAdForm({...postAdForm, adHeadline:e.target.value})} placeholder="Catchy headline" className="w-full border rounded p-2 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white mt-1" /></div>
                    <div><label className="text-xs font-bold text-gray-500">Ad Message / Content</label><textarea value={postAdForm.adContent} onChange={e=>setPostAdForm({...postAdForm, adContent:e.target.value})} rows={3} placeholder="Ad body text..." className="w-full border rounded p-2 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white mt-1 resize-none" /></div>
                    <div><label className="text-xs font-bold text-gray-500">Destination URL</label><input value={postAdForm.adUrl} onChange={e=>setPostAdForm({...postAdForm, adUrl:e.target.value})} placeholder="https://..." className="w-full border rounded p-2 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white mt-1" /></div>
                    <div>
                      <label className="text-xs font-bold text-gray-500">Ad Creative Image *</label>
                      <input type="file" accept="image/*" onChange={async e=>{ if(e.target.files?.[0]) { const r = await compressImage(e.target.files[0]); setPostAdForm({...postAdForm, adImage: r}); }}} className="w-full text-xs mt-1 dark:text-gray-400" />
                      {postAdForm.adImage && <img src={postAdForm.adImage} className="mt-2 h-20 object-cover rounded border w-full" />}
                    </div>
                  </div>
                  <div className="flex gap-3 mt-5">
                    <button onClick={()=>setShowPostAd(false)} className="flex-1 border dark:border-gray-700 py-2 rounded text-sm dark:text-white">Cancel</button>
                    <button disabled={postAdPosting || !postAdForm.adHeadline.trim() || !postAdForm.adImage} onClick={async ()=>{
                      setPostAdPosting(true);
                      await onPostAd({ ...postAdForm, amount: Number(postAdForm.amount) || 0 });
                      setPostAdForm({ clientName: '', email: '', plan: 'Homepage Banner', amount: '', adHeadline: '', adContent: '', adUrl: '', adImage: '' });
                      setShowPostAd(false);
                      setPostAdPosting(false);
                    }} className="flex-1 bg-naija text-white py-2 rounded text-sm font-bold disabled:opacity-60">{postAdPosting ? 'Posting...' : 'Post Ad Live'}</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'payments' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-bold text-gray-600 dark:text-gray-300">All Ad Payments</p>
              <p className="text-xs text-gray-400">{ads.filter((a:any)=>a.paymentReference).length} paid transaction(s)</p>
            </div>
            {ads.filter((a:any)=>a.paymentReference).length === 0 && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-8 text-center">
                <p className="text-gray-400 text-sm">No payment records yet.</p>
              </div>
            )}
            {ads.filter((a:any)=>a.paymentReference).map((a:any) => (
              <div key={a.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-sm dark:text-white">{a.clientName}</p>
                    <p className="text-xs text-gray-500">{a.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600 font-mono">₦{(a.amount||0).toLocaleString()}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${a.status === 'active' ? 'bg-green-100 text-green-700' : a.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{a.status}</span>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t dark:border-gray-700 grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-gray-400">Plan:</span> <span className="dark:text-gray-200 font-medium">{a.plan}</span></div>
                  <div><span className="text-gray-400">Date:</span> <span className="dark:text-gray-200">{a.dateSubmitted ? new Date(a.dateSubmitted).toLocaleDateString() : 'N/A'}</span></div>
                  <div className="col-span-2"><span className="text-gray-400">Ref:</span> <span className="font-mono text-green-600 break-all">{a.paymentReference}</span></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'compose' && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded shadow">
                <form onSubmit={submit} className="space-y-4">
                    <input required placeholder="Headline" value={form.title} onChange={e=>setForm({...form, title:e.target.value})} className="w-full border p-2 rounded text-sm" />
                    <input placeholder="Sub-Headline" value={form.subHeadline} onChange={e=>setForm({...form, subHeadline:e.target.value})} className="w-full border p-2 rounded text-sm" />
                    <div className="grid grid-cols-2 gap-4">
                        <select value={form.category} onChange={e=>setForm({...form, category:e.target.value})} className="border p-2 rounded text-sm">
                            {CATEGORIES.map(c=><option key={c}>{c}</option>)}
                        </select>
                        <div className="flex items-center gap-2">
                            <input type="checkbox" checked={showAuthor} onChange={e=>setShowAuthor(e.target.checked)} />
                            <input value={form.author} onChange={e=>setForm({...form, author:e.target.value})} disabled={!showAuthor} className="border p-2 rounded text-sm w-full" />
                        </div>
                    </div>
                    <input type="file" onChange={handleFile} className="text-xs" />
                    <textarea required placeholder="Content" value={form.content} onChange={e=>setForm({...form, content:e.target.value})} className="w-full border p-2 rounded h-40 text-sm" />
                    <div className="flex items-center gap-2">
                        <input type="checkbox" checked={breaking} onChange={e=>setBreaking(e.target.checked)} />
                        <label className="text-red-600 font-bold text-sm">Breaking News</label>
                    </div>
                    <button className="bg-green-600 text-white w-full py-3 rounded font-bold">{editId ? 'Update' : 'Publish Live'}</button>
                </form>
            </div>
        )}
      </div>
    </div>
  );
}

function SubmitNewsPage({ onBack, onSubmit }: any) {
  const [form, setForm] = useState({ title: '', category: 'Politics', content: '', image: '' });
  
  useEffect(() => { window.scrollTo(0,0); }, []);

  const submit = (e: any) => {
    e.preventDefault();
    onSubmit({ ...form, author: 'Citizen Reporter' });
  };

  const handleFile = async (e: any) => {
    if(e.target.files?.[0]) {
      const file = e.target.files[0];
      const compressed = file.type.startsWith('image/') ? await compressImage(file) : await readFileAsDataURL(file);
      setForm({...form, image: compressed});
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <button onClick={onBack} className="mb-6 flex items-center text-gray-500 text-sm"><ChevronRight className="w-4 h-4 rotate-180"/> Back</button>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
        <h2 className="text-2xl font-bold mb-6 dark:text-white">Submit Story</h2>
        <form onSubmit={submit} className="space-y-4">
            <input required placeholder="Headline" value={form.title} onChange={e=>setForm({...form, title:e.target.value})} className="w-full border p-3 rounded" />
            <select value={form.category} onChange={e=>setForm({...form, category:e.target.value})} className="w-full border p-3 rounded">
                {CATEGORIES.map(c=><option key={c}>{c}</option>)}
            </select>
            <input type="file" onChange={handleFile} className="text-sm" />
            <textarea required placeholder="Content" value={form.content} onChange={e=>setForm({...form, content:e.target.value})} className="w-full border p-3 rounded h-40" />
            <button className="bg-naija text-white w-full py-3 rounded font-bold">Submit for Review</button>
        </form>
      </div>
    </div>
  );
}

// --- AdvertisePage Component ---
function AdvertisePage({ onBack, onSubmitAd }: any) {
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [paying, setPaying] = useState(false);

  // Ad detail form state
  const [client, setClient] = useState('');
  const [email, setEmail] = useState('');
  const [headline, setHeadline] = useState('');
  const [content, setContent] = useState('');
  const [adUrl, setAdUrl] = useState('');
  const [adImg, setAdImg] = useState('');
  const [adDoc, setAdDoc] = useState('');

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const plans = [
    { name: 'Article Page Ad',   price: 20000,  features: ['Shown on all article reading pages', 'Image + headline + text displayed', 'Between content and comments', 'Weekly rotation'] },
    { name: 'Sponsored Article', price: 70000,  features: ['Full feature story in article feed', 'Permanent link', 'Shared on social media', 'In-feed native display'] },
    { name: 'Homepage Banner',   price: 150000, features: ['Bold banner on the homepage', 'Image + headline + text always visible', 'High visibility placement', 'Monthly duration'] },
  ];

  const handleFile = async (e: any, setter: any) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      const result = file.type.startsWith('image/') ? await compressImage(file) : await readFileAsDataURL(file);
      setter(result);
    }
  };

  const launchPaystack = () => {
    if (!client.trim() || !email.trim()) { alert('Please fill in your name and email first.'); return; }
    const PaystackPop = (window as any).PaystackPop;
    if (!PaystackPop) { alert('Payment gateway failed to load. Please refresh the page and try again.'); return; }
    try {
      const paystack = new PaystackPop();
      paystack.newTransaction({
        key: 'pk_live_b2c985a001f4c23b6bd1a19af4193f57c901446c',
        email,
        amount: selectedPlan.price * 100, // kobo
        currency: 'NGN',
        ref: `TPPAD-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        metadata: { custom_fields: [{ display_name: 'Plan', variable_name: 'plan', value: selectedPlan.name }, { display_name: 'Client', variable_name: 'client', value: client }] },
        onSuccess: async (transaction: any) => {
          setPaying(true);
          try {
            const res = await fetch(`${API_URL}/payment/verify-ad`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                reference: transaction.reference,
                clientName: client, email,
                plan: selectedPlan.name, amount: selectedPlan.price,
                adImage: adImg, adHeadline: headline,
                adContent: content, adUrl, adContentFile: adDoc
              })
            });
            const data = await res.json();
            if (res.ok) {
              alert('✅ Payment confirmed! Your ad has been submitted for review. We will activate it within 24 hours.');
              onBack();
            } else {
              alert(`❌ ${data.message || 'Payment verification failed. Contact support.'}`);
            }
          } catch {
            alert('Network error during verification. Please contact support with your payment reference: ' + transaction.reference);
          }
          setPaying(false);
        },
        onCancel: () => { alert('Payment was cancelled.'); }
      });
    } catch (err) {
      alert('Could not open payment window. Please refresh and try again.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button onClick={onBack} className="mb-6 flex items-center text-gray-600 dark:text-gray-400 text-sm"><ChevronRight className="w-4 h-4 rotate-180" /> Back</button>

      <div className="text-center mb-12">
        <h2 className="text-3xl font-serif font-bold text-gray-900 dark:text-white mb-4">Advertise with The People's Platform</h2>
        <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">Reach millions of Nigerians daily. Choose the plan that fits your brand.</p>
      </div>

      {/* Plan Cards */}
      {!showForm && (
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {plans.map((p) => (
            <div key={p.name} className={`bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border-2 flex flex-col transition-all ${selectedPlan?.name === p.name ? 'border-naija scale-[1.02]' : 'border-gray-100 dark:border-gray-700'}`}>
              <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-1">{p.name}</h3>
              <p className="text-3xl font-bold text-naija mb-4">₦{p.price.toLocaleString()}</p>
              <div className="flex-grow space-y-2 mb-6">
                {p.features.map((f, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-300">
                    <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" /><span>{f}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => { setSelectedPlan(p); setShowForm(true); }} className="w-full bg-black dark:bg-naija text-white py-2.5 rounded-lg text-sm font-bold hover:bg-naija transition-colors">
                Choose Plan
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Ad Details + Payment Form */}
      {showForm && selectedPlan && (
        <div className="max-w-lg mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg border dark:border-gray-700 overflow-hidden">
          <div className="bg-naija text-white px-6 py-4 flex justify-between items-center">
            <div>
              <p className="text-sm font-bold">{selectedPlan.name}</p>
              <p className="text-2xl font-bold">₦{selectedPlan.price.toLocaleString()}</p>
            </div>
            <button onClick={() => setShowForm(false)} className="text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 block mb-1">Your Name / Business *</label>
                <input required value={client} onChange={e => setClient(e.target.value)} placeholder="e.g. Dangote Group" className="w-full p-2.5 text-sm border rounded-lg dark:bg-gray-900 dark:border-gray-700 dark:text-white outline-none focus:border-naija" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 block mb-1">Email Address *</label>
                <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" className="w-full p-2.5 text-sm border rounded-lg dark:bg-gray-900 dark:border-gray-700 dark:text-white outline-none focus:border-naija" />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 block mb-1">Ad Headline</label>
              <input value={headline} onChange={e => setHeadline(e.target.value)} placeholder="Catchy headline for your ad" className="w-full p-2.5 text-sm border rounded-lg dark:bg-gray-900 dark:border-gray-700 dark:text-white outline-none focus:border-naija" />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 block mb-1">Ad Message / Content</label>
              <textarea value={content} onChange={e => setContent(e.target.value)} rows={3} placeholder="Describe your product or offer..." className="w-full p-2.5 text-sm border rounded-lg dark:bg-gray-900 dark:border-gray-700 dark:text-white outline-none focus:border-naija resize-none" />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 block mb-1">Destination URL (optional)</label>
              <input value={adUrl} onChange={e => setAdUrl(e.target.value)} placeholder="https://yourwebsite.com" className="w-full p-2.5 text-sm border rounded-lg dark:bg-gray-900 dark:border-gray-700 dark:text-white outline-none focus:border-naija" />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 block mb-1">Ad Creative Image *</label>
              <input type="file" required accept="image/*" onChange={e => handleFile(e, setAdImg)} className="w-full text-xs dark:text-gray-400" />
              {adImg && <img src={adImg} className="mt-2 h-20 object-cover rounded border w-full" />}
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 block mb-1">Supporting Document (PDF/Doc, optional)</label>
              <input type="file" onChange={e => handleFile(e, setAdDoc)} className="w-full text-xs dark:text-gray-400" />
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded-lg p-3 text-xs text-gray-500 dark:text-gray-400">
              🔒 Secure payment powered by <strong>Paystack</strong>. You will be charged <strong className="text-naija">₦{selectedPlan.price.toLocaleString()}</strong> upon clicking Pay Now.
            </div>

            <button
              onClick={launchPaystack}
              disabled={paying || !client.trim() || !email.trim() || !adImg}
              className="w-full bg-naija text-white py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60 hover:bg-green-700 transition-colors"
            >
              {paying ? <><RefreshCw className="w-4 h-4 animate-spin" /> Verifying Payment...</> : <><CreditCard className="w-4 h-4" /> Pay ₦{selectedPlan.price.toLocaleString()} Now</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StaffLoginPage({ onLogin, onBack }: any) {
  const [pw, setPw] = useState('');
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'adminOdohhhhh1@') {
      onLogin();
    } else {
      setError('Invalid Access Code');
    }
  };
  // Fixed variable names here to match state
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-sm text-center">
        <Lock className="w-10 h-10 mx-auto mb-4 text-gray-700 dark:text-white" />
        <h2 className="text-xl font-bold mb-6 dark:text-white">Staff Login</h2>
        <form onSubmit={handleSubmit}>
            <input autoFocus type="password" placeholder="Access Code" value={password} onChange={e=>setPassword(e.target.value)} className="w-full p-3 border rounded mb-4 dark:bg-gray-700 dark:text-white" />
            <button className="w-full bg-black text-white py-3 rounded font-bold mb-2">Login</button>
            <button type="button" onClick={onBack} className="text-sm text-gray-500">Back Home</button>
        </form>
        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
      </div>
    </div>
  );
}

// --- Main App Component ---

function ArticleReader({ article, allArticles, activeAds = [], onBack, onNavigateToArticle, isAdmin }: any) {
  const [fullArticle, setFullArticle] = useState<Article | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentForm, setCommentForm] = useState({ author: '', email: '', content: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    fetch(`${API_URL}/articles/${article.id}`, { signal: controller.signal })
      .then(r => { if(!r.ok) throw new Error('Not found'); return r.json(); })
      .then(data => { setFullArticle(mapArticleFromDB(data)); setLoading(false); })
      .catch(() => { setFullArticle(article); setLoading(false); });
    fetch(`${API_URL}/articles/${article.id}/comments`, { signal: controller.signal })
      .then(r => r.json())
      .then(data => { if(Array.isArray(data)) setComments(data); })
      .catch(() => {});
    return () => { clearTimeout(timeout); controller.abort(); };
  }, [article.id]);

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`${API_URL}/comments`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articleId: article.id, ...commentForm })
    });
    if (res.ok) {
      const saved = await res.json();
      setComments([saved, ...comments]);
      setCommentForm({ author: '', email: '', content: '' });
    }
  };

  const display = fullArticle || article;
  const related = allArticles.filter((a: Article) => a.id !== article.id && a.category === article.category).slice(0, 3);

  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button onClick={onBack} className="mb-6 flex items-center text-gray-500 text-sm hover:text-naija"><ChevronRight className="w-4 h-4 rotate-180" /> Back to Home</button>
      <div className="mb-6">
        <span className="bg-naija text-white text-xs font-bold px-2 py-1 rounded uppercase">{article.category}</span>
        <h1 className="text-3xl md:text-4xl font-serif font-bold mt-3 mb-2 dark:text-white">{article.title}</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm">{article.excerpt}</p>
      </div>
      <div className="flex items-center gap-3 text-gray-400 py-12 justify-center">
        <RefreshCw className="animate-spin w-5 h-5" />
        <span className="text-sm">Loading full article...</span>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button onClick={onBack} className="mb-6 flex items-center text-gray-500 text-sm hover:text-naija"><ChevronRight className="w-4 h-4 rotate-180" /> Back to Home</button>
      {display.image && (
        <div className="relative h-[400px] rounded-xl overflow-hidden mb-6">
          <img src={display.image} className="w-full h-full object-cover object-center" />
          {display.isBreaking && <span className="absolute top-4 left-4 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">Breaking News</span>}
        </div>
      )}
      <div className="mb-6">
        <span className="bg-naija text-white text-xs font-bold px-2 py-1 rounded uppercase">{display.category}</span>
        <h1 className="text-3xl md:text-4xl font-serif font-bold mt-3 mb-2 dark:text-white">{display.title}</h1>
        {display.subHeadline && <p className="text-lg text-gray-600 dark:text-gray-400 mb-3">{display.subHeadline}</p>}
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1"><User className="w-4 h-4" /> {display.author}</span>
          <span>{display.date}</span>
        </div>
      </div>
      <div className="flex gap-2 mb-6">
        {['facebook', 'twitter', 'whatsapp', 'linkedin'].map(p => (
          <button key={p} onClick={() => handleSocialShare(p, display.title, display.id)} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-naija hover:text-white transition-colors">
            {p === 'facebook' && <Facebook className="w-4 h-4" />}
            {p === 'twitter' && <Twitter className="w-4 h-4" />}
            {p === 'whatsapp' && <MessageSquare className="w-4 h-4" />}
            {p === 'linkedin' && <Linkedin className="w-4 h-4" />}
          </button>
        ))}
      </div>
      <article className="prose dark:prose-invert max-w-none mb-12 text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-line">
        {display.content || display.excerpt}
      </article>

      {/* In-article ad space */}
      {(() => {
        const artAd = activeAds.find((a: any) => a.plan === 'Article Page Ad' || a.plan === 'Sidebar Banner' || a.plan === 'Sponsored Article');
        return artAd ? (
          <a href={artAd.adUrl || '#'} target="_blank" rel="noopener noreferrer" className="block mb-10 rounded-xl overflow-hidden border dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
            {artAd.adImage && <img src={artAd.adImage} className="w-full h-48 object-cover" />}
            <div className="p-4">
              <span className="text-[10px] uppercase tracking-wide font-bold text-gray-400">Sponsored</span>
              {artAd.adHeadline && <p className="font-bold text-base dark:text-white mt-1">{artAd.adHeadline}</p>}
              {artAd.adContent && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{artAd.adContent}</p>}
              <span className="inline-block mt-2 text-naija text-xs font-bold">Learn More →</span>
            </div>
            <span className="block text-right text-[10px] text-gray-300 px-3 pb-2">Ad</span>
          </a>
        ) : (
          <div className="mb-10 h-32 bg-gray-50 dark:bg-gray-800 border-2 border-dashed dark:border-gray-700 flex flex-col items-center justify-center text-center p-4 rounded-xl">
            <span className="text-sm font-bold text-gray-400">Ad Space Available</span>
            <span className="text-xs text-gray-400 mt-1">Advertise on The People's Platform</span>
          </div>
        );
      })()}

      <div className="border-t dark:border-gray-700 pt-8 mb-12">
        <h3 className="text-xl font-bold dark:text-white mb-6 flex items-center gap-2"><MessageSquare className="w-5 h-5" /> Comments ({comments.length})</h3>
        <form onSubmit={submitComment} className="mb-8 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input required placeholder="Name" value={commentForm.author} onChange={e => setCommentForm({...commentForm, author: e.target.value})} className="p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white outline-none text-sm" />
            <input required type="email" placeholder="Email" value={commentForm.email} onChange={e => setCommentForm({...commentForm, email: e.target.value})} className="p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white outline-none text-sm" />
          </div>
          <textarea required placeholder="Write a comment..." value={commentForm.content} onChange={e => setCommentForm({...commentForm, content: e.target.value})} className="w-full p-3 border rounded-lg h-24 dark:bg-gray-800 dark:border-gray-700 dark:text-white outline-none text-sm resize-none" />
          <button className="bg-naija text-white px-6 py-2 rounded-lg text-sm font-medium flex items-center gap-2"><Send className="w-4 h-4" /> Post Comment</button>
        </form>
        {comments.map((c: any) => (
          <div key={c._id || c.id} className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-sm dark:text-white">{c.author}</span>
              <span className="text-xs text-gray-400">{new Date(c.date).toLocaleDateString()}</span>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300">{c.content}</p>
          </div>
        ))}
      </div>
      {related.length > 0 && (
        <div className="border-t dark:border-gray-700 pt-8">
          <h3 className="text-xl font-bold dark:text-white mb-6">Related Stories</h3>
          <div className="grid md:grid-cols-3 gap-6">
            {related.map((a: Article) => (
              <div key={a.id} onClick={() => onNavigateToArticle(a)} className="cursor-pointer group">
                <h4 className="font-bold text-sm dark:text-white group-hover:text-naija line-clamp-2">{a.title}</h4>
                <p className="text-xs text-gray-500 mt-1">{a.date}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  const [view, setView] = useState('home');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [pending, setPending] = useState<Article[]>([]);
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [cat, setCat] = useState('All');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const loadData = async (attempt = 1) => {
      console.log(`[Platform] Loading data (attempt ${attempt})...`);
      setLoadError(false);
      try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 30000);
          const [news, activeAds] = await Promise.all([
              fetch(`${API_URL}/articles`, { signal: controller.signal }).then(r => { if(!r.ok) throw new Error(`Articles: HTTP ${r.status}`); return r.json(); }).catch(err => { console.error('[Platform] Articles fetch error:', err.message); return []; }),
              fetch(`${API_URL}/ads/active`, { signal: controller.signal }).then(r => { if(!r.ok) throw new Error(`Ads: HTTP ${r.status}`); return r.json(); }).catch(err => { console.error('[Platform] Ads fetch error:', err.message); return []; })
          ]);
          clearTimeout(timeout);
          if(Array.isArray(news) && news.length > 0) {
              const mapped = news.map(mapArticleFromDB);
              setArticles(mapped); setLoading(false);
              // Batch fetch thumbnails for visible articles (one API call)
              const ids = mapped.slice(0, 12).map((a: Article) => a.id);
              fetch(`${API_URL}/articles/thumbnails`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids })
              }).then(r => r.json()).then(thumbs => {
                if (thumbs && typeof thumbs === 'object') {
                  Object.assign(thumbCache, thumbs);
                  setArticles(prev => [...prev]); // trigger re-render to pick up cache
                }
              }).catch(() => {});
          }
          else if(attempt < 4) setTimeout(() => loadData(attempt + 1), 3000);
          else { setLoading(false); setLoadError(true); }
          if(Array.isArray(activeAds)) setAds(activeAds);
      } catch(e) {
          console.error(`[Platform] Load attempt ${attempt} failed:`, e);
          if(attempt < 4) setTimeout(() => loadData(attempt + 1), 3000);
          else { setLoading(false); setLoadError(true); }
      }
  };

  // URL-based article routing helper
  const navigateToArticle = (a: Article) => {
    setSelectedArticle(a); setView('article');
    window.history.pushState({ view: 'article', id: a.id }, '', `/article/${a.id}/${toSlug(a.title)}`);
  };
  const navigateHome = () => { setView('home'); setSelectedArticle(null); window.history.pushState({ view: 'home' }, '', '/'); };

  // Initial Load
  useEffect(() => {
    const link = document.createElement('link'); link.rel='icon'; 
    link.href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23008753' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='12' r='10'></circle><line x1='2' y1='12' x2='22' y2='12'></line><path d='M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z'></path></svg>";
    document.head.appendChild(link);
    document.title = "The People's Platform";
    loadData();

    // Handle browser back/forward
    const onPop = (e: PopStateEvent) => {
      if (e.state?.view === 'article' && e.state.id) {
        const found = articles.find(a => a.id === e.state.id);
        if (found) { setSelectedArticle(found); setView('article'); }
        else setView('home');
      } else { setView('home'); setSelectedArticle(null); }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const toggleTheme = () => { setIsDark(!isDark); document.documentElement.classList.toggle('dark'); };

  // Deep-link: open article if URL matches /article/:id/...
  useEffect(() => {
    if (articles.length === 0) return;
    const m = window.location.pathname.match(/^\/article\/([a-f0-9]+)/i);
    if (m) {
      const found = articles.find(a => a.id === m[1]);
      if (found) { setSelectedArticle(found); setView('article'); }
    }
  }, [articles]);

  // Data Handlers
  const handleAdminLogin = async () => {
    setIsAdmin(true);
    // Fetch all pending data
    const res = await fetch(`${API_URL}/admin/pending-articles`);
    const data = await res.json();
    if(Array.isArray(data)) setPending(data.map(mapArticleFromDB));
    
    // Fetch all ads for admin (including pending)
    const adsRes = await fetch(`${API_URL}/admin/ads`); 
    const adsData = await adsRes.json();
    if(Array.isArray(adsData)) setAds(adsData);

    setView('admin');
  };

  const publishNews = async (data: Article) => {
    const res = await fetch(`${API_URL}/articles`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) });
    if(res.ok) {
        const saved = await res.json();
        const mapped = mapArticleFromDB(saved);
        if(mapped.status === 'published') { setArticles([mapped, ...articles]); alert('Published Live!'); }
        else alert('Submitted for Review');
        setView('home');
    }
  };

  const updateNews = async (id: string, data: Article) => {
    const res = await fetch(`${API_URL}/articles/${id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) });
    if(res.ok) {
        const updated = mapArticleFromDB(await res.json());
        setArticles(articles.map(a => a.id === id ? updated : a));
    }
  };

  const deleteNews = async (id: string) => {
    if(await fetch(`${API_URL}/articles/${id}`, {method:'DELETE'}).then(r=>r.ok)) {
        setArticles(articles.filter(a => a.id !== id));
    }
  };

  const submitAd = async (data: Advertisement) => {
    const res = await fetch(`${API_URL}/ads`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) });
    if(res.ok) { alert('Ad Submitted!'); setView('home'); }
  };

  // Admin Approvals
  const approveArticle = async (a: Article) => {
    const res = await fetch(`${API_URL}/admin/articles/${a.id}/approve`, {method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({isBreaking:false})});
    if(res.ok) {
        const approved = mapArticleFromDB(await res.json());
        setArticles([approved, ...articles]);
        setPending(pending.filter(p=>p.id!==a.id));
    }
  };

  const approveAd = async (id: string) => {
    const res = await fetch(`${API_URL}/admin/ads/${id}/approve`, {method:'PATCH'});
    if(res.ok) {
        const updated = await res.json();
        // Update local state to show it's active now
        setAds(ads.map(ad => ad.id === id ? {...ad, status: 'active'} : ad));
    }
  };

  const rejectAd = (id: string) => {
      setAds(ads.filter(a => a.id !== id));
  };

  const deleteAd = async (id: string) => {
    const res = await fetch(`${API_URL}/admin/ads/${id}`, { method: 'DELETE' });
    if (res.ok) setAds(ads.filter(a => a.id !== id));
  };

  const updateAd = async (id: string, data: any) => {
    const res = await fetch(`${API_URL}/admin/ads/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (res.ok) {
      const updated = await res.json();
      setAds(ads.map(a => (a.id === id || a._id === id) ? { ...updated, id: updated._id || updated.id } : a));
    }
  };

  const postAd = async (data: any) => {
    const res = await fetch(`${API_URL}/admin/ads`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (res.ok) {
      const created = await res.json();
      setAds([{ ...created, id: created._id || created.id }, ...ads]);
      alert('Ad posted and is now live!');
    } else {
      alert('Failed to post ad. Please try again.');
    }
  };

  if(loading) return <div className="min-h-screen flex flex-col items-center justify-center gap-3"><RefreshCw className="animate-spin text-green-600 w-8 h-8"/><p className="text-gray-500 text-sm">Loading The People's Platform...</p><p className="text-gray-400 text-xs">Waking up server, please wait...</p></div>;
  if(loadError && articles.length === 0) return <div className="min-h-screen flex flex-col items-center justify-center gap-3 p-4 text-center"><AlertCircle className="text-red-500 w-10 h-10"/><p className="text-gray-700 dark:text-gray-300 text-sm font-semibold">Could not load news data</p><p className="text-gray-400 text-xs">The server may be starting up. Please try again.</p><button onClick={()=>{ setLoading(true); loadData(); }} className="mt-3 bg-naija text-white px-6 py-2 rounded-full text-sm font-medium">Retry</button></div>;
  if(view === 'login') return <StaffLoginPage onLogin={handleAdminLogin} onBack={()=>setView('home')}/>;
  if(view === 'support') return <SupportPage onBack={()=>setView('home')}/>;
  if(view === 'admin' && isAdmin) return <AdminDashboard articles={articles} pendingArticles={pending} ads={ads} onPublish={publishNews} onUpdate={updateNews} onDelete={deleteNews} onApproveSubmission={approveArticle} onRejectSubmission={(id:string)=>setPending(pending.filter(a=>a.id!==id))} onApproveAd={approveAd} onRejectAd={rejectAd} onDeleteAd={deleteAd} onUpdateAd={updateAd} onPostAd={postAd} onLogout={()=>{setIsAdmin(false); setView('home');}} />;

  const filtered = cat === 'All' ? articles : articles.filter(a => a.category === cat);
  const activeAds = ads.filter(a=>a.status==='Active' || a.status==='active');
  const feed = [...filtered];
  // Inject Ads
  activeAds.filter(a=>a.plan==='Sponsored Article').forEach((ad, i) => {
    const idx = (i+1)*3;
    if(idx < feed.length) feed.splice(idx, 0, {isAd:true, data:ad});
  });

  return (
    <div className={`min-h-screen flex flex-col ${isDark ? 'dark' : ''}`}>
      <Header onNavigate={setView} toggleTheme={toggleTheme} isDark={isDark} />
      <main className="flex-grow">
        {view === 'home' && (
            <div className="max-w-7xl mx-auto px-4 py-6">
                <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
                    {['All', ...CATEGORIES].map(c => (
                        <button key={c} onClick={()=>setCat(c)} className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${cat===c ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'}`}>{c}</button>
                    ))}
                </div>

                {filtered.length > 0 && (
                    <div className="mb-12 grid lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 cursor-pointer group" onClick={()=> navigateToArticle(filtered[0])}>
                            <div className="relative h-[400px] rounded-xl overflow-hidden bg-gradient-to-br from-green-600 to-green-800">
                                <LazyImage articleId={filtered[0].id} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 object-center" fallbackClass="w-full h-full flex items-center justify-center" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                                {filtered[0].isBreaking && <span className="absolute top-4 left-4 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse z-10">Breaking News</span>}
                                <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
                                    <span className="bg-naija text-white text-xs font-bold px-2 py-1 rounded uppercase">{filtered[0].category}</span>
                                    <h2 className="text-2xl md:text-3xl font-serif font-bold mt-2 mb-1 text-white drop-shadow-lg">{filtered[0].title}</h2>
                                    <p className="text-gray-200 line-clamp-2 text-sm">{filtered[0].subHeadline || filtered[0].excerpt}</p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border dark:border-gray-700">
                                <h3 className="font-bold mb-4 dark:text-white flex items-center gap-2"><TrendingUp className="w-4 h-4 text-naija"/> Trending</h3>
                                <div className="space-y-4">
                                    {articles.slice(1,4).map((a,i) => (
                                        <div key={a.id} onClick={()=>navigateToArticle(a)} className="flex gap-3 cursor-pointer group">
                                            <span className="text-2xl font-bold text-gray-300">0{i+1}</span>
                                            <div><h4 className="font-bold text-sm dark:text-white line-clamp-2 group-hover:text-naija">{a.title}</h4></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {(() => {
                              const sAd = activeAds.find((a: any) => a.plan === 'Article Page Ad' || a.plan === 'Sidebar Banner');
                              return sAd ? (
                                <a href={sAd.adUrl || '#'} target="_blank" rel="noopener noreferrer" className="block rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                                  {sAd.adImage && <img src={sAd.adImage} className="w-full h-40 object-cover" />}
                                  <div className="p-3">
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Sponsored</span>
                                    {sAd.adHeadline && <p className="font-bold text-sm text-gray-900 dark:text-white mt-0.5">{sAd.adHeadline}</p>}
                                    {sAd.adContent && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{sAd.adContent}</p>}
                                    <span className="inline-block mt-2 text-naija text-xs font-bold">Learn More →</span>
                                  </div>
                                </a>
                              ) : (
                                <div className="h-64 bg-gray-50 dark:bg-gray-800 border-2 border-dashed dark:border-gray-700 flex flex-col items-center justify-center text-center p-4 rounded-xl">
                                  <span className="text-sm font-bold text-gray-400">Ad Space Available</span>
                                  <button onClick={()=>setView('advertise')} className="text-xs text-naija mt-2 underline">Place Ad</button>
                                </div>
                              );
                            })()}
                        </div>
                    </div>
                )}

                {/* Homepage Banner Ad */}
                {(() => {
                  const hAd = activeAds.find((a: any) => a.plan === 'Homepage Banner' || a.plan === 'Header Leaderboard');
                  return hAd ? (
                    <a href={hAd.adUrl || '#'} target="_blank" rel="noopener noreferrer"
                      className="flex mb-8 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
                      {hAd.adImage && (
                        <div className="w-44 shrink-0"><img src={hAd.adImage} className="w-full h-full object-cover" /></div>
                      )}
                      <div className="flex-1 p-5 flex flex-col justify-center gap-1">
                        <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Sponsored</span>
                        {hAd.adHeadline && <h4 className="font-bold text-xl text-gray-900 dark:text-white leading-snug">{hAd.adHeadline}</h4>}
                        {hAd.adContent && <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-3">{hAd.adContent}</p>}
                        <span className="mt-3 text-naija text-sm font-bold">Learn More →</span>
                      </div>
                      <span className="self-start m-2 text-[10px] text-gray-300 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">Ad</span>
                    </a>
                  ) : null;
                })()}

                <h3 className="text-2xl font-serif font-bold mb-6 dark:text-white flex items-center gap-2"><LayoutGrid className="w-6 h-6"/> Latest Stories</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {feed.slice(1).map((item: any) => item.isAd ? (
                        <SponsoredArticleCard key={item.data.id} ad={item.data} />
                    ) : (
                        <ArticleCard key={item.id} article={item} onClick={()=>navigateToArticle(item)} />
                    ))}
                </div>
            </div>
        )}

        {view === 'article' && selectedArticle && (
            <ArticleReader article={selectedArticle} allArticles={articles} activeAds={activeAds} onBack={navigateHome} onNavigateToArticle={(a:Article)=>{navigateToArticle(a); window.scrollTo(0,0);}} isAdmin={isAdmin} />
        )}
        {view === 'submit' && <SubmitNewsPage onBack={()=>setView('home')} onSubmit={publishNews} />}
        {view === 'advertise' && <AdvertisePage onBack={()=>setView('home')} onSubmitAd={submitAd} />}
      </main>
      <Footer onNavigate={setView} onCategorySelect={setCat} />
    </div>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(<ErrorBoundary><App /></ErrorBoundary>);