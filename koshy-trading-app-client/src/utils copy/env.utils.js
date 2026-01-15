export class EnvVariables {
  static apiEndpoint = process.env.REACT_APP_API_ENDPOINT;
  static fyersAccessToken = process.env.REACT_APP_ACCESS_TOKEN?.trim();
}
