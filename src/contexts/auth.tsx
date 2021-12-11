import { createContext, ReactNode, useEffect, useState } from "react";
import { api } from "../services/api";

type User = {
  id: string;
  avatar_url: string;
  name: string;
  login: string;
}

type AuthContextData = {
  user: User | null;
  signInUrl: string;
  signOut: () => void;
}

type AuthResponse = {
  token: string;
  user: {
    id: string;
    avatar_url: string;
    name: string;
    login: string;
  }
}

export const AuthContext = createContext<AuthContextData>({} as AuthContextData);

type AuthProvider = {
  children: ReactNode;
}


export function AuthProvider(props: AuthProvider) {

  const [user, setUser] = useState<User | null>(null);

  const signInUrl = `https://github.com/login/oauth/authorize?scope=user&client_id=389e09ff58162c5bd074`

  async function signIn(githubCode: string) {
    const response = await api.post<AuthResponse>('/authenticate', {
      code: githubCode,
      device: "web"
    });

    const { token, user } = response.data;

    localStorage.setItem("@dowshile:token", token);
    api.defaults.headers.common.authorization = `Bearer ${token}`;
    setUser(user);
  }

  function signOut() {
    setUser(null);
    localStorage.removeItem("@dowshile:token")
  }

  useEffect(() => {
    const token = localStorage.getItem("@dowshile:token")

    if(token) {
      api.defaults.headers.common.authorization = `Bearer ${token}`;
      api.get<User>("/profile").then(
        response => setUser(response.data)
      );
    };

  },[])

  useEffect(() => {
    const url = window.location.href;
    const hasGithubCode = url.includes('?code=');

    if(hasGithubCode) {
      const [urlWithoutCode, githubCode] = url.split('?code=');
      
      window.history.pushState({}, '', urlWithoutCode);

      signIn(githubCode);
    }


  },[]);


  return (
    <AuthContext.Provider value={{ user, signInUrl, signOut }}>
      {props.children}
    </AuthContext.Provider>
  );
}