import { Button } from "@/components/ui/button";
import { StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
    return (
        <View className="flex-1 justify-center items-center bg-background">
            <Text className="text-2xl font-bold text-foreground">Yayyy!</Text>
            <Button className="mt-4 bg-red-500">
                <Text className="text-white">Zombie</Text>
            </Button>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#0f172a",
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#f9fafb",
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 16,
        color: "#cbd5f5",
        textAlign: "center",
    },
});
