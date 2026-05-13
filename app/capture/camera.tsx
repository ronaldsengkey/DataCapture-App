import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import { useState } from 'react';
import { useRouter } from 'expo-router';

export default function CameraCapture() {
    const [type, setType] = useState(CameraType.back);
    const [permission, requestPermission] = Camera.useCameraPermissions();
    const router = useRouter();

    if (!permission) {
        return <View />;
    }

    if (!permission.granted) {
        return (
            <View className="flex-1 justify-center items-center bg-[#f7f9fb]">
                <Text className="text-center pb-4">We need your permission to show the camera</Text>
                <TouchableOpacity className="bg-[#004ac6] border border-[#004ac6] px-4 py-3 rounded-xl" onPress={requestPermission}>
                    <Text className="text-white font-bold tracking-widest text-[12px]">GRANT PERMISSION</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-black">
            <Camera style={StyleSheet.absoluteFill} type={type}>
                <View className="flex-1 justify-between bg-transparent flex-col">

                    <View className="w-full flex-row items-center justify-between px-4 h-16 pt-4 mt-8">
                        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center rounded-full bg-white/80 border border-white/50">
                            <Text className="font-bold text-lg">✕</Text>
                        </TouchableOpacity>
                        <TouchableOpacity className="w-10 h-10 flex items-center justify-center rounded-full bg-white/80 border border-white/50">
                            <Text className="font-bold text-lg">⚡</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Simulated Bounding Boxes Overlay */}
                    <View className="flex-1 pointer-events-none relative">
                        <View className="absolute top-[15%] left-[10%] w-[80%] h-[12%] border-2 border-[#004ac6] bg-[#004ac6]/10 rounded-sm">
                            <View className="absolute -top-[24px] left-[-2px] bg-[#004ac6] px-2 p-[2px] rounded-t-sm">
                                <Text className="text-white text-xs font-bold uppercase tracking-widest">Text</Text>
                            </View>
                        </View>

                        <View className="absolute top-[32%] left-[10%] w-[80%] h-[25%] border-2 border-[#004ac6] bg-[#004ac6]/10 rounded-sm">
                            <View className="absolute -top-[24px] left-[-2px] bg-[#004ac6] px-2 p-[2px] rounded-t-sm">
                                <Text className="text-white text-xs font-bold uppercase tracking-widest">Table</Text>
                            </View>
                        </View>
                    </View>

                    {/* Bottom Confirmation Sheet Stub */}
                    <View className="w-full bg-white rounded-t-xl shadow-lg border-t border-[#c3c6d7] flex-col mt-auto pb-6 p-4 z-20">
                        <View className="w-full justify-center items-center py-2"><View className="w-8 h-1 bg-[#c3c6d7] rounded-full opacity-50" /></View>

                        <View className="flex-row items-center justify-between mb-4">
                            <Text className="text-xl font-bold text-[#191c1e]">Data Detected</Text>
                            <Text className="text-sm font-mono text-[#434655]">2 Items</Text>
                        </View>

                        <View className="flex-row items-center gap-2 pt-2">
                            <TouchableOpacity className="flex-1 py-3 px-4 rounded-xl border border-[#737686] items-center justify-center">
                                <Text className="text-[#191c1e] text-xs font-bold uppercase tracking-widest">Retake</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => router.push('/review')} className="flex-[2] py-3 px-4 rounded-xl bg-[#004ac6] shadow-md items-center justify-center">
                                <Text className="text-white text-xs font-bold uppercase tracking-widest">Use Selected (2)</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Camera>
        </View>
    );
}
