import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';

/**
 * ScrollView that avoids the keyboard (iOS padding + optional tab-bar offset).
 * On Android, pair with app.json android.softwareKeyboardLayoutMode: "resize".
 */
export default function KeyboardSafeScroll({
  children,
  contentContainerStyle,
  keyboardVerticalOffset,
  scrollRef,
  ...scrollProps
}) {
  const offset =
    keyboardVerticalOffset !== undefined
      ? keyboardVerticalOffset
      : Platform.OS === 'ios'
        ? 88
        : 0;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={offset}
    >
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={contentContainerStyle}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator
        {...scrollProps}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
