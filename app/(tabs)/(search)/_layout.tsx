import { Stack } from "expo-router";
import { useStackScreenOptions } from "@/lib/screen-options";

export default function SearchStack() {
  const opts = useStackScreenOptions();
  return <Stack screenOptions={opts} />;
}
