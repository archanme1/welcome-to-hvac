import { Link } from "@tanstack/react-router";

type AppLinkProps = {
  to: string;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  title?: string;
};

/**
 * Link wrapper for runtime-built hrefs (topic slugs come from the database,
 * so they cannot be part of the router's literal path union).
 */
export function AppLink({ to, ...rest }: AppLinkProps) {
  const Any = Link as unknown as React.ComponentType<AppLinkProps>;
  return <Any to={to} {...rest} />;
}
