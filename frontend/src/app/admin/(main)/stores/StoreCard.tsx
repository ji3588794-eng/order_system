"use client";

import styles from "./stores.module.scss";
import type { StoreItem } from "./page";
import { Edit2, Trash2, Phone, MapPin, Clock } from "lucide-react";

interface StoreCardProps {
  item: StoreItem;
  onEdit: () => void;
  onRefresh: () => void;
}

export default function StoreCard({ item, onEdit, onRefresh }: StoreCardProps) {
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`'${item.store_name}' 매장을 삭제하시겠습니까?`)) return;

    try {
      const res = await api.delete(`/admin/stores/${item.idx}`);
      if (res.data.success) {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className={`${styles.storeCard} ${Number(item.is_active) === 1 ? "" : styles.disabled}`}>
      <div className={styles.thumb}>
        {item.thumbnail_full_url ? (
          <img src={item.thumbnail_full_url} alt={item.store_name} />
        ) : (
          <div className={styles.noImage}>No Image</div>
        )}

        <span className={`${styles.badge} ${Number(item.is_active) === 1 ? styles.on : styles.off}`}>
          {Number(item.is_active) === 1 ? "노출중" : "미노출"}
        </span>

        {Number(item.is_active) !== 1 && <div className={styles.statusOverlay}>비활성</div>}
      </div>

      <div className={styles.info}>
        <h4>{item.store_name}</h4>
        <div className={styles.addressLine}>
          <MapPin size={14} />
          <p>{item.address}</p>
        </div>
        <div className={styles.contactLine}>
          <Phone size={13} />
          <span>{item.phone || "연락처 없음"}</span>
        </div>
        <div className={styles.hoursLine}>
          <Clock size={13} />
          <small>{item.hours || "영업시간 정보 없음"}</small>
        </div>
      </div>

      <div className={styles.meta}>
        <span>LAT: {item.lat ?? "-"}</span>
        <span>LNG: {item.lng ?? "-"}</span>
      </div>

      <div className={styles.btnGroup}>
        <button type="button" onClick={onEdit} className={styles.editBtn}>
          <Edit2 size={14} /> 수정
        </button>
        <button type="button" onClick={handleDelete} className={styles.delBtn}>
          <Trash2 size={14} /> 삭제
        </button>
      </div>
    </div>
  );
}
