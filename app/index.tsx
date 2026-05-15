import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeHub() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <ScrollView className="flex-1 px-4 py-6">
        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-2xl font-bold text-gray-800">☰ DataCapture</Text>
          <Text className="text-gray-500">⏱️</Text>
        </View>

        <View className="mb-6">
          <Text className="text-base text-gray-600">Last capture: 3 items, 10 min ago</Text>
        </View>

        <View className="space-y-4">
          <TouchableOpacity
            onPress={() => router.push('/capture/camera')}
            className="flex-col items-start p-6 bg-white border border-gray-300 rounded-xl shadow-sm"
          >
            <Text className="text-lg font-semibold mb-1">Capture using Camera</Text>
            <Text className="text-gray-500">Scan documents, receipts, or objects for OCR and analysis.</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/capture/url')}
            className="flex-col items-start p-6 bg-white border border-gray-300 rounded-xl shadow-sm"
          >
            <Text className="text-lg font-semibold mb-1">Grab from URL</Text>
            <Text className="text-gray-500">Extract structured data arrays from web endpoints or pages.</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/capture/file')}
            className="flex-col items-start p-6 bg-white border border-gray-300 rounded-xl shadow-sm"
          >
            <Text className="text-lg font-semibold mb-1">Upload File</Text>
            <Text className="text-gray-500">Parse and ingest local datasets (CSV, JSON, PDF).</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}