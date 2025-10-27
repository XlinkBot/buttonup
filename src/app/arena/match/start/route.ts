import { NextResponse } from 'next/server';

interface StartMatchBody {
  playerName: string;
  stockPool: string[];
  buyThreshold: number;
  sellThreshold: number;
  positionSize: number;
  maxShares: number;
  signalSensitivity: number;
  rsiBuyThreshold: number;
  rsiSellThreshold: number;
  isRandomTrade: boolean;
  reasoning: string;
}

// 开始匹配：要求策略配置，然后直接创建session
export async function POST(request: NextRequest) {
  try {
    const body: StartMatchBody = await request.json();

    // 验证策略配置
    if (!body.playerName || !body.stockPool || body.stockPool.length === 0) {
      return NextResponse.json(
        { success: false, error: '策略配置不完整' },
        { status: 400 }
      );
    }

    // 创建用户ID和用户配置
    const userId = `user_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // 创建房间并开始匹配
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/arena/match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        userName: body.playerName,
        roomId: null, // 创建新房间
        userStrategyConfig: body
      }),
    });

    const result = await response.json();

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    // 返回session ID，直接跳转到对战页面
    return NextResponse.json({
      success: true,
      data: {
        sessionId: result.data.sessionId,
      },
    });
  } catch (error) {
    console.error('开始匹配失败:', error);
    return NextResponse.json(
      { success: false, error: '开始匹配失败' },
      { status: 500 }
    );
  }
}

