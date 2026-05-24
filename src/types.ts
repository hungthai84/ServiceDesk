export interface Author {
  name: string;
  avatar: string;
  rating: number; // Reader rating of author
  verified: boolean;
  role: string; // e.g., "Senior Design Editor", "Technology Reviewer"
}

export interface Specification {
  label: string;
  value: string;
}

export interface BlogPost {
  id: string;
  title: string;
  category: string;
  readTime: string; // e.g., "5 Mins Read" or "8 Mins Read" to replace "Price" in mockup
  originalDate?: string; // e.g., "May 20, 2026"
  location: string; // Replaced with "Design School" or "Topic Focus"
  glassClass: string; // Tailwind bg gradient style
  imageType: "chair_orange" | "camera" | "boots" | "chair_red" | "pyramid" | "house_prism" | "car_blue" | "toy_green";
  author: Author;
  description: string; // Short lead paragraph / abstract
  content: string; // Complete written article text
  specs: Specification[]; // Key aspects/topics of the blog article
  sponsored?: boolean; // Repurposed as "Editor's Pick" or "Premium"
  views: number;
  likes: number;
  dateStr: string; // Date of publication, e.g. "Vừa xong"
}

export interface Category {
  id: string;
  label: string;
  count: number;
  iconName: string;
  colorScheme: "sky" | "orange" | "blue" | "yellow" | "rose" | "indigo" | "teal" | "violet" | "emerald";
  translation?: string;
}

export interface AIBlogResult {
  title: string;
  processedContent: string;
  socialSnippet: string;
  keyTakeaways: string[];
}
