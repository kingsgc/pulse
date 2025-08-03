# AdMob Setup Guide

## What's Been Done ✅

1. **AdMob Package Installed**: `expo-ads-admob` is installed in your project
2. **Configuration Files Created**:
   - `app/admob-config.ts` - Centralized ad configuration
   - `app/components/BannerAd.tsx` - Reusable banner ad component
   - `app/components/InterstitialAd.tsx` - Full-screen ad component
   - `app/components/RewardedAd.tsx` - Reward-based ad component
   - `app/hooks/useAdManager.ts` - Ad management hook
3. **App Integration**: Ads are integrated into your main app screens

## Next Steps to Complete Setup 🚀

### 1. **Get Your AdMob App IDs**

1. Go to [AdMob Console](https://admob.google.com/)
2. Create a new app or select existing app
3. Get your app IDs:
   - **Android App ID**: `ca-app-pub-xxxxxxxxxxxxxxxx~yyyyyyyyyy`
   - **iOS App ID**: `ca-app-pub-xxxxxxxxxxxxxxxx~yyyyyyyyyy`

### 2. **Update Configuration Files**

**Update `app.json`:**
```json
{
  "expo": {
    "plugins": [
      [
        "expo-ads-admob",
        {
          "androidAppId": "YOUR_ANDROID_APP_ID",
          "iosAppId": "YOUR_IOS_APP_ID",
          "userTrackingPermission": "This identifier will be used to deliver personalized ads to you."
        }
      ]
    ]
  }
}
```

**Update `app/admob-config.ts`:**
```typescript
export const ADMOB_CONFIG = {
  // Replace with your actual AdMob app IDs
  androidAppId: 'YOUR_ANDROID_APP_ID',
  iosAppId: 'YOUR_IOS_APP_ID',
  
  // Replace with your actual ad unit IDs
  bannerAdUnitId: 'ca-app-pub-xxxxxxxxxxxxxxxx/yyyyyyyyyy',
  interstitialAdUnitId: 'ca-app-pub-xxxxxxxxxxxxxxxx/yyyyyyyyyy',
  rewardedAdUnitId: 'ca-app-pub-xxxxxxxxxxxxxxxx/yyyyyyyyyy',
  
  // Keep test ads for development
  useTestAds: __DEV__,
};
```

### 3. **Create Ad Units in AdMob**

1. In AdMob Console, go to your app
2. Create new ad units:
   - **Banner Ad Unit**: For banner ads
   - **Interstitial Ad Unit**: For full-screen ads
   - **Rewarded Ad Unit**: For reward-based ads
3. Copy the ad unit IDs and update `admob-config.ts`

### 4. **Test Your Implementation**

```bash
# Start your development server
npx expo start

# Test on device/simulator
npx expo run:android
# or
npx expo run:ios
```

### 5. **Ad Placement Strategy**

**Current Implementation:**
- **Banner Ads**: Displayed at bottom of home screen
- **Interstitial Ads**: Shown after analysis completion
- **Rewarded Ads**: Available for premium features

**Recommended Ad Placement:**
- **Banner Ads**: Bottom of screens, between content sections
- **Interstitial Ads**: Between major app flows, after completing actions
- **Rewarded Ads**: For unlocking premium features, extra analysis

### 6. **Production Checklist**

Before publishing:
- [ ] Replace test ad unit IDs with production IDs
- [ ] Set `useTestAds: false` in production builds
- [ ] Test ads on real devices
- [ ] Ensure ad loading doesn't break app functionality
- [ ] Implement proper error handling for ad failures

### 7. **Advanced Features**

**Ad Frequency Capping:**
```typescript
// In useAdManager.ts
const MIN_AD_INTERVAL = 30000; // 30 seconds between ads
```

**Ad Loading States:**
```typescript
// Show loading indicator while ads load
const { interstitialLoading, rewardedLoading } = useAdManager();
```

**Error Handling:**
```typescript
// Handle ad loading failures gracefully
const handleAdError = (error: any) => {
  console.log('Ad error:', error);
  // Implement fallback or retry logic
};
```

### 8. **Monetization Tips**

1. **Strategic Placement**: Don't overwhelm users with too many ads
2. **User Experience**: Ensure ads don't interfere with core functionality
3. **Testing**: Use test ads during development
4. **Analytics**: Monitor ad performance in AdMob console
5. **Compliance**: Follow AdMob policies and guidelines

### 9. **Troubleshooting**

**Common Issues:**
- **Ads not showing**: Check ad unit IDs and network connectivity
- **Test ads not loading**: Ensure you're using correct test ad unit IDs
- **Production ads not working**: Verify app is published and ad units are active

**Debug Commands:**
```bash
# Clear cache and restart
npx expo start --clear

# Check for configuration errors
npx expo doctor
```

### 10. **Next Steps After Setup**

1. **Implement More Ad Placements**: Add ads to other screens
2. **A/B Testing**: Test different ad placements and frequencies
3. **User Feedback**: Monitor user complaints about ad experience
4. **Revenue Optimization**: Analyze which ad types perform best
5. **Compliance Updates**: Stay updated with AdMob policy changes

## File Structure

```
pulse/
├── app/
│   ├── admob-config.ts          # Ad configuration
│   ├── components/
│   │   ├── BannerAd.tsx         # Banner ad component
│   │   ├── InterstitialAd.tsx   # Interstitial ad component
│   │   └── RewardedAd.tsx       # Rewarded ad component
│   ├── hooks/
│   │   └── useAdManager.ts      # Ad management hook
│   └── main/
│       └── home.tsx             # Updated with ads
├── app.json                     # Updated with AdMob plugin
└── ADMOB_SETUP.md              # This guide
```

## Support

- [AdMob Documentation](https://developers.google.com/admob)
- [Expo AdMob Documentation](https://docs.expo.dev/versions/latest/sdk/admob/)
- [AdMob Policies](https://support.google.com/admob/answer/6128543)

Your AdMob integration is now ready! Just replace the placeholder IDs with your actual AdMob app and ad unit IDs. 