import { useState } from "react";
import Icon from "@/components/ui/icon";

type Section = "chats" | "contacts" | "groups" | "suggestions" | "settings";

interface Message {
  id: number;
  text: string;
  time: string;
  out: boolean;
  type?: "text" | "voice" | "file" | "image";
  fileName?: string;
  duration?: string;
}

interface Chat {
  id: number;
  name: string;
  role: string;
  lastMsg: string;
  time: string;
  unread?: number;
  online?: boolean;
  messages: Message[];
}

interface Contact {
  id: number;
  name: string;
  role: string;
  company: string;
  online?: boolean;
  initials: string;
}

interface Group {
  id: number;
  name: string;
  members: number;
  lastMsg: string;
  time: string;
  unread?: number;
  initials: string;
}

interface Suggestion {
  id: number;
  name: string;
  role: string;
  mutualContacts: number;
  initials: string;
}

const CHATS: Chat[] = [
  {
    id: 1,
    name: "Андрей Климов",
    role: "Генеральный директор",
    lastMsg: "Документы по контракту готовы к подписанию",
    time: "10:42",
    unread: 2,
    online: true,
    messages: [
      { id: 1, text: "Добрый день, Андрей. Готовы обсудить условия контракта?", time: "10:15", out: true, type: "text" },
      { id: 2, text: "Добрый день. Да, конечно. Я изучил ваше предложение.", time: "10:22", out: false, type: "text" },
      { id: 3, text: "Нас устраивают сроки поставки. Можем обсудить финансовые условия?", time: "10:31", out: false, type: "text" },
      { id: 4, text: "", time: "10:35", out: true, type: "file", fileName: "Условия_контракта_v3.pdf" },
      { id: 5, text: "Документы по контракту готовы к подписанию", time: "10:42", out: false, type: "text" },
    ],
  },
  {
    id: 2,
    name: "Мария Соколова",
    role: "Финансовый директор",
    lastMsg: "Квартальный отчёт загружен",
    time: "09:18",
    online: false,
    messages: [
      { id: 1, text: "Мария, когда будет готов квартальный отчёт?", time: "08:50", out: true, type: "text" },
      { id: 2, text: "", time: "09:10", out: false, type: "voice", duration: "0:48" },
      { id: 3, text: "Квартальный отчёт загружен", time: "09:18", out: false, type: "file", fileName: "Q3_2024_Report.xlsx" },
    ],
  },
  {
    id: 3,
    name: "Игорь Беляев",
    role: "Технический директор",
    lastMsg: "Сервер будет обновлён в 23:00",
    time: "Вчера",
    unread: 1,
    online: true,
    messages: [
      { id: 1, text: "Игорь, статус по обновлению инфраструктуры?", time: "Вчера 15:30", out: true, type: "text" },
      { id: 2, text: "Сервер будет обновлён в 23:00. Даунтайм — не более 15 минут.", time: "Вчера 16:10", out: false, type: "text" },
    ],
  },
  {
    id: 4,
    name: "Светлана Орлова",
    role: "Руководитель HR",
    lastMsg: "Кандидат подтвердил встречу",
    time: "Вчера",
    online: false,
    messages: [
      { id: 1, text: "Светлана, есть обновления по кандидату на позицию PM?", time: "Вчера 11:00", out: true, type: "text" },
      { id: 2, text: "Кандидат подтвердил встречу на завтра в 14:00.", time: "Вчера 11:45", out: false, type: "text" },
    ],
  },
  {
    id: 5,
    name: "Павел Кузнецов",
    role: "Старший юрист",
    lastMsg: "Правовое заключение по договору готово",
    time: "Пн",
    online: false,
    messages: [
      { id: 1, text: "Павел, нужно заключение по новому договору с поставщиком.", time: "Пн 09:00", out: true, type: "text" },
      { id: 2, text: "Правовое заключение по договору готово", time: "Пн 17:30", out: false, type: "file", fileName: "Legal_Opinion_Supplier.pdf" },
    ],
  },
];

