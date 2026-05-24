import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Initialize GoogleGenAI with modern recommended SDK configuration
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

app.use(express.json());

// API: Check system health
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// API: AI Blog Assister (Translate, Rewriting, Expansion, Social Media Prep)
app.post("/api/gemini/blog-assist", async (req, res) => {
  try {
    const { title, category, content, action, targetParam } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      // Elegant, rich, fully localized fallback system for when the user hasn't supplied an API key yet.
      let mockBody = {
        title: title || "Bài viết thời thượng",
        processedContent: "",
        socialSnippet: "",
        keyTakeaways: ["Thẩm mỹ thời đại mới", "Tối ưu công năng thực tế", "Sự gắn kết bản sắc cá nhân"]
      };

      if (action === "translate") {
        mockBody.processedContent = `[BẢN DỊCH KHẢO SÁT SANG: ${targetParam}]\n\n(Vui lòng cung cập khóa GEMINI_API_KEY trong Settings để kích hoạt dịch thuật thời gian thực bằng mô hình Gemini 3.5-Flash)\n\nNội dung gốc: "${content?.substring(0, 100)}..."`;
        mockBody.socialSnippet = `Đọc phiên bản ngôn ngữ ${targetParam} của tập san "${title}" ngay hôm nay! #Translation #Design`;
      } else if (action === "tone") {
        mockBody.processedContent = `[PHIÊN BẢN GIỌNG ĐIỆU: ${targetParam}]\n\n(Cấu hình khóa GEMINI_API_KEY để viết lại văn phóng cùng Trí Tuệ Nhân Tạo)\n\nĐối với tác phẩm "${title}", bài viết dưới lăng kính phong thái "${targetParam}" sẽ dệt nên một câu chuyện đậm chất sáng tạo độc bản, lôi cuốn tâm hồn yêu cái đẹp ngay từ ánh nhìn đầu bài viết. Gửi gắm tình cảm vào từng mảng màu và cấu trúc của đồ vật.`;
        mockBody.socialSnippet = `Cách nhìn mới về tác phẩm nghệ thuật dưới lăng kính ${targetParam}! Độc giả không nên bỏ lỡ. #ArtDirection`;
      } else if (action === "expand") {
        mockBody.processedContent = `[MỞ RỘNG BÀI VIẾT PHÂN TÍCH CHI TIẾT SÂU]\n\n(Kích hoạt khóa GEMINI_API_KEY để AI tự động tra cứu, mở rộng cấu trúc bài viết có tiêu đề khoa học)\n\nChào độc giả phong cách của ClassiAds,\n\nKhi bàn luận về chủ đề "${title}" trong danh mục ${category}, chúng ta đang chạm đến đỉnh cao của triết lý tối giản đương đại. Trải qua hàng ngàn tiếng thử nghiệm và tinh mài bóng bẩy, tác phẩm nổi lên như một điểm cực mấu nối giữa tâm lý học không gian sống dã ngoại và sự bền bỉ của thời trang phố.\n\nTừng chi tiết dập chỉ, từng góc bo khuyết mờ, từng xúc cảm khi xúc chạm cơ học với sản phẩm đều khắc họa rõ ràng tinh thần tỉ mẩn tuyệt đối của những người thợ thủ công lành nghề. Chúng tôi hy vọng bài viết sẽ thổi bùng khát khao định thiết không gian sống đầy nghệ thuật của riêng bạn.`;
        mockBody.socialSnippet = `Bản biên khảo mở rộng tuyệt đỉnh từ chuyên gia thiết kế về chủ đề "${title}". Đăng ký tham gia ngay! #DesignLeadership #Longread`;
      } else {
        mockBody.processedContent = content || "";
        mockBody.socialSnippet = `Khám phá câu chuyện thiết kế đằng sau "${title}". Đọc ngay tại trang chủ! #ClassicDesign #Minimalism`;
      }

      return res.json(mockBody);
    }

    let prompt = "";
    if (action === "translate") {
      prompt = `Hãy dịch bài viết blog thiết kế sau đây sang ngôn ngữ "${targetParam}" thật mượt mà, văn phong thời trang/kiến trúc cao cấp, giữ nguyên các thuật ngữ chuyên ngành:
Tên bài viết: "${title}"
Thể loại: ${category}
Nội dung gốc:
${content}`;
    } else if (action === "tone") {
      prompt = `Hãy viết lại nội dung blog sau đây theo giọng điệu độc giả mong muốn: "${targetParam}" (Ví dụ: 'Sáng tạo bay bổng thơ mộng', 'Chuyên gia phân tích sâu sắc', 'Hài hước và sắc sảo'). Đảm bảo tác phẩm đọc lên như viết bởi một nhà báo nghệ thuật hàng đầu:
Tên bài viết: "${title}"
Nội dung ban đầu:
${content}`;
    } else if (action === "expand") {
      prompt = `Hãy đóng vai là một Tổng biên tập tạp chí phong cách sống và thiết kế nội thất/công nghệ thời thượng. Hãy viết một bài viết blog phân tích chi tiết sâu sắc hoàn chỉnh dựa trên tiêu đề và thông tin tóm tắt sau đây. Bài viết có độ dài 250-350 từ, tràn ngập năng lượng cảm hứng, có cấu trúc tiểu đề rõ ràng lôi cuốn:
Tên bài viết: "${title}"
Thể loại: ${category}
Tóm tắt ý tưởng ban đầu:
${content}`;
    } else if (action === "social") {
      prompt = `Hãy viết một bộ bài đăng truyền thông tiếp thị (Social Media Kit) dựa trên bài blog "${title}". Bộ sản phẩm bao gồm: 1 bài đăng Facebook cuốn hút giật tít, 1 chuỗi Twitter thread gồm 3 tweet ngắn gọn kích thích tranh luận kèm 5 hashtag thịnh hành:
Nội dung bài viết:
${content}`;
    } else {
      prompt = `Hãy tối ưu hóa bài blog "${title}" thuộc chủ đề ${category}. Tóm gọn ý và trích lấy những từ khóa xu hướng phong cách:
Nội dung:
${content}`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "Bạn là Tổng biên tập (Chief Editor) tối cao của ClassiAds Editorial - tuần san kiến trúc, thiết kế và công nghệ cao cấp. Bạn viết văn phong tinh tế, có chiều sâu trí thức, kích thích thị giác và am hiểu chủ nghĩa tối giản minimalism.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["title", "processedContent", "socialSnippet", "keyTakeaways"],
          properties: {
            title: { type: Type.STRING, description: "Tiêu đề bài viết sau xử lý hoặc giữ nguyên phù hợp nhất" },
            processedContent: { type: Type.STRING, description: "Phần nội dung bài viết đã qua chế tác chi tiết (mở rộng, dịch, hoặc chuyển đổi giọng văn)" },
            socialSnippet: { type: Type.STRING, description: "Trích đoạn ngắn tiếp thị súc tích hoàn chỉnh đăng mạng xã hội kèm tag" },
            keyTakeaways: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Danh sách 3 điểm rút ra cốt lõi nhất được đúc kết từ bài đọc này"
            }
          }
        }
      }
    });

    const parsedData = JSON.parse(response.text?.trim() || "{}");
    res.json(parsedData);
  } catch (error: any) {
    console.error("Gemini blog-assist failed:", error);
    res.status(500).json({ error: error.message || "Failed to process blog action with Gemini" });
  }
});

