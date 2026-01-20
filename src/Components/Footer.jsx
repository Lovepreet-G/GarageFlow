function Footer() {
  return (
    <footer className="border-t bg-white py-3 px-6 text-xs text-slate-500">
      <div className="flex items-center justify-between">
        <span>© {new Date().getFullYear()} GarageFlow</span>
        <span>Invoice Management System</span>
      </div>
    </footer>
  )
}

export default Footer
