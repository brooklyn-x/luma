import * as Haptics from "expo-haptics";

const light = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
const medium = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
const heavy = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
const rigid = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
const soft = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);

export const haptics = {
  light,
  medium,
  heavy,
  rigid,
  soft,
  selection: () => Haptics.selectionAsync(),
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  warning: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
  error: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),

  tap: light,
  press: light,
  confirm: rigid,
  dismiss: soft,
  destructive: () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  },
};
