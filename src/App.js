import React, { useRef, useState } from 'react';
import './App.css';
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore, collection, query, orderBy, limit, addDoc, serverTimestamp } from 'firebase/firestore'; //Firebase Firestore functions and constants that allow interaction with Firestore.
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData } from 'react-firebase-hooks/firestore'; //imports a hook to fetch Firestore collection data and bind it to the component state.

const firebaseConfig = {
  
};

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
const auth = getAuth(app);

function App() {
  const [user] = useAuthState(auth);  //hook returns the current user’s authentication state. user will be null if no user is signed in, or an object with user details if the user is signed in

  return (
    <div className="App">
      <header>
        <h1>Chat Application</h1>
        <SignOut />
      </header>

      <section>
        {/*if user is logged in, show chatroom, else: show sign in page */}
        {user ? <ChatRoom /> : <SignIn />} 
      </section>
    </div>
  );
}

function SignIn() {
  const signInWithGoogle = async () => { // async function does not block the rest of your code from running while it waits for the task to complete
    const provider = new GoogleAuthProvider(); //inbuilt class provided by Firebase Authentication for implementing Google login
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in with Google:", error.message);
    }
  }

  return (
    <>
      <button className="sign-in" onClick={signInWithGoogle}>Sign in with Google</button>
    </>
  );
}

function SignOut() {
  return auth.currentUser && (
    <button className="sign-out" onClick={() => auth.signOut()}>Sign Out</button>
  );
}

function ChatRoom() {
  const dummy = useRef(); //scrolls to the page whenever a new message is sent //useRef doesn't trigger a re-render when the current property is modified
  const messagesRef = collection(firestore, 'messages'); 
  const messagesQuery = query(messagesRef, orderBy('createdAt'), limit(25));

  const [messages] = useCollectionData(messagesQuery, { idField: 'id' });  //hook fetches data from Firestore based on the query and automatically updates the component whenever the data changes. // { idField: 'id' } option tells the hook to add the Firestore document's ID to each document in the result set, and to store it in the id field.

  const [formValue, setFormValue] = useState('');

  const sendMessage = async (e) => {   //sends a message to Firestore when the form is submitted. It adds the message to Firestore with the current uid, photoURL, and text, and uses serverTimestamp() to store the timestamp.
    e.preventDefault();

    const { uid, photoURL } = auth.currentUser;

    try {
      await addDoc(messagesRef, {
        text: formValue,
        createdAt: serverTimestamp(),
        uid,
        photoURL
      });
    } catch (error) {
      console.error("Error sending message:", error.message);
    }

    setFormValue('');
    dummy.current.scrollIntoView({ behavior: 'smooth' });  //This scrolls the page to the last message after a new message is sent.
  }

  return (
    <>
      <main>
        {messages && messages.map(msg => <ChatMessage key={msg.id} message={msg} />)}
        <span ref={dummy}></span>
      </main>

      <form onSubmit={sendMessage}>
        <input value={formValue} onChange={(e) => setFormValue(e.target.value)} placeholder="say something nice" />
        <button type="submit" disabled={!formValue}>Send</button>
      </form>
    </>
  );
}

function ChatMessage(props) {
  const { text, uid, photoURL } = props.message;  //destructuring assignment in JavaScript, which is used to extract specific properties

  const messageClass = uid === auth.currentUser.uid ? 'sent' : 'received'; //determines the CSS class for the message based on whether the message was sent by the current user or received from someone else.

  return (
    <div className={`message ${messageClass}`}>
      <img src={photoURL || 'https://api.adorable.io/avatars/23/abott@adorable.png'} alt="avatar" />
      <p>{text}</p>
    </div>
  );
}

export default App;
