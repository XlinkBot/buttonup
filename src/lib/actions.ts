'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createPost, updatePostLikes, updateCommentLikes } from '@/lib/playground-db';
import { CreatePostData } from '@/types/playground';

// 创建新帖子的Server Action
export async function createPostAction(formData: FormData) {
  const content = formData.get('content') as string;
  const mentionsString = formData.get('mentions') as string;
  
  if (!content || content.trim().length === 0) {
    throw new Error('帖子内容不能为空');
  }

  if (content.length > 280) {
    throw new Error('帖子内容不能超过280个字符');
  }

  // 解析提及的股票代码
  const mentions = mentionsString ? JSON.parse(mentionsString) : [];
  
  try {
    const postData: CreatePostData = {
      content: content.trim(),
      mentions
    };

    const newPost = await createPost(postData);
    
    // 重新验证主页面缓存
    revalidatePath('/playground');
    
    // 触发AI评论生成（异步，不等待结果）
    if (mentions.length > 0) {
      // 调用AI评论生成API，但不等待结果
      fetch(`${process.env.NEXTJS_URL || 'http://localhost:3000'}/api/playground/discuss`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId: newPost.id,
          content: newPost.content,
          mentions: newPost.mentions,
        }),
      }).catch(error => {
        console.error('Failed to generate AI comments:', error);
      });
    }

    return { success: true, postId: newPost.id };
  } catch (error) {
    console.error('Failed to create post:', error);
    throw new Error('创建帖子失败，请稍后重试');
  }
}

// 帖子点赞的Server Action
export async function likePostAction(postId: string, currentlyLiked: boolean) {
  try {
    await updatePostLikes(postId, !currentlyLiked);
    
    // 重新验证相关页面缓存
    revalidatePath('/playground');
    revalidatePath(`/playground/post/${postId}`);
    
    return { success: true };
  } catch (error) {
    console.error('Failed to update post likes:', error);
    throw new Error('点赞操作失败，请稍后重试');
  }
}

// 评论点赞的Server Action
export async function likeCommentAction(commentId: string, postId: string, currentlyLiked: boolean) {
  try {
    await updateCommentLikes(commentId, !currentlyLiked);
    
    // 重新验证相关页面缓存
    revalidatePath('/playground');
    revalidatePath(`/playground/post/${postId}`);
    
    return { success: true };
  } catch (error) {
    console.error('Failed to update comment likes:', error);
    throw new Error('点赞操作失败，请稍后重试');
  }
}

// 重新验证页面的Server Action（用于手动刷新）
export async function revalidatePageAction(path: string) {
  try {
    revalidatePath(path);
    return { success: true };
  } catch (error) {
    console.error('Failed to revalidate page:', error);
    throw new Error('页面刷新失败');
  }
}
