import { useEffect, useRef, useState } from "react";
import { DayPicker } from "@daypicker/react";
import { ko } from "@daypicker/react/locale";
import "@daypicker/react/style.css";
import styles from "./ProposalForm.module.css";
import {
  createProposal,
  postContextAnalysis,
  publishProposal,
  updateProposal,
  type ContextAnalysisResult,
} from "../../lib/api";
import { type ProposalFormData } from "../../types/proposal";
import type { Proposal } from "../../types";

// 1단계: 제안 작성 폼
// 제출 시 POST /api/proposals(DRAFT 생성) → POST .../publish(OPEN 전환) 순으로 호출한다.

const initialFormData: ProposalFormData = {
  title: "",
  content: "",
  deadline: "",
  targetCultures: [],
};

// AI 문화 맥락 분석 대상 문화권 후보. 실제 팀원 국가와 무관하게 자유롭게 선택 가능(README §7).
const CULTURE_OPTIONS = [
  { code: "KR", label: "한국" },
  { code: "US", label: "미국" },
  { code: "IN", label: "인도" },
  { code: "BR", label: "브라질" },
  { code: "JP", label: "일본" },
  { code: "DE", label: "독일" },
];

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
  proposal?: Proposal;
  /** 새 제안을 생성할 때만 필요(대상 팀). 기존 제안 수정 시에는 사용하지 않는다. */
  teamId?: string;
}

