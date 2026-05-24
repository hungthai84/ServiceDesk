import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Car, Briefcase, Cpu, Gem, Heart, Grid, Sofa, Shirt, LayoutDashboard, Settings2,
  Search, Bell, Sparkles, MapPin, Plus, ArrowUpRight, LogOut, CheckCircle, ExternalLink, MessageSquare, Info, ChevronRight, HelpCircle, BookOpen, Share2, RefreshCw
} from "lucide-react";
import { CATEGORIES } from "./data";
import { BlogPost, Category } from "./types";
import { Listing3DImage } from "./components/Listing3DImage";
import { ListingDetailModal } from "./components/ListingDetailModal";
import { AdCreationModal } from "./components/AdCreationModal";
import { useFirebase } from "./components/FirebaseProvider";

export default function App() {
  const {
    user,
    loading: isDbLoading,
    listings,
    likedIds,
    loginWithGoogle,
    logoutUser,
    toggleLikePost,
    addNewBlogPost,
    incrementViews
  } = useFirebase();

  const [selectedListing, setSelectedListing] = useState<BlogPost | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Modals visibility state
  const [isAdModalOpen, setIsAdModalOpen] = useState(false);
  const [loginAlert, setLoginAlert] = useState<string | null>(null);

  // Search pills categorization
  const [activeSearchPill, setActiveSearchPill] = useState<string | null>(null);

  const handleToggleLike = async (id: string) => {
    try {
      if (!user) {
        setLoginAlert("Yêu cầu: Vui lòng đăng nhập Gmail để lưu bài viết.");
        setTimeout(() => setLoginAlert(null), 3500);
        return;
      }
      await toggleLikePost(id);
    } catch (err: any) {
      setLoginAlert("Gặp lỗi khi đồng bộ lượt thích.");
      setTimeout(() => setLoginAlert(null), 3000);
    }
  };

  const handleAddListing = async (newPost: BlogPost) => {
    try {
      if (!user) {
        setLoginAlert("Yêu cầu: Đăng nhập Gmail trước khi viết tập san.");
        setTimeout(() => setLoginAlert(null), 3500);
        return;
      }
      await addNewBlogPost(newPost);
      // Let the success notification come from AdCreationModal itself or handle here
    } catch (err: any) {
      setLoginAlert("Lỗi đăng bài viết. Đảm bảo đúng định dạng.");
      setTimeout(() => setLoginAlert(null), 3500);
    }
  };

  const handleLoginToggle = async () => {
    if (user) {
      try {
        await logoutUser();
        setLoginAlert("Đã đăng xuất tài khoản Gmail.");
      } catch (e) {
        setLoginAlert("Không kết nối được dịch vụ đăng xuất.");
      }
    } else {
      try {
        await loginWithGoogle();
        setLoginAlert("Đăng nhập bằng tài khoản Gmail thành công!");
      } catch (e) {
        setLoginAlert("Đăng nhập Gmail đã bị hủy bỏ.");
      }
    }
    setTimeout(() => setLoginAlert(null), 3000);
  };

  const handleSelectListing = (item: BlogPost) => {
    setSelectedListing(item);
    incrementViews(item.id);
  };

  // Filter blog posts based on category selection, search terms, and active pill filtering
  const filteredListings = useMemo(() => {
    return listings.filter(item => {
      // 1. Category check
      if (selectedCategory && selectedCategory !== "browse") {
        if (item.category.toLowerCase() !== selectedCategory.toLowerCase()) {
          return false;
        }
      }

      // 2. Active pill helper filters
      if (activeSearchPill) {
        if (activeSearchPill === "sponsored" && !item.sponsored) return false;
        if (activeSearchPill === "liked" && !likedIds.includes(item.id)) return false;
      }

      // 3. Text query match
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const titleMatch = item.title.toLowerCase().includes(query);
        const descMatch = item.description.toLowerCase().includes(query);
        const locMatch = item.location.toLowerCase().includes(query);
        const catMatch = item.category.toLowerCase().includes(query);
        return titleMatch || descMatch || locMatch || catMatch;
      }

      return true;
    });
  }, [listings, searchQuery, selectedCategory, activeSearchPill, likedIds]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCategory(null);
    setActiveSearchPill(null);
  };

  // Helper mapping icon names to Lucide elements
  const renderCategoryIcon = (iconName: string, color: string) => {
    const iconProps = { className: `w-5 h-5 ${color}` };
    switch (iconName) {
      case "Car": return <Car {...iconProps} />;
      case "Briefcase": return <Briefcase {...iconProps} />;
      case "Cpu": return <Cpu {...iconProps} />;
      case "Gem": return <Gem {...iconProps} />;
      case "Heart": return <Heart {...iconProps} fill="none" />;
      case "Grid": return <Grid {...iconProps} />;
      case "Sofa": return <Sofa {...iconProps} />;
      case "Shirt": return <Shirt {...iconProps} />;
      case "LayoutDashboard": return <LayoutDashboard {...iconProps} />;
      case "Settings2": return <Settings2 {...iconProps} />;
      default: return <Grid {...iconProps} />;
    }
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden font-sans pb-16 pt-6 px-4 md:px-8 selection:bg-indigo-200">
      
      {/* 3D Cosmic Background Blurs - Replicating original picture gradient spots exactly */}
      <div className="absolute top-[5%] -left-[10%] w-[35rem] h-[35rem] rounded-full bg-gradient-to-tr from-[#90caf9]/25 to-[#64b5f6]/40 blur-[130px] -z-10 animate-pulse-slow pointer-events-none" />
      <div className="absolute top-[25%] -right-[15%] w-[40rem] h-[40rem] rounded-full bg-gradient-to-br from-[#f3e5f5]/30 to-[#ce93d8]/30 blur-[140px] -z-10 pointer-events-none" />
      <div className="absolute bottom-[10%] left-[20%] w-[45rem] h-[45rem] rounded-full bg-gradient-to-tr from-[#e1bee7]/25 to-[#bbdefb]/20 blur-[150px] -z-10 pointer-events-none" />

      {/* 3D Floating Glass Spheres and Rings Decor - Emphasizing original visual style */}
      <div className="absolute top-[8%] left-[2%] w-16 h-16 rounded-full bg-indigo-200/40 backdrop-blur-md shadow-inner border border-white/40 -z-10 animate-float pointer-events-none" >
        <div className="absolute inset-2 rounded-full bg-white/20 blur-xs" />
      </div>

      <div className="absolute top-[18%] right-[8%] w-10 h-10 rounded-full bg-[#ffab91]/40 backdrop-blur-xs border border-white/40 -z-10 animate-float-slow pointer-events-none" />
      
      <div className="absolute bottom-[30%] right-[3%] w-24 h-24 rounded-full bg-violet-200/30 backdrop-blur-xl shadow-inner border border-white/30 -z-10 animate-float pointer-events-none">
        <div className="absolute top-2 left-4 w-6 h-6 rounded-full bg-white/40 blur-xs" />
      </div>

      <div className="absolute bottom-[15%] left-[5%] w-14 h-14 rounded-full bg-cyan-100/30 backdrop-blur-md border border-white/40 -z-10 animate-float-slow pointer-events-none" />

      {/* Main Glassmorphic Central Website Wrapper */}
      <div className="max-w-6xl w-full mx-auto bg-white/70 backdrop-blur-xl rounded-[40px] shadow-2xl border border-white/45 overflow-hidden transition-all duration-300 relative">
        
        {/* Floating alerts overlay */}
        {loginAlert && (
          <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 backdrop-blur-md text-white px-5 py-3 rounded-2xl shadow-xl border border-white/10 flex items-center gap-2.5 text-xs animate-bounce font-medium">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{loginAlert}</span>
          </div>
        )}

        {/* 1. BRAND HEADER SECTION */}
        <header className="px-6 md:px-10 py-5 flex items-center justify-between border-b border-white/20 bg-white/20">
          {/* Logo representation - ClassiAds Editorial and Design Blog style */}
          <div className="flex items-center gap-1.5 cursor-pointer" onClick={handleResetFilters}>
            <span className="text-xl font-black font-display text-slate-900 tracking-tight flex items-center">
              Classi<span className="text-indigo-600 font-semibold h-full md:relative bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">Editorial</span>
            </span>
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse mt-1.5" />
          </div>

          {/* Nav Links from the mockup adapted to Design magazine headings */}
          <nav className="hidden md:flex items-center gap-7">
            {[
              { id: "home", label: "Home", sub: "Trang chủ" },
              { id: "articles", label: "Tập san", sub: "Essays" },
              { id: "copilot", label: "AI Biên Tập", sub: "AI Copilot" },
              { id: "totured", label: "Tuyển chọn", sub: "Editor's Pick" },
              { id: "about", label: "Về biên khảo", sub: "Manifesto" }
            ].map((link) => (
              <button 
                key={link.id}
                type="button" 
                onClick={() => {
                  if (link.id === "totured") {
                    setActiveSearchPill("sponsored");
                  } else {
                    setSelectedCategory(null);
                  }
                }}
                className="group relative py-1 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
              >
                <span>{link.label}</span>
                {/* Visual sub translation overlay */}
                <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap invisible group-hover:visible font-medium">
                  {link.sub}
                </span>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-600 transition-all group-hover:w-full" />
              </button>
            ))}
          </nav>

          {/* Action Tools on the right */}
          <div className="flex items-center gap-3">
            {/* Bell/Notifications mockup */}
            <div className="relative p-2.5 hover:bg-white/40 rounded-full transition-colors cursor-pointer text-slate-600">
              <Bell className="w-4.5 h-4.5" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-indigo-600 rounded-full border-2 border-white" />
            </div>

            {/* Authentication status indicator */}
            {user ? (
              <div className="hidden lg:flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100 shadow-xs">
                {user.photoURL ? (
                  <img src={user.photoURL} className="w-5 h-5 rounded-full object-cover shrink-0 border border-indigo-100" alt="" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                )}
                <span className="text-[10px] font-bold text-slate-700 truncate max-w-[125px]" title={user.email || ""}>
                  {user.displayName || user.email}
                </span>
                <button 
                  onClick={handleLoginToggle}
                  className="text-slate-400 hover:text-rose-600 p-0.5 rounded-full hover:bg-slate-100/80 transition-colors cursor-pointer" 
                  title="Đăng xuất"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleLoginToggle}
                className="hidden lg:flex items-center gap-1 text-[11px] font-bold text-slate-700 hover:text-indigo-600 bg-white/50 hover:bg-indigo-50 border border-slate-200/80 px-4 py-2 rounded-full transition-colors cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-indigo-500" />
                <span>Đăng nhập Gmail</span>
              </button>
            )}

            {/* "Fiut plic" original Post ad pill button modified to write elegant blog drafts */}
            <button
              onClick={() => setIsAdModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2.5 rounded-full transition-all duration-300 shadow-md shadow-indigo-200 flex items-center gap-1.5 cursor-pointer hover:scale-102"
              title="Biên soạn bài viết mới"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Viết bài mới</span> 
            </button>
          </div>
        </header>

        {/* 2. MAIN HERO BANNER & CORE CAPABILITIES */}
        <section className="px-6 md:px-12 pt-16 pb-12 relative text-center">
          
          {/* Main Giant decorative floating "S" glass card back element */}
          <div className="absolute top-8 left-[12%] opacity-15 text-slate-300 pointer-events-none select-none">
            <span className="text-[14rem] font-bold font-display leading-none">B</span>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative z-10"
          >
            {/* Elegant Classiads editorial blog display text */}
            <h1 className="text-5.55 hover:scale-101 text-5xl md:text-6xl font-extrabold font-display text-slate-900 tracking-tight leading-none mb-4 uppercase">
              Classiads Editorial
            </h1>
            
            {/* Soft translation subtitle */}
            <p className="text-slate-400 text-xs max-w-lg mx-auto leading-relaxed mb-8">
              Tuần tuần san thời thượng khám phá các kết nối kiến trúc đương đại, thiết bị retro, thời trang streetwear và nghệ thuật tối giản bậc nhất.
            </p>
          </motion.div>

          {/* MAIN FLOATING CAPSULE SEARCH BAR - Beautiful glass design */}
          <div className="max-w-xl mx-auto relative z-10 mb-8 px-2 md:px-0">
            <div className="bg-white/80 border border-indigo-100/30 shadow-xl rounded-full py-2.5 p-2 pl-5 flex items-center justify-between focus-within:ring-2 focus-within:ring-indigo-600/20 focus-within:bg-white transition-all">
              <div className="flex items-center gap-3 w-full">
                <Search className="w-4.5 h-4.5 text-slate-400 shrink-0" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm chủ thảo thiết kế..." 
                  className="w-full text-xs font-semibold text-slate-700 placeholder-slate-400 bg-transparent outline-none border-none py-1.5"
                />
              </div>

              {/* Dynamic Orange layout search button representing mockup */}
              <button 
                type="button"
                className="bg-[#ff7043] hover:bg-[#ff5722] text-white p-3 rounded-full shadow-md shadow-orange-100 hover:scale-105 transition-all outline-none border-none cursor-pointer flex items-center justify-center shrink-0"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* SUB CONTROL PILLS UNDER SEARCH BAR */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-4 relative z-10 text-[10px] font-semibold text-slate-500">
            <button
              onClick={() => {
                setActiveSearchPill(prev => prev === "sponsored" ? null : "sponsored");
                setSelectedCategory(null);
              }}
              className={`px-4 py-2 border rounded-full transition-all duration-300 cursor-pointer flex items-center gap-1.5 shadow-xs ${
                activeSearchPill === "sponsored" 
                  ? "bg-orange-500 border-orange-500 text-white" 
                  : "bg-white/90 border-[#ff7043]/30 text-[#ff7043]"
              }`}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              <span>Bài biên tập Premium (Editor's Choice)</span>
            </button>

            <button
              onClick={() => {
                setActiveSearchPill(prev => prev === "liked" ? null : "liked");
                setSelectedCategory(null);
              }}
              className={`px-4 py-2 border rounded-full transition-all duration-300 cursor-pointer flex items-center gap-1.5 shadow-xs ${
                activeSearchPill === "liked" 
                  ? "bg-[#6c5dd3] border-[#6c5dd3] text-white" 
                  : "bg-white/90 border-indigo-200/50 text-[#6c5dd3] hover:bg-slate-50"
              }`}
            >
              <span>Tập san yêu thích của bạn</span>
            </button>
            
            {(searchQuery || selectedCategory || activeSearchPill) && (
              <button
                onClick={handleResetFilters}
                className="px-3.5 py-1.5 rounded-full text-[10px] font-bold text-slate-400 bg-slate-100 hover:bg-slate-200 hover:text-slate-700 flex items-center gap-1 cursor-pointer animate-fade-in"
              >
                <RefreshCw className="w-3 h-3" /> Đặt lại bộ lọc
              </button>
            )}
          </div>
        </section>

        {/* 3. CATEGORIES GLASS GRID COMPONENT - Dual Rows containing interactive elements */}
        <section className="px-6 md:px-12 py-10 border-t border-b border-slate-100 bg-slate-50/20">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-4">
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory?.toLowerCase() === cat.label.toLowerCase();
              let bgActiveStyle = "bg-white/80 border-slate-100 hover:scale-103 shadow-xs";
              
              if (isActive) {
                bgActiveStyle = "bg-indigo-600 border-indigo-600 text-white shadow-lg scale-103";
              }

              // Custom icon lighting circle indicators representing mockup
              const dotColors: any = {
                sky: "bg-sky-50 text-sky-600",
                orange: "bg-orange-50 text-orange-600",
                blue: "bg-blue-50 text-blue-600",
                yellow: "bg-yellow-50 text-yellow-600",
                rose: "bg-rose-50 text-rose-600",
                indigo: "bg-indigo-50 text-indigo-600",
                teal: "bg-teal-50 text-teal-600",
                violet: "bg-violet-50 text-violet-600",
                emerald: "bg-emerald-50 text-emerald-600"
              };

              return (
                <div
                  key={cat.id}
                  onClick={() => {
                    if (cat.id === "browse") {
                      setSelectedCategory(null);
                    } else if (cat.id === "admin") {
                      setIsAdModalOpen(true);
                    } else {
                      setSelectedCategory(prev => prev === cat.label ? null : cat.label);
                      setActiveSearchPill(null);
                    }
                  }}
                  className={`p-4 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col items-center justify-center text-center select-none ${bgActiveStyle}`}
                >
                  {/* Styled Icon wrapper carrying beautiful colored lighting dots behind */}
                  <div className={`p-3 rounded-xl mb-2 flex items-center justify-center relative ${isActive ? "bg-white/25" : dotColors[cat.colorScheme] || "bg-slate-100"}`}>
                    {renderCategoryIcon(cat.iconName, isActive ? "text-white" : "")}
                  </div>

                  <span className={`text-[10px] sm:text-[11px] font-bold tracking-tight font-display ${isActive ? "text-white" : "text-slate-800"}`}>
                    {cat.label}
                  </span>
                  
                  {cat.count > 0 && (
                    <span className={`text-[9px] font-semibold mt-0.5 font-mono ${isActive ? "text-indigo-200" : "text-slate-400"}`}>
                      {cat.count} bài đọc
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* 4. FEATURED BLOGS COLLECTION (Transformed Featured Listing completely!) */}
        <section className="px-6 md:px-12 py-12 bg-white/10" id="featured-listings">
          
          {/* Section banner header */}
          <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
            <div className="text-left">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100/50">Tuần san Thẩm mỹ & Sáng tạo</span>
              <h2 className="text-xl md:text-2xl font-black font-display text-slate-800 tracking-tight flex items-center gap-2 mt-2">
                Featured Blogs & Stories
                <span className="w-1.5 h-1.5 rounded-full bg-[#ff7043]" />
              </h2>
              <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Khám phá các câu chuyện thiết kế sâu sắc, kết nối không gian và lý luận cùng AI</p>
            </div>

            {/* Header controls matching mockup layout exactly */}
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsAdModalOpen(true)}
                className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/60 text-[10px] font-bold text-indigo-700 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>Viết bài mới</span>
                <Plus className="w-3.5 h-3.5 text-indigo-600" />
              </button>

              <div className="h-6 w-px bg-slate-200" />

              <span className="text-[10px] font-extrabold text-slate-600 flex items-center gap-1 uppercase tracking-wider bg-orange-50 px-2.5 py-1 rounded-sm select-none border border-orange-100/30 text-[#ff7043]">
                EDITORIAL
              </span>

              {user ? (
                <span className="text-[10px] font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-sm select-none">
                  ONLINE
                </span>
              ) : (
                <button 
                  onClick={handleLoginToggle}
                  className="text-[10px] font-extrabold text-[#ff7043] uppercase hover:underline hover:scale-102 transition-transform cursor-pointer"
                >
                  Đăng nhập
                </button>
              )}
            </div>
          </div>

          {/* Core dynamic blog post cards list */}
          {filteredListings.length === 0 ? (
            <div className="p-16 border border-dashed border-slate-200 rounded-[32px] text-center max-w-lg mx-auto bg-white/50">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mx-auto mb-3">
                <Search className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-slate-700">Chưa có bài viết hay chuyên khảo phù hợp</h4>
              <p className="text-[10px] text-slate-400 mt-1">Vui lòng điều chỉnh lại bộ lọc danh mục hoặc từ khóa để tìm kiếm các bài luận khác.</p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-4 inline-flex items-center gap-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] rounded-lg cursor-pointer"
              >
                Xét lại toàn bộ
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <AnimatePresence mode="popLayoutContainer">
                {filteredListings.map((item) => {
                  const isLiked = likedIds.includes(item.id);

                  return (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3 }}
                      key={item.id}
                      className="group bg-white/70 backdrop-blur-md rounded-[28px] p-4 border border-white/50 hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between cursor-pointer"
                      onClick={() => handleSelectListing(item)}
                    >
                      {/* Top labels */}
                      <div className="flex items-center justify-between mb-3">
                        {item.sponsored ? (
                          <span className="px-2 py-0.5 rounded-full text-[8px] font-bold tracking-widest uppercase text-indigo-700 bg-indigo-50 border border-indigo-100">
                            Editor's Choice
                          </span>
                        ) : (
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-1.5 py-0.5 rounded-sm select-none">
                            Classi Editorial
                          </span>
                        )}

                        <button 
                          onClick={(e) => {
                            e.stopPropagation(); // Avoid triggering details modal opening
                            handleToggleLike(item.id);
                          }}
                          className={`p-2 rounded-full transition-all duration-300 ${
                            isLiked 
                              ? "bg-rose-50 text-rose-500 scale-105 shadow-xs" 
                              : "text-slate-400 hover:bg-slate-50 hover:text-rose-400"
                          }`}
                        >
                          <Heart className="w-4 h-4" fill={isLiked ? "currentColor" : "none"} />
                        </button>
                      </div>

                      {/* Gorgeous stylized 3D placeholder matching gradient profile */}
                      <div className={`aspect-square rounded-[20px] bg-gradient-to-br ${item.glassClass} p-3 flex items-center justify-center relative overflow-hidden shadow-xs border border-white/40 mb-4`}>
                        <Listing3DImage type={item.imageType} className="w-36 h-36" hover={true} />
                      </div>

                      {/* Lower card metadata */}
                      <div className="text-left mt-1 px-1">
                        <span className="text-[9px] font-bold text-indigo-600 block mb-1 uppercase tracking-wider font-display shrink-0">
                          {item.category}
                        </span>
                        
                        <h3 className="text-xs font-black text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-relaxed mb-2 font-display" title={item.title}>
                          {item.title}
                        </h3>

                        {/* Author info snippet */}
                        <div className="flex items-center gap-1.5 text-slate-400 text-[10px] mb-3.5 font-medium border-b border-slate-50 pb-2.5">
                          <img src={item.author.avatar} className="w-4.5 h-4.5 rounded-full object-cover shrink-0 border border-white" alt="" referrerPolicy="no-referrer" />
                          <span className="truncate text-slate-505 font-mono">{item.author.name} • <span className="text-[9.5px] font-sans text-slate-400">{item.author.role}</span></span>
                        </div>

                        {/* Reading Time Row (instead of pricing!) */}
                        <div className="flex justify-between items-center pt-1.5">
                          <span className="text-[9px] font-extrabold text-indigo-600 font-mono bg-indigo-50/70 border border-indigo-100/50 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <BookOpen className="w-3 h-3 text-indigo-500" /> {item.readTime}
                          </span>
                          <span className="text-[9px] font-extrabold text-slate-400 group-hover:text-indigo-600 transition-all flex items-center gap-0.5">
                            Đọc bài viết <ArrowUpRight className="w-3 h-3 text-current group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </section>

        {/* 5. BRAND FOOTER GRID */}
        <footer className="px-6 md:px-12 py-12 bg-slate-900 text-slate-300 border-t border-slate-800 rounded-b-[40px] text-xs">
          <div className="grid grid-cols-2 md:grid-cols-12 gap-8 md:gap-4 pb-8 border-b border-slate-800 text-xs">
            
            {/* Column A: Active Brand column */}
            <div className="col-span-2 md:col-span-4 text-left space-y-4">
              <span className="text-lg font-black font-display text-white tracking-tight flex items-center">
                Classi<span className="text-indigo-400 font-normal">Editorial</span>
              </span>
              <p className="text-[10px] text-slate-400 leading-relaxed max-w-xs">
                Tuần san trực quan phân tích chuyên khảo phong cách sống dã ngoại, kiến tạng và công nghệ kết nối triết lý tối giản cùng sự trợ lý đắc lực từ Gemini AI.
              </p>
              
              <div className="bg-slate-800/50 p-3 rounded-2xl border border-slate-800 inline-block">
                <span className="text-[10px] font-bold text-slate-400 block uppercase mb-1">Weekly Magazine Insights</span>
                <div className="space-y-1 font-mono text-[10px] text-slate-350">
                  <div className="flex gap-2"><span>● Độc giả tích cực:</span> <span className="text-indigo-400">12K+ tuần</span></div>
                  <div className="flex gap-2"><span>● Bản dịch AI:</span> <span className="text-indigo-400">4 ngôn ngữ</span></div>
                  <div className="flex gap-2"><span>● Chuyên đề thiết thực:</span> <span className="text-indigo-400">99.9% uy tín</span></div>
                </div>
              </div>
            </div>

            {/* Column B: Links category 1 */}
            <div className="col-span-1 md:col-span-2 text-left space-y-3">
              <h4 className="font-extrabold text-white text-[10px] uppercase tracking-wider font-display">Tập san nghệ thuật</h4>
              <ul className="space-y-2 text-[10px] text-slate-400">
                <li><a href="#featured-listings" className="hover:text-indigo-400 transition-colors">Không gian sống xanh</a></li>
                <li><a href="#featured-listings" className="hover:text-indigo-400 transition-colors">Thiết bị hoài cổ</a></li>
                <li><a href="#featured-listings" className="hover:text-indigo-400 transition-colors">Triết lý thiết kế</a></li>
                <li><a href="#featured-listings" className="hover:text-indigo-400 transition-colors font-medium text-indigo-400">Lưu lượng xuất bản</a></li>
              </ul>
            </div>

            {/* Column C: Links category 2 */}
            <div className="col-span-1 md:col-span-2 text-left space-y-3">
              <h4 className="font-extrabold text-white text-[10px] uppercase tracking-wider font-display">Dịch vụ tòa soạn</h4>
              <ul className="space-y-2 text-[10px] text-slate-400">
                <li><a href="#featured-listings" className="hover:text-indigo-400 transition-colors">Biên dịch viên AI</a></li>
                <li><a href="#featured-listings" className="hover:text-indigo-400 transition-colors">Chuyển đổi giọng văn</a></li>
                <li><a href="#featured-listings" className="hover:text-indigo-400 transition-colors">Tạo tin tiếp thị</a></li>
                <li><a href="#featured-listings" className="hover:text-indigo-400 transition-colors">Mở rộng cấu trúc bài viết</a></li>
              </ul>
            </div>

            {/* Column D: Links category 3 */}
            <div className="col-span-1 md:col-span-2 text-left space-y-3">
              <h4 className="font-extrabold text-white text-[10px] uppercase tracking-wider font-display">Bộ sưu tập</h4>
              <ul className="space-y-2 text-[10px] text-slate-400">
                <li><a href="#featured-listings" className="hover:text-indigo-400 transition-colors">Sofa - Ghế bành</a></li>
                <li><a href="#featured-listings" className="hover:text-indigo-400 transition-colors">Kính sắc quang học</a></li>
                <li><a href="#featured-listings" className="hover:text-indigo-400 transition-colors">Giày bốt thời trang</a></li>
                <li><a href="#featured-listings" className="hover:text-indigo-400 transition-colors">Đền kính nhà vòm</a></li>
              </ul>
            </div>

            {/* Column E: Status Indicators */}
            <div className="col-span-1 md:col-span-2 text-left space-y-3">
              <h4 className="font-extrabold text-white text-[10px] uppercase tracking-wider font-display">Đăng nhập tài khoản</h4>
              <ul className="space-y-2 text-[10px] text-slate-400">
                <li>
                  <button onClick={handleLoginToggle} className="hover:text-white transition-colors text-left font-semibold">
                    {user ? `Thoát: ${user.displayName || "Gmail"}` : "Đăng nhập Gmail"}
                  </button>
                </li>
                <li><button onClick={() => setIsAdModalOpen(true)} className="hover:text-white transition-colors text-left font-semibold">Biên kịch tập san</button></li>
                <li><span className="text-[8px] tracking-wide text-indigo-400 font-mono select-none block uppercase mt-2">v1.0.0-firestore</span></li>
              </ul>
            </div>

          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-4">
            <p>© 2026 ClassiAds Editorial. Toàn quyền bảo lưu ý tưởng và thiết kế giao diện.</p>
            <div className="flex items-center gap-4">
              <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-slate-300 flex items-center gap-1 transition-colors">
                Github <ExternalLink className="w-3 h-3" />
              </a>
              <span className="text-slate-700">|</span>
              <span className="font-mono text-[10px] text-slate-600">Built with Gemini 3.5-Flash & React 19</span>
            </div>
          </div>
        </footer>

      </div>

      {/* 6. LISTINGS MODAL VIEWER */}
      {selectedListing && (
        <ListingDetailModal 
          listing={selectedListing}
          onClose={() => setSelectedListing(null)}
          onToggleLike={handleToggleLike}
          isLiked={likedIds.includes(selectedListing.id)}
        />
      )}

      {/* 7. AD CREATING PORT MODAL */}
      {isAdModalOpen && (
        <AdCreationModal 
          categories={CATEGORIES}
          onClose={() => setIsAdModalOpen(false)}
          onAddListing={handleAddListing}
        />
      )}

    </div>
  );
}
