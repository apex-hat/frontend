import { useEffect, useState } from "react";
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

export default function ProposalForm() {
  const [groups, setGroups] = useState(loadGroups);
  const [formData, setFormData] = useState<ProposalFormData>(initialFormData);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  // 마감 기한은 오늘 이전 날짜를 선택할 수 없도록 date input의 min으로 사용
  const todayStr = getTodayDateString();

  useEffect(() => {
    const syncGroups = () => setGroups(loadGroups());
    window.addEventListener(GROUPS_CHANGED_EVENT, syncGroups);
    return () => window.removeEventListener(GROUPS_CHANGED_EVENT, syncGroups);
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
          : "제목, 내용, 대상 그룹, 마감 기한을 모두 입력해주세요.",
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

      <div className={styles.field}>
        <label className={styles.label} htmlFor="targetGroup">
          대상 그룹
        </label>
        <select
          id="targetGroup"
          className={styles.select}
          value={formData.targetGroup}
          onChange={(e) => handleChange("targetGroup", e.target.value)}
          required
        >
          <option value="" disabled>제안을 공유할 그룹을 선택하세요</option>
          {groups.map((group) => (
            <option key={group.id} value={group.name}>{group.name}</option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="deadline">
          마감 기한
        </label>
        <input
          id="deadline"
          className={`${styles.input} ${styles.dateInput}`}
          type="date"
          min={todayStr}
          value={formData.deadline}
          onChange={(e) => handleChange("deadline", e.target.value)}
        />
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
