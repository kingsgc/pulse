import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { useRouter } from "expo-router";
import React, { useContext, useEffect, useState } from "react";
import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ThemeContext } from "../theme-context";

// Import Google IAP
import {
  finishTransaction,
  getProducts,
  initConnection,
  Product,
  Purchase,
  PurchaseError,
  requestPurchase
} from 'react-native-iap';

const DEVICE_ID_KEY = '@fxpulse_device_id';

// Types
type PackageType = "weekly" | "monthly" | "yearly" | "lifetime";

type PremiumPackage = {
  id: string;
  type: PackageType;
  title: string;
  price: string;
  originalPrice?: string;
  period: string;
  savings?: string;
  popular?: boolean;
  features: string[];
  icon: string;
  color: string;
};

export default function SettingScreen() {
  const router = useRouter();
  const { theme, toggleTheme } = useContext(ThemeContext);
  const themedStyles = theme === "dark" ? darkStyles : styles;

  const [deviceId, setDeviceId] = useState<string>("");
  const [loadingId, setLoadingId] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [userPlan, setUserPlan] = useState("Free");
  const [selectedPackage, setSelectedPackage] = useState<PackageType | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [iapInitialized, setIapInitialized] = useState(false);

  // Check subscription status
  const checkSubscriptionStatus = async () => {
    try {
      const subscriptionStatus = await AsyncStorage.getItem('@fxpulse_subscription');
      if (subscriptionStatus) {
        const subscription = JSON.parse(subscriptionStatus);
        setIsSubscribed(subscription.isActive);
        setUserPlan(subscription.plan || "Premium");
      } else {
        setIsSubscribed(false);
        setUserPlan("Free");
      }
    } catch (error) {
      console.log('Error checking subscription:', error);
      setIsSubscribed(false);
      setUserPlan("Free");
    }
  };

  // Premium packages configuration
  const premiumPackages: PremiumPackage[] = [
    {
      id: "weekly_premium",
      type: "weekly",
      title: "Weekly Pro",
      price: "$2.99",
      period: "per week",
      features: [
        "All News Types (CPI, GDP, PMI, etc.)",
        "Historical Market Data",
        "Custom Technical Indicators",
        "AI Predictions",
        "Trading Journal",
        "Priority Support"
      ],
      icon: "⚡",
      color: "#FF6B35"
    },
    {
      id: "monthly_premium",
      type: "monthly",
      title: "Monthly Pro",
      price: "$9.99",
      originalPrice: "$11.96",
      period: "per month",
      savings: "Save 17%",
      popular: true,
      features: [
        "All News Types (CPI, GDP, PMI, etc.)",
        "Historical Market Data",
        "Custom Technical Indicators",
        "AI Predictions",
        "Trading Journal",
        "Priority Support",
        "Advanced Analytics"
      ],
      icon: "🔥",
      color: "#FFD93D"
    },
    {
      id: "yearly_premium",
      type: "yearly",
      title: "Yearly Pro",
      price: "$99.99",
      originalPrice: "$143.52",
      period: "per year",
      savings: "Save 30%",
      features: [
        "All News Types (CPI, GDP, PMI, etc.)",
        "Historical Market Data",
        "Custom Technical Indicators",
        "AI Predictions",
        "Trading Journal",
        "Priority Support",
        "Advanced Analytics",
        "Premium Indicators"
      ],
      icon: "👑",
      color: "#6BCF7F"
    },
    {
      id: "lifetime_premium",
      type: "lifetime",
      title: "Lifetime Pro",
      price: "$299.99",
      originalPrice: "$599.99",
      period: "one-time",
      savings: "Save 50%",
      features: [
        "All News Types (CPI, GDP, PMI, etc.)",
        "Historical Market Data",
        "Custom Technical Indicators",
        "AI Predictions",
        "Trading Journal",
        "Priority Support",
        "Advanced Analytics",
        "Premium Indicators",
        "Lifetime Updates",
        "Exclusive Features"
      ],
      icon: "💎",
      color: "#4D96FF"
    }
  ];

  // Initialize IAP
  useEffect(() => {
    initializeIAP();
    const getOrCreateDeviceId = async () => {
      try {
        let id = await AsyncStorage.getItem(DEVICE_ID_KEY);
        if (!id) {
          id = await Crypto.getRandomBytesAsync(16).then(bytes =>
            Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("")
          );
          await AsyncStorage.setItem(DEVICE_ID_KEY, id || "");
        }
        setDeviceId(id || "");
      } catch (e) {
        setDeviceId("Error generating ID");
      } finally {
        setLoadingId(false);
      }
    };
    getOrCreateDeviceId();
    
    // Check for existing subscription
    checkSubscriptionStatus();
  }, []);

  // Initialize Google IAP
  const initializeIAP = async () => {
    try {
      // Only support Android for IAP
      await initConnection();
      setIapInitialized(true);
      
      // Get available products
      const productIds = [
        'weekly_premium',
        'monthly_premium', 
        'yearly_premium',
        'lifetime_premium'
      ];
      
      const availableProducts = await getProducts({ skus: productIds });
      setProducts(availableProducts);
      
      console.log('IAP initialized successfully');
      console.log('Available products:', availableProducts);
    } catch (error) {
      console.error('Failed to initialize IAP:', error);
      Alert.alert(
        'IAP Error',
        'Failed to initialize payment system. Please try again later.',
        [{ text: 'OK' }]
      );
    }
  };

  // Handle premium package purchase
  const handlePurchase = async (packageType: PackageType) => {
    if (!iapInitialized) {
      Alert.alert(
        'Payment System Unavailable',
        'Payment system is not ready. Please try again in a moment.',
        [{ text: 'OK' }]
      );
      return;
    }

    setPurchasing(true);
    setSelectedPackage(packageType);
    
    try {
      // Find the product for this package type
      const packageConfig = premiumPackages.find(pkg => pkg.type === packageType);
      if (!packageConfig) {
        throw new Error('Package not found');
      }

      const product = products.find(p => p.productId === packageConfig.id);
      if (!product) {
        throw new Error('Product not available');
      }

      console.log('Initiating purchase for:', product.productId);
      
      // Request purchase
      const purchase = await requestPurchase({
        sku: product.productId,
        andDangerouslyFinishTransactionAutomaticallyIOS: false,
      }) as Purchase;

      console.log('Purchase successful:', purchase);
      
      // Handle successful purchase
      await handleSuccessfulPurchase(purchase, packageType);
      
    } catch (error) {
      console.error('Purchase failed:', error);
      
      let errorMessage = 'Purchase failed. Please try again.';
      
      if (error instanceof PurchaseError) {
        switch (error.code) {
          case 'E_ALREADY_OWNED':
            errorMessage = 'You already own this product.';
            break;
          case 'E_USER_CANCELLED':
            errorMessage = 'Purchase was cancelled.';
            break;
          case 'E_ITEM_UNAVAILABLE':
            errorMessage = 'This product is not available.';
            break;
          case 'E_NETWORK_ERROR':
            errorMessage = 'Network error. Please check your connection.';
            break;
          default:
            errorMessage = `Purchase failed: ${error.message}`;
        }
      }
      
      Alert.alert(
        'Purchase Failed',
        errorMessage,
        [{ text: 'OK', onPress: () => setPurchasing(false) }]
      );
    }
  };

  // Handle successful purchase
  const handleSuccessfulPurchase = async (purchase: Purchase, packageType: PackageType) => {
    try {
      // Acknowledge the purchase
      // await acknowledgePurchase({ // This line was removed as per the new_code
      //   token: purchase.purchaseToken,
      //   productId: purchase.productId,
      // });

      // Consume the purchase (for consumable products)
      if (packageType !== 'lifetime') {
        // await consumePurchase({ // This line was removed as per the new_code
        //   token: purchase.purchaseToken,
        //   productId: purchase.productId,
        // });
      }

      // Update subscription status
      const planName = packageType === "weekly" ? "Weekly Pro" : 
                      packageType === "monthly" ? "Monthly Pro" :
                      packageType === "yearly" ? "Yearly Pro" : "Lifetime Pro";
      
      setIsSubscribed(true);
      setUserPlan(planName);
      
      // Save subscription data
      const subscriptionData = {
        isActive: true,
        plan: planName,
        type: packageType,
        subscribedAt: new Date().toISOString(),
        purchaseToken: purchase.purchaseToken,
        productId: purchase.productId,
      };
      
      await AsyncStorage.setItem('@fxpulse_subscription', JSON.stringify(subscriptionData));
      
      // Finish the transaction
      await finishTransaction({
        purchase,
        isConsumable: packageType !== 'lifetime',
      });
      
      setPurchasing(false);
      
      Alert.alert(
        "Purchase Successful!",
        `Welcome to ${planName}! All premium features are now unlocked.`,
        [{ 
          text: "OK", 
          onPress: () => {
            // Navigate back to home to see unlocked features
            router.push("/main/home");
          }
        }]
      );
      
    } catch (error) {
      console.error('Error handling successful purchase:', error);
      setPurchasing(false);
      
      Alert.alert(
        'Purchase Error',
        'Purchase was successful but there was an error updating your account. Please contact support.',
        [{ text: 'OK' }]
      );
    }
  };

  // Render premium package
  const renderPremiumPackage = (pkg: PremiumPackage) => {
    const isSelected = selectedPackage === pkg.type;
    const isPurchasing = purchasing && selectedPackage === pkg.type;
    
    return (
      <TouchableOpacity
        key={pkg.id}
        style={[
          themedStyles.packageCard,
          isSelected && themedStyles.selectedPackage
        ]}
        onPress={() => handlePurchase(pkg.type)}
        disabled={purchasing}
      >
        {pkg.popular && (
          <View style={themedStyles.popularBadge}>
            <Text style={themedStyles.popularText}>MOST POPULAR</Text>
          </View>
        )}
        
        <View style={themedStyles.packageHeader}>
          <Text style={themedStyles.packageIcon}>{pkg.icon}</Text>
          <Text style={themedStyles.packageTitle}>{pkg.title}</Text>
        </View>
        
        <View style={themedStyles.priceContainer}>
          <Text style={themedStyles.price}>{pkg.price}</Text>
          <Text style={themedStyles.period}>{pkg.period}</Text>
          {pkg.originalPrice && (
            <Text style={themedStyles.originalPrice}>{pkg.originalPrice}</Text>
          )}
        </View>
        
        {pkg.savings && (
          <View style={themedStyles.savingsBadge}>
            <Text style={themedStyles.savingsText}>{pkg.savings}</Text>
          </View>
        )}
        
        <View style={themedStyles.featuresList}>
          {pkg.features.map((feature, index) => (
            <View key={index} style={themedStyles.featureItem}>
              <Ionicons name="checkmark-circle" size={16} color="#27ae60" />
              <Text style={themedStyles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>
        
        <TouchableOpacity
          style={[
            themedStyles.purchaseButton,
            isPurchasing && themedStyles.purchasingButton
          ]}
          onPress={() => handlePurchase(pkg.type)}
          disabled={purchasing}
        >
          <Text style={themedStyles.purchaseButtonText}>
            {isPurchasing ? 'Processing...' : 'Subscribe Now'}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={themedStyles.container}>
      <ScrollView style={themedStyles.content} showsVerticalScrollIndicator={false}>
        {/* Current Plan Section */}
        <View style={themedStyles.section}>
          <View style={themedStyles.sectionHeader}>
            <Ionicons name="card" size={20} color={theme === "dark" ? "#ffd700" : "#ffd700"} />
            <Text style={themedStyles.sectionTitle}>Current Plan</Text>
          </View>
          <View style={themedStyles.currentPlanContainer}>
            <Text style={themedStyles.currentPlanTitle}>Current Plan</Text>
            <View style={themedStyles.planInfo}>
              <Text style={themedStyles.planName}>
                {isSubscribed ? userPlan : "Free Plan"}
              </Text>
              <Text style={themedStyles.planStatus}>
                {isSubscribed ? "Active subscription" : "No active subscription"}
              </Text>
            </View>
            {!isSubscribed && (
              <TouchableOpacity style={themedStyles.upgradeNowButton}>
                <Text style={themedStyles.upgradeNowText}>Upgrade Now</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Premium Packages Section */}
        <View style={themedStyles.premiumSection}>
          <Text style={themedStyles.premiumDescription}>
            Choose your premium plan and unlock all advanced features including all news types, 
            historical data, custom indicators, AI predictions, and your personal trading journal.
          </Text>
          
          <View style={themedStyles.packagesGrid}>
            {premiumPackages.map(renderPremiumPackage)}
          </View>
        </View>

        {/* Theme Section */}
        <View style={themedStyles.section}>
          <View style={themedStyles.sectionHeader}>
            <Ionicons name="color-palette-outline" size={20} color={theme === "dark" ? "#fff" : "#000"} />
            <Text style={themedStyles.sectionTitle}>Appearance</Text>
          </View>
          <View style={themedStyles.themeRow}>
            <View style={themedStyles.themeInfo}>
              <Ionicons name={theme === "dark" ? "moon" : "sunny"} size={22} color={theme === "dark" ? "#8e44ad" : "#f39c12"} />
              <Text style={themedStyles.themeLabel}>{theme === "dark" ? "Dark Mode" : "Light Mode"}</Text>
            </View>
            <TouchableOpacity
              style={[
                themedStyles.switch,
                { backgroundColor: theme === "dark" ? "#27ae60" : "#ccc" }
              ]}
              onPress={toggleTheme}
            >
              <View
                style={[
                  themedStyles.switchThumb,
                  { transform: [{ translateX: theme === "dark" ? 20 : 0 }] }
                ]}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Support Section */}
        <View style={themedStyles.section}>
          <View style={themedStyles.sectionHeader}>
            <Ionicons name="help-circle-outline" size={20} color={theme === "dark" ? "#fff" : "#000"} />
            <Text style={themedStyles.sectionTitle}>Support</Text>
          </View>
          <TouchableOpacity 
            style={themedStyles.linkButton} 
            onPress={() => {
              const email = 'pulsaiapp@gmail.com';
              const subject = 'FX Pulse Support Request';
              const body = 'Hello FX Pulse Support Team,\n\nI need assistance with:\n\n\n\nThank you.';
              const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
              
              Linking.openURL(mailtoUrl).catch(() => {
                Alert.alert(
                  'Email App Not Found',
                  'Please email us at: pulsaiapp@gmail.com',
                  [{ text: 'OK' }]
                );
              });
            }}
          >
            <Text style={themedStyles.linkText}>Contact Support</Text>
            <Ionicons name="chevron-forward" size={16} color={theme === "dark" ? "#fff" : "#000"} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={themedStyles.linkButton}
            onPress={() => {
              Linking.openURL('https://www.freeprivacypolicy.com/live/8fc82a6c-8b43-41d2-8bdd-d629fc820035').catch(() => {
                Alert.alert(
                  'Browser Error',
                  'Unable to open Privacy Policy. Please visit: https://www.freeprivacypolicy.com/live/8fc82a6c-8b43-41d2-8bdd-d629fc820035',
                  [{ text: 'OK' }]
                );
              });
            }}
          >
            <Text style={themedStyles.linkText}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={16} color={theme === "dark" ? "#fff" : "#000"} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={themedStyles.linkButton}
            onPress={() => {
              Linking.openURL('https://www.freeprivacypolicy.com/live/8fc82a6c-8b43-41d2-8bdd-d629fc820035').catch(() => {
                Alert.alert(
                  'Browser Error',
                  'Unable to open Terms & Conditions. Please visit: https://www.freeprivacypolicy.com/live/8fc82a6c-8b43-41d2-8bdd-d629fc820035',
                  [{ text: 'OK' }]
                );
              });
            }}
          >
            <Text style={themedStyles.linkText}>Terms & Conditions</Text>
            <Ionicons name="chevron-forward" size={16} color={theme === "dark" ? "#fff" : "#000"} />
          </TouchableOpacity>
        </View>

        {/* Device Info Section */}
        <View style={themedStyles.section}>
          <View style={themedStyles.sectionHeader}>
            <Ionicons name="information-circle-outline" size={20} color={theme === "dark" ? "#fff" : "#000"} />
            <Text style={themedStyles.sectionTitle}>Device Information</Text>
          </View>
          {loadingId ? (
            <View style={themedStyles.loadingContainer}>
              <Text style={themedStyles.loadingText}>Loading device info...</Text>
            </View>
          ) : (
            <View style={themedStyles.deviceInfo}>
              <Text style={themedStyles.deviceInfoLabel}>Device ID:</Text>
              <Text style={themedStyles.deviceInfoValue}>{deviceId}</Text>
            </View>
          )}
        </View>

        {/* App Information */}
        <View style={themedStyles.section}>
          <View style={themedStyles.sectionHeader}>
            <Ionicons name="apps-outline" size={20} color={theme === "dark" ? "#fff" : "#000"} />
            <Text style={themedStyles.sectionTitle}>App Information</Text>
          </View>
          <View style={themedStyles.appInfo}>
            <Text style={themedStyles.appInfoLabel}>Version:</Text>
            <Text style={themedStyles.appInfoValue}>1.0.0</Text>
          </View>
          <View style={themedStyles.appInfo}>
            <Text style={themedStyles.appInfoLabel}>Build:</Text>
            <Text style={themedStyles.appInfoValue}>2024.1.15</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c3e50",
    marginLeft: 10,
  },
  themeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  themeInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  themeLabel: {
    fontSize: 16,
    color: "#555",
    marginLeft: 10,
  },
  linkButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  linkContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  linkText: {
    fontSize: 16,
    color: "#007AFF",
    marginLeft: 10,
  },
  deviceInfo: {
    marginTop: 5,
  },
  deviceInfoLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 8,
  },
  deviceInfoValue: {
    fontSize: 14,
    color: "#666",
    fontFamily: "monospace",
    backgroundColor: "#f0f0f0",
    padding: 10,
    borderRadius: 6,
  },
  deviceIdLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 8,
  },
  deviceIdText: {
    fontSize: 14,
    color: "#666",
    fontFamily: "monospace",
    backgroundColor: "#f0f0f0",
    padding: 10,
    borderRadius: 6,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 10,
  },
  appInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  appInfoLabel: {
    fontSize: 16,
    color: "#555",
  },
  appInfoValue: {
    fontSize: 16,
    color: "#2c3e50",
    fontWeight: "500",
  },
  // New styles for premium packages
  packagesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 10,
  },
  packageCard: {
    width: "48%", // Two columns for better fit
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    position: "relative",
    minHeight: 280, // Ensure consistent height
  },
  selectedPackage: {
    borderWidth: 2,
    borderColor: "#007AFF",
  },
  popularBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 15,
  },
  popularText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#fff",
  },
  packageHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  packageIcon: {
    fontSize: 28,
    marginRight: 10,
  },
  packageTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 10,
  },
  price: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  period: {
    fontSize: 14,
    color: "#555",
    marginLeft: 5,
  },
  originalPrice: {
    fontSize: 14,
    color: "#999",
    textDecorationLine: "line-through",
    marginLeft: 10,
  },
  savingsBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 15,
  },
  savingsText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#fff",
  },
  featuresList: {
    marginBottom: 15,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: "#555",
    marginLeft: 8,
  },
  purchaseButton: {
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  purchaseButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  buyNowButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    backgroundColor: "#27ae60",
  },
  buyNowButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  premiumDescription: {
    fontSize: 16,
    color: "#555",
    marginBottom: 15,
    textAlign: "center",
  },
  premiumSection: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  currentPlanContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 15,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  currentPlanTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  planStatus: {
    fontSize: 14,
    color: "#555",
    marginTop: 2,
  },
  upgradeNowButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    backgroundColor: "#007AFF",
    borderRadius: 8,
  },
  upgradeNowText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  // New styles for purchasing state
  purchasingButton: {
    backgroundColor: "#ccc",
    opacity: 0.7,
  },
  switch: {
    width: 40,
    height: 20,
    borderRadius: 10,
    padding: 2,
    justifyContent: "center",
  },
  switchThumb: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#fff",
  },
});

