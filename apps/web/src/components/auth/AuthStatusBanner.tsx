type AuthStatusBannerProps = {
  label?: string;
};

export function AuthStatusBanner({ label = "Auth placeholder" }: AuthStatusBannerProps) {
  return (
    <div className="state-panel" aria-hidden="true">
      {label}
    </div>
  );
}
