"use client";

import { useActionState } from "react";
import { loginAction, type LoginActionState } from "@/app/admin/login/actions";

const initialState: LoginActionState = { error: null };

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  return (
    <form className="admin-login-form" action={formAction}>
      <label>
        Correo electrónico
        <input
          autoComplete="username"
          name="email"
          type="email"
          required
          maxLength={254}
        />
      </label>
      <label>
        Contraseña
        <input
          autoComplete="current-password"
          name="password"
          type="password"
          required
          maxLength={128}
        />
      </label>
      {state.error ? (
        <p className="admin-form-error" role="alert">
          {state.error}
        </p>
      ) : null}
      <button className="catalog-button" type="submit" disabled={isPending}>
        {isPending ? "Ingresando..." : "Ingresar"}
      </button>
    </form>
  );
}