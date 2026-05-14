import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import {
  DictionaryScreen,
  LoginScreen,
  RecordsScreen,
  RepeatScreen,
  SettingsScreen,
  SpellingScreen,
  TimerScreen,
} from '../../screens';
import { ProfileAccountMenu } from '../../components/ProfileAccountMenu';
import { logout, onAuthChange, type LocalUser } from '../../shared/auth/localAuth';
import { initializeBuiltinUsers } from '../../shared/storage/userStorage';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
  const { t } = useTranslation();

  const [currentUser, setCurrentUser] = useState<LocalUser | null>(null);
  const [isAuthResolved, setIsAuthResolved] = useState<boolean>(false);

  useEffect(() => {
    void initializeBuiltinUsers();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setCurrentUser(user);
      setIsAuthResolved(true);
    });

    const timeoutId = setTimeout(() => {
      setIsAuthResolved(true);
    }, 1500);

    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);

  if (!isAuthResolved) {
    return <ActivityIndicator size="large" />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        key={currentUser ? currentUser.id : 'guest'}
        initialRouteName={currentUser ? 'Dictionary' : 'Login'}
        screenOptions={({ route }) => ({
          headerRight:
            currentUser && route.name !== 'Login'
              ? () => (
                  <View
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginRight: 4 }}
                  >
                    <ProfileAccountMenu currentUser={currentUser} />
                    <Pressable onPress={() => void logout()}>
                      <Text>{t('logout')}</Text>
                    </Pressable>
                  </View>
                )
              : undefined,
        })}
      >
        {!currentUser ? (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        ) : (
          <>
            <Stack.Screen
              name="Dictionary"
              component={DictionaryScreen}
              options={{ title: t('dictionary') }}
            />
            <Stack.Screen
              name="Spelling"
              component={SpellingScreen}
              options={{ title: t('spelling') }}
            />
            <Stack.Screen name="Repeat" component={RepeatScreen} options={{ title: t('repeat') }} />
            <Stack.Screen name="Timer" component={TimerScreen} options={{ title: t('timer') }} />
            <Stack.Screen
              name="Records"
              component={RecordsScreen}
              options={{ title: t('records') }}
            />
            <Stack.Screen
              name="Settings"
              component={SettingsScreen}
              options={{ title: t('settings') }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
