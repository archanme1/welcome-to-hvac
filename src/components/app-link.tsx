import { Link } from "@tanstack/react-router";

export type AppLinkProps = {
  to: string;
  className?: string | undefined;
  children: React.ReactNode;
  onClick?: (() => void) | undefined;
  onMouseEnter?: (() => void) | undefined;
  title?: string | undefined;
};

/**
 * Link wrapper for runtime-built hrefs (topic slugs come from the database,
 * so they cannot be part of the router's literal path union).
 */
export function AppLink({ to, ...rest }: AppLinkProps) {
  const Any = Link as unknown as React.ComponentType<AppLinkProps>;
  return <Any to={to} {...rest} />;
}
