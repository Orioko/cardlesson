import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { switchToRegisteredUser, type LocalUser } from '../shared/auth/localAuth';
import { getUsersFromStorage } from '../shared/storage/userStorage';
import { theme } from '../shared/theme/theme';

type ProfileAccountMenuProps = {
  currentUser: LocalUser;
};

type AccountRow = {
  id: string;
  email: string;
};

export const ProfileAccountMenu = ({ currentUser }: ProfileAccountMenuProps) => {
  const { t } = useTranslation();

  const [visible, setVisible] = useState<boolean>(false);
  const [accounts, setAccounts] = useState<AccountRow[]>([]);

  const openMenu = useCallback(async () => {
    const users = await getUsersFromStorage();
    setAccounts(users.map((u) => ({ id: u.id, email: u.email })));
    setVisible(true);
  }, []);

  const handleSelect = async (userId: string) => {
    if (userId === currentUser.id) {
      setVisible(false);
      return;
    }

    try {
      await switchToRegisteredUser(userId);
    } finally {
      setVisible(false);
    }
  };

  const initial = (currentUser.email ?? '?').charAt(0).toUpperCase();

  return (
    <>
      <Pressable
        accessibilityLabel={t('profileMenu')}
        accessibilityRole="button"
        onPress={() => void openMenu()}
        style={styles.avatar}
      >
        <Text style={styles.avatarText}>{initial}</Text>
      </Pressable>
      <Modal
        animationType="fade"
        onRequestClose={() => setVisible(false)}
        transparent
        visible={visible}
      >
        <View style={styles.modalRoot}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setVisible(false)}
            style={styles.modalBackdrop}
          />
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{t('profiles')}</Text>
            {accounts.map((acc) => {
              const isActive = acc.id === currentUser.id;

              return (
                <Pressable
                  key={acc.id}
                  onPress={() => void handleSelect(acc.id)}
                  style={[styles.row, isActive && styles.rowActive]}
                >
                  <View style={styles.rowAvatar}>
                    <Text style={styles.rowAvatarText}>{acc.email.charAt(0).toUpperCase()}</Text>
                  </View>
                  <Text style={styles.rowEmail}>{acc.email}</Text>
                  {isActive ? <Text style={styles.currentMark}>{t('currentProfile')}</Text> : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: theme.colors.textOnPrimary,
    fontWeight: '700',
    fontSize: 16,
  },
  modalRoot: {
    flex: 1,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    position: 'absolute',
    top: 56,
    left: theme.spacing.lg,
    right: theme.spacing.lg,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
  },
  sheetTitle: {
    fontWeight: '700',
    fontSize: 16,
    color: theme.colors.textPrimary,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  rowActive: {
    backgroundColor: 'rgba(102, 126, 234, 0.12)',
  },
  rowAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowAvatarText: {
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  rowEmail: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  currentMark: {
    color: theme.colors.primary,
    fontWeight: '600',
    fontSize: 12,
  },
});
