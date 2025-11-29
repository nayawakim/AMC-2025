import { Redirect } from "expo-router";

export default function Index() {
  // Quand l'app démarre sur "/", on envoie vers la map dans les tabs
  return <Redirect href="(tabs)/map" />;
}
