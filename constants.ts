import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ComponentProps } from "react";

export const PLACE_TYPE = {
    SHELTER: "shelter",
    FOOD: "food",
    MEDS: "meds",
} as const;

export const PLACE_TYPE_VALUES = Object.values(PLACE_TYPE);

type PlaceTypeConfig = {
    icon: ComponentProps<typeof MaterialIcons>["name"];
    title: string;
    color: string;
};

export const PLACE_TYPE_MAP: Record<
    (typeof PLACE_TYPE)[keyof typeof PLACE_TYPE],
    PlaceTypeConfig
> = {
    [PLACE_TYPE.SHELTER]: {
        icon: "home",
        title: "Shelter",
        color: "#4CAF50",
    },
    [PLACE_TYPE.FOOD]: {
        icon: "restaurant",
        title: "Food",
        color: "#FF9800",
    },
    [PLACE_TYPE.MEDS]: {
        icon: "local-hospital",
        title: "Medical Supplies",
        color: "#F44336",
    },
};
