export type PostMode = "image" | "text" | "music";

export interface Post {
  id: string;
  mode: PostMode;
  question: string | null;
  option_a_text: string | null;
  option_b_text: string | null;
  option_a_image_url: string | null;
  option_b_image_url: string | null;
  option_a_track_id: string | null;
  option_b_track_id: string | null;
  option_a_artist: string | null;
  option_b_artist: string | null;
  option_a_preview_url: string | null;
  option_b_preview_url: string | null;
  option_a_artwork_url: string | null;
  option_b_artwork_url: string | null;
  created_at: string;
  expires_at: string;
  vote_count_a: number;
  vote_count_b: number;
  is_expired: boolean;
  poster_choice: "a" | "b" | null;
  poster_id: string | null;
}

export interface Vote {
  id: string;
  post_id: string;
  choice: "a" | "b";
  voter_id: string;
  created_at: string;
}