const CONTACTS: Contact[] = [
  { id: 1, name: "Андрей Климов", role: "Генеральный директор", company: "АО «Технопром»", online: true, initials: "АК" },
  { id: 2, name: "Мария Соколова", role: "Финансовый директор", company: "АО «Технопром»", online: false, initials: "МС" },
  { id: 3, name: "Игорь Беляев", role: "Технический директор", company: "АО «Технопром»", online: true, initials: "ИБ" },
  { id: 4, name: "Светлана Орлова", role: "Руководитель HR", company: "АО «Технопром»", online: false, initials: "СО" },
  { id: 5, name: "Павел Кузнецов", role: "Старший юрист", company: "АО «Технопром»", online: false, initials: "ПК" },
  { id: 6, name: "Наталья Фёдорова", role: "Директор по маркетингу", company: "ООО «МаркетГрупп»", online: true, initials: "НФ" },
  { id: 7, name: "Дмитрий Романов", role: "Коммерческий директор", company: "ЗАО «РусТорг»", online: false, initials: "ДР" },
];

const GROUPS: Group[] = [
  { id: 1, name: "Совет директоров", members: 6, lastMsg: "Заседание перенесено на пятницу", time: "11:05", unread: 3, initials: "СД" },
  { id: 2, name: "Проект «Экспансия»", members: 14, lastMsg: "Презентация для инвесторов обновлена", time: "09:40", initials: "ПЭ" },
  { id: 3, name: "IT-инфраструктура", members: 8, lastMsg: "Плановое ТО в эту субботу", time: "Вчера", initials: "IT" },
  { id: 4, name: "HR и кадровая служба", members: 5, lastMsg: "Новый регламент по командировкам", time: "Вчера", unread: 1, initials: "HR" },
  { id: 5, name: "Юридический отдел", members: 4, lastMsg: "Обновлены шаблоны договоров", time: "Пн", initials: "ЮО" },
];

const SUGGESTIONS: Suggestion[] = [
  { id: 1, name: "Екатерина Власова", role: "Директор по развитию", mutualContacts: 5, initials: "ЕВ" },
  { id: 2, name: "Алексей Тарасов", role: "Партнёр, юридическая фирма", mutualContacts: 3, initials: "АТ" },
  { id: 3, name: "Ольга Смирнова", role: "Инвестиционный аналитик", mutualContacts: 7, initials: "ОС" },
  { id: 4, name: "Роман Захаров", role: "Вице-президент по продажам", mutualContacts: 2, initials: "РЗ" },
];

const avatarColors = [
  "bg-slate-600", "bg-stone-600", "bg-zinc-600",
  "bg-neutral-600", "bg-slate-700", "bg-stone-700", "bg-zinc-700"
];

function getAvatarColor(id: number) {
  return avatarColors[id % avatarColors.length];
}

