
import Followups from "../ui/FollowUp"
import ConversationSidebar from "../ui/SideBar"
export default function MainPage(){
    return (
        <div>
            <ConversationSidebar/>
            <div className=""> <Followups conversationId=""/></div>
           
        </div>
    )
}