// API: AI Blog Post Creator Engine
app.post("/api/gemini/create-ad", async (req, res) => {
  try {
    const { title, category, price, condition, notes } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(200).json({
        adTitle: `Huyền Thoại Trở Lại: Câu Chuyện Đằng Sau ${title || "Kiệt Tác Thiết Kế"}`,
        adDescription: `Tác phẩm thảo luận về: ${title || "nghệ thuật sống động"}.\n\nĐây là mẫu bài viết được biên soạn sẵn về chủ đề ${category}. Với những ghi chú sáng tạo riêng biệt: ${notes || "Triết lý tối giản kết hợp công năng tối ưu."}\n\nHy vọng bài nghiên cứu này sẽ thắp sáng ý tưởng trang hoàng không gian làm việc hay nâng tầm phong cách sống thời thượng của bạn trong thời kỳ số hóa rộng mở.`,
        adKeywords: ["TrietLyThietKe", category?.toLowerCase() || "editorial", "phongcachsong", "toigian"]
      });
    }

    const prompt = `Hãy đóng vai một nhà phê bình thiết kế thời thượng. Soạn thảo một TIÊU ĐỀ tạp chí lôi cuốn và nội dung BÀI BÁO BLOG hoàn chỉnh, có cấu trúc mượt mà, sâu sắc về xúc cảm mỹ thuật của:
Tên tác phẩm: "${title}"
Chủ đề tạp chí: ${category}
Thời gian đọc ước tính dựa trên độ dài (ước lượng thay thế giá $${price} bằng đơn vị phút đọc): ${price || 5} phút đọc
Phong thái/Ghi âm chủ đề: "${notes || "Không có ghi chú thêm"}"`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "Bạn biên soạn các bài blog cho tuần san ClassiAds Editorial, văn phong giàu chất thơ lãng mạn nhưng cực kỳ đanh thép về chuyên môn thiết kế.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["adTitle", "adDescription", "adKeywords"],
          properties: {
            adTitle: { type: Type.STRING, description: "Tiêu đề giật tít sâu sắc nghệ thuật của bài báo." },
            adDescription: { type: Type.STRING, description: "Nội dung bài viết hoàn thiện cực kỳ chất lượng, gồm 2-3 đoạn phân tích bối cảnh, công năng và triết lý sử dụng." },
            adKeywords: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Bộ 4 từ khóa chủ đạo dạng hash tag viết liền không dấu."
            }
          }
        }
      }
    });

    const parsedData = JSON.parse(response.text?.trim() || "{}");
    res.json(parsedData);
  } catch (error: any) {
    console.error("Gemini blog composition failed:", error);
    res.status(500).json({ error: error.message || "Failed to draft blog post" });
  }
});

async function startServer() {
  // Vite integration for rich frontend development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static compiled assets in production
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[ClassiAds Server] Up and running on http://localhost:${PORT}`);
  });
}

startServer();
