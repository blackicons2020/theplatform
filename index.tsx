import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Menu, Search, Bell, User, ChevronRight, MessageSquare, Share2, 
  Bookmark, X, Camera, Send, CheckCircle, AlertCircle, 
  TrendingUp, Shield, FileText, Users, DollarSign, 
  LayoutGrid, PenTool, Image as ImageIcon, Sun, Moon,
  CreditCard, Trash2, Lock, Globe, Facebook, Twitter, Instagram, Linkedin, Youtube,
  Link as LinkIcon, ExternalLink, ArrowRight, RefreshCw, Upload, MapPin, Mail, Download
} from 'lucide-react';

// --- Configuration ---
const API_URL = "https://platform-backend-54nn.onrender.com/api"; 
const APP_URL = window.location.origin; 
const CATEGORIES = [
  'Politics', 'Metro', 'Business', 'Technology', 'Sports', 
  'Entertainment', 'Education', 'Leadership', 'Editorials'
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
interface SupportMsg { id: string; name: string; email: string; subject: string; message: string; date: string; }

// --- Utils ---
const mapArticleFromDB = (dbArticle: any): Article => ({
  ...dbArticle,
  subHeadline: dbArticle.sub_headline || '',
  isBreaking: dbArticle.is_breaking, 
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

const handleSocialShare = (platform: string, title: string) => {
    const text = encodeURIComponent(`Read this on The Platform: ${title}`);
    const url = encodeURIComponent(APP_URL);
    let link = '';
    if(platform === 'facebook') link = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
    if(platform === 'twitter') link = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
    if(platform === 'whatsapp') link = `https://wa.me/?text=${text}%20${url}`;
    if(platform === 'linkedin') link = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
    if(link) window.open(link, '_blank');
};

// --- Components ---

function Header({ onNavigate, toggleTheme, isDark, activeAd }: any) {
  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      {activeAd && (
        <div className="bg-gray-100 dark:bg-gray-900 w-full h-24 relative flex items-center justify-center overflow-hidden">
          <a href={activeAd.adUrl || '#'} target="_blank" rel="noreferrer" className="w-full h-full">
             {activeAd.adImage ? <img src={activeAd.adImage} className="w-full h-full object-cover object-center" /> : <div className="flex items-center justify-center h-full text-gray-400 text-xs">Ad Space</div>}
          </a>
          <span className="absolute top-1 right-1 bg-black/50 text-white text-[10px] px-1">Ad</span>
        </div>
      )}
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('home')}>
          <div className="w-8 h-8 bg-naija rounded-full flex items-center justify-center text-white font-bold"><Globe className="w-5 h-5"/></div>
          <h1 className="font-sans text-lg font-bold text-gray-900 dark:text-white">The Platform</h1>
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
      <div className="relative h-48 w-full overflow-hidden shrink-0">
        <img src={article.image || 'https://via.placeholder.com/400'} className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500" />
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
              <h2 className="font-bold text-lg">The Platform</h2>
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
              <li className="text-gray-300 hover:text-gray-400 cursor-pointer mt-2 pt-2 text-[10px]" onClick={()=>onNavigate('login')}>Staff Access</li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-4 text-sm uppercase">Connect</h3>
            <div className="flex gap-2 mb-4">
              {[Facebook, Twitter, Instagram, Linkedin, Youtube].map((Icon,i)=>(<button key={i} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-naija hover:text-white transition-colors"><Icon className="w-4 h-4"/></button>))}
            </div>
          </div>
        </div>
        <div className="text-center text-xs text-gray-400">&copy; {currentYear} The Platform. All rights reserved.</div>
      </div>
    </footer>
  );
}

function SupportPage({ onBack }: any) {
    const [form, setForm] = useState({name:'', email:'', subject:'General Inquiry', message:''});
    const [status, setStatus] = useState('');

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
            <div className="grid md:grid-cols-2 gap-12">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Contact & Support</h2>
                    <div className="space-y-6">
                        <div className="flex items-start gap-4">
                            <MapPin className="w-6 h-6 text-naija shrink-0" />
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white mb-1">Office Address</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Suite 0.02, Maryam Babangida National Centre for Women Development,<br/>Opposite CBN Headquarters,<br/>Central Business District, Abuja, FCT.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <Mail className="w-6 h-6 text-naija shrink-0" />
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white mb-1">Email</h3>
                                <a href="mailto:theplatformreport@gmail.com" className="text-sm text-naija hover:underline">theplatformreport@gmail.com</a>
                            </div>
                        </div>
                    </div>
                </div>
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
                        {status==='success' && <p className="text-green-600 text-center">Message sent successfully!</p>}
                    </form>
                </div>
            </div>
        </div>
    );
}

function AdminDashboard({ articles, pendingArticles, ads, onPublish, onUpdate, onDelete, onApproveSubmission, onRejectSubmission, onApproveAd, onRejectAd, onLogout }: any) {
  const [tab, setTab] = useState('live');
  const [editId, setEditId] = useState<string|null>(null);
  const [form, setForm] = useState({ title: '', subHeadline: '', category: 'Politics', author: 'Staff Reporter', content: '', image: '' });
  const [supportMsgs, setSupportMsgs] = useState<SupportMsg[]>([]);
  const [showAuthor, setShowAuthor] = useState(true);
  const [breaking, setBreaking] = useState(false);

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
    if(!showAuthor) payload.author = "The Platform";
    if(editId) { onUpdate(editId, payload); alert('Updated!'); setEditId(null); }
    else { onPublish(payload); alert('Published!'); }
    setForm({ title: '', subHeadline: '', category: 'Politics', author: 'Staff Reporter', content: '', image: '' });
    setTab('live');
  };

  const handleFile = async (e: any) => { if(e.target.files?.[0]) setForm({...form, image: await readFileAsDataURL(e.target.files[0])}); };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 p-4 shadow flex justify-between items-center sticky top-0 z-20">
        <span className="font-bold flex items-center gap-2 dark:text-white"><Shield className="w-5 h-5"/> Editorial</span>
        <button onClick={onLogout} className="text-red-500 text-sm font-bold">Logout</button>
      </div>
      
      <div className="p-4 max-w-5xl mx-auto">
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {['live','pending','ads','support','compose'].map(t => (
                <button key={t} onClick={()=>setTab(t)} className={`px-4 py-2 rounded-full text-xs font-bold uppercase ${tab===t ? 'bg-black text-white' : 'bg-white text-gray-600 border'}`}>
                    {t} {t==='pending' && `(${pendingArticles.length})`} {t==='ads' && `(${ads.filter((a:any)=>a.status==='Pending').length})`}
                </button>
            ))}
        </div>

        {tab === 'live' && (
            <div className="space-y-3">
                {articles.map((a:any) => (
                    <div key={a.id} className="bg-white dark:bg-gray-800 p-3 rounded shadow flex justify-between items-center">
                        <div className="flex gap-3 items-center">
                            <img src={a.image} className="w-10 h-10 rounded object-cover" />
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

        {tab === 'support' && (
            <div className="space-y-3">
                {supportMsgs.length === 0 && <p className="text-gray-500">No messages yet.</p>}
                {supportMsgs.map(msg => (
                    <div key={msg.id} className="bg-white dark:bg-gray-800 p-4 rounded shadow border-l-4 border-blue-500">
                        <div className="flex justify-between mb-2">
                            <h4 className="font-bold text-sm">{msg.subject}</h4>
                            <span className="text-xs text-gray-500">{new Date(msg.date).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{msg.message}</p>
                        <p className="text-xs font-bold text-blue-600">From: {msg.name} ({msg.email})</p>
                    </div>
                ))}
            </div>
        )}

        {tab === 'ads' && ads.map((a:any) => (
            <div key={a.id} className="bg-white p-4 rounded shadow mb-4 border-l-4 border-yellow-400">
                <div className="flex justify-between mb-2">
                    <div>
                        <h4 className="font-bold text-sm">{a.plan}</h4>
                        <p className="text-xs text-gray-500">Client: {a.clientName} ({a.email})</p>
                    </div>
                    <span className="text-green-600 font-mono font-bold text-sm">₦{a.amount?.toLocaleString() || '0'}</span>
                </div>
                
                <div className="bg-gray-50 p-3 rounded text-xs mb-3 border">
                    <p><strong>Headline:</strong> {a.adHeadline || 'N/A'}</p>
                    <p className="mt-1"><strong>Content:</strong> {a.adContent || 'N/A'}</p>
                    {a.adContentFile && (
                        <a href={a.adContentFile} download className="mt-2 inline-flex items-center gap-1 text-blue-600 underline">
                            <Download className="w-3 h-3"/> Download Attached Material
                        </a>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3">
                    <div><p className="text-[10px] font-bold">Receipt</p><img src={a.receiptImage} className="h-24 object-cover border w-full" /></div>
                    <div><p className="text-[10px] font-bold">Ad Creative</p>{a.adImage && <img src={a.adImage} className="h-24 object-cover border w-full" />}</div>
                </div>

                {a.status === 'Pending' && (
                    <div className="flex gap-2">
                        <button onClick={()=>onApproveAd(a.id)} className="bg-green-500 text-white px-3 py-2 rounded text-xs flex-1 font-bold">Approve</button>
                        <button onClick={()=>onRejectAd(a.id)} className="bg-red-500 text-white px-3 py-2 rounded text-xs flex-1 font-bold">Reject</button>
                    </div>
                )}
                {a.status === 'Active' && <span className="text-green-600 font-bold text-xs flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Active</span>}
            </div>
        ))}

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
  
  const submit = (e: any) => {
    e.preventDefault();
    onSubmit({ ...form, author: 'Citizen Reporter' });
  };

  const handleFile = async (e: any) => {
    if(e.target.files?.[0]) setForm({...form, image: await readFileAsDataURL(e.target.files[0])});
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

// --- AdvertisePage Component (FIXED) ---
function AdvertisePage({ onBack, onSubmitAd }: any) {
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState<'info' | 'form'>('info');
  const [selectedPlan, setSelectedPlan] = useState<any>(null); // Store whole plan object
  
  // Form State
  const [client, setClient] = useState('');
  const [email, setEmail] = useState('');
  const [headline, setHeadline] = useState('');
  const [content, setContent] = useState('');
  const [receipt, setReceipt] = useState('');
  const [adImg, setAdImg] = useState('');
  const [adDoc, setAdDoc] = useState(''); 

  const plans = [
    { name: 'Sidebar Banner', price: 20000, features: ['Visible on all article pages', 'Square format', 'Weekly rotation'] },
    { name: 'Sponsored Article', price: 70000, features: ['Full feature story', 'Permanent link', 'Shared on social media', 'In-feed native display'] },
    { name: 'Header Leaderboard', price: 150000, features: ['Premium top placement', 'High visibility', 'Monthly duration', 'All pages'] },
  ];

  const handleFile = async (e: any, setter: any) => {
    if(e.target.files?.[0]) setter(await readFileAsDataURL(e.target.files[0]));
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    if(!selectedPlan || !receipt) return;
    onSubmitAd({
      clientName: client, email, plan: selectedPlan.name, amount: selectedPlan.price,
      receiptImage: receipt, adImage: adImg, adHeadline: headline, adContent: content, adContentFile: adDoc
    });
    setShowModal(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button onClick={onBack} className="mb-6 flex items-center text-gray-600 dark:text-gray-400 text-sm"><ChevronRight className="w-4 h-4 rotate-180" /> Back</button>

      <div className="text-center mb-12">
        <h2 className="text-3xl font-serif font-bold text-gray-900 dark:text-white mb-4">Advertise with The Platform</h2>
        <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">Reach millions of Nigerians daily. Choose the plan that fits your brand.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {plans.map((p) => (
          <div key={p.name} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border dark:border-gray-700 text-center flex flex-col h-full">
            <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-2">{p.name}</h3>
            <p className="text-3xl font-bold text-naija">₦{p.price.toLocaleString()}</p>
            <div className="flex-grow text-left space-y-2 mb-4">
              {p.features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-300">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
            <div className="p-6 pt-0">
              <button 
                onClick={() => { setSelectedPlan(p); setStep('info'); setShowModal(true); }}
                className="w-full bg-black text-white py-2 rounded-lg text-sm mt-auto"
              >
                Choose Plan
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-xs max-h-[70vh] overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col">
            <div className="p-3 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800 shrink-0">
              <h3 className="font-bold text-sm dark:text-white">{step === 'info' ? 'Payment Details' : 'Submit Ad Details'}</h3>
              <button onClick={() => setShowModal(false)}><X className="w-4 h-4 text-gray-500" /></button>
            </div>
            
            <div className="p-4 overflow-y-auto">
              {step === 'info' ? (
                <div className="text-center space-y-3">
                  <div className="bg-green-50 dark:bg-gray-800 p-3 rounded-lg border border-green-100 dark:border-gray-600">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Pay <span className="font-bold text-black dark:text-white">₦{selectedPlan?.price?.toLocaleString() || '0'}</span> to:</p>
                    <p className="font-bold text-sm text-naija mt-1">4092144856</p>
                    <p className="text-xs font-bold text-gray-700 dark:text-gray-300">Polaris Bank</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Clean Connect</p>
                  </div>
                  <button onClick={() => setStep('form')} className="w-full bg-naija text-white py-2 rounded text-xs font-bold flex items-center justify-center gap-2">I Have Made Payment <ArrowRight className="w-3 h-3"/></button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <input required placeholder="Name / Business" value={client} onChange={e => setClient(e.target.value)} className="w-full p-2 text-xs border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white outline-none focus:border-naija" />
                  <input required type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-2 text-xs border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white outline-none focus:border-naija" />
                  
                  <input placeholder="Headline (Optional)" value={headline} onChange={e => setHeadline(e.target.value)} className="w-full p-2 text-xs border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white outline-none focus:border-naija" />
                  <textarea placeholder="Ad Content (Optional)" value={content} onChange={e => setContent(e.target.value)} className="w-full p-2 text-xs border rounded h-16 dark:bg-gray-800 dark:border-gray-700 dark:text-white resize-none outline-none focus:border-naija" />
                  
                  <div className="text-xs">
                    <label className="block mb-1 font-bold dark:text-gray-300 flex items-center gap-1"><Upload className="w-3 h-3"/> Upload Material (Doc/PDF)</label>
                    <input type="file" onChange={e => handleFile(e, setAdDoc)} className="w-full text-[10px] dark:text-gray-400" />
                  </div>

                  <div className="text-xs border-t pt-2 dark:border-gray-700">
                    <label className="block mb-1 font-bold dark:text-gray-300">Ad Creative (Image)</label>
                    <input type="file" required accept="image/*" onChange={e => handleFile(e, setAdImg)} className="w-full text-[10px] dark:text-gray-400" />
                  </div>

                  <div className="text-xs">
                    <label className="block mb-1 font-bold dark:text-gray-300">Payment Receipt</label>
                    <input type="file" required accept="image/*" onChange={e => handleFile(e, setReceipt)} className="w-full text-[10px] dark:text-gray-400" />
                  </div>

                  <button type="submit" className="w-full bg-naija text-white py-2 rounded text-xs font-bold mt-2 shadow-md hover:bg-green-700">Submit Proof & Creative</button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Main App Component ---
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

  // Initial Load
  useEffect(() => {
    const link = document.createElement('link'); link.rel='icon'; 
    link.href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23008753' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='12' r='10'></circle><line x1='2' y1='12' x2='22' y2='12'></line><path d='M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z'></path></svg>";
    document.head.appendChild(link);
    document.title = "The Platform";

    const loadData = async () => {
        try {
            const [news, activeAds] = await Promise.all([fetch(`${API_URL}/articles`).then(r=>r.json()), fetch(`${API_URL}/ads/active`).then(r=>r.json())]);
            if(Array.isArray(news)) setArticles(news.map(mapArticleFromDB));
            if(Array.isArray(activeAds)) setAds(activeAds);
        } catch(e) { console.error(e); } finally { setLoading(false); }
    };
    loadData();
  }, []);

  const toggleTheme = () => { setIsDark(!isDark); document.documentElement.classList.toggle('dark'); };

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
      // In real app, call delete endpoint
      setAds(ads.filter(a => a.id !== id));
  };

  if(loading) return <div className="min-h-screen flex items-center justify-center"><RefreshCw className="animate-spin text-green-600"/></div>;
  if(view === 'login') return <StaffLoginPage onLogin={handleAdminLogin} onBack={()=>setView('home')}/>;
  if(view === 'support') return <SupportPage onBack={()=>setView('home')}/>;
  if(view === 'admin' && isAdmin) return <AdminDashboard articles={articles} pendingArticles={pending} ads={ads} onPublish={publishNews} onUpdate={updateNews} onDelete={deleteNews} onApproveSubmission={approveArticle} onRejectSubmission={(id:string)=>setPending(pending.filter(a=>a.id!==id))} onApproveAd={approveAd} onRejectAd={rejectAd} onLogout={()=>{setIsAdmin(false); setView('home');}} />;

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
      <Header onNavigate={setView} toggleTheme={toggleTheme} isDark={isDark} activeAd={activeAds.find(a=>a.plan==='Header Leaderboard')} />
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
                        <div className="lg:col-span-2 cursor-pointer group" onClick={()=> {setSelectedArticle(filtered[0]); setView('article');}}>
                            <div className="relative h-[400px] rounded-xl overflow-hidden mb-4">
                                <img src={filtered[0].image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 object-center" />
                                {filtered[0].isBreaking && <span className="absolute top-4 left-4 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">Breaking News</span>}
                            </div>
                            <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                                <span className="bg-naija text-white text-xs font-bold px-2 py-1 rounded uppercase">{filtered[0].category}</span>
                                <h2 className="text-3xl font-serif font-bold mt-2 mb-2 dark:text-white">{filtered[0].title}</h2>
                                <p className="text-gray-600 dark:text-gray-400 line-clamp-2">{filtered[0].subHeadline || filtered[0].excerpt}</p>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border dark:border-gray-700">
                                <h3 className="font-bold mb-4 dark:text-white flex items-center gap-2"><TrendingUp className="w-4 h-4 text-naija"/> Trending</h3>
                                <div className="space-y-4">
                                    {articles.slice(1,4).map((a,i) => (
                                        <div key={a.id} onClick={()=>{setSelectedArticle(a); setView('article');}} className="flex gap-3 cursor-pointer group">
                                            <span className="text-2xl font-bold text-gray-300">0{i+1}</span>
                                            <div><h4 className="font-bold text-sm dark:text-white line-clamp-2 group-hover:text-naija">{a.title}</h4></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {activeAds.find(a=>a.plan==='Sidebar Banner') ? (
                                <a href={activeAds.find(a=>a.plan==='Sidebar Banner')?.adUrl||'#'} target="_blank" className="block h-64 bg-gray-100 rounded-xl overflow-hidden relative">
                                    <img src={activeAds.find(a=>a.plan==='Sidebar Banner')?.adImage} className="w-full h-full object-cover object-center" />
                                    <span className="absolute bottom-1 right-1 bg-black/50 text-white text-[10px] px-1">Ad</span>
                                </a>
                            ) : (
                                <div className="h-64 bg-gray-50 border-2 border-dashed flex flex-col items-center justify-center text-center p-4 rounded-xl">
                                    <span className="text-sm font-bold text-gray-400">Ad Space Available</span>
                                    <button onClick={()=>setView('advertise')} className="text-xs text-naija mt-2 underline">Place Ad</button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <h3 className="text-2xl font-serif font-bold mb-6 dark:text-white flex items-center gap-2"><LayoutGrid className="w-6 h-6"/> Latest Stories</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {feed.slice(1).map((item: any) => item.isAd ? (
                        <SponsoredArticleCard key={item.data.id} ad={item.data} />
                    ) : (
                        <ArticleCard key={item.id} article={item} onClick={()=>{setSelectedArticle(item); setView('article');}} />
                    ))}
                </div>
            </div>
        )}

        {view === 'article' && selectedArticle && (
            <ArticleReader article={selectedArticle} allArticles={articles} onBack={()=>setView('home')} onNavigateToArticle={(a:Article)=>{setSelectedArticle(a); window.scrollTo(0,0);}} isAdmin={isAdmin} />
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