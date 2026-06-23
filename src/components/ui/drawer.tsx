import { forwardRef, useCallback, useEffect, useImperativeHandle } from "react";
import { Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/theme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const TIMING = { duration: 280 };
// Drag past this (or fling faster than the velocity) to dismiss.
const DISMISS_OFFSET = 120;
const DISMISS_VELOCITY = 800;

export type DrawerHandle = {
  /** Animate the sheet out, then fire `onClose`. */
  close: () => void;
};

type DrawerProps = {
  children: React.ReactNode;
  onClose: () => void;
  maxHeightRatio?: number;
};

/**
 * Custom bottom-sheet drawer — pure Reanimated + gesture handler, no native
 * form-sheet / glass. Present the route as `transparentModal` and call
 * `router.back()` from `onClose`; the slide-out runs before navigating away.
 * Pass a ref to dismiss it imperatively (e.g. after picking an option).
 */
export const Drawer = forwardRef<DrawerHandle, DrawerProps>(function Drawer(
  { children, onClose, maxHeightRatio = 0.9 },
  ref
) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  const translateY = useSharedValue(height);
  const progress = useSharedValue(0);

  // Slide the sheet (and any pending drag) back down, then navigate away once
  // the animation settles. Safe to call from either thread.
  const dismiss = useCallback(() => {
    progress.value = withTiming(0, TIMING);
    translateY.value = withTiming(height, TIMING, (finished) => {
      if (finished) runOnJS(onClose)();
    });
  }, [height, onClose, progress, translateY]);

  useImperativeHandle(ref, () => ({ close: dismiss }), [dismiss]);

  useEffect(() => {
    progress.value = withTiming(1, TIMING);
    translateY.value = withTiming(0, TIMING);
  }, [progress, translateY]);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      translateY.value = Math.max(0, e.translationY);
    })
    .onEnd((e) => {
      if (e.translationY > DISMISS_OFFSET || e.velocityY > DISMISS_VELOCITY) {
        runOnJS(dismiss)();
      } else {
        translateY.value = withTiming(0, TIMING);
      }
    });

  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <View style={styles.root}>
      <AnimatedPressable
        style={[styles.backdrop, backdropStyle]}
        onPress={dismiss}
      />
      <Animated.View
        style={[
          styles.sheet,
          {
            backgroundColor: t.background,
            maxHeight: height * maxHeightRatio,
            paddingBottom: insets.bottom + 12,
          },
          sheetStyle,
        ]}
      >
        <GestureDetector gesture={pan}>
          <View style={styles.handleArea}>
            <View style={[styles.grabber, { backgroundColor: t.muted2 }]} />
          </View>
        </GestureDetector>
        <View style={styles.body}>{children}</View>
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  handleArea: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 4,
  },
  grabber: {
    width: 40,
    height: 5,
    borderRadius: 999,
    opacity: 0.5,
  },
  body: { flexShrink: 1 },
});
