import axiosInstance from "./axios";

export class FilterApis {
  static getAvailableSymbols = async () => {
    try {
      const res = await axiosInstance({
        method: "get",
        url: "/instruments/symbols",
      });

      return {
        success: res?.data?.success ?? true,
        data: res?.data?.data ?? null,
        message: res?.data?.message ?? null,
        error: null,
      };
    } catch (err) {
      console.error("Error fetching available symbols:", err);

      if (err?.response?.data) {
        return {
          success: false,
          message: err?.response?.data?.message,
          response_code: err?.response?.data?.response_code,
        };
      }

      return {
        success: false,
        error: "Something went wrong!",
        message: "",
      };
    }
  };

  static getInstrumentsOptions = async ({ symbol, startDate, endDate, expiryDate }) => {
    try {
      const params = { symbol };
      if (expiryDate) {
        params.expiryDate = expiryDate;
      } else {
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
      }

      const res = await axiosInstance({
        method: "get",
        url: "/instruments/options",
        params,
      });

      return {
        success: res?.data?.success ?? true,
        data: res?.data?.data ?? null,
        message: res?.data?.message ?? null,
        error: null,
      };
    } catch (err) {
      console.error("Error fetching instruments options:", err);
      console.error("Error details:", {
        message: err?.message,
        response: err?.response?.data,
        status: err?.response?.status,
        config: err?.config,
      });

      if (err?.response?.data) {
        return {
          success: false,
          message: err?.response?.data?.message || err?.message || "Failed to fetch options",
          response_code: err?.response?.data?.response_code,
        };
      }

      return {
        success: false,
        error: err?.message || "Something went wrong!",
        message: err?.message || "Network error or server unavailable",
      };
    }
  };

  static addFilterOption = async (data) => {
    try {
      const res = await axiosInstance({
        method: "post",
        url: "/filter-options",
        data,
      });

      return {
        success: res?.data?.success ?? true,
        data: res?.data?.data ?? null,
        message: res?.data?.message ?? null,
        error: null,
      };
    } catch (err) {
      console.error("Error adding filter option:", err);

      if (err?.response?.data) {
        return {
          success: false,
          message: err?.response?.data?.message,
          response_code: err?.response?.data?.response_code,
        };
      }

      return {
        success: false,
        error: "Something went wrong!",
        message: "",
      };
    }
  };
}
