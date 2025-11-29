import { Slot } from "expo-router";
import React from "react";

// 👇 Désactive le router-debug-nav en bas et fixe la page d'entrée
export const unstable_settings = {
  initialRouteName: "map",
};

export default function RootLayout() {
  return <Slot />;
}
