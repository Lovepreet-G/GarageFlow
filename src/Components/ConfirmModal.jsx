import { useEffect } from "react"

export default function ConfirmModal({ title = "Confirm", message, onCancel, onConfirm }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onCancel && onCancel()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onCancel])

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/40"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel && onCancel()
      }}
    >
      <div className="bg-white rounded-xl p-6 w-full max-w-md" onMouseDown={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold">{title}</h3>
        <p className="mt-2 text-sm text-slate-600">{message}</p>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onCancel} className="px-4 py-2 rounded-xl border">
            Cancel
          </button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-xl bg-rose-600 text-white">
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}
