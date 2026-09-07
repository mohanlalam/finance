import { PortfolioService } from './domains/portfolio/services/portfolioService';
import { supabasePortfolioRepository } from './infrastructure/supabase/repositories/SupabasePortfolioRepository';
import { offlineOutboxService } from './domains/portfolio/services/offlineOutboxService';

/**
 * Composition Root
 * Handles dependency injection wiring between Domain Services and Infrastructure implementations.
 * Pure domain files in src/domains/ never import concrete infrastructure singletons directly.
 */
export const portfolioService = new PortfolioService(supabasePortfolioRepository);
offlineOutboxService.setPortfolioService(portfolioService);

export { PortfolioService };
