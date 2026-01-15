import React, { useState } from "react";
import { Button } from "react-bootstrap";
import { AuthApiServices } from "../api/auth.apis";
import { useNavigate } from "react-router-dom";

function ResetPassword() {
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleReset = async () => {
    setIsLoading(true);

    const username = document.getElementById("email").value;
    const dob = document.getElementById("dob").value;
    const pob = document.getElementById("placeOfBirth").value;
    if (!username || !dob || !pob) {
      setErrorMessage("All fields are required");
      setIsLoading(false);

      return;
    }
    try {
      const response = await AuthApiServices.resetPassword({
        dob,
        pob,
        username,
      });

      const data = response?.data
      console.log(data);

      if (data?.userExists) {
        console.log("calling onResetsuccess from Resetpassword userExists");
        navigate("/change-password");
        return;
      } else {
        setErrorMessage("User not found or information incorrect");
        setIsLoading(false);
      }
    } catch (error) {
      // Handle any errors
      setIsLoading(false);

      console.error("Error:", error);
      setErrorMessage(error);
    }
  };
  return (
    <div
      className="container"
      style={{ maxWidth: "400px", margin: "100px auto" }}
    >
      <h2 className="text-center mb-4">Reset Password</h2>
      <form>
        <div className="form-group d-flex flex-column align-items-start mb-3">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            className="form-control"
            id="email"
            placeholder="Enter email"
          />
        </div>
        <div className="form-group d-flex flex-column align-items-start mb-3">
          <label htmlFor="dob">Date of Birth:</label>
          <input type="date" className="form-control" id="dob" />
        </div>
        <div className="form-group d-flex flex-column align-items-start mb-3">
          <label htmlFor="placeOfBirth">Place of Birth:</label>
          <input
            type="text"
            className="form-control"
            id="placeOfBirth"
            placeholder="Enter place of birth"
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
          onClick={handleReset}
        >
          {isLoading ? "Resetting Password..." : "Reset Password"}
        </Button>
      </form>
    </div>
  );
}

export default ResetPassword;
