import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider } from 'react-native-paper';

// Screens
import AuthScreen from './src/screens/AuthScreen';
import CoupleConnectionScreen from './src/screens/CoupleConnectionScreen';
import WheelSelectionScreen from './src/screens/WheelSelectionScreen';
import MysteryWheelScreen from './src/screens/MysteryWheelScreen';
import NormalWheelScreen from './src/screens/NormalWheelScreen';
import SurpriseWheelScreen from './src/screens/SurpriseWheelScreen';
import SavedWheelsScreen from './src/screens/SavedWheelsScreen';

// Types
export type RootStackParamList = {
  Auth: undefined;
  CoupleConnection: undefined;
  WheelSelection: { userName: string; coupleName: string };
  MysteryWheel: { userName: string; coupleName: string };
  NormalWheel: { userName: string; coupleName: string };
  SurpriseWheel: { userName: string; coupleName: string };
  SavedWheels: { userName: string; coupleName: string };
};

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <PaperProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <Stack.Navigator
          initialRouteName="Auth"
          screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: '#ff9a9e' },
            animationEnabled: true,
          }}
        >
          <Stack.Screen 
            name="Auth" 
            component={AuthScreen} 
          />
          <Stack.Screen 
            name="CoupleConnection" 
            component={CoupleConnectionScreen} 
          />
          <Stack.Screen 
            name="WheelSelection" 
            component={WheelSelectionScreen} 
          />
          <Stack.Screen 
            name="MysteryWheel" 
            component={MysteryWheelScreen} 
          />
          <Stack.Screen 
            name="NormalWheel" 
            component={NormalWheelScreen} 
          />
          <Stack.Screen 
            name="SurpriseWheel" 
            component={SurpriseWheelScreen} 
          />
          <Stack.Screen 
            name="SavedWheels" 
            component={SavedWheelsScreen} 
          />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}