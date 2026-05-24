import React, { useState } from "react";
import { X, Sparkles, MessageSquare, Heart, Eye, MapPin, Tag, Shield, BookOpen, Share2, Check, Copy, RefreshCw, Languages, Volume2, HelpCircle, Maximize2, Minimize2 } from "lucide-react";
import { BlogPost, AIBlogResult } from "../types";
import { Listing3DImage } from "./Listing3DImage";

interface ListingDetailModalProps {
  listing: BlogPost;
  onClose: () => void;
  onToggleLike: (id: string) => void;
  isLiked: boolean;
}

export const ListingDetailModal: React.FC<ListingDetailModalProps> = ({
  listing,
  onClose,
  onToggleLike,
  isLiked
}) => {
  // State for AI blog actions
  const [selectedAction, setSelectedAction] = useState<"translate" | "tone" | "social" | "expand">("translate");
  const [targetParam, setTargetParam] = useState<string>("English");
  
  const [aiResult, setAiResult] = useState<AIBlogResult | null>(null);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Interactive UI action feedback states
  const [copiedOutput, setCopiedOutput] = useState(false);
  const [copiedSocial, setCopiedSocial] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  // Focus Mode specialized state variables
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);
  const [focusTheme, setFocusTheme] = useState<"sepia" | "dark" | "white">("sepia");
  const [focusFontSize, setFocusFontSize] = useState<"sm" | "base" | "lg" | "xl">("lg");
  const [focusSerif, setFocusSerif] = useState<boolean>(true);
  const [showAICopilotInFocus, setShowAICopilotInFocus] = useState<boolean>(false);

  // Triggering Gemini AI Blog Assistant
  const handleBlogAssist = async () => {
    setAiLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/gemini/blog-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: listing.title,
          category: listing.category,
          content: listing.content || listing.description,
          action: selectedAction,
          targetParam: targetParam
        })
      });

      if (!res.ok) throw new Error("Yêu cầu hỗ trợ biên tập thất bại");
      const data = await res.json();
      setAiResult(data);
    } catch (err: any) {
      setErrorMessage("Không thể kết nối máy chủ AI lúc này. Hãy kiểm tra khóa bảo mật trong Settings.");
      // Fallback fallback simulated UI when offline or no API KEY
      setAiResult({
        title: listing.title,
        processedContent: `[Bản preview mô phỏng - Hãy cài ĐẶT KEY GEMINI trong Settings]
Hành động: ${selectedAction.toUpperCase()} (${targetParam})

Đây là phiên bản mô phỏng xử lý bài viết "${listing.title}". Sàn điện tử sẽ dịch thuật và đổi giọng tài tình, giúp bài viết chất lượng cao này chạm mốc phân phối truyền thông cao nhất.`,
        socialSnippet: `Bài viết mới nhất trên tuần san ClassiAds: Đọc bài phân tích tuyệt vời về "${listing.title}" ngay hôm nay! #ClassiAds #DesignLife #${listing.category.replace(/\s+/g, '')}`,
        keyTakeaways: ["Thẩm mỹ hiện đại vượt thời gian", "Vật liệu tinh chọn cao cấp", "Tối ưu hóa xúc cảm đời thường"]
      });
    } finally {
      setAiLoading(false);
    }
  };

  const handleShareClick = () => {
    setShareSuccess(true);
    navigator.clipboard.writeText(`${window.location.origin}/blog/${listing.id}`);
    setTimeout(() => setShareSuccess(false), 2000);
  };

  const copyToClipboard = (text: string, isSocial: boolean = false) => {
    navigator.clipboard.writeText(text);
    if (isSocial) {
      setCopiedSocial(true);
      setTimeout(() => setCopiedSocial(false), 2000);
    } else {
      setCopiedOutput(true);
      setTimeout(() => setCopiedOutput(false), 2000);
    }
  };

  // Dynamic styling mapping based on focus states
  const themeClasses = {
    sepia: "bg-[#fbf7f0] text-[#3c2a15] border-yellow-900/10",
    white: "bg-white text-slate-800 border-slate-100",
    dark: "bg-[#0c0e12] text-slate-200 border-slate-800"
  };

  const fontClasses = {
    sm: "text-[14px] leading-relaxed",
    base: "text-[16px] leading-relaxed",
    lg: "text-[18px] leading-relaxed",
    xl: "text-[21px] leading-relaxed"
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-500 overflow-y-auto ${
      isFocusMode 
        ? "p-0 md:p-6 bg-slate-950/90 backdrop-blur-2xl" 
        : "p-4 bg-slate-900/60 backdrop-blur-md"
    }`}>
      <div 
        className={`relative w-full transition-all duration-500 ease-out border overflow-hidden ${
          isFocusMode 
            ? `max-w-4xl h-full md:h-[94vh] shadow-2xl shadow-black/80 rounded-none md:rounded-[10px] ${themeClasses[focusTheme]}` 
            : "max-w-5xl my-8 bg-white/95 backdrop-blur-2xl rounded-[10px] shadow-2xl border border-white/50"
        }`} 
        id="listing-detail"
      >
        
        {/* Absolute Top corner window controls */}
        <div className="absolute top-5 right-5 z-10 flex items-center gap-2">
          {/* Focus Mode toggle button */}
          <button
            onClick={() => setIsFocusMode(!isFocusMode)}
            className={`p-3 rounded-full backdrop-blur-md transition-all duration-300 cursor-pointer ${
              isFocusMode
                ? focusTheme === "dark"
                  ? "bg-slate-900/80 hover:bg-slate-800 text-indigo-400 border border-slate-705/50"
                  : "bg-yellow-105/40 hover:bg-yellow-100/85 text-indigo-700 border border-yellow-900/20"
                : "bg-white/80 hover:bg-white text-slate-500 hover:text-indigo-600 shadow-xs"
            }`}
            title={isFocusMode ? "Thoát chế độ đọc tập trung" : "Chế độ đọc tập trung"}
          >
            {isFocusMode ? <Minimize2 className="w-5 h-5 shadow-xs" /> : <Maximize2 className="w-5 h-5 shadow-xs" />}
          </button>

          <button 
            onClick={() => onToggleLike(listing.id)}
            className={`p-3 rounded-full backdrop-blur-md transition-all duration-300 cursor-pointer ${
              isLiked 
                ? "bg-rose-50 text-rose-500 shadow-md scale-105" 
                : isFocusMode
                  ? focusTheme === "dark"
                    ? "bg-slate-900/80 hover:bg-slate-800 text-slate-500 hover:text-rose-500 border border-slate-705/50"
                    : "bg-yellow-105/40 hover:bg-yellow-100/85 text-slate-500 hover:text-rose-500 border border-yellow-900/20"
                  : "bg-white/80 hover:bg-white text-slate-500 hover:text-rose-500 shadow-xs"
            }`}
            title="Lưu vào danh sách yêu thích"
          >
            <Heart className="w-5 h-5" fill={isLiked ? "currentColor" : "none"} />
          </button>
          
          <button 
            onClick={onClose}
            className={`p-3 rounded-full backdrop-blur-md transition-all duration-300 shadow-xs cursor-pointer ${
              isFocusMode
                ? focusTheme === "dark"
                  ? "bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-705/50"
                  : "bg-yellow-105/40 hover:bg-yellow-100/85 text-slate-650 hover:text-slate-900 border border-yellow-900/20"
                : "bg-white/80 hover:bg-white text-slate-600 hover:text-slate-900"
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Focus Mode customization bar */}
        {isFocusMode && (
          <div className={`flex flex-wrap items-center justify-between gap-4 px-6 md:px-16 py-3.5 border-b border-dashed select-none sticky top-0 z-20 backdrop-blur-xl ${
            focusTheme === "dark" 
              ? "bg-[#040507]/20 border-slate-800 text-slate-300" 
              : focusTheme === "sepia"
                ? "bg-[#faf5ea]/80 border-yellow-900/10 text-yellow-950"
                : "bg-white/90 border-slate-100 text-slate-600"
          }`}>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-505 shrink-0" />
              <span className="text-[10px] font-extrabold uppercase tracking-widest font-mono">
                Độc Bản Tập Trung
              </span>
            </div>
            
            {/* Reading control widgets */}
            <div className="flex items-center gap-3">
              {/* Serif toggler */}
              <button
                onClick={() => setFocusSerif(!focusSerif)}
                className={`px-3 py-1 text-[10px] font-bold rounded-full border transition-all cursor-pointer ${
                  focusSerif 
                    ? focusTheme === "dark"
                      ? "bg-slate-800 border-slate-700 text-indigo-300"
                      : "bg-yellow-200/50 border-yellow-900/20 text-yellow-950"
                    : "bg-transparent border-slate-200 text-slate-400 hover:text-inherit"
                }`}
                title="Thay đổi dáng chữ Serif / Sans-serif"
              >
                {focusSerif ? "chữ có chân (serif)" : "chữ không chân (sans)"}
              </button>

              {/* Font Sizing buttons */}
              <div className={`flex items-center gap-1 border rounded-full overflow-hidden bg-white/5 ${
                focusTheme === "dark" ? "border-slate-800" : "border-yellow-900/15"
              }`}>
                <button
                  onClick={() => {
                    if (focusFontSize === "xl") setFocusFontSize("lg");
                    else if (focusFontSize === "lg") setFocusFontSize("base");
                    else if (focusFontSize === "base") setFocusFontSize("sm");
                  }}
                  disabled={focusFontSize === "sm"}
                  className="p-1 px-3.5 hover:bg-slate-500/10 disabled:opacity-30 text-[10px] font-extrabold font-mono transition-all cursor-pointer"
                  title="Phóng nhỏ chữ"
                >
                  A-
                </button>
                <span className="text-[9px] font-mono font-bold px-1 select-none">
                  {focusFontSize.toUpperCase()}
                </span>
                <button
                  onClick={() => {
                    if (focusFontSize === "sm") setFocusFontSize("base");
                    else if (focusFontSize === "base") setFocusFontSize("lg");
                    else if (focusFontSize === "lg") setFocusFontSize("xl");
                  }}
                  disabled={focusFontSize === "xl"}
                  className="p-1 px-3.5 hover:bg-slate-500/10 disabled:opacity-30 text-[10px] font-extrabold font-mono transition-all cursor-pointer"
                  title="Phóng to chữ"
                >
                  A+
                </button>
              </div>

              {/* Backing color swatches */}
              <div className="flex items-center gap-1.5 ml-2">
                <button
                  onClick={() => setFocusTheme("sepia")}
                  className={`w-5 h-5 rounded-full bg-[#fbf7f0] border-2 border-yellow-800/20 transition-all ${focusTheme === "sepia" ? "ring-2 ring-indigo-500 scale-110" : "hover:scale-105"}`}
                  title="Phông nến Giấy Nhám"
                />
                <button
                  onClick={() => setFocusTheme("white")}
                  className={`w-5 h-5 rounded-full bg-white border border-slate-300 transition-all ${focusTheme === "white" ? "ring-2 ring-indigo-500 scale-110" : "hover:scale-105"}`}
                  title="Phông nền Tuyết Trắng"
                />
                <button
                  onClick={() => setFocusTheme("dark")}
                  className={`w-5 h-5 rounded-full bg-[#0c0e12] border border-slate-850 transition-all ${focusTheme === "dark" ? "ring-2 ring-indigo-500 scale-110" : "hover:scale-105"}`}
                  title="Phông nền Đêm Cổ Điển"
                />
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 h-full">
          
          {/* LEFT SIDE PANEL: 3D cover container + views stats */}
          {!isFocusMode && (
            <div className="md:col-span-5 bg-gradient-to-br from-slate-50 to-slate-100/30 p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-100 animate-fade-in">
              <div className={`w-full max-w-xs aspect-square rounded-[10px] bg-gradient-to-br ${listing.glassClass} p-4 flex items-center justify-center relative overflow-hidden shadow-inner border border-white/40`}>
                <Listing3DImage type={listing.imageType} className="w-56 h-56" />
                {listing.sponsored && (
                  <span className="absolute top-3 left-3 px-3 py-1 text-[9px] font-extrabold tracking-widest uppercase text-indigo-950 bg-indigo-300 rounded-full shadow-xs">
                    Premium Read
                  </span>
                )}
              </div>

              {/* Reading feedback logs block */}
              <div className="mt-6 w-full max-w-xs flex justify-around bg-white/50 border border-slate-100 py-3 px-4 rounded-full text-slate-500">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-mono font-semibold">{listing.views} <span className="text-[10px] font-sans font-normal text-slate-400">lượt đọc</span></span>
                </div>
                <div className="h-4 w-px bg-slate-200" />
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-rose-400" />
                  <span className="text-xs font-mono font-semibold">{listing.likes + (isLiked ? 1 : 0)} <span className="text-[10px] font-sans font-normal text-slate-400">tim thích</span></span>
                </div>
              </div>

              {/* Quick specifications / essay highlights */}
              <div className="mt-6 w-full max-w-xs text-left">
                <h4 className="text-xs font-extrabold uppercase tracking-wide text-slate-400 mb-3 flex items-center gap-2 font-display">
                  <Tag className="w-3.5 h-3.5 text-indigo-500" /> Tiêu Điểm Biên Khảo
                </h4>
                <div className="space-y-2">
                  {listHighlights(listing).map((s, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs py-1.5 border-b border-slate-100">
                      <span className="text-slate-400 font-sans">{s.label}</span>
                      <span className="font-semibold text-slate-700 text-right">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* RIGHT SIDE PANEL: Deep typographic reading section + AI Copilot dropdown tool */}
          <div className={`transition-all duration-300 overflow-y-auto text-left flex flex-col ${
            isFocusMode 
              ? "md:col-span-12 w-full h-[calc(100%-60px)] max-h-[calc(100%-60px)] px-6 md:px-16" 
              : "relative md:col-span-7 p-6 md:p-8 max-h-[85vh]"
          }`}>
            
            <div className={`w-full ${isFocusMode ? "max-w-2xl mx-auto py-10" : ""}`}>
              
              {/* Header taglines */}
              <div className="flex items-center gap-2 mb-3">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  isFocusMode && focusTheme === "dark"
                    ? "bg-slate-900 text-indigo-400 border border-slate-800"
                    : "bg-indigo-50 text-indigo-600 border border-indigo-100/50"
                }`}>
                  {listing.category}
                </span>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  isFocusMode && focusTheme === "dark"
                    ? "bg-slate-900 text-emerald-400 border border-slate-800"
                    : "bg-emerald-50 text-emerald-600 border border-emerald-100/50"
                }`}>
                  {listing.readTime}
                </span>
                <span className={`text-[11px] ml-auto flex items-center gap-1 font-mono ${
                  isFocusMode 
                    ? focusTheme === "dark" ? "text-slate-500" : "text-yellow-905/60" 
                    : "text-slate-400"
                }`}>
                  <BookOpen className="w-3.5 h-3.5 opacity-60" /> {listing.originalDate || "Hôm nay"}
                </span>
              </div>

              {/* Deep typographic Title */}
              <h1 className={`font-extrabold tracking-tight leading-snug mb-2 ${
                isFocusMode 
                  ? focusSerif 
                    ? "font-serif text-3xl md:text-4xl" 
                    : "font-sans text-3xl md:text-4xl"
                  : "font-display text-2xl md:text-3xl text-slate-850"
              } ${isFocusMode ? (focusTheme === "dark" ? "text-white" : "text-slate-950") : ""}`}>
                {listing.title}
              </h1>

              {/* Location origin / Design school sub info */}
              <div className={`flex items-center gap-1.5 text-xs mb-6 font-medium ${
                isFocusMode ? "text-inherit opacity-75" : "text-slate-400"
              }`}>
                <MapPin className="w-3.5 h-3.5 opacity-60" />
                <span>Chuyên đề: <span className="text-indigo-600 font-semibold">{listing.location}</span></span>
                <span className="mx-2 opacity-30">|</span>
                <span className="font-mono text-[10px]">Xuất bản {listing.dateStr}</span>
              </div>

              <hr className={`mb-5 ${
                isFocusMode 
                  ? focusTheme === "dark" ? "border-slate-850" : "border-yellow-900/10" 
                  : "border-slate-100"
              }`} />

              {/* Clean, editorial prose column */}
              <div className={`prose max-w-none leading-relaxed space-y-5 mb-8 ${
                isFocusMode 
                  ? focusSerif 
                    ? "font-serif" 
                    : "font-sans"
                  : "prose-indigo text-slate-705 text-sm md:text-base"
              } ${isFocusMode ? fontClasses[focusFontSize] : ""}`}>
                {/* Strong Lead paragraph */}
                <p className={`font-bold border-l-4 rounded-r-[10px] pl-4 py-2.5 ${
                  isFocusMode
                    ? focusTheme === "dark"
                      ? "border-indigo-400 bg-indigo-950/20 text-indigo-200"
                      : "border-indigo-500 bg-indigo-50/40 text-indigo-950"
                    : "border-indigo-500 bg-indigo-50/20 text-slate-900 text-[15px] md:text-[16px]"
                }`}>
                  {listing.description}
                </p>
                
                {/* Article content body */}
                <div className={`whitespace-pre-line leading-relaxed pt-2 ${
                  isFocusMode 
                    ? focusTheme === "dark" 
                      ? "text-slate-350" 
                      : focusTheme === "sepia"
                        ? "text-[#3a2712] opacity-90"
                        : "text-slate-800"
                    : "text-[14px] md:text-[15px] font-sans text-slate-650"
                }`}>
                  {listing.content || "Mô tả bài viết chưa được cập nhật đầy đủ."}
                </div>
              </div>

              {/* High-fashion Author info box */}
              <div className={`border rounded-2xl p-4 mb-8 flex flex-col sm:flex-row gap-4 items-center justify-between ${
                isFocusMode
                  ? focusTheme === "dark"
                    ? "bg-slate-900/30 border-slate-800"
                    : "bg-yellow-905/30 border-yellow-900/5 text-yellow-950"
                  : "bg-slate-50/70 border-slate-100/50"
              }`}>
                <div className="flex items-center gap-3 self-start sm:self-center">
                  <img 
                    src={listing.author.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120"} 
                    alt={listing.author.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                    referrerPolicy="no-referrer"
                  />
                  <div className="text-xs">
                    <h3 className="font-extrabold flex items-center gap-1">
                      {listing.author.name}
                      {listing.author.verified && (
                        <Shield className="w-3.5 h-3.5 text-indigo-500 fill-indigo-500/20" />
                      )}
                    </h3>
                    <p className="opacity-70 font-medium text-[10px] mt-0.5">{listing.author.role || "Tác giả / Biên tập viên"}</p>
                    <p className="text-amber-500 text-[10px] font-mono mt-0.5">★ {listing.author.rating} Điểm uy tín</p>
                  </div>
                </div>
                
                <button 
                  onClick={handleShareClick}
                  className={`w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-300 cursor-pointer ${
                    isFocusMode && focusTheme === "dark"
                      ? "bg-slate-800 hover:bg-slate-700 text-slate-200"
                      : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700"
                  }`}
                >
                  <Share2 className="w-3.5 h-3.5" /> 
                  {shareSuccess ? "Đã sao chép link" : "Chia sẻ bài đọc"}
                </button>
              </div>

              {/* INTERACTIVE GEMINI AI EDITORIAL COPILOT PANEL */}
              {(!isFocusMode || showAICopilotInFocus) ? (
                <div className="bg-gradient-to-tr from-indigo-50/50 to-violet-50/50 border border-indigo-100/60 rounded-[10px] p-5 animate-fade-in">
                  
                  {/* Header Title with animated stars */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-sm">
                        <Sparkles className="w-4.5 h-4.5 animate-pulse-slow" />
                      </div>
                      <div>
                        <h3 className="text-xs font-extrabold text-slate-800 tracking-wide uppercase font-display">
                          Gemini Editorial Copilot
                        </h3>
                        <p className="text-[10px] text-slate-400">Trình biên tập đa ngôn ngữ & Trợ lý mạng xã hội AI</p>
                      </div>
                    </div>
                  </div>

                  {/* Step 1: Selector for action */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 bg-white/85 p-4 rounded-2xl border border-indigo-100/20 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 select-none">Hành động của AI</label>
                      <select 
                        value={selectedAction}
                        onChange={(e) => {
                          const val = e.target.value as any;
                          setSelectedAction(val);
                          // Update sensible default configurations for parameters
                          if (val === "translate") setTargetParam("English");
                          else if (val === "tone") setTargetParam("Sáng tạo bay bổng");
                          else if (val === "social") setTargetParam("Tất cả nền tảng");
                          else if (val === "expand") setTargetParam("Tổng luận chi tiết");
                        }}
                        className="w-full px-3 py-2 border border-slate-200 focus:border-indigo-500 rounded-xl outline-none font-medium text-slate-700 bg-slate-50 transition-all font-sans"
                      >
                        <option value="translate">Dịch bài viết (Translation)</option>
                        <option value="tone">Đổi giọng văn chính (Change Tone)</option>
                        <option value="social">Tạo bộ Truyền Thông (Social Kit)</option>
                        <option value="expand">Mở rộng bài viết dài (Expand Copy)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 select-none">Tuỳ chỉnh bổ trợ</label>
                      {selectedAction === "translate" ? (
                        <select 
                          value={targetParam}
                          onChange={(e) => setTargetParam(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 focus:border-indigo-500 rounded-xl outline-none font-medium text-slate-700 bg-slate-50 transition-all font-sans"
                        >
                          <option value="Tiếng Anh (English)">Tiếng Anh (English)</option>
                          <option value="Tiếng Việt (Vietnamese)">Tiếng Việt (Vietnamese)</option>
                          <option value="Tiếng Nhật (Japanese)">Tiếng Nhật (Japanese)</option>
                          <option value="Tiếng Pháp (French)">Tiếng Pháp (French)</option>
                        </select>
                      ) : selectedAction === "tone" ? (
                        <select 
                          value={targetParam}
                          onChange={(e) => setTargetParam(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 focus:border-indigo-500 rounded-xl outline-none font-medium text-slate-700 bg-slate-50 transition-all font-sans"
                        >
                          <option value="Sáng tạo bay bổng thơ mộng">Sáng tạo bay bổng thơ mộng</option>
                          <option value="Chuyên gia phân tích sâu sắc">Chuyên gia phân tích sâu sắc</option>
                          <option value="Hài hước hóm hỉnh đầy sắc sảo">Hài hước hóm hỉnh đầy sắc sảo</option>
                          <option value="Cổ điển trang trọng hoài niệm">Cổ điển trang trọng hoài niệm</option>
                        </select>
                      ) : (
                        <input 
                          type="text"
                          value={targetParam}
                          onChange={(e) => setTargetParam(e.target.value)}
                          placeholder="Ví dụ: Đăng LinkedIn, Viết thơ..."
                          className="w-full px-3 py-2 border border-slate-200 focus:border-indigo-500 rounded-xl outline-none text-slate-705 bg-slate-50 transition-all"
                        />
                      )}
                    </div>
                  </div>

                  {/* Action trigger button */}
                  <button
                    type="button"
                    onClick={handleBlogAssist}
                    disabled={aiLoading}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-md shadow-indigo-200 transition-all duration-300 disabled:opacity-75 cursor-pointer text-xs"
                  >
                    <Sparkles className="w-4 h-4" />
                    {aiLoading ? "Đang xử lý ý tưởng nội dung..." : "Kích Hoạt Biên Tập Chuyên Sâu Cùng AI"}
                  </button>

                  {errorMessage && (
                    <div className="mt-3 text-red-500 text-[10px] py-2 text-center font-medium bg-red-50 rounded-lg border border-red-100">
                      {errorMessage}
                    </div>
                  )}

                  {/* OUTPUT CARD BOARD */}
                  {aiResult && (
                    <div className="mt-4 bg-white border border-indigo-100 rounded-2xl p-4 animate-fade-in text-xs space-y-4 text-slate-700">
                      {/* Title or Action confirmation badge */}
                      <div className="flex items-center gap-2 text-indigo-700 font-extrabold text-[10px] uppercase tracking-wide border-b border-indigo-50 pb-2">
                        <Check className="w-4 h-4 text-emerald-500" /> Bản Chế Tác Hoàn Thành: {selectedAction.toUpperCase()}
                      </div>
                      
                      {/* Key Takeaways */}
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-slate-600 text-[11px]">
                        <span className="font-extrabold block text-slate-800 text-[10px] uppercase tracking-wider mb-1.5 font-display text-indigo-600">Đúc Kết Cốt Lõi (AI Insights)</span>
                        <ul className="list-disc leading-relaxed pl-4 space-y-1 text-[11px]">
                          {aiResult.keyTakeaways && aiResult.keyTakeaways.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Processed Copy Area */}
                      <div>
                        <div className="flex justify-between items-center mb-1 bg-indigo-50/50 py-1 px-3 rounded-lg border border-indigo-50 font-sans">
                          <span className="text-[9px] font-bold text-slate-500 block uppercase">Nội dung đã qua điều phối</span>
                          <button
                            onClick={() => copyToClipboard(aiResult.processedContent, false)}
                            className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                          >
                            {copiedOutput ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                            {copiedOutput ? "Đã sao chép" : "Copy nội dung"}
                          </button>
                        </div>
                        <div className="p-3.5 bg-slate-50/50 rounded-lg border border-slate-100 italic text-slate-700 leading-relaxed font-mono whitespace-pre-line text-[11px] max-h-[220px] overflow-y-auto">
                          {aiResult.processedContent}
                        </div>
                      </div>

                      {/* Social Snippet Copy */}
                      {aiResult.socialSnippet && (
                        <div className="pt-2 border-t border-slate-100">
                          <div className="flex justify-between items-center mb-1 font-sans">
                            <span className="text-[9px] font-bold text-slate-500 block uppercase">Mẫu Đăng Tiếp Thị (Social Copywriter)</span>
                            <button
                              onClick={() => copyToClipboard(aiResult.socialSnippet, true)}
                              className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                            >
                              {copiedSocial ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                              {copiedSocial ? "Đã sao chép" : "Copy mẫu Social"}
                            </button>
                          </div>
                          <div className="p-3 bg-indigo-50/30 rounded-lg border border-indigo-100/40 text-indigo-950 font-sans text-[11px] leading-normal italic">
                            "{aiResult.socialSnippet}"
                          </div>
                        </div>
                      )}

                    </div>
                  )}

                  {isFocusMode && (
                    <button 
                      onClick={() => setShowAICopilotInFocus(false)}
                      className="mt-5 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 mx-auto cursor-pointer"
                    >
                      Thu gọn Trợ Lý AI ↑
                    </button>
                  )}

                </div>
              ) : (
                <div className="text-center pt-2">
                  <button
                    onClick={() => setShowAICopilotInFocus(true)}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-full border border-indigo-100 text-xs font-bold font-sans transition-all duration-300 shadow-xs cursor-pointer select-none"
                  >
                    <Sparkles className="w-4 h-4 text-indigo-505 animate-pulse" />
                    <span>Kích hoạt Gemini AI Editorial Copilot cho bài viết này</span>
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Tool specifications lookup resolver
function listHighlights(blog: BlogPost) {
  if (blog.specs && blog.specs.length > 0) return blog.specs;
  // Default specs mapping
  return [
    { label: "Chủ thảo", value: blog.category },
    { label: "Tác giả", value: blog.author.name },
    { label: "Lưu lượng", value: blog.readTime }
  ];
}
