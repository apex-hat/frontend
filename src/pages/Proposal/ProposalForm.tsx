import { useEffect, useRef, useState } from "react";
import { DayPicker } from "@daypicker/react";
import { ko } from "@daypicker/react/locale";
import "@daypicker/react/style.css";
import styles from "./ProposalForm.module.css";
import { submitMockProposal } from "../../mocks/proposal";
import {
  GROUPS_CHANGED_EVENT,
  loadGroups,
  loadMessages,
  saveMessages,
} from "../../features/workspace/workspaceStorage";
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

const HOURS = Array.from({ length: 12 }, (_, index) => String(index + 1));
const MINUTES = ["00", "10", "20", "30", "40", "50"];

interface ProposalFormProps {
  onSubmitted: () => void;
}

export default function ProposalForm({ onSubmitted }: ProposalFormProps) {
  const [groups, setGroups] = useState(loadGroups);
  const [formData, setFormData] = useState<ProposalFormData>(initialFormData);
  const [deadlinePeriod, setDeadlinePeriod] = useState<"AM" | "PM">("PM");
  const [deadlineHour, setDeadlineHour] = useState("6");
  const [deadlineMinute, setDeadlineMinute] = useState("00");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isGroupMenuOpen, setIsGroupMenuOpen] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  const groupMenuRef = useRef<HTMLDivElement>(null);

  // 마감 기한은 오늘 이전 날짜를 선택할 수 없도록 date input의 min으로 사용
  const todayStr = getTodayDateString();

  useEffect(() => {
    const syncGroups = () => setGroups(loadGroups());
    window.addEventListener(GROUPS_CHANGED_EVENT, syncGroups);
    return () => window.removeEventListener(GROUPS_CHANGED_EVENT, syncGroups);
  }, []);

  useEffect(() => {
    const closePopovers = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) setIsCalendarOpen(false);
      if (groupMenuRef.current && !groupMenuRef.current.contains(event.target as Node)) setIsGroupMenuOpen(false);
    };
    document.addEventListener("mousedown", closePopovers);
    return () => document.removeEventListener("mousedown", closePopovers);
  }, []);

  const handleChange = (field: keyof ProposalFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const hour24 = (Number(deadlineHour) % 12) + (deadlinePeriod === "PM" ? 12 : 0);
  const deadlineTime = `${String(hour24).padStart(2, "0")}:${deadlineMinute}`;
  const deadlineDate = formData.deadline
    ? new Date(`${formData.deadline}T${deadlineTime}:00`)
    : null;
  const isDeadlineValid =
    deadlineDate !== null && formData.deadline >= todayStr && deadlineTime !== "";

  const isFormValid =
    formData.title.trim() !== "" &&
    formData.content.trim() !== "" &&
    formData.targetGroup.trim() !== "" &&
    isDeadlineValid;

  const handleSubmitClick = async () => {
    const isDeadlineInFuture = deadlineDate !== null && deadlineDate.getTime() > Date.now();
    if (!isFormValid || !isDeadlineInFuture) {
      setError(
        (!isDeadlineValid || !isDeadlineInFuture) && formData.deadline !== ""
          ? "마감 기한은 현재 시각 이후로 설정해주세요."
          : "제목, 내용, 대상 그룹, 마감 기한을 모두 입력해주세요.",
      );
      return;
    }
    setError(null);
    setIsSubmitting(true);

    // TODO(나중에): submitMockProposal 대신 실제 백엔드 API 호출로 교체
    // 예: const res = await axios.post('/api/proposals', formData)
    await submitMockProposal({
      ...formData,
      deadline: deadlineDate!.toISOString(),
    });

    const targetGroup = groups.find((group) => group.name === formData.targetGroup);
    if (targetGroup) {
      const chatId = `group-${targetGroup.id}`;
      const deadlineLabel = new Intl.DateTimeFormat("ko-KR", {
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(deadlineDate!);
      saveMessages(chatId, [
        ...loadMessages(chatId),
        {
          id: crypto.randomUUID(),
          sender: "me",
          text: `제안: ${formData.title.trim()} · ${deadlineLabel}까지 의견을 남겨주세요.`,
          createdAt: new Date().toISOString(),
        },
      ]);
    }

    setIsSubmitted(true);
    setIsSubmitting(false);
    window.setTimeout(onSubmitted, 850);
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
          대상 그룹
        </label>
        <div className={styles.groupPicker} ref={groupMenuRef}>
          <button
            id="targetGroup"
            type="button"
            className={styles.groupTrigger}
            onClick={() => groups.length > 0 && setIsGroupMenuOpen((open) => !open)}
            aria-expanded={isGroupMenuOpen}
          >
            <span className={formData.targetGroup ? styles.groupValue : styles.groupPlaceholder}>
              {formData.targetGroup || (groups.length > 0 ? "제안할 그룹을 선택하세요" : "먼저 그룹을 만들어주세요")}
            </span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m7 10 5 5 5-5" />
            </svg>
          </button>
          {isGroupMenuOpen && (
            <div className={styles.groupMenu} role="listbox">
              {groups.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  role="option"
                  aria-selected={formData.targetGroup === group.name}
                  className={styles.groupOption}
                  onClick={() => {
                    handleChange("targetGroup", group.name);
                    setIsGroupMenuOpen(false);
                  }}
                >
                  <span>{group.name}</span>
                  <small>{group.memberCount}명</small>
                </button>
              ))}
            </div>
          )}
        </div>
        {groups.length === 0 && <p className={styles.emptyGroupHint}>왼쪽 메시지 영역의 + 버튼에서 그룹을 만들 수 있습니다.</p>}
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="deadline">
          마감 기한
        </label>
        <div className={styles.deadlineRow}>
          <div className={styles.datePicker} ref={calendarRef}>
            <button id="deadline" type="button" className={styles.dateTrigger} onClick={() => setIsCalendarOpen((open) => !open)} aria-expanded={isCalendarOpen}>
              <span className={formData.deadline ? styles.dateValue : styles.datePlaceholder}>
                {formData.deadline ? new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long", day: "numeric" }).format(parseDate(formData.deadline)!) : "날짜 선택"}
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
          <div className={styles.timeField} aria-label="마감 시간">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
              <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
            </svg>
            <select value={deadlinePeriod} onChange={(event) => setDeadlinePeriod(event.target.value as "AM" | "PM")} aria-label="오전 또는 오후">
              <option value="AM">오전</option>
              <option value="PM">오후</option>
            </select>
            <select value={deadlineHour} onChange={(event) => setDeadlineHour(event.target.value)} aria-label="시">
              {HOURS.map((hour) => <option key={hour} value={hour}>{hour}</option>)}
            </select>
            <span>:</span>
            <select value={deadlineMinute} onChange={(event) => setDeadlineMinute(event.target.value)} aria-label="분">
              {MINUTES.map((minute) => <option key={minute} value={minute}>{minute}</option>)}
            </select>
          </div>
        </div>
      </div>

      {error && <p className={styles.errorText}>{error}</p>}

      {isSubmitted ? (
        <div className={styles.successBox} role="status">
          <span className={styles.successIcon}>✓</span>
          <span>제안이 등록되었습니다. 홈으로 이동할게요.</span>
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
