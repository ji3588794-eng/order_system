"use client";

import "../(user)/scss/login.scss";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [id, setId] = useState("");
  const [pw, setPw] = useState("");

  const handleLogin = () => {
    if (id === "admin" && pw === "1234") {
      localStorage.setItem("isLogin", "true");

      router.push("/");
    } else {
      alert("아이디 또는 비밀번호가 틀렸습니다.");
    }
  };

  return (
    <div className="login">
      <div className="login__bg">
        <Image src="/images/login-bg.png" alt="" fill priority className="login__bg-img" />
      </div>

      <div className="login__panel">
        <div className="login__title">로그인</div>

        <div className="login__desc">LEEPRESSO 발주 관리 시스템</div>

        <div className="login__form">
          <input
            className="login__input"
            type="text"
            placeholder="아이디"
            value={id}
            onChange={(e) => setId(e.target.value)}
          />

          <input
            className="login__input"
            type="password"
            placeholder="비밀번호"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
          />

          <div className="login__option">
            <label className="login__save">
              <input type="checkbox" />
              <span>아이디 저장</span>
            </label>

            <button type="button" className="login__find">
              비밀번호 찾기
            </button>
          </div>

          <button type="button" className="login__button" onClick={handleLogin}>
            로그인
          </button>
        </div>

        <div className="login__bottom">
          언제나, 어디서나 당신 곁에
          <span> LEEPRESSO ♥</span>
        </div>
      </div>
    </div>
  );
}
