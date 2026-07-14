import React from "react";

export function WKButton({ children, icon, iconOnly, loading, disabled, ...props }: any) {
  return (
    <button disabled={disabled || loading} {...props}>
      {loading ? "loading" : icon}
      {!iconOnly && children}
    </button>
  );
}

export function WKInput({ value, onChange, prefix, placeholder, ...props }: any) {
  return (
    <label>
      {prefix}
      <input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        {...props}
      />
    </label>
  );
}

export function WKModal({ visible, title, header, footer, children, onCancel }: any) {
  if (!visible) return null;
  return (
    <section role="dialog" aria-label={typeof title === "string" ? title : "modal"}>
      <button type="button" aria-label="关闭" onClick={onCancel} />
      {header}
      {title ? <h2>{title}</h2> : null}
      {children}
      {footer}
    </section>
  );
}

export const Toast = {
  success: () => undefined,
  error: () => undefined,
};
