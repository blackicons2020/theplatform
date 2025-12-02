import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Menu, Search, Bell, User, ChevronRight, MessageSquare, Share2, 
  Bookmark, X, Camera, Send, CheckCircle, AlertCircle, 
  TrendingUp, Shield, FileText, Users, DollarSign, 
  LayoutGrid, PenTool, Image as ImageIcon, Sun, Moon,
  CreditCard, Trash2, Lock, Globe, Facebook, Twitter, Instagram, Linkedin, Youtube,
  Link as LinkIcon, ExternalLink, ArrowRight, RefreshCw
} from 'lucide-react';

// --- Configuration ---
// ✅ LIVE BACKEND URL
const API_URL = "https://platform-backend-54nn.onrender.com/api"; 
// ✅ LIVE FRONTEND URL (For sharing links)
const APP_URL = window.location.origin; 

// --- Error Boundary Component ---
// This prevents the "White Screen" crash if data loading fails
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center p-4">
          <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong.</h1>
          <p className="text-gray-600 mb-6">We couldn't load the application correctly. Please refresh.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// --- Types ---

interface Comment {
  id: string;
  author: string;
  email: string;
  content: string;
  date: string;
  articleId: string;
}

interface Article {
  id: string;
  title: string;
  subHeadline?: string;
  category: string;
  author: string;
  date: string;
  image: string;
  excerpt: string;
  content: string;
  views: string;
  isBreaking?: boolean; 
  status?: string;
}

// Helper to map Database columns to Frontend
const mapArticleFromDB = (dbArticle: any): Article => ({
  ...dbArticle,
  subHeadline: dbArticle.sub_headline || '',
  isBreaking: dbArticle.is_breaking, 
  date: dbArticle.date ? new Date(dbArticle.date).toLocaleDateString() : 'Just now'
});

interface Advertisement {
  id: string;
  clientName: string;
  email: string;
  plan: 'Sidebar Banner' | 'Sponsored Article' | 'Header Leaderboard';
  amount: number;
  status: 'Pending' | 'Active' | 'Rejected';
  dateSubmitted: string;
  receiptImage: string;
  adImage?: string;
  adContent?: string;
  adUrl?: string;
  adHeadline?: string;
}

