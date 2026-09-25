export interface LinkedProfile {
  platform?: string;
  username?: string;
  handle?: string;
  url?: string;
  followers?: number;
  follower_count?: number;
  engagement_rate?: number;
  avatar_url?: string;
}

export interface Creator {
  id?: string;
  creator_id?: string;
  name?: string;
  full_name?: string;
  display_name?: string;
  username?: string;
  handle?: string;
  platform?: string;
  avatar_url?: string;
  profile_pic_url?: string;
  avatar?: string;
  picture_url?: string;
  image_url?: string;
  followers?: number;
  follower_count?: number;
  followers_count?: number;
  following?: number;
  following_count?: number;
  engagement_rate?: number;
  engagement?: number;
  avg_engagement?: number;
  bio?: string;
  biography?: string;
  description?: string;
  verified?: boolean;
  is_verified?: boolean;
  category?: string;
  location?: string;
  country?: string;
  posts_count?: number;
  media_count?: number;
  profiles?: LinkedProfile[];
  linked_profiles?: LinkedProfile[];
  [key: string]: any;
}

export interface Post {
  id?: string;
  post_id?: string;
  shortcode?: string;
  caption?: string;
  text?: string;
  thumbnail_url?: string;
  media_url?: string;
  image_url?: string;
  display_url?: string;
  video_url?: string;
  is_video?: boolean;
  media_type?: string;
  likes?: number;
  like_count?: number;
  likes_count?: number;
  comments?: number;
  comment_count?: number;
  comments_count?: number;
  views?: number;
  view_count?: number;
  engagement_rate?: number;
  posted_at?: string;
  timestamp?: string;
  taken_at?: string;
  url?: string;
  permalink?: string;
  [key: string]: any;
}

export interface MatchDecision {
  creator_id?: string;
  username?: string;
  handle?: string;
  platform?: string;
  name?: string;
  score?: number;
  fit_score?: number;
  match_score?: number;
  decision?: "good" | "neutral" | "avoid" | string;
  status?: string;
  recommendation?: string;
  reasons?: string[] | string;
  reason?: string;
  explanation?: string;
  fit_reasons?: string[];
  pros?: string[];
  cons?: string[];
  notes?: string;
  [key: string]: any;
}

export interface ApiResponse<T> {
  data: T;
  source: string;
  fetched_at: string;
}

export interface ApiError {
  error: string;
}
