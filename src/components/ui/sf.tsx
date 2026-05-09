import { SymbolView } from "expo-symbols";
import type { ColorValue } from "react-native";

type Props = {
  name: string;
  size?: number;
  tint?: ColorValue;
};

export function SF({ name, size = 20, tint }: Props) {
  return (
    <SymbolView
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      name={name as any}
      size={size}
      tintColor={tint as string | undefined}
      resizeMode="scaleAspectFit"
    />
  );
}
