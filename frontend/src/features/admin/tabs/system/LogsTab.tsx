import { Panel } from "../../components/common";
import type { AdminTabProps } from "../types";

export function LogsTab({ log, setLog, refreshAction }: AdminTabProps) {
  return (
    <Panel title="API 통신 로그" description="프론트에서 API로 보낸 요청 결과를 확인합니다." action={refreshAction}>
      <div className="actions">
        <button className="sub" onClick={() => setLog("")}>로그 비우기</button>
      </div>
      <pre>{log}</pre>
    </Panel>
  );
}
