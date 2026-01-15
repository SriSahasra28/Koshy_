import React, { useState } from "react";
import { Button } from "react-bootstrap";
import { Link, redirect, useNavigate } from "react-router-dom";
import { AuthApiServices } from "../api/auth.apis";
import { LocalStorageUtils } from "../utils/localstorage.utils";

function LoginPage({ onLoginSuccess, onResetPassword }) {
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setIsLoading(true);

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    if (!username || !password) {
      setErrorMessage("All fields are required");
      setIsLoading(false);
      return;
    }

    try {
      const response = await AuthApiServices.login({
        password,
        username,
      });

      debugger;

      const data = response?.data;

      console.log(data);
      if (data) {
        // Set user authenticated true (you might want to use state management here)
        console.log("User authenticated successfully!");

        debugger
        LocalStorageUtils.setToken({
          access_token: "true",
        });
        navigate("/");

        setIsLoading(false);

        return;
      } else {
        // Show warning: wrong password
        console.log("Wrong password");
        setErrorMessage("Wrong Password");

        setIsLoading(false);

      }
    } catch (error) {
      // Handle any errors
      console.error("Error:", error);
      setErrorMessage(error);
      setIsLoading(false);
    }
  };

  const handleResetPassword = () => {
    console.log("handleResetPassword called");
    onResetPassword();
  };

  return (
    <div
      className="container"
      style={{ maxWidth: "400px", margin: "100px auto" }}
    >
      <h2 className="text-center mb-4">Login</h2>
      <form>
        <div className="form-group d-flex flex-column align-items-start mb-3">
          <label htmlFor="username">Email:</label>
          <input
            type="email"
            className="form-control"
            id="username"
            placeholder="Enter email as username"
          />
        </div>
        <div className="form-group d-flex flex-column align-items-start mb-4">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            className="form-control"
            id="password"
            placeholder="Enter password"
          />
        </div>

        {errorMessage && (
          <div className="alert alert-danger" role="alert">
            {errorMessage}
          </div>
        )}

        <Button
          disabled={isLoading}
          className="w-100 mb-1"
          onClick={handleLogin}
        >
          {isLoading ? "Logging in..." : "Login"}
        </Button>

        <Link to={"/reset-password"}>Reset Password</Link>
        <button
          type="button"
          className="btn btn-link btn-block"
          onClick={handleResetPassword}
        ></button>
      </form>
    </div>
  );
}

export default LoginPage;
