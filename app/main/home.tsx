import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from "expo-router";
import React, { useContext, useState } from "react";
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { ThemeContext } from "../theme-context";

// Type definitions
type NewsType = 
  | "Non-Farm Payrolls (NFP)" 
  | "Consumer Price Index (CPI)" 
  | "Gross Domestic Product (GDP)" 
  | "Interest Rate Decision" 
  | "Employment Change" 
  | "Retail Sales" 
  | "Purchasing Managers Index (PMI)" 
  | "Trade Balance" 
  | "Unemployment Rate"
  | "Core CPI"
  | "Industrial Production"
  | "Housing Starts"
  | "Durable Goods Orders"
  | "Services PMI"
  | "Manufacturing PMI";

type Currency = "USD" | "EUR" | "GBP" | "JPY" | "AUD" | "CAD" | "CHF" | "NZD";

export default function HomeScreen() {
  const router = useRouter();
  const { theme } = useContext(ThemeContext);
  const themedStyles = theme === "dark" ? darkStyles : styles;

  const [newsType, setNewsType] = useState<NewsType>("Non-Farm Payrolls (NFP)");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [previous, setPrevious] = useState("");
  const [forecast, setForecast] = useState("");
  const [result, setResult] = useState("");
  const [showNewsPicker, setShowNewsPicker] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  
  // Premium features state
  const [isPremium, setIsPremium] = useState(false);
  const [userPlan, setUserPlan] = useState("None");
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [customIndicators, setCustomIndicators] = useState<string[]>([]);
  const [portfolioValue, setPortfolioValue] = useState(0);
  const [aiPredictions, setAiPredictions] = useState<any[]>([]);

  // Check subscription status on component mount
  React.useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  // Check subscription status
  const checkSubscriptionStatus = async () => {
    try {
      const subscriptionStatus = await AsyncStorage.getItem('@fxpulse_subscription');
      
      if (subscriptionStatus) {
        const subscription = JSON.parse(subscriptionStatus);
        setIsPremium(subscription.isActive);
        setUserPlan(subscription.plan || "Premium");
      } else {
        setIsPremium(false);
        setUserPlan("None");
      }
    } catch (error) {
      console.log('Error checking subscription:', error);
      setIsPremium(false);
      setUserPlan("None");
    }
  };

  // Handle successful subscription
  const handleSuccessfulSubscription = (planType: string) => {
    setIsPremium(true);
    setUserPlan(planType);
    
    // Save subscription status
    const subscriptionData = {
      isActive: true,
      plan: planType,
      subscribedAt: new Date().toISOString()
    };
    
    AsyncStorage.setItem('@fxpulse_subscription', JSON.stringify(subscriptionData));
    
    // Show success message
    Alert.alert(
      "Subscription Successful!",
      `Welcome to ${planType}! All news types are now unlocked.`,
      [{ text: "OK" }]
    );
  };

  // Premium features functions
  const getHistoricalData = () => {
    if (!isPremium) {
      setShowPremiumModal(true);
      return [];
    }
    // Simulate historical data
    return [
      { date: "2024-01-15", value: 180, impact: "BULLISH" },
      { date: "2024-01-08", value: 175, impact: "NEUTRAL" },
      { date: "2024-01-01", value: 170, impact: "BEARISH" }
    ];
  };

  const getCustomIndicators = () => {
    if (!isPremium) {
      setShowPremiumModal(true);
      return [];
    }
    return ["RSI", "MACD", "Bollinger Bands", "Moving Averages"];
  };

  const getPortfolioValue = () => {
    if (!isPremium) {
      setShowPremiumModal(true);
      return 0;
    }
    return 12500; // Simulated portfolio value
  };

  const getAiPredictions = () => {
    if (!isPremium) {
      setShowPremiumModal(true);
      return [];
    }
    return [
      { pair: "EUR/USD", prediction: "BULLISH", confidence: 85 },
      { pair: "GBP/USD", prediction: "BEARISH", confidence: 72 },
      { pair: "USD/JPY", prediction: "NEUTRAL", confidence: 68 }
    ];
  };

  // Navigate to settings for subscription
  const navigateToSettings = () => {
    setShowPremiumModal(false);
    router.push("/setting/setting");
  };

  // Check if news type is premium
  const isPremiumNewsType = (type: NewsType) => {
    // Only NFP is free, all others are premium
    return type !== "Non-Farm Payrolls (NFP)";
  };

  // Handle news type selection
  const handleNewsTypeSelection = (type: NewsType) => {
    if (isPremiumNewsType(type) && !isPremium) {
      setShowPremiumModal(true);
      return;
    }
    setNewsType(type);
    setShowNewsPicker(false);
  };

  const newsTypes: NewsType[] = [
    "Non-Farm Payrolls (NFP)",
    "Consumer Price Index (CPI)",
    "Gross Domestic Product (GDP)",
    "Interest Rate Decision",
    "Employment Change",
    "Retail Sales",
    "Purchasing Managers Index (PMI)",
    "Trade Balance",
    "Unemployment Rate",
    "Core CPI",
    "Industrial Production",
    "Housing Starts",
    "Durable Goods Orders",
    "Services PMI",
    "Manufacturing PMI"
  ];

  const currencies: Currency[] = [
    "USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "NZD"
  ];

  // Ensure free users can only access NFP
  const availableNewsTypes = isPremium ? newsTypes : ["Non-Farm Payrolls (NFP)"];

  // Currency-specific analysis logic
  const getCurrencyAnalysis = (currency: Currency, newsType: NewsType, sentiment: string, difference: number) => {
    const currencyNames = {
      USD: "US Dollar",
      EUR: "Euro",
      GBP: "British Pound",
      JPY: "Japanese Yen",
      AUD: "Australian Dollar",
      CAD: "Canadian Dollar",
      CHF: "Swiss Franc",
      NZD: "New Zealand Dollar"
    };

    const currencyName = currencyNames[currency];
    
    // Currency-specific impact analysis
    let impact = "";
    
    if (currency === "USD") {
      if (sentiment === "BULLISH") {
        if (newsType.includes("NFP") || newsType.includes("Employment")) {
          impact = `${currencyName} strength is expected as strong employment data typically supports USD appreciation against other currencies.`;
        } else if (newsType.includes("CPI")) {
          impact = `${currencyName} strength is expected as higher inflation may lead to tighter monetary policy, supporting USD.`;
        } else if (newsType.includes("GDP")) {
          impact = `${currencyName} strength is expected as strong economic growth typically supports USD appreciation.`;
        } else if (newsType.includes("Interest Rate")) {
          impact = `${currencyName} strength is expected as higher interest rates typically attract foreign investment and support USD.`;
        } else {
          impact = `${currencyName} strength is expected as positive ${newsType} data typically supports USD appreciation against other currencies.`;
        }
      } else if (sentiment === "BEARISH") {
        if (newsType.includes("NFP") || newsType.includes("Employment")) {
          impact = `${currencyName} weakness is expected as weak employment data typically leads to USD depreciation against other currencies.`;
        } else if (newsType.includes("CPI")) {
          impact = `${currencyName} weakness is expected as lower inflation may lead to looser monetary policy, weakening USD.`;
        } else if (newsType.includes("GDP")) {
          impact = `${currencyName} weakness is expected as weak economic growth typically leads to USD depreciation.`;
        } else if (newsType.includes("Interest Rate")) {
          impact = `${currencyName} weakness is expected as lower interest rates typically reduce foreign investment and weaken USD.`;
        } else {
          impact = `${currencyName} weakness is expected as negative ${newsType} data typically leads to USD depreciation against other currencies.`;
        }
      }
    } else {
      if (sentiment === "BULLISH") {
        if (newsType.includes("NFP") || newsType.includes("Employment")) {
          impact = `${currencyName} strength is expected. This could lead to ${currency}/USD pair appreciation as the currency outperforms USD.`;
        } else if (newsType.includes("CPI")) {
          impact = `${currencyName} strength is expected. This could lead to ${currency}/USD pair appreciation as inflation concerns may be lower than in the US.`;
        } else if (newsType.includes("GDP")) {
          impact = `${currencyName} strength is expected. This could lead to ${currency}/USD pair appreciation as economic growth may be stronger than in the US.`;
        } else if (newsType.includes("Interest Rate")) {
          impact = `${currencyName} strength is expected. This could lead to ${currency}/USD pair appreciation as higher interest rates attract investment.`;
        } else {
          impact = `${currencyName} strength is expected. This could lead to ${currency}/USD pair appreciation.`;
        }
      } else if (sentiment === "BEARISH") {
        if (newsType.includes("NFP") || newsType.includes("Employment")) {
          impact = `${currencyName} weakness is expected. This could lead to ${currency}/USD pair depreciation as the currency underperforms USD.`;
        } else if (newsType.includes("CPI")) {
          impact = `${currencyName} weakness is expected. This could lead to ${currency}/USD pair depreciation as inflation concerns may be higher than in the US.`;
        } else if (newsType.includes("GDP")) {
          impact = `${currencyName} weakness is expected. This could lead to ${currency}/USD pair depreciation as economic growth may be weaker than in the US.`;
        } else if (newsType.includes("Interest Rate")) {
          impact = `${currencyName} weakness is expected. This could lead to ${currency}/USD pair depreciation as lower interest rates reduce investment appeal.`;
        } else {
          impact = `${currencyName} weakness is expected. This could lead to ${currency}/USD pair depreciation.`;
        }
      }
    }

    return impact;
  };

  // Get suggested currency pairs based on selected currency and news type
  const getSuggestedPairs = (currency: Currency, newsType: NewsType, sentiment: string) => {
    const pairs = [];
    
    if (currency === "USD") {
      // For USD, suggest major pairs
      pairs.push("EUR/USD", "GBP/USD", "USD/JPY", "USD/CHF", "AUD/USD", "USD/CAD", "NZD/USD");
    } else {
      // For other currencies, suggest their USD pair and related pairs
      pairs.push(`${currency}/USD`);
      
      // Add related pairs based on currency
      if (currency === "EUR") {
        pairs.push("EUR/GBP", "EUR/JPY", "EUR/CHF");
      } else if (currency === "GBP") {
        pairs.push("GBP/EUR", "GBP/JPY", "GBP/CHF");
      } else if (currency === "JPY") {
        pairs.push("EUR/JPY", "GBP/JPY", "AUD/JPY");
      } else if (currency === "AUD") {
        pairs.push("AUD/EUR", "AUD/GBP", "AUD/JPY");
      } else if (currency === "CAD") {
        pairs.push("EUR/CAD", "GBP/CAD", "AUD/CAD");
      } else if (currency === "CHF") {
        pairs.push("EUR/CHF", "GBP/CHF", "AUD/CHF");
      } else if (currency === "NZD") {
        pairs.push("NZD/EUR", "NZD/GBP", "NZD/JPY");
      }
    }
    
    return pairs.slice(0, 5); // Return top 5 pairs
  };

  // Calculate expected pips movement based on news type and sentiment
  const getExpectedPips = (newsType: NewsType, sentiment: string, percentageChange: number) => {
    let basePips = 0;
    
    // Base pips based on news type importance
    if (newsType.includes("NFP") || newsType.includes("Interest Rate")) {
      basePips = sentiment === "BULLISH" ? 80 : 60;
    } else if (newsType.includes("CPI") || newsType.includes("GDP")) {
      basePips = sentiment === "BULLISH" ? 60 : 45;
    } else if (newsType.includes("Employment") || newsType.includes("PMI")) {
      basePips = sentiment === "BULLISH" ? 50 : 35;
    } else if (newsType.includes("Retail Sales") || newsType.includes("Trade Balance")) {
      basePips = sentiment === "BULLISH" ? 40 : 30;
    } else {
      basePips = sentiment === "BULLISH" ? 35 : 25;
    }
    
    // Adjust based on percentage change
    const adjustment = Math.min(Math.abs(percentageChange) / 10, 2);
    const adjustedPips = Math.round(basePips * adjustment);
    
    return Math.max(adjustedPips, 10); // Minimum 10 pips
  };

  // Get time duration advice based on news type
  const getTimeDurationAdvice = (newsType: NewsType) => {
    if (newsType.includes("NFP") || newsType.includes("Interest Rate")) {
      return "This news typically affects the market for 2-4 hours with high volatility. Consider trading within the first 30 minutes for maximum impact.";
    } else if (newsType.includes("CPI") || newsType.includes("GDP")) {
      return "This news typically affects the market for 1-3 hours. Best trading opportunities are within the first 15-30 minutes.";
    } else if (newsType.includes("Employment") || newsType.includes("PMI")) {
      return "This news typically affects the market for 1-2 hours. Focus on the first 15-20 minutes for optimal entry.";
    } else if (newsType.includes("Retail Sales") || newsType.includes("Trade Balance")) {
      return "This news typically affects the market for 30 minutes to 1 hour. Quick scalping opportunities may be available.";
    } else {
      return "This news typically affects the market for 15-45 minutes. Consider quick scalping strategies.";
    }
  };

  // Get suggested currency pairs with direction and pips
  const getSuggestedPairsWithDirection = (currency: Currency, newsType: NewsType, sentiment: string) => {
    const pairs = [];
    
    if (currency === "USD") {
      // For USD, suggest major pairs with direction
      if (sentiment === "BULLISH") {
        pairs.push({ pair: "EUR/USD", direction: "SELL", pips: 60, icon: "📉" });
        pairs.push({ pair: "GBP/USD", direction: "SELL", pips: 55, icon: "📉" });
        pairs.push({ pair: "USD/JPY", direction: "BUY", pips: 65, icon: "📈" });
        pairs.push({ pair: "USD/CHF", direction: "BUY", pips: 50, icon: "📈" });
        pairs.push({ pair: "AUD/USD", direction: "SELL", pips: 45, icon: "📉" });
      } else {
        pairs.push({ pair: "EUR/USD", direction: "BUY", pips: 60, icon: "📈" });
        pairs.push({ pair: "GBP/USD", direction: "BUY", pips: 55, icon: "📈" });
        pairs.push({ pair: "USD/JPY", direction: "SELL", pips: 65, icon: "📉" });
        pairs.push({ pair: "USD/CHF", direction: "SELL", pips: 50, icon: "📉" });
        pairs.push({ pair: "AUD/USD", direction: "BUY", pips: 45, icon: "📈" });
      }
    } else {
      // For other currencies, suggest their USD pair and related pairs
      const basePair = `${currency}/USD`;
      const baseDirection = sentiment === "BULLISH" ? "BUY" : "SELL";
      const basePips = 50;
      
      pairs.push({ pair: basePair, direction: baseDirection, pips: basePips, icon: sentiment === "BULLISH" ? "📈" : "📉" });
      
      // Add related pairs based on currency
      if (currency === "EUR") {
        pairs.push({ pair: "EUR/GBP", direction: baseDirection, pips: 35, icon: sentiment === "BULLISH" ? "📈" : "📉" });
        pairs.push({ pair: "EUR/JPY", direction: baseDirection, pips: 40, icon: sentiment === "BULLISH" ? "📈" : "📉" });
        pairs.push({ pair: "EUR/CHF", direction: baseDirection, pips: 30, icon: sentiment === "BULLISH" ? "📈" : "📉" });
      } else if (currency === "GBP") {
        pairs.push({ pair: "GBP/EUR", direction: baseDirection, pips: 35, icon: sentiment === "BULLISH" ? "📈" : "📉" });
        pairs.push({ pair: "GBP/JPY", direction: baseDirection, pips: 40, icon: sentiment === "BULLISH" ? "📈" : "📉" });
        pairs.push({ pair: "GBP/CHF", direction: baseDirection, pips: 30, icon: sentiment === "BULLISH" ? "📈" : "📉" });
      } else if (currency === "JPY") {
        pairs.push({ pair: "EUR/JPY", direction: baseDirection === "BUY" ? "SELL" : "BUY", pips: 40, icon: baseDirection === "BUY" ? "📉" : "📈" });
        pairs.push({ pair: "GBP/JPY", direction: baseDirection === "BUY" ? "SELL" : "BUY", pips: 45, icon: baseDirection === "BUY" ? "📉" : "📈" });
        pairs.push({ pair: "AUD/JPY", direction: baseDirection === "BUY" ? "SELL" : "BUY", pips: 35, icon: baseDirection === "BUY" ? "📉" : "📈" });
      } else if (currency === "AUD") {
        pairs.push({ pair: "AUD/EUR", direction: baseDirection, pips: 30, icon: sentiment === "BULLISH" ? "📈" : "📉" });
        pairs.push({ pair: "AUD/GBP", direction: baseDirection, pips: 35, icon: sentiment === "BULLISH" ? "📈" : "📉" });
        pairs.push({ pair: "AUD/JPY", direction: baseDirection, pips: 40, icon: sentiment === "BULLISH" ? "📈" : "📉" });
      } else if (currency === "CAD") {
        pairs.push({ pair: "EUR/CAD", direction: baseDirection === "BUY" ? "SELL" : "BUY", pips: 35, icon: baseDirection === "BUY" ? "📉" : "📈" });
        pairs.push({ pair: "GBP/CAD", direction: baseDirection === "BUY" ? "SELL" : "BUY", pips: 40, icon: baseDirection === "BUY" ? "📉" : "📈" });
        pairs.push({ pair: "AUD/CAD", direction: baseDirection === "BUY" ? "SELL" : "BUY", pips: 30, icon: baseDirection === "BUY" ? "📉" : "📈" });
      } else if (currency === "CHF") {
        pairs.push({ pair: "EUR/CHF", direction: baseDirection === "BUY" ? "SELL" : "BUY", pips: 30, icon: baseDirection === "BUY" ? "📉" : "📈" });
        pairs.push({ pair: "GBP/CHF", direction: baseDirection === "BUY" ? "SELL" : "BUY", pips: 35, icon: baseDirection === "BUY" ? "📉" : "📈" });
        pairs.push({ pair: "AUD/CHF", direction: baseDirection === "BUY" ? "SELL" : "BUY", pips: 25, icon: baseDirection === "BUY" ? "📉" : "📈" });
      } else if (currency === "NZD") {
        pairs.push({ pair: "NZD/EUR", direction: baseDirection, pips: 30, icon: sentiment === "BULLISH" ? "📈" : "📉" });
        pairs.push({ pair: "NZD/GBP", direction: baseDirection, pips: 35, icon: sentiment === "BULLISH" ? "📈" : "📉" });
        pairs.push({ pair: "NZD/JPY", direction: baseDirection, pips: 40, icon: sentiment === "BULLISH" ? "📈" : "📉" });
      }
    }
    
    return pairs.slice(0, 5); // Return top 5 pairs
  };

  // Get simplified trading advice
  const getSimplifiedTradingAdvice = (expectedPips: number) => {
    if (expectedPips < 20) {
      return "⚠️ Low Impact - Avoid Trading";
    } else if (expectedPips < 40) {
      return "⚠️ Moderate - Use Tight Stops";
    } else if (expectedPips < 60) {
      return "✅ Good Opportunity";
    } else {
      return "🔥 High Impact - Large Positions";
    }
  };

  const analyze = () => {
    // Debug logging
    console.log("Analyzing:", { newsType, currency, previous, forecast });
    
    if (!newsType || previous === "" || forecast === "") {
      Alert.alert("Please fill all fields with valid data");
      return;
    }
    
    const prev = parseFloat(previous);
    const fore = parseFloat(forecast);
    
    if (isNaN(prev) || isNaN(fore)) {
      Alert.alert("Please enter valid numbers for previous and forecast");
      return;
    }

    const difference = fore - prev;
    const percentageChange = (difference / prev) * 100;

    let analysis = "";
    let sentiment = "";
    let sentimentIcon = "";
    let sentimentColor = "";

    // Enhanced sentiment analysis based on news type
    if (difference > 0) {
      sentiment = "BULLISH";
      sentimentIcon = "🚀";
      sentimentColor = "#27ae60";
      
      // News type specific analysis
      if (newsType.includes("NFP") || newsType.includes("Employment")) {
        analysis = `Strong employment data with an increase from ${previous} to ${forecast} jobs. This indicates robust economic growth and labor market strength.`;
      } else if (newsType.includes("CPI")) {
        analysis = `Higher inflation data (${previous} to ${forecast}) suggests rising price pressures, which may influence central bank policy decisions.`;
      } else if (newsType.includes("GDP")) {
        analysis = `Economic growth acceleration from ${previous}% to ${forecast}% indicates expanding economic activity and potential currency strength.`;
      } else if (newsType.includes("Interest Rate")) {
        analysis = `Interest rate increase from ${previous}% to ${forecast}% suggests tighter monetary policy, typically supporting currency strength.`;
      } else if (newsType.includes("PMI")) {
        analysis = `PMI improvement from ${previous} to ${forecast} indicates expanding business activity and economic momentum.`;
      } else if (newsType.includes("Unemployment")) {
        analysis = `Unemployment rate decrease from ${previous}% to ${forecast}% indicates improving labor market conditions and economic strength.`;
      } else if (newsType.includes("Trade Balance")) {
        analysis = `Trade balance improvement from ${previous} to ${forecast} indicates stronger export performance and economic competitiveness.`;
      } else if (newsType.includes("Retail Sales")) {
        analysis = `Retail sales increase from ${previous} to ${forecast} indicates strong consumer spending and economic growth.`;
      } else if (newsType.includes("Industrial Production")) {
        analysis = `Industrial production growth from ${previous} to ${forecast} indicates expanding manufacturing sector and economic strength.`;
      } else if (newsType.includes("Housing Starts")) {
        analysis = `Housing starts increase from ${previous} to ${forecast} indicates strong construction sector and economic growth.`;
      } else if (newsType.includes("Durable Goods")) {
        analysis = `Durable goods orders increase from ${previous} to ${forecast} indicates strong business investment and economic confidence.`;
      } else {
        analysis = `Positive data improvement from ${previous} to ${forecast} suggests economic strength and potential currency appreciation.`;
      }
    } else if (difference < 0) {
      sentiment = "BEARISH";
      sentimentIcon = "📉";
      sentimentColor = "#e74c3c";
      
      // News type specific analysis
      if (newsType.includes("NFP") || newsType.includes("Employment")) {
        analysis = `Weaker employment data with a decrease from ${previous} to ${forecast} jobs. This indicates economic slowdown and labor market weakness.`;
      } else if (newsType.includes("CPI")) {
        analysis = `Lower inflation data (${previous} to ${forecast}) suggests easing price pressures, which may influence central bank policy decisions.`;
      } else if (newsType.includes("GDP")) {
        analysis = `Economic growth slowdown from ${previous}% to ${forecast}% indicates contracting economic activity and potential currency weakness.`;
      } else if (newsType.includes("Interest Rate")) {
        analysis = `Interest rate decrease from ${previous}% to ${forecast}% suggests looser monetary policy, typically weakening currency strength.`;
      } else if (newsType.includes("PMI")) {
        analysis = `PMI decline from ${previous} to ${forecast} indicates contracting business activity and economic slowdown.`;
      } else if (newsType.includes("Unemployment")) {
        analysis = `Unemployment rate increase from ${previous}% to ${forecast}% indicates deteriorating labor market conditions and economic weakness.`;
      } else if (newsType.includes("Trade Balance")) {
        analysis = `Trade balance deterioration from ${previous} to ${forecast} indicates weaker export performance and economic competitiveness.`;
      } else if (newsType.includes("Retail Sales")) {
        analysis = `Retail sales decrease from ${previous} to ${forecast} indicates weak consumer spending and economic slowdown.`;
      } else if (newsType.includes("Industrial Production")) {
        analysis = `Industrial production decline from ${previous} to ${forecast} indicates contracting manufacturing sector and economic weakness.`;
      } else if (newsType.includes("Housing Starts")) {
        analysis = `Housing starts decrease from ${previous} to ${forecast} indicates weak construction sector and economic slowdown.`;
      } else if (newsType.includes("Durable Goods")) {
        analysis = `Durable goods orders decrease from ${previous} to ${forecast} indicates weak business investment and economic uncertainty.`;
      } else {
        analysis = `Negative data decline from ${previous} to ${forecast} suggests economic weakness and potential currency depreciation.`;
      }
    } else {
      sentiment = "NEUTRAL";
      sentimentIcon = "➡️";
      sentimentColor = "#f39c12";
      analysis = `No change in ${newsType} data (${previous} to ${forecast}). This suggests economic stability with minimal market impact.`;
    }

    const currencyImpact = getCurrencyAnalysis(currency, newsType, sentiment, difference);
    const suggestedPairs = getSuggestedPairsWithDirection(currency, newsType, sentiment);
    const expectedPips = getExpectedPips(newsType, sentiment, Math.abs(percentageChange));
    const tradingAdvice = getSimplifiedTradingAdvice(expectedPips);

    const resultText = `${sentimentIcon} ${sentiment} ANALYSIS\n\n${analysis}\n\n${currencyImpact}\n\n🎯 TRADING OPPORTUNITIES:\n\n${suggestedPairs.map(pair => `${pair.icon} ${pair.pair} | ${pair.direction} | ${pair.pips} pips`).join('\n')}\n\n📈 TOTAL EXPECTED: ${expectedPips} pips\n💡 ADVICE: ${tradingAdvice}\n\n⚠️ RISK: Trade with capital you can afford to lose. Use stop losses.`;

    // Debug logging
    console.log("Analysis Result:", { sentiment, analysis, currencyImpact, suggestedPairs, expectedPips, resultText });
    
    setResult(resultText);
  };

  const clearResults = () => {
    setResult("");
    setPrevious("");
    setForecast("");
  };

  return (
    <ScrollView 
      style={themedStyles.container}
      contentContainerStyle={themedStyles.contentContainer}
    >
      <View style={themedStyles.planContainer}>
        <View style={themedStyles.planInfo}>
          <Ionicons name="shield-checkmark" size={20} color={isPremium ? "#27ae60" : "#999"} />
          <Text style={themedStyles.planText}>Plan: {userPlan}</Text>
          <Text style={themedStyles.planStatus}>
            {isPremium ? "Premium Active" : "No Plan"}
          </Text>
        </View>
        {!isPremium && (
          <TouchableOpacity 
            style={themedStyles.upgradePlanButton}
            onPress={() => router.push("/setting/setting")}
          >
            <Ionicons name="rocket" size={16} color="#fff" />
            <Text style={themedStyles.upgradePlanText}>Upgrade</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={themedStyles.card}>
        <View style={themedStyles.newsSelector}>
          <TouchableOpacity 
            style={themedStyles.dropdownContainer}
            onPress={() => setShowNewsPicker(true)}
          >
            <View style={themedStyles.dropdownLabelRow}>
              <Ionicons name="newspaper-outline" size={20} color="#2196F3" style={themedStyles.dropdownIcon} />
              <Text style={themedStyles.dropdownLabel}>News Type</Text>
            </View>
            <View style={themedStyles.dropdownButton}>
              <Text style={themedStyles.dropdownButtonText}>{newsType}</Text>
              <Ionicons name="chevron-down" size={16} color="#666" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={themedStyles.dropdownContainer}
            onPress={() => setShowCurrencyPicker(true)}
          >
            <View style={themedStyles.dropdownLabelRow}>
              <FontAwesome5 name="money-bill-wave" size={20} color="#27ae60" style={themedStyles.dropdownIcon} />
              <Text style={themedStyles.dropdownLabel}>Currency</Text>
            </View>
            <View style={themedStyles.dropdownButton}>
              <Text style={themedStyles.dropdownButtonText}>{currency}</Text>
              <Ionicons name="chevron-down" size={16} color="#666" />
            </View>
          </TouchableOpacity>
        </View>

        <View style={themedStyles.inputContainer}>
          <View style={themedStyles.inputLabelRow}>
            <Ionicons name="trending-down-outline" size={20} color="#888" style={themedStyles.inputIcon} />
            <Text style={themedStyles.inputLabel}>Previous Value</Text>
          </View>
          <TextInput
            style={themedStyles.input}
            value={previous}
            onChangeText={setPrevious}
            placeholder="Enter previous value"
            placeholderTextColor={theme === "dark" ? "#666" : "#999"}
            keyboardType="numeric"
          />
        </View>

        <View style={themedStyles.inputContainer}>
          <View style={themedStyles.inputLabelRow}>
            <Ionicons name="trending-up-outline" size={20} color="#888" style={themedStyles.inputIcon} />
            <Text style={themedStyles.inputLabel}>Forecast Value</Text>
          </View>
          <TextInput
            style={themedStyles.input}
            value={forecast}
            onChangeText={setForecast}
            placeholder="Enter forecast value"
            placeholderTextColor={theme === "dark" ? "#666" : "#999"}
            keyboardType="numeric"
          />
        </View>

        <TouchableOpacity style={themedStyles.button} onPress={analyze}>
          <Text style={themedStyles.buttonText}>Analyze Market Impact</Text>
        </TouchableOpacity>

        {result ? (
          <View style={themedStyles.result}>
            <Text style={themedStyles.resultTitle}>Analysis Results</Text>
            <Text style={themedStyles.resultText}>{result}</Text>
            <TouchableOpacity style={themedStyles.clearButton} onPress={clearResults}>
              <Text style={themedStyles.clearButtonText}>Clear Results</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Premium Features Section */}
        <View style={themedStyles.premiumSection}>
          <Text style={themedStyles.premiumTitle}>🚀 Premium Features</Text>
          
          <View style={themedStyles.premiumGrid}>
            <TouchableOpacity 
              style={[themedStyles.premiumCard, !isPremium && themedStyles.premiumCardLocked]}
              onPress={() => getHistoricalData()}
            >
              <Text style={themedStyles.premiumIcon}>📊</Text>
              <Text style={themedStyles.premiumCardTitle}>Historical Data</Text>
              <Text style={themedStyles.premiumCardDesc}>Past market analysis</Text>
              {!isPremium && (
                <View style={themedStyles.lockOverlay}>
                  <Ionicons name="lock-closed" size={24} color="#fff" />
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[themedStyles.premiumCard, !isPremium && themedStyles.premiumCardLocked]}
              onPress={() => getCustomIndicators()}
            >
              <Text style={themedStyles.premiumIcon}>📈</Text>
              <Text style={themedStyles.premiumCardTitle}>Custom Indicators</Text>
              <Text style={themedStyles.premiumCardDesc}>RSI, MACD, Bollinger</Text>
              {!isPremium && (
                <View style={themedStyles.lockOverlay}>
                  <Ionicons name="lock-closed" size={24} color="#fff" />
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[themedStyles.premiumCard, !isPremium && themedStyles.premiumCardLocked]}
              onPress={() => getPortfolioValue()}
            >
              <Text style={themedStyles.premiumIcon}>💼</Text>
              <Text style={themedStyles.premiumCardTitle}>Portfolio Tracking</Text>
              <Text style={themedStyles.premiumCardDesc}>Track your investments</Text>
              {!isPremium && (
                <View style={themedStyles.lockOverlay}>
                  <Ionicons name="lock-closed" size={24} color="#fff" />
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[themedStyles.premiumCard, !isPremium && themedStyles.premiumCardLocked]}
              onPress={() => getAiPredictions()}
            >
              <Text style={themedStyles.premiumIcon}>🤖</Text>
              <Text style={themedStyles.premiumCardTitle}>AI Predictions</Text>
              <Text style={themedStyles.premiumCardDesc}>Advanced AI analysis</Text>
              {!isPremium && (
                <View style={themedStyles.lockOverlay}>
                  <Ionicons name="lock-closed" size={24} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* News Type Picker Modal */}
      <Modal
        visible={showNewsPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowNewsPicker(false)}
      >
        <View style={themedStyles.modalOverlay}>
          <View style={themedStyles.modalContent}>
            <View style={themedStyles.modalHeader}>
              <Text style={themedStyles.modalTitle}>Select News Type</Text>
              <TouchableOpacity onPress={() => setShowNewsPicker(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={themedStyles.pickerList}>
              {newsTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={themedStyles.pickerItem}
                  onPress={() => handleNewsTypeSelection(type)}
                >
                  <View style={themedStyles.pickerItemRow}>
                    <Text style={themedStyles.pickerItemText}>{type}</Text>
                    {!isPremium && isPremiumNewsType(type) && (
                      <View style={themedStyles.premiumIndicator}>
                        <Ionicons name="lock-closed" size={16} color="#27ae60" />
                        <Text style={themedStyles.premiumLabel}>PRO</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Currency Picker Modal */}
      <Modal
        visible={showCurrencyPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCurrencyPicker(false)}
      >
        <View style={themedStyles.modalOverlay}>
          <View style={themedStyles.modalContent}>
            <View style={themedStyles.modalHeader}>
              <Text style={themedStyles.modalTitle}>Select Currency</Text>
              <TouchableOpacity onPress={() => setShowCurrencyPicker(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={themedStyles.pickerList}>
              {currencies.map((curr) => (
                <TouchableOpacity
                  key={curr}
                  style={themedStyles.pickerItem}
                  onPress={() => {
                    setCurrency(curr);
                    setShowCurrencyPicker(false);
                  }}
                >
                  <Text style={themedStyles.pickerItemText}>{curr}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Premium Modal */}
      <Modal
        visible={showPremiumModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPremiumModal(false)}
      >
        <View style={themedStyles.modalOverlay}>
          <View style={themedStyles.modalContent}>
            <View style={themedStyles.modalHeader}>
              <Text style={themedStyles.modalTitle}>🚀 Upgrade to Premium</Text>
              <TouchableOpacity onPress={() => setShowPremiumModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={themedStyles.premiumModalContent}>
              <Text style={themedStyles.premiumModalTitle}>Unlock Advanced News Types</Text>
              <Text style={themedStyles.premiumModalDesc}>
                Get access to all news types including CPI, GDP, Interest Rate, PMI, and more. Free users can only analyze NFP data.
              </Text>
              
              <View style={themedStyles.premiumFeaturesList}>
                <View style={themedStyles.premiumFeatureItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#27ae60" />
                  <Text style={themedStyles.premiumFeatureText}>All News Types (CPI, GDP, PMI, etc.)</Text>
                </View>
                <View style={themedStyles.premiumFeatureItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#27ae60" />
                  <Text style={themedStyles.premiumFeatureText}>Historical Market Data</Text>
                </View>
                <View style={themedStyles.premiumFeatureItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#27ae60" />
                  <Text style={themedStyles.premiumFeatureText}>Custom Technical Indicators</Text>
                </View>
                <View style={themedStyles.premiumFeatureItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#27ae60" />
                  <Text style={themedStyles.premiumFeatureText}>AI Predictions</Text>
                </View>
                <View style={themedStyles.premiumFeatureItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#27ae60" />
                  <Text style={themedStyles.premiumFeatureText}>Trading Journal Access</Text>
                </View>
              </View>
              
              <TouchableOpacity 
                style={themedStyles.upgradeButton}
                onPress={navigateToSettings}
              >
                <Text style={themedStyles.upgradeButtonText}>Upgrade Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#f9f9f9",
  },
  contentContainer: {
    alignItems: "center",
  },
  planContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  planInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  planText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    marginLeft: 5,
  },
  planStatus: {
    fontSize: 12,
    color: '#666',
    marginLeft: 5,
  },
  upgradePlanButton: {
    marginLeft: 10,
    backgroundColor: '#27ae60',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  upgradePlanText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 5,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
    padding: 25,
    marginBottom: 20,
    width: "100%",
    maxWidth: 800,
  },
  newsSelector: {
    flexDirection: "row",
    gap: 15,
    marginBottom: 15,
  },
  dropdownContainer: {
    flex: 1,
    backgroundColor: "#f0f7ff",
    borderRadius: 10,
    padding: 10,
    marginHorizontal: 2,
    shadowColor: "#2196F3",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  dropdownLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  dropdownLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2196F3",
    marginLeft: 6,
  },
  dropdownIcon: {
    marginRight: 2,
  },
  dropdownButton: {
    backgroundColor: "#e3f2fd",
    borderRadius: 6,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  input: {
    width: "100%",
    padding: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 6,
    fontSize: 16,
    backgroundColor: "#f8fafc",
    color: "#222",
    marginTop: 2,
  },
  button: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 12,
    marginBottom: 8,
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  result: {
    marginTop: 25,
    padding: 20,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    borderWidth: 2,
    borderColor: "#e8f4fd",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 12,
    color: "#1a1a1a",
    textAlign: "center",
  },
  resultText: {
    fontSize: 15,
    marginBottom: 16,
    lineHeight: 22,
    color: "#2c3e50",
    letterSpacing: 0.3,
  },
  clearButton: {
    backgroundColor: "#ff4757",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 8,
    shadowColor: "#ff4757",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  clearButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  inputContainer: {
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    padding: 10,
    marginVertical: 6,
    marginBottom: 10,
    shadowColor: "#2196F3",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 5,
    elevation: 1,
  },
  inputLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#888",
    marginLeft: 6,
  },
  inputIcon: {
    marginRight: 2,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    maxWidth: 400,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: '#2c3e50',
  },
  pickerList: {
    width: '100%',
    maxHeight: 300,
  },
  pickerItem: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  pickerItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  premiumLockIcon: {
    marginLeft: 5,
  },
  pickerItemText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  premiumSection: {
    marginTop: 20,
    padding: 20,
    backgroundColor: "#f0f7ff",
    borderRadius: 10,
    shadowColor: "#2196F3",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  premiumTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2196F3",
    marginBottom: 15,
    textAlign: "center",
  },
  premiumGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    gap: 15,
  },
  premiumCard: {
    width: "45%", // Adjust as needed for 2 columns
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  premiumIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  premiumCardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
    textAlign: "center",
  },
  premiumCardDesc: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  premiumModalContent: {
    alignItems: 'center',
    padding: 20,
  },
  premiumModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
    textAlign: 'center',
  },
  premiumModalDesc: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  premiumFeaturesList: {
    width: '100%',
    marginBottom: 20,
  },
  premiumFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  premiumFeatureText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
  upgradeButton: {
    backgroundColor: '#27ae60',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#27ae60',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  premiumIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginLeft: 10,
  },
  premiumLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#27ae60',
    marginLeft: 4,
  },
  premiumCardLocked: {
    opacity: 0.6,
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

const darkStyles = StyleSheet.create({
  ...styles,
  container: {
    ...styles.container,
    backgroundColor: "#181a20",
  },
  planContainer: {
    ...styles.planContainer,
    backgroundColor: '#2c3e50',
    borderColor: '#34495e',
  },
  planInfo: {
    ...styles.planInfo,
  },
  planText: {
    ...styles.planText,
    color: '#fff',
  },
  planStatus: {
    ...styles.planStatus,
    color: '#bbb',
  },
  upgradePlanButton: {
    ...styles.upgradePlanButton,
    backgroundColor: '#27ae60',
  },
  upgradePlanText: {
    ...styles.upgradePlanText,
    color: '#fff',
  },
  card: {
    ...styles.card,
    backgroundColor: "#23262f",
  },
  label: {
    ...styles.label,
    color: "#bbb",
  },
  input: {
    ...styles.input,
    backgroundColor: "#23262f",
    color: "#fff",
    borderColor: "#333",
  },
  button: {
    ...styles.button,
    backgroundColor: "#007AFF",
  },
  buttonText: {
    ...styles.buttonText,
    color: "#fff",
  },
  result: {
    ...styles.result,
    backgroundColor: "#1a1a1a",
    borderColor: "#333",
  },
  resultTitle: {
    ...styles.resultTitle,
    color: "#ffffff",
  },
  resultText: {
    ...styles.resultText,
    color: "#e0e0e0",
  },
  clearButton: {
    ...styles.clearButton,
    backgroundColor: "#ff4757",
  },
  clearButtonText: {
    ...styles.clearButtonText,
    color: "#fff",
  },
  inputContainer: {
    ...styles.inputContainer,
    backgroundColor: "#23262f",
  },
  dropdownButton: {
    ...styles.dropdownButton,
    backgroundColor: "#23262f",
  },
  dropdownButtonText: {
    ...styles.dropdownButtonText,
    color: "#fff",
  },
  modalOverlay: {
    ...styles.modalOverlay,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalContent: {
    ...styles.modalContent,
    backgroundColor: '#23262f',
    borderColor: '#2c3e50',
  },
  modalTitle: {
    ...styles.modalTitle,
    color: '#fff',
  },
  pickerItem: {
    ...styles.pickerItem,
    borderBottomColor: '#333',
  },
  pickerItemText: {
    ...styles.pickerItemText,
    color: '#bdc3c7',
  },
  premiumSection: {
    ...styles.premiumSection,
    backgroundColor: "#23262f",
    borderColor: "#333",
  },
  premiumTitle: {
    ...styles.premiumTitle,
    color: "#2196F3",
  },
  premiumGrid: {
    ...styles.premiumGrid,
  },
  premiumCard: {
    ...styles.premiumCard,
    backgroundColor: "#333",
    borderColor: "#444",
  },
  premiumIcon: {
    ...styles.premiumIcon,
    color: "#2196F3",
  },
  premiumCardTitle: {
    ...styles.premiumCardTitle,
    color: "#fff",
  },
  premiumCardDesc: {
    ...styles.premiumCardDesc,
    color: "#bbb",
  },
  premiumModalContent: {
    ...styles.premiumModalContent,
    backgroundColor: '#23262f',
  },
  premiumModalTitle: {
    ...styles.premiumModalTitle,
    color: '#fff',
  },
  premiumModalDesc: {
    ...styles.premiumModalDesc,
    color: '#bbb',
  },
  premiumFeaturesList: {
    ...styles.premiumFeaturesList,
    backgroundColor: '#333',
  },
  premiumFeatureItem: {
    ...styles.premiumFeatureItem,
    borderBottomColor: '#444',
  },
  premiumFeatureText: {
    ...styles.premiumFeatureText,
    color: '#fff',
  },
  upgradeButton: {
    ...styles.upgradeButton,
    backgroundColor: '#27ae60',
    shadowColor: '#27ae60',
  },
  upgradeButtonText: {
    ...styles.upgradeButtonText,
    color: '#fff',
  },
  premiumCardLocked: {
    ...styles.premiumCardLocked,
    opacity: 0.6,
  },
  lockOverlay: {
    ...styles.lockOverlay,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  premiumIndicator: {
    ...styles.premiumIndicator,
    backgroundColor: '#333',
  },
  premiumLabel: {
    ...styles.premiumLabel,
    color: '#fff',
  },
});

export const screenOptions = {
  headerShown: false,
};
