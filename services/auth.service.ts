import { AxiosError } from "axios";

import api from "./api";
import { SessionService } from "./session.service";

import { LoginResponse } from "../types/auth";

export const AuthService = {

  async login(
    email: string,
    pin: string
  ): Promise<LoginResponse> {

    try {

      console.log("==================================");
      console.log("Calling Mobile Login API");
      console.log("Email:", email);
      console.log("PIN:", pin);
      console.log("==================================");

      const response = await api.post<LoginResponse>(
        "mobile/login",
        {
          email: email.trim(),
          pin: pin.trim(),
        }
      );

      console.log("========== LOGIN RESPONSE ==========");
      console.log(response.data);
      console.log("====================================");

      if (response.data.status && response.data.token) {

        await SessionService.saveToken(
          response.data.token
        );

        await SessionService.saveUser(
          response.data.user
        );

        console.log("Session saved successfully.");
      }

      return response.data;

    } catch (error) {

      console.log("========== LOGIN ERROR ==========");

      const err = error as AxiosError;

      if (err.response) {

        console.log("Status:", err.response.status);
        console.log("Response:", err.response.data);

      } else if (err.request) {

        console.log("No response received from server.");
        console.log(err.request);

      } else {

        console.log("Error:", err.message);

      }

      console.log("=================================");

      throw error;
    }
  },

  async logout() {

    await SessionService.clearSession();

  },

};