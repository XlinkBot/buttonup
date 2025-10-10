import { NextRequest, NextResponse } from 'next/server';
import { deepseek } from '@ai-sdk/deepseek';
import { generateText } from 'ai';
import { createComments } from '@/lib/playground-db';
import { AI_PERSONAS, CreateCommentData } from '@/types/playground';

// 自动选择评论员的逻辑 - 支持生成更多评论
function selectPersonas(content: string, mentions: string[]): string[] {
  const availablePersonas = Object.keys(AI_PERSONAS);
  const selectedPersonas: string[] = [];
  
  // 基于内容关键词智能选择评论员
  const contentLower = content.toLowerCase();
  
  // 如果提到技术分析相关词汇，优先选择技术分析专家
  if (contentLower.includes('技术') || contentLower.includes('图表') || contentLower.includes('趋势') || 
      contentLower.includes('阻力') || contentLower.includes('支撑') || contentLower.includes('突破')) {
    selectedPersonas.push('technical');
  }
  
  // 如果提到估值、价值相关词汇，选择价值投资者
  if (contentLower.includes('估值') || contentLower.includes('价值') || contentLower.includes('便宜') || 
      contentLower.includes('低估') || contentLower.includes('pe') || contentLower.includes('市盈率')) {
    selectedPersonas.push('value');
  }
  
  // 如果提到成长、创新相关词汇，选择成长股猎手
  if (contentLower.includes('成长') || contentLower.includes('创新') || contentLower.includes('未来') || 
      contentLower.includes('潜力') || contentLower.includes('新兴') || contentLower.includes('科技')) {
    selectedPersonas.push('growth');
  }
  
  // 如果提到风险、谨慎相关词汇，选择谨慎派分析师
  if (contentLower.includes('风险') || contentLower.includes('谨慎') || contentLower.includes('担心') || 
      contentLower.includes('下跌') || contentLower.includes('危险') || contentLower.includes('泡沫')) {
    selectedPersonas.push('bear');
  }
  
  // 如果提到看好、乐观相关词汇，选择乐观派投资者
  if (contentLower.includes('看好') || contentLower.includes('乐观') || contentLower.includes('上涨') || 
      contentLower.includes('买入') || contentLower.includes('机会') || contentLower.includes('利好')) {
    selectedPersonas.push('bull');
  }
  
  // 去重
  const uniquePersonas = [...new Set(selectedPersonas)];
  
  // 确保每个帖子都有足够的评论（5-10条）
  const targetCommentCount = Math.floor(Math.random() * 6) + 5; // 5-10条评论
  
  // 如果选中的角色不够，随机添加更多角色
  const remaining = availablePersonas.filter(p => !uniquePersonas.includes(p));
  const shuffled = remaining.sort(() => 0.5 - Math.random());
  
  // 添加剩余角色直到达到目标数量
  while (uniquePersonas.length < targetCommentCount && shuffled.length > 0) {
    uniquePersonas.push(shuffled.pop()!);
  }
  
  // 如果还不够，重复添加角色（模拟同一角色的多次评论）
  while (uniquePersonas.length < targetCommentCount) {
    const randomPersona = availablePersonas[Math.floor(Math.random() * availablePersonas.length)];
    uniquePersonas.push(randomPersona);
  }
  
  return uniquePersonas.slice(0, targetCommentCount);
}

export async function POST(request: NextRequest) {
  try {
    const { postId, content, mentions } = await request.json();
    
    if (!postId || !content) {
      return NextResponse.json(
        { error: 'Missing required parameters: postId and content' },
        { status: 400 }
      );
    }
    
    // 自动选择评论员
    const personas = selectPersonas(content, mentions || []);

    const commentsToCreate: CreateCommentData[] = [];
    
    // 获取提及的股票信息
    const stockInfo = [];
    for (const mention of mentions || []) {
      try {
        const response = await fetch(`${process.env.NEXTJS_URL || 'http://localhost:3000'}/api/stock/${mention}`);
        if (response.ok) {
          const data = await response.json();
          stockInfo.push(data);
        }
      } catch (error) {
        console.log(`Failed to fetch stock info for ${mention}:`, error);
      }
    }

    // 为每个选中的角色生成评论内容
    for (let i = 0; i < personas.length; i++) {
      const personaKey = personas[i];
      const persona = AI_PERSONAS[personaKey as keyof typeof AI_PERSONAS];
      if (!persona) continue;

      // 为同一角色的多次评论添加变化
      const commentIndex = personas.slice(0, i + 1).filter(p => p === personaKey).length;
      const isFollowUp = commentIndex > 1;

      let prompt = `
你是${persona.name}（${persona.avatar}），${persona.personality}

用户发了一条帖子："${content}"

`;

      // 如果有股票提及，添加股票信息
      if (stockInfo.length > 0) {
        prompt += `帖子中提及了以下股票：\n`;
        stockInfo.forEach(stock => {
          prompt += `
- ${stock.symbol}: ${stock.quote?.longName || stock.quote?.shortName}
  当前价格: $${stock.quote?.regularMarketPrice || 'N/A'}
  涨跌幅: ${stock.quote?.regularMarketChangePercent?.toFixed(2) || 'N/A'}%
  市值: $${stock.quote?.marketCap ? (stock.quote.marketCap / 1e9).toFixed(2) + 'B' : 'N/A'}
  P/E比率: ${stock.quote?.trailingPE?.toFixed(2) || 'N/A'}
`;
        });
      }

      if (isFollowUp) {
        prompt += `
请以${persona.style}的风格对这条帖子进行补充评论（这是你的第${commentIndex}次评论）。
要求：
1. 用中文回复
2. 保持你的角色特点和投资风格
3. 字数控制在60-120字之间
4. 提供不同角度的分析或补充观点
5. 语气要像社交媒体评论，简洁有力
6. 避免重复之前的观点，提供新的见解
`;
      } else {
        prompt += `
请以${persona.style}的风格对这条帖子进行评论。
要求：
1. 用中文回复
2. 保持你的角色特点和投资风格
3. 字数控制在80-150字之间
4. 语气要像社交媒体评论，简洁有力
5. 可以表达不同观点，但要有理有据
`;
      }

      try {
        const result = await generateText({
          model: deepseek('deepseek-chat'),
          prompt,
          temperature: 0.8,
        });

        commentsToCreate.push({
          post_id: postId,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          persona: personaKey as any,
          name: persona.name,
          avatar: persona.avatar,
          content: result.text,
        });
      } catch (error) {
        console.error(`Failed to generate comment for ${personaKey}:`, error);
      }
    }

    // 批量创建评论到数据库
    if (commentsToCreate.length > 0) {
      try {
        const createdComments = await createComments(commentsToCreate);
        
        return NextResponse.json({
          success: true,
          comments: createdComments,
          mentions,
          stockInfo
        });
      } catch (dbError) {
        console.error('Failed to save comments to database:', dbError);
        return NextResponse.json(
          { error: 'Failed to save comments to database' },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json({
        success: false,
        error: 'No comments were generated',
        comments: [],
        mentions,
        stockInfo
      });
    }

  } catch (error) {
    console.error('Error generating AI discussion:', error);
    return NextResponse.json(
      { error: 'Failed to generate discussion' },
      { status: 500 }
    );
  }
}
