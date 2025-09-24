import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import styles from "./LoginPage.module.css";

// 로고
const Logo = () => (
  <img src="/public/favicon.png" alt="Logo" className={styles.logo} />
);

const SignUpPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setIsLoading(true);

    try {
      // 실제 서버 엔드포인트
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
        credentials: "include",
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.message || "회원가입에 실패했어요.");
      }

      setSuccessMsg("회원가입 성공! 곧 메인으로 이동합니다.");
      setTimeout(() => {
        window.location.href = "/"; // Playwright 기대 경로
      }, 1000);
    } catch (err) {
      setError(err.message || "회원가입 중 오류 발생");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginBox}>
        <Logo />
        <h1 className={styles.title}>Create new account</h1>

        <form onSubmit={onSubmit} className={styles.form}>
          {/* Name */}
          <div className={styles.inputGroup}>
            <label htmlFor="name" className={styles.label}>Name</label>
            <input
              id="name"
              name="name"
              type="text"
              value={name}
              placeholder="Jane Doe"
              onChange={(e) => setName(e.target.value)}
              className={styles.input}
              required
            />
          </div>

          {/* Email */}
          <div className={styles.inputGroup}>
            <label htmlFor="email" className={styles.label}>Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              placeholder="jsdoe@example.com"
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              required
            />
          </div>

          {/* Password */}
          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.label}>Password</label>
            <div className={styles.passwordInputWrapper}>
              <input
                id="password"
                name="password"
                type={isPasswordVisible ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.input}
                required
              />
              <button
                type="button"
                onClick={() => setIsPasswordVisible((v) => !v)}
                className={styles.eyeIcon}
              >
                {isPasswordVisible ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && <p className={styles.error}>{error}</p>}
          {successMsg && (
            <p className={styles.signUpText} style={{ color: "#68D391" }}>
              {successMsg}
            </p>
          )}

          <button
            type="submit"
            className={styles.signInButton}
            data-testid="submit-email-password-sign-up-form"
            disabled={isLoading}
          >
            {isLoading ? "Signing up..." : "Sign up"}
          </button>
        </form>

        <p className={styles.signUpText}>
          Already have an account?{" "}
          <a href="/login" className={styles.signUpLink}>
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
};

export default SignUpPage;
