import { Image as ExpoImage } from "expo-image";
import { useCssElement } from "react-native-css";
import type { ComponentProps } from "react";

type Props = ComponentProps<typeof ExpoImage> & { className?: string };

export function Image(props: Props) {
  return useCssElement(ExpoImage, props as never, {
    className: "style",
  });
}
