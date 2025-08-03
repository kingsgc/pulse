// AdMob Configuration for Android Test Ads
export const ADMOB_CONFIG = {
  // Official Google test app ID for Android
  androidAppId: 'ca-app-pub-3940256099942544~3347511713',
  iosAppId: '', // Not used for Android-only testing

  // Official Google test ad unit IDs for Android
  testBannerAdUnitId: 'ca-app-pub-3940256099942544/6300978111',
  testInterstitialAdUnitId: 'ca-app-pub-3940256099942544/1033173712',
  testRewardedAdUnitId: 'ca-app-pub-3940256099942544/5224354917',

  // For production, replace these with your real ad unit IDs
  bannerAdUnitId: 'ca-app-pub-3940256099942544/6300978111',
  interstitialAdUnitId: 'ca-app-pub-3940256099942544/1033173712',
  rewardedAdUnitId: 'ca-app-pub-3940256099942544/5224354917',

  // Always use test ads for now
  useTestAds: true,
};

export const getAdUnitId = (adType: 'banner' | 'interstitial' | 'rewarded') => {
  const testIds = {
    banner: ADMOB_CONFIG.testBannerAdUnitId,
    interstitial: ADMOB_CONFIG.testInterstitialAdUnitId,
    rewarded: ADMOB_CONFIG.testRewardedAdUnitId,
  };

  const productionIds = {
    banner: ADMOB_CONFIG.bannerAdUnitId,
    interstitial: ADMOB_CONFIG.interstitialAdUnitId,
    rewarded: ADMOB_CONFIG.rewardedAdUnitId,
  };

  return ADMOB_CONFIG.useTestAds ? testIds[adType] : productionIds[adType];
};

// Default export for Metro bundler
export default ADMOB_CONFIG; 