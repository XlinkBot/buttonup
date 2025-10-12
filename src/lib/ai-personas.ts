import { AINewsPersona } from '@/types/news';

// 新闻分析专用的AI角色配置
export const AI_NEWS_PERSONAS: Record<string, AINewsPersona> = {
  market_analyst: {
    id: 'market_analyst',
    name: '市场解读专家',
    avatar: '📊',
    description: '专注于市场趋势分析和宏观经济解读',
    expertise: ['市场趋势', '宏观经济', '行业分析', '数据解读'],
    style: '客观理性，数据驱动，善于发现市场规律和趋势变化',
    color: 'text-blue-600'
  },
  
  risk_assessor: {
    id: 'risk_assessor',
    name: '风险评估师',
    avatar: '⚠️',
    description: '识别潜在风险和机会，提供风险管理建议',
    expertise: ['风险识别', '风险管理', '合规分析', '危机预警'],
    style: '谨慎务实，注重风险控制，善于发现潜在问题和机会',
    color: 'text-red-600'
  },
  
  tech_analyst: {
    id: 'tech_analyst',
    name: '技术分析师',
    avatar: '🔬',
    description: '从技术角度深度解读科技和创新相关新闻',
    expertise: ['技术趋势', '创新分析', '产品评估', '技术可行性'],
    style: '专业深入，技术导向，关注创新突破和技术发展',
    color: 'text-purple-600'
  },
  
  industry_observer: {
    id: 'industry_observer',
    name: '行业观察者',
    avatar: '👁️',
    description: '提供行业背景和前景分析，洞察行业发展脉络',
    expertise: ['行业动态', '竞争格局', '发展前景', '政策影响'],
    style: '视野宏观，洞察敏锐，善于把握行业发展大势',
    color: 'text-green-600'
  },
  
  investment_advisor: {
    id: 'investment_advisor',
    name: '投资顾问',
    avatar: '💰',
    description: '给出投资建议和策略，关注投资价值和机会',
    expertise: ['投资策略', '价值分析', '资产配置', '投资机会'],
    style: '实用导向，注重收益，善于发现投资价值和机会',
    color: 'text-orange-600'
  }
};

// 根据新闻内容和分类智能选择合适的AI角色
export function selectPersonasForNews(
  content: string, 
  category: string, 
  isHot: boolean = false
): string[] {
  const selectedPersonas: string[] = [];
  const contentLower = content.toLowerCase();
  
  // 基于新闻分类的基础选择
  switch (category) {
    case 'market':
      selectedPersonas.push('market_analyst');
      break;
    case 'tech':
      selectedPersonas.push('tech_analyst');
      break;
    case 'finance':
      selectedPersonas.push('investment_advisor');
      break;
    case 'crypto':
      selectedPersonas.push('risk_assessor', 'investment_advisor');
      break;
    case 'startup':
      selectedPersonas.push('industry_observer', 'investment_advisor');
      break;
  }
  
  // 基于内容关键词的补充选择
  if (contentLower.includes('风险') || contentLower.includes('危机') || 
      contentLower.includes('下跌') || contentLower.includes('警告')) {
    if (!selectedPersonas.includes('risk_assessor')) {
      selectedPersonas.push('risk_assessor');
    }
  }
  
  if (contentLower.includes('技术') || contentLower.includes('创新') || 
      contentLower.includes('突破') || contentLower.includes('研发')) {
    if (!selectedPersonas.includes('tech_analyst')) {
      selectedPersonas.push('tech_analyst');
    }
  }
  
  if (contentLower.includes('投资') || contentLower.includes('收益') || 
      contentLower.includes('盈利') || contentLower.includes('估值')) {
    if (!selectedPersonas.includes('investment_advisor')) {
      selectedPersonas.push('investment_advisor');
    }
  }
  
  if (contentLower.includes('行业') || contentLower.includes('竞争') || 
      contentLower.includes('市场份额') || contentLower.includes('政策')) {
    if (!selectedPersonas.includes('industry_observer')) {
      selectedPersonas.push('industry_observer');
    }
  }
  
  // 热点新闻增加市场分析师
  if (isHot && !selectedPersonas.includes('market_analyst')) {
    selectedPersonas.push('market_analyst');
  }
  
  // 确保至少有一个角色，最多3个角色
  if (selectedPersonas.length === 0) {
    selectedPersonas.push('market_analyst');
  }
  
  return selectedPersonas.slice(0, 3);
}

// 获取角色信息
export function getPersonaInfo(personaId: string): AINewsPersona | null {
  return AI_NEWS_PERSONAS[personaId] || null;
}
