"use client";

import { useState } from "react";
import styles from "./login.module.scss";

export default function AdminLoginPage() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post("/admin/login", formData);

      if (res.data.success) {
        // 💡 router.push('/admin/dashboard') 대신 아래 방식을 사용해.
        // 실서버 환경에서 미들웨어나 레이아웃 꼬임 현상을 완전히 무시하고 새로 진입해.
        window.location.href = "/admin/dashboard";
      } else {
        alert(res.data.message || "로그인 정보를 확인해주세요.");
      }
    } catch (err: any) {
      console.error("로그인 에러:", err);
      const errorMsg = err.response?.data?.message || "로그인 중 오류가 발생했습니다.";
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginWrapper}>
      <div className={styles.loginCard}>
        <h1>LEEPRESSO ADMIN</h1>
        <p>관리자 계정으로 로그인하세요.</p>

        <form onSubmit={handleLogin}>
          <div className={styles.inputGroup}>
            <input
              type="text"
              placeholder="아이디"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
            />
            <input
              type="password"
              placeholder="비밀번호"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>
      </div>
    </div>
  );
}