function Avatar({ initials, id, size = "md", online }: { initials: string; id: number; size?: "sm" | "md" | "lg"; online?: boolean }) {
  const sizes = { sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-12 h-12 text-base" };
  return (
    <div className="relative flex-shrink-0">
      <div className={`${sizes[size]} ${getAvatarColor(id)} rounded-full flex items-center justify-center text-white font-medium tracking-wide`}>
        {initials}
      </div>
      {online !== undefined && (
        <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${online ? "bg-emerald-500" : "bg-slate-400"}`} />
      )}
    </div>
  );
}

export default function Index() {
  const [section, setSection] = useState<Section>("chats");
  const [activeChat, setActiveChat] = useState<Chat | null>(CHATS[0]);
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<Record<number, Message[]>>(
    Object.fromEntries(CHATS.map((c) => [c.id, c.messages]))
  );
  const [search, setSearch] = useState("");
  const [addedContacts, setAddedContacts] = useState<Set<number>>(new Set());

  const navItems = [
    { key: "chats" as Section, icon: "MessageSquare", label: "Чаты" },
    { key: "contacts" as Section, icon: "Users", label: "Контакты" },
    { key: "groups" as Section, icon: "LayoutGrid", label: "Группы" },
    { key: "suggestions" as Section, icon: "UserPlus", label: "Друзья" },
    { key: "settings" as Section, icon: "Settings", label: "Настройки" },
  ];

  const sendMessage = () => {
    if (!inputText.trim() || !activeChat) return;
    const msg: Message = {
      id: Date.now(),
      text: inputText.trim(),
      time: new Date().toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" }),
      out: true,
      type: "text",
    };
    setMessages((prev) => ({ ...prev, [activeChat.id]: [...(prev[activeChat.id] || []), msg] }));
    setInputText("");
  };

  const filteredChats = CHATS.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.lastMsg.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ background: "hsl(220 14% 93%)" }}>
      {/* Sidebar nav */}
      <aside
        className="flex flex-col items-center gap-1 py-5 px-2 w-16 flex-shrink-0"
        style={{ background: "hsl(var(--sidebar-bg))" }}
      >
        <div className="mb-6 w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--sidebar-accent))" }}>
          <Icon name="Zap" size={18} className="text-white" />
        </div>
        {navItems.map((item) => (
          <button
            key={item.key}
            onClick={() => setSection(item.key)}
            title={item.label}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-150 relative group ${
              section === item.key ? "text-white" : "text-slate-500 hover:text-slate-300"
            }`}
            style={section === item.key ? { background: "hsl(var(--sidebar-active))" } : {}}
          >
            <Icon name={item.icon} size={18} />
            {section === item.key && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r" style={{ background: "hsl(var(--sidebar-accent))" }} />
            )}
            <span className="absolute left-14 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
              {item.label}
            </span>
          </button>
        ))}
        <div className="mt-auto">
          <div className="w-9 h-9 rounded-full bg-slate-600 flex items-center justify-center text-white text-xs font-medium">
            ВА
          </div>
        </div>
      </aside>

      {/* Panel */}
      <div className="w-72 flex-shrink-0 flex flex-col border-r" style={{ background: "hsl(var(--panel-bg))", borderColor: "hsl(var(--border))" }}>
        <div className="px-4 pt-5 pb-3 border-b" style={{ borderColor: "hsl(var(--border))" }}>
          <h2 className="text-base font-semibold text-slate-800 mb-3">
            {navItems.find((n) => n.key === section)?.label}
          </h2>
          {(section === "chats" || section === "contacts") && (
            <div className="relative">
              <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Поиск..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm rounded-md bg-white border outline-none focus:ring-1 transition-all"
                style={{ borderColor: "hsl(var(--border))", fontFamily: "inherit" }}
              />
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {section === "chats" && (
            <div>
              {filteredChats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => { setActiveChat(chat); setSection("chats"); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b ${
                    activeChat?.id === chat.id ? "bg-blue-50" : "hover:bg-slate-50"
                  }`}
                  style={{ borderColor: "hsl(220 13% 93%)" }}
                >
                  <Avatar initials={chat.name.split(" ").map((n) => n[0]).join("").slice(0, 2)} id={chat.id} online={chat.online} />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm font-medium text-slate-800 truncate">{chat.name}</span>
                      <span className="text-xs text-slate-400 ml-2 flex-shrink-0">{chat.time}</span>
                    </div>
                    <div className="flex justify-between items-center mt-0.5">
                      <span className="text-xs text-slate-500 truncate">{chat.lastMsg}</span>
                      {chat.unread && (
                        <span className="ml-2 flex-shrink-0 w-4 h-4 rounded-full text-white text-[10px] flex items-center justify-center"
                          style={{ background: "hsl(var(--primary))" }}>
                          {chat.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {section === "contacts" && (
            <div>
              {CONTACTS.filter((c) => c.name.toLowerCase().includes(search.toLowerCase())).map((contact) => (
                <div key={contact.id} className="flex items-center gap-3 px-4 py-3 border-b hover:bg-slate-50 transition-colors"
                  style={{ borderColor: "hsl(220 13% 93%)" }}>
                  <Avatar initials={contact.initials} id={contact.id} online={contact.online} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-800">{contact.name}</div>
                    <div className="text-xs text-slate-500 truncate">{contact.role}</div>
                    <div className="text-xs text-slate-400 truncate font-mono">{contact.company}</div>
                  </div>
                  <button className="p-1.5 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                    <Icon name="MessageSquare" size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {section === "groups" && (
            <div>
              <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b transition-colors hover:bg-slate-50"
                style={{ color: "hsl(var(--primary))", borderColor: "hsl(220 13% 93%)" }}>
                <Icon name="Plus" size={15} />
                Создать группу
              </button>
              {GROUPS.map((group) => (
                <button key={group.id}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors border-b"
                  style={{ borderColor: "hsl(220 13% 93%)" }}>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 ${getAvatarColor(group.id)}`}>
                    {group.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm font-medium text-slate-800 truncate">{group.name}</span>
                      <span className="text-xs text-slate-400 ml-2 flex-shrink-0">{group.time}</span>
                    </div>
                    <div className="flex justify-between items-center mt-0.5">
                      <span className="text-xs text-slate-500 truncate">{group.lastMsg}</span>
                      {group.unread && (
                        <span className="ml-2 flex-shrink-0 w-4 h-4 rounded-full text-white text-[10px] flex items-center justify-center"
                          style={{ background: "hsl(var(--primary))" }}>
                          {group.unread}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">{group.members} участников</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {section === "suggestions" && (
            <div>
              <div className="px-4 py-3 text-xs text-slate-500 border-b" style={{ borderColor: "hsl(220 13% 93%)" }}>
                На основе ваших деловых связей
              </div>
              {SUGGESTIONS.map((s) => (
                <div key={s.id} className="flex items-center gap-3 px-4 py-3 border-b hover:bg-slate-50 transition-colors"
                  style={{ borderColor: "hsl(220 13% 93%)" }}>
                  <Avatar initials={s.initials} id={s.id} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-800">{s.name}</div>
                    <div className="text-xs text-slate-500 truncate">{s.role}</div>
                    <div className="text-xs text-slate-400">{s.mutualContacts} общих контакта</div>
                  </div>
                  <button
                    onClick={() => setAddedContacts((prev) => { const n = new Set(prev); if (n.has(s.id)) { n.delete(s.id); } else { n.add(s.id); } return n; })}
                    className={`p-1.5 rounded transition-colors ${addedContacts.has(s.id) ? "text-emerald-600 bg-emerald-50" : "text-slate-400 hover:text-blue-600 hover:bg-blue-50"}`}>
                    <Icon name={addedContacts.has(s.id) ? "UserCheck" : "UserPlus"} size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {section === "settings" && (
            <div className="py-2">
              {[
                { icon: "User", label: "Профиль" },
                { icon: "Bell", label: "Уведомления" },
                { icon: "Lock", label: "Конфиденциальность" },
                { icon: "Palette", label: "Оформление" },
                { icon: "HardDrive", label: "Данные и хранилище" },
                { icon: "Shield", label: "Безопасность" },
                { icon: "HelpCircle", label: "Справка" },
              ].map((item) => (
                <button key={item.label}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors border-b"
                  style={{ borderColor: "hsl(220 13% 93%)" }}>
                  <Icon name={item.icon} size={16} className="text-slate-400" />
                  {item.label}
                  <Icon name="ChevronRight" size={14} className="ml-auto text-slate-300" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main area */}
      {section === "chats" && activeChat ? (
        <div className="flex-1 flex flex-col min-w-0" style={{ background: "hsl(var(--chat-bg))" }}>
          <div className="flex items-center gap-3 px-5 py-3 border-b bg-white"
            style={{ borderColor: "hsl(var(--border))" }}>
            <Avatar
              initials={activeChat.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              id={activeChat.id}
              size="md"
              online={activeChat.online}
            />
            <div>
              <div className="text-sm font-semibold text-slate-800">{activeChat.name}</div>
              <div className="text-xs text-slate-500">{activeChat.role}</div>
            </div>
            <div className="ml-auto flex items-center gap-1">
              <button className="p-2 rounded hover:bg-slate-100 text-slate-500 transition-colors">
                <Icon name="Phone" size={16} />
              </button>
              <button className="p-2 rounded hover:bg-slate-100 text-slate-500 transition-colors">
                <Icon name="Video" size={16} />
              </button>
              <button className="p-2 rounded hover:bg-slate-100 text-slate-500 transition-colors">
                <Icon name="Search" size={16} />
              </button>
              <button className="p-2 rounded hover:bg-slate-100 text-slate-500 transition-colors">
                <Icon name="MoreVertical" size={16} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-2">
            {(messages[activeChat.id] || []).map((msg) => (
              <div key={msg.id} className={`flex ${msg.out ? "justify-end" : "justify-start"} animate-fade-in`}>
                {msg.type === "voice" ? (
                  <div className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl max-w-xs ${
                    msg.out ? "rounded-br-sm text-white" : "rounded-bl-sm bg-white text-slate-700"
                  }`} style={msg.out ? { background: "hsl(var(--msg-out))" } : {}}>
                    <button className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                      <Icon name="Play" size={12} className={msg.out ? "text-white" : "text-blue-600"} />
                    </button>
                    <div className="flex gap-0.5 items-center h-6">
                      {Array.from({ length: 20 }).map((_, i) => (
                        <div key={i} className={`w-0.5 rounded-full ${msg.out ? "bg-white/60" : "bg-slate-300"}`}
                          style={{ height: `${6 + ((i * 7 + 3) % 9)}px` }} />
                      ))}
                    </div>
                    <span className="text-xs opacity-70">{msg.duration}</span>
                  </div>
                ) : msg.type === "file" ? (
                  <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl max-w-xs ${
                    msg.out ? "rounded-br-sm text-white" : "rounded-bl-sm bg-white text-slate-700"
                  }`} style={msg.out ? { background: "hsl(var(--msg-out))" } : {}}>
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${msg.out ? "bg-white/20" : "bg-blue-50"}`}>
                      <Icon name="FileText" size={18} className={msg.out ? "text-white" : "text-blue-600"} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate max-w-[160px]">{msg.fileName}</div>
                      <div className="text-xs opacity-60 mt-0.5">{msg.time}</div>
                    </div>
                    <Icon name="Download" size={14} className="opacity-60 ml-1 flex-shrink-0" />
                  </div>
                ) : (
                  <div className={`px-4 py-2.5 rounded-2xl max-w-sm text-sm leading-relaxed ${
                    msg.out ? "rounded-br-sm text-white" : "rounded-bl-sm bg-white text-slate-700 shadow-sm"
                  }`} style={msg.out ? { background: "hsl(var(--msg-out))" } : {}}>
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
            <div className="flex items-center gap-2 rounded-xl border px-3 py-2 bg-slate-50"
              style={{ borderColor: "hsl(var(--border))" }}>
              <button className="p-1 text-slate-400 hover:text-slate-600 transition-colors">
                <Icon name="Paperclip" size={16} />
              </button>
              <button className="p-1 text-slate-400 hover:text-slate-600 transition-colors">
                <Icon name="Image" size={16} />
              </button>
              <input
                type="text"
                placeholder="Введите сообщение..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                className="flex-1 bg-transparent text-sm outline-none text-slate-700 placeholder:text-slate-400"
                style={{ fontFamily: "inherit" }}
              />
              <button className="p-1 text-slate-400 hover:text-slate-600 transition-colors">
                <Icon name="Mic" size={16} />
              </button>
              <button
                onClick={sendMessage}
                disabled={!inputText.trim()}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-30 text-white"
                style={{ background: "hsl(var(--primary))" }}
              >
                <Icon name="Send" size={14} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-3" style={{ background: "hsl(var(--chat-bg))" }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-2"
            style={{ background: "hsl(220 14% 87%)" }}>
            <Icon name={navItems.find((n) => n.key === section)?.icon ?? "MessageSquare"} size={28} className="text-slate-400" />
          </div>
          <div className="text-base font-medium text-slate-600">
            {section === "contacts" ? "Ваши деловые контакты" :
             section === "groups" ? "Выберите группу для общения" :
             section === "suggestions" ? "Расширяйте деловую сеть" :
             section === "settings" ? "Настройки аккаунта" :
             "Выберите чат"}
          </div>
          <div className="text-sm text-slate-400 text-center max-w-xs">
            Профессиональный мессенджер для делового общения
          </div>
        </div>
      )}
    </div>
  );
}