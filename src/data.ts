import { BlogPost, Category } from "./types";

export const CATEGORIES: Category[] = [
  {
    id: "furniture",
    label: "Interior Design",
    translation: "Thiết kế Nội thất & Không gian",
    count: 14,
    iconName: "Sofa",
    colorScheme: "teal"
  },
  {
    id: "electronics",
    label: "Tech Design",
    translation: "Thiết kế Công nghệ",
    count: 9,
    iconName: "Cpu",
    colorScheme: "sky"
  },
  {
    id: "fashion",
    label: "Fashion Detail",
    translation: "Thời trang & Phụ kiện",
    count: 21,
    iconName: "Shirt",
    colorScheme: "violet"
  },
  {
    id: "collections",
    label: "Art Objects",
    translation: "Tác phẩm Nghệ thuật",
    count: 7,
    iconName: "Gem",
    colorScheme: "yellow"
  },
  {
    id: "favorites",
    label: "Must-Read",
    translation: "Tập san tuyển chọn",
    count: 5,
    iconName: "Heart",
    colorScheme: "rose"
  },
  {
    id: "browse",
    label: "All Stories",
    translation: "Tất cả bài viết",
    count: 51,
    iconName: "Grid",
    colorScheme: "indigo"
  },
  {
    id: "admin",
    label: "New Article",
    translation: "Viết bài mới",
    count: 0,
    iconName: "LayoutDashboard",
    colorScheme: "blue"
  }
];

