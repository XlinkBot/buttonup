export interface Post {
  id: string;
  content: string;
  mentions: string[];
  likes: number;
  created_at: string;
  updated_at: string;
  comment_count?: number;
}

export interface Comment {
  id: string;
  post_id: string;
  persona: 'bull' | 'bear' | 'technical' | 'value' | 'growth';
  name: string;
  avatar: string;
  content: string;
  likes: number;
  created_at: string;
  updated_at: string;
}

export interface PostWithComments extends Post {
  comments: Comment[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface CreatePostData {
  content: string;
  mentions: string[];
}

export interface CreateCommentData {
  post_id: string;
  persona: Comment['persona'];
  name: string;
  avatar: string;
  content: string;
}

// AI Persona 类型定义
export interface AIPersona {
  name: string;
  avatar: string;
  personality: string;
  style: string;
}

export const AI_PERSONAS: Record<Comment['persona'], AIPersona> = {
  bull: {
    name: '乐观派投资者',
    avatar: '🐂',
    personality: '我是一个乐观的投资者，总是能从股票中看到积极的一面。我相信长期投资的价值，喜欢分析公司的基本面和增长潜力。',
    style: '积极乐观，注重基本面分析，长期投资视角'
  },
  bear: {
    name: '谨慎派分析师',
    avatar: '🐻',
    personality: '我是一个谨慎的分析师，习惯从风险角度分析股票。我会仔细研究财务数据，关注潜在的风险因素和市场不确定性。',
    style: '谨慎保守，风险导向，注重财务分析'
  },
  technical: {
    name: '技术分析专家',
    avatar: '📈',
    personality: '我是技术分析专家，主要通过图表、趋势线、技术指标来分析股票走势。我相信价格行为包含了所有信息。',
    style: '技术导向，关注图表模式，短中期交易视角'
  },
  value: {
    name: '价值投资者',
    avatar: '💎',
    personality: '我是价值投资的信徒，寻找被市场低估的优质公司。我关注内在价值，喜欢以合理价格买入优秀企业。',
    style: '价值导向，注重估值，长期持有策略'
  },
  growth: {
    name: '成长股猎手',
    avatar: '🚀',
    personality: '我专注于寻找高成长潜力的股票，特别关注新兴行业和创新公司。我愿意为未来的增长支付合理的溢价。',
    style: '成长导向，关注创新，高风险高收益'
  }
};
