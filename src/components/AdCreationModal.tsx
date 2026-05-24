import React, { useState } from "react";
import { X, Sparkles, AlertCircle, Check, ArrowRight, Tag, HelpCircle, BookOpen } from "lucide-react";
import { Category, BlogPost } from "../types";

interface AdCreationModalProps {
  categories: Category[];
  onClose: () => void;
  onAddListing: (listing: BlogPost) => void;
}

export const AdCreationModal: React.FC<AdCreationModalProps> = ({
  categories,
  onClose,
  onAddListing
}) => {
  // Form fields state
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Interior Design");
  const [readTimeVal, setReadTimeVal] = useState<number>(5); // Replaced "Price" with estimated minutes of read time
  const [notes, setNotes] = useState("");
  const [selectedImage, setSelectedImage] = useState<any>("chair_orange");

  // AI Generated output state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiGenerated, setAiGenerated] = useState<{
    adTitle: string;
    adDescription: string;
    adKeywords: string[];
  } | null>(null);

  const [validationError, setValidationError] = useState<string | null>(null);
  const [publishSuccess, setPublishSuccess] = useState(false);

  const imgOptions = [
    { type: "chair_orange", label: "Chủ đề: Ghế bành Cam" },
    { type: "camera", label: "Chủ đề: Máy ảnh Retro" },
    { type: "boots", label: "Chủ đề: Giày bốt Da" },
    { type: "chair_red", label: "Chủ đề: Ghế đỏ Swivel" },
    { type: "pyramid", label: "Chủ đề: Khối quang phổ" },
    { type: "house_prism", label: "Chủ đề: Đền kính vòm" },
    { type: "car_blue", label: "Chủ đề: Xe đồ chơi Xanh" },
    { type: "toy_green", label: "Chủ đề: Cầu trượt pastel" }
  ];

  const handleGenerateAIAd = async () => {
    if (!title.trim()) {
      setValidationError("Vui lòng nhập định hướng đề tài bài viết để Gemini có ý tưởng biên khảo.");
      return;
    }
    setValidationError(null);
    setAiLoading(true);
    try {
      const res = await fetch("/api/gemini/create-ad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          category,
          price: readTimeVal, // API map: price is used on server for minute calculations
          condition: "Premium Issue",
          notes
        })
      });
      if (!res.ok) throw new Error("Không thể kết nối máy chủ tạo văn bản AI.");
      const data = await res.json();
      setAiGenerated(data);
    } catch (err: any) {
      setValidationError("Không kết nối được server AI. Phác thảo mẫu văn bản mặc định.");
      // Fallback fallback simulated blog post draft
      setAiGenerated({
        adTitle: `Bàn Về Triết Lý Thiết Kế Không Gian Đỡ: Hành Trình Của ${title}`,
        adDescription: `Tác phẩm thảo luận về ứng dụng thực nghiệm của đề tài "${title}".\n\nNằm trong tập san biên soạn mới về chuyên mục ${category}, bài phê bình tập trung bóc tách cách các chi tiết bo tròn, phối ghép ánh sáng nhân tạo bổ trợ và định hình tư duy của người trải nghiệm một cách thô mộc. \n\nChúng tôi đúc rút rằng sản lượng thẫm mỹ thực dụng mang tính biểu tượng này sẽ định hình xu hướng phong cách sống tinh gọn bậc nhất trong thời gian tới.`,
        adKeywords: ["ThietKeToiGian", category.replace(/\s+/g, ''), "DinhHinhPhongCach"]
      });
    } finally {
      setAiLoading(false);
    }
  };

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setValidationError("Vui lòng nhập định hướng đề tài trước khi sản xuất bài viết.");
      return;
    }

    const finalTitle = aiGenerated ? aiGenerated.adTitle : `Khảo Cứu Nghệ Thuật: ${title}`;
    const finalDesc = aiGenerated ? aiGenerated.adDescription : (notes || `Biên soạn chi tiết về chủ đề ${title}.`);

    // Color gradient presets based on selected cover graphic
    const styleMap: any = {
      chair_orange: "from-[#ffe8e0] to-[#ffd5c6] text-orange-900 border-orange-200/50",
      camera: "from-[#fae3ff] to-[#f4beff] text-pink-900 border-pink-200/50",
      boots: "from-[#e1f5fe] to-[#b3e5fc] text-sky-900 border-sky-100/50",
      chair_red: "from-[#ffe8e8] to-[#ffccd3] text-red-900 border-red-200/50",
      pyramid: "from-[#f3e5f5] to-[#e1bee7] text-purple-900 border-purple-200/50",
      house_prism: "from-[#e0f7fa] to-[#b2ebf2] text-cyan-900 border-cyan-100/50",
      car_blue: "from-[#e8eaf6] to-[#c5cae9] text-indigo-900 border-indigo-200/50",
      toy_green: "from-[#e8f5e9] to-[#c8e6c9] text-emerald-900 border-emerald-100/50"
    };

    const newPost: BlogPost = {
      id: `lst_custom_${Date.now()}`,
      title: finalTitle,
      category,
      readTime: `${readTimeVal} Phút đọc`,
      location: "Phát hành cá nhân",
      glassClass: styleMap[selectedImage] || styleMap.chair_orange,
      imageType: selectedImage,
      author: {
        name: "Nhà Biên Tập Trẻ",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120",
        rating: 4.9,
        verified: true,
        role: "Tác giả độc lập"
      },
      description: finalDesc.substring(0, 160) + "...",
      content: finalDesc,
      specs: [
        { label: "Phong cách biên soạn", value: "Thiết kế & Đời sống" },
        { label: "Sáng tác bởi", value: "Cộng tác viên ClassiAds" },
        { label: "Độ dài ước lượng", value: `${readTimeVal} Phút` },
        { label: "Công nghệ hiệu chỉnh", value: aiGenerated ? "Gemini AI" : "Ban biên tập" }
      ],
      views: 12,
      likes: 2,
      dateStr: "Vừa xong"
    };

    onAddListing(newPost);
    setPublishSuccess(true);
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white/95 backdrop-blur-2xl rounded-[32px] shadow-2xl border border-white/50 overflow-hidden my-6">
        
        {/* Top header title details */}
        <div className="flex items-center justify-between px-6 md:px-8 py-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-800 tracking-wide uppercase font-display">
                Biên Soạn Tập San Cao Cấp
              </h2>
              <p className="text-[10px] text-slate-400">Sử dụng sức mạnh tư duy Gemini AI viết nháp chuyên khảo chuẩn SEO</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {validationError && (
          <div className="mx-6 md:mx-8 mt-4 bg-red-50 border border-red-100/50 rounded-xl p-3 flex items-center gap-2 text-xs text-red-600">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {publishSuccess ? (
          <div className="p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mb-4">
              <Check className="w-8 h-8 animate-bounce" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 font-display">Xuất Bản Tập San Thành Công!</h3>
            <p className="text-slate-500 text-xs mt-1">Nội dung của bạn đã được xuất bản tức thì vào danh sách bài đọc nổi bật.</p>
          </div>
        ) : (
          <form onSubmit={handlePublish} className="grid grid-cols-1 md:grid-cols-2">
            
            {/* Left panel: Input Form fields */}
            <div className="p-6 md:p-8 space-y-4 border-r border-slate-100 max-h-[70vh] overflow-y-auto text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1.5">Chủ đề bài viết chính</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="Ví dụ: Sự biến đổi của gạch men thô, Nghệ thuật Bauhaus..." 
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 bg-slate-50/50 outline-none text-slate-800 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1.5">Chuyên mục</label>
                  <select 
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 bg-slate-50/50 outline-none text-slate-700 transition-colors"
                  >
                    {categories.filter(c => c.id !== "browse" && c.id !== "admin" && c.id !== "favorites").map((cat) => (
                      <option key={cat.id} value={cat.label}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1.5">Số phút đọc ước tính</label>
                  <input 
                    type="number" 
                    value={readTimeVal} 
                    onChange={(e) => setReadTimeVal(Math.max(1, Number(e.target.value)))} 
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 bg-slate-50/50 outline-none text-slate-800 font-mono transition-colors"
                    placeholder="Mins Read"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1.5">Đồ họa 3D hiển thị tương thích</label>
                <select 
                  value={selectedImage} 
                  onChange={(e) => setSelectedImage(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 bg-slate-50/50 outline-none text-slate-700 transition-colors"
                >
                  {imgOptions.map((opt) => (
                    <option key={opt.type} value={opt.type}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1.5">Ghi chú cốt lõi, từ khóa hoặc dàn bài đại diện (tùy chọn)</label>
                <textarea 
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)} 
                  rows={3}
                  placeholder="Ví dụ: Nhấn mạnh về các màu phấn nhạt, phân tích tính công năng, phỏng vấn một kiến trúc sư Thụy Điển..." 
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 bg-slate-50/50 outline-none text-slate-800 transition-colors resize-none"
                />
              </div>

              <button
                type="button"
                onClick={handleGenerateAIAd}
                disabled={aiLoading}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-md shadow-indigo-100 transition-all duration-300 disabled:opacity-75 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                {aiLoading ? "Gemini đang chắp bút bài báo..." : "Biên Soạn Bản Nháp Bằng Gemini AI"}
              </button>
            </div>

            {/* Right panel: AI generated draft preview & final publish trigger */}
            <div className="p-6 md:p-8 bg-slate-50/60 flex flex-col justify-between max-h-[70vh] overflow-y-auto text-xs">
              
              <div className="space-y-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block select-none">Bản nháp được chế tác bởi AI</span>
                
                {aiLoading ? (
                  <div className="p-8 border-2 border-dashed border-indigo-100 rounded-2xl flex flex-col items-center justify-center py-16">
                    <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin mb-3"></div>
                    <p className="text-slate-400 text-xs">Gemini AI đang dệt bản chuyên khảo phong phú...</p>
                  </div>
                ) : aiGenerated ? (
                  <div className="space-y-4 animate-fade-in text-xs">
                    {/* Draft Title */}
                    <div className="bg-white p-4 rounded-xl border border-indigo-100/50 shadow-xs">
                      <span className="text-[9px] text-indigo-500 font-extrabold uppercase block mb-1">Tiêu đề bài viết bóng bẩy</span>
                      <h4 className="font-bold text-slate-800 text-xs">{aiGenerated.adTitle}</h4>
                    </div>

                    {/* Draft content */}
                    <div className="bg-white p-4 rounded-xl border border-indigo-100/50 shadow-xs">
                      <span className="text-[9px] text-indigo-500 font-extrabold uppercase block mb-1">Nội dung cột báo chí</span>
                      <p className="text-slate-600 text-[11px] leading-relaxed whitespace-pre-line">{aiGenerated.adDescription}</p>
                    </div>

                    {/* Draft hashtags */}
                    <div className="flex gap-2.5 flex-wrap">
                      {aiGenerated.adKeywords.map((kw, i) => (
                        <span key={i} className="text-[10px] bg-indigo-50 text-indigo-600 rounded-md px-2 py-1 font-mono">
                          #{kw}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-8 border border-slate-200/60 rounded-2xl flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <p className="text-slate-400 font-medium font-sans">Chưa có bài nháp AI</p>
                    <p className="text-slate-300 text-[10px] max-w-xs mt-1">Bấm nút "Biên Soạn Bản Nháp Bằng Gemini AI" để tự động lên tiêu đề nghệ thuật và dệt vệt màu văn học độc đáo.</p>
                  </div>
                )}
              </div>

              {/* Bottom Submit block */}
              <div className="pt-6 border-t border-slate-100 mt-6 md:mt-0">
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-extrabold py-4 px-6 rounded-2xl shadow-lg transition-all duration-300 cursor-pointer text-xs"
                >
                  Xuất Bản Bài Viết Lên Tuần San <ArrowRight className="w-4 h-4" />
                </button>
                <p className="text-[9px] text-slate-400 text-center mt-2 font-medium">Bản thảo sẽ trực tiếp xuất bản lên luồng nội dung tuyển chọn.</p>
              </div>

            </div>
          </form>
        )}
      </div>
    </div>
  );
};
