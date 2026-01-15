import axiosInstance from "./axios";

export class AuthApiServices {
  static login = async ({ username, password }) => {
    try {
      const res = await axiosInstance({
        method: "get",
        url: `check_login?username=${username}&password=${password}`,
      });

      debugger;

      return {
        success: res?.data?.success ?? true,
        data: res?.data,
        message: res?.data?.message ?? null,
        error: null,
      };
    } catch (error) {
      console.error("Something went wrong", error);

      return {
        success: false,
        error: "Something went wrong!",
        data: error?.response,
      };
    }
  };

  static resetPassword = async ({ username, dob, pob }) => {
    try {
      const res = await axiosInstance({
        method: "get",
        url: `check_user_details?username=${username}&dob=${dob}&pob=${pob}`,
      });

      debugger;

      return {
        success: res?.data?.success ?? true,
        data: res?.data,
        message: res?.data?.message ?? null,
        error: null,
      };
    } catch (error) {
      console.error("Something went wrong", error);

      return {
        success: false,
        error: "Something went wrong!",
        data: error?.response,
      };
    }
  };

  static changePassword = async ({ username, newPassword }) => {
    try {
      const res = await axiosInstance({
        method: "put",
        url: `update_user_password`,
        data: {
          username,
          newPassword,
        },
      });

      return {
        success: res?.data?.success ?? true,
        data: res?.data?.message ?? null,
        message: res?.data?.message ?? null,
        error: null,
      };
    } catch (error) {
      console.error("Something went wrong", error);

      return {
        success: false,
        error: "Something went wrong!",
        data: error?.response,
      };
    }
  };
}
