import { useEffect } from "react";
import { Redirect } from "expo-router";
import { useAuth } from "../context/AuthContext";

export default function Index() {
  const { token, user } = useAuth();

  // Redirect based on authentication status
  if (token && user) {
    return <Redirect href="/home" />;
  }
  
  return <Redirect href="/login" />;
}
