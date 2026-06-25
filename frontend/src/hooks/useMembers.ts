import useSWR, { type KeyedMutator } from "swr";
import type { User, UserProfile, UserRole } from "@/types/user";
import type { PaginatedResponse, PaginatedMeta, ApiSuccess } from "@/types/api";
import { api } from "@/lib/api";

// ── Helpers ────────────────────────────────────────────────────────────────

function buildQuery(filters: Record<string, unknown>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

// ── Members ────────────────────────────────────────────────────────────────

interface MemberFilters {
  page?: number;
  page_size?: number;
  role?: UserRole;
  search?: string;
  is_active?: boolean;
}

export function useMembers(
  filters?: MemberFilters,
  fallbackData?: PaginatedResponse<User>
): {
  members: User[];
  meta: PaginatedMeta | null;
  isLoading: boolean;
  error: unknown;
  mutate: KeyedMutator<PaginatedResponse<User>>;
} {
  const qs = buildQuery({ page: 1, page_size: 20, ...filters });
  const key = `/users${qs}`;

  const { data, isLoading, error, mutate } = useSWR<PaginatedResponse<User>>(key, {
    fallbackData,
  });

  return {
    members: data?.data ?? [],
    meta: data?.meta ?? null,
    isLoading,
    error,
    mutate,
  };
}

export function useMember(id: number): {
  member: User | null;
  isLoading: boolean;
  error: unknown;
} {
  const { data, isLoading, error } = useSWR<ApiSuccess<User>>(
    id ? `/users/${id}` : null
  );

  return {
    member: data?.data ?? null,
    isLoading,
    error,
  };
}

export function useMemberMutations(): {
  updateMember: (id: number, data: Partial<UserProfile>) => Promise<UserProfile>;
  updateRole: (id: number, role: UserRole) => Promise<UserProfile>;
  toggleActivate: (id: number, is_active: boolean) => Promise<UserProfile>;
  deleteUser: (id: number) => Promise<void>;
  createMember: (data: {
    full_name: string;
    email: string;
    password: string;
    role?: UserRole;
    phone?: string;
    address?: string;
  }) => Promise<UserProfile>;
} {
  const updateMember = async (id: number, data: Partial<UserProfile>): Promise<UserProfile> => {
    const res = await api.patch<ApiSuccess<UserProfile>>(`/users/${id}`, data);
    return res.data;
  };

  const updateRole = async (id: number, role: UserRole): Promise<UserProfile> => {
    const res = await api.patch<ApiSuccess<UserProfile>>(`/users/${id}/role`, { role });
    return res.data;
  };

  const toggleActivate = async (id: number, is_active: boolean): Promise<UserProfile> => {
    const res = await api.patch<ApiSuccess<UserProfile>>(`/users/${id}`, { is_active });
    return res.data;
  };

  const deleteUser = async (id: number): Promise<void> => {
    await api.delete(`/users/${id}`);
  };

  const createMember = async (data: {
    full_name: string;
    email: string;
    password: string;
    role?: UserRole;
    phone?: string;
    address?: string;
  }): Promise<UserProfile> => {
    const res = await api.post<ApiSuccess<UserProfile>>("/users", data);
    return res.data;
  };

  return { updateMember, updateRole, toggleActivate, deleteUser, createMember };
}
