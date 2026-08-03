import { Client, Databases } from 'react-native-appwrite';
import 'react-native-url-polyfill/auto';

const client = new Client()

client
  .setEndpoint('https://fra.cloud.appwrite.io/v1') // Or http://localhost/v1 if running Docker
  .setProject('6a5ef023001e8c601370') // Replace with your Project ID from Appwrite console settings
  .setPlatform('com.cup.uno');

export const databases = new Databases(client);
export default client;