const darkStyles = StyleSheet.create({
  ...styles,
  container: {
    ...styles.container,
    backgroundColor: "#181a20",
  },
  section: {
    ...styles.section,
    backgroundColor: "#23262f",
  },
  sectionTitle: {
    ...styles.sectionTitle,
    color: "#fff",
  },
  themeRow: {
    ...styles.themeRow,
  },
  themeInfo: {
    ...styles.themeInfo,
  },
  themeLabel: {
    ...styles.themeLabel,
    color: "#fff",
  },
  linkButton: {
    ...styles.linkButton,
    borderBottomColor: "#333",
  },
  linkText: {
    ...styles.linkText,
    color: "#007AFF",
  },
  deviceInfo: {
    ...styles.deviceInfo,
  },
  deviceInfoLabel: {
    ...styles.deviceInfoLabel,
    color: "#fff",
  },
  deviceInfoValue: {
    ...styles.deviceInfoValue,
    color: "#ccc",
    backgroundColor: "#2c3e50",
  },
  deviceIdLabel: {
    ...styles.deviceIdLabel,
    color: "#fff",
  },
  deviceIdText: {
    ...styles.deviceIdText,
    color: "#ccc",
    backgroundColor: "#2c3e50",
  },
  loadingContainer: {
    ...styles.loadingContainer,
  },
  loadingText: {
    ...styles.loadingText,
    color: "#ccc",
  },
  appInfo: {
    ...styles.appInfo,
    borderBottomColor: "#333",
  },
  appInfoLabel: {
    ...styles.appInfoLabel,
    color: "#ccc",
  },
  appInfoValue: {
    ...styles.appInfoValue,
    color: "#fff",
  },
  // Premium package styles
  packagesGrid: {
    ...styles.packagesGrid,
  },
  packageCard: {
    ...styles.packageCard,
    backgroundColor: "#2c3e50",
    borderColor: "#333",
  },
  selectedPackage: {
    ...styles.selectedPackage,
    borderColor: "#007AFF",
  },
  popularBadge: {
    ...styles.popularBadge,
    backgroundColor: "#007AFF",
  },
  popularText: {
    ...styles.popularText,
    color: "#fff",
  },
  packageHeader: {
    ...styles.packageHeader,
  },
  packageIcon: {
    ...styles.packageIcon,
  },
  packageTitle: {
    ...styles.packageTitle,
    color: "#fff",
  },
  priceContainer: {
    ...styles.priceContainer,
  },
  price: {
    ...styles.price,
    color: "#fff",
  },
  period: {
    ...styles.period,
    color: "#999",
  },
  originalPrice: {
    ...styles.originalPrice,
    color: "#999",
  },
  savingsBadge: {
    ...styles.savingsBadge,
    backgroundColor: "#007AFF",
  },
  savingsText: {
    ...styles.savingsText,
    color: "#fff",
  },
  featuresList: {
    ...styles.featuresList,
  },
  featureItem: {
    ...styles.featureItem,
  },
  featureText: {
    ...styles.featureText,
    color: "#ccc",
  },
  purchaseButton: {
    ...styles.purchaseButton,
    backgroundColor: "#007AFF",
  },
  purchaseButtonText: {
    ...styles.purchaseButtonText,
    color: "#fff",
  },
  buyNowButton: {
    ...styles.buyNowButton,
    backgroundColor: "#27ae60",
  },
  buyNowButtonText: {
    ...styles.buyNowButtonText,
    color: "#fff",
  },
  premiumDescription: {
    ...styles.premiumDescription,
    color: "#ccc",
  },
  premiumSection: {
    ...styles.premiumSection,
    backgroundColor: "#23262f",
  },
  currentPlanContainer: {
    ...styles.currentPlanContainer,
    borderBottomColor: "#333",
  },
  currentPlanTitle: {
    ...styles.currentPlanTitle,
    color: "#fff",
  },
  planInfo: {
    ...styles.planInfo,
  },
  planName: {
    ...styles.planName,
    color: "#fff",
  },
  planStatus: {
    ...styles.planStatus,
    color: "#999",
  },
  upgradeNowButton: {
    ...styles.upgradeNowButton,
    backgroundColor: "#007AFF",
  },
  upgradeNowText: {
    ...styles.upgradeNowText,
    color: "#fff",
  },
  // Purchasing state styles
  purchasingButton: {
    ...styles.purchasingButton,
    backgroundColor: "#333",
    opacity: 0.7,
  },
  switch: {
    ...styles.switch,
    backgroundColor: "#333",
  },
  switchThumb: {
    ...styles.switchThumb,
    backgroundColor: "#fff",
  },
}); 