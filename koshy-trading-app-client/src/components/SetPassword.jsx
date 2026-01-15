import React, { useState } from "react";
import { AuthApiServices } from "../api/auth.apis";
import { useNavigate } from "react-router-dom";
import { Button, NavItem } from "react-bootstrap";
import { LocalStorageUtils } from "../utils/localstorage.utils";

function SetPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const [errorMessage, setErrorMessage] = useState("");
  const username = "kimblylabs@gmail.com";

  const handleUpdate = async () => {
    setIsLoading(true);

    const password = document.getElementById("newPassword").value;
    const repeat_password = document.getElementById("repeat_password").value;

    if (!password || !repeat_password) {
      setErrorMessage("All fields are required");
      setIsLoading(false);
      return;
    }

    if (password !== repeat_password) {
      setErrorMessage("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const response = await AuthApiServices.changePassword({
        newPassword: password,
        username,
      });

      debugger;
      const data = response?.data;

      if (data) {
        console.log("Password updated successfully");
        LocalStorageUtils.setToken({
          access_token: "true",
        });

        navigate("/");
        return;
      } else {
        setIsLoading(false);
        console.log("Some error occurred:", response?.message);
      }
    } catch (error) {
      console.error("Error:", error);
      setIsLoading(false);
    }
  };

  return (
    <div
      className="container"
      style={{ maxWidth: "400px", margin: "100px auto" }}
    >
      <h2 className="text-center mb-4">Set Password</h2>
      <form>
        <div className="form-group d-flex flex-column align-items-start mb-3">
          <label htmlFor="newPassword">New Password:</label>
          <input
            type="password"
            className="form-control"
            id="newPassword"
            placeholder="Enter password"
          />
        </div>
        <div className="form-group d-flex flex-column align-items-start mb-3">
          <label htmlFor="repeatPassword">Repeat Password:</label>
          <input
            type="password"
            className="form-control"
            id="repeat_password"
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
          onClick={handleUpdate}
        >
          {isLoading ? "Updating..." : "Update Password"}
        </Button>
      </form>
    </div>
  );
}

export default SetPassword;
