import { supabaseAdmin } from '@/lib/supabase';
import type { Portfolio } from '@/types/arena';

// 更新玩家Portfolio
export async function updatePlayerPortfolio(playerId: string, portfolio: Portfolio[]): Promise<void> {
  if (!supabaseAdmin) throw new Error('Supabase not configured');

  // 先删除现有portfolio
  const { error: deleteError } = await supabaseAdmin
    .from('portfolio')
    .delete()
    .eq('player_id', playerId);

  if (deleteError) throw deleteError;

  // 如果有新的portfolio数据，插入它们
  if (portfolio.length > 0) {
    const { error: insertError } = await supabaseAdmin
      .from('portfolio')
      .insert(
        portfolio.map(p => ({
          player_id: playerId,
          symbol: p.symbol,
          stock_name: p.stockName,
          quantity: p.quantity,
          cost_price: p.costPrice,
        }))
      );

    if (insertError) throw insertError;
  }
}

// 更新玩家现金余额
export async function updatePlayerCash(playerId: string, cash: number): Promise<void> {
  if (!supabaseAdmin) throw new Error('Supabase not configured');

  const { error } = await supabaseAdmin
    .from('players')
    .update({ 
      cash,
      last_update_time: Date.now(),
    })
    .eq('id', playerId);

  if (error) throw error;
}

// 批量更新玩家现金
export async function batchUpdatePlayerCash(updates: Array<{ playerId: string; cash: number }>): Promise<void> {
  if (!supabaseAdmin) throw new Error('Supabase not configured');
  if (updates.length === 0) return;

  const currentTime = Date.now();
  
  // 并行更新所有玩家的现金
  await Promise.all(
    updates.map(update =>
      supabaseAdmin!
        .from('players')
        .update({ 
          cash: update.cash,
          last_update_time: currentTime,
        })
        .eq('id', update.playerId)
    )
  );
}