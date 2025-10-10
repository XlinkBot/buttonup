import { supabaseAdmin } from './supabase';
import { Post, Comment, PostWithComments, PaginatedResponse, CreatePostData, CreateCommentData } from '@/types/playground';

// 获取帖子列表（分页）
export async function getPosts(page: number = 1, limit: number = 20): Promise<PaginatedResponse<Post>> {
  if (!supabaseAdmin) {
    throw new Error('Supabase is not configured');
  }

  const offset = (page - 1) * limit;

  // 获取帖子和评论数量
  const { data: postsData, error: postsError } = await supabaseAdmin
    .from('posts')
    .select(`
      id,
      content,
      mentions,
      likes,
      created_at,
      updated_at,
      comments:comments(count)
    `)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (postsError) {
    throw new Error(`Failed to fetch posts: ${postsError.message}`);
  }

  // 获取总数
  const { count, error: countError } = await supabaseAdmin
    .from('posts')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    throw new Error(`Failed to count posts: ${countError.message}`);
  }

  const posts: Post[] = postsData.map(post => ({
    ...post,
    comment_count: Array.isArray(post.comments) ? post.comments[0]?.count || 0 : 0,
    comments: undefined
  }));

  return {
    data: posts,
    total: count || 0,
    page,
    limit,
    hasMore: (count || 0) > offset + limit
  };
}

// 获取单个帖子及其评论
export async function getPostWithComments(
  postId: string, 
  commentPage: number = 1, 
  commentLimit: number = 10
): Promise<PostWithComments | null> {
  if (!supabaseAdmin) {
    throw new Error('Supabase is not configured');
  }

  // 获取帖子信息
  const { data: postData, error: postError } = await supabaseAdmin
    .from('posts')
    .select('*')
    .eq('id', postId)
    .single();

  if (postError || !postData) {
    return null;
  }

  // 获取评论（分页）
  const commentOffset = (commentPage - 1) * commentLimit;
  const { data: commentsData, error: commentsError } = await supabaseAdmin
    .from('comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })
    .range(commentOffset, commentOffset + commentLimit - 1);

  if (commentsError) {
    throw new Error(`Failed to fetch comments: ${commentsError.message}`);
  }

  return {
    ...postData,
    comments: commentsData || []
  };
}

// 创建新帖子
export async function createPost(data: CreatePostData): Promise<Post> {
  if (!supabaseAdmin) {
    throw new Error('Supabase is not configured');
  }

  const { data: postData, error } = await supabaseAdmin
    .from('posts')
    .insert({
      content: data.content,
      mentions: data.mentions
    })
    .select()
    .single();

  if (error || !postData) {
    throw new Error(`Failed to create post: ${error?.message || 'Unknown error'}`);
  }

  return postData;
}

// 创建评论
export async function createComment(data: CreateCommentData): Promise<Comment> {
  if (!supabaseAdmin) {
    throw new Error('Supabase is not configured');
  }

  const { data: commentData, error } = await supabaseAdmin
    .from('comments')
    .insert(data)
    .select()
    .single();

  if (error || !commentData) {
    throw new Error(`Failed to create comment: ${error?.message || 'Unknown error'}`);
  }

  return commentData;
}

// 批量创建评论
export async function createComments(comments: CreateCommentData[]): Promise<Comment[]> {
  if (!supabaseAdmin) {
    throw new Error('Supabase is not configured');
  }

  const { data: commentsData, error } = await supabaseAdmin
    .from('comments')
    .insert(comments)
    .select();

  if (error || !commentsData) {
    throw new Error(`Failed to create comments: ${error?.message || 'Unknown error'}`);
  }

  return commentsData;
}

// 更新帖子点赞数
export async function updatePostLikes(postId: string, increment: boolean = true): Promise<void> {
  if (!supabaseAdmin) {
    throw new Error('Supabase is not configured');
  }

  const { error } = await supabaseAdmin.rpc('update_post_likes', {
    post_id: postId,
    increment_value: increment ? 1 : -1
  });

  if (error) {
    // 如果函数不存在，使用常规更新方式
    const { data: currentPost, error: fetchError } = await supabaseAdmin
      .from('posts')
      .select('likes')
      .eq('id', postId)
      .single();

    if (fetchError || !currentPost) {
      throw new Error(`Failed to fetch post for like update: ${fetchError?.message || 'Post not found'}`);
    }

    const newLikes = Math.max(0, currentPost.likes + (increment ? 1 : -1));
    
    const { error: updateError } = await supabaseAdmin
      .from('posts')
      .update({ likes: newLikes })
      .eq('id', postId);

    if (updateError) {
      throw new Error(`Failed to update post likes: ${updateError.message}`);
    }
  }
}

// 更新评论点赞数
export async function updateCommentLikes(commentId: string, increment: boolean = true): Promise<void> {
  if (!supabaseAdmin) {
    throw new Error('Supabase is not configured');
  }

  const { error } = await supabaseAdmin.rpc('update_comment_likes', {
    comment_id: commentId,
    increment_value: increment ? 1 : -1
  });

  if (error) {
    // 如果函数不存在，使用常规更新方式
    const { data: currentComment, error: fetchError } = await supabaseAdmin
      .from('comments')
      .select('likes')
      .eq('id', commentId)
      .single();

    if (fetchError || !currentComment) {
      throw new Error(`Failed to fetch comment for like update: ${fetchError?.message || 'Comment not found'}`);
    }

    const newLikes = Math.max(0, currentComment.likes + (increment ? 1 : -1));
    
    const { error: updateError } = await supabaseAdmin
      .from('comments')
      .update({ likes: newLikes })
      .eq('id', commentId);

    if (updateError) {
      throw new Error(`Failed to update comment likes: ${updateError.message}`);
    }
  }
}

// 获取评论数量
export async function getCommentsCount(postId: string): Promise<number> {
  if (!supabaseAdmin) {
    throw new Error('Supabase is not configured');
  }

  const { count, error } = await supabaseAdmin
    .from('comments')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', postId);

  if (error) {
    throw new Error(`Failed to count comments: ${error.message}`);
  }

  return count || 0;
}

// 检查帖子是否存在
export async function postExists(postId: string): Promise<boolean> {
  if (!supabaseAdmin) {
    throw new Error('Supabase is not configured');
  }

  const { data, error } = await supabaseAdmin
    .from('posts')
    .select('id')
    .eq('id', postId)
    .single();

  return !error && !!data;
}
