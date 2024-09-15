import MyChatSection from "./sections/MyChatSection";
import ChatDetailSection from "./sections/ChatDetailSection";
import { Fragment } from "react";

const ChatScreen = () => {
  return (
    <Fragment>
      <MyChatSection />
      <ChatDetailSection />
    </Fragment>
  );
};

export default ChatScreen;
