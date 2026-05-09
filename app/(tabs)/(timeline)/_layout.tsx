import { Stack } from "expo-router";
import { useStackScreenOptions } from "@/lib/screen-options";

export default function TimelineStack() {
  const opts = useStackScreenOptions();
  return <Stack screenOptions={opts} />;
}
