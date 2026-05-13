import { ReactNode, useState } from "react";

/* Encouragement / narrative callout */
export function Callout({ children }: { children: ReactNode }) {
  return (
    <div className="f-card-soft flex gap-3 items-start">
      <span className="material-symbols-outlined text-f-green-glow mt-0.5" style={{ fontSize: 18 }}>
        bolt
      </span>
      <p className="font-serif italic text-[16px] leading-[1.4] text-f-text">{children}</p>
    </div>
  );
}

/* Field with suffix (kg, cm, %, etc.) */
export function SuffixInput({
  value, onChange, suffix, placeholder, type = "number", min, step, id,
}: {
  value: string | number | null;
  onChange: (v: string) => void;
  suffix: string;
  placeholder?: string;
  type?: "number" | "text";
  min?: number;
  step?: number;
  id?: string;
}) {
  return (
    <div className="f-field">
      <input
        id={id}
        type={type}
        inputMode={type === "number" ? "decimal" : undefined}
        min={min}
        step={step}
        className="f-input has-suffix"
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      <span className="f-suffix">{suffix}</span>
    </div>
  );
}

/* Segmented control */
export function Segmented<T extends string>({
  value, onChange, options, columns,
}: {
  value: T | null;
  onChange: (v: T) => void;
  options: { value: T; label: string; icon?: string }[];
  columns?: number;
}) {
  return (
    <div className="f-seg" style={{ gridTemplateColumns: `repeat(${columns ?? options.length}, 1fr)` }}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          className="f-seg-opt"
          onClick={() => onChange(o.value)}
        >
          {o.icon && <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{o.icon}</span>}
          <span>{o.label}</span>
        </button>
      ))}
    </div>
  );
}

/* Checkbox card (with title + subtitle) */
export function CheckboxCard({
  checked, onToggle, title, subtitle, children,
}: {
  checked: boolean;
  onToggle: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="f-card text-left w-full flex gap-3 items-start hover:border-f-green/40 transition-colors"
      style={{ borderColor: checked ? "rgba(91,138,100,0.35)" : undefined }}
    >
      <span className="f-check mt-0.5" data-checked={checked} aria-hidden />
      <div className="flex-1">
        <div className="font-sans font-medium text-[14px] text-f-text">{title}</div>
        {subtitle && <div className="text-[12px] text-f-text2 mt-1 leading-[1.5]">{subtitle}</div>}
        {children}
      </div>
    </button>
  );
}

/* Plain checkbox (inline) */
export function Checkbox({
  checked, onToggle, label,
}: { checked: boolean; onToggle: () => void; label: ReactNode }) {
  return (
    <label className="flex gap-2.5 items-center cursor-pointer select-none">
      <span className="f-check" data-checked={checked} aria-hidden onClick={onToggle} />
      <span className="text-[14px] text-f-text" onClick={onToggle}>{label}</span>
    </label>
  );
}

/* Chip / pill-like option (multi-select tags) */
export function Chip({
  active, onToggle, children,
}: { active: boolean; onToggle: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="rounded-full px-3 h-8 text-[13px] font-medium transition-colors border"
      style={{
        background: active ? "#2D4532" : "transparent",
        color: active ? "#E8E4DC" : "#8A8680",
        borderColor: active ? "#5B8A64" : "rgba(255,255,255,0.09)",
      }}
    >
      {children}
    </button>
  );
}

/* Disclosure / accordion — para "no tenés archivo? cargalo manual" */
export function Disclosure({
  title, subtitle, defaultOpen = false, accent = "muted", children,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  defaultOpen?: boolean;
  accent?: "muted" | "warn";
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="f-card !p-0 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left px-5 py-4 flex items-center gap-3 hover:bg-f-hover transition-colors"
      >
        <span className="material-symbols-outlined text-f-text2"
              style={{ fontSize: 18, transform: open ? "rotate(90deg)" : undefined, transition: "transform .15s" }}>
          chevron_right
        </span>
        <div className="flex-1">
          <div className="font-sans font-medium text-[14px] text-f-text">{title}</div>
          {subtitle && <div className="text-[12px] text-f-text2 mt-0.5 leading-[1.4]">{subtitle}</div>}
        </div>
        {accent === "warn" && (
          <span className="f-pill f-pill-warn">Manual</span>
        )}
      </button>
      {open && (
        <div className="px-5 pb-5 pt-1 border-t border-f-border f-fade-up">
          {children}
        </div>
      )}
    </div>
  );
}

/* File picker. Retiene el File completo (no solo nombre/size) para que la
   capa /api lo pueda subir como multipart al back. Soporta estado "busy"
   para mostrar feedback mientras el back lo parsea. */
export function FileDrop({
  accept, file, onFile, hint, label = "Subir archivo", busy, busyLabel,
}: {
  accept?: string;
  file: File | null;
  onFile: (f: File | null) => void;
  hint?: ReactNode;
  label?: string;
  busy?: boolean;
  busyLabel?: string;
}) {
  const inputId = `file-${Math.random().toString(36).slice(2, 8)}`;
  return (
    <div>
      {file ? (
        <div className="f-card !p-3 flex items-center gap-3">
          <span
            className={`material-symbols-outlined ${busy ? "text-f-text2 animate-pulse" : "text-f-green-light"}`}
            style={{ fontSize: 20 }}
          >
            {busy ? "hourglass_top" : "description"}
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] text-f-text truncate">{file.name}</div>
            <div className="font-mono text-[10px] text-f-text3">
              {Math.round(file.size / 1024)} KB
              {busy && busyLabel ? ` · ${busyLabel}` : ""}
            </div>
          </div>
          {!busy && (
            <button className="f-btn-ghost text-f-red-light" onClick={() => onFile(null)} aria-label="Quitar">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
            </button>
          )}
        </div>
      ) : (
        <label htmlFor={inputId}
               className="block cursor-pointer rounded-lg border border-dashed border-f-border2 hover:border-f-green-light/60 transition-colors px-5 py-6 text-center bg-f-surface">
          <span className="material-symbols-outlined text-f-text2 block mx-auto mb-2" style={{ fontSize: 24 }}>upload_file</span>
          <div className="font-sans font-medium text-[14px] text-f-text">{label}</div>
          {hint && <div className="text-[12px] text-f-text2 mt-1 leading-[1.5]">{hint}</div>}
          <input
            id={inputId}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
              e.target.value = ""; // permitir re-subir mismo archivo
            }}
          />
        </label>
      )}
    </div>
  );
}

/* Banner de error para los step pages */
export function ErrorBanner({ msg }: { msg: string }) {
  return (
    <div className="f-card-warn">
      <p className="text-[13px] text-f-red-light">{msg}</p>
    </div>
  );
}

/* Inline field error */
export function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-[12px] text-f-red-light">{msg}</p>;
}

/* Brand wordmark */
export function Wordmark({ size = 18 }: { size?: number }) {
  return (
    <span
      className="font-sans font-bold uppercase text-f-text"
      style={{ fontSize: size, letterSpacing: "0.18em" }}
    >
      FORJA
    </span>
  );
}
