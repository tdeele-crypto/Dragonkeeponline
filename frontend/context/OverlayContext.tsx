import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/colors';

interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ConfirmState {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  secondaryLabel?: string;
  onSecondaryConfirm?: () => void;
  secondaryDestructive?: boolean;
}

interface OverlayContextValue {
  showToast: (message: string, type?: ToastState['type']) => void;
  showConfirm: (state: ConfirmState) => void;
}

const OverlayContext = createContext<OverlayContextValue | null>(null);

export function OverlayProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string, type: ToastState['type'] = 'success') => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ message, type });
    opacity.setValue(0);
    Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    timerRef.current = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
        setToast(null);
      });
    }, 2400);
  }, [opacity]);

  const showConfirm = useCallback((state: ConfirmState) => {
    setConfirm(state);
  }, []);

  const closeConfirm = () => setConfirm(null);

  const toastIcon = toast?.type === 'error' ? 'close-circle' : toast?.type === 'info' ? 'information-circle' : 'checkmark-circle';
  const toastColor = toast?.type === 'error' ? COLORS.danger : toast?.type === 'info' ? COLORS.primary : COLORS.success;

  return (
    <OverlayContext.Provider value={{ showToast, showConfirm }}>
      {children}

      {toast && (
        <Animated.View
          style={[styles.toastContainer, { opacity }]}
          pointerEvents="none"
          testID="app-toast"
        >
          <View style={[styles.toastBox, { borderColor: toastColor }]}>
            <Ionicons name={toastIcon as any} size={20} color={toastColor} />
            <Text style={styles.toastText}>{toast.message}</Text>
          </View>
        </Animated.View>
      )}

      <Modal visible={!!confirm} transparent animationType="fade" onRequestClose={closeConfirm}>
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmBox} testID="confirm-sheet">
            <Text style={styles.confirmTitle}>{confirm?.title}</Text>
            {confirm?.message ? <Text style={styles.confirmMessage}>{confirm.message}</Text> : null}
            {confirm?.onSecondaryConfirm ? (
              <View style={styles.confirmActionsColumn}>
                <TouchableOpacity
                  style={[styles.confirmBtn, styles.confirmBtnFull, confirm?.destructive ? styles.destructiveBtn : styles.primaryBtn]}
                  onPress={() => {
                    confirm?.onConfirm();
                    closeConfirm();
                  }}
                  testID="confirm-sheet-confirm-button"
                >
                  <Text style={styles.confirmBtnText}>{confirm?.confirmLabel || 'Bekræft'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.confirmBtn,
                    styles.confirmBtnFull,
                    confirm?.secondaryDestructive ? styles.destructiveBtn : styles.primaryBtn,
                  ]}
                  onPress={() => {
                    confirm?.onSecondaryConfirm?.();
                    closeConfirm();
                  }}
                  testID="confirm-sheet-secondary-button"
                >
                  <Text style={styles.confirmBtnText}>{confirm?.secondaryLabel}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmBtn, styles.confirmBtnFull, styles.cancelBtn]}
                  onPress={closeConfirm}
                  testID="confirm-sheet-cancel-button"
                >
                  <Text style={styles.cancelBtnText}>{confirm?.cancelLabel || 'Annuller'}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.confirmActions}>
                <TouchableOpacity
                  style={[styles.confirmBtn, styles.cancelBtn]}
                  onPress={closeConfirm}
                  testID="confirm-sheet-cancel-button"
                >
                  <Text style={styles.cancelBtnText}>{confirm?.cancelLabel || 'Annuller'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmBtn, confirm?.destructive ? styles.destructiveBtn : styles.primaryBtn]}
                  onPress={() => {
                    confirm?.onConfirm();
                    closeConfirm();
                  }}
                  testID="confirm-sheet-confirm-button"
                >
                  <Text style={styles.confirmBtnText}>{confirm?.confirmLabel || 'Bekræft'}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </OverlayContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(OverlayContext);
  if (!ctx) throw new Error('useToast must be used within OverlayProvider');
  return ctx.showToast;
}

export function useConfirm() {
  const ctx = useContext(OverlayContext);
  if (!ctx) throw new Error('useConfirm must be used within OverlayProvider');
  return ctx.showConfirm;
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    zIndex: 1000,
    alignItems: 'center',
  },
  toastBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    maxWidth: '100%',
  },
  toastText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    flexShrink: 1,
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  confirmBox: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 380,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  confirmMessage: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 20,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 12,
  },
  confirmActionsColumn: {
    gap: 10,
  },
  confirmBtnFull: {
    width: '100%',
  },
  confirmBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    backgroundColor: COLORS.borderLight,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
  },
  destructiveBtn: {
    backgroundColor: COLORS.danger,
  },
  cancelBtnText: {
    color: COLORS.textPrimary,
    fontWeight: '700',
    fontSize: 15,
  },
  confirmBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 15,
  },
});