export default function ProposalForm({ onSubmitted, proposal, teamId }: ProposalFormProps) {
  const editingDeadline = proposal?.deadline ? new Date(proposal.deadline) : null;
  const editingHour = editingDeadline?.getHours() ?? 18;
  const [formData, setFormData] = useState<ProposalFormData>(() => proposal ? {
    title: proposal.title,
    content: proposal.content ?? "",
    deadline: editingDeadline ? toDateString(editingDeadline) : "",
    targetCultures: proposal.target_cultures ?? [],
  } : initialFormData);
  const [deadlinePeriod, setDeadlinePeriod] = useState<"AM" | "PM">(editingHour >= 12 ? "PM" : "AM");
  const [deadlineHour, setDeadlineHour] = useState(String(editingHour % 12 || 12));
  const [deadlineMinute, setDeadlineMinute] = useState(() => {
    const minute = editingDeadline?.getMinutes() ?? 0;
    return String(Math.round(minute / 10) * 10 % 60).padStart(2, "0");
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  // create가 성공했지만 publish가 실패했을 때, 재제출 시 새로 만들지 않고 이 id로 publish만 재시도한다.
  const [pendingProposalId, setPendingProposalId] = useState<string | null>(null);
  const [publishFailed, setPublishFailed] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  const [cultureAnalysis, setCultureAnalysis] = useState<ContextAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // 마감 기한은 오늘 이전 날짜를 선택할 수 없도록 date input의 min으로 사용
  const todayStr = getTodayDateString();

  useEffect(() => {
    const closePopovers = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) setIsCalendarOpen(false);
    };
    document.addEventListener("mousedown", closePopovers);
    return () => document.removeEventListener("mousedown", closePopovers);
  }, []);

  const handleChange = (field: keyof ProposalFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleCulture = (code: string) => {
    setFormData((prev) => ({
      ...prev,
      targetCultures: prev.targetCultures.includes(code)
        ? prev.targetCultures.filter((item) => item !== code)
        : [...prev.targetCultures, code],
    }));
  };

  const handleAnalyze = async () => {
    if (!formData.content.trim()) {
      setAnalysisError("먼저 제안 내용을 입력해주세요.");
      return;
    }
    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      const result = await postContextAnalysis(formData.content, formData.targetCultures);
      setCultureAnalysis(result);
    } catch {
      setAnalysisError("문화 맥락 분석에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const applySuggestion = () => {
    if (!cultureAnalysis) return;
    setFormData((prev) => ({ ...prev, content: cultureAnalysis.suggestion }));
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
    isDeadlineValid;

  const handleSubmitClick = async () => {
    const isDeadlineInFuture = deadlineDate !== null && deadlineDate.getTime() > Date.now();
    if (!isFormValid || !isDeadlineInFuture) {
      setError(
        (!isDeadlineValid || !isDeadlineInFuture) && formData.deadline !== ""
          ? "마감 기한은 현재 시각 이후로 설정해주세요."
          : "제목, 내용, 마감 기한을 모두 입력해주세요.",
      );
      return;
    }
    setError(null);
    setPublishFailed(false);
    setIsSubmitting(true);

    const proposalData = { ...formData, deadline: deadlineDate!.toISOString() };
    let targetProposalId = proposal?.id ?? pendingProposalId;

    // 1단계: DRAFT 저장(생성 또는 수정) — pendingProposalId가 있으면(직전 publish 실패)
    // 다시 생성하지 않고 그 DRAFT를 그대로 재사용한다.
    try {
      if (proposal) {
        await updateProposal(proposal.id, proposalData.title, proposalData.content, proposalData.deadline, proposalData.targetCultures);
      } else if (!targetProposalId && teamId) {
        const cultureAnalysisIds = cultureAnalysis ? [cultureAnalysis.id] : [];
        const created = await createProposal(teamId, proposalData.title, proposalData.content, proposalData.deadline, proposalData.targetCultures, cultureAnalysisIds);
        targetProposalId = created.id;
        setPendingProposalId(created.id);
      }
    } catch {
      setIsSubmitting(false);
      setError("제안 저장에 실패했습니다. 다시 시도해주세요.");
      return;
    }

    // 기존 게시글 수정은 상태를 유지하고 저장만 한다. 새 제안만 DRAFT 생성 뒤 게시한다.
    if (proposal) {
      setIsSubmitted(true);
      setIsSubmitting(false);
      window.setTimeout(onSubmitted, 850);
      return;
    }

    // 2단계: publish — 이게 성공해야만 팀원에게 노출되는 OPEN 상태가 된다.
    try {
      await publishProposal(targetProposalId!);
    } catch {
      setIsSubmitting(false);
      setPublishFailed(true);
      setError("제안은 저장됐지만 게시에 실패했습니다. 다시 시도하면 게시만 다시 진행합니다.");
      return;
    }

    setPendingProposalId(null);
    setIsSubmitted(true);
    setIsSubmitting(false);
    window.setTimeout(onSubmitted, 850);
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>{proposal ? "제안 수정" : "제안 작성"}</h1>

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
        <label className={styles.label}>대상 문화권</label>
        <div className={styles.cultureOptions} role="group" aria-label="AI 문화 맥락 분석 대상 문화권">
          {CULTURE_OPTIONS.map((option) => {
            const selected = formData.targetCultures.includes(option.code);
            return (
              <button
                key={option.code}
                type="button"
                aria-pressed={selected}
                className={`${styles.cultureChip} ${selected ? styles.cultureChipSelected : ""}`}
                onClick={() => toggleCulture(option.code)}
              >
                {option.label}
              </button>
            );
          })}
        </div>
        <p className={styles.emptyGroupHint}>선택한 문화권 기준으로 AI가 표현의 오해 가능성을 분석합니다. 선택하지 않아도 등록할 수 있습니다.</p>

        <button
          type="button"
          className={styles.analyzeButton}
          onClick={handleAnalyze}
          disabled={isAnalyzing || !formData.content.trim()}
        >
          {isAnalyzing ? "분석 중..." : "AI 문화 맥락 분석"}
        </button>
        {analysisError && <p className={styles.errorText}>{analysisError}</p>}

        {cultureAnalysis && (
          <div className={styles.analysisResult}>
            <span className={`${styles.riskBadge} ${styles[`risk${cultureAnalysis.riskLevel}`]}`}>
              위험도: {cultureAnalysis.riskLevel === "LOW" ? "낮음" : cultureAnalysis.riskLevel === "MEDIUM" ? "중간" : "높음"}
            </span>

            {cultureAnalysis.interpretations.length > 0 && (
              <div className={styles.analysisSection}>
                <h4 className={styles.analysisSectionTitle}>문화권별 해석</h4>
                <ul className={styles.analysisList}>
                  {cultureAnalysis.interpretations.map((item) => (
                    <li key={item.culture}><strong>{item.culture}</strong> — {item.interpretation}</li>
                  ))}
                </ul>
              </div>
            )}

            {cultureAnalysis.flaggedPhrases.length > 0 && (
              <div className={styles.analysisSection}>
                <h4 className={styles.analysisSectionTitle}>오해 가능 표현</h4>
                <div className={styles.cultureOptions}>
                  {cultureAnalysis.flaggedPhrases.map((phrase, index) => (
                    <span key={index} className={styles.flaggedChip}>{phrase}</span>
                  ))}
                </div>
              </div>
            )}

            {cultureAnalysis.suggestion && (
              <div className={styles.analysisSection}>
                <h4 className={styles.analysisSectionTitle}>수정 제안</h4>
                <p className={styles.suggestionText}>{cultureAnalysis.suggestion}</p>
                <button type="button" className={styles.applySuggestionButton} onClick={applySuggestion}>
                  이 문장으로 내용 교체
                </button>
              </div>
            )}
          </div>
        )}
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
          <span>{proposal ? "제안이 수정되었습니다." : "제안이 등록되었습니다."} 홈으로 이동할게요.</span>
        </div>
      ) : (
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={handleSubmitClick}
            disabled={isSubmitting}
          >
            {isSubmitting ? "저장 중..." : publishFailed ? "게시 다시 시도" : proposal ? "수정 내용 저장" : "최종 제안 등록"}
          </button>
        </div>
      )}
    </div>
  );
}
