import { NextRequest, NextResponse } from 'next/server';
import { Holding, CashAccount, AssetAccount } from '@/lib/types';

export const runtime = 'edge';

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Validate request
  const { messages, holdings, cashAccounts, assetAccounts } = await request.json();

  if (!messages || !Array.isArray(messages)) {
    return NextResponse.json({
      success: false,
      error: 'Invalid request: messages must be an array'
    }, { status: 400 });
  }

  if (!holdings || !Array.isArray(holdings)) {
    return NextResponse.json({
      success: false,
      error: 'Invalid request: holdings must be an array'
    }, { status: 400 });
  }

  console.log('AI Advisor Request:', {
    messageCount: messages.length,
    holdingsCount: holdings.length,
    cashAccountsCount: cashAccounts?.length || 0,
    assetAccountsCount: assetAccounts?.length || 0
  });

  // Import AI advisor functions
  const { getAIResponse, createChatMessage } = await import('@/lib/aiAdvisor');

  console.log('Processing AI request with portfolio data...');

  const aiResponse = await getAIResponse(messages, holdings, cashAccounts, assetAccounts);

  console.log('AI Response:', {
    success: aiResponse.success,
    message: aiResponse.message || '',
    error: aiResponse.error || ''
  });

  // Map to Next.js response format
  const nextResponse = NextResponse.json({
    success: aiResponse.success,
    message: aiResponse.message || '',
    data: aiResponse.success ? {
      message: aiResponse.message,
      cashAccounts: cashAccounts || [],
      assetAccounts: assetAccounts || []
    } : undefined
  });

  return nextResponse;
}