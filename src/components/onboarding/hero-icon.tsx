import { StyleSheet, View } from "react-native";
import { Glass } from "@/components/ui/glass";
import { SF } from "@/components/ui/sf";

type Props = {
  symbol: string;
  tint: string;
  plateSize?: number;
  symbolSize?: number;
};

export function HeroIcon({ symbol, tint, plateSize = 96, symbolSize = 40 }: Props) {
  return (
    <Glass cornerRadius={plateSize / 2} style={{ width: plateSize, height: plateSize }}>
      <View style={styles.center}>
        <SF name={symbol} size={symbolSize} tint={tint} />
      </View>
    </Glass>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});
