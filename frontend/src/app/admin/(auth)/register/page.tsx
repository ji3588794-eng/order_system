"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./register.module.scss";

export default function AdminRegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    email: "",
    nickname: "",
    role: "admin",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert("비밀번호 확인이 일치하지 않습니다.");
      return;
    }

    // 비밀번호 8자 제한 제거 - 이제 1234 가입 가능
    setLoading(true);

    try {
      const res = await api.post("/admin/register", {
        username: formData.username.trim(),
        password: formData.password,
        email: formData.email.trim(),
        nickname: formData.nickname.trim(),
        role: formData.role,
      });

      if (res.data.success) {
        alert("관리자 계정이 생성되었습니다.");
        router.push("/admin/login");
      } else {
        alert(res.data.message || "회원가입에 실패했습니다.");
      }
    } catch (err: any) {
      console.error("회원가입 에러:", err);
      const errorMsg = err.response?.data?.message || "회원가입 중 오류가 발생했습니다.";
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.registerWrapper}>
      <div className={styles.registerCard}>
        <h1>LEEPRESSO ADMIN REGISTER</h1>
        <p>관리자 계정을 생성합니다.</p>

        <form onSubmit={handleRegister}>
          <div className={styles.inputGroup}>
            <input
              type="text"
              placeholder="아이디"
              value={formData.username}
              onChange={(e) => handleChange("username", e.target.value)}
              required
            />
            <input
              type="email"
              placeholder="이메일"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="닉네임"
              value={formData.nickname}
              onChange={(e) => handleChange("nickname", e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="비밀번호"
              value={formData.password}
              onChange={(e) => handleChange("password", e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="비밀번호 확인"
              value={formData.confirmPassword}
              onChange={(e) => handleChange("confirmPassword", e.target.value)}
              required
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "생성 중..." : "관리자 계정 생성"}
          </button>
        </form>
      </div>
    </div>
  );
}
