import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import { apiService } from "../../../services/api";

// Fallback images for when the server image is not available
const fallbackImages = [
  require("../../assets/images/news1.png"),
  require("../../assets/images/news2.png"),
  require("../../assets/images/news3.png"),
];

// Define the VotingItem type
interface VotingOption {
  id: string;
  text: string;
  votes: number;
}

interface VotingItem {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  options: VotingOption[];
  targetLevel: string;
  voteType: string;
  status: string;
  hasVoted?: boolean;
  userVote?: string | null;
  totalVotes?: number;
}

export default function OpinionVoting() {
  const router = useRouter();
  const [votingItems, setVotingItems] = useState<VotingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [submittingVote, setSubmittingVote] = useState<string | null>(null);

  // Function to fetch voting items from the API (hierarchy-aware)
  const fetchVotingItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getVotingItemsHierarchical();
      console.log("Fetched voting items (hierarchical):", data);
      
      // Filter for opinion voting items only
      const opinionVotings = data.filter((item: VotingItem) => 
        item.voteType === "opinion" || !item.voteType // Include items without voteType for backward compatibility
      );
      
      // Check if options have proper IDs
      opinionVotings.forEach((item: VotingItem) => {
        console.log(`Voting item ${item.id} options:`, item.options);
        if (item.options) {
          item.options.forEach((option, index) => {
            if (!option.id) {
              console.warn(`Option at index ${index} in voting item ${item.id} has no ID!`);
              // Ensure each option has an ID
              option.id = `option-${index}`;
            }
          });
        }
      });
      
      setVotingItems(opinionVotings);
    } catch (err: any) {
      console.error("Error fetching voting items:", err);
      setError(err.message || "Failed to fetch voting items");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch voting items on component mount
  useEffect(() => {
    fetchVotingItems();
  }, []);
  
  // Log when selectedOptions changes
  useEffect(() => {
    console.log("selectedOptions changed:", selectedOptions);
  }, [selectedOptions]);

  // Handle refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchVotingItems();
  };

  // Get a fallback image based on voting ID
  const getFallbackImage = (id: string) => {
    const index = parseInt(id.substring(0, 8), 16) % fallbackImages.length;
    return fallbackImages[index] || fallbackImages[0];
  };

  // Filter active and previous polls
  const activePolls = votingItems.filter(
    item => item.status === "active" || item.status === "upcoming"
  );
  
  const previousPolls = votingItems.filter(
    item => item.status === "closed"
  );

  const selectOption = (pollId: string, optionId: string) => {
    console.log(`Selecting option ${optionId} for poll ${pollId}`);
    setSelectedOptions(prev => {
      const updated = {
        ...prev,
        [pollId]: optionId,
      };
      console.log('Updated selectedOptions:', updated);
      return updated;
    });
  };
  
  // Function to submit a vote
  const handleSubmitVote = async (pollId: string) => {
    console.log(`Attempting to submit vote for poll ${pollId}`);
    console.log(`Current selectedOptions:`, selectedOptions);
    
    if (!selectedOptions[pollId]) {
      console.log(`No option selected for poll ${pollId}`);
      return;
    }
    
    try {
      setSubmittingVote(pollId);
      const optionId = selectedOptions[pollId];
      console.log(`Submitting vote for option ${optionId} in poll ${pollId}`);
      
      // Call the API to submit the vote
      await apiService.submitVote(pollId, optionId);
      console.log(`Vote submitted successfully`);
      
      // Update the local state to reflect the vote
      setVotingItems(votingItems.map(item => {
        if (item.id === pollId) {
          // Update the item to show it's been voted on
          return {
            ...item,
            hasVoted: true,
            userVote: optionId,
            options: item.options.map(option => {
              if (option.id === optionId) {
                return { ...option, votes: option.votes + 1 };
              }
              return option;
            }),
            totalVotes: (item.totalVotes || 0) + 1
          };
        }
        return item;
      }));
      
      // Show success message
      alert("تم التصويت بنجاح");
      
    } catch (err: any) {
      console.error("Error submitting vote:", err);
      alert(err.message || "فشل في إرسال التصويت");
    } finally {
      setSubmittingVote(null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerText}>تصويت الرأي</Text>
        <View style={styles.placeholderButton} />
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>جاري تحميل استطلاعات الرأي...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={50} color="#D32F2F" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchVotingItems}
          >
            <Text style={styles.retryButtonText}>إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView 
          style={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#2E7D32"]}
              tintColor="#2E7D32"
            />
          }
        >
          <View style={styles.sectionHeader}>
            <Ionicons name="bar-chart" size={24} color="#2E7D32" />
            <Text style={styles.sectionHeaderText}>استطلاعات رأي نشطة</Text>
          </View>

          {activePolls.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="information-circle" size={48} color="#2E7D32" />
              <Text style={styles.emptyStateText}>لا توجد استطلاعات رأي نشطة حالياً</Text>
            </View>
          ) : (
            activePolls.map((poll) => (
              <View key={poll.id} style={styles.pollCard}>
                <Image source={getFallbackImage(poll.id)} style={styles.pollImage} />
                <View key={`poll-content-${poll.id}`} style={styles.pollContent}>
                  <View key={`poll-header-${poll.id}`} style={styles.pollHeader}>
                    <Text key={`poll-title-${poll.id}`} style={styles.pollTitle}>{poll.title}</Text>
                    <View key={`status-badge-${poll.id}`} style={styles.statusBadge}>
                      <Text key={`status-text-${poll.id}`} style={styles.statusText}>
                        {poll.status === "active" ? "جارية" : "قادمة"}
                      </Text>
                    </View>
                  </View>
                  <Text key={`poll-desc-${poll.id}`} style={styles.pollDescription}>{poll.description}</Text>
                  <View key={`poll-info-${poll.id}`} style={styles.pollInfo}>
                    <View style={styles.infoRow} key={`calendar-${poll.id}`}>
                      <Ionicons name="calendar-outline" size={16} color="#2E7D32" />
                      <Text key={`calendar-text-${poll.id}`} style={styles.infoText}>تنتهي في: {poll.endDate}</Text>
                    </View>
                    <View style={styles.infoRow} key={`people-${poll.id}`}>
                      <Ionicons name="people-outline" size={16} color="#2E7D32" />
                      <Text key={`people-text-${poll.id}`} style={styles.infoText}>المشاركون: {poll.totalVotes || 0}</Text>
                    </View>
                  </View>

                  <View key={`options-container-${poll.id}`} style={styles.optionsContainer}>
                    {poll.options && poll.options.map((option, index) => {
                      console.log(`Option in poll ${poll.id}:`, option);
                      return (
                      <TouchableOpacity 
                        key={`option-${poll.id}-${option.id || index}`} 
                        style={[
                          styles.optionButton,
                          selectedOptions[poll.id] === option.id && styles.selectedOption,
                          poll.hasVoted && poll.userVote === option.id && styles.votedOption
                        ]}
                        onPress={() => {
                          console.log(`Option pressed: ${option.id} in poll ${poll.id}`);
                          if (!poll.hasVoted) {
                            selectOption(poll.id, option.id);
                          }
                        }}
                        disabled={poll.hasVoted}
                      >
                        <Text 
                          style={[
                            styles.optionText,
                            selectedOptions[poll.id] === option.id && styles.selectedOptionText,
                            poll.hasVoted && poll.userVote === option.id && styles.votedOptionText
                          ]}
                        >
                          {option.text}
                        </Text>
                      </TouchableOpacity>
                    );
                    })}
                  </View>

                  <TouchableOpacity 
                    key={`vote-button-${poll.id}`}
                    style={[
                      styles.voteButton,
                      (!selectedOptions[poll.id] || poll.hasVoted) && styles.disabledButton
                    ]}
                    disabled={!selectedOptions[poll.id] || poll.hasVoted || submittingVote === poll.id}
                    onPress={() => handleSubmitVote(poll.id)}
                  >
                    <Text 
                      key={`vote-text-${poll.id}`}
                      style={styles.voteButtonText}
                    >
                      {submittingVote === poll.id ? "جاري التصويت..." : 
                       poll.hasVoted ? "تم التصويت" : "تصويت"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}

          <View style={styles.sectionHeader}>
            <Ionicons name="time" size={24} color="#2E7D32" />
            <Text style={styles.sectionHeaderText}>استطلاعات رأي سابقة</Text>
          </View>

          {previousPolls.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="information-circle" size={48} color="#2E7D32" />
              <Text style={styles.emptyStateText}>لا توجد استطلاعات رأي سابقة</Text>
            </View>
          ) : (
            previousPolls.map((poll) => {
              // Find the winning option (most votes)
              let winnerOption = poll.options.reduce((prev, current) => 
                (prev.votes > current.votes) ? prev : current
              );
              
              return (
                <View key={`prev-poll-${poll.id}`} style={styles.pollCard}>
                  <Image source={getFallbackImage(poll.id)} style={styles.pollImage} />
                  <View style={styles.pollContent}>
                    <View style={styles.pollHeader}>
                      <Text style={styles.pollTitle}>{poll.title}</Text>
                      <View style={[styles.statusBadge, styles.completedBadge]}>
                        <Text style={styles.statusText}>منتهية</Text>
                      </View>
                    </View>
                    <Text style={styles.pollDescription}>{poll.description}</Text>
                    <View style={styles.pollInfo}>
                      <View style={styles.infoRow} key={`calendar-end-${poll.id}`}>
                        <Ionicons name="calendar-outline" size={16} color="#2E7D32" />
                        <Text style={styles.infoText}>انتهى في: {poll.endDate}</Text>
                      </View>
                      <View style={styles.infoRow} key={`people-end-${poll.id}`}>
                        <Ionicons name="people-outline" size={16} color="#2E7D32" />
                        <Text style={styles.infoText}>المشاركون: {poll.totalVotes || 0}</Text>
                      </View>
                      <View style={styles.infoRow} key={`star-${poll.id}`}>
                        <Ionicons name="star-outline" size={16} color="#2E7D32" />
                        <Text style={styles.infoText}>النتيجة الأعلى: {winnerOption.text}</Text>
                      </View>
                    </View>

                    <TouchableOpacity 
                      key={`results-button-${poll.id}`}
                      style={styles.resultsButton}
                    >
                      <Text style={styles.resultsButtonText}>عرض النتائج</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    padding: 20,
    backgroundColor: "#2E7D32",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backButton: {
    width: 40,
  },
  placeholderButton: {
    width: 40,
  },
  headerText: {
    fontSize: 20,
    color: "#FFFFFF",
    textAlign: "center",
    fontFamily: "Tajawal-Bold",
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    marginTop: 10,
    gap: 10,
  },
  sectionHeaderText: {
    fontSize: 18,
    fontFamily: "Tajawal-Bold",
    color: "#333333",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
    backgroundColor: "#F5F5F5",
    borderRadius: 15,
    marginBottom: 20,
  },
  emptyStateText: {
    marginTop: 10,
    fontSize: 16,
    fontFamily: "Tajawal-Regular",
    color: "#333333",
    textAlign: "center",
  },
  pollCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    marginBottom: 15,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  pollImage: {
    width: "100%",
    height: 120,
    resizeMode: "cover",
  },
  pollContent: {
    padding: 15,
  },
  pollHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  pollTitle: {
    fontSize: 16,
    fontFamily: "Tajawal-Bold",
    color: "#2E7D32",
    flex: 1,
  },
  statusBadge: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  completedBadge: {
    backgroundColor: "#757575",
  },
  statusText: {
    color: "#FFFFFF",
    fontFamily: "Tajawal-Regular",
    fontSize: 12,
  },
  pollDescription: {
    fontSize: 14,
    fontFamily: "Tajawal-Regular",
    color: "#333333",
    marginBottom: 10,
    lineHeight: 20,
  },
  pollInfo: {
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
    gap: 5,
  },
  infoText: {
    fontSize: 14,
    fontFamily: "Tajawal-Regular",
    color: "#666666",
  },
  optionsContainer: {
    marginBottom: 15,
  },
  optionButton: {
    backgroundColor: "#F5F5F5",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  selectedOption: {
    backgroundColor: "#E8F5E9",
    borderColor: "#2E7D32",
  },
  votedOption: {
    backgroundColor: "#E8F5E9",
    borderColor: "#2E7D32",
  },
  optionText: {
    fontSize: 14,
    fontFamily: "Tajawal-Regular",
    color: "#333333",
    textAlign: "center",
  },
  selectedOptionText: {
    color: "#2E7D32",
    fontFamily: "Tajawal-Bold",
  },
  votedOptionText: {
    color: "#2E7D32",
    fontFamily: "Tajawal-Bold",
  },
  voteButton: {
    backgroundColor: "#2E7D32",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 5,
  },
  disabledButton: {
    backgroundColor: "#CCCCCC",
    opacity: 0.7,
  },
  voteButtonText: {
    color: "#FFFFFF",
    fontFamily: "Tajawal-Bold",
    fontSize: 14,
  },
  resultsButton: {
    backgroundColor: "#F5F5F5",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2E7D32",
  },
  resultsButtonText: {
    color: "#2E7D32",
    fontFamily: "Tajawal-Bold",
    fontSize: 14,
  },
  // Loading state styles
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontFamily: "Tajawal-Regular",
    color: "#666666",
  },
  // Error state styles
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    fontFamily: "Tajawal-Regular",
    color: "#D32F2F",
    textAlign: "center",
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#2E7D32",
    borderRadius: 5,
  },
  retryButtonText: {
    fontSize: 16,
    fontFamily: "Tajawal-Bold",
    color: "#FFFFFF",
  },
}); 