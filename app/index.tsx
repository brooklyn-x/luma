import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuthStore } from "@/stores/auth-store";
import { useTheme } from "@/theme";

export default function Entry() {
  const { isHydrating, connected } = useAuthStore();
  const t = useTheme();

  if (isHydrating) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: t.background,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color={t.muted} />
      </View>
    );
  }

  return <Redirect href={connected ? "/(tabs)/(home)" : "/splash"} />;
}
