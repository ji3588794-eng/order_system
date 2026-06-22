"use client";

import { useState } from "react";
import styles from "./order.module.scss";
import type { OrderItem } from "./page";
import { Edit2, Trash2 } from "lucide-react";

interface OrderCardProps {
  item: OrderItem;
  onEdit: () => void;
  onRefresh: () => void;
}

const STATUS_OPTIONS: OrderItem["order_status"][] = ["접수", "처리중", "완료", "취소"];

export default function OrderCard({ item, onEdit, onRefresh }: OrderCardProps) {
  const [status, setStatus] = useState<OrderItem["order_status"]>(item.order_status);

  const handleStatusChange = async (value: OrderItem["order_status"]) => {
    setStatus(value);

    // API 연동 시 사용
    /*
    try {
      await api.patch(`/admin/order/${item.idx}/status`, {
        order_status: value,
      });

      onRefresh();
    } catch (err) {
      console.error(err);
      alert("상태 변경 실패");
      setStatus(item.order_status);
    }
    */
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm(`'${item.store_name}' 발주를 삭제하시겠습니까?`)) return;

    // API 연동 시 사용
    /*
    try {
      const res = await api.delete(`/admin/order/${item.idx}`);

      if (res.data.success) {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
      alert("삭제 중 오류가 발생했습니다.");
    }
    */

    alert("테스트 모드에서는 삭제 API가 실행되지 않습니다.");
    onRefresh();
  };

  const statusClass =
    status === "완료"
      ? styles.done
      : status === "처리중"
        ? styles.progress
        : status === "취소"
          ? styles.cancel
          : styles.ready;

  return (
    <div className={styles.listRow}>
      <div className={styles.storeCell}>
        <strong>{item.store_name}</strong>
        <small>{item.address}</small>
      </div>

      <div className={styles.phoneCell}>{item.phone || "-"}</div>

      <div className={styles.timeCell}>{item.order_time}</div>

      <div className={styles.statusCell}>
        <select
          value={status}
          onChange={(e) => handleStatusChange(e.target.value as OrderItem["order_status"])}
          className={`${styles.statusSelect} ${statusClass}`}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.machineCell}>{item.machine}</div>

      <div className={styles.companyCell}>{item.order_company}</div>

      <div className={styles.itemCell}>{item.order_item}</div>
      <div className={styles.numCell}>{item.order_num}</div>

      <div className={styles.priceCell}>{item.price.toLocaleString()}원</div>

      <div className={styles.actionCell}>
        <button type="button" onClick={onEdit} className={styles.editBtn}>
          <Edit2 size={14} /> 상세
        </button>
        {/* 
        <button type="button" onClick={handleDelete} className={styles.delBtn}>
          <Trash2 size={14} /> 삭제
        </button> */}
      </div>
    </div>
  );
}
