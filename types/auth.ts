export interface LoginRequest {
  phone_number: string;
  pin: string;
}

export interface User {
  user_unique_id: string;
  employee_name: string;
  email_id: string;
  phone_number: string;
  department: string;
  designation: string;
  role_of_user: string;
  organization_short_name: string;
  organization_full_name: string;
  organization_pan_number: string;
  gst_number_or_company_registration_number: string;
  profile_image_url: string;
}

export interface LoginResponse {
  status: boolean;
  message: string;
  is_logged_in?: boolean;
  token?: string;
  user?: User;
}