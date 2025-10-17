import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse, AuthToken } from '@/types/stock';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { grantType, clientId, clientSecret, refreshToken } = body;

    if (!grantType) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'MISSING_GRANT_TYPE', message: 'grantType parameter is required' },
          timestamp: Date.now(),
        } as ApiResponse<null>,
        { status: 400 }
      );
    }

    // Mock token generation (in production, validate credentials properly)
    if (grantType === 'client_credentials' && clientId && clientSecret) {
      const token: AuthToken = {
        access_token: `token_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'stock-analysis',
      };

      return NextResponse.json(
        { success: true, data: token, timestamp: Date.now() } as ApiResponse<AuthToken>,
        { status: 200 }
      );
    }

    if (grantType === 'refresh_token' && refreshToken) {
      const token: AuthToken = {
        access_token: `token_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: `refresh_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        scope: 'stock-analysis',
      };

      return NextResponse.json(
        { success: true, data: token, timestamp: Date.now() } as ApiResponse<AuthToken>,
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: { code: 'INVALID_GRANT', message: 'Invalid grant type or missing credentials' },
        timestamp: Date.now(),
      } as ApiResponse<null>,
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in auth endpoint:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'AUTH_ERROR',
          message: error instanceof Error ? error.message : 'Authentication failed',
        },
        timestamp: Date.now(),
      } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
