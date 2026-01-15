import axiosInstance from "./axios";

export class GroupApis {
  static createGroup = async ({ group_name }) => {
    try {
      const res = await axiosInstance({
        method: "post",
        url: "/groups",
        data: {
          group_name,
        },
      });

      return {
        success: res?.data?.success ?? true,
        data: res?.data?.data ?? null,
        message: res?.data?.message ?? null,
        error: null,
      };
    } catch (err) {
      console.error("Something went wrong", err);

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

  static editGroup = async ({ group_name, group_id }) => {
    try {
      const res = await axiosInstance({
        method: "put",
        url: `/groups/${group_id}`,
        data: {
          group_name,
        },
      });

      return {
        success: res?.data?.success ?? true,
        data: res?.data?.data ?? null,
        message: res?.data?.message ?? null,
        error: null,
      };
    } catch (err) {
      console.error("Something went wrong", err);

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

  static deleteGroup = async ({ group_id }) => {
    try {
      const res = await axiosInstance({
        method: "delete",
        url: `/groups/${group_id}`,
      });

      return {
        success: res?.data?.success ?? true,
        data: res?.data?.data ?? null,
        message: res?.data?.message ?? null,
        error: null,
      };
    } catch (err) {
      console.error("Something went wrong", err);

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

  static deleteSymbol = async ({ group_id, symbol_id }) => {
    try {
      const res = await axiosInstance({
        method: "delete",
        url: `groups/${group_id}/symbols/${symbol_id}`,
      });

      return {
        success: res?.data?.success ?? true,
        data: res?.data?.data ?? null,
        message: res?.data?.message ?? null,
        error: null,
      };
    } catch (err) {
      console.error("Something went wrong", err);

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

  static getGroups = async () => {
    try {
      const res = await axiosInstance({
        method: "get",
        url: "/groups",
      });

      return {
        success: res?.data?.success ?? true,
        data: res?.data?.data ?? null,
        message: res?.data?.message ?? null,
        error: null,
      };
    } catch (err) {
      console.error("Something went wrong", err);

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

  static getGroupById = async ({ group_id }) => {
    try {
      const res = await axiosInstance({
        method: "get",
        url: `/groups/${group_id}`,
      });

      return {
        success: res?.data?.success ?? true,
        data: res?.data?.data ?? null,
        message: res?.data?.message ?? null,
        error: null,
      };
    } catch (err) {
      console.error("Something went wrong", err);

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

  static getGroupSymbols = async ({ group_id }) => {
    try {
      const res = await axiosInstance({
        method: "get",
        url: `/groups/${group_id}/symbols`,
      });

      return {
        success: res?.data?.success ?? true,
        data: res?.data?.data ?? null,
        message: res?.data?.message ?? null,
        error: null,
      };
    } catch (err) {
      console.error("Something went wrong", err);

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

  static getSymbolsSearch = async ({ search }) => {
    try {
      const res = await axiosInstance({
        method: "get",
        url: `/groups/symbols`,
        params: {
          search,
        },
      });

      return {
        success: res?.data?.success ?? true,
        data: res?.data?.data ?? null,
        message: res?.data?.message ?? null,
        error: null,
      };
    } catch (err) {
      console.error("Something went wrong", err);

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

  static addSymbol = async (data) => {
    try {
      const res = await axiosInstance({
        method: "post",
        url: `/groups/symbols`,
        data,
      });

      return {
        success: res?.data?.success ?? true,
        data: res?.data?.data ?? null,
        message: res?.data?.message ?? null,
        error: null,
      };
    } catch (err) {
      console.error("Something went wrong", err);

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

  static getGroupsTree = async () => {
    try {
      const res = await axiosInstance({
        method: "get",
        url: `/groups/tree`,
      });

      return {
        success: res?.data?.success ?? true,
        data: res?.data?.data ?? null,
        message: res?.data?.message ?? null,
        error: null,
      };
    } catch (err) {
      console.error("Something went wrong", err);

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

  static disableSymbol = async ({ symbol }) => {
    try {
      const res = await axiosInstance({
        method: "post",
        url: `/groups/symbols/${symbol}/disable`,
      });

      return {
        success: res?.data?.success ?? true,
        data: res?.data?.data ?? null,
        message: res?.data?.message ?? null,
        error: null,
      };
    } catch (err) {
      console.error("Something went wrong", err);

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
