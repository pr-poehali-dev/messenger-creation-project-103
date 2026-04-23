import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";

const API = {
  auth: "https://functions.poehali.dev/7fc9ca74-9126-43b5-af00-b56f1e3035c8",
  messages: "https://functions.poehali.dev/ae4708bb-f731-47e3-876b-7c220fc72bc8",
  friends: "https://functions.poehali.dev/43084b98-5415-4cc8-9afd-3e4a1bd85b9b",
};

type Section = "chats" | "contacts" | "groups" | "suggestions" | "settings";

interface User { id: number; name: string; email: string; role: string; company: string; }
interface ChatItem { id: number; peer_id: number; peer_name: string; peer_role: string; peer_online: boolean; last_msg: string; last_time: string; unread: number; }
interface MessageItem { id: number; sender_id: number; text: string; type: string; file_name: string | null; time: string; out: boolean; }
interface ContactItem { id: number; name: string; role: string; company: string; online: boolean; initials: string; }
interface SuggestionItem { id: number; name: string; role: string; company: string; initials: string; mutual: number; }

const avatarColors = ["bg-slate-600","bg-stone-600","bg-zinc-600","bg-neutral-600","bg-slate-700","bg-stone-700","bg-zinc-700"];
function getAvatarColor(id: number) { return avatarColors[id % avatarColors.length]; }

