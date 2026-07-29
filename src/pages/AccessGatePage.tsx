import { FormEvent, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import betaLogoWhite from "@assets/Beta_Logo_white.svg";
import { GlobeCanvas } from "../components/GlobeCanvas";
import { ACCESS_PASSWORD } from "../config/access";
import { useAccess } from "../context/AccessContext";

const EXIT_DURATION_MS = 900;

export function AccessGatePage() {
  const navigate = useNavigate();
  const { grantAccess } = useAccess();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isExiting, setIsExiting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(
    (event: FormEvent) => {
      event.preventDefault();
      if (isSubmitting) return;

      if (password !== ACCESS_PASSWORD) {
        setError("Incorrect password. Please try again.");
        return;
      }

      setError("");
      setIsSubmitting(true);
      grantAccess();
      setIsExiting(true);

      window.setTimeout(() => {
        navigate("/dashboard", {
          replace: true,
          state: {
            fromGate: true,
            selectedSlug: "abbot-kinney",
          },
        });
      }, EXIT_DURATION_MS);
    },
    [grantAccess, isSubmitting, navigate, password]
  );

  return (
    <div className={`access-gate${isExiting ? " access-gate--exiting" : ""}`}>
      <GlobeCanvas />
      <div className="access-gate__fade" aria-hidden="true" />

      <div className="access-gate__overlay">
        <div className="access-gate__panel">
          <img
            src={betaLogoWhite}
            alt="beta"
            className="access-gate__logo"
          />

          <p className="access-gate__eyebrow">High Street Dashboard</p>
          <h1 className="access-gate__title">Enter access code</h1>
          <p className="access-gate__subtitle">
            Authorized users only. Enter your beta credentials to explore
            the interactive high street maps.
          </p>

          <form className="access-gate__form" onSubmit={handleSubmit}>
            <label className="access-gate__label" htmlFor="access-password">
              Password
            </label>
            <input
              id="access-password"
              className={`access-gate__input${error ? " access-gate__input--error" : ""}`}
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (error) setError("");
              }}
              autoComplete="current-password"
              placeholder="Enter password"
              autoFocus
              disabled={isExiting}
            />
            {error ? (
              <p className="access-gate__error" role="alert">
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              className="access-gate__submit"
              disabled={!password.trim() || isSubmitting}
            >
              Enter High Streets
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
