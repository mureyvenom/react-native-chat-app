//@refresh reset
import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, TextInput, View, LogBox, TouchableOpacity } from 'react-native';
import * as firebase from 'firebase';
import 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {GiftedChat} from 'react-native-gifted-chat';

const firebaseConfig = {
  apiKey: "AIzaSyB7csR3wj5fHZN9_fOz3MKqoUda5gx6L7Y",
    authDomain: "chat-app-12dfe.firebaseapp.com",
    databaseURL: "https://chat-app-12dfe-default-rtdb.firebaseio.com",
    projectId: "chat-app-12dfe",
    storageBucket: "chat-app-12dfe.appspot.com",
    messagingSenderId: "544975550186",
    appId: "1:544975550186:web:b6f9b76afc8ff153ce0993"
};

if(firebase.apps.length == 0){
  firebase.initializeApp(firebaseConfig);
}

LogBox.ignoreLogs(['Setting a timer for a long period of time']);

const db = firebase.firestore();
const chatRef = db.collection('chats');

export default function App() {
  const [user, setUser] = useState(null);
  const [name, setName] = useState('');
  const [messages, setMessages] = useState([]);

  const readUser = async () => {
    const user = await AsyncStorage.getItem('user');
    if(user){
      setUser(JSON.parse(user))
    }
  }

  const buttonPress = async () => {
    const _id = Math.random().toString(36).substring(7);
    const user = {
      _id,
      name
    }

    await AsyncStorage.setItem('user', JSON.stringify(user));

    setUser(user);

  }

  const handleSend = async (messages) => {
    const writes = messages.map((m) => {
      chatRef.add(m);
    });
    await Promise.all(writes);
  }

  const appendMessages = useCallback(
      (messages) => {
          setMessages((previousMessages) => GiftedChat.append(previousMessages, messages))
      },
      [messages]
  )

  useEffect(() => {
    readUser();
    const unsubscribe = chatRef.onSnapshot((querySnapshot) => {
      const messagesFirestore = querySnapshot
          .docChanges()
          .filter(({ type }) => type === 'added')
          .map(({ doc }) => {
              const message = doc.data()
              //createdAt is firebase.firestore.Timestamp instance
              //https://firebase.google.com/docs/reference/js/firebase.firestore.Timestamp
              return { ...message, createdAt: message.createdAt.toDate() }
          })
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      appendMessages(messagesFirestore)
  })
  return () => unsubscribe()
  }, []);

  if(!user){
    return (
      <View style={{justifyContent: 'center', paddingHorizontal: 25, flex: 1}}>
        <TextInput 
        style={styles.input}
        placeholder='Enter your name'
        value={name}
        onChangeText={setName}
        autoCorrect={false}
        />
        <TouchableOpacity
        style={{width: '100%'}}
        activeOpacity={0.8}
        onPress={buttonPress}
        >
          <View style={styles.btn1}>
            <Text style={styles.btn1Text}>Enter the chat</Text>
          </View>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <GiftedChat 
      messages={messages}
      user={user}
      onSend={handleSend}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 25
  },
  input: {
    height: 50,
    width: '100%',
    borderWidth: 1,
    borderColor: 'grey',
    alignItems: 'center',
    elevation: 4,
    backgroundColor: '#fff',
    paddingHorizontal: 10
  },
  btn1: {
    backgroundColor: 'teal',
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 20,
    width: '100%'
  },
  btn1Text: {
    color: '#fff'
  }
});
