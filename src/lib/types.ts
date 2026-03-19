export type PostMode = "image" | "text";

export interface Post {
  id: string;
  mode: PostMode;
  question: string | null;
  option_a_text: string | null;
  option_b_text: string | null;
  option_a_image_url: string | null;
  option_b_image_url: string | null;
  created_at: string;
  expires_at: string;
  vote_count_a: number;
  vote_count_b: number;
  is_expired: boolean;
}

export interface Vote {
  id: string;
  post_id: string;
  choice: "a" | "b";
  voter_id: string;
  created_at: string;
}
