"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Heart, MessageSquare, CornerDownRight, ShieldCheck, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabaseClient } from "@/lib/supabaseClient";

interface Reply {
  id: string;
  content: string;
  isAdmin: boolean;
  createdAt: string;
  user: {
    name: string;
    role: string;
  };
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  customer: {
    id: string;
    name: string;
    role: string;
  };
  replies: Reply[];
}

interface BlogInteractionProps {
  postId: string;
  slug: string;
}

export default function BlogInteraction({ postId, slug }: BlogInteractionProps) {
  const { data: session } = useSession();
  const currentCustomerId = (session?.user as any)?.id;

  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentContent, setCommentContent] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

  // Fetch likes data
  useEffect(() => {
    fetchLikes();
    fetchComments();
  }, [slug, currentCustomerId]);

  // Real-time reply listener
  useEffect(() => {
    if (!currentCustomerId) return;

    const channel = supabaseClient
      .channel("new-replies-toast")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "blog_replies",
        },
        async (payload) => {
          const newReply = payload.new;
          if (!newReply || !newReply.commentId) return;

          // Check if this reply is to a comment owned by the current customer
          try {
            const checkRes = await fetch(`/api/blog/comments/${newReply.commentId}`);
            if (checkRes.ok) {
              const commentData = await checkRes.json();
              // Trigger notification if comment belongs to current user, and the replier isn't the current user
              if (commentData.customerId === currentCustomerId && newReply.userId !== currentCustomerId) {
                const title = newReply.isAdmin ? "Quản trị viên" : "Ai đó";
                toast.success(`👋 ${title} đã phản hồi bình luận của bạn: "${newReply.content}"`, {
                  duration: 6000,
                });
                
                // Refresh comments to show the new reply
                fetchComments();
              }
            }
          } catch (err) {
            console.error("Error checking reply ownership:", err);
          }
        }
      )
      .subscribe();

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [currentCustomerId]);

  const fetchLikes = async () => {
    try {
      const res = await fetch(`/api/blog/${slug}/like`);
      if (res.ok) {
        const data = await res.json();
        setLikesCount(data.likesCount);
        setLiked(data.liked);
      }
    } catch (err) {
      console.error("Error fetching likes:", err);
    }
  };

  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const res = await fetch(`/api/blog/${slug}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (err) {
      console.error("Error fetching comments:", err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleLikeToggle = async () => {
    if (!session?.user) {
      toast.error("Vui lòng đăng nhập để thích bài viết này!");
      return;
    }

    // Optimistic update
    setLiked(!liked);
    setLikesCount((prev) => (liked ? prev - 1 : prev + 1));

    try {
      const res = await fetch(`/api/blog/${slug}/like`, { method: "POST" });
      if (!res.ok) {
        // Rollback
        setLiked(liked);
        setLikesCount((prev) => (liked ? prev + 1 : prev - 1));
        toast.error("Lỗi khi tương tác");
      }
    } catch {
      // Rollback
      setLiked(liked);
      setLikesCount((prev) => (liked ? prev + 1 : prev - 1));
      toast.error("Lỗi kết nối");
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) {
      toast.error("Vui lòng đăng nhập để bình luận!");
      return;
    }
    if (!commentContent.trim()) return;

    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/blog/${slug}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: commentContent }),
      });

      if (res.ok) {
        toast.success("Đăng bình luận thành công!");
        setCommentContent("");
        fetchComments();
      } else {
        const data = await res.json();
        toast.error(data.error || "Gửi bình luận thất bại");
      }
    } catch {
      toast.error("Lỗi kết nối");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleReplySubmit = async (commentId: string) => {
    if (!session?.user) {
      toast.error("Vui lòng đăng nhập để phản hồi!");
      return;
    }
    if (!replyContent.trim()) return;

    setSubmittingReply(true);
    try {
      const res = await fetch(`/api/blog/comments/${commentId}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyContent }),
      });

      if (res.ok) {
        toast.success("Gửi phản hồi thành công!");
        setReplyContent("");
        setActiveReplyId(null);
        fetchComments();
      } else {
        const data = await res.json();
        toast.error(data.error || "Gửi phản hồi thất bại");
      }
    } catch {
      toast.error("Lỗi kết nối");
    } finally {
      setSubmittingReply(false);
    }
  };

  return (
    <div className="space-y-8 mt-12 pt-8 border-t border-gray-100">
      {/* Likes count & action */}
      <div className="flex items-center gap-6">
        <button
          onClick={handleLikeToggle}
          className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all hover:scale-105 active:scale-95 ${
            liked
              ? "bg-red-50 border-red-200 text-red-600 font-semibold"
              : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          <Heart className={`w-5 h-5 ${liked ? "fill-current" : ""}`} />
          <span>{likesCount} Yêu thích</span>
        </button>

        <div className="flex items-center gap-1.5 text-gray-500 text-sm">
          <MessageSquare className="w-4.5 h-4.5" />
          <span>{comments.length} Bình luận</span>
        </div>
      </div>

      {/* Writing a comment */}
      <div className="bg-gray-50/50 border border-gray-100 rounded-2xl p-5 space-y-4">
        <h3 className="font-bold text-gray-800 text-base">Bình luận bài viết</h3>
        {session?.user ? (
          <form onSubmit={handleCommentSubmit} className="space-y-3">
            <textarea
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              placeholder="Chia sẻ cảm nghĩ của bạn về bài viết này..."
              required
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-1 focus:ring-[#425733] focus:border-[#425733] focus:outline-none bg-white text-sm transition-all"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submittingComment || !commentContent.trim()}
                className="flex items-center gap-2 bg-[#425733] text-white px-5 py-2 rounded-full text-xs font-semibold hover:bg-[#364a29] transition-all disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {submittingComment ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                Gửi bình luận
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center py-4 bg-white rounded-xl border border-gray-100 shadow-sm">
            <p className="text-sm text-gray-500 mb-3">Vui lòng đăng nhập để gửi bình luận và tương tác!</p>
            <Link
              href="/auth/login"
              className="inline-block bg-[#425733] text-white px-6 py-2 rounded-full text-xs font-semibold hover:bg-[#364a29] transition-all"
            >
              Đăng nhập ngay
            </Link>
          </div>
        )}
      </div>

      {/* Comments List */}
      <div className="space-y-6">
        <h4 className="font-bold text-gray-800 text-sm tracking-wide uppercase border-b pb-2">
          Ý kiến bạn đọc ({comments.length})
        </h4>

        {loadingComments && comments.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-gray-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Đang tải bình luận...</span>
          </div>
        ) : comments.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Hãy là người đầu tiên bình luận cho bài viết này!</p>
        ) : (
          <div className="space-y-6 divide-y divide-gray-50">
            {comments.map((comment) => (
              <div key={comment.id} className="pt-5 first:pt-0 space-y-3">
                {/* Parent Comment */}
                <div className="flex gap-3">
                  {/* Avatar fallback */}
                  <div className="w-8.5 h-8.5 rounded-full bg-emerald-50 text-[#425733] font-bold flex items-center justify-center text-sm shrink-0 shadow-sm border border-emerald-100">
                    {comment.customer?.name ? comment.customer.name.slice(0, 1).toUpperCase() : "?"}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-gray-800">{comment.customer?.name}</span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(comment.createdAt).toLocaleDateString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{comment.content}</p>

                    {/* Interaction Buttons */}
                    {session?.user && (
                      <div className="flex items-center gap-3 pt-1">
                        <button
                          onClick={() => {
                            if (activeReplyId === comment.id) {
                              setActiveReplyId(null);
                            } else {
                              setActiveReplyId(comment.id);
                              setReplyContent("");
                            }
                          }}
                          className="text-[11px] text-[#425733] font-semibold hover:underline"
                        >
                          Phản hồi
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Nested Replies list */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="pl-11 space-y-4 pt-1">
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="flex gap-2.5 items-start bg-gray-50/50 p-3 rounded-2xl border border-gray-50">
                        <CornerDownRight className="w-4 h-4 text-gray-300 mt-1 shrink-0" />
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-xs text-gray-800">{reply.user?.name}</span>
                            {reply.isAdmin && (
                              <span className="inline-flex items-center gap-0.5 text-[8.5px] bg-[#e3ebdd] text-[#425733] font-bold px-1.5 py-0.5 rounded-full border border-[#c2d6b0]">
                                <ShieldCheck className="w-2.5 h-2.5" /> Quản trị viên
                              </span>
                            )}
                            <span className="text-[9px] text-gray-400">
                              {new Date(reply.createdAt).toLocaleDateString("vi-VN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 leading-relaxed">{reply.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Inline Reply Input */}
                {activeReplyId === comment.id && (
                  <div className="pl-11 flex gap-2 pt-1">
                    <input
                      type="text"
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder={`Phản hồi bình luận của ${comment.customer?.name}...`}
                      className="flex-1 px-4 py-2 border rounded-full text-xs focus:ring-1 focus:ring-[#425733] focus:border-[#425733] focus:outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => handleReplySubmit(comment.id)}
                      disabled={submittingReply || !replyContent.trim()}
                      className="px-4 py-2 bg-[#425733] text-white rounded-full text-xs font-semibold hover:bg-[#364a29] transition-all disabled:bg-gray-300 disabled:cursor-not-allowed shrink-0"
                    >
                      {submittingReply ? "Đang gửi..." : "Gửi"}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
