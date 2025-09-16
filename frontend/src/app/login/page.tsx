import { Login1 } from "@/components/ui/login-1";

export default function Login() {
  return (
    <Login1 
      heading="Sign in to your account"
      logo={{
        url: "/",
        src: "",
        alt: "MeWork",
        title: "MeWork",
      }}
      buttonText="Send OTP"
      signupText="Don't have an account?"
      signupUrl="/signup"
    />
  );
}
