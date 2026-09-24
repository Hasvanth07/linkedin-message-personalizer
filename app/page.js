"use client";
import { useEffect, useState } from "react";
import { CheckCircle2, CircleAlert, LoaderCircle, X } from "lucide-react";
import { supabase, unwrap } from "../lib/supabase";
import Auth from "../components/Auth";
import Workspace from "../components/Workspace";
export default function Page() {
const [session, setSession] = useState(null);
const [ready, setReady] = useState(false);
const [recovery, setRecovery] = useState(false);
const [notice, setNotice] = useState(null);
function notify(message, error = false) {
setNotice({ message, error, id: Date.now() });
}
useEffect(() => {
if (!notice) return;
const timeout = setTimeout(() => setNotice(null), 6000);
return () => clearTimeout(timeout);
}, [notice]);
useEffect(() => {
let active = true;
setRecovery(
new URLSearchParams(window.location.search).get("recovery") === "1"
);
supabase.auth.getSession().then(({ data, error }) => {
if (!active) return;
if (error) notify(error.message, true);
setSession(data.session);
setReady(true);
});
const { data } = supabase.auth.onAuthStateChange((event, nextSession) => {
if (!active) return;
setSession(nextSession);
setReady(true);
if (event === "PASSWORD_RECOVERY") setRecovery(true);
});
return () => {
  active = false;

  data.subscription.unsubscribe();
};
}, []);
async function logout() {
try {
unwrap(await supabase.auth.signOut());
setRecovery(false);
window.history.replaceState({}, "", window.location.pathname);
notify("You have been signed out.");
} catch (error) {
notify(error.message, true);
}
}
function finishRecovery() {
setRecovery(false);
window.history.replaceState({}, "", window.location.pathname);
}
return (
<>
{!ready ? (
<main className="loading-screen">
<LoaderCircle className="spin" size={30} />
<p>Opening your workspace…</p>
</main>
) : recovery || !session ? (
<Auth
recovery={recovery}
notify={notify}
onRecoveryComplete={finishRecovery}
/>
) : (
<Workspace
key={session.user.id}
session={session}
notify={notify}
onLogout={logout}
/>
)}
{notice && (
<div
className={`toast ${notice.error ? "toast-error" : ""}`}
role={notice.error ? "alert" : "status"}
aria-live={notice.error ? "assertive" : "polite"}
>
{notice.error ? (
<CircleAlert size={20} />
) : (
<CheckCircle2 size={20} />
)}
<span>{notice.message}</span>
<button
className="icon-button"
aria-label="Dismiss notification"
onClick={() => setNotice(null)}
>
<X size={17} />
</button>
</div>
)}
</>
);
}