export const INITIAL_LISTINGS: BlogPost[] = [
  {
    id: "lst_001",
    title: "Sự Trỗi Dậy Của Ghế Bành Cam Mid-Century",
    category: "Interior Design",
    readTime: "5 Phút đọc",
    originalDate: "May 20, 2026",
    location: "Kiến Trúc Đương Đại",
    glassClass: "from-[#ffe8e0] to-[#ffd5c6] text-orange-900 border-orange-200/50",
    imageType: "chair_orange",
    author: {
      name: "Marcus Aurelius",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120",
      rating: 4.9,
      verified: true,
      role: "Senior Design Editor"
    },
    description: "Khám phá cách gam màu cam đất và những đường cong hữu cơ của thiết kế ghế bành thế kỷ trước đang tái lập không gian văn phòng sáng tạo ngày nay.",
    content: "Ghế bành Mid-Century Modern không chỉ đơn giản là một vật dụng để ngồi; nó đại diện cho một triết lý thiết kế tối giản, nơi công năng hòa quyện vào tính thẩm mỹ tự nhiên. Với gam màu cam đất rực rỡ, sản phẩm này tạo nên một cú hích thị giác ngoạn mục trong bất kỳ không gian trung tính nào.\n\nĐặc điểm nổi bật của dòng thiết kế này là chiếc chân gỗ thon nhọn làm từ gỗ dẻ gai ép cứng (Solid Birch), tựa lưng bo cong nâng niu cơ thể, kết hợp cùng lớp đệm bọc bouclé xù mềm mịn. Sự kết hợp tài tình giúp chiếc ghế phá bỏ sự khô khan của những hình hộp kiến trúc văn phòng cứng nhắc thường thấy, biến chỗ ngồi làm việc thành một góc nghệ thuật đầy cảm hứng sáng tạo hay khu vực thả lỏng lý tưởng trong các studio nhiếp ảnh thời thượng.",
    specs: [
      { label: "Chủ đề", value: "Modernism & Bauhaus" },
      { label: "Vật liệu tiêu điểm", value: "Bouclé & Solid Birch" },
      { label: "Xu hướng áp dụng", value: "Biophilic Workspace" },
      { label: "Độ khó bài trí", value: "Dễ phối ngẫu" }
    ],
    views: 312,
    likes: 84,
    dateStr: "2 giờ trước",
    sponsored: true
  },
  {
    id: "lst_002",
    title: "Nhịp Thở Analog: Sức Hút Máy Ảnh Cơ 35mm",
    category: "Tech Design",
    readTime: "8 Phút đọc",
    originalDate: "May 18, 2026",
    location: "Nghệ Thuật Thị Giác",
    glassClass: "from-[#fae3ff] to-[#f4beff] text-pink-900 border-pink-200/50",
    imageType: "camera",
    author: {
      name: "Sofia Coppola",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120",
      rating: 4.8,
      verified: true,
      role: "Visual Arts Director"
    },
    description: "Giữa kỷ nguyên số bùng nổ, vì sao thế hệ sáng tạo trẻ vẫn tìm về sự chậm rãi của cuộn phim 35mm và tiếng màn sập cơ khí đanh giòn?",
    content: "Trải nghiệm chụp ảnh phim analog là một quá trình tôn thờ khoảnh khắc. Không có nút xóa nhanh, không có màn hình xem lại tức thời, người chụp buộc phải chiêm nghiệm kỹ càng khung cảnh trước khi bấm nút bấm vật lý.\n\nChiếc máy ảnh cơ SLR cổ điển quyến rũ chúng ta bằng cấu trúc lăng kính nhôm đúc tinh tế, các vòng xoay khẩu độ và tốc độ màn trập có nấc nảy cơ học sắc nét, mang lại xúc cảm vận hành thuần chất. Ống kính prime tiêu cự 50mm f/1.8 huyền thoại không chỉ thu giữ ánh sáng mà còn dệt nên những hạt noise màu phim đặc thù mà không bộ lọc filter kỹ thuật số nào có thể mô phỏng trọn vẹn. Tiếng đập gương phản xạ giòn giã chính là âm thanh của sự chân thực định hình phong cách sống phóng khoáng đầy hoài niệm.",
    specs: [
      { label: "Thiết bị", value: "SLR Manual Focus 35mm" },
      { label: "Thẩm mỹ", value: "Retro Mechanical Vintage" },
      { label: "Kỹ thuật truyền thống", value: "Tráng rửa hóa chất" },
      { label: "Độ thịnh hành", value: "Cực kỳ cao (Thế hệ Gen-Z)" }
    ],
    views: 450,
    likes: 110,
    dateStr: "1 ngày trước"
  },
  {
    id: "lst_003",
    title: "Giải Mã Đôi Combat Boots Trong Bản Đồ Subculture",
    category: "Fashion Detail",
    readTime: "6 Phút đọc",
    originalDate: "May 15, 2026",
    location: "Văn Hóa Thời Trang",
    glassClass: "from-[#e1f5fe] to-[#b3e5fc] text-sky-900 border-sky-100/50",
    imageType: "boots",
    author: {
      name: "Darian Vance",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120",
      rating: 4.7,
      verified: false,
      role: "High-Street Curator"
    },
    description: "Từ chiến trường đến sàn diễn thời trang punk và grunge, đôi giày bốt da chiến đấu đã chuyển mình thành tuyên ngôn của bản sắc đường phố tự do.",
    content: "Đôi giày bốt da chiến đấu (Combat Boots) mang trong mình tinh thần phản kháng mạnh mẽ. Được cấu trúc từ chất da bò nguyên tấm khâu chỉ đôi bọc bỉ và đế cao su đúc lưu hóa chống mài mòn, đôi bốt ban đầu được sản xuất phục vụ nhu cầu quân sự thực dụng nhưng nhanh chóng trở thành biểu tượng phản văn hóa của phong trào Grunge và Goth những thập niên trước.\n\nNgày nay, sự cải tiến thời thượng với các khoen kim loại xỏ nhanh, lót đệm hoạt tính êm ái xua tan nỗi ám ảnh cứng ráp ban đầu giúp đôi bốt trở thành mảnh ghép linh hoạt cho mọi bộ đồ dạo phố. Chúng tạo nên sự tương phản đầy cá tính khi diện chung với váy lụa thướt tha hay giữ trọn vẻ góc cạnh sắc nét khi đi cùng quần cargo bụi bặm, vẽ nên chân dung phá cách của kỷ nguyên tự do cá nhân.",
    specs: [
      { label: "Chất liệu chủ đạo", value: "Full-grain Aniline Leather" },
      { label: "Bộ đế", value: "Vibram military lugged" },
      { label: "Phong cách tương sinh", value: "Modern Grunge, Techwear" },
      { label: "Độ bền ước tính", value: "10 năm sử dụng bền bỉ" }
    ],
    views: 289,
    likes: 67,
    dateStr: "3 ngày trước"
  },
  {
    id: "lst_004",
    title: "Space-Age Tulip: Ghế Xoay Đỏ Đột Phá Thập Niên 1960",
    category: "Interior Design",
    readTime: "7 Phút đọc",
    originalDate: "May 22, 2026",
    location: "Thiết Kế Nội Thất",
    glassClass: "from-[#ffe8e8] to-[#ffccd3] text-red-900 border-red-200/50",
    imageType: "chair_red",
    author: {
      name: "Veronika Rostova",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=120",
      rating: 5.0,
      verified: true,
      role: "Interior Architect"
    },
    description: "Nhìn lại dòng chảy nghệ thuật vị lai (Retro-Futurism) qua đường nét uốn lượn liên tục của chiếc ghế xoay tulip đỏ - đỉnh cao điêu khắc ứng dụng.",
    content: "Chiếc ghế tulip xoay đỏ bóng bẩy là hiện thân sâu sắc nhất của trào lưu Space-Age đầy lạc quan giữa thế kỷ trước, khi loài người hướng ánh nhìn khao khát về phía vũ trụ bao la. Nhà thiết kế đã quyết tâm xóa sổ sự lộn xộn của 'rừng chân ghế' bằng cách sử dụng một bệ đỡ đơn điểm thanh mảnh duy nhất mô phỏng hình dáng bông hoa tulip chớm hé nở.\n\nVỏ ghế được đúc từ chất liệu sợi thủy tinh (fiberglass) sơn phủ bóng lacquer đỏ rực phản chiếu ánh sáng lấp lánh như một tác phẩm điêu khắc đương đại. Chân đế xoay bằng sắt mạ sơn chịu lực cao cho phép chuyển động xoay 360 độ hoàn hảo. Đây không chỉ là một chiếc ghế thư giãn thông thường, mà là một chiếc máy dịch chuyển thời gian đưa căn phòng sống của bạn trở về một phân cảnh mỹ thuật hư ảo thời thượng bậc nhất.",
    specs: [
      { label: "Khởi nguồn phong cách", value: "Space-Age Era (1960s)" },
      { label: "Vật liệu đột phá", value: "High-Gloss Reinforced Fiberglass" },
      { label: "Kết cấu trục", value: "Single-point Heavy Duty Swivel" },
      { label: "Mức độ sưu tầm", value: "Cấp độ Bảo tàng thiết kế" }
    ],
    views: 520,
    likes: 142,
    dateStr: "4 giờ trước",
    sponsored: true
  },
  {
    id: "lst_005",
    title: "Chơi Đùa Ánh Sáng: Khối Kính Chiết Sắc Dichroic",
    category: "Art Objects",
    readTime: "4 Phút đọc",
    originalDate: "May 12, 2026",
    location: "Nghệ Thuật Cực Giản",
    glassClass: "from-[#f3e5f5] to-[#e1bee7] text-purple-900 border-purple-200/50",
    imageType: "pyramid",
    author: {
      name: "Oliver Gray",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120",
      rating: 4.6,
      verified: true,
      role: "Experimental Artist"
    },
    description: "Làm thế nào một chiếc lăng kính tam giác thủ công từ thủy tinh quang học K9 lại có thể phân rã ánh sáng trắng thành cả dải màu cầu vồng kỳ ảo?",
    content: "Vật lý học kết hợp cùng nghệ thuật điêu khắc kính đã tạo nên những kiệt tác khúc xạ tuyệt diệu. Khối kim tự tháp kính sắc ảo ảnh (Dichroic Optical Prism) sử dụng các lớp màng oxit kim loại mỏng siêu vi mô phủ trên thủy tinh K9 để phản xạ có chọn lọc các bước sóng ánh sáng khác nhau.\n\nKhi đặt khối lăng kính dưới ánh nắng ban mai hoặc luồng sáng đèn spotlight, nó biến đổi năng lượng ánh sáng thành một vũ điệu của các dải màu pastel rực rỡ, tùy biến sống động theo từng góc nhìn của người quan sát. Đối với những nhà kiến thiết hay nghệ sĩ sáng tạo, sự xuất hiện của khối kính nhỏ trên bàn học là chất xúc tác mạnh mẽ giúp giải phóng tư duy, khơi thông những ý niệm nghệ thuật mới mẻ bằng sự thanh khiết của khoa học.",
    specs: [
      { label: "Loại kính", value: "Dichroic Optical Crystal K9" },
      { label: "Góc mài mọc", value: "Precision 60-degree Facets" },
      { label: "Trọng lượng", value: "1.4kg Pha lê nguyên khối" },
      { label: "Hiệu ứng quang", value: "Spectra light dispersion" }
    ],
    views: 180,
    likes: 45,
    dateStr: "1 tuần trước"
  },
  {
    id: "lst_006",
    title: "Nhà Vòm Sinh Thái NeoGlass: Kiến Trúc Bền Vững",
    category: "Interior Design",
    readTime: "9 Phút đọc",
    originalDate: "May 10, 2026",
    location: "Kiến Trúc Tương Lai",
    glassClass: "from-[#e0f7fa] to-[#b2ebf2] text-cyan-900 border-cyan-100/50",
    imageType: "house_prism",
    author: {
      name: "Jean Nouvel Studio",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120",
      rating: 4.9,
      verified: true,
      role: "Eco Architect Coordinator"
    },
    description: "Khám phá mô hình nhà kính tự vận hành và triết lý sử dụng các mảng neon bán dẫn để sưởi ấm tự nhiên và tuần hoàn năng lượng hiệu dụng.",
    content: "Mô hình kiến trúc nhà vòm sinh thái (Greenhouse Geodesic Dome) đại diện cho điểm đến giao thoa hoàn hảo giữa nông nghiệp bền vững và nghệ thuật định cư hiện đại. Công trình giải quyết bài toán không gian bằng một hình bán cầu liên tục xây dựng từ 48 mảnh vật liệu kính quang năng màu xanh lam neon ghép nối bởi khớp nối từ tính neodymium siêu mạnh.\n\nNhờ phân bổ tải trọng hình học lý tưởng của cấu trúc geodesic, nhà vòm có khả năng chịu lực cực đoan nhưng vẫn thanh thoát tuyệt đối. Trọng tâm thiết kế hướng tới khả năng đón nhận tối đa quang năng phục vụ các hệ thống sưởi ấm địa nhiệt và vườn thủy canh khép kính thụ động, mở ra một chương mới cho xu hướng sống hòa mình tự nhiên mà không cần thỏa hiệp sự tiện nghi xa hoa.",
    specs: [
      { label: "Tỷ lệ mô hình", value: "Studio scale 1:25" },
      { label: "Hệ thống khớp", value: "Neodymium Magnetic Snaps" },
      { label: "Công nghệ kính", value: "Solar-refracting acrylic polymer" },
      { label: "Vùng tương thích", value: "Đới khí hậu khắc nghiệt" }
    ],
    views: 330,
    likes: 92,
    dateStr: "2 ngày trước"
  },
  {
    id: "lst_007",
    title: "Mỹ Thuật Xe Đồ Chơi: Khơi Nguồn Thẩm Mỹ Công Nghiệp",
    category: "Fashion Detail",
    readTime: "5 Phút đọc",
    originalDate: "May 08, 2026",
    location: "Thiết Kế Đồ Chơi Trẻ Em",
    glassClass: "from-[#e8eaf6] to-[#c5cae9] text-indigo-900 border-indigo-200/50",
    imageType: "car_blue",
    author: {
      name: "Clara Oswald",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120",
      rating: 4.5,
      verified: false,
      role: "Industrial Kids Designer"
    },
    description: "Nhìn lại thiết kế xe đẩy chòi chân màu xanh trời thập niên 50 và cách các nhà thiết kế thổi hồn văn hóa Mỹ vào sản phẩm định hình óc thẩm mỹ tuổi thơ.",
    content: "Đôi khi, những bài học sâu sắc nhất về thẩm mỹ công nghiệp lại không nằm ở bảo tàng, mà nằm trên vỉa hè các công viên nhi trẻ. Chiếc xe chòi chân retro màu xanh trời thu hút mọi ánh nhìn bằng ngôn ngữ thiết kế uốn cong dạng tròn đầu kéo pháo của những năm 1950 đầy sôi động.\n\nLớp vỏ nhựa đúc dày dặn chống trầy xước, chiếc vô lăng kim loại sáng loáng cơ khí đi cùng bộ lốp cao su đặc dập nổi rãnh chống trượt mang lại sự vững chãi an tâm tối đa. Việc tối giản các nút bấm điện tử vô bổ, tập trung rèn luyện cho trẻ cảm nhận thăng bằng cơ thể chính là tuyên ngôn tinh thấu về sự tôn trọng trải nghiệm vận động thực tế lý thú của trẻ nhỏ.",
    specs: [
      { label: "Nhóm phong cách", value: "Mid-Century Streamline Americana" },
      { label: "Đặc tính an toàn", value: "Chống độc tố mài mòn hoàn toàn" },
      { label: "Trọng tải thiết kế", value: "Tải trọng lên tới 35kg" },
      { label: "Loại bánh", value: "Urethane lót cao su chống ồn" }
    ],
    views: 195,
    likes: 54,
    dateStr: "5 ngày trước"
  },
  {
    id: "lst_008",
    title: "Mỹ Học Sân Chơi Bắc Âu: Khi Sắc Pastel Xoa Dịu Tâm Hồn",
    category: "Art Objects",
    readTime: "4 Phút đọc",
    originalDate: "May 05, 2026",
    location: "Triết Lý Thiết Kế Trải Nghiệm",
    glassClass: "from-[#e8f5e9] to-[#c8e6c9] text-emerald-900 border-emerald-100/50",
    imageType: "toy_green",
    author: {
      name: "Ethan Wright",
      avatar: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&q=80&w=120",
      rating: 4.7,
      verified: false,
      role: "Ergonomics Consultant"
    },
    description: "Sự ra đời của các sân chơi mô phỏng dạng khối đất sét nặn mờ màu xanh lá rêu và bài học triết lý giáo dục trẻ em tôn trọng thiên nhiên.",
    content: "Thay thế cho những bộ xà đu kim loại sơn đỏ chói lọi truyền thống, triết lý Scandinavian đem đến tinh thần đối lập dịu mát lạ kỳ thông qua mẫu sân chơi cầu trượt uốn dẻo màu rêu nhạt. Cầu trượt mô phỏng một nhánh cỏ lướt nhẹ mềm mại, được chế tác từ nhựa sinh họcPLA bền vững sơn phủ màu nhám mịn lành tính.\n\nNghiên cứu chỉ ra rằng các gam màu dịu mát như xanh xám rêu (sage green), đất nung nhạt (ochre) giúp làm dịu nhịp tim trẻ, khuyến khích khả năng khám phá tĩnh lặng tự chủ sâu sắc hơn. Một sân chơi không ồn ào khoa trương chính là cách nuôi dưỡng tâm hồn trẻ chậm rãi, hòa mình vào lòng thiên nhiên bao dung kể từ những bước chân khám phá đầu đời.",
    specs: [
      { label: "Cảm hứng triết học", value: "Nordic Friluftsliv Design" },
      { label: "Vật liệu cốt tế", value: "Bioplastic Cornstarch Base" },
      { label: "Phân bổ màu", value: "Sage Green & Sand Chalk" },
      { label: "Kích thước mô phỏng", value: "Studio prototype 1:12" }
    ],
    views: 112,
    likes: 38,
    dateStr: "Hôm qua"
  }
];
