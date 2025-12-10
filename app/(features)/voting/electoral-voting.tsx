import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect, useContext } from "react";
import { apiService } from "../../../services/api";
import { AuthContext } from "../../../context/AuthContext";
import { getUserScopeDescription } from "../../../utils/hierarchyUtils";

const fallbackImages = [
  require("../../assets/images/news1.png"),
  require("../../assets/images/news2.png"),
  require("../../assets/images/news3.png"),
];

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

export default function ElectoralVoting() {
  const router = useRouter();
  const { user } = useContext(AuthContext) || {};
  const [elections, setElections] = useState<VotingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [submittingVote, setSubmittingVote] = useState<string | null>(null);

  const fetchElections = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getVotingItemsHierarchical();
      const electoralVotings = data.filter((item: VotingItem) => item.voteType === "electoral");
      // Ensure all options have stable IDs before setting state to prevent React key instability
      electoralVotings.forEach((item: VotingItem) => {
        if (item.options) {
          item.options = item.options.map((option, index) => {
            // Create new object instead of mutating to ensure React detects changes properly
            if (!option.id) {
              console.warn(`Voting option at index ${index} in election ${item.id} has no ID. Using synthetic ID: option-${index}`);
              return {
                ...option,
                id: `option-${index}` // Assign synthetic ID as fallback (backend supports "option-{index}" format)
              };
            }
            return option;
          });
        }
      });
      setElections(electoralVotings);
    } catch (err: any) {
      setError(err.message || "فشل تحميل الانتخابات");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchElections(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchElections(); };
  const getFallbackImage = (id: string) => fallbackImages[parseInt(id.substring(0, 8), 16) % fallbackImages.length] || fallbackImages[0];
  // Filter elections with case-insensitive status matching
  const activeElections = elections.filter(item => {
    const status = item.status?.toLowerCase();
    return status === "active" || status === "upcoming";
  });
  const previousElections = elections.filter(item => {
    const status = item.status?.toLowerCase();
    return status === "closed";
  });
  const selectOption = (electionId: string, optionId: string) => setSelectedOptions(prev => ({ ...prev, [electionId]: optionId }));

  const handleSubmitVote = async (electionId: string) => {
    if (!selectedOptions[electionId]) return;
    
    // Find the election and validate the option ID exists
    const election = elections.find(e => e.id === electionId);
    if (!election || !election.options) {
      alert("خطأ: لم يتم العثور على الاستطلاع");
      return;
    }
    
    const optionId = selectedOptions[electionId];
    // Validate that the option ID exists in the election's options
    const optionExists = election.options.some(opt => opt.id === optionId);
    if (!optionExists) {
      alert("خطأ: خيار التصويت المحدد غير صالح");
      console.error("Invalid option ID:", optionId, "Available options:", election.options.map(o => o.id));
      return;
    }
    
    try {
      setSubmittingVote(electionId);
      await apiService.submitVote(electionId, optionId);
      setElections(prev => prev.map(item => {
        if (item.id === electionId) {
          // Preserve original options if they exist, otherwise use empty array
          const updatedOptions = item.options 
            ? item.options.map(o => o.id === optionId ? { ...o, votes: (o.votes || 0) + 1 } : o)
            : [];
          return { ...item, hasVoted: true, userVote: optionId, options: updatedOptions, totalVotes: (item.totalVotes || 0) + 1 };
        }
        return item;
      }));
      alert("تم التصويت بنجاح");
    } catch (err: any) {
      alert(err.message || "فشل في إرسال التصويت");
    } finally {
      setSubmittingVote(null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerText}>التصويت الانتخابي</Text>
        <View style={styles.placeholderButton} />
      </View>
      {user && (<View style={styles.hierarchyBanner}><Ionicons name="location-outline" size={16} color="#2E7D32" /><Text style={styles.hierarchyText}>{getUserScopeDescription(user)}</Text></View>)}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#2E7D32" /><Text style={styles.loadingText}>جاري تحميل الانتخابات...</Text></View>
      ) : error ? (
        <View style={styles.errorContainer}><Ionicons name="alert-circle" size={50} color="#D32F2F" /><Text style={styles.errorText}>{error}</Text><TouchableOpacity style={styles.retryButton} onPress={fetchElections}><Text style={styles.retryButtonText}>إعادة المحاولة</Text></TouchableOpacity></View>
      ) : (
        <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#2E7D32"]} tintColor="#2E7D32" />}>
          <View style={styles.sectionHeader}><Ionicons name="checkmark-circle" size={24} color="#2E7D32" /><Text style={styles.sectionHeaderText}>انتخابات نشطة</Text></View>
          {activeElections.length === 0 ? (
            <View style={styles.emptyState}><Ionicons name="information-circle" size={48} color="#2E7D32" /><Text style={styles.emptyStateText}>لا توجد انتخابات نشطة حاليا</Text></View>
          ) : activeElections.map((election) => (
            <View key={election.id} style={styles.electionCard}>
              <Image source={getFallbackImage(election.id)} style={styles.electionImage} />
              <View style={styles.electionContent}>
                <View style={styles.electionHeader}><Text style={styles.electionTitle}>{election.title}</Text><View style={styles.statusBadge}><Text style={styles.statusText}>{election.status?.toLowerCase() === "active" ? "جارية" : "قادمة"}</Text></View></View>
                <Text style={styles.electionDescription}>{election.description}</Text>
                <View style={styles.electionInfo}><View style={styles.infoRow}><Ionicons name="calendar-outline" size={16} color="#2E7D32" /><Text style={styles.infoText}>تنتهي في: {election.endDate}</Text></View><View style={styles.infoRow}><Ionicons name="people-outline" size={16} color="#2E7D32" /><Text style={styles.infoText}>المشاركون: {election.totalVotes || 0}</Text></View></View>
                <View style={styles.optionsContainer}>{election.options && election.options.map((option, index) => {
                  // Use stable key based on election ID and option ID (guaranteed to exist after fetchElections)
                  const optionKey = `opt-${election.id}-${option.id || `option-${index}`}`;
                  return (
                    <TouchableOpacity 
                      key={optionKey}
                      style={[styles.optionButton, selectedOptions[election.id] === option.id && styles.selectedOption, election.hasVoted && election.userVote === option.id && styles.votedOption]} 
                      onPress={() => { if (!election.hasVoted) selectOption(election.id, option.id); }} 
                      disabled={election.hasVoted}
                    >
                      <Text style={[styles.optionText, selectedOptions[election.id] === option.id && styles.selectedOptionText, election.hasVoted && election.userVote === option.id && styles.votedOptionText]}>{option.text}</Text>
                    </TouchableOpacity>
                  );
                })}</View>
                <TouchableOpacity style={[styles.votingButton, (!selectedOptions[election.id] || election.hasVoted) && styles.disabledButton]} disabled={!selectedOptions[election.id] || election.hasVoted || submittingVote === election.id} onPress={() => handleSubmitVote(election.id)}><Text style={styles.votingButtonText}>{submittingVote === election.id ? "جاري التصويت..." : election.hasVoted ? "تم التصويت" : "تصويت"}</Text></TouchableOpacity>
              </View>
            </View>
          ))}
          <View style={styles.sectionHeader}><Ionicons name="time" size={24} color="#2E7D32" /><Text style={styles.sectionHeaderText}>انتخابات سابقة</Text></View>
          {previousElections.length === 0 ? (
            <View style={styles.emptyState}><Ionicons name="information-circle" size={48} color="#2E7D32" /><Text style={styles.emptyStateText}>لا توجد انتخابات سابقة</Text></View>
          ) : previousElections.map((election) => { const winnerOption = election.options?.length > 0 ? election.options.reduce((prev, current) => (prev.votes > current.votes) ? prev : current) : { text: "غير متاح", votes: 0 }; return (
            <View key={"prev-" + election.id} style={styles.electionCard}>
              <Image source={getFallbackImage(election.id)} style={styles.electionImage} />
              <View style={styles.electionContent}>
                <View style={styles.electionHeader}><Text style={styles.electionTitle}>{election.title}</Text><View style={[styles.statusBadge, styles.completedBadge]}><Text style={styles.statusText}>منتهية</Text></View></View>
                <Text style={styles.electionDescription}>{election.description}</Text>
                <View style={styles.electionInfo}><View style={styles.infoRow}><Ionicons name="calendar-outline" size={16} color="#2E7D32" /><Text style={styles.infoText}>انتهت في: {election.endDate}</Text></View><View style={styles.infoRow}><Ionicons name="trophy-outline" size={16} color="#2E7D32" /><Text style={styles.infoText}>الفائز: {winnerOption.text}</Text></View></View>
                <TouchableOpacity style={styles.resultsButton}><Text style={styles.resultsButtonText}>عرض النتائج</Text></TouchableOpacity>
              </View>
            </View>
          ); })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: { padding: 20, backgroundColor: "#2E7D32", borderBottomLeftRadius: 20, borderBottomRightRadius: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  backButton: { width: 40 },
  placeholderButton: { width: 40 },
  headerText: { fontSize: 20, color: "#FFFFFF", textAlign: "center", fontFamily: "Tajawal-Bold", flex: 1 },
  hierarchyBanner: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#E8F5E9", paddingVertical: 8, gap: 6 },
  hierarchyText: { fontSize: 13, fontFamily: "Tajawal-Medium", color: "#2E7D32" },
  content: { flex: 1, padding: 20 },
  sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 15, marginTop: 10, gap: 10 },
  sectionHeaderText: { fontSize: 18, fontFamily: "Tajawal-Bold", color: "#333333" },
  emptyState: { alignItems: "center", justifyContent: "center", padding: 30, backgroundColor: "#F5F5F5", borderRadius: 15, marginBottom: 20 },
  emptyStateText: { marginTop: 10, fontSize: 16, fontFamily: "Tajawal-Regular", color: "#333333", textAlign: "center" },
  electionCard: { backgroundColor: "#FFFFFF", borderRadius: 15, marginBottom: 15, overflow: "hidden", elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, borderWidth: 1, borderColor: "#E0E0E0" },
  electionImage: { width: "100%", height: 120, resizeMode: "cover" },
  electionContent: { padding: 15 },
  electionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  electionTitle: { fontSize: 16, fontFamily: "Tajawal-Bold", color: "#2E7D32", flex: 1 },
  statusBadge: { backgroundColor: "#4CAF50", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15 },
  completedBadge: { backgroundColor: "#757575" },
  statusText: { color: "#FFFFFF", fontFamily: "Tajawal-Regular", fontSize: 12 },
  electionDescription: { fontSize: 14, fontFamily: "Tajawal-Regular", color: "#333333", marginBottom: 10, lineHeight: 20 },
  electionInfo: { marginBottom: 15 },
  infoRow: { flexDirection: "row", alignItems: "center", marginBottom: 5, gap: 5 },
  infoText: { fontSize: 14, fontFamily: "Tajawal-Regular", color: "#666666" },
  optionsContainer: { marginBottom: 15 },
  optionButton: { backgroundColor: "#F5F5F5", padding: 12, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: "#E0E0E0" },
  selectedOption: { backgroundColor: "#E8F5E9", borderColor: "#2E7D32" },
  votedOption: { backgroundColor: "#E8F5E9", borderColor: "#2E7D32" },
  optionText: { fontSize: 14, fontFamily: "Tajawal-Regular", color: "#333333", textAlign: "center" },
  selectedOptionText: { color: "#2E7D32", fontFamily: "Tajawal-Bold" },
  votedOptionText: { color: "#2E7D32", fontFamily: "Tajawal-Bold" },
  votingButton: { backgroundColor: "#2E7D32", padding: 12, borderRadius: 8, alignItems: "center", marginTop: 5 },
  disabledButton: { backgroundColor: "#CCCCCC", opacity: 0.7 },
  votingButtonText: { color: "#FFFFFF", fontFamily: "Tajawal-Bold", fontSize: 14 },
  resultsButton: { backgroundColor: "#F5F5F5", padding: 12, borderRadius: 8, alignItems: "center", borderWidth: 1, borderColor: "#2E7D32" },
  resultsButtonText: { color: "#2E7D32", fontFamily: "Tajawal-Bold", fontSize: 14 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  loadingText: { marginTop: 10, fontSize: 16, fontFamily: "Tajawal-Regular", color: "#666666" },
  errorContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  errorText: { marginTop: 10, fontSize: 16, fontFamily: "Tajawal-Regular", color: "#D32F2F", textAlign: "center" },
  retryButton: { marginTop: 20, paddingVertical: 10, paddingHorizontal: 20, backgroundColor: "#2E7D32", borderRadius: 5 },
  retryButtonText: { fontSize: 16, fontFamily: "Tajawal-Bold", color: "#FFFFFF" },
});
