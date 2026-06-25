import { useState } from "react";
import { DataTable, Field, Panel } from "../../components/common";
import type { Inquiry } from "../../types";
import { formatDate, inquiryStatusLabel, inquiryTypeLabel } from "../../utils/format";
import type { AdminTabProps } from "../types";

export function InquiriesTab({ inquiryAnswer, setInquiryAnswer, inquiries, run, answerInquiry, refreshAction }: AdminTabProps) {
  const [selectedInquiryId, setSelectedInquiryId] = useState<number | null>(null);
  const selectedInquiry = (inquiries as Inquiry[]).find((inquiry) => inquiry.id === selectedInquiryId);

  return (
    <Panel title="문의내역" description="점주가 마이페이지에서 남긴 문의와 관리자 답변 상태를 확인합니다." action={refreshAction}>
      <DataTable
        headers={["", "상태", "문의유형", "거래처명", "점주명", "제목", "문의내용", "답변", "문의일", "처리"]}
        rows={(inquiries as Inquiry[]).map((inquiry, index) => [
          <span key="rowNo" className="rowNo">{index + 1}</span>,
          <span key="status" className={inquiry.status === "OPEN" ? "statusOpen" : "statusDone"}>{inquiryStatusLabel(inquiry.status)}</span>,
          inquiryTypeLabel(inquiry.inquiryType),
          inquiry.storeName,
          inquiry.ownerName || "",
          <strong key="title">{inquiry.title}</strong>,
          inquiry.content,
          inquiry.answer || "",
          formatDate(inquiry.createdAt),
          inquiry.status === "OPEN" ? (
            <button key="answer" className="lookupButton" onClick={() => setSelectedInquiryId(inquiry.id)}>답변</button>
          ) : (
            <button key="done" className="printButton">완료</button>
          ),
        ])}
      />

      {selectedInquiry && (
        <div className="modalBackdrop" role="dialog" aria-modal="true">
          <section className="modal customerModal">
            <div className="modalHead">
              <div>
                <h2>문의 답변</h2>
                <p>{selectedInquiry.storeName} / {selectedInquiry.title}</p>
              </div>
              <button className="sub" onClick={() => setSelectedInquiryId(null)}>닫기</button>
            </div>
            <div className="formGrid inquiryAnswerForm">
              <Field label="답변 내용" value={inquiryAnswer} onChange={setInquiryAnswer} />
            </div>
            <div className="modalActions">
              <button className="sub" onClick={() => setSelectedInquiryId(null)}>취소</button>
              <button onClick={() => run("문의 답변", async () => { await answerInquiry(selectedInquiry.id); setSelectedInquiryId(null); })}>답변 저장</button>
            </div>
          </section>
        </div>
      )}
    </Panel>
  );
}
