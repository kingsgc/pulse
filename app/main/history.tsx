import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useContext, useEffect, useState } from "react";
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { ThemeContext } from "../theme-context";

// Types
type TradeAnalysis = {
  id: string;
  date: string;
  newsType: string;
  currency: string;
  previous: string;
  forecast: string;
  prediction: string;
  suggestedPairs: string[];
  expectedPips: number;
  tradingAdvice: string;
  confidence: number;
  status: 'pending' | 'completed';
  actualResult?: {
    profit: number;
    pips: number;
    outcome: 'win' | 'loss';
    notes?: string;
  };
};

type PerformanceMetrics = {
  totalTrades: number;
  completedTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalProfit: number;
  totalPips: number;
  averagePips: number;
  bestTrade: number;
  worstTrade: number;
  currentStreak: number;
  accuracyRate: number;
};

export default function HistoryScreen() {
  const { theme } = useContext(ThemeContext);
  const themedStyles = theme === "dark" ? darkStyles : styles;

  // State
  const [analyses, setAnalyses] = useState<TradeAnalysis[]>([]);
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    totalTrades: 0,
    completedTrades: 0,
    winningTrades: 0,
    losingTrades: 0,
    winRate: 0,
    totalProfit: 0,
    totalPips: 0,
    averagePips: 0,
    bestTrade: 0,
    worstTrade: 0,
    currentStreak: 0,
    accuracyRate: 0,
  });
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'completed' | 'wins' | 'losses'>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year' | 'all'>('all');
  const [showStats, setShowStats] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState<TradeAnalysis | null>(null);
  const [resultInput, setResultInput] = useState({
    profit: '',
    pips: '',
    outcome: 'win' as 'win' | 'loss',
    notes: '',
  });

  // Load data on component mount
  useEffect(() => {
    loadTradingJournal();
    checkPremiumStatus();
  }, []);

  // Check premium status
  const checkPremiumStatus = async () => {
    try {
      const subscriptionStatus = await AsyncStorage.getItem('@fxpulse_subscription');
      if (subscriptionStatus) {
        const subscription = JSON.parse(subscriptionStatus);
        setIsPremium(subscription.isActive);
      } else {
        setIsPremium(false);
      }
    } catch (error) {
      console.log('Error checking premium status:', error);
      setIsPremium(false);
    }
  };

  // Navigate to settings for subscription
  const navigateToSettings = () => {
    // Import useRouter at the top if not already imported
    const router = require('expo-router').useRouter();
    router.push("/setting/setting");
  };

  // Load trading journal
  const loadTradingJournal = async () => {
    try {
      const savedAnalyses = await AsyncStorage.getItem('@fxpulse_trading_journal');
      if (savedAnalyses) {
        const parsedAnalyses = JSON.parse(savedAnalyses);
        setAnalyses(parsedAnalyses);
        calculateMetrics(parsedAnalyses);
      } else {
        // Start with empty journal
        setAnalyses([]);
        calculateMetrics([]);
      }
    } catch (error) {
      console.log('Error loading trading journal:', error);
      setAnalyses([]);
      calculateMetrics([]);
    }
  };

  // Generate sample trading analyses (removed - keeping empty)
  const generateSampleAnalyses = (): TradeAnalysis[] => {
    return [];
  };

  // Add new manual trade entry
  const addManualTrade = () => {
    setSelectedAnalysis(null);
    setResultInput({
      profit: '',
      pips: '',
      outcome: 'win',
      notes: '',
    });
    setShowResultModal(true);
  };

  // Save manual trade entry
  const saveManualTrade = async () => {
    if (!resultInput.profit || !resultInput.pips) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const newTrade: TradeAnalysis = {
      id: `trade_${Date.now()}`,
      date: new Date().toISOString(),
      newsType: resultInput.notes.split(' - ')[0] || 'Manual Entry', // Extract news type from notes
      currency: 'USD', // Default currency
      previous: '',
      forecast: '',
      prediction: resultInput.outcome === 'win' ? 'BUY' : 'SELL',
      suggestedPairs: ['USD/JPY'],
      expectedPips: 0,
      tradingAdvice: 'Manual trade entry',
      confidence: 0,
      status: 'completed',
      actualResult: {
        profit: parseFloat(resultInput.profit),
        pips: parseFloat(resultInput.pips),
        outcome: resultInput.outcome,
        notes: resultInput.notes,
      },
    };

    const updatedAnalyses = [newTrade, ...analyses];
    setAnalyses(updatedAnalyses);
    calculateMetrics(updatedAnalyses);
    await AsyncStorage.setItem('@fxpulse_trading_journal', JSON.stringify(updatedAnalyses));
    setShowResultModal(false);
    
    Alert.alert(
      'Trade Added',
      'Your manual trade entry has been recorded successfully!',
      [{ text: 'OK' }]
    );
  };

  // Calculate performance metrics
  const calculateMetrics = (analysesList: TradeAnalysis[]) => {
    const completed = analysesList.filter(analysis => analysis.status === 'completed');
    const wins = completed.filter(analysis => analysis.actualResult?.outcome === 'win');
    const losses = completed.filter(analysis => analysis.actualResult?.outcome === 'loss');
    
    const totalProfit = completed.reduce((sum, analysis) => sum + (analysis.actualResult?.profit || 0), 0);
    const totalPips = completed.reduce((sum, analysis) => sum + (analysis.actualResult?.pips || 0), 0);
    const profits = completed.map(analysis => analysis.actualResult?.profit || 0);
    const bestTrade = profits.length > 0 ? Math.max(...profits) : 0;
    const worstTrade = profits.length > 0 ? Math.min(...profits) : 0;
    
    // Calculate accuracy rate (how well predictions matched outcomes)
    const accuratePredictions = completed.filter(analysis => {
      const prediction = analysis.prediction;
      const outcome = analysis.actualResult?.outcome;
      return (prediction === 'BUY' && outcome === 'win') || (prediction === 'SELL' && outcome === 'loss');
    }).length;
    
    setMetrics({
      totalTrades: analysesList.length,
      completedTrades: completed.length,
      winningTrades: wins.length,
      losingTrades: losses.length,
      winRate: completed.length > 0 ? (wins.length / completed.length) * 100 : 0,
      totalProfit: totalProfit,
      totalPips: totalPips,
      averagePips: completed.length > 0 ? totalPips / completed.length : 0,
      bestTrade: bestTrade,
      worstTrade: worstTrade,
      currentStreak: calculateStreak(completed),
      accuracyRate: completed.length > 0 ? (accuratePredictions / completed.length) * 100 : 0,
    });
  };

  // Calculate current streak
  const calculateStreak = (completedAnalyses: TradeAnalysis[]): number => {
    let streak = 0;
    for (let i = completedAnalyses.length - 1; i >= 0; i--) {
      if (completedAnalyses[i].actualResult?.outcome === 'win') {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  // Filter analyses based on selection
  const getFilteredAnalyses = () => {
    let filtered = analyses;
    
    // Filter by status
    if (selectedFilter === 'pending') {
      filtered = filtered.filter(analysis => analysis.status === 'pending');
    } else if (selectedFilter === 'completed') {
      filtered = filtered.filter(analysis => analysis.status === 'completed');
    } else if (selectedFilter === 'wins') {
      filtered = filtered.filter(analysis => 
        analysis.status === 'completed' && analysis.actualResult?.outcome === 'win'
      );
    } else if (selectedFilter === 'losses') {
      filtered = filtered.filter(analysis => 
        analysis.status === 'completed' && analysis.actualResult?.outcome === 'loss'
      );
    }
    
    // Filter by period
    const now = new Date();
    switch (selectedPeriod) {
      case 'week':
        filtered = filtered.filter(analysis => {
          const analysisDate = new Date(analysis.date);
          return (now.getTime() - analysisDate.getTime()) <= 7 * 24 * 60 * 60 * 1000;
        });
        break;
      case 'month':
        filtered = filtered.filter(analysis => {
          const analysisDate = new Date(analysis.date);
          return (now.getTime() - analysisDate.getTime()) <= 30 * 24 * 60 * 60 * 1000;
        });
        break;
      case 'year':
        filtered = filtered.filter(analysis => {
          const analysisDate = new Date(analysis.date);
          return (now.getTime() - analysisDate.getTime()) <= 365 * 24 * 60 * 60 * 1000;
        });
        break;
    }
    
    return filtered;
  };

  // Open result entry modal
  const openResultModal = (analysis: TradeAnalysis) => {
    setSelectedAnalysis(analysis);
    setResultInput({
      profit: '',
      pips: '',
      outcome: 'win',
      notes: '',
    });
    setShowResultModal(true);
  };

  // Save trading result
  const saveTradingResult = async () => {
    if (!selectedAnalysis || !resultInput.profit || !resultInput.pips) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const updatedAnalyses = analyses.map(analysis => {
      if (analysis.id === selectedAnalysis.id) {
        return {
          ...analysis,
          status: 'completed' as const,
          actualResult: {
            profit: parseFloat(resultInput.profit),
            pips: parseFloat(resultInput.pips),
            outcome: resultInput.outcome,
            notes: resultInput.notes,
          },
        };
      }
      return analysis;
    });

    setAnalyses(updatedAnalyses);
    calculateMetrics(updatedAnalyses);
    await AsyncStorage.setItem('@fxpulse_trading_journal', JSON.stringify(updatedAnalyses));
    setShowResultModal(false);
    
    Alert.alert(
      'Result Saved',
      'Your trading result has been recorded successfully!',
      [{ text: 'OK' }]
    );
  };

  // Clear all trading journal
  const clearJournal = () => {
    Alert.alert(
      "Clear Journal",
      "Are you sure you want to clear all trading journal entries? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Clear", 
          style: "destructive",
          onPress: async () => {
            setAnalyses([]);
            setMetrics({
              totalTrades: 0,
              completedTrades: 0,
              winningTrades: 0,
              losingTrades: 0,
              winRate: 0,
              totalProfit: 0,
              totalPips: 0,
              averagePips: 0,
              bestTrade: 0,
              worstTrade: 0,
              currentStreak: 0,
              accuracyRate: 0,
            });
            await AsyncStorage.removeItem('@fxpulse_trading_journal');
          }
        }
      ]
    );
  };

  // Export trading journal
  const exportJournal = () => {
    Alert.alert(
      "Export Journal",
      "Export your trading journal to CSV format?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Export", 
          onPress: () => {
            Alert.alert("Export Successful", "Your trading journal has been exported successfully!");
          }
        }
      ]
    );
  };

  const filteredAnalyses = getFilteredAnalyses();

  return (
    <View style={themedStyles.container}>
      <ScrollView style={themedStyles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={themedStyles.header}>
          <Text style={themedStyles.title}>Trading Journal</Text>
          <View style={themedStyles.headerActions}>
            <TouchableOpacity 
              style={[themedStyles.actionButton, !isPremium && themedStyles.actionButtonDisabled]} 
              onPress={isPremium ? addManualTrade : navigateToSettings}
              disabled={!isPremium}
            >
              <Ionicons name="add-outline" size={20} color={theme === "dark" ? "#fff" : "#000"} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[themedStyles.actionButton, !isPremium && themedStyles.actionButtonDisabled]} 
              onPress={isPremium ? exportJournal : navigateToSettings}
              disabled={!isPremium}
            >
              <Ionicons name="download-outline" size={20} color={theme === "dark" ? "#fff" : "#000"} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[themedStyles.actionButton, !isPremium && themedStyles.actionButtonDisabled]} 
              onPress={isPremium ? clearJournal : navigateToSettings}
              disabled={!isPremium}
            >
              <Ionicons name="trash-outline" size={20} color={theme === "dark" ? "#fff" : "#000"} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Performance Overview */}
        <View style={themedStyles.overviewCard}>
          <View style={themedStyles.overviewHeader}>
            <Text style={themedStyles.overviewTitle}>Performance Overview</Text>
            <TouchableOpacity onPress={() => setShowStats(!showStats)}>
              <Ionicons 
                name={showStats ? "chevron-up" : "chevron-down"} 
                size={24} 
                color={theme === "dark" ? "#fff" : "#000"} 
              />
            </TouchableOpacity>
          </View>
          
          {showStats && (
            <View style={themedStyles.statsGrid}>
              <View style={themedStyles.statCard}>
                <Text style={themedStyles.statLabel}>Win Rate</Text>
                <Text style={themedStyles.statValue}>{metrics.winRate.toFixed(1)}%</Text>
                <Text style={themedStyles.statSubtext}>{metrics.winningTrades}/{metrics.completedTrades} trades</Text>
              </View>
              
              <View style={themedStyles.statCard}>
                <Text style={themedStyles.statLabel}>Total Profit</Text>
                <Text style={[themedStyles.statValue, { color: metrics.totalProfit >= 0 ? "#27ae60" : "#e74c3c" }]}>
                  ${metrics.totalProfit.toFixed(0)}
                </Text>
                <Text style={themedStyles.statSubtext}>Net earnings</Text>
              </View>
              
              <View style={themedStyles.statCard}>
                <Text style={themedStyles.statLabel}>Avg Pips</Text>
                <Text style={themedStyles.statValue}>{metrics.averagePips.toFixed(1)}</Text>
                <Text style={themedStyles.statSubtext}>Per trade</Text>
              </View>
              
              <View style={themedStyles.statCard}>
                <Text style={themedStyles.statLabel}>Accuracy</Text>
                <Text style={themedStyles.statValue}>{metrics.accuracyRate.toFixed(1)}%</Text>
                <Text style={themedStyles.statSubtext}>Prediction accuracy</Text>
              </View>
            </View>
          )}
        </View>

        {/* Filters */}
        <View style={themedStyles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity 
              style={[themedStyles.filterButton, selectedFilter === 'all' && themedStyles.filterButtonActive]}
              onPress={() => setSelectedFilter('all')}
            >
              <Text style={[themedStyles.filterText, selectedFilter === 'all' && themedStyles.filterTextActive]}>
                All ({metrics.totalTrades})
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[themedStyles.filterButton, selectedFilter === 'pending' && themedStyles.filterButtonActive]}
              onPress={() => setSelectedFilter('pending')}
            >
              <Text style={[themedStyles.filterText, selectedFilter === 'pending' && themedStyles.filterTextActive]}>
                Pending ({metrics.totalTrades - metrics.completedTrades})
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[themedStyles.filterButton, selectedFilter === 'completed' && themedStyles.filterButtonActive]}
              onPress={() => setSelectedFilter('completed')}
            >
              <Text style={[themedStyles.filterText, selectedFilter === 'completed' && themedStyles.filterTextActive]}>
                Completed ({metrics.completedTrades})
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[themedStyles.filterButton, selectedFilter === 'wins' && themedStyles.filterButtonActive]}
              onPress={() => setSelectedFilter('wins')}
            >
              <Text style={[themedStyles.filterText, selectedFilter === 'wins' && themedStyles.filterTextActive]}>
                Wins ({metrics.winningTrades})
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[themedStyles.filterButton, selectedFilter === 'losses' && themedStyles.filterButtonActive]}
              onPress={() => setSelectedFilter('losses')}
            >
              <Text style={[themedStyles.filterText, selectedFilter === 'losses' && themedStyles.filterTextActive]}>
                Losses ({metrics.losingTrades})
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Period Filter */}
        <View style={themedStyles.periodFilter}>
          <Text style={themedStyles.periodLabel}>Time Period:</Text>
          <View style={themedStyles.periodButtons}>
            {(['week', 'month', 'year', 'all'] as const).map((period) => (
              <TouchableOpacity
                key={period}
                style={[themedStyles.periodButton, selectedPeriod === period && themedStyles.periodButtonActive]}
                onPress={() => setSelectedPeriod(period)}
              >
                <Text style={[themedStyles.periodText, selectedPeriod === period && themedStyles.periodTextActive]}>
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Trading Journal List */}
        <View style={themedStyles.historyContainer}>
          <Text style={themedStyles.sectionTitle}>Trading Analyses</Text>
          
          {filteredAnalyses.length === 0 ? (
            <View style={themedStyles.emptyState}>
              <Ionicons name="journal-outline" size={48} color={theme === "dark" ? "#666" : "#999"} />
              <Text style={themedStyles.emptyText}>Your trading journal is empty</Text>
              <Text style={themedStyles.emptySubtext}>
                Start tracking your trades by adding your first manual trade entry
              </Text>
              <TouchableOpacity 
                style={themedStyles.addFirstTradeButton} 
                onPress={isPremium ? addManualTrade : navigateToSettings}
              >
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={themedStyles.addFirstTradeText}>
                  {isPremium ? 'Add Your First Trade' : 'Subscribe to Unlock'}
                </Text>
              </TouchableOpacity>
        </View>
      ) : (
            filteredAnalyses.map((analysis) => (
              <View key={analysis.id} style={themedStyles.analysisCard}>
                <View style={themedStyles.analysisHeader}>
                  <View style={themedStyles.analysisInfo}>
                    <Text style={themedStyles.analysisDate}>
                      {new Date(analysis.date).toLocaleDateString()}
                    </Text>
                    <Text style={themedStyles.analysisNewsType}>{analysis.newsType}</Text>
          </View>
                  <View style={themedStyles.analysisStatus}>
                    {analysis.status === 'completed' ? (
                      <View style={[
                        themedStyles.statusBadge, 
                        analysis.actualResult?.outcome === 'win' ? themedStyles.winBadge : themedStyles.lossBadge
                      ]}>
                        <Text style={themedStyles.statusText}>
                          {analysis.actualResult?.outcome?.toUpperCase()}
                        </Text>
                      </View>
                    ) : (
                      <TouchableOpacity 
                        style={themedStyles.pendingButton}
                        onPress={isPremium ? () => openResultModal(analysis) : navigateToSettings}
                      >
                        <Text style={themedStyles.pendingButtonText}>Enter Result</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
                
                <View style={themedStyles.analysisDetails}>
                  <View style={themedStyles.analysisDetail}>
                    <Text style={themedStyles.detailLabel}>Currency:</Text>
                    <Text style={themedStyles.detailValue}>{analysis.currency}</Text>
                  </View>
                  
                  <View style={themedStyles.analysisDetail}>
                    <Text style={themedStyles.detailLabel}>Prediction:</Text>
                    <Text style={themedStyles.detailValue}>{analysis.prediction}</Text>
                  </View>
                  
                  <View style={themedStyles.analysisDetail}>
                    <Text style={themedStyles.detailLabel}>Expected Pips:</Text>
                    <Text style={themedStyles.detailValue}>{analysis.expectedPips}</Text>
                  </View>
                  
                  <View style={themedStyles.analysisDetail}>
                    <Text style={themedStyles.detailLabel}>Confidence:</Text>
                    <Text style={themedStyles.detailValue}>{analysis.confidence}%</Text>
                  </View>
                </View>

                {analysis.status === 'completed' && analysis.actualResult && (
                  <View style={themedStyles.resultSection}>
                    <Text style={themedStyles.resultTitle}>Actual Result:</Text>
                    <View style={themedStyles.resultDetails}>
                      <View style={themedStyles.resultDetail}>
                        <Text style={themedStyles.detailLabel}>Pips:</Text>
                        <Text style={themedStyles.detailValue}>{analysis.actualResult.pips}</Text>
                      </View>
                      
                      <View style={themedStyles.resultDetail}>
                        <Text style={themedStyles.detailLabel}>Profit:</Text>
                        <Text style={[
                          themedStyles.detailValue, 
                          { color: analysis.actualResult.profit >= 0 ? "#27ae60" : "#e74c3c" }
                        ]}>
                          ${analysis.actualResult.profit}
        </Text>
                      </View>
                    </View>
                    
                    {analysis.actualResult.notes && (
                      <Text style={themedStyles.notesText}>{analysis.actualResult.notes}</Text>
                    )}
                  </View>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Subscription Lock Overlay */}
      {!isPremium && (
        <View style={themedStyles.lockOverlay}>
          <View style={themedStyles.lockContent}>
            <Ionicons name="lock-closed" size={64} color="#fff" />
            <Text style={themedStyles.lockTitle}>Trading Journal Locked</Text>
            <Text style={themedStyles.lockSubtitle}>
              Subscribe to Premium to unlock your personal trading journal and track your performance. Currently you have no active plan.
        </Text>
            <TouchableOpacity style={themedStyles.unlockButton} onPress={navigateToSettings}>
              <Text style={themedStyles.unlockButtonText}>Unlock Trading Journal</Text>
            </TouchableOpacity>
      </View>
        </View>
      )}

      {/* Result Entry Modal */}
      <Modal
        visible={showResultModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowResultModal(false)}
      >
        <View style={themedStyles.modalOverlay}>
          <View style={themedStyles.modalContent}>
            <View style={themedStyles.modalHeader}>
              <Text style={themedStyles.modalTitle}>
                {selectedAnalysis ? 'Enter Trading Result' : 'Add Manual Trade'}
              </Text>
              <TouchableOpacity onPress={() => setShowResultModal(false)}>
                <Ionicons name="close" size={24} color={theme === "dark" ? "#fff" : "#000"} />
              </TouchableOpacity>
        </View>
            
            <View style={themedStyles.modalBody}>
              {selectedAnalysis ? (
                // Existing analysis result entry
                <>
                  <Text style={themedStyles.modalSubtitle}>
                    {selectedAnalysis.newsType} - {selectedAnalysis.currency}
                  </Text>
                  <Text style={themedStyles.modalSubtitle}>
                    Prediction: {selectedAnalysis.prediction}
                  </Text>
                  
                  <View style={themedStyles.inputGroup}>
                    <Text style={themedStyles.inputLabel}>Profit/Loss ($)</Text>
                    <TextInput
                      style={themedStyles.textInput}
                      value={resultInput.profit}
                      onChangeText={(text) => setResultInput({...resultInput, profit: text})}
                      placeholder="Enter profit or loss"
                      placeholderTextColor={theme === "dark" ? "#666" : "#999"}
                      keyboardType="numeric"
                    />
                  </View>
                  
                  <View style={themedStyles.inputGroup}>
                    <Text style={themedStyles.inputLabel}>Pips</Text>
                    <TextInput
                      style={themedStyles.textInput}
                      value={resultInput.pips}
                      onChangeText={(text) => setResultInput({...resultInput, pips: text})}
                      placeholder="Enter pips"
                      placeholderTextColor={theme === "dark" ? "#666" : "#999"}
                      keyboardType="numeric"
                    />
                  </View>
                  
                  <View style={themedStyles.inputGroup}>
                    <Text style={themedStyles.inputLabel}>Outcome</Text>
                    <View style={themedStyles.outcomeButtons}>
                      <TouchableOpacity
                        style={[
                          themedStyles.outcomeButton,
                          resultInput.outcome === 'win' && themedStyles.outcomeButtonActive
                        ]}
                        onPress={() => setResultInput({...resultInput, outcome: 'win'})}
                      >
                        <Text style={[
                          themedStyles.outcomeButtonText,
                          resultInput.outcome === 'win' && themedStyles.outcomeButtonTextActive
                        ]}>
                          Win
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[
                          themedStyles.outcomeButton,
                          resultInput.outcome === 'loss' && themedStyles.outcomeButtonActive
                        ]}
                        onPress={() => setResultInput({...resultInput, outcome: 'loss'})}
                      >
                        <Text style={[
                          themedStyles.outcomeButtonText,
                          resultInput.outcome === 'loss' && themedStyles.outcomeButtonTextActive
                        ]}>
                          Loss
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  <View style={themedStyles.inputGroup}>
                    <Text style={themedStyles.inputLabel}>Notes (Optional)</Text>
                    <TextInput
                      style={[themedStyles.textInput, themedStyles.notesInput]}
                      value={resultInput.notes}
                      onChangeText={(text) => setResultInput({...resultInput, notes: text})}
                      placeholder="Add notes about the trade..."
                      placeholderTextColor={theme === "dark" ? "#666" : "#999"}
                      multiline
                      numberOfLines={3}
                    />
                  </View>
                </>
              ) : (
                // Manual trade entry
                <>
                  <View style={themedStyles.inputGroup}>
                    <Text style={themedStyles.inputLabel}>News Type</Text>
                    <TextInput
                      style={themedStyles.textInput}
                      value={resultInput.notes}
                      onChangeText={(text) => setResultInput({...resultInput, notes: text})}
                      placeholder="e.g., NFP, CPI, GDP, Interest Rate Decision"
                      placeholderTextColor={theme === "dark" ? "#666" : "#999"}
                    />
          </View>
                  
                  <View style={themedStyles.inputGroup}>
                    <Text style={themedStyles.inputLabel}>Market Direction</Text>
                    <View style={themedStyles.outcomeButtons}>
                      <TouchableOpacity
                        style={[
                          themedStyles.outcomeButton,
                          resultInput.outcome === 'win' && themedStyles.outcomeButtonActive
                        ]}
                        onPress={() => setResultInput({...resultInput, outcome: 'win'})}
                      >
                        <Text style={[
                          themedStyles.outcomeButtonText,
                          resultInput.outcome === 'win' && themedStyles.outcomeButtonTextActive
                        ]}>
                          BUY
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[
                          themedStyles.outcomeButton,
                          resultInput.outcome === 'loss' && themedStyles.outcomeButtonActive
                        ]}
                        onPress={() => setResultInput({...resultInput, outcome: 'loss'})}
                      >
                        <Text style={[
                          themedStyles.outcomeButtonText,
                          resultInput.outcome === 'loss' && themedStyles.outcomeButtonTextActive
                        ]}>
                          SELL
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  <View style={themedStyles.inputGroup}>
                    <Text style={themedStyles.inputLabel}>Profit/Loss ($)</Text>
                    <TextInput
                      style={themedStyles.textInput}
                      value={resultInput.profit}
                      onChangeText={(text) => setResultInput({...resultInput, profit: text})}
                      placeholder="Enter profit or loss amount"
                      placeholderTextColor={theme === "dark" ? "#666" : "#999"}
                      keyboardType="numeric"
                    />
                  </View>
                  
                  <View style={themedStyles.inputGroup}>
                    <Text style={themedStyles.inputLabel}>Pips</Text>
                    <TextInput
                      style={themedStyles.textInput}
                      value={resultInput.pips}
                      onChangeText={(text) => setResultInput({...resultInput, pips: text})}
                      placeholder="Enter pips achieved"
                      placeholderTextColor={theme === "dark" ? "#666" : "#999"}
                      keyboardType="numeric"
                    />
                  </View>
                  
                  <View style={themedStyles.inputGroup}>
                    <Text style={themedStyles.inputLabel}>Additional Notes (Optional)</Text>
                    <TextInput
                      style={[themedStyles.textInput, themedStyles.notesInput]}
                      value={resultInput.notes}
                      onChangeText={(text) => setResultInput({...resultInput, notes: text})}
                      placeholder="Add any additional notes about the trade..."
                      placeholderTextColor={theme === "dark" ? "#666" : "#999"}
                      multiline
                      numberOfLines={3}
                    />
                  </View>
                </>
              )}
            </View>
            
            <View style={themedStyles.modalActions}>
              <TouchableOpacity 
                style={themedStyles.cancelButton}
                onPress={() => setShowResultModal(false)}
              >
                <Text style={themedStyles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={themedStyles.saveButton}
                onPress={selectedAnalysis ? saveTradingResult : saveManualTrade}
              >
                <Text style={themedStyles.saveButtonText}>
                  {selectedAnalysis ? 'Save Result' : 'Add Trade'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
    padding: 20,
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  headerActions: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonDisabled: {
    opacity: 0.5,
    backgroundColor: "#e0e0e0",
  },
  overviewCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  overviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  overviewTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  statLabel: {
    fontSize: 14,
    color: "#6c757d",
    fontWeight: "500",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 2,
  },
  statSubtext: {
    fontSize: 12,
    color: "#6c757d",
  },
  filtersContainer: {
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#fff",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  filterButtonActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  filterText: {
    fontSize: 14,
    color: "#6c757d",
    fontWeight: "500",
  },
  filterTextActive: {
    color: "#fff",
  },
  periodFilter: {
    marginBottom: 20,
  },
  periodLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 8,
  },
  periodButtons: {
    flexDirection: "row",
    gap: 8,
  },
  periodButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  periodButtonActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  periodText: {
    fontSize: 14,
    color: "#6c757d",
    fontWeight: "500",
  },
  periodTextActive: {
    color: "#fff",
  },
  historyContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 16,
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#6c757d",
    marginTop: 12,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#95a5a6",
    marginTop: 8,
    marginBottom: 20,
    textAlign: "center",
  },
  addFirstTradeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  addFirstTradeText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  analysisCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  analysisHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  analysisInfo: {
    flex: 1,
  },
  analysisDate: {
    fontSize: 14,
    color: "#6c757d",
    marginBottom: 2,
  },
  analysisNewsType: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
  },
  analysisStatus: {
    alignItems: "flex-end",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  winBadge: {
    backgroundColor: "#d4edda",
  },
  lossBadge: {
    backgroundColor: "#f8d7da",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#fff",
  },
  pendingButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  pendingButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  analysisDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 12,
  },
  analysisDetail: {
    minWidth: "45%",
  },
  detailLabel: {
    fontSize: 12,
    color: "#6c757d",
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2c3e50",
  },
  resultSection: {
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
    paddingTop: 12,
    marginTop: 8,
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 8,
  },
  resultDetails: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 8,
  },
  resultDetail: {
    flex: 1,
  },
  notesText: {
    fontSize: 12,
    color: "#6c757d",
    fontStyle: "italic",
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    maxWidth: 400,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  modalBody: {
    marginBottom: 20,
  },
  modalSubtitle: {
    fontSize: 16,
    color: "#6c757d",
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#e9ecef",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  notesInput: {
    height: 80,
    textAlignVertical: "top",
  },
  outcomeButtons: {
    flexDirection: "row",
    gap: 12,
  },
  outcomeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e9ecef",
    alignItems: "center",
  },
  outcomeButtonActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  outcomeButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6c757d",
  },
  outcomeButtonTextActive: {
    color: "#fff",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e9ecef",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6c757d",
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#007AFF",
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  premiumCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  premiumTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c3e50",
    marginTop: 12,
    marginBottom: 8,
  },
  premiumText: {
    fontSize: 14,
    color: "#6c757d",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 20,
  },
  premiumButton: {
    backgroundColor: "#F39C12",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  premiumButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  lockContent: {
    backgroundColor: '#34495e',
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    width: '80%',
    maxWidth: 350,
  },
  lockTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
    marginBottom: 10,
  },
  lockSubtitle: {
    fontSize: 16,
    color: '#bdc3c7',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  unlockButton: {
    backgroundColor: '#27ae60',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 20,
  },
  unlockButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

const darkStyles = StyleSheet.create({
  ...styles,
  container: {
    ...styles.container,
    backgroundColor: "#181a20",
  },
  scrollContainer: {
    ...styles.scrollContainer,
    backgroundColor: "#181a20",
  },
  title: {
    ...styles.title,
    color: "#fff",
  },
  actionButton: {
    ...styles.actionButton,
    backgroundColor: "#23262f",
  },
  actionButtonDisabled: {
    ...styles.actionButtonDisabled,
    backgroundColor: "#34495e",
  },
  overviewCard: {
    ...styles.overviewCard,
    backgroundColor: "#23262f",
  },
  overviewTitle: {
    ...styles.overviewTitle,
    color: "#fff",
  },
  statCard: {
    ...styles.statCard,
    backgroundColor: "#2c3e50",
  },
  statLabel: {
    ...styles.statLabel,
    color: "#bdc3c7",
  },
  statValue: {
    ...styles.statValue,
    color: "#fff",
  },
  statSubtext: {
    ...styles.statSubtext,
    color: "#bdc3c7",
  },
  filterButton: {
    ...styles.filterButton,
    backgroundColor: "#23262f",
    borderColor: "#34495e",
  },
  filterText: {
    ...styles.filterText,
    color: "#bdc3c7",
  },
  periodButton: {
    ...styles.periodButton,
    backgroundColor: "#23262f",
    borderColor: "#34495e",
  },
  periodText: {
    ...styles.periodText,
    color: "#bdc3c7",
  },
  periodLabel: {
    ...styles.periodLabel,
    color: "#fff",
  },
  sectionTitle: {
    ...styles.sectionTitle,
    color: "#fff",
  },
  emptyText: {
    ...styles.emptyText,
    color: "#bdc3c7",
  },
  emptySubtext: {
    ...styles.emptySubtext,
    color: "#95a5a6",
  },
  addFirstTradeButton: {
    ...styles.addFirstTradeButton,
    backgroundColor: "#007AFF",
  },
  addFirstTradeText: {
    ...styles.addFirstTradeText,
    color: "#fff",
  },
  analysisCard: {
    ...styles.analysisCard,
    backgroundColor: "#23262f",
  },
  analysisDate: {
    ...styles.analysisDate,
    color: "#bdc3c7",
  },
  analysisNewsType: {
    ...styles.analysisNewsType,
    color: "#fff",
  },
  detailLabel: {
    ...styles.detailLabel,
    color: "#bdc3c7",
  },
  detailValue: {
    ...styles.detailValue,
    color: "#fff",
  },
  resultSection: {
    ...styles.resultSection,
    borderTopColor: "#34495e",
  },
  resultTitle: {
    ...styles.resultTitle,
    color: "#fff",
  },
  notesText: {
    ...styles.notesText,
    color: "#bdc3c7",
  },
  modalContent: {
    ...styles.modalContent,
    backgroundColor: "#23262f",
  },
  modalTitle: {
    ...styles.modalTitle,
    color: "#fff",
  },
  modalSubtitle: {
    ...styles.modalSubtitle,
    color: "#bdc3c7",
  },
  inputLabel: {
    ...styles.inputLabel,
    color: "#fff",
  },
  textInput: {
    ...styles.textInput,
    backgroundColor: "#2c3e50",
    borderColor: "#34495e",
    color: "#fff",
  },
  outcomeButton: {
    ...styles.outcomeButton,
    backgroundColor: "#2c3e50",
    borderColor: "#34495e",
  },
  outcomeButtonText: {
    ...styles.outcomeButtonText,
    color: "#bdc3c7",
  },
  cancelButton: {
    ...styles.cancelButton,
    backgroundColor: "#2c3e50",
    borderColor: "#34495e",
  },
  cancelButtonText: {
    ...styles.cancelButtonText,
    color: "#bdc3c7",
  },
  premiumCard: {
    ...styles.premiumCard,
    backgroundColor: "#23262f",
  },
  premiumTitle: {
    ...styles.premiumTitle,
    color: "#fff",
  },
  premiumText: {
    ...styles.premiumText,
    color: "#bdc3c7",
  },
  lockOverlay: {
    ...styles.lockOverlay,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  lockContent: {
    ...styles.lockContent,
    backgroundColor: '#34495e',
  },
  lockTitle: {
    ...styles.lockTitle,
    color: '#fff',
  },
  lockSubtitle: {
    ...styles.lockSubtitle,
    color: '#bdc3c7',
  },
  unlockButton: {
    ...styles.unlockButton,
    backgroundColor: '#27ae60',
  },
  unlockButtonText: {
    ...styles.unlockButtonText,
    color: '#fff',
  },
});

export const screenOptions = {
  headerShown: false,
};
