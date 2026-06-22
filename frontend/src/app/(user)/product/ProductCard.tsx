interface Props {
  item: {
    id: number;
    name: string;
    desc: string;
    price: string;
  };

  onDetail: (id: number) => void;
}

export default function ProductCard({ item, onDetail }: Props) {
  return (
    <div className="main_product__card">
      <div className="main_product__thumb"></div>

      <div className="main_product__info">
        <div className="main_product__name">{item.name}</div>

        <div className="main_product__desc">{item.desc}</div>

        <div className="main_product__price">{item.price}</div>

        <button type="button" className="main_product__button" onClick={() => onDetail(item.id)}>
          상품 보기
        </button>
      </div>
    </div>
  );
}
