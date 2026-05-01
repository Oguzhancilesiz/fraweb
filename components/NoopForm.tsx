"use client";

import { FormEvent, ReactNode } from "react";

type NoopFormProps = {
  children: ReactNode;
  className?: string;
};

export function NoopForm({ children, className }: NoopFormProps) {
  function onSubmit(e: FormEvent) {
    e.preventDefault();
  }
  return (
    <form className={className} onSubmit={onSubmit}>
      {children}
    </form>
  );
}
