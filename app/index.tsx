import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { SessionService } from "../services/session.service";

export default function Index() {
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    async function checkLogin() {
      const token = await SessionService.getToken();

      setLoggedIn(!!token);
      setLoading(false);
    }

    checkLogin();
  }, []);

  if (loading) return null;

  if (loggedIn) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
