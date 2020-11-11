// trigger action comment 4
interface Tokenomics {
  circulating_supply?: number;
  total_supply?: number;
}

interface Asset {
  asset_id: string;
  exchanges_data: AssetExchangeData[];
  tokenomics: Tokenomics;
  market_cap_usd?: number;
  volume_24h_usd?: number;
}

interface AssetExchangeData {
  exchange: Exchange;
  quality_score?: 'green' | 'yellow' | 'red';
}

interface Exchange {
  coingecko_trust_score?: number;
}

interface Score {
  total_score: number;
  volume_score: number;
  real_liquidity_score: number;
  exchanges_score: number;
  supply_score: number;
  sentiment_score: number;
}

const exchangeQualityScoreMapping = {
  green: 2,
  yellow: 1,
  red: 0,
}

const SCORE_UNDEFINED = -1;

const getSlippage = (asset: Asset, usd: number) => Math.min(
  ...asset.exchanges_data
    .filter((el) => !!el[`slippage_${usd}USD`])
    .map((el) => el[`slippage_${usd}USD`] || 1));

export function calcScore(asset: Asset): Score {
  let volumeScore = SCORE_UNDEFINED;
  let liquidityScore = SCORE_UNDEFINED;
  let exchangesScore = SCORE_UNDEFINED;
  // @todo - to be implemented
  let socialScore = 5;
  let supplyScore = SCORE_UNDEFINED;

  // the volume score is defined by
  if (asset.market_cap_usd && asset.volume_24h_usd) {
    volumeScore = (asset.volume_24h_usd / asset.market_cap_usd) * 10;
  }

  if (asset.exchanges_data?.length > 0) {
    // calculate the exchange score according to the quality of exchanges a project is listed on
    asset.exchanges_data
      .filter(exchangeData => !!exchangeData.exchange.coingecko_trust_score)
      .forEach((exchangeData: AssetExchangeData) => {
        exchangesScore += exchangeData.exchange.coingecko_trust_score!;
      });
    exchangesScore = exchangesScore / asset.exchanges_data.length;

    // now lets calculate the liquidity score according to the slippage
    const slippage100000Usd = getSlippage(asset, 100000);
    liquidityScore = 10 - (slippage100000Usd || 1) * 10;
    if (liquidityScore < 0) {
      liquidityScore = 0;
    }
  }

  // the supply score is determined by comparing the circulating vs the total supply
  if (asset.tokenomics?.circulating_supply && asset.tokenomics?.total_supply) {
    supplyScore = (asset.tokenomics?.circulating_supply / asset.tokenomics?.total_supply) * 10;
  }

  const totalScore =
    (volumeScore +
    2 * liquidityScore +
    exchangesScore +
    supplyScore +
    2 * socialScore) / 7;

  return {
    total_score: totalScore,
    volume_score: volumeScore,
    real_liquidity_score: liquidityScore,
    exchanges_score: exchangesScore,
    supply_score: supplyScore,
    sentiment_score: socialScore,
  };
}
