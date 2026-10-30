import type {
  AttachmentResponse,
  DeadlineResponseWithRole,
  OrganizationInvitationResponse,
  OrganizationResponse,
  ThreadResponseWithRole,
  UserResponse,
} from "@/api/generated/models";

export const instant = "2026-06-01T12:34:56.123Z";
export const timestamp = Date.UTC(2026, 5, 1, 12, 34, 56, 123);

export function organization(fields: Partial<OrganizationResponse> = {}): OrganizationResponse {
  return {
    id: 1,
    title: "Organization",
    description: null,
    type: "PUBLIC",
    createdAt: instant,
    stats: { members: 3, threads: 2 },
    permissions: { createThreads: true, delete: false, invite: true, manageRoles: false, update: false },
    ...fields,
  };
}

export function thread(fields: Partial<ThreadResponseWithRole> = {}): ThreadResponseWithRole {
  return {
    id: 2,
    title: "Thread",
    description: null,
    organizationId: 1,
    createdAt: instant,
    role: null,
    globalRole: "ORG_MEMBER",
    stats: { assignees: 2, completedDeadlines: 1, deadlines: 3 },
    permissions: { createDeadlines: true, delete: false, manageAssignees: false, update: false },
    ...fields,
  };
}

export function deadline(fields: Partial<DeadlineResponseWithRole> = {}): DeadlineResponseWithRole {
  return {
    id: 3,
    title: "Deadline",
    description: null,
    threadId: 2,
    createdAt: instant,
    due: "2026-06-02T12:34:56.123Z",
    isCompleted: false,
    role: null,
    globalRole: null,
    stats: { assignees: 2, attachments: 1 },
    permissions: { delete: false, manageAssignees: false, manageAttachments: false, update: false },
    ...fields,
  };
}

export function user(fields: Partial<UserResponse> = {}): UserResponse {
  return {
    id: 7,
    username: "test-user",
    fullName: "Test User",
    joinedAt: instant,
    language: "EN",
    timeZone: "UTC",
    ...fields,
  };
}

export function invitation(fields: Partial<OrganizationInvitationResponse> = {}): OrganizationInvitationResponse {
  return {
    id: 4,
    invitedBy: { username: "sender", fullName: "Sender" },
    invitedUser: { username: "recipient", fullName: "Recipient" },
    organization: organization(),
    status: "PENDING",
    role: "ORG_MEMBER",
    createdAt: instant,
    answeredAt: null,
    ...fields,
  };
}

export function attachment(fields: Partial<AttachmentResponse> = {}): AttachmentResponse {
  return {
    id: 5,
    attachedTo: 3,
    filename: "report.txt",
    mimeType: "text/plain",
    sizeBytes: 12,
    uploadedAt: instant,
    uploadedBy: null,
    permissions: { delete: false, update: false },
    ...fields,
  };
}
