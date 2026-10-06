import { Link, useNavigate } from "react-router-dom";
import { MessageCircle, UserCheck, UserMinus } from "lucide-react";
import { useFriendAction, useFriends, useStartConversation } from "@/lib/accounts-api";

export default function FriendsPanel() {
  const { data: friends = [], isLoading } = useFriends();
  const accept = useFriendAction("accept");
  const remove = useFriendAction("remove");
  const start = useStartConversation();
  const navigate = useNavigate();
  const chat = async (username) => { try { const result = await start.mutateAsync(username); navigate(`/messages/${result.id}`); } catch (error) { window.alert(error.message); } };
  return <section className="mt-6 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6"><h2 className="font-semibold text-stone-800">Friends</h2><p className="mt-1 text-sm text-stone-500">Friend requests and your community connections.</p>{isLoading ? <p className="mt-4 text-sm text-stone-500">Loading…</p> : friends.length ? <ul className="mt-3 divide-y divide-stone-100">{friends.map((person) => <li key={person.id} className="flex items-center gap-3 py-3"><Link to={`/members/${encodeURIComponent(person.username)}`} className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-stone-800">{person.displayName}</span><span className="text-xs text-stone-500">@{person.username}</span></Link>{person.status === "pending" && person.direction === "incoming" ? <button onClick={() => accept.mutate({ username: person.username })} className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-900"><UserCheck className="h-3.5 w-3.5"/>Accept</button> : person.status === "pending" ? <span className="text-xs text-stone-500">Request sent</span> : <button onClick={() => chat(person.username)} className="inline-flex items-center gap-1 rounded-full bg-amber-700 px-3 py-2 text-xs font-semibold text-white"><MessageCircle className="h-3.5 w-3.5"/>Message</button>}<button onClick={() => remove.mutate({ username: person.username })} title="Remove friend" className="rounded-full p-2 text-stone-400 hover:bg-red-50 hover:text-red-600"><UserMinus className="h-4 w-4"/></button></li>)}</ul> : <p className="mt-4 text-sm text-stone-500">No friends yet. Find a community member above to send a request.</p>}</section>;
}
