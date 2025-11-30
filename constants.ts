import { MaterialIcons } from "@expo/vector-icons";

export const PLACE_TYPE_MAP = {
    shelter: {
        title: "Abri",
        icon: "home" as keyof typeof MaterialIcons.glyphMap,
        color: "#3b82f6", // blue
    },
    food: {
        title: "Nourriture / Eau",
        icon: "restaurant" as keyof typeof MaterialIcons.glyphMap,
        color: "#10b981", // green
    },
    meds: {
        title: "Médicaments",
        icon: "local-pharmacy" as keyof typeof MaterialIcons.glyphMap,
        color: "#f59e0b", // amber
    },
} as const;

