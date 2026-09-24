"use client";
import { useEffect, useRef, useState } from "react";
import {
ArrowDownToLine,
ArrowRight,
Braces,
Check,
CheckCheck,
ChevronDown,
Clock3,
Copy,
ExternalLink,
Eye,
FileSpreadsheet,
FileText,
LayoutDashboard,
LoaderCircle,
LogOut,
Mail,
Menu,
MessageSquare,
Pencil,
Plus,
RotateCcw,
Save,
Search,
Settings,
ShieldCheck,
Trash2,
Upload,
Users,
X
} from "lucide-react";
import { readAll, supabase, unwrap } from "../lib/supabase";
import {
downloadSampleCSV,
exportMessages,
importContacts,
validateContact,
validateLinkedInUrl
} from "../lib/files";
import {
Avatar,
Brand,
Button,
EmptyState,
Modal,
Pagination,
Status,
formatDate,
fullName
} from "./ui";
const DEFAULT_TEMPLATE =
"Hi {{firstName}}, hope you’re doing well! I’m a recent B.Tech graduate currently looking for entry-level opportunities in Data Analytics and Data Engineering. I wanted to reach out and ask if you happen to know of any suitable openings at your company. If you come across any relevant roles, I’d really appreciate it if you could let me know. Thank you!";
const EMPTY_CONTACT = {
first_name: "",
last_name: "",
company: "",
job_title: "",
linkedin_url: ""
};
const NAVIGATION = [
{ id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
{ id: "contacts", label: "Contacts", icon: Users },
{ id: "messages", label: "Messages", icon: MessageSquare },
{ id: "history", label: "History", icon: Clock3 },
{ id: "settings", label: "Settings", icon: Settings }
];
const PAGE_SIZE = 8;
const MESSAGE_PAGE_SIZE = 6;
function matchesStatus(item, filter) {
return (
filter === "all" ||
(filter === "sent" ? Boolean(item.sent_at) : !item.sent_at)
);
}
function ProfileLink({ url, compact = false }) {
if (!url) return compact ? <span className="muted">—</span> : null;
let safeUrl;
try {
safeUrl = validateLinkedInUrl(url);
} catch {
return <span className="muted small">Invalid profile URL</span>;
}
return (
<a
href={safeUrl}
target="_blank"
rel="noopener noreferrer"
className={compact ? "profile-link" : "button secondary"}
>
{compact ? "View profile" : "Open LinkedIn"}
<ExternalLink size={14} aria-hidden="true" />
</a>
);
}
function FilterBar({
query,
onQueryChange,
status,
onStatusChange,
placeholder,
children
}) {
return (
<div className="filter-bar">
<div className="search-field">
<Search size={17} aria-hidden="true" />
<input
type="search"
value={query}
onChange={(event) => onQueryChange(event.target.value)}
placeholder={placeholder}
aria-label={placeholder}
/>
</div>
<select
className="status-filter"
value={status}
onChange={(event) => onStatusChange(event.target.value)}
aria-label="Filter by status"
>
<option value="all">All statuses</option>
<option value="not-sent">Not Sent</option>
<option value="sent">Sent</option>
</select>
{children}
</div>
);
}
export default function Workspace({ session, notify, onLogout }) {
const [page, setPage] = useState("dashboard");
  const userMetadata = session.user.user_metadata || {};

  const displayName =
    userMetadata.full_name?.trim() ||
    session.user.email?.split("@")[0] ||
    "User";

  const firstName =
    displayName.split(/\s+/)[0] || "there";

  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
const [mobileNav, setMobileNav] = useState(false);
const [loading, setLoading] = useState(true);
const [loadError, setLoadError] = useState("");
const [retry, setRetry] = useState(0);
const [busy, setBusy] = useState(false);
const [contacts, setContacts] = useState([]);
const [messages, setMessages] = useState([]);
const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
const [savedTemplate, setSavedTemplate] = useState(DEFAULT_TEMPLATE);
const [selected, setSelected] = useState(new Set());
const [contactQuery, setContactQuery] = useState("");
const [contactStatus, setContactStatus] = useState("all");
const [contactPage, setContactPage] = useState(1);
const [messageQuery, setMessageQuery] = useState("");
const [messageStatus, setMessageStatus] = useState("all");
const [messagePage, setMessagePage] = useState(1);
const [contactDraft, setContactDraft] = useState(null);
const [viewMessageId, setViewMessageId] = useState(null);
const [confirmation, setConfirmation] = useState(null);
const [exportOpen, setExportOpen] = useState(false);
const [copiedId, setCopiedId] = useState(null);
const csvInput = useRef(null);
const excelInput = useRef(null);
const selectAllInput = useRef(null);
const operationLock = useRef(false);
const userId = session.user.id;
const dirty = template !== savedTemplate;
useEffect(() => {
let active = true;
setLoading(true);
setLoadError("");
(async () => {
try {
unwrap(await supabase.rpc("initialize_workspace"));
const [nextContacts, nextMessages, settingsResult] =
await Promise.all([
readAll("contacts"),
readAll("messages", false),
        supabase
.from("workspace_settings")
.select("template")
.eq("user_id", userId)
.single()
]);
const settings = unwrap(settingsResult);
if (!active) return;
setContacts(nextContacts);
setMessages(nextMessages);
setTemplate(settings.template);
setSavedTemplate(settings.template);
setSelected(
new Set(nextContacts.slice(0, 1000).map((contact) => contact.id))
);
} catch (error) {
if (active) setLoadError(error.message);
} finally {
if (active) setLoading(false);
}
})();
return () => { active = false; };
}, [userId, retry]);
useEffect(() => {
if (!dirty) return;
function warnBeforeLeaving(event) {
  event.preventDefault();

  event.returnValue = "";
}
window.addEventListener("beforeunload", warnBeforeLeaving);
return () =>
window.removeEventListener("beforeunload", warnBeforeLeaving);
}, [dirty]);
useEffect(() => {
setContactPage(1);
}, [contactQuery, contactStatus]);
useEffect(() => {
setMessagePage(1);
}, [messageQuery, messageStatus, page]);
useEffect(() => {
if (!copiedId) return;
const timeout = setTimeout(() => setCopiedId(null), 2200);
return () => clearTimeout(timeout);
}, [copiedId]);
const filteredContacts = contacts.filter((contact) => {
const searchable = [
  contact.first_name,

  contact.last_name,

  contact.company,

  contact.job_title,

  contact.linkedin_url
].join(" ").toLowerCase();
return (
  searchable.includes(contactQuery.toLowerCase()) &&
matchesStatus(contact, contactStatus)
);
});
const filteredMessages = messages.filter((message) => {
const searchable =
`${fullName(message)} ${message.company} ${message.body}`.toLowerCase();
return (
  searchable.includes(messageQuery.toLowerCase()) &&
matchesStatus(message, messageStatus)
);
});
const currentContactPage = Math.min(
contactPage,
Math.max(1, Math.ceil(filteredContacts.length / PAGE_SIZE))
);
const currentMessagePage = Math.min(
messagePage,
Math.max(1, Math.ceil(filteredMessages.length / MESSAGE_PAGE_SIZE))
);
const visibleContacts = filteredContacts.slice(
(currentContactPage - 1) * PAGE_SIZE,
currentContactPage * PAGE_SIZE
);
const visibleMessages = filteredMessages.slice(
(currentMessagePage - 1) * MESSAGE_PAGE_SIZE,
currentMessagePage * MESSAGE_PAGE_SIZE
);
const filteredSelectedCount = filteredContacts.filter((contact) =>
selected.has(contact.id)
).length;
const allFilteredSelected =
filteredContacts.length > 0 &&

filteredSelectedCount === filteredContacts.length;
useEffect(() => {
if (selectAllInput.current) {
  selectAllInput.current.indeterminate =

    filteredSelectedCount > 0 && !allFilteredSelected;
}
}, [filteredSelectedCount, allFilteredSelected, page, loading]);
const readyCount = messages.filter((message) => !message.sent_at).length;
const sentCount = messages.filter((message) => message.sent_at).length;
const copyCount = messages.reduce(
(sum, message) => sum + message.copied_count,
0
);
const viewedMessage = messages.find(
(message) => message.id === viewMessageId
);
function navigate(nextPage) {
setPage(nextPage);
setMobileNav(false);
setExportOpen(false);
}
async function perform(task) {
if (operationLock.current) return;
operationLock.current = true;
setBusy(true);
try {
await task();
} catch (error) {
notify(error.message || "Something went wrong. Please try again.", true);
} finally {
  operationLock.current = false;
setBusy(false);
}
}
async function refresh() {
const [nextContacts, nextMessages] = await Promise.all([
readAll("contacts"),
readAll("messages", false)
]);
setContacts(nextContacts);
setMessages(nextMessages);
const existingIds = new Set(nextContacts.map((contact) => contact.id));
setSelected((previous) =>
new Set([...previous].filter((id) => existingIds.has(id)))
);
}
async function saveTemplate() {
if (!template.length || template.length > 10000) {
throw new Error("Your template must contain 1–10,000 characters.");
}
unwrap(
await supabase
.from("workspace_settings")
.update({ template })
.eq("user_id", userId)
);
setSavedTemplate(template);
notify("Template saved exactly as written.");
}
async function generateMessages() {
if (!selected.size) {
throw new Error("Select at least one contact.");
}
if (selected.size > 1000) {
throw new Error("Select up to 1,000 contacts for each batch.");
}
if (!template.includes("{{firstName}}")) {
throw new Error("Your template must include {{firstName}}.");
}
const chosen = contacts.filter((contact) => selected.has(contact.id));
const valid = chosen.filter(
(contact) =>
typeof contact.first_name === "string" &&
    contact.first_name.trim().length > 0
);
const skipped = chosen.length - valid.length;
if (!valid.length) {
throw new Error("Selected contacts are missing a first name.");
}
// Generation is performed in PostgreSQL, not with AI:
// replace(p_template, '{{firstName}}', c.first_name).
const count = unwrap(
await supabase.rpc("generate_messages", {
p_contact_ids: valid.map((contact) => contact.id),
p_template: template
})
);
setMessageQuery("");
setMessageStatus("all");
setMessagePage(1);
navigate("messages");
await refresh();
notify(
`${count} messages generated. Only first names changed.` +
(skipped
? ` ${skipped} contacts were skipped because their first name is missing.`
: ""),
  skipped > 0
);
}
async function saveContact(event) {
event.preventDefault();
await perform(async () => {
const values = validateContact(contactDraft);
const editing = Boolean(contactDraft.id);
if (editing) {
unwrap(
await supabase
.from("contacts")
.update(values)
.eq("id", contactDraft.id)
);
} else {
const inserted = unwrap(
await supabase
.from("contacts")
.insert(values)
.select("id")
.single()
);
setSelected((previous) => new Set([...previous, inserted.id]));
}
setContactDraft(null);
await refresh();
notify(editing ? "Contact updated." : "Contact added.");
});
}
async function handleImport(event) {
const file = event.target.files?.[0];
event.target.value = "";
if (!file) return;
await perform(async () => {
const rows = await importContacts(file);
const inserted = unwrap(
await supabase
.from("contacts")
.insert(rows)
.select("id")
);
setSelected((previous) =>
new Set([...previous, ...inserted.map((contact) => contact.id)])
);
await refresh();
notify(`${rows.length} contacts imported successfully.`);
});
}
function toggleContact(id) {
setSelected((previous) => {
const next = new Set(previous);
if (next.has(id)) next.delete(id);
else next.add(id);
return next;
});
}
function toggleAllFiltered() {
setSelected((previous) => {
const next = new Set(previous);
  filteredContacts.forEach((contact) => {
if (allFilteredSelected) next.delete(contact.id);
else next.add(contact.id);
});
return next;
});
}
function askDelete(contact) {
setConfirmation({
title: `Delete ${fullName(contact)}?`,
description:
"This removes the contact. Previously generated messages and sent history will be preserved.",
label: "Delete contact",
action: async () => {
unwrap(
await supabase.from("contacts").delete().eq("id", contact.id)
);
await refresh();
notify("Contact deleted.");
}
});
}
function askClearContacts() {
setConfirmation({
title: "Clear all contacts?",
description:
"All contacts will be deleted. Your message history will remain available. This cannot be undone.",
label: "Clear all contacts",
action: async () => {
unwrap(
await supabase.from("contacts").delete().eq("user_id", userId)
);
setSelected(new Set());
await refresh();
notify("Contacts cleared. Message history was preserved.");
}
});
}
async function copyMessage(message) {
try {
if (!navigator.clipboard) {
throw new Error("Clipboard API unavailable");
}
// Do not trim, transform, or reconstruct the stored message.
await navigator.clipboard.writeText(message.body);
setCopiedId(message.id);
notify("Copied! Paste and send the message manually on LinkedIn.");
} catch {
setViewMessageId(message.id);
notify(
"Clipboard access is unavailable. Select and copy the complete message in the dialog.",
true
);
return;
}
try {
unwrap(
await supabase.rpc("record_message_copy", {
p_message_id: message.id
})
);
setMessages((previous) =>
    previous.map((item) =>

      item.id === message.id
? { ...item, copied_count: item.copied_count + 1 }
: item
)
);
} catch {
notify("Message copied, but the copy count could not be saved.", true);
}
}
async function markSent(message) {
unwrap(
await supabase.rpc("mark_message_sent", {
p_message_id: message.id
})
);
await refresh();
notify("Marked as sent. Date and time recorded.");
}
async function handleExport(format) {
setExportOpen(false);
await perform(async () => {
if (!filteredMessages.length) {
throw new Error("There are no matching messages to export.");
}
await exportMessages(filteredMessages, format);
notify(`${filteredMessages.length} messages exported.`);
});
}
function requestLogout() {
if (!dirty) {
onLogout();
return;
}
setConfirmation({
title: "Sign out with unsaved changes?",
description:
"Your template has unsaved edits. Generated messages are already stored and will not be lost.",
label: "Sign out",
action: onLogout
});
}
function templatePanel() {
return (
<section className="panel template-panel">
<div className="panel-heading">
<div className="heading-with-icon">
<span className="section-symbol"><FileText size={20} /></span>
<div>
<h2>Message Template</h2>
<p>Write it once. Keep it exactly yours.</p>
</div>
</div>
<span className="tag"><Braces size={13} /> First-name only</span>
</div>
<div className="template-content">
<div className="template-label">
<label htmlFor="message-template">Your message</label>
<span className={dirty ? "unsaved-label" : "saved-label"}>
{dirty ? "Unsaved changes" : <><Check size={13} /> Saved</>}
</span>
</div>
<textarea
id="message-template"
className="template-input"
value={template}
onChange={(event) => setTemplate(event.target.value)}
maxLength={10000}
spellCheck={false}
autoCorrect="off"
autoCapitalize="off"
aria-describedby="template-description"
/>
<div className="template-meta" id="template-description">
<span>Available variable: <code>{"{{firstName}}"}</code></span>
<span>{template.length.toLocaleString()} / 10,000 characters</span>
</div>
<div className="template-bottom">
<div className="inline muted small">
<ShieldCheck size={17} />
<span>Only the name changes. No rewriting. No AI.</span>
</div>
<Button
icon={Save}
disabled={busy || !dirty || !template.length}
onClick={() => perform(saveTemplate)}
>
          Save template
</Button>
</div>
{!template.includes("{{firstName}}") && (
<p className="inline-error">
          Add {"{{firstName}}"} before generating personalized messages.
</p>
)}
</div>
</section>
);
}
function contactActions() {
return (
<div className="inline wrap">
<Button
icon={Upload}
disabled={busy}
onClick={() => csvInput.current?.click()}
>
      Import CSV
</Button>
<Button
icon={FileSpreadsheet}
disabled={busy}
onClick={() => excelInput.current?.click()}
>
      Import Excel
</Button>
<Button
variant="primary"
icon={Plus}
disabled={busy}
onClick={() => setContactDraft({ ...EMPTY_CONTACT })}
>
      Add Contact
</Button>
</div>
);
}
function contactsPanel() {
return (
<section className="panel contacts-panel">
<div className="panel-heading">
<div className="heading-with-icon">
<span className="section-symbol"><Users size={20} /></span>
<div>
<h2>Contacts <span className="count-badge">{contacts.length}</span></h2>
<p>Choose who you’d like to reach out to.</p>
</div>
</div>
{contactActions()}
</div>
<div className="panel-toolbar">
<FilterBar
query={contactQuery}
onQueryChange={setContactQuery}
status={contactStatus}
onStatusChange={setContactStatus}
placeholder="Search contacts or companies…"
>
<button
type="button"
className="text-button muted-button"
disabled={!contacts.length || busy}
onClick={askClearContacts}
>
<Trash2 size={15} /> Clear contacts
</button>
</FilterBar>
</div>
{filteredContacts.length ? (
<>
<div className="table-scroll">
<table>
<thead>
<tr>
<th className="checkbox-cell">
<input
ref={selectAllInput}
type="checkbox"
checked={allFilteredSelected}
onChange={toggleAllFiltered}
aria-label="Select all contacts matching the current filters"
/>
</th>
<th>First Name</th>
<th>Last Name</th>
<th>Company</th>
<th>LinkedIn URL</th>
<th>Status</th>
<th className="actions-cell"><span className="sr-only">Actions</span></th>
</tr>
</thead>
<tbody>
{visibleContacts.map((contact, index) => (
<tr
key={contact.id}
className={selected.has(contact.id) ? "selected-row" : ""}
>
<td className="checkbox-cell">
<input
type="checkbox"
checked={selected.has(contact.id)}
onChange={() => toggleContact(contact.id)}
aria-label={`Select ${fullName(contact)}`}
/>
</td>
<td>
<div className="contact-name">
<Avatar person={contact} index={index} />
<strong>{contact.first_name}</strong>
</div>
</td>
<td>{contact.last_name || <span className="muted">—</span>}</td>
<td>{contact.company || <span className="muted">—</span>}</td>
<td><ProfileLink url={contact.linkedin_url} compact /></td>
<td><Status sent={contact.sent_at} /></td>
<td>
<div className="table-actions">
<button
type="button"
className="icon-button"
aria-label={`Edit ${fullName(contact)}`}
disabled={busy}
onClick={() => setContactDraft({ ...contact })}
>
<Pencil size={15} />
</button>
<button
type="button"
className="icon-button danger-icon"
aria-label={`Delete ${fullName(contact)}`}
disabled={busy}
onClick={() => askDelete(contact)}
>
<Trash2 size={15} />
</button>
</div>
</td>
</tr>
))}
</tbody>
</table>
</div>
<Pagination
page={currentContactPage}
total={filteredContacts.length}
pageSize={PAGE_SIZE}
onChange={setContactPage}
/>
</>
) : (
<EmptyState
icon={Users}
title={contacts.length ? "No matching contacts" : "Your next connection starts here"}
action={
          contacts.length ? (
<Button
onClick={() => {
setContactQuery("");
setContactStatus("all");
}}
>
              Clear filters
</Button>
) : (
<Button
icon={Plus}
variant="primary"
onClick={() => setContactDraft({ ...EMPTY_CONTACT })}
>
              Add your first contact
</Button>
)
}
>
{contacts.length
? "Try another name, company, or status."
: "Add a contact manually or import a CSV or Excel file."}
</EmptyState>
)}
<div className="selection-footer">
<div>
<div className="inline">
<span className="selection-count">{selected.size}</span>
<strong>Selected Contacts</strong>
{selected.size > 0 && (
<button
type="button"
className="text-button"
onClick={() => setSelected(new Set())}
>
              Deselect all
</button>
)}
</div>
<p>
{selected.size > 1000
? "Select up to 1,000 contacts per batch."
: "One personalized message for each selected contact."}
</p>
</div>
<Button
variant="primary"
icon={busy ? LoaderCircle : MessageSquare}
disabled={
          busy ||
!selected.size ||
          selected.size > 1000 ||
!template.includes("{{firstName}}")
}
onClick={() => perform(generateMessages)}
>
        Generate Messages \<ArrowRight size={16} />
</Button>
</div>
</section>
);
}
function messageActions(message) {
return (
<div className="message-actions">
<Button
icon={copiedId === message.id ? Check : Copy}
onClick={() => copyMessage(message)}
>
{copiedId === message.id ? "Copied!" : "Copy Message"}
</Button>
<ProfileLink url={message.linkedin_url} />
<Button
icon={CheckCheck}
variant={message.sent_at ? "ghost" : "primary-soft"}
disabled={busy || Boolean(message.sent_at)}
onClick={() => perform(() => markSent(message))}
>
{message.sent_at ? "Sent" : "Mark as Sent"}
</Button>
</div>
);
}
function exportControl() {
return (
<div className="export-control">
<Button
icon={ArrowDownToLine}
disabled={busy || !filteredMessages.length}
onClick={() => setExportOpen((previous) => !previous)}
aria-expanded={exportOpen}
>
      Export \<ChevronDown size={15} />
</Button>
{exportOpen && (
<>
<button
type="button"
className="menu-dismiss"
aria-label="Close export menu"
onClick={() => setExportOpen(false)}
/>
<div className="export-menu" aria-label="Export formats">
<p>Export {filteredMessages.length} matching messages</p>
<button type="button" onClick={() => handleExport("csv")}>
<FileText size={16} /> CSV file
</button>
<button type="button" onClick={() => handleExport("xlsx")}>
<FileSpreadsheet size={16} /> Excel workbook
</button>
<button type="button" onClick={() => handleExport("txt")}>
<FileText size={16} /> Plain text
</button>
</div>
</>
)}
</div>
);
}
function messagesContent(history = false) {
return (
<>
<section className="panel messages-toolbar">
<FilterBar
query={messageQuery}
onQueryChange={setMessageQuery}
status={messageStatus}
onStatusChange={setMessageStatus}
placeholder={history ? "Search message history…" : "Search personalized messages…"}
>
{exportControl()}
</FilterBar>
</section>
{!filteredMessages.length ? (
<section className="panel">
<EmptyState
icon={history ? Clock3 : MessageSquare}
title={messages.length ? "No matching messages" : "Your messages will appear here"}
action={
            messages.length ? (
<Button
onClick={() => {
setMessageQuery("");
setMessageStatus("all");
}}
>
                Clear filters
</Button>
) : (
<Button
variant="primary"
icon={ArrowRight}
onClick={() => navigate("dashboard")}
>
                Create your first messages
</Button>
)
}
>
{messages.length
? "Try another search or status filter."
: "Select contacts and generate messages from your fixed template."}
</EmptyState>
</section>
) : history ? (
<section className="panel">
<div className="table-scroll">
<table className="history-table">
<thead>
<tr>
<th>Name</th>
<th>Message</th>
<th>Status</th>
<th>Date Sent</th>
<th>Actions</th>
</tr>
</thead>
<tbody>
{visibleMessages.map((message, index) => (
<tr key={message.id}>
<td>
<div className="contact-name">
<Avatar person={message} index={index} />
<div>
<strong>{fullName(message)}</strong>
{message.company && <small>{message.company}</small>}
</div>
</div>
</td>
<td>
<p className="message-excerpt">{message.body}</p>
</td>
<td><Status sent={message.sent_at} /></td>
<td className="date-cell">{formatDate(message.sent_at)}</td>
<td>
<div className="table-actions">
<button
type="button"
className="icon-button"
aria-label={`View message for ${fullName(message)}`}
onClick={() => setViewMessageId(message.id)}
>
<Eye size={17} />
</button>
<button
type="button"
className="icon-button"
aria-label={`Copy message for ${fullName(message)}`}
onClick={() => copyMessage(message)}
>
{copiedId === message.id
? <Check size={17} />
: <Copy size={17} />}
</button>
</div>
</td>
</tr>
))}
</tbody>
</table>
</div>
<Pagination
page={currentMessagePage}
total={filteredMessages.length}
pageSize={MESSAGE_PAGE_SIZE}
onChange={setMessagePage}
/>
</section>
) : (
<>
<div className="message-grid">
{visibleMessages.map((message, index) => (
<article className="panel message-card" key={message.id}>
<div className="message-card-heading">
<div className="contact-name">
<Avatar person={message} index={index} />
<div>
<h3>{fullName(message)}</h3>
<small>
{message.company || "Personalized message"}
</small>
</div>
</div>
<Status sent={message.sent_at} />
</div>
<p className="message-body">{message.body}</p>
{messageActions(message)}
<div className="message-card-footer">
<Clock3 size={13} />
{message.sent_at
? `Marked as sent ${formatDate(message.sent_at)}`
: `Generated ${formatDate(message.created_at)}`}
</div>
</article>
))}
</div>
<Pagination
page={currentMessagePage}
total={filteredMessages.length}
pageSize={MESSAGE_PAGE_SIZE}
onChange={setMessagePage}
/>
</>
)}
<div className="compliance-note">
<ShieldCheck size={17} />
      You send every message yourself. Opening LinkedIn never types,

      pastes, or sends anything.
</div>
</>
);
}
function settingsContent() {
return (
<div className="settings-layout">
<section className="panel">
<div className="panel-heading">
<div>
<h2>Your account</h2>
<p>Application access, separate from your LinkedIn account.</p>
</div>
<ShieldCheck size={22} className="blue-text" />
</div>
<div className="settings-content">
<label className="field">
          Email address
<input value={session.user.email || ""} readOnly />
</label>
<div className="setting-row">
<div>
<h3>Password</h3>
<p>Receive a secure link to choose a new password.</p>
</div>
          \<Button

            icon={Mail}

            disabled={busy}

            onClick={() =>
perform(async () => {
unwrap(
await supabase.auth.resetPasswordForEmail(
                    session.user.email,
{
redirectTo: `${window.location.origin}/?recovery=1`
}
)
);
notify("A password reset link has been requested.");
})
}
          >

            Reset password
</Button>
</div>
</div>
</section>
<section className="panel">
<div className="panel-heading">
<div>
<h2>Contact import</h2>
<p>A simple spreadsheet is all you need.</p>
</div>
</div>
<div className="settings-content">
<p>
          Import \<strong>.csv\</strong> or \<strong>.xlsx\</strong> files,

          up to 5 MB and 1,000 contacts per import.

          Older .xls files must be converted to .xlsx.
</p>
<div className="column-list">
<code>First Name *</code>
<code>Last Name</code>
<code>Company</code>
<code>Job Title</code>
<code>LinkedIn URL</code>
</div>
<p className="muted small">
          First Name is required. Invalid files are rejected before

          contacts are inserted. Imports append contacts.
</p>
<Button icon={ArrowDownToLine} onClick={downloadSampleCSV}>
          Download sample CSV
</Button>
</div>
</section>
<section className="panel">
<div className="panel-heading">
<div>
<h2>Template preferences</h2>
<p>Explicit edits only. No automatic writing assistance.</p>
</div>
</div>
<div className="settings-content">
<div className="setting-row">
<div>
<h3>Restore the default message</h3>
<p>
              Updates the editor only. Save it when you are ready.

              Existing message history will not change.
</p>
</div>
<Button
icon={RotateCcw}
onClick={() =>
setConfirmation({
title: "Restore the default template?",
description:
"This replaces the current editor content. Generated messages and history are not affected.",
label: "Restore template",
action: async () => {
setTemplate(DEFAULT_TEMPLATE);
navigate("dashboard");
notify("Default template restored in the editor. Save to keep it.");
}
})
}
>
            Restore default
</Button>
</div>
</div>
</section>
<section className="panel privacy-panel">
<ShieldCheck size={28} />
<div>
<h2>Your outreach. Your control.</h2>
<p>
          This application does not connect to LinkedIn APIs, collect

          LinkedIn passwords or cookies, scrape profiles, automate

          browsers, send messages, or send connection requests.

          Your contacts and messages are stored in your authenticated

          Supabase workspace.
</p>
</div>
</section>
</div>
);
}
const pageMetadata = {
dashboard: {
  title: `Hi, ${firstName}!`,
  description: "A personal touch for every connection. Your message, unchanged."
},
contacts: {
title: "Your contacts",
description: "Organize your connections and choose who to reach out to."
},
messages: {
title: "Personalized messages",
description: `${readyCount} messages ready to copy. Send them on your own terms.`
},
history: {
title: "Message history",
description: "A clear record of what you generated, copied, and marked as sent."
},
settings: {
title: "Workspace settings",
description: "Manage your account, imports, and template preferences."
}
};
const statCards = [
{ label: "Total Contacts", value: contacts.length, icon: Users, tone: "blue", note: "In your workspace" },
{ label: "Messages Generated", value: messages.length, icon: MessageSquare, tone: "purple", note: "Personalized by first name" },
{ label: "Messages Copied", value: copyCount, icon: Copy, tone: "amber", note: "Successful copy actions" },
{ label: "Messages Sent", value: sentCount, icon: CheckCheck, tone: "green", note: "Manually marked as sent" }
];
return (
<div className="app-shell">
{mobileNav && (
<button
type="button"
className="sidebar-overlay"
aria-label="Close navigation"
onClick={() => setMobileNav(false)}
/>
)}
<aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
<div className="sidebar-brand">
<Brand />
<button
type="button"
className="icon-button mobile-close"
aria-label="Close navigation"
onClick={() => setMobileNav(false)}
>
<X size={20} />
</button>
</div>
<div className="workspace-label">WORKSPACE</div>
<nav aria-label="Main navigation">
{NAVIGATION.map(({ id, label, icon: Icon }) => (
<button
type="button"
key={id}
className={`nav-item ${page === id ? "nav-active" : ""}`}
onClick={() => navigate(id)}
aria-current={page === id ? "page" : undefined}
>
<Icon size={19} />
<span>{label}</span>
{id === "messages" && readyCount > 0 && (
<span className="nav-count">{readyCount}</span>
)}
</button>
))}
</nav>
<div className="sidebar-bottom">
<div className="sidebar-note">
<ShieldCheck size={23} />
<h3>Personal, not automated.</h3>
<p>Your words stay yours. You’re always the one who hits send.</p>
<button
type="button"
className="text-button"
onClick={() => navigate("settings")}
>
          How it works \<ArrowRight size={14} />
</button>
</div>
<div className="sidebar-account">
  <span className="account-avatar">
    {initials || "U"}
  </span>

  <div>
    <strong>{displayName}</strong>
    <span title={session.user.email}>{session.user.email}</span>
  </div>
<button
type="button"
className="icon-button"
aria-label="Sign out"
onClick={requestLogout}
>
<LogOut size={18} />
</button>
</div>
</div>
</aside>
<div className="main-shell">
<header className="topbar">
<div className="inline">
<button
type="button"
className="icon-button mobile-menu"
aria-label="Open navigation"
aria-expanded={mobileNav}
onClick={() => setMobileNav(true)}
>
<Menu size={21} />
</button>
<span className="breadcrumb">Workspace</span>
<span className="breadcrumb-divider">/</span>
<strong>{NAVIGATION.find((item) => item.id === page)?.label}</strong>
</div>
<span className="manual-badge">
<ShieldCheck size={14} /> Manual sending. Always.
</span>
</header>
<main className="main-content">
<div className="page-heading">
<div>
<div className="eyebrow">LINKEDIN MESSAGE PERSONALIZER</div>
<h1>{pageMetadata[page].title}</h1>
<p>{pageMetadata[page].description}</p>
</div>
{page === "dashboard" && (
<div className="today-label">
<Clock3 size={16} />
{new Date().toLocaleDateString(undefined, {
month: "short",
day: "numeric",
year: "numeric"
})}
</div>
)}
</div>
{loading ? (
<section className="panel workspace-loading" role="status">
<LoaderCircle size={28} className="spin" />
<p>Loading your workspace…</p>
</section>
) : loadError ? (
<section className="panel">
<EmptyState
title="We couldn’t load your workspace"
action={
<Button
icon={RotateCcw}
onClick={() => setRetry((previous) => previous + 1)}
>
                Try again
</Button>
}
>
{loadError}
</EmptyState>
</section>
) : (
<>
{page === "dashboard" && (
<>
<div className="stats-grid">
{statCards.map(({ label, value, icon: Icon, tone, note }) => (
<section className="panel stat-card" key={label}>
<div className="stat-top">
<span>{label}</span>
<span className={`stat-icon stat-${tone}`}>
<Icon size={19} />
</span>
</div>
<strong className="stat-value">{value.toLocaleString()}</strong>
<span className="stat-note">{note}</span>
</section>
))}
</div>
<div className="workflow-strip">
<span><span>1</span> Set your template</span>
<i />
<span><span>2</span> Select contacts</span>
<i />
<span><span>3</span> Generate & copy</span>
<div className="workflow-right">Simple by design.</div>
</div>
{templatePanel()}
{contactsPanel()}
<section className="ready-banner">
<span className="ready-icon"><CheckCheck size={24} /></span>
<div>
<h2>Messages Ready: {readyCount}</h2>
<p>
{readyCount
? "Your next conversation is just a copy and paste away."
: "Generate your first batch to get started."}
</p>
</div>
<Button
icon={ArrowRight}
onClick={() => navigate("messages")}
>
                  View Personalized Messages
</Button>
</section>
</>
)}
{page === "contacts" && contactsPanel()}
{page === "messages" && messagesContent()}
{page === "history" && messagesContent(true)}
{page === "settings" && settingsContent()}
<footer className="app-footer">
<span>LinkedIn Message Personalizer</span>
<span>Independent tool · Not affiliated with LinkedIn</span>
</footer>
</>
)}
</main>
</div>
<input
ref={csvInput}
type="file"
accept=".csv,text/csv"
hidden
onChange={handleImport}
aria-label="Import CSV contacts"
/>
<input
ref={excelInput}
type="file"
accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
hidden
onChange={handleImport}
aria-label="Import Excel contacts"
/>
{contactDraft && (
<Modal
title={contactDraft.id ? "Edit contact" : "Add a contact"}
onClose={() => {
if (!busy) setContactDraft(null);
}}
>
<p className="modal-description">
        Only the first name is used to personalize messages.
</p>
<form onSubmit={saveContact}>
<div className="form-grid">
{[
["first_name", "First Name", true, 100],
["last_name", "Last Name", false, 100],
["company", "Company", false, 200],
["job_title", "Job Title", false, 200]
].map(([key, label, required, maxLength]) => (
<label className="field" key={key}>
{label} {required && <span className="required">*</span>}
<input
required={required}
maxLength={maxLength}
autoFocus={key === "first_name"}
value={contactDraftkey || ""}
onChange={(event) =>
setContactDraft((previous) => ({
...previous,
}))
}
/>
</label>
))}
<label className="field span-two">
            LinkedIn Profile URL
<input
type="url"
maxLength={500}
placeholder="https://www.linkedin.com/in/name"
value={contactDraft.linkedin_url || ""}
onChange={(event) =>
setContactDraft((previous) => ({
...previous,
linkedin_url: event.target.value
}))
}
/>
<small className="muted">
              Optional. Opens in a new tab without any automation.
</small>
</label>
</div>
<div className="modal-actions">
<Button disabled={busy} onClick={() => setContactDraft(null)}>
            Cancel
</Button>
<Button
type="submit"
variant="primary"
icon={Save}
disabled={busy}
>
{busy ? "Saving…" : "Save contact"}
</Button>
</div>
</form>
</Modal>
)}
{viewedMessage && (
<Modal
title={`Message for ${fullName(viewedMessage)}`}
wide
onClose={() => setViewMessageId(null)}
>
<div className="message-view-meta">
<Status sent={viewedMessage.sent_at} />
<span className="muted small">
{viewedMessage.sent_at
? `Sent ${formatDate(viewedMessage.sent_at)}`
: `Generated ${formatDate(viewedMessage.created_at)}`}
</span>
</div>
<textarea
className="message-view-text"
aria-label="Complete personalized message"
value={viewedMessage.body}
readOnly
spellCheck={false}
/>
{messageActions(viewedMessage)}
</Modal>
)}
{confirmation && (
<Modal
title={confirmation.title}
onClose={() => {
if (!busy) setConfirmation(null);
}}
>
<p className="modal-description">{confirmation.description}</p>
<div className="modal-actions">
<Button disabled={busy} onClick={() => setConfirmation(null)}>
          Cancel
</Button>
<Button
variant="danger"
disabled={busy}
onClick={() =>
perform(async () => {
await confirmation.action();
setConfirmation(null);
})
}
>
{busy ? "Please wait…" : confirmation.label}
</Button>
</div>
</Modal>
)}
</div>
);
}

