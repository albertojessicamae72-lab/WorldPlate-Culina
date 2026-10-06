import { useNavigate } from "react-router-dom";
import { MessageCircle, UserPlus, UserCheck } from "lucide-react";
import { useFriendAction, useFriends, useStartConversation } from "@/lib/accounts-api";

export default function MemberSocialActions({ username }) {
  const navigate = useNavigate();
  const { data: friends = [] } = useFriends();
  const request = useFriendAction("request");
  const accept = useFriendAction("accept");
  const start = useStartConversation();
  const relationship = friends.find((item) => item.username.toLowerCase() === username.toLowerCase());
  const openChat = async () => { try { const conversation = await start.mutateAsync(username); navigate(`/messages/${conversation.id}`); } catch (error) { window.alert(error.message); } };
  if (relationship?.status === "accepted") return <button onClick={openChat} className="inline-flex items-center gap-2 rounded-full bg-amber-700 px-4 py-2 text-sm font-semibold text-white"><MessageCircle className="h-4 w-4"/>Message</button>;
  if (relationship?.direction === "incoming") return <button onClick={() => accept.mutate({ username })} disabled={accept.isPending} className="inline-flex items-center gap-2 rounded-full bg-amber-700 px-4 py-2 text-sm font-semibold text-white"><UserCheck className="h-4 w-4"/>Accept friend</button>;
  if (relationship) return <span className="inline-flex items-center gap-2 rounded-full bg-stone-100 px-4 py-2 text-sm text-stone-600"><UserCheck className="h-4 w-4"/>Request sent</span>;
  return <button onClick={() => request.mutate({ username })} disabled={request.isPending} className="inline-flex items-center gap-2 rounded-full bg-amber-700 px-4 py-2 text-sm font-semibold text-white"><UserPlus className="h-4 w-4"/>Add friend</button>;
}