function Avatar({ name, id, size = "md", online }: { name: string; id: number; size?: "sm" | "md" | "lg"; online?: boolean }) {
  const parts = name.trim().split(" ");
  const initials = (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
  const sizes = { sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-12 h-12 text-base" };
  return (
    <div className="relative flex-shrink-0">
      <div className={`${sizes[size]} ${getAvatarColor(id)} rounded-full flex items-center justify-center text-white font-medium tracking-wide uppercase`}>
        {initials}
      </div>
      {online !== undefined && (
        <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${online ? "bg-emerald-500" : "bg-slate-400"}`} />
      )}
    </div>
  );
}

// ── Auth screens ──────────────────────────────────────────────────────────────

function AuthScreen({ onLogin }: { onLogin: (user: User, token: string) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "", company: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const endpoint = mode === "login" ? "/login" : "/register";
    const payload = mode === "login"
      ? { email: form.email, password: form.password }
      : { name: form.name, email: form.email, password: form.password, role: form.role, company: form.company };
    const res = await fetch(API.auth + endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || "Ошибка"); return; }
    localStorage.setItem("user", JSON.stringify(data.user));
    localStorage.setItem("token", data.token);
    onLogin(data.user, data.token);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "hsl(220 14% 93%)" }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center" style={{ background: "hsl(var(--primary))" }}>
            <Icon name="Zap" size={22} className="text-white" />
          </div>
          <h1 className="text-xl font-semibold text-slate-800">Деловой мессенджер</h1>
          <p className="text-sm text-slate-500 mt-1">Профессиональное общение</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border p-6" style={{ borderColor: "hsl(var(--border))" }}>
          <div className="flex rounded-lg p-1 mb-5" style={{ background: "hsl(220 14% 93%)" }}>
            {(["login", "register"] as const).map((m) => (
              <button key={m} onClick={() => { setMode(m); setError(""); }}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${mode === m ? "bg-white text-slate-800 shadow-sm" : "text-slate-500"}`}>
                {m === "login" ? "Вход" : "Регистрация"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="flex flex-col gap-3">
            {mode === "register" && (
              <>
                <input required placeholder="Полное имя *" value={form.name} onChange={set("name")}
                  className="w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-blue-200 transition"
                  style={{ borderColor: "hsl(var(--border))", fontFamily: "inherit" }} />
                <input placeholder="Должность" value={form.role} onChange={set("role")}
                  className="w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-blue-200 transition"
                  style={{ borderColor: "hsl(var(--border))", fontFamily: "inherit" }} />
                <input placeholder="Компания" value={form.company} onChange={set("company")}
                  className="w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-blue-200 transition"
                  style={{ borderColor: "hsl(var(--border))", fontFamily: "inherit" }} />
              </>
            )}
            <input required type="email" placeholder="Email *" value={form.email} onChange={set("email")}
              className="w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-blue-200 transition"
              style={{ borderColor: "hsl(var(--border))", fontFamily: "inherit" }} />
            <input required type="password" placeholder="Пароль *" value={form.password} onChange={set("password")}
              className="w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-blue-200 transition"
              style={{ borderColor: "hsl(var(--border))", fontFamily: "inherit" }} />

            {error && <div className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</div>}

            <button type="submit" disabled={loading}
              className="w-full py-2 text-sm font-medium text-white rounded-lg mt-1 transition disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: "hsl(var(--primary))" }}>
              {loading ? <Icon name="Loader" size={16} className="animate-spin" /> : null}
              {loading ? "Подождите..." : mode === "login" ? "Войти" : "Создать аккаунт"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── Main Messenger ────────────────────────────────────────────────────────────

export default function Index() {
  const [user, setUser] = useState<User | null>(() => {
    try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");

  const [section, setSection] = useState<Section>("chats");
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [activeChat, setActiveChat] = useState<ChatItem | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());
  const [inputText, setInputText] = useState("");
  const [search, setSearch] = useState("");
  const [loadingMsgs, setLoadingMsgs] = useState(false);

  const authHeaders = () => ({
    "Content-Type": "application/json",
    "X-User-Id": String(user?.id ?? ""),
    "X-Session-Token": token,
  });

  const loadChats = useCallback(async () => {
    if (!user) return;
    const res = await fetch(API.messages + "/chats", { headers: authHeaders() });
    const data = await res.json();
    if (data.chats) setChats(data.chats);
  }, [user, token]);

  const loadMessages = useCallback(async (chat: ChatItem) => {
    setLoadingMsgs(true);
    const res = await fetch(API.messages + "/messages?chat_id=" + chat.id, { headers: authHeaders() });
    const data = await res.json();
    if (data.messages) setMessages(data.messages);
    setLoadingMsgs(false);
  }, [user, token]);

  const loadContacts = useCallback(async () => {
    if (!user) return;
    const res = await fetch(API.friends + "/contacts", { headers: authHeaders() });
    const data = await res.json();
    if (data.contacts) setContacts(data.contacts);
  }, [user, token]);

  const loadSuggestions = useCallback(async () => {
    if (!user) return;
    const res = await fetch(API.friends + "/suggestions", { headers: authHeaders() });
    const data = await res.json();
    if (data.suggestions) setSuggestions(data.suggestions);
  }, [user, token]);

  useEffect(() => {
    if (!user) return;
    loadChats();
  }, [user]);

  useEffect(() => {
    if (section === "contacts") loadContacts();
    if (section === "suggestions") loadSuggestions();
    if (section === "chats") loadChats();
  }, [section]);

  useEffect(() => {
    if (activeChat) loadMessages(activeChat);
  }, [activeChat]);

  const sendMessage = async () => {
    if (!inputText.trim() || !activeChat || !user) return;
    const text = inputText.trim();
    setInputText("");
    const res = await fetch(API.messages + "/messages", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ peer_id: activeChat.peer_id, text }),
    });
    const data = await res.json();
    if (data.message) {
      setMessages(prev => [...prev, { ...data.message, sender_id: user.id, type: "text", file_name: null, out: true }]);
      loadChats();
    }
  };

  const addFriend = async (id: number) => {
    await fetch(API.friends + "/add", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ friend_id: id }),
    });
    setAddedIds(prev => { const n = new Set(prev); n.add(id); return n; });
  };

  const startChat = async (contact: ContactItem) => {
    setSection("chats");
    const existing = chats.find(c => c.peer_id === contact.id);
    if (existing) { setActiveChat(existing); return; }
    const fakeChat: ChatItem = {
      id: -1, peer_id: contact.id, peer_name: contact.name,
      peer_role: contact.role, peer_online: contact.online,
      last_msg: "", last_time: "", unread: 0,
    };
    setActiveChat(fakeChat);
    setMessages([]);
  };

  const logout = async () => {
    await fetch(API.auth + "/logout", { method: "POST", headers: authHeaders() });
    localStorage.clear();
    setUser(null);
    setToken("");
  };

  const handleLogin = (u: User, t: string) => { setUser(u); setToken(t); };

  if (!user) return <AuthScreen onLogin={handleLogin} />;

  const navItems = [
    { key: "chats" as Section, icon: "MessageSquare", label: "Чаты" },
    { key: "contacts" as Section, icon: "Users", label: "Контакты" },
    { key: "groups" as Section, icon: "LayoutGrid", label: "Группы" },
    { key: "suggestions" as Section, icon: "UserPlus", label: "Друзья" },
    { key: "settings" as Section, icon: "Settings", label: "Настройки" },
  ];

  const filteredChats = chats.filter(c => c.peer_name.toLowerCase().includes(search.toLowerCase()));
  const filteredContacts = contacts.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ background: "hsl(220 14% 93%)" }}>
      {/* Sidebar */}
      <aside className="flex flex-col items-center gap-1 py-5 px-2 w-16 flex-shrink-0" style={{ background: "hsl(var(--sidebar-bg))" }}>
        <div className="mb-6 w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--sidebar-accent))" }}>
          <Icon name="Zap" size={18} className="text-white" />
        </div>
        {navItems.map((item) => (
          <button key={item.key} onClick={() => setSection(item.key)} title={item.label}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-150 relative group ${section === item.key ? "text-white" : "text-slate-500 hover:text-slate-300"}`}
            style={section === item.key ? { background: "hsl(var(--sidebar-active))" } : {}}>
            <Icon name={item.icon} size={18} />
            {section === item.key && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r" style={{ background: "hsl(var(--sidebar-accent))" }} />
            )}
            <span className="absolute left-14 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">{item.label}</span>
          </button>
        ))}
        <div className="mt-auto">
          <button onClick={logout} title="Выйти" className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-medium text-white relative group" style={{ background: getAvatarColor(user.id).replace("bg-", "") || "#4B5563" }}>
            <div className={`w-9 h-9 rounded-full ${getAvatarColor(user.id)} flex items-center justify-center text-xs font-medium text-white uppercase`}>
              {user.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
            </div>
            <span className="absolute left-12 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">Выйти</span>
          </button>
        </div>
      </aside>

      {/* Panel */}
      <div className="w-72 flex-shrink-0 flex flex-col border-r" style={{ background: "hsl(var(--panel-bg))", borderColor: "hsl(var(--border))" }}>
        <div className="px-4 pt-5 pb-3 border-b" style={{ borderColor: "hsl(var(--border))" }}>
          <h2 className="text-base font-semibold text-slate-800 mb-3">{navItems.find(n => n.key === section)?.label}</h2>
          {(section === "chats" || section === "contacts") && (
            <div className="relative">
              <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Поиск..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm rounded-md bg-white border outline-none focus:ring-1 transition-all"
                style={{ borderColor: "hsl(var(--border))", fontFamily: "inherit" }} />
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* CHATS */}
          {section === "chats" && (
            <div>
              {filteredChats.length === 0 && (
                <div className="px-4 py-8 text-center text-sm text-slate-400">
                  Нет чатов. Перейдите в «Контакты» и напишите коллеге.
                </div>
              )}
              {filteredChats.map(chat => (
                <button key={chat.id} onClick={() => setActiveChat(chat)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b ${activeChat?.id === chat.id ? "bg-blue-50" : "hover:bg-slate-50"}`}
                  style={{ borderColor: "hsl(220 13% 93%)" }}>
                  <Avatar name={chat.peer_name} id={chat.peer_id} online={chat.peer_online} />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm font-medium text-slate-800 truncate">{chat.peer_name}</span>
                      <span className="text-xs text-slate-400 ml-2 flex-shrink-0">{chat.last_time}</span>
                    </div>
                    <div className="flex justify-between items-center mt-0.5">
                      <span className="text-xs text-slate-500 truncate">{chat.last_msg}</span>
                      {chat.unread > 0 && (
                        <span className="ml-2 flex-shrink-0 w-4 h-4 rounded-full text-white text-[10px] flex items-center justify-center" style={{ background: "hsl(var(--primary))" }}>{chat.unread}</span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* CONTACTS */}
          {section === "contacts" && (
            <div>
              {filteredContacts.length === 0 && (
                <div className="px-4 py-8 text-center text-sm text-slate-400">Нет зарегистрированных пользователей</div>
              )}
              {filteredContacts.map(contact => (
                <div key={contact.id} className="flex items-center gap-3 px-4 py-3 border-b hover:bg-slate-50 transition-colors"
                  style={{ borderColor: "hsl(220 13% 93%)" }}>
                  <Avatar name={contact.name} id={contact.id} online={contact.online} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-800">{contact.name}</div>
                    <div className="text-xs text-slate-500 truncate">{contact.role}</div>
                    <div className="text-xs text-slate-400 truncate font-mono">{contact.company}</div>
                  </div>
                  <button onClick={() => startChat(contact)} className="p-1.5 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                    <Icon name="MessageSquare" size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* GROUPS */}
          {section === "groups" && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-1" style={{ background: "hsl(220 14% 87%)" }}>
                <Icon name="LayoutGrid" size={22} className="text-slate-400" />
              </div>
              <div className="text-sm font-medium text-slate-600">Групповые чаты</div>
              <div className="text-xs text-slate-400">Раздел появится после добавления контактов</div>
            </div>
          )}

          {/* SUGGESTIONS */}
          {section === "suggestions" && (
            <div>
              <div className="px-4 py-3 text-xs text-slate-500 border-b" style={{ borderColor: "hsl(220 13% 93%)" }}>
                Другие пользователи платформы
              </div>
              {suggestions.length === 0 && (
                <div className="px-4 py-8 text-center text-sm text-slate-400">Нет предложений</div>
              )}
              {suggestions.map(s => (
                <div key={s.id} className="flex items-center gap-3 px-4 py-3 border-b hover:bg-slate-50 transition-colors"
                  style={{ borderColor: "hsl(220 13% 93%)" }}>
                  <Avatar name={s.name} id={s.id} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-800">{s.name}</div>
                    <div className="text-xs text-slate-500 truncate">{s.role}</div>
                  </div>
                  <button onClick={() => addFriend(s.id)}
                    className={`p-1.5 rounded transition-colors ${addedIds.has(s.id) ? "text-emerald-600 bg-emerald-50" : "text-slate-400 hover:text-blue-600 hover:bg-blue-50"}`}>
                    <Icon name={addedIds.has(s.id) ? "UserCheck" : "UserPlus"} size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* SETTINGS */}
          {section === "settings" && (
            <div>
              <div className="px-4 py-4 border-b" style={{ borderColor: "hsl(220 13% 93%)" }}>
                <div className="flex items-center gap-3">
                  <Avatar name={user.name} id={user.id} size="lg" />
                  <div>
                    <div className="text-sm font-semibold text-slate-800">{user.name}</div>
                    <div className="text-xs text-slate-500">{user.role || "Роль не указана"}</div>
                    <div className="text-xs text-slate-400 font-mono">{user.email}</div>
                  </div>
                </div>
              </div>
              {[
                { icon: "Bell", label: "Уведомления" },
                { icon: "Lock", label: "Конфиденциальность" },
                { icon: "Palette", label: "Оформление" },
                { icon: "Shield", label: "Безопасность" },
                { icon: "HelpCircle", label: "Справка" },
              ].map(item => (
                <button key={item.label}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors border-b"
                  style={{ borderColor: "hsl(220 13% 93%)" }}>
                  <Icon name={item.icon} size={16} className="text-slate-400" />
                  {item.label}
                  <Icon name="ChevronRight" size={14} className="ml-auto text-slate-300" />
                </button>
              ))}
              <button onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-red-500 hover:bg-red-50 transition-colors mt-2">
                <Icon name="LogOut" size={16} />
                Выйти из аккаунта
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main chat */}
      {section === "chats" && activeChat ? (
        <div className="flex-1 flex flex-col min-w-0" style={{ background: "hsl(var(--chat-bg))" }}>
          <div className="flex items-center gap-3 px-5 py-3 border-b bg-white" style={{ borderColor: "hsl(var(--border))" }}>
            <Avatar name={activeChat.peer_name} id={activeChat.peer_id} online={activeChat.peer_online} />
            <div>
              <div className="text-sm font-semibold text-slate-800">{activeChat.peer_name}</div>
              <div className="text-xs text-slate-500">{activeChat.peer_role || (activeChat.peer_online ? "В сети" : "Не в сети")}</div>
            </div>
            <div className="ml-auto flex items-center gap-1">
              <button className="p-2 rounded hover:bg-slate-100 text-slate-500 transition-colors"><Icon name="Phone" size={16} /></button>
              <button className="p-2 rounded hover:bg-slate-100 text-slate-500 transition-colors"><Icon name="Video" size={16} /></button>
              <button className="p-2 rounded hover:bg-slate-100 text-slate-500 transition-colors"><Icon name="MoreVertical" size={16} /></button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-2">
            {loadingMsgs && (
              <div className="flex justify-center py-8">
                <Icon name="Loader" size={20} className="animate-spin text-slate-400" />
              </div>
            )}
            {!loadingMsgs && messages.length === 0 && (
              <div className="flex flex-col items-center justify-center flex-1 gap-2 text-center">
                <Icon name="MessageSquare" size={28} className="text-slate-300" />
                <span className="text-sm text-slate-400">Начните переписку с {activeChat.peer_name}</span>
              </div>
            )}
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.out ? "justify-end" : "justify-start"} animate-fade-in`}>
                {msg.type === "file" ? (
                  <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl max-w-xs ${msg.out ? "rounded-br-sm text-white" : "rounded-bl-sm bg-white text-slate-700"}`}
                    style={msg.out ? { background: "hsl(var(--msg-out))" } : {}}>
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${msg.out ? "bg-white/20" : "bg-blue-50"}`}>
                      <Icon name="FileText" size={18} className={msg.out ? "text-white" : "text-blue-600"} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate max-w-[160px]">{msg.file_name}</div>
                      <div className="text-xs opacity-60 mt-0.5">{msg.time}</div>
                    </div>
                  </div>
                ) : (
                  <div className={`px-4 py-2.5 rounded-2xl max-w-sm text-sm leading-relaxed ${msg.out ? "rounded-br-sm text-white" : "rounded-bl-sm bg-white text-slate-700 shadow-sm"}`}
                    style={msg.out ? { background: "hsl(var(--msg-out))" } : {}}>
                    <div>{msg.text}</div>
                    <div className={`text-[10px] mt-1 ${msg.out ? "text-white/60 text-right" : "text-slate-400"}`}>
                      {msg.time} {msg.out && <Icon name="CheckCheck" size={10} className="inline ml-1 opacity-80" />}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="px-5 py-3 bg-white border-t" style={{ borderColor: "hsl(var(--border))" }}>
            <div className="flex items-center gap-2 rounded-xl border px-3 py-2 bg-slate-50" style={{ borderColor: "hsl(var(--border))" }}>
              <button className="p-1 text-slate-400 hover:text-slate-600 transition-colors"><Icon name="Paperclip" size={16} /></button>
              <button className="p-1 text-slate-400 hover:text-slate-600 transition-colors"><Icon name="Image" size={16} /></button>
              <input type="text" placeholder="Введите сообщение..." value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                className="flex-1 bg-transparent text-sm outline-none text-slate-700 placeholder:text-slate-400"
                style={{ fontFamily: "inherit" }} />
              <button className="p-1 text-slate-400 hover:text-slate-600 transition-colors"><Icon name="Mic" size={16} /></button>
              <button onClick={sendMessage} disabled={!inputText.trim()}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-30 text-white"
                style={{ background: "hsl(var(--primary))" }}>
                <Icon name="Send" size={14} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-3" style={{ background: "hsl(var(--chat-bg))" }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-2" style={{ background: "hsl(220 14% 87%)" }}>
            <Icon name={navItems.find(n => n.key === section)?.icon ?? "MessageSquare"} size={28} className="text-slate-400" />
          </div>
          <div className="text-base font-medium text-slate-600">
            {section === "contacts" ? "Выберите контакт для переписки" :
             section === "groups" ? "Групповые чаты" :
             section === "suggestions" ? "Расширяйте деловую сеть" :
             section === "settings" ? "Настройки аккаунта" : "Выберите чат"}
          </div>
          <div className="text-sm text-slate-400">Профессиональный мессенджер для делового общения</div>
        </div>
      )}
    </div>
  );
}
