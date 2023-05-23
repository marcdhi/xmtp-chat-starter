
import { ConnectWallet,useSigner} from "@thirdweb-dev/react";
import React,{ useState,useRef, useEffect} from 'react';
import { useCallback } from "react";
import { loadKeys, storeKeys,getEnv } from "./helpers";
import Chat from "./Chat";
import {Client, useStreamMessages,useClient,useMessages,useConversations,useStartConversation } from "@xmtp/react-sdk";

const PEER_ADDRESS = '0x0AD3A479B31072bc14bDE6AaD601e4cbF13e78a8';
//gm bot 0x937C0d4a6294cdfa575de17382c7076b579DC176
import styles from "./Home.module.css";
const clientOptions = {
   env: getEnv() 
}
export default function Home() {

  const signer = useSigner();
  //Other
  const isConnected = !!signer;

  //React SDKs
  const { client, initialize } = useClient();
  const { conversations } = useConversations();
  const startConversation = useStartConversation();
  const [conversation, setConversation] = useState(null);
  
  //Message conversation
  const [history, setHistory] = useState(null);
  const { messages } = useMessages( conversation)
  // Stream messages
  const onMessage = useCallback((message) => {
      setHistory(prevMessages => {
        const msgsnew = [...prevMessages, message];
        return msgsnew;
      });
    },
    [],
  );
  useStreamMessages(conversation, onMessage);


  //Initialize XMTP
  const initXmtp = (async() => {
    await initialize({ signer,options: clientOptions });
  })

  //Initialize XMTP
  const initXmtpWithKeys = (async() => {
    // create a client using keys returned from getKeys
    //Use signer wallet from ThirdWeb hook `useSigner`
    const address = await signer.getAddress();
    let keys = loadKeys(address);
    if (!keys) {
      keys = await Client.getKeys(signer,{
        ...clientOptions,
        // we don't need to publish the contact here since it
        // will happen when we create the client later
        skipContactPublishing: true,
        // we can skip persistence on the keystore for this short-lived
        // instance
        persistConversations: false
      });
      storeKeys(address, keys);
    }
    await initialize({ keys,options:clientOptions,signer});

  })


  useEffect(() => {
    async function loadConversation() {
      if(client?.canMessage(PEER_ADDRESS)){
        const convv=await startConversation(PEER_ADDRESS, 'hi')
        setConversation(convv)
        const history = await convv.messages();
        console.log('history',history.length)
        setHistory(history);
      }else{
        console.log("cant message because is not on the network.");
        //cant message because is not on the network.
      }
    }
    if(!conversation && client)loadConversation()
    if(messages){
      console.log('Loaded message history:',messages.length)
    }
    console.log
  }, [signer,conversation,client,messages]);
  return (
    
    <div className={styles.Home}>
      {/* Display the ConnectWallet component if not connected */}
      {!isConnected && (
        <div className={styles.thirdWeb}>
          <img src='thirdweb-logo-transparent-white.svg' alt='Your image description' width={200} />
          <ConnectWallet theme="dark" />
        </div>
      )}
      {/* Display XMTP connection options if connected but not initialized */}
      {isConnected && !client && (
        <div className={styles.xmtp}>
          <ConnectWallet theme="light" />
          <button onClick={initXmtpWithKeys} className={styles.btnXmtp}>Connect to XMTP</button>
          {conversations.map((conversation,index) => (
            <div key={index}>
              {conversation?.peerAddress}-{conversation.context?.conversationId}-{JSON.stringify(conversation.context?.metadata)}
            </div>
          ))}
        </div>
      )}
      {/* Render the Chat component if connected, initialized, and messages exist */}
      {isConnected && history && (
        <Chat  conversation={conversation} messageHistory={history} />
      )}
      

    </div>
  );
}