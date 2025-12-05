import { auth } from "../../../../auth";
import BotaoGoogle from "@/components/shared/botaoGoogleClient";
import RegisterForm from "@/components/ui/registerForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function RegisterPage() {
  const session = await auth();
  if (session) {
    return redirect("/dashboard");
  }
  return (
    <>
      {" "}
      <div>
        <div className="isolate">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
          >
            <div
              style={{
                clipPath:
                  "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
              }}
              className="relative left-[calc(0%-11rem)] aspect-[1155/678] w-[36.600rem] -translate-x-1/2 rotate-[210deg] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-700 via-blue-300 to-blue-800 opacity-25 sm:left-[calc(46%-30rem)] sm:w-[102.1875rem]"
            />
          </div>
        </div>
      </div>
      <Card className="max-w-sm w-full rounded-2xl mt-12">
        <CardHeader>
          <h2 className="text-xl font-bold">Cadastre-se</h2>
          <CardDescription>Faça seu cadastro gratuitamente.</CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm />
          <div className="flex flex-col w-full justify-center items-center">
            <div className="mx-auto my-4 flex w-full items-center justify-evenly before:mr-4 before:block before:h-px before:flex-grow before:bg-muted-foreground after:ml-4 after:block after:h-px after:flex-grow after:bg-muted-foreground">
              ou
            </div>
            <div className="gap-3 flex flex-col mt-6 w-full">
              <BotaoGoogle />
              <div className="flex gap-5 w-full items-center"></div>
            </div>
          </div>
        </CardContent>
      </Card>
      <p className="text-sm text-muted-foreground mt-3">
        Já possui cadastro?{" "}
        <Link className="text-gradient" href="/login">
          Faça o login
        </Link>
        .
      </p>
    </>
  );
}
