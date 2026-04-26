import { requestApi } from "./apiClient";


export interface Role {
    id: string;
    code: string;
    name: string;
}

export interface UserItem {
    id: string;
    username: string;
    displayName: string;
    phone: string;
    email: string;
    isActive: boolean;
    lastLoginAt: string | null;
    createdAt: string;
    updatedAt: string;
    roles: Role[];
}

export interface UserListResponse {
    items: UserItem[];
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
}

export interface CreateUserPayload {
    username: string;
    displayName: string;
    phone: string;
    email: string;
    password: string;
    isActive: boolean;
    roleCodes: string[];
}

export interface UpdateUserPayload {
    username?: string;
    displayName?: string;
    phone?: string;
    email?: string;
    isActive?: boolean;
    roleCodes?: string[];
}

export interface GetUsersParams {
    keyword?: string;
    isActive?: boolean;
    roleCode?: string;
    page?: number;
    pageSize?: number;
}

export const getUsers = async (
    params?: GetUsersParams
): Promise<UserListResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.keyword?.trim()) {
        searchParams.set("keyword", params.keyword.trim());
    }
    if (typeof params?.isActive === "boolean") {
        searchParams.set("isActive", String(params.isActive));
    }
    if (params?.roleCode?.trim()) {
        searchParams.set("roleCode", params.roleCode.trim());
    }
    if (typeof params?.page === "number") {
        searchParams.set("page", String(params.page));
    }
    if (typeof params?.pageSize === "number") {
        searchParams.set("pageSize", String(params.pageSize));
    }

    const query = searchParams.toString();
    return requestApi(`/api/v1/admin/users${query ? `?${query}` : ""}`);
};

export const getUserById = async (userId: string): Promise<UserItem> => {
    return requestApi(`/api/v1/admin/users/${userId}`);
};

export const createUser = async (
    payload: CreateUserPayload
): Promise<void> => {
    return requestApi("/api/v1/admin/users", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });
};

export const updateUser = async (
    userId: string,
    payload: UpdateUserPayload
): Promise<void> => {
    return requestApi(`/api/v1/admin/users/${userId}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });
};

export const deleteUser = async (userId: string): Promise<void> => {
    return requestApi(`/api/v1/admin/users/${userId}`, {
        method: "DELETE",
    });
};
