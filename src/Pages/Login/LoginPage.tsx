// src/Pages/Login/LoginPage.tsx
import React, { useState, useEffect } from "react";
import { Eye, EyeOff, AlertTriangle } from "lucide-react";
import styles from "./LoginPage.module.css";

// ✅ Vite/CRA의 /public 자산은 루트(/)로 접근
const Logo: React.FC = () => <img src="/favicon.png" alt="Logo" className={styles.logo} />;

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [csrfToken, setCsrfToken] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(false);
  const [view, setView] = useState<"signIn" | "forgotPassword">("signIn");

  // CSRF 토큰 가져오기
  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const res = await fetch("/api/auth/csrf", {
          credentials: "include",
          headers: { accept: "application/json" },
        });
        if (!res.ok) throw new Error("CSRF token fetch failed");
        const data = await res.json();
        setCsrfToken(data?.csrfToken || "");
      } catch (e) {
        console.error("CSRF 토큰을 가져오는데 실패했습니다.", e);
        setError("페이지를 로드하는데 실패했습니다. 새로고침 해주세요.");
      }
    };
    if (view === "signIn") fetchCsrfToken();
  }, [view]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!csrfToken) {
      setError("인증 토큰이 없습니다. 페이지를 새로고침 해주세요.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/callback/credentials", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          email,
          password,
          csrfToken,
          json: "true",
        }),
      });

      if (res.ok) {
        // ✅ 로그인 성공 시 항상 /setup 으로 이동
        window.location.href = "/setup";
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data?.message || "이메일 또는 비밀번호가 틀렸습니다.");
      }
    } catch (e) {
      console.error(e);
      setError("로그인 중 오류가 발생했습니다. 네트워크 연결을 확인해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setView("forgotPassword");
  };

  const handleBackToSignInClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setView("signIn");
    setError("");
  };

  return (
    <div className={styles.container}>
      {view === "signIn" ? (
        <div className={styles.loginBox}>
          <Logo />
          <h1 className={styles.title}>Sign in to your account</h1>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="email" className={styles.label}>
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                placeholder="jsdoe@example.com"
                className={styles.input}
                autoComplete="username"
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <div className={styles.passwordLabelContainer}>
                <label htmlFor="password" className={styles.label}>
                  Password
                </label>
                <a
                  href="#"
                  onClick={handleForgotPasswordClick}
                  className={styles.forgotPassword}
                >
                  forgot password?
                </a>
              </div>

              <div className={styles.passwordInputWrapper}>
                <input
                  id="password"
                  type={isPasswordVisible ? "text" : "password"}
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  className={styles.input}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setIsPasswordVisible((v) => !v)}
                  className={styles.eyeIcon}
                  aria-label={isPasswordVisible ? "Hide password" : "Show password"}
                  title={isPasswordVisible ? "Hide password" : "Show password"}
                >
                  {isPasswordVisible ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <button type="submit" className={styles.signInButton} disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className={styles.signUpText}>
            No account yet?{" "}
            <a href="/auth/sign-up" className={styles.signUpLink}>
              Sign up
            </a>
          </p>
        </div>
      ) : (
        <div className={`${styles.loginBox} ${styles.forgotPasswordBox}`}>
          <AlertTriangle size={48} color="#F56565" />
          <h2 className={styles.forgotPasswordTitle}>Not available</h2>
          <p className={styles.forgotPasswordText}>
            Password reset is not configured on this instance
          </p>
          <div className={styles.buttonGroup}>
            <button onClick={handleBackToSignInClick} className={styles.signInButton}>
              Sign In
            </button>
            <a
              className={`${styles.signInButton} ${styles.secondaryButton}`}
              href="https://next-auth.js.org/providers/credentials"
              target="_blank"
              rel="noreferrer"
            >
              Setup instructions
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
