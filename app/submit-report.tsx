import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../constants/Colors';
import Font from '../constants/Font';
import FontSize from '../constants/FontSize';
import Spacing from '../constants/Spacing';
import { Stack, useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../services/api';
import { AuthContext } from '../context/AuthContext';

export default function SubmitReportScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [comment, setComment] = useState('');
  const [recommendation, setRecommendation] = useState('');
  const [attachments, setAttachments] = useState<DocumentPicker.DocumentPickerAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('general'); // Default report type
  const { token } = useContext(AuthContext) || {};
  const router = useRouter();

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*', 'application/msword', 
               'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        multiple: true,
        copyToCacheDirectory: true,
      });
      
      if (!result.canceled) {
        setAttachments([...attachments, ...result.assets]);
      }
    } catch (err) {
      console.error('Error picking document:', err);
      Alert.alert('خطأ', 'حدث خطأ أثناء اختيار الملف. يرجى المحاولة مرة أخرى.');
    }
  };

  const removeAttachment = (index: number) => {
    const newAttachments = [...attachments];
    newAttachments.splice(index, 1);
    setAttachments(newAttachments);
  };

  const submitReport = async () => {
    if (!title.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال عنوان التقرير');
      return;
    }
    
    if (!description.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال وصف التقرير');
      return;
    }

    if (!token) {
      Alert.alert('خطأ', 'يجب تسجيل الدخول أولاً');
      router.replace('/login');
      return;
    }

    setLoading(true);
    
    try {
      // Prepare report data
      const reportData = {
        title: title.trim(),
        type: reportType,
        description: description.trim() + 
                    (comment.trim() ? `\n\nتعليق: ${comment.trim()}` : '') + 
                    (recommendation.trim() ? `\n\nتوصية: ${recommendation.trim()}` : ''),
        date: new Date().toISOString(),
        attachmentName: attachments.length > 0 ? attachments[0].name : undefined
      };
      
      // Submit report to backend with attachments
      const response = await apiService.submitReport(reportData, attachments.length > 0 ? attachments : undefined);
      
      console.log('Report submitted successfully:', response);
      
      Alert.alert(
        'تم بنجاح',
        'تم إرسال التقرير بنجاح وحفظه في قاعدة البيانات',
        [{ text: 'حسناً', onPress: () => {
          // Reset form
          setTitle('');
          setDescription('');
          setComment('');
          setRecommendation('');
          setAttachments([]);
          
          // Navigate back to home
          router.replace('/home');
        }}]
      );
    } catch (error: any) {
      console.error('Error submitting report:', error);
      Alert.alert(
        'خطأ', 
        error.message || 'حدث خطأ أثناء إرسال التقرير. يرجى المحاولة مرة أخرى.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{
          headerTitle: 'تقديم تقرير',
          headerTitleStyle: {
            fontFamily: Font['Tajawal-Bold'],
          },
          headerTitleAlign: 'center',
        }} 
      />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.label}>نوع التقرير</Text>
        <View style={styles.typeContainer}>
          <TouchableOpacity 
            style={[styles.typeButton, reportType === 'general' && styles.selectedType]} 
            onPress={() => setReportType('general')}
          >
            <Text style={[styles.typeText, reportType === 'general' && styles.selectedTypeText]}>
              عام
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.typeButton, reportType === 'complaint' && styles.selectedType]} 
            onPress={() => setReportType('complaint')}
          >
            <Text style={[styles.typeText, reportType === 'complaint' && styles.selectedTypeText]}>
              شكوى
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.typeButton, reportType === 'suggestion' && styles.selectedType]} 
            onPress={() => setReportType('suggestion')}
          >
            <Text style={[styles.typeText, reportType === 'suggestion' && styles.selectedTypeText]}>
              اقتراح
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>عنوان التقرير</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="أدخل عنوان التقرير"
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>وصف التقرير</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="أدخل تفاصيل التقرير"
          placeholderTextColor="#999"
          multiline
          textAlignVertical="top"
          numberOfLines={6}
        />

        <Text style={styles.label}>تعليق</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={comment}
          onChangeText={setComment}
          placeholder="أدخل تعليقك على الموضوع"
          placeholderTextColor="#999"
          multiline
          textAlignVertical="top"
          numberOfLines={4}
        />

        <Text style={styles.label}>توصية</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={recommendation}
          onChangeText={setRecommendation}
          placeholder="أدخل توصياتك بخصوص هذا الموضوع"
          placeholderTextColor="#999"
          multiline
          textAlignVertical="top"
          numberOfLines={4}
        />

        <Text style={styles.label}>المرفقات</Text>
        <TouchableOpacity style={styles.attachButton} onPress={pickDocument}>
          <Ionicons name="attach" size={24} color={Colors.primary} />
          <Text style={styles.attachButtonText}>إضافة مرفق</Text>
        </TouchableOpacity>

        {attachments.length > 0 && (
          <View style={styles.attachmentsContainer}>
            {attachments.map((doc, index) => (
              <View key={index} style={styles.attachmentItem}>
                <Text style={styles.attachmentName} numberOfLines={1} ellipsizeMode="middle">
                  {doc.name}
                </Text>
                <TouchableOpacity onPress={() => removeAttachment(index)}>
                  <Ionicons name="close-circle" size={24} color="red" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity 
          style={styles.submitButton} 
          onPress={submitReport}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>إرسال التقرير</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing * 2,
  },
  typeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing * 2,
  },
  typeButton: {
    flex: 1,
    padding: Spacing,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  selectedType: {
    backgroundColor: Colors.primary,
  },
  typeText: {
    fontFamily: Font['Tajawal-Medium'],
    color: Colors.primary,
  },
  selectedTypeText: {
    color: 'white',
  },
  label: {
    fontFamily: Font['Tajawal-Bold'],
    fontSize: FontSize.medium,
    marginBottom: Spacing,
    color: Colors.text,
    textAlign: 'right',
  },
  input: {
    backgroundColor: Colors.gray,
    padding: Spacing * 1.5,
    borderRadius: 12,
    fontFamily: Font['Tajawal-Regular'],
    fontSize: FontSize.small,
    marginBottom: Spacing * 2,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    textAlign: 'right',
  },
  textArea: {
    height: 120,
  },
  attachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.gray,
    padding: Spacing * 1.5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    marginBottom: Spacing * 2,
  },
  attachButtonText: {
    fontFamily: Font['Tajawal-Regular'],
    fontSize: FontSize.small,
    color: Colors.primary,
    marginLeft: Spacing,
  },
  attachmentsContainer: {
    marginBottom: Spacing * 2,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.gray,
    padding: Spacing,
    borderRadius: 8,
    marginBottom: Spacing,
  },
  attachmentName: {
    fontFamily: Font['Tajawal-Regular'],
    fontSize: FontSize.small,
    color: Colors.text,
    flex: 1,
    marginRight: Spacing,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    padding: Spacing * 1.5,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: Spacing,
  },
  submitButtonText: {
    fontFamily: Font['Tajawal-Bold'],
    fontSize: FontSize.medium,
    color: Colors.onPrimary,
  },
}); 