import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, BookOpen, MessageCircle, RefreshCw, Send, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useConversations, useDeleteConversation, useMessages, useSendMessage } from "@/lib/accounts-api";

export default function Messages() {
  const { conversationId } = useParams();
  const { user } = useAuth();
  const [body, setBody] = useState("");
  const bottom = useRef(null);
  const messageList = useRef(null);
  const previousScrollHeight = useRef(null);
  const olderRequestInFlight = useRef(false);
  const conversationsQuery = useConversations();
  const conversations = Array.isArray(conversationsQuery.data) ? conversationsQuery.data : [];
  const messagesQuery = useMessages(conversationId);
  const messages = [
    ...[...messagesQuery.historyPages].reverse().flatMap((page) => page.items),
    ...(messagesQuery.data?.items || []),
  ];
  const send = useSendMessage(conversationId);
  const remove = useDeleteConversation();
  const conversation = conversations.find((item) => item?.id === conversationId);
  const peer = conversation?.user || {};
  const latestMessageId = messages[messages.length - 1]?.id;

  useEffect(() => {
    if (messages.length) bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [conversationId, latestMessageId]);

  useEffect(() => {
    previousScrollHeight.current = null;
    olderRequestInFlight.current = false;
  }, [conversationId]);

  useEffect(() => {
    if (previousScrollHeight.current === null || messagesQuery.isLoadingOlderMessages) return;
    if (messageList.current) {
      messageList.current.scrollTop += messageList.current.scrollHeight - previousScrollHeight.current;
    }
    previousScrollHeight.current = null;
  }, [messages.length, messagesQuery.isLoadingOlderMessages]);

  const loadOlderMessages = () => {
    if (!messagesQuery.hasOlderMessages || messagesQuery.isLoadingOlderMessages || olderRequestInFlight.current) return;
    olderRequestInFlight.current = true;
    previousScrollHeight.current = messageList.current?.scrollHeight ?? null;
    messagesQuery.loadOlderMessages().finally(() => { olderRequestInFlight.current = false; });
  };

  const submit = async (event) => {
    event.preventDefault();
    const text = body.trim();
    if (!text) return;
    try {
      await send.mutateAsync(text);
      setBody("");
    } catch {
      // The mutation error is shown below the composer.
    }
  };

  return (
    <main className="mx-auto grid min-h-[70vh] max-w-5xl gap-4 px-4 py-7 sm:px-6 md:grid-cols-[300px_1fr]">
      <aside className="rounded-3xl border border-stone-200 bg-white p-4">
        <h1 className="mb-3 flex items-center gap-2 text-lg font-semibold text-stone-800"><MessageCircle className="h-5 w-5 text-amber-700" />Recipe conversations</h1>
        <p className="mb-3 text-xs leading-relaxed text-stone-500">Share recipe ideas, cooking notes, and questions with your friends.</p>
        {conversationsQuery.isLoading ? <p className="p-3 text-sm text-stone-500">Loading conversations…</p> : conversationsQuery.isError ? (
          <div className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800"><p>{conversationsQuery.error.message}</p><button onClick={() => conversationsQuery.refetch()} className="mt-2 inline-flex items-center gap-1 font-semibold"><RefreshCw className="h-3.5 w-3.5" />Try again</button></div>
        ) : conversations.length ? (
          <ul className="divide-y divide-stone-100">{conversations.map((item) => {
            const other = item?.user || {};
            return <li key={item.id} className={`flex items-center gap-2 rounded-xl px-2 ${item.id === conversationId ? "bg-amber-50" : ""}`}>
              <Link to={`/messages/${item.id}`} className="min-w-0 flex-1 py-3"><span className="block truncate text-sm font-semibold text-stone-800">{other.displayName || `@${other.username || "Community member"}`}</span><span className="block truncate text-xs text-stone-500">{item.lastMessage || "Start sharing recipe ideas"}</span></Link>
              <button title="Delete conversation from your inbox" aria-label={`Delete conversation with ${other.displayName || other.username || "user"}`} disabled={remove.isPending} onClick={() => remove.mutate(item.id)} className="rounded-lg p-2 text-stone-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"><Trash2 className="h-4 w-4" /></button>
            </li>;
          })}</ul>
        ) : <p className="p-3 text-sm text-stone-500">No conversations yet. Add a friend from their profile to start discussing a recipe.</p>}
      </aside>

      <section className="flex min-h-[60vh] flex-col overflow-hidden rounded-3xl border border-stone-200 bg-white">
        {!conversationId ? <div className="flex flex-1 flex-col items-center justify-center p-8 text-center"><span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700"><BookOpen className="h-7 w-7" /></span><h2 className="mt-4 font-semibold text-stone-800">A space for recipe ideas</h2><p className="mt-1 max-w-sm text-sm leading-relaxed text-stone-500">Choose a friend’s conversation to share ingredients, ask questions, and plan what to cook together.</p></div> : <>
          <header className="flex items-center gap-3 border-b border-stone-100 p-4">
            <Link to="/messages" aria-label="Back to conversations" className="rounded-full p-2 text-stone-500 hover:bg-stone-100"><ArrowLeft className="h-4 w-4" /></Link>
            <div className="min-w-0 flex-1"><h2 className="truncate font-semibold text-stone-800">{peer.displayName || (peer.username ? `@${peer.username}` : "Recipe conversation")}</h2>{peer.username && <Link to={`/members/${encodeURIComponent(peer.username)}`} className="text-xs text-stone-500">@{peer.username} · Recipe collaboration</Link>}</div>
          </header>
          <div ref={messageList} onScroll={(event) => { if (event.currentTarget.scrollTop <= 48) loadOlderMessages(); }} className="flex-1 space-y-3 overflow-y-auto p-4">
            {messagesQuery.isLoading ? <p className="py-8 text-center text-sm text-stone-500">Loading conversation…</p> : messagesQuery.isError ? <div className="mx-auto max-w-sm rounded-2xl bg-rose-50 p-4 text-center text-sm text-rose-800"><p>{messagesQuery.error.message}</p><button onClick={() => messagesQuery.refetch()} className="mt-3 inline-flex items-center gap-1 font-semibold"><RefreshCw className="h-3.5 w-3.5" />Reload messages</button></div> : messages.length ? <>{messagesQuery.isLoadingOlderMessages && <p className="py-2 text-center text-xs text-stone-500">Loading earlier messages…</p>}{messagesQuery.historyError && <p role="alert" className="py-2 text-center text-xs text-rose-700">Couldn’t load earlier messages. <button onClick={loadOlderMessages} className="font-semibold underline">Try again</button></p>}{messages.map((message) => <div key={message.id} className={`flex ${message.senderId === user?.id ? "justify-end" : "justify-start"}`}><div className={`max-w-[82%] rounded-2xl px-4 py-2.5 ${message.senderId === user?.id ? "bg-amber-700 text-white" : "bg-stone-100 text-stone-800"}`}><p className="whitespace-pre-wrap break-words text-sm">{message.body}</p><p className={`mt-1 text-[10px] ${message.senderId === user?.id ? "text-amber-100" : "text-stone-400"}`}>{message.senderId === user?.id ? "You" : `@${message.username || "member"}`}</p></div></div>)}</> : <div className="flex h-full min-h-48 flex-col items-center justify-center text-center"><BookOpen className="h-7 w-7 text-amber-600" /><p className="mt-3 text-sm font-medium text-stone-700">Start your recipe collaboration</p><p className="mt-1 text-xs text-stone-500">Share a dish idea, ingredient swap, or question.</p></div>}
            <div ref={bottom} />
          </div>
          <form onSubmit={submit} className="border-t border-stone-100 p-3">
            {send.isError && <p role="alert" className="mb-2 px-1 text-xs text-rose-700">{send.error.message}</p>}
            <div className="flex gap-2"><input value={body} onChange={(event) => setBody(event.target.value)} maxLength={2000} placeholder="Share a recipe idea or cooking question…" aria-label="Message" className="h-11 min-w-0 flex-1 rounded-xl border border-stone-200 px-3 text-sm outline-none focus:border-amber-400" /><button type="submit" disabled={!body.trim() || send.isPending || messagesQuery.isError} aria-label="Send message" className="inline-flex items-center gap-2 rounded-xl bg-amber-700 px-4 text-sm font-semibold text-white disabled:opacity-50"><Send className="h-4 w-4" /><span className="hidden sm:inline">Send</span></button></div>
          </form>
        </>}
      </section>
    </main>
  );
}
