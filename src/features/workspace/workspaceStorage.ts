import type { AuthUser } from "../../types";

export interface WorkspaceGroup {
  id: string;
  name: string;
  memberCount: number;
  inviteCode: string;
}

export interface WorkspaceContact {
  id: string;
  name: string;
  handle: string;
  avatarColor: string;
  online: boolean;
}

export interface ChatMessage {
  id: string;
  sender: "me" | "contact";
  text: string;
  createdAt: string;
}

const GROUPS_KEY = "meridian.workspace-groups";
const CONTACTS_KEY = "meridian.workspace-contacts";
const MESSAGES_KEY = "meridian.workspace-messages";
export const GROUPS_CHANGED_EVENT = "meridian:groups-changed";

const DEFAULT_GROUPS: WorkspaceGroup[] = [
  { id: "product-design", name: "제품 디자인 그룹", memberCount: 6, inviteCode: "PD6K2A" },
  { id: "global-development", name: "글로벌 개발 그룹", memberCount: 9, inviteCode: "DEV9M4" },
  { id: "global-marketing", name: "글로벌 마케팅 그룹", memberCount: 7, inviteCode: "MKT7R8" },
  { id: "frontend-chapter", name: "프론트엔드 챕터", memberCount: 5, inviteCode: "FE5T1Q" },
  { id: "launch-taskforce", name: "출시 태스크포스", memberCount: 8, inviteCode: "TF8P3L" },
  { id: "research-lab", name: "사용자 리서치 그룹", memberCount: 4, inviteCode: "UX4N7C" },
];

const DEFAULT_CONTACTS: WorkspaceContact[] = [
  { id: "u-mina", name: "이민아", handle: "#MER-MINA", avatarColor: "#63C7A6", online: true },
  { id: "u-alex", name: "Alex Turner", handle: "#MER-ALEX", avatarColor: "#7C8FE0", online: false },
  { id: "u-omar", name: "Omar Haddad", handle: "#MER-OMAR", avatarColor: "#63C7A6", online: true },
];

function readStorage<T>(key: string, fallback: T): T {
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
}

function createCode(prefix: string) {
  const random = crypto.randomUUID().replaceAll("-", "").slice(0, 6).toUpperCase();
  return `${prefix}${random}`;
}

export function loadGroups() {
  return readStorage<WorkspaceGroup[]>(GROUPS_KEY, DEFAULT_GROUPS);
}

export function createGroup(name: string) {
  const group: WorkspaceGroup = {
    id: crypto.randomUUID(),
    name,
    memberCount: 1,
    inviteCode: createCode("G"),
  };
  const groups = [...loadGroups(), group];
  window.localStorage.setItem(GROUPS_KEY, JSON.stringify(groups));
  window.dispatchEvent(new CustomEvent(GROUPS_CHANGED_EVENT));
  return group;
}

export function findGroupByInviteCode(inviteCode: string) {
  return loadGroups().find((group) => group.inviteCode === inviteCode);
}

export function joinGroup(inviteCode: string) {
  const groups = loadGroups();
  const group = groups.find((item) => item.inviteCode === inviteCode);
  if (!group) return null;
  const updated = { ...group, memberCount: group.memberCount + 1 };
  window.localStorage.setItem(
    GROUPS_KEY,
    JSON.stringify(groups.map((item) => item.id === updated.id ? updated : item)),
  );
  window.dispatchEvent(new CustomEvent(GROUPS_CHANGED_EVENT));
  return updated;
}

export function loadContacts() {
  return readStorage<WorkspaceContact[]>(CONTACTS_KEY, DEFAULT_CONTACTS);
}

export function addContact(contact: WorkspaceContact) {
  const contacts = loadContacts();
  if (contacts.some((item) => item.handle === contact.handle)) return contacts;
  const next = [...contacts, contact];
  window.localStorage.setItem(CONTACTS_KEY, JSON.stringify(next));
  return next;
}

export function loadMessages(contactId: string) {
  const allMessages = readStorage<Record<string, ChatMessage[]>>(MESSAGES_KEY, {});
  return allMessages[contactId] ?? [];
}

export function saveMessages(contactId: string, messages: ChatMessage[]) {
  const allMessages = readStorage<Record<string, ChatMessage[]>>(MESSAGES_KEY, {});
  window.localStorage.setItem(MESSAGES_KEY, JSON.stringify({ ...allMessages, [contactId]: messages }));
}

export function getUserHandle(user: AuthUser) {
  let hash = 0;
  for (const character of user.id) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return `#MER-${hash.toString(36).toUpperCase().padStart(4, "0").slice(-4)}`;
}

export function getInviteUrl(group: WorkspaceGroup) {
  return `${window.location.origin}/invite/${group.inviteCode}`;
}
