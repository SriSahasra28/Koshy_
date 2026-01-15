import { LocalStorageEnums } from "../enums/common.enums";

export class LocalStorageUtils {
  static getAccessToken = () => {
    let rawToken = "";

    if (typeof window !== "undefined") {
      rawToken = localStorage?.getItem(LocalStorageEnums.access_token);
    }

    if (rawToken)
      try {
        return rawToken;
      } catch (e) {
        console.error(e);
      }

    return "";
  };

  static setToken = ({ access_token }) => {
    try {
      localStorage.setItem(LocalStorageEnums.access_token, access_token);

      return true;
    } catch (err) {}
  };
}
