import { useEffect, useRef, useState } from "react";
import { DayPicker } from "@daypicker/react";
import { ko } from "@daypicker/react/locale";
import "@daypicker/react/style.css";
import styles from "./ProposalForm.module.css";
import { submitMockProposal } from "../../mocks/proposal";
import { GROUPS_CHANGED_EVENT, loadGroups } from "../../features/workspace/workspaceStorage";
import { type ProposalFormData } from "../../types/proposal";

// 1단계: 제안 작성 폼
// 최종 제안 등록 (mock, 백엔드 API 완성되면 axios 호출로 교체)

const initialFormData: ProposalFormData = {
  title: "",
  content: "",
  targetGroup: "",
  deadline: "",
};

// 오늘 날짜를 date input의 min 속성에 쓸 수 있는 "yyyy-mm-dd" 형식으로 반환.
// new Date().toISOString()은 UTC 기준이라 한국 시간대에서는 날짜가 하루 밀릴 수 있어서
// 로컬 시간 기준으로 직접 조합함.
function getTodayDateString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDate(value: string) {
  if (!value) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function ProposalForm() {
  const [groups, setGroups] = useState(loadGroups);
  const [formData, setFormData] = useState<ProposalFormData>(initialFormData);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  // 마감 기한은 오늘 이전 날짜를 선택할 수 없도록 date input의 min으로 사용
  const todayStr = getTodayDateString();

  useEffect(() => {
    const syncGroups = () => setGroups(loadGroups());
    window.addEventListener(GROUPS_CHANGED_EVENT, syncGroups);
    return () => window.removeEventListener(GROUPS_CHANGED_EVENT, syncGroups);
  }, []);

  useEffect(() => {
    const closeCalendar = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) setIsCalendarOpen(false);
    };
    document.addEventListener("mousedown", closeCalendar);
    return () => document.removeEventListener("mousedown", closeCalendar);
  }, []);

  const handleChange = (field: keyof ProposalFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isDeadlineValid =
    formData.deadline !== "" && formData.deadline >= todayStr;

  const isFormValid =
    formData.title.trim() !== "" &&
    formData.content.trim() !== "" &&
    formData.targetGroup.trim() !== "" &&
    isDeadlineValid;

  const handleSubmitClick = async () => {
    if (!isFormValid) {
      setError(
        !isDeadlineValid && formData.deadline !== ""
          ? "마감 기한은 오늘 이후 날짜로 설정해주세요."
          : "제목, 내용, 대상 채팅방, 마감 기한을 모두 입력해주세요.",
      );
      return;
    }
    setError(null);
    setIsSubmitting(true);

    // TODO(나중에): submitMockProposal 대신 실제 백엔드 API 호출로 교체
    // 예: const res = await axios.post('/api/proposals', formData)
    const res = await submitMockProposal(formData);

    setSubmittedId(res.id);
    setIsSubmitting(false);
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>제안 작성</h1>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="title">
          제목
        </label>
        <input
          id="title"
          className={styles.input}
          type="text"
          value={formData.title}
          onChange={(e) => handleChange("title", e.target.value)}
          placeholder="제안 제목을 입력하세요"
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="content">
          내용
        </label>
        <div className={styles.textareaWrap}>
          <textarea
            id="content"
            className={styles.textarea}
            value={formData.content}
            onChange={(e) => handleChange("content", e.target.value)}
            placeholder="제안 내용을 입력하세요"
            maxLength={100}
          />
          <span className={styles.characterCount}>{formData.content.length}/100</span>
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="targetGroup">
          대상 채팅방
        </label>
        <select
          id="targetGroup"
          className={styles.select}
          value={formData.targetGroup}
          onChange={(e) => handleChange("targetGroup", e.target.value)}
          required
        >
          <option value="" disabled>{groups.length > 0 ? "제안을 공유할 채팅방을 선택하세요" : "먼저 채팅방을 만들어주세요"}</option>
          {groups.map((group) => (
            <option key={group.id} value={group.name}>{group.name}</option>
          ))}
        </select>
        {groups.length === 0 && <p className={styles.emptyGroupHint}>왼쪽 메시지 영역의 + 버튼에서 채팅방을 만들 수 있습니다.</p>}
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="deadline">
          마감 기한
        </label>
        <div className={styles.datePicker} ref={calendarRef}>
          <button id="deadline" type="button" className={styles.dateTrigger} onClick={() => setIsCalendarOpen((open) => !open)} aria-expanded={isCalendarOpen}>
            <span className={formData.deadline ? styles.dateValue : styles.datePlaceholder}>
              {formData.deadline ? new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long", day: "numeric" }).format(parseDate(formData.deadline)!) : "마감 날짜를 선택하세요"}
            </span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
              <path d="M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" />
            </svg>
          </button>
          {isCalendarOpen && (
            <div className={styles.calendarPopover}>
              <DayPicker
                mode="single"
                locale={ko}
                selected={parseDate(formData.deadline)}
                defaultMonth={parseDate(formData.deadline) ?? parseDate(todayStr)}
                disabled={{ before: parseDate(todayStr)! }}
                onSelect={(date) => {
                  if (!date) return;
                  handleChange("deadline", toDateString(date));
                  setIsCalendarOpen(false);
                }}
              />
            </div>
          )}
        </div>
      </div>

      {error && <p className={styles.errorText}>{error}</p>}

      {submittedId ? (
        <div className={styles.successBox}>
          제안이 등록되었습니다. (등록 ID: {submittedId})
        </div>
      ) : (
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={handleSubmitClick}
            disabled={isSubmitting}
          >
            {isSubmitting ? "등록 중..." : "최종 제안 등록"}
          </button>
        </div>
      )}
    </div>
  );
}
