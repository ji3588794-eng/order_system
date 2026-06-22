"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import "../../scss/product.scss";
import { useOrderStore } from "../../store/orderStore";
import { useCartStore } from "../../store/cartStore";

type ProductDetail = {
  id: number;
  name: string;
  summary: string;
  price: number;
  originPrice: number;
  discountRate: number;
  images: string[];
  delivery: string;
  point: string;
};

export default function DetailPage() {
  const params = useParams();
  const router = useRouter();

  const productNo = params.productNo as string;
  const setOrderItems = useOrderStore((state) => state.setOrderItems);
  const addCartItem = useCartStore((state) => state.addCartItem);
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"detail" | "delivery" | "refund">("detail");

  useEffect(() => {
    if (!productNo) return;

    const fetchProductDetail = async () => {
      // 실제 API 연결 자리
      // const res = await fetch(`/api/products/${productNo}`);
      // const data = await res.json();

      const data: ProductDetail = {
        id: Number(productNo),
        name: "초코",
        summary: "초코입니당",
        price: 1200000,
        originPrice: 1500000,
        discountRate: 20,
        images: ["/images/sample_product_01.png"],
        delivery: "무료배송",
        point: "구매금액의 1% 적립",
      };

      setProduct(data);
    };

    fetchProductDetail();
  }, [productNo]);

  const totalPrice = useMemo(() => {
    if (!product) return 0;
    return product.price * quantity;
  }, [product, quantity]);

  const formatPrice = (price: number) => {
    return price.toLocaleString("ko-KR") + "원";
  };

  const handleQuantity = (type: "minus" | "plus") => {
    setQuantity((prev) => {
      if (type === "minus") return Math.max(1, prev - 1);
      return prev + 1;
    });
  };

  const handleBuyNow = () => {
    if (!product) return;

    setOrderItems([
      {
        id: product.id,
        name: product.name,
        image: product.images[0],
        price: product.price,
        quantity,
      },
    ]);

    router.push("/order");
  };
  const handleCartAdd = () => {
    if (!product) return;

    addCartItem({
      id: product.id,
      name: product.name,
      image: product.images[0],
      price: product.price,
      quantity,
    });

    router.push("/cart");
  };
  if (!product) {
    return (
      <div className="product_detail_area">
        <div className="product_detail_inner">
          <div className="detail_loading">상품 정보를 불러오는 중입니다.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="product_detail_area">
      <div className="product_detail_inner">
        <div className="detail_top">
          <div className="detail_img_box">
            <div className="main_img">
              <img src={product.images[0]} alt={product.name} />
            </div>
          </div>

          <div className="detail_info_box">
            <div className="product_badge">BEST</div>

            <div className="product_name">{product.name}</div>

            <div className="product_summary">{product.summary}</div>

            <div className="price_box">
              <div className="origin_price">{formatPrice(product.originPrice)}</div>

              <div className="sale_price_row">
                <span className="discount">{product.discountRate}%</span>
                <span className="sale_price">{formatPrice(product.price)}</span>
              </div>
            </div>

            <div className="info_list">
              <div className="info_row">
                <div className="info_label">배송</div>
                <div className="info_value">{product.delivery}</div>
              </div>

              <div className="info_row">
                <div className="info_label">적립</div>
                <div className="info_value">{product.point}</div>
              </div>
            </div>

            <div className="quantity_area">
              <div className="quantity_label">수량</div>

              <div className="quantity_box">
                <button type="button" onClick={() => handleQuantity("minus")}>
                  -
                </button>

                <span>{quantity}</span>

                <button type="button" onClick={() => handleQuantity("plus")}>
                  +
                </button>
              </div>
            </div>

            <div className="total_box">
              <span>총 상품금액</span>
              <strong>{formatPrice(totalPrice)}</strong>
            </div>

            <div className="detail_btn_box">
              <button type="button" className="cart_btn" onClick={handleCartAdd}>
                장바구니
              </button>

              <button type="button" className="buy_btn" onClick={handleBuyNow}>
                바로구매
              </button>
            </div>
          </div>
        </div>

        <div className="detail_tab_box">
          <button
            type="button"
            className={activeTab === "detail" ? "active" : ""}
            onClick={() => setActiveTab("detail")}
          >
            상품상세
          </button>

          <button
            type="button"
            className={activeTab === "delivery" ? "active" : ""}
            onClick={() => setActiveTab("delivery")}
          >
            배송안내
          </button>

          <button
            type="button"
            className={activeTab === "refund" ? "active" : ""}
            onClick={() => setActiveTab("refund")}
          >
            교환/반품
          </button>
        </div>

        <div className="detail_content">
          {activeTab === "detail" && (
            <>
              <div className="content_title">상품 상세정보</div>
              <div className="content_text">상품 상세 이미지 또는 설명 영역입니다.</div>
            </>
          )}

          {activeTab === "delivery" && (
            <>
              <div className="content_title">배송안내</div>
              <div className="content_text">
                평일 오후 2시 이전 주문 시 당일 출고됩니다.
                <br />
                제주 및 도서산간 지역은 추가 배송비가 발생할 수 있습니다.
              </div>
            </>
          )}

          {activeTab === "refund" && (
            <>
              <div className="content_title">교환 / 반품 안내</div>
              <div className="content_text">
                단순 변심에 의한 교환 및 반품은 수령 후 7일 이내 가능합니다.
                <br />
                상품 훼손 시 교환 및 반품이 제한될 수 있습니다.
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
