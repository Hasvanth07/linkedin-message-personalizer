"use client";
import { useEffect, useRef } from "react";
import {
ChevronLeft,
ChevronRight,
MessageSquare,
X
} from "lucide-react";
export function Button({
children,
icon: Icon,
variant = "secondary",
className = "",
type = "button",
...props
}) {
return (
<button
type={type}
className={`button ${variant} ${className}`}
{...props}
>
{Icon && <Icon size={17} aria-hidden="true" />}
{children}
</button>
);
}
export function Brand() {
return (
<div className="brand">
<div className="brand-mark" aria-hidden="true">
<MessageSquare size={23} strokeWidth={2.2} />
</div>
<div>
<strong>Message Personalizer</strong>
<span>FOR YOUR LINKEDIN OUTREACH</span>
</div>
</div>
);
}
export function Status({ sent }) {
return (
<span className={`status ${sent ? "status-sent" : ""}`}>
<span aria-hidden="true" />
{sent ? "Sent" : "Not Sent"}
</span>
);
}
export function Avatar({ person, index = 0 }) {
const initials = (
(person.first_name?.[0] || "") + (person.last_name?.[0] || "")
).toUpperCase();
return (
<span className={`avatar avatar-${index % 5}`} aria-hidden="true">
{initials || "?"}
</span>
);
}
export function EmptyState({
icon: Icon = MessageSquare,
title,
children,
action
}) {
return (
<div className="empty-state">
<div className="empty-icon"><Icon size={25} /></div>
<h3>{title}</h3>
<p>{children}</p>
{action}
</div>
);
}
export function Modal({ title, children, onClose, wide = false }) {
const dialogRef = useRef(null);
const closeRef = useRef(onClose);
closeRef.current = onClose;
useEffect(() => {
const previousFocus = document.activeElement;
const dialog = dialogRef.current;
dialog?.showModal();
return () => {
  dialog?.close();

  previousFocus?.focus?.();
};
}, []);
return (
<dialog
ref={dialogRef}
className={`modal ${wide ? "modal-wide" : ""}`}
aria-label={title}
onCancel={(event) => {
    event.preventDefault();

    closeRef.current();
}}
>
<div className="modal-heading">
<h2>{title}</h2>
<button
type="button"
className="icon-button"
aria-label="Close dialog"
onClick={onClose}
>
<X size={20} />
</button>
</div>
{children}
</dialog>
);
}
export function Pagination({ page, total, pageSize, onChange }) {
const pageCount = Math.max(1, Math.ceil(total / pageSize));
if (total <= pageSize) return null;
return (
<div className="pagination">
<span>
    Showing {(page - 1)   * pageSize + 1}–
{Math.min(page * pageSize, total)} of {total}
</span>
<div className="inline">
<button
type="button"
className="icon-button"
aria-label="Previous page"
disabled={page <= 1}
onClick={() => onChange(page - 1)}
>
<ChevronLeft size={18} />
</button>
<span>{page} / {pageCount}</span>
<button
type="button"
className="icon-button"
aria-label="Next page"
disabled={page >= pageCount}
onClick={() => onChange(page + 1)}
>
<ChevronRight size={18} />
</button>
</div>
</div>
);
}
export function formatDate(value) {
if (!value) return "—";
return new Date(value).toLocaleString(undefined, {
dateStyle: "medium",
timeStyle: "short"
});
}
export function fullName(person) {
return [person.first_name, person.last_name].filter(Boolean).join(" ");
}