// --- Utility Functions ---

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
    
    let shareLink = '';
    switch(platform) {
        case 'facebook': shareLink = `https://www.facebook.com/sharer/sharer.php?u=${url}`; break;
        case 'twitter': shareLink = `https://twitter.com/intent/tweet?text=${text}&url=${url}`; break;
        case 'whatsapp': shareLink = `https://wa.me/?text=${text}%20${url}`; break;
        case 'linkedin': shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`; break;
    }
    if(shareLink) window.open(shareLink, '_blank');
};

// --- Components ---

function Header({ onNavigate, toggleTheme, isDark, activeAd }: any) {
  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-300">
      {activeAd && (
        <div className="bg-gray-100 dark:bg-gray-800 w-full overflow-hidden h-24 md:h-32 relative flex items-center justify-center">
          <a href={activeAd.adUrl || '#'} target={activeAd.adUrl ? "_blank" : "_self"} rel="noreferrer" className="w-full h-full">
             {activeAd.adImage ? (
               <img src={activeAd.adImage} alt="Advertisement" className="w-full h-full object-cover object-center" />
             ) : (
               <div className="flex items-center justify-center h-full text-gray-400 text-sm">Leaderboard Ad Area</div>
             )}
          </a>
          <span className="absolute top-1 right-1 bg-black/50 text-white text-[10px] px-1">Ad</span>
        </div>
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('home')}>
            <div className="w-10 h-10 bg-naija rounded-full flex items-center justify-center text-white font-bold text-sm tracking-wider shadow-md">
              <Globe className="w-6 h-6" />
            </div>
            <div className="flex flex-col justify-center">
              <h1 className="font-sans text-lg md:text-xl font-bold text-gray-900 dark:text-white tracking-tight leading-none">
                The Platform
              </h1>
            </div>
          </div>
        </div>
   
        <div className="flex items-center gap-2 md:gap-4">
          <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            {isDark ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-600" />}
          </button>
          <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors hidden md:block">
            <Search className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <button 
            onClick={() => onNavigate('submit')}
            className="hidden md:flex items-center gap-2 bg-naija hover:bg-green-700 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors shadow-sm"
          >
            <PenTool className="w-4 h-4" />
            Submit News
          </button>
          <button 
            onClick={() => onNavigate('advertise')}
            className="hidden md:flex items-center gap-2 border border-naija text-naija hover:bg-green-50 dark:hover:bg-gray-700 px-4 py-2 rounded-full text-sm font-medium transition-colors"
          >
            Advertise
          </button>
        </div>
      </div>
    </header>
  );
}

function ArticleCard({ article, onClick }: any) {
  return (
    <div 
      onClick={onClick}
      className="group bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100 dark:border-gray-700 flex flex-col h-full"
    >
      <div className="relative h-48 w-full overflow-hidden flex-shrink-0">
        <img 
          src={article.image || 'https://via.placeholder.com/400'} 
          alt={article.title}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
        />
         {article.isBreaking && (
            <div className="absolute top-4 left-4">
              <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md animate-pulse flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Breaking
              </span>
            </div>
          )}
      </div>
      <div className="p-5 flex flex-col flex-grow">
        <div className="mb-3">
          <span className="bg-naija text-white text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider inline-block mb-2">
              {article.category}
          </span>
           <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span className="font-medium text-gray-900 dark:text-gray-200">{article.author}</span>
              <span>•</span>
              <span>{article.date}</span>
          </div>
        </div>
       
        <h3 className="font-serif text-xl font-bold text-gray-900 dark:text-white mb-2 leading-tight group-hover:text-naija transition-colors line-clamp-3">
          {article.title}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed line-clamp-3 mb-4 flex-grow">
          {article.excerpt}
        </p>
        <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <Users className="w-3 h-3" /> {article.views} reads
          </span>
          <span className="text-naija text-sm font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            Read Article <ChevronRight className="w-4 h-4" />
          </span>
        </div>
      </div>
    </div>
  );
}

function SponsoredArticleCard({ ad }: { ad: Advertisement }) {
  return (
    <div className="group bg-green-50 dark:bg-green-900/20 rounded-xl overflow-hidden shadow-sm border-2 border-green-100 dark:border-green-800/50 flex flex-col h-full">
      <div className="relative h-48 w-full overflow-hidden flex-shrink-0">
        <img 
          src={ad.adImage || 'https://via.placeholder.com/800x400?text=Sponsored+Content'} 
          alt={ad.clientName}
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute top-4 left-4">
          <span className="bg-yellow-500 text-black text-xs font-bold px-3 py-1 rounded-full shadow-md uppercase tracking-wider">
            Sponsored
          </span>
        </div>
      </div>
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="font-serif text-xl font-bold text-gray-900 dark:text-white mb-2 leading-tight line-clamp-3">
          {ad.adHeadline || `Spotlight on ${ad.clientName}`}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed line-clamp-3 mb-4 flex-grow">
          {ad.adContent || "Check out this special feature from our partners."}
        </p>
        <div className="mt-auto">
          {ad.adUrl && (
              <a 
              href={ad.adUrl} 
              target="_blank" 
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm font-bold text-naija hover:underline"
              >
              Visit Website <ChevronRight className="w-4 h-4" />
              </a>
          )}
        </div>
      </div>
    </div>
  );
}

function AdvertisePage({ onBack, onSubmitAd }: any) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'info' | 'form'>('info'); // 'info' or 'form'
  const [selectedPlan, setSelectedPlan] = useState<Advertisement['plan'] | null>(null);
  const [clientName, setClientName] = useState('');
  const [email, setEmail] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string>('');
   
  const [adImageFile, setAdImageFile] = useState<File | null>(null);
  const [adImagePreview, setAdImagePreview] = useState<string>('');
  const [adContent, setAdContent] = useState('');
  const [adHeadline, setAdHeadline] = useState('');

  const plans = [
    { name: 'Sidebar Banner', price: 20000, features: ['Visible on all article pages', 'Square format', 'Weekly rotation'] },
    { name: 'Sponsored Article', price: 70000, features: ['Full feature story', 'Permanent link', 'Shared on social media', 'In-feed native display'] },
    { name: 'Header Leaderboard', price: 150000, features: ['Premium top placement', 'High visibility', 'Monthly duration', 'All pages'] },
  ];

  const handlePlanSelect = (planName: string) => {
    setSelectedPlan(planName as any);
    setPaymentStep('info'); // Reset to step 1
    setShowPaymentModal(true);
  };

  const handleReceiptChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setReceiptFile(file);
      try {
        const base64 = await readFileAsDataURL(file);
        setReceiptPreview(base64);
      } catch (err) { console.error(err); }
    }
  };

  const handleAdImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAdImageFile(file);
      try {
        const base64 = await readFileAsDataURL(file);
        setAdImagePreview(base64);
      } catch (err) { console.error(err); }
    }
  };

  const handleSubmitProof = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan || !receiptPreview) return;

    const newAd: any = {
      clientName,
      email,
      plan: selectedPlan,
      amount: plans.find(p => p.name === selectedPlan)?.price || 0,
      receiptImage: receiptPreview,
      adImage: adImagePreview,
      adContent: selectedPlan === 'Sponsored Article' ? adContent : undefined,
      adHeadline: selectedPlan === 'Sponsored Article' ? adHeadline : undefined,
    };

    onSubmitAd(newAd);
    setShowPaymentModal(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button onClick={onBack} className="mb-6 flex items-center text-gray-600 dark:text-gray-400">
        <ChevronRight className="w-4 h-4 rotate-180" /> Back
      </button>

      <div className="text-center mb-12">
        <h2 className="text-3xl font-serif font-bold text-gray-900 dark:text-white mb-4">Advertise with The Platform</h2>
        <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">Reach millions of Nigerians daily. Choose the plan that fits your brand.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <div key={plan.name} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700 flex flex-col">
            <div className="p-6 bg-gray-50 dark:bg-gray-700/50">
              <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-2">{plan.name}</h3>
              <p className="text-3xl font-bold text-naija">₦{plan.price.toLocaleString()}</p>
            </div>
            <div className="p-6 flex-grow">
              <ul className="space-y-3">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <CheckCircle className="w-4 h-4 text-green-500" /> {feature}
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-6 pt-0">
              <button 
                onClick={() => handlePlanSelect(plan.name)}
                className="w-full bg-gray-900 dark:bg-white dark:text-gray-900 text-white py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                Choose Plan
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Payment Modal - SMALL & COMPACT */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-sm max-h-[80vh] overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col">
            <div className="p-3 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800 shrink-0">
               <h3 className="font-bold text-sm dark:text-white">{paymentStep === 'info' ? 'Payment Details' : 'Submit Ad'}</h3>
               <button onClick={() => setShowPaymentModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-5 overflow-y-auto">
                {/* STEP 1: PAYMENT INFORMATION */}
                {paymentStep === 'info' && (
                    <div className="text-center">
                        <div className="flex justify-center mb-3">
                            <div className="bg-green-100 p-2 rounded-full">
                                <CreditCard className="w-6 h-6 text-naija" />
                            </div>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mb-4">Transfer <span className="font-bold">₦{plans.find(p => p.name === selectedPlan)?.price.toLocaleString()}</span> to:</p>
                        
                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 mb-4 space-y-2">
                            <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-1">
                                <span className="text-[10px] uppercase text-gray-500 dark:text-gray-400">Bank</span>
                                <span className="font-bold text-xs text-gray-900 dark:text-white">Polaris Bank</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-1">
                                <span className="text-[10px] uppercase text-gray-500 dark:text-gray-400">Account</span>
                                <span className="font-bold text-xs text-gray-900 dark:text-white">Clean Connect</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] uppercase text-gray-500 dark:text-gray-400">Number</span>
                                <span className="font-mono font-bold text-sm text-naija">4092144856</span>
                            </div>
                        </div>

                        <button 
                            onClick={() => setPaymentStep('form')}
                            className="w-full bg-naija text-white py-2.5 rounded-lg font-bold text-xs hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                        >
                            I Have Made Payment <ArrowRight className="w-3 h-3" />
                        </button>
                    </div>
                )}

                {/* STEP 2: SUBMISSION FORM */}
                {paymentStep === 'form' && (
                    <form onSubmit={handleSubmitProof} className="space-y-3">
                        <div>
                            <label className="block text-[10px] font-bold uppercase mb-1 dark:text-gray-400">Name / Business</label>
                            <input required type="text" value={clientName} onChange={e => setClientName(e.target.value)} className="w-full p-2 text-xs border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:border-naija outline-none" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold uppercase mb-1 dark:text-gray-400">Email</label>
                            <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-2 text-xs border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:border-naija outline-none" />
                        </div>

                        {selectedPlan === 'Sponsored Article' && (
                            <>
                            <div>
                                <label className="block text-[10px] font-bold uppercase mb-1 dark:text-gray-400">Headline</label>
                                <input required type="text" value={adHeadline} onChange={e => setAdHeadline(e.target.value)} className="w-full p-2 text-xs border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:border-naija outline-none" placeholder="Ad Title" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold uppercase mb-1 dark:text-gray-400">Content</label>
                                <textarea required value={adContent} onChange={e => setAdContent(e.target.value)} className="w-full p-2 text-xs border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white h-16 focus:border-naija outline-none resize-none" placeholder="Ad text..." />
                            </div>
                            </>
                        )}

                        <div className="border-t pt-2 dark:border-gray-700">
                            <p className="font-bold text-[10px] mb-1 dark:text-white uppercase">Ad Image</p>
                            <input required type="file" accept="image/*" onChange={handleAdImageChange} className="w-full text-[10px] dark:text-gray-300" />
                        </div>

                        <div className="border-t pt-2 dark:border-gray-700">
                            <label className="block text-[10px] font-bold uppercase mb-1 dark:text-gray-400">Payment Receipt</label>
                            <input required type="file" accept="image/*" onChange={handleReceiptChange} className="w-full text-[10px] dark:text-gray-300" />
                        </div>

                        <button type="submit" className="w-full bg-naija text-white py-3 rounded-lg font-bold text-xs hover:bg-green-700 mt-2 shadow-sm">
                            Submit Proof & Creative
                        </button>
                    </form>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function ArticleReader({ article, allArticles, onBack, onNavigateToArticle, isAdmin }: any) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentName, setCommentName] = useState('');
  const [commentEmail, setCommentEmail] = useState('');
  const [commentContent, setCommentContent] = useState('');
  const [showShareMenu, setShowShareMenu] = useState(false);
  
  const relatedArticles = allArticles
    .filter((a:any) => a.category === article.category && a.id !== article.id)
    .slice(0, 3);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [article.id]);

  useEffect(() => {
    fetch(`${API_URL}/articles/${article.id}/comments`)
      .then(res => res.json())
      .then(data => {
          if(Array.isArray(data)) setComments(data);
      })
      .catch(err => console.error("Error fetching comments:", err));
  }, [article.id]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentName.trim() || !commentContent.trim() || !commentEmail.trim()) return;

    try {
        const res = await fetch(`${API_URL}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                articleId: article.id,
                author: commentName,
                email: commentEmail,
                content: commentContent
            })
        });

        if (res.ok) {
            const newComment = await res.json();
            setComments([newComment, ...comments]);
            setCommentName('');
            setCommentEmail('');
            setCommentContent('');
        }
    } catch (err) {
        console.error("Error posting comment", err);
        alert("Failed to post comment");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-gray-500 hover:text-naija mb-6 transition-colors"
      >
        <ChevronRight className="w-4 h-4 rotate-180" /> Back to News
      </button>

      <article className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden mb-8">
        {/* IMAGE SECTION - CLEAN, NO TEXT */}
        <div className="h-64 md:h-[500px] w-full relative">
          <img 
            src={article.image || 'https://via.placeholder.com/800'} 
            alt={article.title}
            className="w-full h-full object-cover object-center"
          />
        </div>

        <div className="p-8">
          {/* TITLE & METADATA SECTION - BELOW IMAGE */}
          <div className="mb-8">
              <div className="mb-4">
                  <span className="bg-naija text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                      {article.category}
                  </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 dark:text-white leading-tight mb-4">
                  {article.title}
              </h1>
              {article.subHeadline && (
                  <p className="text-xl text-gray-600 dark:text-gray-300 font-medium leading-relaxed border-l-4 border-naija pl-4">
                      {article.subHeadline}
                  </p>
              )}
          </div>

          <div className="flex items-center justify-between py-6 border-y border-gray-100 dark:border-gray-700 mb-8 relative">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-gray-400" />
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white">{article.author}</p>
                <p className="text-sm text-gray-500">{article.date}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                  <button 
                      onClick={() => setShowShareMenu(!showShareMenu)}
                      className="p-2 text-gray-400 hover:text-naija transition-colors"
                      title="Share this article"
                  >
                      <Share2 className="w-5 h-5" />
                  </button>
                  {showShareMenu && (
                      <div className="absolute right-0 top-10 bg-white dark:bg-gray-700 shadow-xl rounded-lg p-2 flex flex-col gap-2 min-w-[150px] z-20 border border-gray-100 dark:border-gray-600">
                           <button onClick={() => handleSocialShare('whatsapp', article.title)} className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded text-sm text-left dark:text-white">
                              <MessageSquare className="w-4 h-4 text-green-500" /> WhatsApp
                           </button>
                           <button onClick={() => handleSocialShare('facebook', article.title)} className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded text-sm text-left dark:text-white">
                              <Facebook className="w-4 h-4 text-blue-600" /> Facebook
                           </button>
                           <button onClick={() => handleSocialShare('twitter', article.title)} className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded text-sm text-left dark:text-white">
                              <Twitter className="w-4 h-4 text-sky-400" /> Twitter
                           </button>
                           <button onClick={() => handleSocialShare('linkedin', article.title)} className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded text-sm text-left dark:text-white">
                              <Linkedin className="w-4 h-4 text-blue-700" /> LinkedIn
                           </button>
                      </div>
                  )}
              </div>
              <button className="p-2 text-gray-400 hover:text-naija transition-colors">
                <Bookmark className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* CONTENT - FULLY JUSTIFIED TEXT */}
          <div className="prose dark:prose-invert max-w-none">
            <div className="text-gray-800 dark:text-gray-200 leading-loose space-y-4 text-lg">
              {article.content.split('\n').map((paragraph, idx) => (
                <p key={idx} className="text-justify">{paragraph}</p> 
              ))}
            </div>
          </div>
        </div>

        {/* RELATED ARTICLES */}
        {relatedArticles.length > 0 && (
            <div className="p-8 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">You might also like</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {relatedArticles.map((rel:any) => (
                        <div 
                            key={rel.id} 
                            onClick={() => onNavigateToArticle(rel)}
                            className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm hover:shadow-md cursor-pointer transition-all flex flex-col"
                        >
                            <div className="h-32 w-full overflow-hidden flex-shrink-0">
                                <img src={rel.image} alt={rel.title} className="w-full h-full object-cover object-center" />
                            </div>
                            <div className="p-4 flex flex-col flex-grow">
                                <span className="text-xs text-naija font-bold uppercase mb-1">{rel.category}</span>
                                <h4 className="font-bold text-sm text-gray-900 dark:text-white leading-tight line-clamp-2 flex-grow">{rel.title}</h4>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* Advertisement */}
        <div className="bg-white dark:bg-gray-800 p-8 text-center border-t border-gray-100 dark:border-gray-700">
          <p className="text-sm text-gray-400 uppercase tracking-widest mb-2">Advertisement</p>
          <div className="h-32 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600">
            <span className="text-gray-400 font-medium">Place your ad here</span>
          </div>
        </div>

        {/* Comments */}
        <div className="p-8 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-naija" />
            Comments ({comments.length})
          </h3>

          <form onSubmit={handleSubmitComment} className="mb-8 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={commentName}
                  onChange={(e) => setCommentName(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent dark:text-white focus:ring-2 focus:ring-naija focus:border-transparent outline-none transition-all"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  required
                  value={commentEmail}
                  onChange={(e) => setCommentEmail(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent dark:text-white focus:ring-2 focus:ring-naija focus:border-transparent outline-none transition-all"
                  placeholder="john@example.com"
                />
                <p className="text-xs text-gray-500 mt-1">Your email will not be published.</p>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Comment <span className="text-red-500">*</span></label>
              <textarea
                required
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent dark:text-white focus:ring-2 focus:ring-naija focus:border-transparent outline-none transition-all h-24 resize-none"
                placeholder="Share your thoughts..."
              ></textarea>
            </div>
            <button 
              type="submit"
              className="bg-naija hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Send className="w-4 h-4" /> Post Comment
            </button>
          </form>

          <div className="space-y-4">
            {comments.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Be the first to comment!</p>
            ) : (
              comments.map(comment => (
                <div key={comment.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-naija/10 rounded-full flex items-center justify-center text-naija font-bold text-xs">
                        {comment.author.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-gray-900 dark:text-white">{comment.author}</h4>
                        <span className="text-xs text-gray-500">{new Date(comment.date).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 text-sm pl-11">{comment.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </article>
    </div>
  );
}

function StaffLoginPage({ onLogin, onBack }: any) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'adminOdohhhhh1@') {
      onLogin();
    } else {
      setError('Invalid Access Code');
    }
  };

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
      </div>
    </div>
  );
}

function AdminDashboard({ articles, pendingArticles, ads, onPublish, onUpdate, onDelete, onApproveSubmission, onRejectSubmission, onApproveAd, onRejectAd, onLogout }: any) {
  const [activeTab, setActiveTab] = useState<'live' | 'pending' | 'compose' | 'ads'>('live');
  const [editingId, setEditingId] = useState<string|null>(null);
  const [title, setTitle] = useState('');
  const [subHeadline, setSubHeadline] = useState('');
  const [category, setCategory] = useState('Politics');
  const [authorName, setAuthorName] = useState('Staff Reporter');
  const [showAuthor, setShowAuthor] = useState(true);
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isBreaking, setIsBreaking] = useState(false);
  const [lastPublishedTitle, setLastPublishedTitle] = useState<string | null>(null);
  const [viewAdId, setViewAdId] = useState<string | null>(null);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
      try { setImagePreview(await readFileAsDataURL(e.target.files[0])); } catch(err) { console.error(err); }
    }
  };

  const handleEditClick = (article: Article) => {
    setEditingId(article.id);
    setTitle(article.title);
    setSubHeadline(article.subHeadline || '');
    setCategory(article.category);
    setContent(article.content);
    setAuthorName(article.author);
    setImagePreview(article.image);
    setIsBreaking(article.isBreaking || false);
    setActiveTab('compose');
  };

  const handleSafeDelete = (id: string) => {
    if (window.confirm("Do you really want to delete this news item? This action cannot be undone.")) {
      onDelete(id);
    }
  };

  const handlePublishOrUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAuthor = showAuthor ? authorName : "The Platform";
    const article: any = {
      title, subHeadline, category, author: finalAuthor, image: imagePreview || 'https://via.placeholder.com/800x400',
      excerpt: content.substring(0, 100) + '...', content, isBreaking, status: 'published'
    };

    if (editingId) {
      onUpdate(editingId, article);
      alert('Article Updated Successfully!');
      setEditingId(null);
    } else {
      onPublish(article);
      setLastPublishedTitle(article.title);
    }
    
    setTitle(''); setSubHeadline(''); setContent(''); setImagePreview(''); setIsBreaking(false);
    if(editingId) setActiveTab('live');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 p-4 shadow flex justify-between items-center sticky top-0 z-20">
        <span className="font-bold flex items-center gap-2 dark:text-white"><Shield className="w-5 h-5"/> Editorial</span>
        <button onClick={onLogout} className="text-red-500 text-sm font-bold">Logout</button>
      </div>
      
      <div className="p-4 max-w-5xl mx-auto">
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {['live','pending','ads','compose'].map(t => (
                <button key={t} onClick={()=>setActiveTab(t as any)} className={`px-4 py-2 rounded-full text-xs font-bold uppercase ${activeTab===t ? 'bg-black text-white' : 'bg-white text-gray-600 border'}`}>
                    {t} {t==='pending' && `(${pendingArticles.length})`} {t==='ads' && `(${ads.filter((a:any)=>a.status==='Pending').length})`}
                </button>
            ))}
        </div>

        {activeTab === 'live' && (
            <div className="space-y-3">
                {articles.map((a:any) => (
                    <div key={a.id} className="bg-white dark:bg-gray-800 p-3 rounded shadow flex justify-between items-center">
                        <div className="flex gap-3 items-center">
                            <img src={a.image} className="w-10 h-10 rounded object-cover" />
                            <div><h4 className="font-bold text-sm dark:text-white line-clamp-1">{a.title}</h4><span className="text-xs text-gray-500">{a.date}</span></div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={()=>handleEditClick(a)} className="text-blue-500 text-xs font-bold border px-2 py-1 rounded">Edit</button>
                            <button onClick={()=>handleSafeDelete(a.id)} className="text-red-500 text-xs font-bold border px-2 py-1 rounded">Delete</button>
                        </div>
                    </div>
                ))}
            </div>
        )}

        {activeTab === 'compose' && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded shadow">
                <h3 className="font-bold mb-4 dark:text-white">{editingId ? 'Edit Article' : 'Compose New'}</h3>
                <form onSubmit={handlePublishOrUpdate} className="space-y-4">
                    <input required placeholder="Headline" value={title} onChange={e=>setTitle(e.target.value)} className="w-full border p-2 rounded text-sm" />
                    <input placeholder="Sub-Headline" value={subHeadline} onChange={e=>setSubHeadline(e.target.value)} className="w-full border p-2 rounded text-sm" />
                    <div className="grid grid-cols-2 gap-4">
                        <select value={category} onChange={e=>setCategory(e.target.value)} className="border p-2 rounded text-sm">
                            {['Politics','Metro','Business','Technology','Sports','Entertainment','Education','Editorials'].map(c=><option key={c}>{c}</option>)}
                        </select>
                        <div className="flex items-center gap-2">
                            <input type="checkbox" checked={showAuthor} onChange={e=>setShowAuthor(e.target.checked)} />
                            <input value={authorName} onChange={e=>setAuthorName(e.target.value)} disabled={!showAuthor} className="border p-2 rounded text-sm w-full" />
                        </div>
                    </div>
                    <input type="file" onChange={handleImageChange} className="text-xs" />
                    <textarea required placeholder="Content" value={content} onChange={e=>setContent(e.target.value)} className="w-full border p-2 rounded h-40 text-sm" />
                    <div className="flex items-center gap-2">
                        <input type="checkbox" checked={isBreaking} onChange={e=>setIsBreaking(e.target.checked)} />
                        <label className="text-red-600 font-bold text-sm">Breaking News</label>
                    </div>
                    <button className="bg-green-600 text-white w-full py-3 rounded font-bold">{editingId ? 'Update' : 'Publish Live'}</button>
                </form>
            </div>
        )}

        {/* Pending & Ads tabs kept simple for brevity but fully functional */}
        {activeTab === 'pending' && pendingArticles.map((a:any) => (
            <div key={a.id} className="bg-white p-4 rounded shadow mb-2">
                <h4 className="font-bold">{a.title}</h4>
                <div className="flex gap-2 mt-2">
                    <button onClick={()=>onApproveSubmission(a)} className="bg-green-500 text-white px-3 py-1 rounded text-xs">Approve</button>
                    <button onClick={()=>onRejectSubmission(a.id)} className="bg-red-500 text-white px-3 py-1 rounded text-xs">Reject</button>
                </div>
            </div>
        ))}

        {activeTab === 'ads' && ads.filter((a:any)=>a.status==='Pending').map((a:any) => (
            <div key={a.id} className="bg-white p-4 rounded shadow mb-2 border-l-4 border-yellow-400">
                <div className="flex justify-between">
                    <h4 className="font-bold">{a.plan}</h4>
                    <span className="text-green-600 font-mono font-bold">₦{a.amount.toLocaleString()}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 my-2">
                    <img src={a.receiptImage} className="h-20 object-cover border" onClick={() => setViewAdId(a.id)} />
                    <img src={a.adImage} className="h-20 object-cover border" />
                </div>
                <div className="flex gap-2">
                    <button onClick={()=>onApproveAd(a.id)} className="bg-green-500 text-white px-3 py-1 rounded text-xs flex-1">Approve</button>
                    <button onClick={()=>onRejectAd(a.id)} className="bg-red-500 text-white px-3 py-1 rounded text-xs flex-1">Reject</button>
                </div>
            </div>
        ))}
      </div>
      {viewAdId && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-8" onClick={() => setViewAdId(null)}>
           <img src={ads.find(a => a.id === viewAdId)?.receiptImage} className="max-h-full max-w-full" />
        </div>
      )}
    </div>
  );
}

function SubmitNewsPage({ onBack, onSubmit }: any) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Politics');
  const [content, setContent] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  
  const submit = (e: any) => {
    e.preventDefault();
    onSubmit({ title, category, content, image: imagePreview, author: 'Citizen Reporter' });
  };

  const handleFile = async (e: any) => {
    if(e.target.files?.[0]) setImagePreview(await readFileAsDataURL(e.target.files[0]));
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <button onClick={onBack} className="mb-6 flex items-center text-gray-500 text-sm"><ChevronRight className="w-4 h-4 rotate-180"/> Back</button>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
        <h2 className="text-2xl font-bold mb-6 dark:text-white">Submit Story</h2>
        <form onSubmit={submit} className="space-y-4">
            <input required placeholder="Headline" value={title} onChange={e=>setTitle(e.target.value)} className="w-full border p-3 rounded" />
            <select value={category} onChange={e=>setCategory(e.target.value)} className="w-full border p-3 rounded">
                {['Politics','Metro','Business','Technology','Sports','Entertainment','Education','Editorials'].map(c=><option key={c}>{c}</option>)}
            </select>
            <input type="file" onChange={handleFile} className="text-sm" />
            <textarea required placeholder="Content" value={content} onChange={e=>setContent(e.target.value)} className="w-full border p-3 rounded h-40" />
            <button className="bg-naija text-white w-full py-3 rounded font-bold">Submit for Review</button>
        </form>
      </div>
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
    const res = await fetch(`${API_URL}/admin/pending-articles`);
    const data = await res.json();
    if(Array.isArray(data)) setPending(data.map(mapArticleFromDB));
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
    if(res.ok) setAds([...ads, await res.json()]);
  };

  // Rendering
  if(loading) return <div className="min-h-screen flex items-center justify-center"><RefreshCw className="animate-spin text-green-600"/></div>;
  if(view === 'login') return <StaffLoginPage onLogin={handleAdminLogin} onBack={()=>setView('home')}/>;
  if(view === 'admin' && isAdmin) return <AdminDashboard articles={articles} pendingArticles={pending} ads={ads} onPublish={publishNews} onUpdate={updateNews} onDelete={deleteNews} onApproveSubmission={approveArticle} onRejectSubmission={(id:string)=>setPending(pending.filter(a=>a.id!==id))} onApproveAd={approveAd} onRejectAd={(id:string)=>setAds(ads.filter(a=>a.id!==id))} onLogout={()=>{setIsAdmin(false); setView('home');}} />;

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
                    {['All','Politics','Metro','Business','Technology','Sports','Entertainment','Education','Editorials'].map(c => (
                        <button key={c} onClick={()=>setCat(c)} className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${cat===c ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'}`}>{c}</button>
                    ))}
                </div>

                {filtered.length > 0 && (
                    <div className="mb-12 grid lg:grid-cols-3 gap-8">
                        {/* HERO */}
                        <div className="lg:col-span-2 cursor-pointer group" onClick={()=> {setSelectedArticle(filtered[0]); setView('article');}}>
                            <div className="relative h-[400px] rounded-xl overflow-hidden mb-4">
                                <img src={filtered[0].image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                {filtered[0].isBreaking && <span className="absolute top-4 left-4 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">Breaking News</span>}
                            </div>
                            <span className="bg-naija text-white text-xs font-bold px-2 py-1 rounded uppercase">{filtered[0].category}</span>
                            <h2 className="text-3xl font-serif font-bold mt-2 mb-2 dark:text-white">{filtered[0].title}</h2>
                            <p className="text-gray-600 dark:text-gray-400 line-clamp-2">{filtered[0].subHeadline || filtered[0].excerpt}</p>
                        </div>
                        {/* SIDEBAR */}
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
                            {/* SIDE AD */}
                            {activeAds.find(a=>a.plan==='Sidebar Banner') ? (
                                <a href={activeAds.find(a=>a.plan==='Sidebar Banner')?.adUrl||'#'} target="_blank" className="block h-64 bg-gray-100 rounded-xl overflow-hidden relative">
                                    <img src={activeAds.find(a=>a.plan==='Sidebar Banner')?.adImage} className="w-full h-full object-cover" />
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
      <footer className="bg-white dark:bg-gray-800 border-t dark:border-gray-700 py-8 text-center text-sm text-gray-500">
        &copy; 2024 The Platform. All rights reserved.
      </footer>
    </div>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(<ErrorBoundary><App /></ErrorBoundary>);