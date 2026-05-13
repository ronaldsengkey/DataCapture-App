import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeHub() {
    const router = useRouter();

    return (
        <SafeAreaView className="flex-1 bg-[#f7f9fb]">

            {/* Top App Bar */}
            <View className="flex-row items-center justify-between px-4 h-16 bg-[#ffffff] border-b border-[#e0e3e5]">
                <View className="flex-row items-center gap-4">
                    <TouchableOpacity className="p-2 -ml-2 rounded-full">
                        <Text className="text-[#004ac6] text-lg font-bold">☰</Text>
                    </TouchableOpacity>
                    <Text className="text-2xl font-bold text-[#004ac6] tracking-tight">DataCapture</Text>
                </View>
                <TouchableOpacity className="p-2 -mr-2 rounded-full">
                    <Text className="text-[#5c647a]">⏱️</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16, gap: 24 }}>

                {/* Context Header */}
                <View className="flex-row items-center gap-2 bg-[#ffffff] border border-[#c3c6d7] rounded-lg p-2 self-start shadow-sm">
                    <Text className="text-[#5c647a]">🕒</Text>
                    <Text className="font-mono text-sm text-[#5c647a]">Last capture: 3 items, 10 min ago</Text>
                </View>

                {/* Capture Methods Grid */}
                <View className="flex-col gap-4 md:flex-row">
                    {/* Camera Card */}
                    <TouchableOpacity
                        onPress={() => router.push('/capture/camera')}
                        className="flex-col items-start p-6 bg-[#ffffff] border border-[#c3c6d7] rounded-xl shadow-sm active:opacity-80"
                    >
                        <View className="w-12 h-12 rounded-full bg-[#dae2fd] items-center justify-center mb-4">
                            <Text className="text-[#004ac6] text-xl">📷</Text>
                        </View>
                        <Text className="text-xl font-bold text-[#191c1e] mb-1">Capture using Camera</Text>
                        <Text className="text-sm text-[#434655]">Scan documents, receipts, or objects for OCR and analysis.</Text>
                    </TouchableOpacity>

                    {/* URL Extract Card */}
                    <TouchableOpacity
                        onPress={() => router.push('/capture/url')}
                        className="flex-col items-start p-6 bg-[#ffffff] border border-[#c3c6d7] rounded-xl shadow-sm active:opacity-80"
                    >
                        <View className="w-12 h-12 rounded-full bg-[#dae2fd] items-center justify-center mb-4">
                            <Text className="text-[#004ac6] text-xl">🔗</Text>
                        </View>
                        <Text className="text-xl font-bold text-[#191c1e] mb-1">Grab from URL</Text>
                        <Text className="text-sm text-[#434655]">Extract structured data arrays from web endpoints or pages.</Text>
                    </TouchableOpacity>

                    {/* Extract from File Card */}
                    <TouchableOpacity
                        onPress={() => router.push('/capture/file')}
                        className="flex-col items-start p-6 bg-[#ffffff] border border-[#c3c6d7] rounded-xl shadow-sm active:opacity-80"
                    >
                        <View className="w-12 h-12 rounded-full bg-[#dae2fd] items-center justify-center mb-4">
                            <Text className="text-[#004ac6] text-xl">📂</Text>
                        </View>
                        <Text className="text-xl font-bold text-[#191c1e] mb-1">Upload File</Text>
                        <Text className="text-sm text-[#434655]">Parse and ingest local datasets (CSV, JSON, PDF).</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Floating Action Button */}
            <TouchableOpacity
                className="absolute bottom-20 right-4 w-14 h-14 bg-[#004ac6] rounded-2xl shadow-md items-center justify-center active:scale-95 z-40"
            >
                <Text className="text-white text-3xl font-bold">+</Text>
            </TouchableOpacity>

        </SafeAreaView>
    );
}
