import Constants from 'expo-constants';

// Dynamically get the IP address of your Mac running the Expo server
const debuggerHost = Constants.expoConfig?.hostUri;
const localhost = debuggerHost ? debuggerHost.split(':')[0] : 'localhost';

export const API_URL = `http://${localhost}:8080/api`;
