function Footer() {
  return (
    <footer className="bg-white border-t">
      <div className="px-4 sm:px-6 py-3 text-xs text-slate-500 lg:pl-64">
        <div className="flex items-center justify-between">
          <span>© {new Date().getFullYear()} GARAGEFLOW</span>
          <span className="hidden sm:inline">PRECISION MANAGEMENT SYSTEMS</span>
        </div>
      </div>
    </footer>
  )
}

export default Footer
