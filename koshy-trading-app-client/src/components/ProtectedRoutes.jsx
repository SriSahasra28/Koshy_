import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { LocalStorageUtils } from "../utils/localstorage.utils";

const ProtectedRoutes = ({ children }) => {
  // const expert_id = useReadLocalStorage('mylo_expert_id')

  const [isLoggedIn, setIsLoggedin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  // const expertGetApiHandler = async () => {
  //   const res = await ProfileApi.GetExpertById(expert_id)
  //   if (res?.data?.data?.verified) {
  //     setVerified(true)
  //   }
  // }

  // React.useEffect(() => {
  //   if (accessToken) {
  //     var decoded: Token = jwtDecode(accessToken);
  //     debugger;
  //     if (!decoded?.verified) {
  //       navigate("/login", { state: { redirect: location?.pathname } });
  //     }
  //   } else {
  //     navigate("/login", { state: { redirect: location?.pathname } });
  //   }
  // }, []);

  useEffect(() => {
    setIsLoading(true);
    const accessToken = LocalStorageUtils.getAccessToken();

    // if (accessToken) {
      setIsLoggedin(true);
    // } else {
    //   navigate(`/login`);
    // }

    setIsLoading(false);
  }, []);

  if (isLoading) return <></>;

  return <div>{isLoggedIn ? <>{children}</> : null}</div>;
};

export default ProtectedRoutes;
