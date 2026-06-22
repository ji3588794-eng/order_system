"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useOrderStore } from "../store/orderStore";
import { useCartStore } from "../store/cartStore";
import "../scss/cart.scss";

export default function CartPage() {
  const router = useRouter();

  const cartItems = useCartStore((state) => state.cartItems);
  const removeCartItem = useCartStore((state) => state.removeCartItem);
  const updateCartQuantity = useCartStore((state) => state.updateCartQuantity);
  const clearCart = useCartStore((state) => state.clearCart);

  const setOrderItems = useOrderStore((state) => state.setOrderItems);

  const [checkedIds, setCheckedIds] = useState<number[]>([]);
  const [isInitialChecked, setIsInitialChecked] = useState(false);

  useEffect(() => {
    if (isInitialChecked) return;
    if (cartItems.length === 0) return;

    setCheckedIds(cartItems.map((item) => item.id));
    setIsInitialChecked(true);
  }, [cartItems, isInitialChecked]);

  const selectedItems = cartItems.filter((item) => checkedIds.includes(item.id));

  const allChecked = cartItems.length > 0 && cartItems.every((item) => checkedIds.includes(item.id));

  const totalPrice = useMemo(() => {
    return selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [selectedItems]);

  const formatPrice = (price: number) => {
    return price.toLocaleString("ko-KR") + "원";
  };

  const handleAllCheck = () => {
    if (allChecked) {
      setCheckedIds([]);
      return;
    }

    setCheckedIds(cartItems.map((item) => item.id));
  };

  const handleItemCheck = (id: number) => {
    setCheckedIds((prev) => (prev.includes(id) ? prev.filter((checkedId) => checkedId !== id) : [...prev, id]));
  };

  const handleQuantity = (id: number, type: "minus" | "plus") => {
    const targetItem = cartItems.find((item) => item.id === id);

    if (!targetItem) return;

    const nextQuantity = type === "plus" ? targetItem.quantity + 1 : Math.max(1, targetItem.quantity - 1);

    updateCartQuantity(id, nextQuantity);
  };

  const handleDelete = (id: number) => {
    removeCartItem(id);

    setCheckedIds((prev) => prev.filter((checkedId) => checkedId !== id));
  };

  const handleSelectedDelete = () => {
    selectedItems.forEach((item) => removeCartItem(item.id));

    setCheckedIds([]);
  };

  const handleClearCart = () => {
    clearCart();
    setCheckedIds([]);
  };

  const handleAllOrder = () => {
    if (cartItems.length === 0) return;

    setOrderItems(cartItems);

    router.push("/order");
  };

  const handleSelectedOrder = () => {
    if (selectedItems.length === 0) return;

    setOrderItems(selectedItems);

    router.push("/order");
  };

  return (
    <div className="cart_area">
      <div className="cart_inner">
        <div className="cart_title_box">
          <div className="cart_title">장바구니</div>

          <div className="cart_desc">주문하실 상품을 확인해 주세요.</div>
        </div>

        <div className="cart_top">
          <label className="check_label">
            <input type="checkbox" checked={allChecked} onChange={handleAllCheck} />

            <span>전체선택</span>
          </label>

          <button
            type="button"
            className="delete_btn"
            onClick={handleSelectedDelete}
            disabled={selectedItems.length === 0}
          >
            선택삭제
          </button>
        </div>

        <div className="cart_list">
          {cartItems.length === 0 ? (
            <div className="empty_cart">장바구니가 비어있습니다.</div>
          ) : (
            cartItems.map((item) => (
              <div className="cart_item" key={item.id}>
                <div className="item_left">
                  <div className="item_check">
                    <input
                      type="checkbox"
                      checked={checkedIds.includes(item.id)}
                      onChange={() => handleItemCheck(item.id)}
                    />
                  </div>

                  <div className="item_product">
                    <div className="item_thumb">
                      <img src={item.image} alt={item.name} />
                    </div>

                    <div className="item_info">
                      <div className="item_name">{item.name}</div>

                      <div className="item_price">{formatPrice(item.price * item.quantity)}</div>
                    </div>
                  </div>
                </div>

                <div className="quantity_box">
                  <button type="button" onClick={() => handleQuantity(item.id, "minus")}>
                    -
                  </button>

                  <span>{item.quantity}</span>

                  <button type="button" onClick={() => handleQuantity(item.id, "plus")}>
                    +
                  </button>
                </div>

                <button type="button" className="item_delete_btn" onClick={() => handleDelete(item.id)}>
                  삭제
                </button>
              </div>
            ))
          )}
        </div>

        <div className="cart_summary">
          <div className="summary_text">
            <span>선택 상품 합계</span>

            <strong>{formatPrice(totalPrice)}</strong>
          </div>

          <div className="cart_btn_box">
            <button type="button" className="order_all_btn" onClick={handleAllOrder} disabled={cartItems.length === 0}>
              전체주문
            </button>

            <button
              type="button"
              className="order_select_btn"
              onClick={handleSelectedOrder}
              disabled={selectedItems.length === 0}
            >
              선택주문
            </button>

            <button
              type="button"
              className="delete_select_btn"
              onClick={handleSelectedDelete}
              disabled={selectedItems.length === 0}
            >
              선택삭제
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
