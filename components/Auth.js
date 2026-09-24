"use client";

import { useState } from "react";

import {
  ArrowRight,
  CheckCheck,
  LoaderCircle,
  LockKeyhole,
  ShieldCheck
} from "lucide-react";

import { supabase, unwrap } from "../lib/supabase";

import { Avatar, Brand, Button } from "./ui";

export default function Auth({
  recovery,
  notify,
  onRecoveryComplete
}) {
  const [mode, setMode] = useState("login");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [busy, setBusy] = useState(false);

  const currentMode = recovery ? "recovery" : mode;

  const titles = {
    login: "Welcome back.",
    signup: "Create your workspace.",
    forgot: "Forgot your password?",
    recovery: "Choose a new password."
  };

  const descriptions = {
    login: "Sign in to your personal outreach workspace.",
    signup:
      "Create your account and start personalizing your outreach.",
    forgot:
      "We’ll email you a secure password reset link.",
    recovery:
      "Use a strong password with at least 12 characters."
  };

  const buttonLabels = {
    login: "Sign in",
    signup: "Create account",
    forgot: "Send reset link",
    recovery: "Update password"
  };

  function changeMode(nextMode) {
    setMode(nextMode);
    setPassword("");

    if (nextMode !== "signup") {
      setFullName("");
    }
  }

  async function submit(event) {
    event.preventDefault();

    if (busy) return;

    setBusy(true);

    try {
      if (currentMode === "login") {
        unwrap(
          await supabase.auth.signInWithPassword({
            email: email.trim(),
            password
          })
        );

        notify("Welcome back.");
      }

      else if (currentMode === "signup") {
        const cleanName = fullName.trim();
        const cleanEmail = email.trim().toLowerCase();

        if (cleanName.length < 2) {
          throw new Error("Please enter your full name.");
        }

        const data = unwrap(
          await supabase.auth.signUp({
            email: cleanEmail,
            password,

            options: {
              emailRedirectTo: window.location.origin,

              data: {
                full_name: cleanName
              }
            }
          })
        );

        if (!data.session) {
          notify(
            "Account created. Check your email to confirm your account, then sign in."
          );

          setEmail(cleanEmail);
          setPassword("");
          setMode("login");
        }
        else {
          notify("Your account has been created.");
        }
      }

      else if (currentMode === "forgot") {
        unwrap(
          await supabase.auth.resetPasswordForEmail(
            email.trim(),
            {
              redirectTo:
                `${window.location.origin}/?recovery=1`
            }
          )
        );

        notify(
          "If an account exists for this address, a reset email is on its way."
        );
      }

      else {
        unwrap(
          await supabase.auth.updateUser({
            password
          })
        );

        notify("Your password has been updated.");

        onRecoveryComplete();
      }
    }

    catch (error) {
      notify(
        error?.message || "Something went wrong. Please try again.",
        true
      );
    }

    finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-layout">

      {/* LEFT SIDE */}
      <section className="auth-story">

        <Brand />

        <div className="auth-story-content">

          <span className="eyebrow">
            PERSONALIZED OUTREACH, SIMPLIFIED
          </span>

          <h1>
         Write once.
            <br />
           Personalize every connection.
          </h1>

          <p className="auth-description">
            Write one message and personalize it for every
            connection using their first name.
          </p>

          <div className="auth-example">

            <div className="inline">

              <Avatar
                person={{
                  first_name: "Rahul",
                  last_name: "Kumar"
                }}
              />

              <div>
                <strong>Rahul Kumar</strong>

                <small>
                  Personalized message
                </small>
              </div>

              <CheckCheck
                size={22}
                className="push-right"
              />

            </div>

            <p>
              Hi <mark>Rahul</mark>, hope you’re
              doing well! I wanted to reach out regarding
              an opportunity...
            </p>

            <div className="auth-example-footer">

              <ShieldCheck size={16} />

              Only the first name changes.

            </div>

          </div>

        </div>

        <p className="auth-legal">
          An independent tool, not affiliated with LinkedIn.
          You stay in control and send every message manually.
        </p>

      </section>


      {/* RIGHT SIDE */}
      <section className="auth-form-section">

        <div className="auth-form">

          <div className="section-symbol">
            <LockKeyhole size={24} />
          </div>

          <h2>
            {titles[currentMode]}
          </h2>

          <p className="muted">
            {descriptions[currentMode]}
          </p>


          <form onSubmit={submit}>

            {/* FULL NAME */}
            {currentMode === "signup" && (
              <label className="field">

                Full name

                <input
                  type="text"
                  required
                  minLength={2}
                  maxLength={100}
                  autoComplete="name"
                  placeholder="Vipparthi Hasvanth Kumar"
                  value={fullName}
                  onChange={(event) =>
                    setFullName(event.target.value)
                  }
                />

              </label>
            )}


            {/* EMAIL */}
            {currentMode !== "recovery" && (
              <label className="field">

                Email address

                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                />

              </label>
            )}


            {/* PASSWORD */}
            {currentMode !== "forgot" && (
              <label className="field">

                Password

                <input
                  type="password"
                  required
                  minLength={
                    currentMode === "login"
                      ? undefined
                      : 12
                  }
                  autoComplete={
                    currentMode === "login"
                      ? "current-password"
                      : "new-password"
                  }
                  placeholder={
                    currentMode === "login"
                      ? "Enter your password"
                      : "At least 12 characters"
                  }
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                />

              </label>
            )}


            {/* FORGOT PASSWORD */}
            {currentMode === "login" && (
              <button
                type="button"
                className="text-button forgot-link"
                onClick={() => changeMode("forgot")}
              >
                Forgot password?
              </button>
            )}


            {/* SUBMIT */}
            <Button
              type="submit"
              variant="primary"
              className="full-width"
              disabled={busy}
              icon={busy ? LoaderCircle : ArrowRight}
            >
              {busy
                ? "Please wait…"
                : buttonLabels[currentMode]}
            </Button>

          </form>


          {/* LOGIN / SIGNUP SWITCH */}
          {!recovery && (
            <p className="auth-switch">

              {mode === "login"
                ? "New here? "
                : "Already have an account? "}

              <button
                type="button"
                className="text-button"
                onClick={() =>
                  changeMode(
                    mode === "login"
                      ? "signup"
                      : "login"
                  )
                }
              >
                {mode === "login"
                  ? "Create an account"
                  : "Sign in"}
              </button>

            </p>
          )}


          {/* SECURITY MESSAGE */}
          <div className="auth-security">

            <ShieldCheck size={18} />

            <span>
              Secure application login.
              We never ask for your LinkedIn password.
            </span>

          </div>

        </div>

      </section>

    </main>
  );
}