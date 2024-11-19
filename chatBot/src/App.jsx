import { useState,useRef } from 'react'
import './App.css'
import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css';
import { MainContainer, ChatContainer, MessageList, Message, MessageInput, TypingIndicator } from '@chatscope/chat-ui-kit-react';
import { OpenAI } from 'openai';
import axios from 'axios';

const API_KEY = "";

const systemMessage = {"role": "system", "content": "Explain things like you're talking to a software professional with 2 years of experience."
}

const client = new OpenAI({
apiKey:  API_KEY,
dangerouslyAllowBrowser: true
})

function App() {

  const selectedFile = useRef(null);
  const selectedFileContent = useRef(null);

  const [messages, setMessages] = useState([
    {
      message: "Hello, I'm ChatGPT! Ask me anything!",
      sentTime: "just now",
      sender: "ChatGPT",
      direction: "incoming"
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = async (message) => {
    const newMessage = {
      message,
      direction: 'outgoing',
      sender: "user"
    };

    const newMessages = [...messages, newMessage];
    
    setMessages(newMessages);

    setIsTyping(true);
    await processMessageToChatGPT(newMessages);
  };

  async function processMessageToChatGPT(chatMessages) { 
    let apiMessages = chatMessages.map((messageObject) => {
      let role = "";
      if (messageObject.sender === "ChatGPT") {
        role = "assistant";
      } else {
        role = "user";
      }
      return { role: role, content: messageObject.message }
    });

    try {
      if(!selectedFileContent.current){

        const chatCompletion = await client.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            systemMessage,
            ...apiMessages,
          ]
        });
        if (chatCompletion && chatCompletion.choices && chatCompletion.choices.length > 0) {
          const responseMessage = chatCompletion.choices[0].message.content;
          setMessages([...chatMessages, {
            message: responseMessage,
            sender: "ChatGPT",
            direction: "incoming"
           }]);
         } else {
           console.error("Unexpected response format:", chatCompletion);
         }
      }
        else if(selectedFileContent.current){
          const chatCompletion = await client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              systemMessage,
              ...apiMessages,
    {role:"user",content:"the content of a file the user uploaded= " + selectedFileContent.current}
  ]
 });

 if (chatCompletion && chatCompletion.choices && chatCompletion.choices.length > 0) {
   const responseMessage = chatCompletion.choices[0].message.content;
   setMessages([...chatMessages,
     {
    sender:"File",
    message:selectedFileContent.current,
    direction:"outgoing"
   }, {
     message: responseMessage,
     sender: "ChatGPT",
     direction: "incoming"
    }]);
    selectedFileContent.current = null;
    selectedFile.current = null;
  } else {
    console.error("Unexpected response format:", chatCompletion);
  }
  
 }
} catch (error) {
      console.error("Error processing message to ChatGPT:", error);
    } finally {
      setIsTyping(false);
    }
  }
  

  const handleAttachment = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,.pdf,.docx';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        if (file.size > 500000000) {
          alert("File is too big! Please upload a file smaller than 500MB.");
          return;
        } else if (
          file.type !== "text/plain" &&
          file.type !== "application/pdf" &&
          file.type !== "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ) {
          alert("Invalid file type! Please upload a .txt, .pdf, or .docx file.");
          return;
        }
  
        // Create FormData and upload
        const formData = new FormData();
        formData.append('file', file);
  
       
    try {
      const response = await axios.post('http://localhost:3000/read-file', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Response:', response.data); // Logs the response from the server
      selectedFileContent.current = response.data.fileContent;
      alert("File uploaded successfully");
    } catch (error) {
          console.error("Error uploading file:", error.response || error.message);
        }
      }
    };
    input.click();
  };
  
  const handleAiMemory = () => {
    setMessages([]);
    alert("GPT memory cleared he forgot everything");
  };
  
    return (
      <div className="App">
      <div style={{ position:"relative", height: "800px", width: "700px"  }}>
        <MainContainer>
          <ChatContainer>       
            <MessageList 
              scrollBehavior="smooth" 
              typingIndicator={isTyping ? <TypingIndicator content="ChatGPT is typing" /> : null}
              >
              {messages
              .filter((message) =>
                 message.sender !== "File") // Skip messages with sender "File"
              .map((message, i) => {
                console.log(messages)
                return (
                  <Message 
                  key={i} 
                  model={message} 
                  message={message.sender === "File" ? "user uploaded a file" : message.message} 
                  />
                );
              })}
            </MessageList>
            <MessageInput placeholder="Type message here" onSend={handleSend} onAttachClick={handleAttachment} />        
          </ChatContainer>
        </MainContainer>
      </div>
      <button onClick={handleAiMemory}>clear GPT memory</button>
    </div>
  )
}

export default App