"use client";

import React, { useEffect, useState } from "react";
import styles from "./order.module.scss";
import type { OrderItem } from "./page";

interface OrderModalProps {
  data: OrderItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function OrderModal({ data, onClose, onSuccess }: OrderModalProps) {
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    idx: 0,
    store_name: "",
    address: "",
    phone: "",
    order_time: "",
    order_status: "",
    machine: "",
    order_company: "",
    order_item: "",
    order_num: 0,
    price: 0,
  });

  useEffect(() => {
    if (!data) {
      setFormData({
        idx: 0,
        store_name: "",
        address: "",
        phone: "",
        order_time: "",
        order_status: "",
        machine: "",
        order_company: "",
        order_item: "",
        order_num: 0,
        price: 0,
      });

      return;
    }

    setFormData({
      idx: data.idx || 0,
      store_name: data.store_name || "",
      address: data.address || "",
      phone: data.phone || "",
      order_time: data.order_time || "",
      order_status: data.order_status || "",
      machine: data.machine || "",
      order_company: data.order_company || "",
      order_item: data.order_item || "",
      order_num: data.order_num || 0,
      price: data.price || 0,
    });
  }, [data]);

  const validateForm = () => {
    if (!formData.store_name.trim()) {
      alert("매장명을 입력해주세요.");
      return false;
    }

    if (!formData.order_item.trim()) {
      alert("상품명을 입력해주세요.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    console.log("저장 데이터:", formData);

    /*
    try {
      if (data) {
        await api.put(`/admin/order/${data.idx}`, formData);
        alert("수정되었습니다.");
      } else {
        await api.post("/admin/order", formData);
        alert("등록되었습니다.");
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert("저장 실패");
    }
    */

    alert(data ? "테스트 모드: 수정되었습니다." : "테스트 모드: 등록되었습니다.");
    onSuccess();
    onClose();
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h3>{data ? "발주 상세" : "발주 등록"}</h3>

        <form onSubmit={handleSubmit}>
          <div className={styles.inputRow}>
            <label>매장명</label>
            <input type="text" value={formData.store_name} readOnly />
          </div>

          <div className={styles.inputRow}>
            <label>주소</label>
            <input type="text" value={formData.address} readOnly />
          </div>

          <div className={styles.inputRow}>
            <label>전화번호</label>
            <input type="text" value={formData.phone} readOnly />
          </div>

          <div className={styles.inputRow}>
            <label>발주시간</label>
            <input type="text" value={formData.order_time} readOnly />
          </div>
          <div className={styles.inputRow}>
            <label>상태</label>
            <select
              value={formData.order_status}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  order_status: e.target.value,
                })
              }
            >
              <option value="접수">접수</option>
              <option value="처리중">처리중</option>
              <option value="완료">완료</option>
              <option value="취소">취소</option>
            </select>
          </div>

          <div className={styles.inputRow}>
            <label>머신</label>
            <input type="text" value={formData.machine} readOnly />
          </div>

          <div className={styles.inputRow}>
            <label>업체명</label>
            <input type="text" value={formData.order_company} readOnly />
          </div>

          <div className={styles.inputRow}>
            <label>상품명</label>
            <input type="text" value={formData.order_item} readOnly />
          </div>

          <div className={styles.inputHalfWrap}>
            <div className={styles.inputRow}>
              <label>수량</label>
              <input type="number" value={formData.order_num} readOnly />
            </div>

            <div className={styles.inputRow}>
              <label>금액</label>
              <input type="number" value={formData.price} readOnly />
            </div>
          </div>

          <div className={styles.modalBtns}>
            <button type="button" onClick={onClose} className={styles.cancelBtn}>
              닫기
            </button>

            <button type="submit" className={styles.saveBtn} disabled={loading}>
              {loading ? "처리 중..." : "저장하기"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
