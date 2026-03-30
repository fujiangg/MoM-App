export interface User {
    id: number;
    username: string;
    created_at: string;
}

export interface MoM {
    id: number;
    title: string;
    meeting_date: string;
    content: string;
    created_by: number;
    created_at: string;
}

export interface AuthResponse {
    access_token: string;
    token_type: string;
}
