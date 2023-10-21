"use client";
import React, { useEffect } from "react";
import { Input } from "./ui/input";
import { Message, useChat } from "ai/react";
import { Button } from "./ui/button";
import { Send } from "lucide-react";
import MessageList from "./MessageList";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

type Props = { chatId: number };

const ChatComponent = ({ chatId }: Props) => {
  const {data, isLoading} = useQuery({
    queryKey: ["chat", chatId],
    queryFn: async () => {
      const response = await axios.post<Message[]>("/api/get-messages", {chatId})
      return response.data
    }
  })

  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: "/api/chat",
    body: {
      chatId
    },
    initialMessages: data || []
  });

  useEffect(() => {
    const messageContainer = document.getElementById("message-container")
    if(messageContainer) {
      messageContainer.scrollTo({
        top: messageContainer.scrollHeight,
        behavior: "smooth"
      })
    }
  })

  return (
    <div className="relative max-h-screen overflow-scroll" id="message-container">
      {/* header */}
      <div className="sticky top-0 inset-x-0 p-2 bg-white h-fit">
        <h3 className="text-xl font-bold">Chat</h3>
      </div>

      {/* message list */}
      <MessageList messages={messages} isLoading={isLoading} />

      <form
        onSubmit={handleSubmit}
        className="sticky bottom-0 inset-x-0 px-2 py-4 bg-white">
        <Input
          value={input}
          onChange={handleInputChange}
          className="w-full"
          placeholder="Ask any question..."
        />
        <Button className="bg-blue-600 ml-2">
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
};

export default ChatComponent;
