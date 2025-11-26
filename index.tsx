import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Menu, Search, Bell, User, ChevronRight, MessageSquare, Share2, 
  Bookmark, X, Camera, Send, CheckCircle, AlertCircle, 
  TrendingUp, Shield, FileText, Users, DollarSign, 
  LayoutGrid, PenTool, Image as ImageIcon, Sun, Moon,
  CreditCard, Trash2, Lock, Globe, Facebook, Twitter, Instagram, Linkedin, Youtube
} from 'lucide-react';

// --- Configuration ---
// ✅ LIVE BACKEND URL
const API_URL = "https://platform-backend-54nn.onrender.com/api"; 

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

// Helper to match Database columns (snake_case) to Frontend (camelCase)
const mapArticleFromDB = (dbArticle: any): Article => ({
  ...dbArticle,
  isBreaking: dbArticle.is_breaking, 
  date: new Date(dbArticle.date).toLocaleDateString() 
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

// --- Components ---

const Header: React.FC<{ 
  onNavigate: (view: string) => void; 
  toggleTheme: () => void; 
  isDark: boolean;
  activeAd?: Advertisement;
  onCategorySelect: (category: string) => void;
}> = ({ onNavigate, toggleTheme, isDark, activeAd, onCategorySelect }) => {
  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-300">
      {activeAd && (
        <div className="bg-gray-100 dark:bg-gray-800 w-full overflow-hidden h-24 md:h-32 relative flex items-center justify-center">
          <a href={activeAd.adUrl || '#'} target={activeAd.adUrl ? "_blank" : "_self"} rel="noreferrer" className="w-full h-full">
             {activeAd.adImage ? (
               <img src={activeAd.adImage} alt="Advertisement" className="w-full h-full object-cover" />
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
                The People’s Platform
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
};

const ArticleCard: React.FC<{ article: Article; onClick: () => void }> = ({ article, onClick }) => (
  <div 
    onClick={onClick}
    className="group bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100 dark:border-gray-700"
  >
    <div className="relative h-48 overflow-hidden">
      <img 
        src={article.image || 'https://via.placeholder.com/400'} 
        alt={article.title}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
      <div className="absolute top-4 left-4 flex gap-2">
        <span className="bg-naija text-white text-xs font-bold px-3 py-1 rounded-full shadow-md uppercase tracking-wider">
          {article.category}
        </span>
        {article.isBreaking && (
          <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md animate-pulse flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Breaking
          </span>
        )}
      </div>
    </div>
    <div className="p-5">
      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-3">
        <span className="font-medium text-gray-900 dark:text-gray-200">{article.author}</span>
        <span>•</span>
        <span>{article.date}</span>
      </div>
      <h3 className="font-serif text-xl font-bold text-gray-900 dark:text-white mb-2 leading-tight group-hover:text-naija transition-colors">
        {article.title}
      </h3>
      <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed line-clamp-3">
        {article.excerpt}
      </p>
      <div className="mt-4 flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
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

const SponsoredArticleCard: React.FC<{ ad: Advertisement }> = ({ ad }) => (
  <div className="group bg-green-50 dark:bg-green-900/20 rounded-xl overflow-hidden shadow-sm border-2 border-green-100 dark:border-green-800/50">
    <div className="relative h-48 overflow-hidden">
      <img 
        src={ad.adImage || 'https://via.placeholder.com/800x400?text=Sponsored+Content'} 
        alt={ad.clientName}
        className="w-full h-full object-cover"
      />
      <div className="absolute top-4 left-4">
        <span className="bg-yellow-500 text-black text-xs font-bold px-3 py-1 rounded-full shadow-md uppercase tracking-wider">
          Sponsored
        </span>
      </div>
    </div>
    <div className="p-5">
      <h3 className="font-serif text-xl font-bold text-gray-900 dark:text-white mb-2 leading-tight">
        {ad.adHeadline || `Spotlight on ${ad.clientName}`}
      </h3>
      <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed line-clamp-3 mb-4">
        {ad.adContent || "Check out this special feature from our partners."}
      </p>
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
);

const ArticleReader: React.FC<{ 
  article: Article; 
  onBack: () => void;
  isAdmin: boolean;
}> = ({ article, onBack, isAdmin }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentName, setCommentName] = useState('');
  const [commentEmail, setCommentEmail] = useState('');
  const [commentContent, setCommentContent] = useState('');

  // Fetch comments when article opens
  useEffect(() => {
    fetch(`${API_URL}/articles/${article.id}/comments`)
      .then(res => res.json())
      .then(data => setComments(data))
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

      <article className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="h-64 md:h-96 w-full relative">
          <img 
            src={article.image || 'https://via.placeholder.com/800'} 
            alt={article.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-8">
            <span className="bg-naija text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4 inline-block">
              {article.category}
            </span>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-white leading-tight">
              {article.title}
            </h1>
          </div>
        </div>

        <div className="p-8">
          <div className="flex items-center justify-between py-6 border-b border-gray-100 dark:border-gray-700 mb-8">
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
              <button className="p-2 text-gray-400 hover:text-naija transition-colors">
                <Share2 className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-naija transition-colors">
                <Bookmark className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="prose dark:prose-invert max-w-none">
            <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed mb-6 font-medium">
              {article.excerpt}
            </p>
            <div className="text-gray-800 dark:text-gray-200 leading-loose space-y-4">
              {article.content.split('\n').map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>
          </div>
        </div>

        {/* Advertisement Placeholder */}
        <div className="bg-gray-50 dark:bg-gray-900 p-8 border-t border-gray-100 dark:border-gray-700 text-center">
          <p className="text-sm text-gray-400 uppercase tracking-widest mb-2">Advertisement</p>
          <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700">
            <span className="text-gray-400 font-medium">Place your ad here</span>
          </div>
        </div>

        {/* Comments Section */}
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
};

const SubmitNewsPage: React.FC<{ 
  onBack: () => void; 
  onSubmit: (article: Article) => void;
}> = ({ onBack, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Technology');
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      try {
        const base64 = await readFileAsDataURL(file);
        setImagePreview(base64);
      } catch (err) {
        console.error("Error reading file", err);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // We send data to backend, backend will assign ID and Date
    const articleData: any = {
      title,
      category,
      author: 'Citizen Reporter',
      image: imagePreview || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=1000',
      excerpt: content.substring(0, 100) + '...',
      content,
    };

    onSubmit(articleData);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <button onClick={onBack} className="mb-6 flex items-center text-gray-600 dark:text-gray-400">
        <ChevronRight className="w-4 h-4 rotate-180" /> Back
      </button>
      
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
            <PenTool className="w-6 h-6 text-naija" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Submit a Story</h2>
            <p className="text-gray-500 text-sm">Share news from your community</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
            <select 
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent dark:text-white"
            >
              <option>Politics</option>
              <option>Metro</option>
              <option>Business</option>
              <option>Technology</option>
              <option>Sports</option>
              <option>Entertainment</option>
              <option>Education</option>
              <option>Editorials</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Upload Image</label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer relative">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="h-40 mx-auto object-cover rounded-md" />
              ) : (
                <div className="flex flex-col items-center text-gray-500">
                  <ImageIcon className="w-8 h-8 mb-2" />
                  <span className="text-sm">Click to upload image from device</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent dark:text-white h-40"
              placeholder="Write your story here..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Headline</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent dark:text-white"
              placeholder="Enter article headline"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-naija hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-colors shadow-lg"
          >
            Submit for Review
          </button>
        </form>
      </div>
    </div>
  );
};

const AdvertisePage: React.FC<{ 
  onBack: () => void;
  onSubmitAd: (ad: Advertisement) => void;
}> = ({ onBack, onSubmitAd }) => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
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
        <h2 className="text-3xl font-serif font-bold text-gray-900 dark:text-white mb-4">Advertise with The People’s Platform</h2>
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

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-lg w-full p-8 relative my-8">
            <button 
              onClick={() => setShowPaymentModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
            
            <h3 className="text-2xl font-bold mb-6 dark:text-white">Complete Your Order</h3>
            
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-100 dark:border-green-800 mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Please transfer <span className="font-bold">₦{plans.find(p => p.name === selectedPlan)?.price.toLocaleString()}</span> to:</p>
              <div className="font-mono text-lg font-bold text-gray-900 dark:text-white">
                1025924586
              </div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Union Bank of Nigeria (UBA)</div>
              <div className="text-xs text-gray-500 mt-1">Account Name: Opinion platform</div>
            </div>

            <form onSubmit={handleSubmitProof} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Your Name / Business Name</label>
                <input required type="text" value={clientName} onChange={e => setClientName(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Email Address</label>
                <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white" />
              </div>

              {selectedPlan === 'Sponsored Article' && (
                <>
                  <div>
                      <label className="block text-sm font-medium mb-1 dark:text-gray-300">Article Headline</label>
                      <input required type="text" value={adHeadline} onChange={e => setAdHeadline(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white" placeholder="e.g. The Rise of Fintech" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">Article Content</label>
                    <textarea required value={adContent} onChange={e => setAdContent(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white h-32" placeholder="Paste your article text here..." />
                  </div>
                </>
              )}

              <div className="border-t pt-4 dark:border-gray-700">
                <p className="font-bold mb-2 dark:text-white">Upload Ad Creative</p>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">
                   {selectedPlan === 'Sponsored Article' ? 'Article Header Image' : 'Ad Banner Image'}
                </label>
                <input required type="file" accept="image/*" onChange={handleAdImageChange} className="w-full text-sm dark:text-gray-300 mb-2" />
              </div>

              <div className="border-t pt-4 dark:border-gray-700">
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Upload Proof of Payment (Screenshot/Receipt)</label>
                <input required type="file" accept="image/*" onChange={handleReceiptChange} className="w-full text-sm dark:text-gray-300" />
              </div>

              <button type="submit" className="w-full bg-naija text-white py-3 rounded-lg font-bold hover:bg-green-700 mt-4">
                Submit Proof & Creative
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const StaffLoginPage: React.FC<{ onLogin: () => void; onBack: () => void }> = ({ onLogin, onBack }) => {
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl max-w-md w-full">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-gray-900 dark:bg-white rounded-full flex items-center justify-center text-white dark:text-gray-900">
            <Lock className="w-8 h-8" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">Staff Access</h2>
        <p className="text-center text-gray-500 mb-8">Enter your secure access code</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent dark:text-white focus:ring-2 focus:ring-naija outline-none"
              placeholder="Access Code"
              autoFocus
            />
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button type="submit" className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold py-3 rounded-lg">
            Enter Dashboard
          </button>
          <button type="button" onClick={onBack} className="w-full text-gray-500 text-sm py-2">
            Return to Home
          </button>
        </form>
      </div>
    </div>
  );
};

const AdminDashboard: React.FC<{
  articles: Article[];
  pendingArticles: Article[];
  ads: Advertisement[];
  onPublish: (article: Article) => void;
  onDelete: (id: string) => void;
  onApproveSubmission: (article: Article) => void;
  onRejectSubmission: (id: string) => void;
  onApproveAd: (id: string) => void;
  onRejectAd: (id: string) => void;
  onLogout: () => void;
}> = ({ articles, pendingArticles, ads, onPublish, onDelete, onApproveSubmission, onRejectSubmission, onApproveAd, onRejectAd, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'live' | 'pending' | 'compose' | 'ads'>('live');
  
  // Compose State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Politics');
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isBreaking, setIsBreaking] = useState(false);

  const [viewAdId, setViewAdId] = useState<string | null>(null);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      try {
        const base64 = await readFileAsDataURL(file);
        setImagePreview(base64);
      } catch (err) { console.error(err); }
    }
  };

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    const article: any = {
      title,
      category,
      author: 'Staff Reporter',
      image: imagePreview || 'https://via.placeholder.com/800x400',
      excerpt: content.substring(0, 100) + '...',
      content,
      isBreaking
    };
    onPublish(article);
    setTitle('');
    setContent('');
    setImagePreview('');
    alert('Article Published!');
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow-sm px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2 text-gray-900 dark:text-white font-bold text-xl">
          <Shield className="w-6 h-6 text-naija" /> Editorial Dashboard
        </div>
        <button onClick={onLogout} className="text-red-500 font-medium text-sm">Log Out</button>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        <div className="flex gap-4 mb-6 overflow-x-auto">
          <button 
            onClick={() => setActiveTab('live')} 
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${activeTab === 'live' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600'}`}
          >
            Live Articles ({articles.length})
          </button>
          <button 
            onClick={() => setActiveTab('pending')} 
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${activeTab === 'pending' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600'}`}
          >
            Pending Reviews ({pendingArticles.length})
          </button>
          <button 
            onClick={() => setActiveTab('ads')} 
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${activeTab === 'ads' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600'}`}
          >
            Ad Requests ({ads.filter(a => a.status === 'Pending').length})
          </button>
          <button 
            onClick={() => setActiveTab('compose')} 
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${activeTab === 'compose' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600'}`}
          >
            Compose New
          </button>
        </div>

        {activeTab === 'live' && (
          <div className="grid gap-4">
            {articles.map(article => (
              <div key={article.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm flex justify-between items-center">
                <div className="flex gap-4">
                    <img src={article.image} className="w-16 h-16 object-cover rounded" />
                    <div>
                      <h3 className="font-bold dark:text-white">{article.title}</h3>
                      <span className="text-xs text-gray-500">{article.category} • {article.date}</span>
                    </div>
                </div>
                <button onClick={() => onDelete(article.id)} className="text-red-500 hover:bg-red-50 p-2 rounded">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'pending' && (
          <div className="grid gap-4">
            {pendingArticles.length === 0 ? <p className="text-gray-500">No pending submissions.</p> : 
             pendingArticles.map(article => (
              <div key={article.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <h3 className="font-bold text-lg dark:text-white mb-2">{article.title}</h3>
                <div className="flex gap-2 mb-4 text-xs">
                   <span className="bg-gray-100 px-2 py-1 rounded">{article.category}</span>
                   <span className="text-gray-500">By {article.author}</span>
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">{article.excerpt}</p>
                <div className="flex gap-3">
                  <button onClick={() => onApproveSubmission(article)} className="bg-green-600 text-white px-4 py-2 rounded text-sm">Approve & Publish</button>
                  <button onClick={() => onRejectSubmission(article.id)} className="bg-red-500 text-white px-4 py-2 rounded text-sm">Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'ads' && (
          <div className="grid gap-4">
            {ads.filter(ad => ad.status === 'Pending').length === 0 ? <p className="text-gray-500">No pending ad requests.</p> :
             ads.filter(ad => ad.status === 'Pending').map(ad => (
               <div key={ad.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border-l-4 border-yellow-500">
                 <div className="flex justify-between mb-4">
                   <div>
                     <h3 className="font-bold text-lg dark:text-white">{ad.plan}</h3>
                     <p className="text-sm text-gray-500">Client: {ad.clientName} ({ad.email})</p>
                     <p className="font-mono font-bold text-naija mt-1">₦{ad.amount.toLocaleString()}</p>
                   </div>
                   <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs h-fit">Review Needed</span>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4 mb-4">
                   <div>
                      <p className="text-xs font-bold mb-1">Proof of Payment</p>
                      <img src={ad.receiptImage} className="w-full h-32 object-cover rounded border cursor-pointer" onClick={() => setViewAdId(ad.id)} />
                   </div>
                   <div>
                      <p className="text-xs font-bold mb-1">Ad Creative</p>
                      <img src={ad.adImage || 'https://via.placeholder.com/150'} className="w-full h-32 object-cover rounded border" />
                   </div>
                 </div>
                 
                 {ad.adContent && (
                   <div className="mb-4 bg-gray-50 p-3 rounded text-sm">
                     <p className="font-bold">Content Preview:</p>
                     <p className="line-clamp-2">{ad.adContent}</p>
                   </div>
                 )}

                 <div className="flex gap-3">
                   <button onClick={() => onApproveAd(ad.id)} className="bg-green-600 text-white px-4 py-2 rounded text-sm flex-1">Verify & Approve</button>
                   <button onClick={() => onRejectAd(ad.id)} className="bg-red-500 text-white px-4 py-2 rounded text-sm flex-1">Reject</button>
                 </div>
               </div>
             ))}
          </div>
        )}

        {activeTab === 'compose' && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <form onSubmit={handlePublish} className="space-y-4">
              <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-bold mb-1 dark:text-white">Headline</label>
                    <input value={title} onChange={e => setTitle(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white" required />
                  </div>
                  <div className="w-1/3">
                    <label className="block text-sm font-bold mb-1 dark:text-white">Category</label>
                    <select value={category} onChange={e => setCategory(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white">
                      <option>Politics</option>
                      <option>Business</option>
                      <option>Technology</option>
                      <option>Sports</option>
                      <option>Entertainment</option>
                      <option>Editorials</option>
                    </select>
                  </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold mb-1 dark:text-white">Feature Image</label>
                <input type="file" onChange={handleImageChange} className="w-full text-sm dark:text-white" />
                {imagePreview && <img src={imagePreview} className="h-20 mt-2 rounded" />}
              </div>

              <div>
                <label className="block text-sm font-bold mb-1 dark:text-white">Article Content</label>
                <textarea value={content} onChange={e => setContent(e.target.value)} className="w-full p-2 border rounded h-64 dark:bg-gray-700 dark:text-white" required />
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" checked={isBreaking} onChange={e => setIsBreaking(e.target.checked)} id="breaking" />
                <label htmlFor="breaking" className="text-sm font-bold text-red-600">Mark as Breaking News</label>
              </div>

              <button type="submit" className="bg-naija text-white px-6 py-3 rounded font-bold w-full hover:bg-green-700">Publish Live</button>
            </form>
          </div>
        )}
      </div>

      {viewAdId && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-8" onClick={() => setViewAdId(null)}>
           <img src={ads.find(a => a.id === viewAdId)?.receiptImage} className="max-h-full max-w-full" />
        </div>
      )}
    </div>
  );
};

const Footer: React.FC<{ onNavigate: (view: string) => void }> = ({ onNavigate }) => (
  <footer className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white pt-16 pb-8 border-t border-gray-200 dark:border-gray-700 transition-colors duration-300">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12 border-b border-gray-200 dark:border-gray-700 pb-12">
        {/* Column 1: Brand */}
        <div className="col-span-1">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-naija rounded-full flex items-center justify-center text-white font-bold text-sm tracking-wider shadow-md">
              <Globe className="w-6 h-6" />
            </div>
            <div className="flex flex-col justify-center">
              <h2 className="font-sans text-lg font-bold text-gray-900 dark:text-white tracking-tight leading-none">
                The People’s Platform
              </h2>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
            Empowering Nigerian voices through unbiased reporting and community-driven journalism. We stand for truth, transparency, and the progress of our nation.
          </p>
        </div>
        
        {/* Column 2: News Sections */}
        <div>
          <h3 className="font-bold mb-6 text-lg text-gray-900 dark:text-white">News Sections</h3>
          <ul className="space-y-3 text-gray-600 dark:text-gray-400 text-sm">
            <li className="hover:text-naija cursor-pointer transition-colors flex items-center gap-2"><ChevronRight className="w-3 h-3" /> Politics</li>
            {/* ✅ METRO */}
            <li className="hover:text-naija cursor-pointer transition-colors flex items-center gap-2"><ChevronRight className="w-3 h-3" /> Metro</li>
            <li className="hover:text-naija cursor-pointer transition-colors flex items-center gap-2"><ChevronRight className="w-3 h-3" /> Business</li>
            <li className="hover:text-naija cursor-pointer transition-colors flex items-center gap-2"><ChevronRight className="w-3 h-3" /> Technology</li>
            <li className="hover:text-naija cursor-pointer transition-colors flex items-center gap-2"><ChevronRight className="w-3 h-3" /> Sports</li>
            {/* ✅ EDUCATION */}
            <li className="hover:text-naija cursor-pointer transition-colors flex items-center gap-2"><ChevronRight className="w-3 h-3" /> Education</li>
            <li className="hover:text-naija cursor-pointer transition-colors flex items-center gap-2"><ChevronRight className="w-3 h-3" /> Editorials</li>
          </ul>
        </div>

        {/* Column 3: Company */}
        <div>
          <h3 className="font-bold mb-6 text-lg text-gray-900 dark:text-white">Company</h3>
          <ul className="space-y-3 text-gray-600 dark:text-gray-400 text-sm">
            <li className="hover:text-naija cursor-pointer transition-colors">About Us</li>
            <li className="hover:text-naija cursor-pointer transition-colors" onClick={() => onNavigate('advertise')}>Advertise with Us</li>
            <li className="hover:text-naija cursor-pointer transition-colors">Careers</li>
            <li className="hover:text-naija cursor-pointer transition-colors">Privacy Policy</li>
            <li className="hover:text-naija cursor-pointer transition-colors text-naija font-semibold mt-4 pt-4 border-t border-gray-200 dark:border-gray-700" onClick={() => onNavigate('login')}>Staff Access</li>
          </ul>
        </div>

        {/* Column 4: Connect */}
        <div>
          <h3 className="font-bold mb-6 text-lg text-gray-900 dark:text-white">Connect With Us</h3>
          <div className="flex gap-3 mb-6">
            <button className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center hover:bg-[#1877F2] hover:text-white transition-all duration-300 group">
              <Facebook className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-white" />
            </button>
            <button className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center hover:bg-[#1DA1F2] hover:text-white transition-all duration-300 group">
              <Twitter className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-white" />
            </button>
            <button className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center hover:bg-[#E4405F] hover:text-white transition-all duration-300 group">
              <Instagram className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-white" />
            </button>
            <button className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center hover:bg-[#0A66C2] hover:text-white transition-all duration-300 group">
              <Linkedin className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-white" />
            </button>
            <button className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center hover:bg-[#FF0000] hover:text-white transition-all duration-300 group">
              <Youtube className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-white" />
            </button>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-xs mb-2">
            Subscribe to our newsletter for daily updates.
          </p>
          <div className="flex">
            <input type="email" placeholder="Email address" className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm px-4 py-2 rounded-l-lg outline-none w-full border border-gray-200 dark:border-gray-700 focus:border-naija" />
            <button className="bg-naija text-white px-4 py-2 rounded-r-lg hover:bg-green-600 transition-colors font-medium text-sm">
              Join
            </button>
          </div>
        </div>
      </div>

      {/* Copyright Row */}
      <div className="text-center pt-4">
         <p className="text-gray-500 dark:text-gray-400 text-xs">
           &copy; 2024 The People’s Platform. All rights reserved.
         </p>
      </div>
    </div>
  </footer>
);

const App: React.FC = () => {
  const [view, setView] = useState('home');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  
  // REAL DATA STATES
  const [articles, setArticles] = useState<Article[]>([]);
  const [pendingArticles, setPendingArticles] = useState<Article[]>([]);
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);

  // FETCH DATA ON LOAD
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [articlesRes, adsRes] = await Promise.all([
          fetch(`${API_URL}/articles`),
          fetch(`${API_URL}/ads/active`)
        ]);
        
        const articlesData = await articlesRes.json();
        const adsData = await adsRes.json();

        // Map database articles to frontend format
        setArticles(articlesData.map(mapArticleFromDB));
        setAds(adsData);
      } catch (err) {
        console.error("Failed to connect to backend:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  const handleArticleClick = (article: Article) => {
    setSelectedArticle(article);
    setView('article');
  };

  const handleSubmitNews = async (articleData: Article) => {
    try {
      const response = await fetch(`${API_URL}/articles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(articleData),
      });

      if (response.ok) {
        alert("Thank you! Your story has been submitted for review.");
        setView('home');
      }
    } catch (err) {
      console.error("Submission failed", err);
      alert("Failed to submit news.");
    }
  };

  const handleSubmitAd = async (adData: Advertisement) => {
    try {
        const response = await fetch(`${API_URL}/ads`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(adData),
        });
        if (response.ok) {
            alert("Proof of payment submitted! Our team will review and activate your ad shortly.");
            setView('home');
        }
    } catch (err) {
        console.error("Ad submission failed", err);
        alert("Failed to submit ad proof.");
    }
  };

  // Admin Actions
  const handleAdminLogin = async () => {
    setIsAdmin(true);
    // Fetch pending items only when admin logs in
    try {
        const res = await fetch(`${API_URL}/admin/pending-articles`);
        const data = await res.json();
        setPendingArticles(data.map(mapArticleFromDB));
        setView('admin');
    } catch (err) { console.error(err); }
  };

  const handlePublish = async (articleData: Article) => {
    // Admin direct publish
    await handleSubmitNews(articleData); // Reuse submit logic
    // Refresh list? In a real app we'd refetch.
  };

  const handleApproveSubmission = async (article: Article) => {
    try {
        const res = await fetch(`${API_URL}/admin/articles/${article.id}/approve`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isBreaking: false })
        });
        if (res.ok) {
            const approved = await res.json();
            setArticles([mapArticleFromDB(approved), ...articles]);
            setPendingArticles(pendingArticles.filter(a => a.id !== article.id));
        }
    } catch (err) { console.error(err); }
  };

  const handleRejectSubmission = (id: string) => {
    // In a real app we would send a DELETE request or UPDATE status to 'rejected'
    setPendingArticles(pendingArticles.filter(a => a.id !== id));
  };

  const handleApproveAd = async (id: string) => {
    try {
        const res = await fetch(`${API_URL}/admin/ads/${id}/approve`, { method: 'PATCH' });
        if (res.ok) {
            const updatedAd = await res.json();
            setAds([...ads, updatedAd]); // It will show up now
            // Remove from pending view logic (handled by filter in AdminDashboard)
            // Ideally we refetch ads here
        }
    } catch (err) { console.error(err); }
  };

  const handleRejectAd = (id: string) => {
     setAds(ads.filter(a => a.id !== id));
  };

  const handleDeleteArticle = (id: string) => {
    // Implement delete endpoint call here
    setArticles(articles.filter(a => a.id !== id));
  };

  // Filter logic
  const filteredArticles = selectedCategory === 'All' 
    ? articles 
    : articles.filter(a => a.category === selectedCategory);
  
  // Get active ads
  const activeAds = ads.filter(a => a.status === 'active' || a.status === 'Active');
  const headerAd = activeAds.find(a => a.plan === 'Header Leaderboard');
  const sidebarAd = activeAds.find(a => a.plan === 'Sidebar Banner');
  const sponsoredAds = activeAds.filter(a => a.plan === 'Sponsored Article');

  // Mix sponsored articles into feed
  const displayFeed = [...filteredArticles];
  sponsoredAds.forEach((ad, index) => {
    const insertIndex = (index + 1) * 3;
    if (insertIndex < displayFeed.length) {
       const adArticle: any = { isAd: true, data: ad, id: `ad-${ad.id}` };
       displayFeed.splice(insertIndex, 0, adArticle);
    }
  });

  if (loading) {
      return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div></div>;
  }

  if (view === 'admin' && isAdmin) {
    return (
      <AdminDashboard 
        articles={articles}
        pendingArticles={pendingArticles}
        ads={ads} // Pass all ads, dashboard filters for pending
        onPublish={handlePublish}
        onDelete={handleDeleteArticle}
        onApproveSubmission={handleApproveSubmission}
        onRejectSubmission={handleRejectSubmission}
        onApproveAd={handleApproveAd}
        onRejectAd={handleRejectAd}
        onLogout={() => { setIsAdmin(false); setView('home'); }}
      />
    );
  }

  if (view === 'login') {
    return <StaffLoginPage onLogin={handleAdminLogin} onBack={() => setView('home')} />;
  }

  return (
    <div className={`min-h-screen flex flex-col ${isDark ? 'dark' : ''}`}>
      <Header onNavigate={setView} toggleTheme={toggleTheme} isDark={isDark} activeAd={headerAd} onCategorySelect={setSelectedCategory} />
      
      <main className="flex-grow">
        {view === 'home' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Category Nav */}
            <div className="flex overflow-x-auto pb-4 mb-6 gap-2 scrollbar-hide">
               {['All', 'Politics', 'Metro', 'Business', 'Technology', 'Sports', 'Entertainment', 'Education', 'Editorials'].map(cat => (
                 <button 
                   key={cat}
                   onClick={() => setSelectedCategory(cat)}
                   className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === cat ? 'bg-naija text-white shadow-md' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                 >
                   {cat}
                 </button>
               ))}
            </div>

            {/* Hero Section (First Article) */}
            {filteredArticles.length > 0 && (
              <div className="mb-12 grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 cursor-pointer group" onClick={() => handleArticleClick(filteredArticles[0])}>
                  <div className="relative h-[400px] lg:h-[500px] rounded-2xl overflow-hidden shadow-lg">
                    <img 
                      src={filteredArticles[0].image || 'https://via.placeholder.com/800'} 
                      alt={filteredArticles[0].title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-8">
                      <div className="flex gap-2 mb-3">
                        <span className="bg-naija text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                          {filteredArticles[0].category}
                        </span>
                        {filteredArticles[0].isBreaking && (
                          <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">
                            Breaking News
                          </span>
                        )}
                      </div>
                      <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-white mb-4 leading-tight">
                        {filteredArticles[0].title}
                      </h2>
                      <p className="text-gray-200 line-clamp-2 text-lg max-w-2xl">
                        {filteredArticles[0].excerpt}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-naija" /> Trending Now
                    </h3>
                    <div className="space-y-4">
                      {articles.slice(1, 4).map((article, idx) => (
                        <div key={article.id} className="flex gap-3 cursor-pointer group" onClick={() => handleArticleClick(article)}>
                          <span className="text-2xl font-bold text-gray-200 dark:text-gray-700 group-hover:text-naija transition-colors">0{idx + 1}</span>
                          <div>
                            <h4 className="font-serif font-bold text-gray-900 dark:text-white leading-tight group-hover:text-naija transition-colors line-clamp-2">{article.title}</h4>
                            <span className="text-xs text-gray-500 mt-1 block">{article.views} views</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Sidebar Ad */}
                  {sidebarAd ? (
                      <div className="bg-gray-100 dark:bg-gray-800 h-64 rounded-xl flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700 overflow-hidden relative group">
                         <a href={sidebarAd.adUrl || '#'} target={sidebarAd.adUrl ? "_blank" : "_self"} className="w-full h-full">
                           <img src={sidebarAd.adImage} className="w-full h-full object-cover" />
                           <span className="absolute bottom-2 right-2 bg-white/80 text-black text-[10px] px-1 rounded">Ad</span>
                         </a>
                      </div>
                  ) : (
                    <div className="bg-gray-100 dark:bg-gray-800 h-64 rounded-xl flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700 p-6 text-center">
                      <span className="font-medium mb-2">Advertisement Space</span>
                      <button onClick={() => setView('advertise')} className="text-xs bg-white dark:bg-gray-700 px-3 py-1 rounded shadow-sm hover:text-naija">Place Ad Here</button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Main Grid */}
            <h3 className="text-2xl font-serif font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <LayoutGrid className="w-6 h-6 text-naija" /> Latest Stories
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {displayFeed.slice(1).map((item: any) => (
                item.isAd ? (
                  <SponsoredArticleCard key={item.id} ad={item.data} />
                ) : (
                  <ArticleCard 
                    key={item.id} 
                    article={item} 
                    onClick={() => handleArticleClick(item)} 
                  />
                )
              ))}
            </div>
          </div>
        )}

        {view === 'article' && selectedArticle && (
          <ArticleReader 
            article={selectedArticle} 
            onBack={() => setView('home')}
            isAdmin={isAdmin}
          />
        )}

        {view === 'submit' && (
          <SubmitNewsPage onBack={() => setView('home')} onSubmit={handleSubmitNews} />
        )}

        {view === 'advertise' && (
          <AdvertisePage onBack={() => setView('home')} onSubmitAd={handleSubmitAd} />
        )}
      </main>

      <Footer onNavigate={setView} />
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);